"""Phase 2C.2 candidate vs current corpus comparison."""

from __future__ import annotations

import json

from packages.decision_engine.dimension_classification import CLASSIFIER_VERSION
from packages.decision_engine.dimension_classification_candidate import (
    CANDIDATE_CLASSIFIER_VERSION,
)
from packages.decision_engine.dimension_classification_proposed import (
    ACTIVE_SHADOW_CLASSIFIER_VERSION,
)
from packages.decision_engine.tests.fixtures.generate_semantic_validation_candidate_matrix import (
    FOCUS_CASE_IDS,
    MATRIX_PATH,
    evaluate_extended_corpus,
    write_candidate_matrix,
)
from packages.decision_engine.tests.fixtures.semantic_validation_corpus import (
    BUILD_CORPUS,
    CORPUS,
    EXTENDED_CORPUS,
)


def test_extended_corpus_keeps_original_32() -> None:
    assert len(CORPUS) == 32
    assert len(BUILD_CORPUS) == 4
    assert len(EXTENDED_CORPUS) == 36
    assert {case.case_id for case in BUILD_CORPUS}.isdisjoint(
        {case.case_id for case in CORPUS}
    )


def test_snapshots_use_active_v3_shadow_not_v1_or_v2() -> None:
    from packages.decision_engine.tests.fixtures.calendar_score_cases import (
        case_strongly_supportive,
    )
    from packages.decision_engine.tests.unit.test_dimension_classification import (
        _snapshot_for,
    )

    _, snapshot = _snapshot_for(case_strongly_supportive())
    version = snapshot.dimension_classification.classifier_version
    assert version == ACTIVE_SHADOW_CLASSIFIER_VERSION
    assert version != CLASSIFIER_VERSION
    assert version != CANDIDATE_CLASSIFIER_VERSION


def test_candidate_comparison_rows() -> None:
    rows = {row["case_id"]: row for row in evaluate_extended_corpus()}
    assert set(FOCUS_CASE_IDS) <= set(rows)

    hl03 = rows["HL03_one_drive_80_other_mid_50"]
    assert hl03["product_expected"] == "action"
    assert hl03["phase2c_current"] == "high_leverage"
    assert hl03["phase2c_candidate"] == "action"
    assert hl03["candidate_pass"] is True

    ac03 = rows["AC03_lukewarm_criticals_counted_as_coverage"]
    assert ac03["product_expected"] == "action"
    assert ac03["phase2c_current"] == "high_leverage"
    assert ac03["phase2c_candidate"] == "action"
    assert ac03["candidate_pass"] is True

    rv03 = rows["RV03_split_without_strong_drive"]
    assert rv03["product_expected"] == "selective"
    assert rv03["phase2c_current"] == "review"
    assert rv03["phase2c_candidate"] == "selective"
    assert rv03["candidate_pass"] is True

    mx02 = rows["MX02_critical_conflict_preempts_split"]
    assert mx02["product_expected"] == "selective"
    assert mx02["phase2c_current"] == "mixed"
    assert mx02["phase2c_candidate"] == "selective"
    assert mx02["conflict"] is True
    assert mx02["candidate_pass"] is True

    mx04 = rows["MX04_cooperation_conflict_ignored"]
    assert mx04["product_expected"] == "mixed"
    assert mx04["phase2c_current"] == "action"
    assert mx04["phase2c_candidate"] == "action"
    assert mx04["candidate_pass"] is False
    assert "cooperation" in mx04["conflicted_dimension_ids"]

    bd01 = rows["BD01_clarity_46_not_veto"]
    assert bd01["product_expected"] == "high_leverage"
    assert bd01["phase2c_current"] == "high_leverage"
    assert bd01["phase2c_candidate"] == "action"
    assert bd01["candidate_pass"] is False


def test_documented_candidate_disagreements_are_exactly_known() -> None:
    rows = evaluate_extended_corpus()
    fails = {row["case_id"] for row in rows if not row["candidate_pass"]}
    assert fails == {
        "MX04_cooperation_conflict_ignored",
        "BD01_clarity_46_not_veto",
    }


def test_build_cases_are_distinct_from_action_and_review_when_intended() -> None:
    rows = {row["case_id"]: row for row in evaluate_extended_corpus()}
    assert rows["BUILD01_constructive_drive_covered_support"]["phase2c_candidate"] == (
        "build"
    )
    assert rows["BUILD02_drive_64_just_below_action"]["phase2c_candidate"] == "build"
    assert rows["BUILD02_drive_64_just_below_action"]["phase2c_candidate"] != "action"
    assert rows["BUILD03_sparse_cooperation_high_is_not_build"]["phase2c_candidate"] == (
        "review"
    )
    assert rows["BUILD03_sparse_cooperation_high_is_not_build"]["phase2c_current"] == (
        "build"
    )
    assert rows["BUILD04_covered_mids_without_support_high"]["phase2c_candidate"] == (
        "review"
    )


def test_candidate_does_not_use_score_for_class() -> None:
    row = next(
        r
        for r in evaluate_extended_corpus()
        if r["case_id"] == "RC02_low_executive_score_does_not_create_recovery"
    )
    assert row["executive_score_input"] == 10
    assert row["phase2c_candidate"] == "action"
    assert row["phase2c_candidate"] != "recovery"


def test_candidate_matrix_fixture_matches_live(tmp_path) -> None:
    live = evaluate_extended_corpus()
    path = write_candidate_matrix(tmp_path / "candidate_matrix.json")
    payload = json.loads(path.read_text())
    assert payload["rows"] == live
    assert payload["candidate_classifier_version"] == CANDIDATE_CLASSIFIER_VERSION
    assert payload["current_classifier_version"] == CLASSIFIER_VERSION
    assert MATRIX_PATH.name == "semantic_validation_candidate_matrix.json"
    frozen = json.loads(MATRIX_PATH.read_text())
    assert frozen["rows"] == live
