"""Day Intelligence carrier for Calendar Decision Intelligence Phase 0/1.

Holds the existing 0–100 score plus normalized DecisionEvidence.
Does not classify days, emit commands, or compute domain scores.
"""

from __future__ import annotations

from typing import Any, Mapping

from pydantic import BaseModel, ConfigDict, Field, model_validator

from packages.astro_engine.scoring_context import ScoringContext
from packages.decision_engine.evidence import (
    DecisionEvidence,
    dominant_evaluated_aspects,
    normalize_score_evidence,
)


class DayIntelligenceSnapshot(BaseModel):
    """Passthrough score + normalized evidence for one evaluated day.

    ``final_score`` is copied from the astrology engine. Normalization must
    never recompute or replace it.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    action_type: str
    final_score: int
    component_breakdown: dict[str, Any] = Field(default_factory=dict)
    evidence: tuple[DecisionEvidence, ...] = ()
    dominant_aspects: tuple[dict[str, Any], ...] = ()
    reasoning: dict[str, Any] | None = None
    scoring_context: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _score_matches_breakdown_when_present(self) -> DayIntelligenceSnapshot:
        breakdown_score = self.component_breakdown.get("final_score")
        if breakdown_score is not None and int(breakdown_score) != self.final_score:
            raise ValueError(
                "DayIntelligenceSnapshot.final_score must equal "
                "component_breakdown.final_score"
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
    return DayIntelligenceSnapshot(
        action_type=resolved_activity,
        final_score=final_score,
        component_breakdown=breakdown,
        evidence=evidence,
        dominant_aspects=dominant_evaluated_aspects(score_result),
        reasoning=resolved_reasoning,
        scoring_context=dict(technical.get("scoring_context") or {}),
    )


__all__ = [
    "DayIntelligenceSnapshot",
    "build_day_intelligence_snapshot",
]
