"""Phase 2C.2 candidate classifier (experimental shadow).

Sits alongside ``dimension_class.v1-shadow``. Not wired into snapshots,
payloads, commands, or canonical semantics. Does not read executive.score.

Candidate deltas vs current 2C:
- high_leverage requires both drive dims HIGH (>=65), not a single >=80
- high_leverage requires at least two forward criticals at >=55 (quality)
- split (drive HIGH + veto) is always selective, including when a
  relevant dimension is ``conflicted``; conflict stays metadata
- mixed is only for material same-dimension conflict without a split
- cooperation is still omitted from conflict-preemption keys
- build is constructive drive below action, covered, with support HIGH

Cooperation conflict is preserved on ``conflicted_dimension_ids`` and may
become context-sensitive later for negotiation / networking / relationship
decision families. It does not preempt class in this candidate.
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
from packages.decision_engine.dimension_mapping import DIMENSION_KEYS
from packages.decision_engine.dimensions import DecisionDimension, DecisionDimensions

CANDIDATE_CLASSIFIER_VERSION = "dimension_class.v2-candidate-shadow"

# Quality floor for forward criticals used to qualify high_leverage.
# Not a global HIGH/LOW/80 change. Between LOW (45) and HIGH (65).
CRITICAL_QUALITY_FLOOR = 55


def classify_from_dimensions_candidate(
    dimensions: DecisionDimensions,
    *,
    phase2a_class: DayClass,
    executive_score: int,
) -> DimensionDayClassification:
    """Candidate shadow class. Does not use executive.score as input."""
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

    day_class, rule_id = _resolve_class_candidate(
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
        classifier_version=CANDIDATE_CLASSIFIER_VERSION,
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


def _quality_forward_criticals(
    scored: dict[str, DecisionDimension],
) -> tuple[str, ...]:
    return tuple(
        key
        for key in CRITICAL_FORWARD_KEYS
        if key in scored and scored[key].value >= CRITICAL_QUALITY_FLOOR
    )


def _both_drive_high(scored: dict[str, DecisionDimension]) -> bool:
    if any(key not in scored for key in DRIVE_KEYS):
        return False
    return all(scored[key].value >= HIGH_THRESHOLD for key in DRIVE_KEYS)


def _constructive_drive(
    scored: dict[str, DecisionDimension],
    high_ids: tuple[str, ...],
    low_ids: tuple[str, ...],
    drive_high: bool,
) -> bool:
    """Both drive dims scored, neither LOW, not yet ACTION (not drive HIGH)."""
    if any(key not in scored for key in DRIVE_KEYS):
        return False
    if any(key in low_ids for key in DRIVE_KEYS):
        return False
    if drive_high:
        return False
    if any(key in high_ids for key in DRIVE_KEYS):
        return False
    return True


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
    if len(_quality_forward_criticals(scored)) < MIN_CRITICAL_FOR_HIGH_LEVERAGE:
        return False
    pressure = scored.get("pressure")
    if pressure is not None and pressure.value >= HIGH_THRESHOLD:
        return False
    return True


def _build_ok(
    *,
    scored: dict[str, DecisionDimension],
    high_ids: tuple[str, ...],
    low_ids: tuple[str, ...],
    veto_ids: tuple[str, ...],
    drive_high: bool,
    critical_available: int,
) -> bool:
    if veto_ids or drive_high:
        return False
    if not _constructive_drive(scored, high_ids, low_ids, drive_high):
        return False
    if len(scored) < MIN_SCORED_FOR_HIGH_LEVERAGE:
        return False
    if critical_available < MIN_CRITICAL_FOR_HIGH_LEVERAGE:
        return False
    support_high = any(
        key in high_ids
        for key in ("clarity", "stability", "cooperation", "reversibility_safety")
    )
    return support_high


def _resolve_class_candidate(
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
        return "high_leverage", "high_leverage_both_drive_quality_criticals"

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


__all__ = [
    "CANDIDATE_CLASSIFIER_VERSION",
    "CRITICAL_QUALITY_FLOOR",
    "classify_from_dimensions_candidate",
]
