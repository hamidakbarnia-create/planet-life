"""Phase 2C.1 semantic validation corpus runner."""

from __future__ import annotations

import json

from packages.decision_engine.dimension_mapping import DIMENSION_KEYS
from packages.decision_engine.tests.fixtures.generate_semantic_validation_matrix import (
    MATRIX_PATH,
    evaluate_corpus,
    write_matrix,
)
from packages.decision_engine.tests.fixtures.semantic_validation_corpus import (
    CORPUS,
    materialize_dimensions,
)


def test_corpus_size_and_unique_ids() -> None:
    assert 24 <= len(CORPUS) <= 32
    assert len({case.case_id for case in CORPUS}) == len(CORPUS)
    families = {case.family for case in CORPUS}
    for required in (
        "high_leverage",
        "action",
        "selective",
        "review",
        "mixed",
        "defensive",
        "recovery",
        "insufficient",
        "boundary",
        "context",
    ):
        assert required in families


def test_corpus_never_uses_score_to_set_expectation() -> None:
    for case in CORPUS:
        assert "executive.score" not in case.rationale.lower() or "must not" in case.rationale.lower()
        assert "expected_score" not in case.model_dump()


def test_insufficient_display_50_is_not_scored_neutral() -> None:
    case = next(c for c in CORPUS if c.case_id == "IN04_insufficient_50_not_neutral_veto")
    dims = materialize_dimensions(case.dimensions)
    assert dims.clarity.status == "insufficient"
    assert dims.clarity.value == 50
    assert dims.clarity.evidence_strength is None
    assert dims.stability.status == "insufficient"


def test_corpus_structural_fields_and_class_with_documented_gaps() -> None:
    rows = evaluate_corpus()
    by_id = {row["case_id"]: row for row in rows}
    for case in CORPUS:
        row = by_id[case.case_id]
        assert row["coverage"] >= 0.0
        assert row["coverage"] <= 1.0
        assert "confidence" not in row
        if case.classifier_divergence:
            assert row["pass"] is False
            assert row["actual"] != case.expected_class or (
                row["conflict"] != case.expected_same_dimension_conflict
            )
        else:
            assert row["actual"] == case.expected_class
            assert row["pass"] is True
        assert row["split"] == case.expected_split_signal
        assert row["vetoes"] == list(case.expected_veto_dimensions)
        if case.case_id != "MX04_cooperation_conflict_ignored":
            assert row["conflict"] == case.expected_same_dimension_conflict


def test_cross_dimension_split_is_not_mixed() -> None:
    row = next(
        r
        for r in evaluate_corpus()
        if r["case_id"] == "MX03_cross_dimension_is_not_mixed"
    )
    assert row["actual"] == "selective"
    assert row["split"] is True
    assert row["conflict"] is False
    assert row["pass"] is True


def test_context_twins_differ_via_existing_contribution() -> None:
    rows = {row["case_id"]: row for row in evaluate_corpus()}
    launch = rows["CTX01_business_launch_same_chart"]
    rest = rows["CTX02_rest_recovery_same_chart"]
    assert launch["actual"] != rest["actual"]
    assert launch["actual"] == "selective"
    assert rest["actual"] == "review"
    assert launch["split"] is True
    assert rest["split"] is False


def test_low_score_input_does_not_force_recovery() -> None:
    row = next(
        r
        for r in evaluate_corpus()
        if r["case_id"] == "RC02_low_executive_score_does_not_create_recovery"
    )
    assert row["executive_score_input"] == 10
    assert row["actual"] == "action"
    assert row["actual"] != "recovery"


def test_documented_gaps_are_exactly_the_known_set() -> None:
    expected = {
        "HL03_one_drive_80_other_mid_50",
        "AC03_lukewarm_criticals_counted_as_coverage",
        "RV03_split_without_strong_drive",
        "MX02_critical_conflict_preempts_split",
        "MX04_cooperation_conflict_ignored",
    }
    actual = {case.case_id for case in CORPUS if case.classifier_divergence}
    assert actual == expected


def test_matrix_fixture_matches_live_corpus() -> None:
    live = evaluate_corpus()
    assert MATRIX_PATH.is_file()
    frozen = json.loads(MATRIX_PATH.read_text())
    assert frozen["corpus_size"] == len(live)
    assert frozen["rows"] == live
    assert frozen["semantic_status"] == "experimental_shadow"
    header = (
        "case_id | expected | actual | coverage | split | conflict | vetoes | pass"
    )
    assert all(key in live[0] for key in ("case_id", "expected", "actual", "coverage"))
    assert header.split(" | ")[0] == "case_id"


def test_generate_matrix_roundtrip(tmp_path) -> None:
    path = write_matrix(tmp_path / "matrix.json")
    payload = json.loads(path.read_text())
    assert payload["corpus_size"] == len(CORPUS)
    assert payload["fail_count"] == sum(1 for row in payload["rows"] if not row["pass"])


def test_corpus_dimensions_cover_all_keys() -> None:
    for case in CORPUS:
        if case.source == "live":
            continue
        assert set(case.dimensions) == set(DIMENSION_KEYS)
