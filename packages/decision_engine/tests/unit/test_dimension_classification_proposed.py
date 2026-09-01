"""Phase 2C.3 proposed classifier unit tests. Does not replace v1 or v2."""

from __future__ import annotations

import inspect
from pathlib import Path

from packages.decision_engine.dimension_classification import (
    CLASSIFIER_VERSION,
    HIGH_THRESHOLD,
    LOW_THRESHOLD,
    classify_from_dimensions,
)
from packages.decision_engine.dimension_classification_candidate import (
    CANDIDATE_CLASSIFIER_VERSION,
    classify_from_dimensions_candidate,
)
from packages.decision_engine.dimension_classification_proposed import (
    ACTIVE_SHADOW_CLASSIFIER_VERSION,
    PROPOSED_CLASSIFIER_VERSION,
    classify_from_dimensions_proposed,
    _resolve_class_proposed,
)
from packages.decision_engine.tests.unit.test_dimension_classification import _dim, _dims

PROPOSED_PATH = Path(__file__).resolve().parents[2] / "dimension_classification_proposed.py"


def _v1(dims, *, score: int = 50):
    return classify_from_dimensions(
        dims, phase2a_class="mixed", executive_score=score
    )


def _v2(dims, *, score: int = 50):
    return classify_from_dimensions_candidate(
        dims, phase2a_class="mixed", executive_score=score
    )


def _v3(dims, *, score: int = 50):
    return classify_from_dimensions_proposed(
        dims, phase2a_class="mixed", executive_score=score
    )


def test_proposed_is_a_separate_version() -> None:
    assert CLASSIFIER_VERSION == "dimension_class.v1-shadow"
    assert CANDIDATE_CLASSIFIER_VERSION == "dimension_class.v2-candidate-shadow"
    assert PROPOSED_CLASSIFIER_VERSION == "dimension_class.v3-shadow"
    assert ACTIVE_SHADOW_CLASSIFIER_VERSION == "dimension_class.v3-shadow"
    assert len({CLASSIFIER_VERSION, CANDIDATE_CLASSIFIER_VERSION, PROPOSED_CLASSIFIER_VERSION}) == 3


def test_no_55_threshold_in_proposed_module() -> None:
    source = PROPOSED_PATH.read_text()
    assert "55" not in source
    assert "CRITICAL_QUALITY_FLOOR" not in source
    assert HIGH_THRESHOLD == 65
    assert LOW_THRESHOLD == 45


def test_proposed_does_not_read_executive_score() -> None:
    dims = _dims(opportunity=70, momentum=66, cooperation=58)
    assert _v3(dims, score=100).day_class == _v3(dims, score=1).day_class
    assert "executive_score" not in inspect.getsource(_resolve_class_proposed)


def test_hl03_single_drive_80_is_action() -> None:
    dims = _dims(opportunity=80, momentum=50, clarity=70, stability=70)
    assert _v1(dims).day_class == "high_leverage"
    assert _v2(dims).day_class == "action"
    result = _v3(dims)
    assert result.day_class == "action"
    assert result.classifier_version == PROPOSED_CLASSIFIER_VERSION


def test_ac03_lukewarm_criticals_are_action() -> None:
    dims = _dims(opportunity=80, momentum=80, clarity=46, stability=46)
    assert _v1(dims).day_class == "high_leverage"
    assert _v2(dims).day_class == "action"
    assert _v3(dims).day_class == "action"


def test_bd01_one_high_critical_and_one_non_veto_is_high_leverage() -> None:
    dims = _dims(opportunity=80, momentum=80, clarity=46, stability=70)
    assert _v1(dims).day_class == "high_leverage"
    assert _v2(dims).day_class == "action"
    assert _v3(dims).day_class == "high_leverage"


def test_pressure_high_does_not_count_as_supportive_critical() -> None:
    dims = _dims(opportunity=80, momentum=80, pressure=70, clarity=50)
    result = _v3(dims)
    assert result.day_class == "selective"
    assert "pressure" in result.veto_dimension_ids
    assert result.day_class != "high_leverage"


def test_pressure_mid_does_not_satisfy_high_critical() -> None:
    dims = _dims(opportunity=80, momentum=80, pressure=50, clarity=50)
    result = _v3(dims)
    assert result.day_class == "action"
    assert result.critical_dimensions_available == 2


def test_weak_split_and_conflicted_split() -> None:
    weak = _dims(opportunity=65, momentum=50, clarity=40)
    assert _v3(weak).day_class == "selective"
    conflicted = _dims(
        opportunity=80,
        momentum=80,
        clarity=_dim(40, conflicted=True),
        cooperation=70,
    )
    result = _v3(conflicted)
    assert result.day_class == "selective"
    assert result.same_dimension_conflict is True
    assert "clarity" in result.conflicted_dimension_ids


def test_cooperation_conflict_stays_metadata() -> None:
    dims = _dims(
        opportunity=70,
        momentum=70,
        cooperation=_dim(55, conflicted=True),
    )
    result = _v3(dims)
    assert result.day_class == "action"
    assert result.same_dimension_conflict is False
    assert "cooperation" in result.conflicted_dimension_ids


def test_v1_and_v2_oracles_remain_independently_callable() -> None:
    dims = _dims(opportunity=80, momentum=50, clarity=70, stability=70)
    v1 = classify_from_dimensions(dims, phase2a_class="mixed", executive_score=50)
    v2 = classify_from_dimensions_candidate(
        dims, phase2a_class="mixed", executive_score=50
    )
    v3 = classify_from_dimensions_proposed(
        dims, phase2a_class="mixed", executive_score=50
    )
    assert v1.classifier_version == "dimension_class.v1-shadow"
    assert v2.classifier_version == "dimension_class.v2-candidate-shadow"
    assert v3.classifier_version == "dimension_class.v3-shadow"
    assert v1.day_class == "high_leverage"
    assert v2.day_class == v3.day_class == "action"
    assert v1.semantic_status == v2.semantic_status == v3.semantic_status == (
        "experimental_shadow"
    )
    covered = _dims(
        opportunity=58,
        momentum=60,
        clarity=68,
        stability=66,
        cooperation=70,
    )
    sparse = _dims(opportunity=58, momentum=60, cooperation=70)
    assert _v2(covered).day_class == _v3(covered).day_class == "build"
    assert _v2(sparse).day_class == _v3(sparse).day_class == "review"


def test_v1_and_v2_oracles_remain_independently_callable() -> None:
    dims = _dims(opportunity=80, momentum=50, clarity=70, stability=70)
    v1 = classify_from_dimensions(dims, phase2a_class="mixed", executive_score=50)
    v2 = classify_from_dimensions_candidate(
        dims, phase2a_class="mixed", executive_score=50
    )
    v3 = classify_from_dimensions_proposed(
        dims, phase2a_class="mixed", executive_score=50
    )
    assert v1.classifier_version == "dimension_class.v1-shadow"
    assert v2.classifier_version == "dimension_class.v2-candidate-shadow"
    assert v3.classifier_version == "dimension_class.v3-shadow"
    assert v1.day_class == "high_leverage"
    assert v2.day_class == v3.day_class == "action"
    assert v1.semantic_status == v2.semantic_status == v3.semantic_status == (
        "experimental_shadow"
    )
