"""Phase 2C.3 proposed vs v1/v2 corpus comparison."""

from __future__ import annotations

import json

from packages.decision_engine.dimension_classification import CLASSIFIER_VERSION
from packages.decision_engine.dimension_classification_candidate import (
    CANDIDATE_CLASSIFIER_VERSION,
)
from packages.decision_engine.dimension_classification_proposed import (
    ACTIVE_SHADOW_CLASSIFIER_VERSION,
    PROPOSED_CLASSIFIER_VERSION,
)
from packages.decision_engine.tests.fixtures.generate_semantic_validation_proposed_matrix import (
    FOCUS_CASE_IDS,
    MATRIX_PATH,
    evaluate_proposed_corpus,
    write_proposed_matrix,
)
from packages.decision_engine.tests.fixtures.semantic_validation_corpus import (
    BUILD_CORPUS,
    CORPUS,
    EXTENDED_CORPUS,
)


def test_extended_corpus_still_32_plus_4_build() -> None:
    assert len(CORPUS) == 32
    assert len(BUILD_CORPUS) == 4
    assert len(EXTENDED_CORPUS) == 36


def test_snapshots_use_v3_shadow_not_v1_or_v2() -> None:
    from packages.decision_engine.tests.fixtures.calendar_score_cases import (
        case_strongly_supportive,
    )
    from packages.decision_engine.tests.unit.test_dimension_classification import (
        _snapshot_for,
    )

    _, snapshot = _snapshot_for(case_strongly_supportive())
    version = snapshot.dimension_classification.classifier_version
    assert version == ACTIVE_SHADOW_CLASSIFIER_VERSION
    assert version == PROPOSED_CLASSIFIER_VERSION
    assert version != CLASSIFIER_VERSION
    assert version != CANDIDATE_CLASSIFIER_VERSION


def test_focus_case_outcomes() -> None:
    rows = {row["case_id"]: row for row in evaluate_proposed_corpus()}
    assert set(FOCUS_CASE_IDS) <= set(rows)

    assert rows["HL01_covered_strong_drive"]["phase2c_v3"] == "high_leverage"
    assert rows["HL02_drive_exactly_65"]["phase2c_v3"] == "high_leverage"
    assert rows["HL03_one_drive_80_other_mid_50"]["phase2c_v3"] == "action"
    assert rows["AC03_lukewarm_criticals_counted_as_coverage"]["phase2c_v3"] == "action"
    assert rows["RV03_split_without_strong_drive"]["phase2c_v3"] == "selective"
    mx02 = rows["MX02_critical_conflict_preempts_split"]
    assert mx02["phase2c_v3"] == "selective"
    assert mx02["conflict"] is True
    mx04 = rows["MX04_cooperation_conflict_ignored"]
    assert mx04["phase2c_v3"] == "action"
    assert mx04["v3_pass"] is False
    assert "cooperation" in mx04["conflicted_dimension_ids"]
    assert rows["BD01_clarity_46_not_veto"]["phase2c_v3"] == "high_leverage"
    assert rows["BD01_clarity_46_not_veto"]["v3_pass"] is True
    assert rows["BD02_pressure_64_not_veto"]["phase2c_v3"] == "high_leverage"
    assert rows["BD03_drive_80_vs_79_with_mid_momentum"]["phase2c_v3"] == "action"
    assert rows["BUILD01_constructive_drive_covered_support"]["phase2c_v3"] == "build"
    assert rows["BUILD02_drive_64_just_below_action"]["phase2c_v3"] == "build"
    assert rows["BUILD03_sparse_cooperation_high_is_not_build"]["phase2c_v3"] == "review"
    assert rows["BUILD04_covered_mids_without_support_high"]["phase2c_v3"] == "review"


def test_v3_disagreements_are_exactly_mx04() -> None:
    rows = evaluate_proposed_corpus()
    fails = {row["case_id"] for row in rows if not row["v3_pass"]}
    assert fails == {"MX04_cooperation_conflict_ignored"}


def test_v2_to_v3_class_change_is_only_bd01() -> None:
    changed = [
        row["case_id"]
        for row in evaluate_proposed_corpus()
        if row["phase2c_v2"] != row["phase2c_v3"]
    ]
    assert changed == ["BD01_clarity_46_not_veto"]


def test_v3_does_not_use_score_for_class() -> None:
    row = next(
        r
        for r in evaluate_proposed_corpus()
        if r["case_id"] == "RC02_low_executive_score_does_not_create_recovery"
    )
    assert row["executive_score_input"] == 10
    assert row["phase2c_v3"] == "action"


def test_proposed_matrix_fixture_matches_live(tmp_path) -> None:
    live = evaluate_proposed_corpus()
    path = write_proposed_matrix(tmp_path / "proposed_matrix.json")
    payload = json.loads(path.read_text())
    assert payload["rows"] == live
    assert payload["v3_classifier_version"] == PROPOSED_CLASSIFIER_VERSION
    frozen = json.loads(MATRIX_PATH.read_text())
    assert frozen["rows"] == live
    assert payload["v3_pass_count_original_32"] == 31
    assert payload["v3_pass_count_extended"] == 35
