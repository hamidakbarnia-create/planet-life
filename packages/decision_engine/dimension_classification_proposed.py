"""Phase 2C.3/2C.4 v3 shadow classifier (experimental shadow).

v1 = original experimental shadow (``dimension_class.v1-shadow``), still
callable as a regression oracle.
v2 = candidate experiment (``dimension_class.v2-candidate-shadow``).
v3 = validated active experimental shadow (``dimension_class.v3-shadow``).

Wired into ``build_day_intelligence_snapshot`` as additive
``dimension_classification``. Not canonical. No commands. Does not read
executive.score to choose a class.

MX04: cooperation conflict is preserved on ``conflicted_dimension_ids``
but does not globally preempt classification. Future context-sensitive
synthesis may use it for negotiation, networking, relationships, and
hiring/team decisions.
"""

from __future__ import annotations

from packages.decision_engine.day_classification import DayClass
from packages.decision_engine.dimension_classification import (
    CONFLICT_KEYS,
    CRITICAL_FORWARD_KEYS,
    CRITICAL_KEYS,
    DRIVE_KEYS,
    FORWARD_KEYS,
    HIGH_THRESHOLD,
    LOW_THRESHOLD,
    MIN_CRITICAL_FOR_HIGH_LEVERAGE,
    MIN_SCORED_FOR_HIGH_LEVERAGE,
    SEMANTIC_STATUS,
    DimensionDayClass,
    DimensionDayClassification,
    _disagreement_reasons,
    _is_high,
    _is_low,
    _is_veto,
    _scored_map,
)
from packages.decision_engine.dimension_classification_candidate import (
    _both_drive_high,
    _build_ok,
)
from packages.decision_engine.dimension_mapping import DIMENSION_KEYS
from packages.decision_engine.dimensions import DecisionDimension, DecisionDimensions

ACTIVE_SHADOW_CLASSIFIER_VERSION = "dimension_class.v3-shadow"
PROPOSED_CLASSIFIER_VERSION = ACTIVE_SHADOW_CLASSIFIER_VERSION


def classify_from_dimensions_proposed(
    dimensions: DecisionDimensions,
    *,
    phase2a_class: DayClass,
    executive_score: int,
) -> DimensionDayClassification:
    """Proposed shadow class. Does not use executive.score as input."""
    scored = _scored_map(dimensions)
    dimensions_used = tuple(key for key in DIMENSION_KEYS if key in scored)
    insufficient_count = len(DIMENSION_KEYS) - len(scored)
    critical_available = sum(1 for key in CRITICAL_KEYS if key in scored)

    high_ids = tuple(
        key
        for key in DIMENSION_KEYS
        if key in scored and _is_high(key, scored[key])
    )
    low_ids = tuple(
        key
        for key in DIMENSION_KEYS
        if key in scored and _is_low(key, scored[key])
    )
    veto_ids = tuple(key for key in CRITICAL_KEYS if _is_veto(key, scored.get(key)))
    conflicted_ids = tuple(
        key for key in DIMENSION_KEYS if key in scored and scored[key].conflicted
    )
    local_conflict_ids = tuple(key for key in conflicted_ids if key in CONFLICT_KEYS)

    drive_ready = all(key in scored for key in DRIVE_KEYS)
    drive_high = (
        drive_ready
        and any(key in high_ids for key in DRIVE_KEYS)
        and not any(key in low_ids for key in DRIVE_KEYS)
    )
    uneven_drive = drive_ready and any(
        key in high_ids for key in DRIVE_KEYS
    ) and any(key in low_ids for key in DRIVE_KEYS)
    split_signal = drive_high and bool(veto_ids)
    same_dimension_conflict = bool(local_conflict_ids)

    day_class, rule_id = _resolve_class_proposed(
        scored=scored,
        high_ids=high_ids,
        low_ids=low_ids,
        veto_ids=veto_ids,
        local_conflict=same_dimension_conflict,
        split_signal=split_signal,
        drive_high=drive_high,
        uneven_drive=uneven_drive,
        critical_available=critical_available,
    )

    disagreement = day_class != phase2a_class
    reasons = _disagreement_reasons(
        disagreement=disagreement,
        phase2a_class=phase2a_class,
        phase2c_class=day_class,
        split_signal=split_signal,
        same_dimension_conflict=same_dimension_conflict,
        veto_ids=veto_ids,
        critical_available=critical_available,
        rule_id=rule_id,
    )
    coverage = round(
        (len(scored) / len(DIMENSION_KEYS)) * 0.6
        + (critical_available / len(CRITICAL_KEYS)) * 0.4,
        4,
    )
    return DimensionDayClassification(
        day_class=day_class,
        semantic_status=SEMANTIC_STATUS,
        classifier_version=ACTIVE_SHADOW_CLASSIFIER_VERSION,
        rule_id=rule_id,
        executive_score=executive_score,
        phase2a_class=phase2a_class,
        split_signal=split_signal,
        same_dimension_conflict=same_dimension_conflict,
        scored_dimension_count=len(scored),
        insufficient_dimension_count=insufficient_count,
        critical_dimensions_available=critical_available,
        classification_coverage=coverage,
        dimensions_used=dimensions_used,
        veto_dimension_ids=veto_ids,
        conflicted_dimension_ids=conflicted_ids,
        high_dimension_ids=high_ids,
        low_dimension_ids=low_ids,
        disagreement=disagreement,
        disagreement_reason=reasons,
    )


