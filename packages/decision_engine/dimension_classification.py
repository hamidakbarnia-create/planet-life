"""Phase 2C — dimension-driven day classification (experimental shadow).

Compares DecisionDimensions against Phase 2A score-band classification.
Not canonical. No commands. Does not read executive.score to choose a class.

Unknown (status=insufficient) is excluded from every threshold decision.
Pressure is inverse: high pressure is cautionary, never supportive.

``classification_coverage`` is 0..1 coverage metadata only
(``0.6 * scored/7 + 0.4 * critical/4``). It is not confidence, certainty,
probability, or semantic strength.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from packages.decision_engine.day_classification import DayClass
from packages.decision_engine.dimension_mapping import DIMENSION_KEYS
from packages.decision_engine.dimensions import DecisionDimension, DecisionDimensions

DimensionDayClass = Literal[
    "high_leverage",
    "action",
    "build",
    "selective",
    "review",
    "defensive",
    "recovery",
    "mixed",
    "insufficient",
]

CLASSIFIER_VERSION = "dimension_class.v1-shadow"
SEMANTIC_STATUS = "experimental_shadow"

# Align with astro_engine.scoring._rating Favorable / Mixed floors.
# Applied only to status=scored dimensions.
HIGH_THRESHOLD = 65
LOW_THRESHOLD = 45
HIGH_LEVERAGE_VALUE = 80

DRIVE_KEYS: tuple[str, ...] = ("opportunity", "momentum")
CRITICAL_FORWARD_KEYS: tuple[str, ...] = (
    "clarity",
    "stability",
    "reversibility_safety",
)
CRITICAL_KEYS: tuple[str, ...] = CRITICAL_FORWARD_KEYS + ("pressure",)
FORWARD_KEYS: tuple[str, ...] = (
    "opportunity",
    "momentum",
    "clarity",
    "stability",
    "cooperation",
    "reversibility_safety",
)
CONFLICT_KEYS: tuple[str, ...] = DRIVE_KEYS + CRITICAL_KEYS

MIN_SCORED_FOR_HIGH_LEVERAGE = 4
MIN_CRITICAL_FOR_HIGH_LEVERAGE = 2


class DimensionDayClassification(BaseModel):
    """Shadow class from dimensions + comparison to Phase 2A. No commands."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    day_class: DimensionDayClass
    semantic_status: str = SEMANTIC_STATUS
    classifier_version: str = CLASSIFIER_VERSION
    rule_id: str
    executive_score: int
    phase2a_class: DayClass
    split_signal: bool
    same_dimension_conflict: bool
    scored_dimension_count: int = Field(ge=0, le=7)
    insufficient_dimension_count: int = Field(ge=0, le=7)
    critical_dimensions_available: int = Field(ge=0, le=4)
    classification_coverage: float = Field(
        ge=0.0,
        le=1.0,
        description=(
            "0..1 coverage metadata only: scored/critical dimension availability. "
            "Not confidence, certainty, probability, or semantic strength."
        ),
    )
    dimensions_used: tuple[str, ...] = ()
    veto_dimension_ids: tuple[str, ...] = ()
    conflicted_dimension_ids: tuple[str, ...] = ()
    high_dimension_ids: tuple[str, ...] = ()
    low_dimension_ids: tuple[str, ...] = ()
    disagreement: bool
    disagreement_reason: tuple[str, ...] = ()


