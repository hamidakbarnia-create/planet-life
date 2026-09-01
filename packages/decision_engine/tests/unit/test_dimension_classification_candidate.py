"""Phase 2C.2 candidate classifier unit tests. Does not replace v1-shadow."""

from __future__ import annotations

import inspect

from packages.decision_engine.dimension_classification import (
    CLASSIFIER_VERSION,
    HIGH_THRESHOLD,
    LOW_THRESHOLD,
    classify_from_dimensions,
    _resolve_class,
)
from packages.decision_engine.dimension_classification_candidate import (
    CANDIDATE_CLASSIFIER_VERSION,
    CRITICAL_QUALITY_FLOOR,
    classify_from_dimensions_candidate,
    _resolve_class_candidate,
)
from packages.decision_engine.tests.unit.test_dimension_classification import _dims


def _current(dims, *, score: int = 50):
    return classify_from_dimensions(
        dims,
        phase2a_class="mixed",
        executive_score=score,
    )


def _candidate(dims, *, score: int = 50):
    return classify_from_dimensions_candidate(
        dims,
        phase2a_class="mixed",
        executive_score=score,
    )


def test_candidate_is_a_separate_version() -> None:
    assert CLASSIFIER_VERSION == "dimension_class.v1-shadow"
    assert CANDIDATE_CLASSIFIER_VERSION == "dimension_class.v2-candidate-shadow"
    assert CLASSIFIER_VERSION != CANDIDATE_CLASSIFIER_VERSION


def test_global_floors_unchanged() -> None:
    assert HIGH_THRESHOLD == 65
    assert LOW_THRESHOLD == 45
    assert CRITICAL_QUALITY_FLOOR == 55
    assert CRITICAL_QUALITY_FLOOR != HIGH_THRESHOLD
    assert CRITICAL_QUALITY_FLOOR != LOW_THRESHOLD


def test_candidate_does_not_read_executive_score() -> None:
    dims = _dims(opportunity=70, momentum=66, cooperation=58)
    first = _candidate(dims, score=100)
    second = _candidate(dims, score=1)
    assert first.day_class == second.day_class
    assert "executive_score" not in inspect.getsource(_resolve_class_candidate)


def test_current_resolve_still_mixed_before_split() -> None:
    source = inspect.getsource(_resolve_class)
    assert "if local_conflict:" in source
    assert source.index("if local_conflict:") < source.index("if split_signal:")


def test_candidate_split_before_mixed() -> None:
    source = inspect.getsource(_resolve_class_candidate)
    assert source.index("if split_signal:") < source.index("if local_conflict:")


def test_single_drive_80_is_action_not_high_leverage() -> None:
    dims = _dims(opportunity=80, momentum=50, clarity=70, stability=70)
    assert _current(dims).day_class == "high_leverage"
    result = _candidate(dims)
    assert result.day_class == "action"
    assert result.classifier_version == CANDIDATE_CLASSIFIER_VERSION


def test_both_drive_65_with_quality_criticals_is_high_leverage() -> None:
    dims = _dims(opportunity=65, momentum=65, clarity=66, stability=66)
    assert _candidate(dims).day_class == "high_leverage"
    assert _current(dims).day_class == "high_leverage"


def test_lukewarm_criticals_do_not_qualify_high_leverage() -> None:
    dims = _dims(opportunity=80, momentum=80, clarity=46, stability=46)
    assert _current(dims).day_class == "high_leverage"
    assert _candidate(dims).day_class == "action"


def test_one_quality_and_one_lukewarm_critical_is_not_high_leverage() -> None:
    dims = _dims(opportunity=80, momentum=80, clarity=46, stability=70)
    assert _current(dims).day_class == "high_leverage"
    assert _candidate(dims).day_class == "action"


def test_weak_split_is_selective() -> None:
    dims = _dims(opportunity=65, momentum=50, clarity=40)
    assert _current(dims).day_class == "review"
    result = _candidate(dims)
    assert result.day_class == "selective"
    assert result.split_signal is True


def test_split_with_conflict_is_selective_not_mixed() -> None:
    from packages.decision_engine.tests.unit.test_dimension_classification import _dim

    dims = _dims(
        opportunity=80,
        momentum=80,
        clarity=_dim(40, conflicted=True),
        cooperation=70,
    )
    assert _current(dims).day_class == "mixed"
    result = _candidate(dims)
    assert result.day_class == "selective"
    assert result.split_signal is True
    assert result.same_dimension_conflict is True
    assert "clarity" in result.conflicted_dimension_ids


def test_cooperation_conflict_does_not_preempt_and_stays_in_metadata() -> None:
    from packages.decision_engine.tests.unit.test_dimension_classification import _dim

    dims = _dims(
        opportunity=70,
        momentum=70,
        cooperation=_dim(55, conflicted=True),
    )
    current = _current(dims)
    candidate = _candidate(dims)
    assert current.day_class == "action"
    assert candidate.day_class == "action"
    assert candidate.same_dimension_conflict is False
    assert "cooperation" in candidate.conflicted_dimension_ids


def test_cross_dimension_tension_is_not_mixed() -> None:
    dims = _dims(opportunity=80, momentum=80, stability=37, cooperation=70)
    result = _candidate(dims)
    assert result.day_class == "selective"
    assert result.same_dimension_conflict is False


def test_build_constructive_covered_support() -> None:
    dims = _dims(
        opportunity=58,
        momentum=60,
        clarity=68,
        stability=66,
        cooperation=70,
    )
    result = _candidate(dims)
    assert result.day_class == "build"
    assert result.split_signal is False


def test_sparse_support_is_not_build() -> None:
    dims = _dims(opportunity=58, momentum=60, cooperation=70)
    assert _current(dims).day_class == "build"
    assert _candidate(dims).day_class == "review"


def test_drive_high_covered_is_action_not_build() -> None:
    dims = _dims(opportunity=70, momentum=66, clarity=68, stability=66)
    result = _candidate(dims)
    assert result.day_class == "high_leverage"
    assert result.day_class != "build"
    assert result.day_class != "action"
