"""Shared API response schemas."""

from schemas.score_breakdown import (
    COMPONENT_BREAKDOWN_FIELDS,
    ActivityScoreResponse,
    ComponentBreakdown,
    HourlyScoreEntry,
    HourlyScoresResponse,
    build_scoring_response,
    require_component_breakdown,
    validate_component_breakdown,
)

__all__ = [
    "COMPONENT_BREAKDOWN_FIELDS",
    "ActivityScoreResponse",
    "ComponentBreakdown",
    "HourlyScoreEntry",
    "HourlyScoresResponse",
    "build_scoring_response",
    "require_component_breakdown",
    "validate_component_breakdown",
]