def classify_from_dimensions(
    dimensions: DecisionDimensions,
    *,
    phase2a_class: DayClass,
    executive_score: int,
) -> DimensionDayClassification:
    """Deterministic shadow class. Does not use executive.score as input."""
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
    drive_strong = _drive_strong(scored, high_ids, low_ids)
    split_signal = drive_high and bool(veto_ids)
    same_dimension_conflict = bool(local_conflict_ids)

    day_class, rule_id = _resolve_class(
        scored=scored,
        high_ids=high_ids,
        low_ids=low_ids,
        veto_ids=veto_ids,
        local_conflict=same_dimension_conflict,
        split_signal=split_signal,
        drive_high=drive_high,
        drive_strong=drive_strong,
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
        classifier_version=CLASSIFIER_VERSION,
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


def dimension_classification_payload(
    result: DimensionDayClassification,
) -> dict:
    """JSON-ready shadow comparison. Does not replace Phase 2A day_class."""
    return result.model_dump(mode="json")


def _scored_map(dimensions: DecisionDimensions) -> dict[str, DecisionDimension]:
    out: dict[str, DecisionDimension] = {}
    for key in DIMENSION_KEYS:
        dim: DecisionDimension = getattr(dimensions, key)
        if dim.status == "scored":
            out[key] = dim
    return out


def _is_high(key: str, dim: DecisionDimension) -> bool:
    if key == "pressure":
        return False
    return dim.value >= HIGH_THRESHOLD


def _is_low(key: str, dim: DecisionDimension) -> bool:
    if key == "pressure":
        return dim.value >= HIGH_THRESHOLD
    return dim.value <= LOW_THRESHOLD


def _is_veto(key: str, dim: DecisionDimension | None) -> bool:
    if dim is None:
        return False
    if key == "pressure":
        return dim.value >= HIGH_THRESHOLD
    if key in CRITICAL_FORWARD_KEYS:
        return dim.value <= LOW_THRESHOLD
    return False


def _drive_strong(
    scored: dict[str, DecisionDimension],
    high_ids: tuple[str, ...],
    low_ids: tuple[str, ...],
) -> bool:
    if any(key not in scored for key in DRIVE_KEYS):
        return False
    if any(key in low_ids for key in DRIVE_KEYS):
        return False
    opp = "opportunity" in high_ids
    mom = "momentum" in high_ids
    if opp and mom:
        return True
    for key in DRIVE_KEYS:
        dim = scored[key]
        if dim.value >= HIGH_LEVERAGE_VALUE:
            return True
    return False


def _resolve_class(
    *,
    scored: dict[str, DecisionDimension],
    high_ids: tuple[str, ...],
    low_ids: tuple[str, ...],
    veto_ids: tuple[str, ...],
    local_conflict: bool,
    split_signal: bool,
    drive_high: bool,
    drive_strong: bool,
    uneven_drive: bool,
    critical_available: int,
) -> tuple[DimensionDayClass, str]:
    if not scored:
        return "insufficient", "insufficient_no_scored_dimensions"

    if local_conflict:
        return "mixed", "same_dimension_conflict"

    if len(scored) == 1 and not veto_ids:
        return "insufficient", "insufficient_opportunity_or_sparse"

    if split_signal:
        if drive_strong:
            return "selective", "split_signal_selective"
        return "review", "split_signal_review"

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

    if (
        drive_strong
        and not veto_ids
        and len(scored) >= MIN_SCORED_FOR_HIGH_LEVERAGE
        and critical_available >= MIN_CRITICAL_FOR_HIGH_LEVERAGE
    ):
        return "high_leverage", "high_leverage_covered_no_veto"

    if drive_high and not veto_ids:
        return "action", "action_drive_high_no_veto"

    supportive = tuple(key for key in high_ids if key in FORWARD_KEYS)
    if (supportive or pressure_relief) and not veto_ids:
        return "build", "build_moderate_support"

    if not high_ids and not low_ids:
        if len(scored) <= 2:
            return "insufficient", "insufficient_unpolarized_sparse"
        return "review", "review_indeterminate"

    return "review", "review_fallback"


def _disagreement_reasons(
    *,
    disagreement: bool,
    phase2a_class: DayClass,
    phase2c_class: DimensionDayClass,
    split_signal: bool,
    same_dimension_conflict: bool,
    veto_ids: tuple[str, ...],
    critical_available: int,
    rule_id: str,
) -> tuple[str, ...]:
    if not disagreement:
        return ()
    reasons: list[str] = [f"label_{phase2a_class}_vs_{phase2c_class}"]
    if split_signal:
        reasons.append("split_signal")
    if same_dimension_conflict:
        reasons.append("same_dimension_conflict")
    if veto_ids:
        reasons.append("critical_veto")
    if (
        phase2a_class in {"strongly_supportive", "supportive"}
        and critical_available == 0
    ):
        reasons.append("phase2a_supportive_without_critical_coverage")
    if phase2a_class == "strongly_supportive" and phase2c_class == "action":
        reasons.append("inadequate_coverage_for_high_leverage")
    if (
        phase2a_class == "mixed"
        and not same_dimension_conflict
        and not split_signal
    ):
        reasons.append("phase2a_score_band_mixed_without_conflict")
    if phase2c_class == "insufficient":
        reasons.append("coverage_insufficient")
    reasons.append(rule_id)
    return tuple(dict.fromkeys(reasons))


__all__ = [
    "CLASSIFIER_VERSION",
    "CRITICAL_KEYS",
    "DimensionDayClass",
    "DimensionDayClassification",
    "HIGH_THRESHOLD",
    "LOW_THRESHOLD",
    "SEMANTIC_STATUS",
    "classify_from_dimensions",
    "dimension_classification_payload",
]
