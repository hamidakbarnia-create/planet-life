"""
Stable API contract for scoring component_breakdown.

Returned by Calendar (batch / batch-hourly), Ask/Electional (business, finance),
and Property (real-estate) endpoints via strategic.component_breakdown and,
for hourly calendar, hours[n].component_breakdown.

Pathfinder /best-times uses a separate aggregated score model and does not
expose this breakdown contract.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

from packages.astro_engine.scoring_context import ScoringContext
from schemas.score_reasoning import ScoreReasoning, build_reasoning_payload

LocationMode = Literal[
    "birthOnly",
    "currentLiving",
    "eventLocation",
    "targetSubject",
    "birthAndTarget",
]

# Canonical field list — keep in sync with ComponentBreakdown and scoring engine output.
COMPONENT_BREAKDOWN_FIELDS: tuple[str, ...] = (
    "aspect_score",
    "natal_house_bonus",
    "transit_house_score",
    "transit_angular_score",
    "location_component_score",
    "retrograde_penalty",
    "final_score",
    "location_mode",
    "calculated_for",
    "resolved_local_datetime",
    "resolved_utc_datetime",
    "timezone",
    "target_time",
)


class ComponentBreakdown(BaseModel):
    """Per-score decomposition of activity scoring components."""

    aspect_score: float
    natal_house_bonus: float
    transit_house_score: float
    transit_angular_score: float
    location_component_score: float
    retrograde_penalty: float
    final_score: int
    location_mode: LocationMode
    calculated_for: str
    resolved_local_datetime: str
    resolved_utc_datetime: str
    timezone: str
    target_time: str

    @model_validator(mode="after")
    def _location_component_is_sum(self) -> ComponentBreakdown:
        expected = round(self.transit_house_score + self.transit_angular_score, 2)
        if abs(self.location_component_score - expected) > 0.02:
            raise ValueError(
                "location_component_score must equal "
                "transit_house_score + transit_angular_score"
            )
        return self


class ExecutiveScore(BaseModel):
    score: int
    rating: str
    activity: str
    summary: str
    recommendation: str


class StrategicScoreLayer(BaseModel):
    score: int
    base_score: int
    adjustments: dict[str, float]
    component_breakdown: ComponentBreakdown
    transit_house_notes: list[str] = Field(default_factory=list)
    transit_angular_notes: list[str] = Field(default_factory=list)
    key_themes: list[str] = Field(default_factory=list)
    opportunity_factors: list[str] = Field(default_factory=list)
    risk_factors: list[str] = Field(default_factory=list)
    timing_notes: list[str] = Field(default_factory=list)
    primary_planets: list[str] = Field(default_factory=list)


class TechnicalScoreLayer(BaseModel):
    activity_type: str
    resolved_activity: str
    scoring_context: dict[str, Any]
    natal_points_used: list[str]
    transit_points_used: list[str]
    aspects_evaluated: list[dict[str, Any]]
    aspect_count: int
    component_breakdown: ComponentBreakdown
    calculation_metadata: dict[str, Any]


class ActivityScoreResponse(BaseModel):
    """Standard scoring payload for analyze and calendar batch endpoints."""

    executive: ExecutiveScore
    strategic: StrategicScoreLayer
    technical: TechnicalScoreLayer
    location_context: dict[str, Any] | None = None
    reasoning: ScoreReasoning | None = None


class HourlyScoreEntry(BaseModel):
    score: int
    component_breakdown: ComponentBreakdown


class HourlyScoresResponse(BaseModel):
    hours: dict[int, HourlyScoreEntry | dict[str, str]]


def require_component_breakdown(result: dict[str, Any]) -> dict[str, Any]:
    """Return component_breakdown from a calculate_activity_score result."""
    strategic = result.get("strategic") or {}
    breakdown = strategic.get("component_breakdown")
    if breakdown is None:
        raise ValueError("Missing strategic.component_breakdown in score result")
    return breakdown


def validate_component_breakdown(breakdown: dict[str, Any]) -> ComponentBreakdown:
    """Parse and validate a component_breakdown dict against the API contract."""
    missing = [field for field in COMPONENT_BREAKDOWN_FIELDS if field not in breakdown]
    if missing:
        raise ValueError(f"component_breakdown missing fields: {', '.join(missing)}")
    null_fields = [
        field
        for field in COMPONENT_BREAKDOWN_FIELDS
        if breakdown.get(field) is None and field not in ("calculated_for",)
    ]
    if null_fields:
        raise ValueError(
            f"component_breakdown has null required fields: {', '.join(null_fields)}"
        )
    return ComponentBreakdown.model_validate(breakdown)


def build_scoring_response(
    result: dict[str, Any],
    *,
    location_context: dict[str, Any] | None = None,
    natal: dict[str, Any] | None = None,
    transit: dict[str, Any] | None = None,
    activity_type: str | None = None,
    context: ScoringContext | None = None,
) -> dict[str, Any]:
    """
    Build a consistent API response dict and validate component_breakdown
    in both strategic and technical layers.
    """
    validate_component_breakdown(require_component_breakdown(result))
    technical = result.get("technical") or {}
    tech_breakdown = technical.get("component_breakdown")
    if tech_breakdown is not None:
        validate_component_breakdown(tech_breakdown)

    payload: dict[str, Any] = {
        "executive": result["executive"],
        "strategic": result["strategic"],
        "technical": result["technical"],
    }
    if location_context is not None:
        payload["location_context"] = location_context

    reasoning = build_reasoning_payload(
        result,
        natal=natal,
        transit=transit,
        activity_type=activity_type or technical.get("activity_type"),
        context=context,
    )
    if reasoning is not None:
        payload["reasoning"] = reasoning.model_dump()
    else:
        payload["reasoning"] = None

    return payload
