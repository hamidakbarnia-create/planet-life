"""Pydantic contract for deterministic score reasoning."""

from __future__ import annotations

import logging
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from packages.astro_engine.reasoning import build_reasoning
from packages.astro_engine.scoring_context import ScoringContext

logger = logging.getLogger("planet_life.reasoning")

ReasonCategory = Literal[
    "house",
    "angular",
    "aspect",
    "retrograde",
    "electional_timing",
]

Importance = Literal["high", "medium", "low"]


class ReasonEvidence(BaseModel):
    """Structured evidence backing a score reason (flexible key set)."""

    model_config = ConfigDict(extra="allow")


class ScoreReason(BaseModel):
    category: ReasonCategory
    planet: str
    importance: Importance
    score: float
    title: str
    explanation: str
    evidence: ReasonEvidence


class ScoreReasoning(BaseModel):
    summary: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasons: list[ScoreReason]


REASON_REQUIRED_FIELDS: tuple[str, ...] = (
    "category",
    "planet",
    "importance",
    "score",
    "title",
    "explanation",
    "evidence",
)


def _chart_data_available(
    natal: dict[str, Any] | None,
    transit: dict[str, Any] | None,
) -> bool:
    if isinstance(transit, dict) and (
        transit.get("planets") or transit.get("evaluation")
    ):
        return True
    if isinstance(natal, dict) and natal.get("planets"):
        return True
    return False


def build_reasoning_payload(
    score_result: dict[str, Any],
    *,
    natal: dict[str, Any] | None = None,
    transit: dict[str, Any] | None = None,
    activity_type: str | None = None,
    context: ScoringContext | None = None,
) -> ScoreReasoning | None:
    """
    Build validated reasoning from score + chart data.
    Returns None when chart data or activity context is unavailable.
    """
    if not activity_type or context is None:
        return None
    if not _chart_data_available(natal, transit):
        return None

    try:
        raw = build_reasoning(
            score_result,
            {"natal": natal or {}, "transit": transit or {}},
            activity_type,
            context,
        )
        return validate_score_reasoning(raw)
    except Exception as exc:
        logger.warning("Failed to build score reasoning: %s", exc)
        return None


def validate_score_reasoning(data: dict[str, Any]) -> ScoreReasoning:
    """Parse and validate a reasoning dict against the API contract."""
    if "summary" not in data or "confidence" not in data or "reasons" not in data:
        raise ValueError("reasoning missing summary, confidence, or reasons")

    reasons = data.get("reasons") or []
    for idx, reason in enumerate(reasons):
        missing = [field for field in REASON_REQUIRED_FIELDS if field not in reason]
        if missing:
            raise ValueError(
                f"reason[{idx}] missing fields: {', '.join(missing)}"
            )
        if reason.get("evidence") is None:
            raise ValueError(f"reason[{idx}] missing evidence")

    normalized = {
        **data,
        "reasons": [
            {
                **reason,
                "evidence": reason.get("evidence") or {},
            }
            for reason in reasons
        ],
    }
    return ScoreReasoning.model_validate(normalized)
