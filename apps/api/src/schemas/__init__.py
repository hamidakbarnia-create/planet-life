"""Shared API response schemas."""

from schemas.score_breakdown import (
    COMPONENT_BREAKDOWN_FIELDS,
    ActivityScoreResponse,
    ComponentBreakdown,
    HourlyScoreEntry,
    HourlyScoresResponse,
    ScoreReasoning,
    build_scoring_response,
    require_component_breakdown,
    validate_component_breakdown,
)
from schemas.score_reasoning import (
    ReasonEvidence,
    ScoreReason,
    build_reasoning_payload,
    validate_score_reasoning,
)

__all__ = [
    "COMPONENT_BREAKDOWN_FIELDS",
    "ActivityScoreResponse",
    "ComponentBreakdown",
    "HourlyScoreEntry",
    "HourlyScoresResponse",
    "ScoreReasoning",
    "ScoreReason",
    "ReasonEvidence",
    "build_scoring_response",
    "build_reasoning_payload",
    "require_component_breakdown",
    "validate_component_breakdown",
    "validate_score_reasoning",
]
