"""Phase 2A — deterministic day classification from normalized evidence.

Decision synthesis only. Does not emit commands, domain scores, or LLM text.
Does not recompute or replace the astrology 0–100 score.

Classification reuses existing ``_rating`` bands from ``astro_engine.scoring``
and the existing ±4.0 opportunity/risk magnitude already used when populating
``opportunity_factors`` / ``risk_factors``. The only Decision Intelligence
overlay is conflict: material supportive AND material caution evidence forces
``mixed``, even when the net score is Favorable+.
"""

from __future__ import annotations

from typing import Literal, Sequence

from pydantic import BaseModel, ConfigDict, model_validator

from packages.astro_engine.scoring import _rating
from packages.decision_engine.evidence import DecisionEvidence

DayClass = Literal[
    "strongly_supportive",
    "supportive",
    "mixed",
    "caution",
    "adverse",
    "insufficient",
]

# Same cutoff as calculate_activity_score opportunity_factors / risk_factors.
MATERIAL_CONTRIBUTION = 4.0

CLASSIFICATION_BASIS = "score_bands+evidence_conflict"


class DayClassification(BaseModel):
    """Day-level synthesis. ``score`` is a passthrough of the engine score."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    day_class: DayClass
    conflict: bool
    rating: str
    score: int
    material_supportive_count: int
    material_caution_count: int
    basis: str = CLASSIFICATION_BASIS

    @model_validator(mode="after")
    def _rating_matches_passthrough_score(self) -> DayClassification:
        if self.rating != _rating(self.score):
            raise ValueError("rating must be astro_engine.scoring._rating(score)")
        return self


def classify_day(
    *,
    final_score: int,
    evidence: Sequence[DecisionEvidence],
) -> DayClassification:
    """Classify one day from the existing score plus normalized evidence."""
    material_supportive = [
        item
        for item in evidence
        if item.polarity == "supportive"
        and abs(item.contribution) >= MATERIAL_CONTRIBUTION
    ]
    material_caution = [
        item
        for item in evidence
        if item.polarity == "caution"
        and abs(item.contribution) >= MATERIAL_CONTRIBUTION
    ]
    conflict = bool(material_supportive and material_caution)
    rating = _rating(final_score)

    if not evidence:
        day_class: DayClass = "insufficient"
    elif conflict:
        day_class = "mixed"
    elif final_score >= 80:
        day_class = "strongly_supportive"
    elif final_score >= 65:
        day_class = "supportive"
    elif final_score >= 45:
        day_class = "mixed"
    elif final_score >= 30:
        day_class = "caution"
    else:
        day_class = "adverse"

    return DayClassification(
        day_class=day_class,
        conflict=conflict,
        rating=rating,
        score=final_score,
        material_supportive_count=len(material_supportive),
        material_caution_count=len(material_caution),
    )


__all__ = [
    "CLASSIFICATION_BASIS",
    "DayClass",
    "DayClassification",
    "MATERIAL_CONTRIBUTION",
    "classify_day",
]
