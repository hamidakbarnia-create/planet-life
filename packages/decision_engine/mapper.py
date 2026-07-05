"""Map existing ActivityScoreResponse payloads to DecisionOutcome.

Transformation only — no scoring, reasoning, or business rules.
"""

from __future__ import annotations

from typing import Any

from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    DecisionRequest,
    EvidenceReference,
    Explanation,
    ExplanationReason,
    Recommendation,
)


def map_activity_response_to_decision_outcome(
    payload: dict[str, Any],
    *,
    request: DecisionRequest | None = None,
) -> DecisionOutcome:
    """Convert an ActivityScoreResponse-shaped dict into a DecisionOutcome."""
    executive = payload.get("executive") or {}
    technical = payload.get("technical") or {}
    strategic = payload.get("strategic") or {}
    reasoning = payload.get("reasoning")
    breakdown = strategic.get("component_breakdown") or {}

    recommendation = Recommendation(
        score=int(executive.get("score", 0)),
        rating=str(executive.get("rating", "")),
        activity=str(executive.get("activity", "")),
        summary=str(executive.get("summary", "")),
        text=str(executive.get("recommendation", "")),
    )

    confidence = _map_confidence(executive, reasoning)
    evidence_references = _map_evidence_references(reasoning)
    explanation = _map_explanation(executive, reasoning)
    metadata = _map_metadata(payload, request=request, technical=technical, breakdown=breakdown)

    return DecisionOutcome(
        recommendation=recommendation,
        confidence=confidence,
        evidence_references=evidence_references,
        explanation=explanation,
        metadata=metadata,
        source_activity_response=payload,
    )


def _map_confidence(
    executive: dict[str, Any],
    reasoning: dict[str, Any] | None,
) -> Confidence | None:
    rating = executive.get("rating")
    value = None
    if isinstance(reasoning, dict) and reasoning.get("confidence") is not None:
        value = float(reasoning["confidence"])

    if value is None and not rating:
        return None

    return Confidence(value=value, rating=str(rating) if rating is not None else None)


def _map_evidence_references(
    reasoning: dict[str, Any] | None,
) -> list[EvidenceReference]:
    if not isinstance(reasoning, dict):
        return []

    references: list[EvidenceReference] = []
    for reason in reasoning.get("reasons") or []:
        if not isinstance(reason, dict):
            continue
        evidence = reason.get("evidence")
        references.append(
            EvidenceReference(
                category=_optional_str(reason.get("category")),
                title=_optional_str(reason.get("title")),
                detail=_optional_str(reason.get("explanation")),
                importance=_optional_str(reason.get("importance")),
                score=_optional_float(reason.get("score")),
                evidence=dict(evidence) if isinstance(evidence, dict) else {},
            )
        )
    return references


def _map_explanation(
    executive: dict[str, Any],
    reasoning: dict[str, Any] | None,
) -> Explanation:
    recommendation_text = str(executive.get("recommendation", ""))
    summary = recommendation_text

    reasons: list[ExplanationReason] = []
    if isinstance(reasoning, dict):
        summary = str(reasoning.get("summary") or executive.get("summary") or recommendation_text)
        for reason in reasoning.get("reasons") or []:
            if not isinstance(reason, dict):
                continue
            evidence = reason.get("evidence")
            reasons.append(
                ExplanationReason(
                    category=_optional_str(reason.get("category")),
                    planet=_optional_str(reason.get("planet")),
                    importance=_optional_str(reason.get("importance")),
                    score=_optional_float(reason.get("score")),
                    title=_optional_str(reason.get("title")),
                    explanation=_optional_str(reason.get("explanation")),
                    evidence=dict(evidence) if isinstance(evidence, dict) else {},
                )
            )
    elif executive.get("summary"):
        summary = str(executive["summary"])

    return Explanation(
        summary=summary,
        recommendation_text=recommendation_text,
        reasons=reasons,
    )


def _map_metadata(
    payload: dict[str, Any],
    *,
    request: DecisionRequest | None,
    technical: dict[str, Any],
    breakdown: dict[str, Any],
) -> DecisionMetadata:
    module_origin = request.module_origin if request else "unknown"
    decision_intent = request.decision_intent if request else "unknown"

    return DecisionMetadata(
        module_origin=module_origin,
        decision_intent=decision_intent,
        action_type=_optional_str(technical.get("activity_type")),
        resolved_activity=_optional_str(technical.get("resolved_activity")),
        location_mode=_optional_str(breakdown.get("location_mode")),
        calculated_for=_optional_str(breakdown.get("calculated_for")),
        resolved_local_datetime=_optional_str(breakdown.get("resolved_local_datetime")),
        resolved_utc_datetime=_optional_str(breakdown.get("resolved_utc_datetime")),
        timezone=_optional_str(breakdown.get("timezone")),
        target_time=_optional_str(breakdown.get("target_time")),
        scoring_context=dict(technical.get("scoring_context") or {}),
        location_context=payload.get("location_context"),
    )


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)
