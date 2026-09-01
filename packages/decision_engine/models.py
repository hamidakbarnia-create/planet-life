"""Conceptual models for the Decision Intelligence Engine facade.

These types describe the engine's public outcome shape. They do not perform
scoring or reasoning — values are mapped from the existing ActivityScoreResponse.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from packages.astro_engine.scoring_context import ScoringContext


class DecisionRequest(BaseModel):
    """Structured entry point for decision support via the engine facade."""

    module_origin: str = Field(
        ...,
        description="Product module initiating the request (e.g. ask, calendar).",
    )
    decision_intent: str = Field(
        ...,
        description="Declared purpose for this request within the module.",
    )
    birth_date: str
    birth_time: str
    location: str
    target_date: str
    action_type: str
    context: ScoringContext
    target_time: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None
    house_system: str = "placidus"
    zodiac: str = "tropical"
    include_location_context: bool = Field(
        default=True,
        description=(
            "When True, preserve evaluation location in source_activity_response "
            "(matches /api/business/analyze). When False, omit location_context "
            "(matches /api/finance/analyze legacy behavior)."
        ),
    )


class Recommendation(BaseModel):
    """Advisory guidance mapped from the executive scoring layer."""

    score: int
    rating: str
    activity: str
    summary: str
    text: str = Field(
        ...,
        description="Executive recommendation text from the existing scoring pipeline.",
    )


class Confidence(BaseModel):
    """Confidence boundaries mapped from existing reasoning output when present."""

    value: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Deterministic reasoning confidence when available.",
    )
    rating: str | None = Field(
        default=None,
        description="Executive rating label from the existing scoring pipeline.",
    )


class EvidenceReference(BaseModel):
    """Traceable evidence item mapped from existing reasoning reasons."""

    model_config = ConfigDict(extra="allow")

    source: Literal["astrology_scoring"] = "astrology_scoring"
    category: str | None = None
    title: str | None = None
    detail: str | None = None
    importance: str | None = None
    score: float | None = None
    evidence: dict[str, Any] = Field(default_factory=dict)


class ExplanationReason(BaseModel):
    """Single explainability reason preserved from ScoreReasoning."""

    model_config = ConfigDict(extra="allow")

    category: str | None = None
    planet: str | None = None
    importance: str | None = None
    score: float | None = None
    title: str | None = None
    explanation: str | None = None
    evidence: dict[str, Any] = Field(default_factory=dict)


class Explanation(BaseModel):
    """Explainability dimension mapped from existing reasoning and executive layers."""

    summary: str
    recommendation_text: str
    reasons: list[ExplanationReason] = Field(default_factory=list)


class DecisionMetadata(BaseModel):
    """Provenance and request context attached to a Decision Outcome."""

    model_config = ConfigDict(extra="allow")

    module_origin: str
    decision_intent: str
    action_type: str | None = None
    resolved_activity: str | None = None
    location_mode: str | None = None
    calculated_for: str | None = None
    resolved_local_datetime: str | None = None
    resolved_utc_datetime: str | None = None
    timezone: str | None = None
    target_time: str | None = None
    scoring_context: dict[str, Any] = Field(default_factory=dict)
    location_context: dict[str, Any] | None = None
    facade_version: str = "1.0.0"


class DecisionOutcome(BaseModel):
    """Complete conceptual output of a facade invocation."""

    recommendation: Recommendation
    confidence: Confidence | None = None
    evidence_references: list[EvidenceReference] = Field(default_factory=list)
    explanation: Explanation
    metadata: DecisionMetadata
    source_activity_response: dict[str, Any] = Field(
        default_factory=dict,
        description="Preserved ActivityScoreResponse payload for traceability.",
    )
    source_natal: dict[str, Any] | None = None
    source_transit: dict[str, Any] | None = None
    decision_assessment: dict[str, Any] | None = Field(
        default=None,
        description=(
            "Additive experimental_shadow DecisionAssessment payload. "
            "Not canonical. Not a command."
        ),
    )
