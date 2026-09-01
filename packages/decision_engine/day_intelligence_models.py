"""Day Intelligence carrier for Calendar Decision Intelligence.

Phase 0/1: passthrough score + normalized DecisionEvidence.
Phase 2A: PROVISIONAL SHADOW classification (regression/reference only).
Phase 2B: DecisionDimensions in parallel from evidence (no commands).
Phase 2C: dimension-driven shadow class + comparison (not canonical).
"""

from __future__ import annotations

from typing import Any, Mapping

from pydantic import BaseModel, ConfigDict, Field, model_validator

from packages.astro_engine.scoring_context import ScoringContext
from packages.decision_engine.day_classification import (
    DayClassification,
    classify_day,
)
from packages.decision_engine.dimension_classification import (
    DimensionDayClassification,
    classify_from_dimensions,
    dimension_classification_payload,
)
from packages.decision_engine.dimensions import (
    DecisionDimensions,
    compute_decision_dimensions,
    dimensions_payload,
)
from packages.decision_engine.evidence import (
    DecisionEvidence,
    dominant_evaluated_aspects,
    normalize_score_evidence,
)


class DayIntelligenceSnapshot(BaseModel):
    """Passthrough score + normalized evidence + shadow layers.

    ``final_score`` is copied from the astrology engine. Classification and
    dimensions must never recompute or replace it. No decision command.
    Phase 2A ``classification`` is provisional shadow logic. Phase 2B
    ``dimensions`` are an experimental_shadow parallel layer — not canonical.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    action_type: str
    final_score: int
    component_breakdown: dict[str, Any] = Field(default_factory=dict)
    evidence: tuple[DecisionEvidence, ...] = ()
    dominant_aspects: tuple[dict[str, Any], ...] = ()
    reasoning: dict[str, Any] | None = None
    scoring_context: dict[str, Any] = Field(default_factory=dict)
    classification: DayClassification
    dimensions: DecisionDimensions
    dimension_classification: DimensionDayClassification

    @model_validator(mode="after")
    def _score_is_passthrough(self) -> DayIntelligenceSnapshot:
        breakdown_score = self.component_breakdown.get("final_score")
        if breakdown_score is not None and int(breakdown_score) != self.final_score:
            raise ValueError(
                "DayIntelligenceSnapshot.final_score must equal "
                "component_breakdown.final_score"
            )
        if self.classification.score != self.final_score:
            raise ValueError(
                "DayClassification.score must equal "
                "DayIntelligenceSnapshot.final_score"
            )
        return self


def build_day_intelligence_snapshot(
    score_result: Mapping[str, Any],
    *,
    natal: Mapping[str, Any] | None = None,
    transit: Mapping[str, Any] | None = None,
    activity_type: str | None = None,
    reasoning: Mapping[str, Any] | None = None,
    scoring_context: ScoringContext | None = None,
) -> DayIntelligenceSnapshot:
    """Adapt an existing score payload. Does not alter the engine score."""
    executive = score_result.get("executive") or {}
    strategic = score_result.get("strategic") or {}
    technical = score_result.get("technical") or {}
    breakdown = dict(strategic.get("component_breakdown") or {})
    final_score = int(executive.get("score", breakdown.get("final_score", 0)))
    resolved_activity = str(
        activity_type or technical.get("activity_type") or ""
    )
    resolved_reasoning = (
        dict(reasoning)
        if isinstance(reasoning, Mapping)
        else (
            dict(score_result["reasoning"])
            if isinstance(score_result.get("reasoning"), Mapping)
            else None
        )
    )
    evidence = normalize_score_evidence(
        score_result,
        natal=natal,
        transit=transit,
        activity_type=resolved_activity or None,
        reasoning=resolved_reasoning,
        scoring_context=scoring_context,
    )
    classification = classify_day(final_score=final_score, evidence=evidence)
    dimensions = compute_decision_dimensions(
        evidence,
        action_type=resolved_activity or None,
    )
    dimension_classification = classify_from_dimensions(
        dimensions,
        phase2a_class=classification.day_class,
        executive_score=final_score,
    )
    return DayIntelligenceSnapshot(
        action_type=resolved_activity,
        final_score=final_score,
        component_breakdown=breakdown,
        evidence=evidence,
        dominant_aspects=dominant_evaluated_aspects(score_result),
        reasoning=resolved_reasoning,
        scoring_context=dict(technical.get("scoring_context") or {}),
        classification=classification,
        dimensions=dimensions,
        dimension_classification=dimension_classification,
    )


def attach_calendar_day_intelligence(
    payload: Mapping[str, Any],
    *,
    natal: Mapping[str, Any] | None = None,
    transit: Mapping[str, Any] | None = None,
    activity_type: str | None = None,
    scoring_context: ScoringContext | None = None,
) -> dict[str, Any]:
    """Add ``day_intelligence`` without mutating executive.score."""
    snapshot = build_day_intelligence_snapshot(
        payload,
        natal=natal,
        transit=transit,
        activity_type=activity_type,
        scoring_context=scoring_context,
    )
    attached = dict(payload)
    attached["day_intelligence"] = day_intelligence_payload(snapshot)
    return attached


def day_intelligence_payload(snapshot: DayIntelligenceSnapshot) -> dict[str, Any]:
    """Compact Calendar-batch layer. Omits commands. Dimensions are additive."""
    return {
        "final_score": snapshot.final_score,
        "action_type": snapshot.action_type,
        "day_class": snapshot.classification.day_class,
        "conflict": snapshot.classification.conflict,
        "rating": snapshot.classification.rating,
        "material_supportive_count": (
            snapshot.classification.material_supportive_count
        ),
        "material_caution_count": snapshot.classification.material_caution_count,
        "basis": snapshot.classification.basis,
        "evidence": [item.model_dump() for item in snapshot.evidence],
        "dominant_aspects": list(snapshot.dominant_aspects),
        "scoring_context": snapshot.scoring_context,
        "dimensions": dimensions_payload(snapshot.dimensions),
        "dimension_classification": dimension_classification_payload(
            snapshot.dimension_classification
        ),
    }


__all__ = [
    "DayIntelligenceSnapshot",
    "attach_calendar_day_intelligence",
    "build_day_intelligence_snapshot",
    "day_intelligence_payload",
]