def _forward_critical_high(scored: dict[str, DecisionDimension]) -> bool:
    """Pressure is inverse and never counts as a supportive HIGH critical."""
    return any(
        key in scored and scored[key].value >= HIGH_THRESHOLD
        for key in CRITICAL_FORWARD_KEYS
    )


def _high_leverage_ok(
    scored: dict[str, DecisionDimension],
    veto_ids: tuple[str, ...],
    critical_available: int,
) -> bool:
    if veto_ids:
        return False
    if not _both_drive_high(scored):
        return False
    if critical_available < MIN_CRITICAL_FOR_HIGH_LEVERAGE:
        return False
    if len(scored) < MIN_SCORED_FOR_HIGH_LEVERAGE:
        return False
    if not _forward_critical_high(scored):
        return False
    pressure = scored.get("pressure")
    if pressure is not None and pressure.value >= HIGH_THRESHOLD:
        return False
    return True


def _resolve_class_proposed(
    *,
    scored: dict[str, DecisionDimension],
    high_ids: tuple[str, ...],
    low_ids: tuple[str, ...],
    veto_ids: tuple[str, ...],
    local_conflict: bool,
    split_signal: bool,
    drive_high: bool,
    uneven_drive: bool,
    critical_available: int,
) -> tuple[DimensionDayClass, str]:
    if not scored:
        return "insufficient", "insufficient_no_scored_dimensions"

    if split_signal:
        return "selective", "split_signal_selective"

    if local_conflict:
        return "mixed", "same_dimension_conflict"

    if len(scored) == 1 and not veto_ids:
        return "insufficient", "insufficient_opportunity_or_sparse"

    if uneven_drive:
        return "review", "review_uneven_drive"

    pressure_high = "pressure" in low_ids
    forward_low = tuple(key for key in low_ids if key in FORWARD_KEYS)
    pressure_relief = (
        "pressure" in scored and scored["pressure"].value <= LOW_THRESHOLD
    )
    stability_ok = "stability" in scored and "stability" not in low_ids

    if veto_ids and not drive_high:
        if pressure_high or len(forward_low) >= 2:
            return "defensive", "defensive_veto_without_drive"
        return "review", "review_veto_without_drive"

    if not drive_high and len(forward_low) >= 2:
        if pressure_relief and stability_ok:
            return "recovery", "recovery_low_drive_without_crush"
        return "defensive", "defensive_low_drive"

    if pressure_high and not drive_high:
        return "defensive", "defensive_high_pressure"

    if _high_leverage_ok(scored, veto_ids, critical_available):
        return "high_leverage", "high_leverage_both_drive_one_high_critical"

    if drive_high and not veto_ids:
        return "action", "action_drive_high_no_veto"

    if _build_ok(
        scored=scored,
        high_ids=high_ids,
        low_ids=low_ids,
        veto_ids=veto_ids,
        drive_high=drive_high,
        critical_available=critical_available,
    ):
        return "build", "build_constructive_drive_covered_support"

    if not high_ids and not low_ids:
        if len(scored) <= 2:
            return "insufficient", "insufficient_unpolarized_sparse"
        return "review", "review_indeterminate"

    return "review", "review_fallback"


classify_from_dimensions_v3 = classify_from_dimensions_proposed

__all__ = [
    "ACTIVE_SHADOW_CLASSIFIER_VERSION",
    "PROPOSED_CLASSIFIER_VERSION",
    "classify_from_dimensions_proposed",
    "classify_from_dimensions_v3",
]
