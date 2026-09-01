"""Visibility Family EVALUATE runtime (shared spine).

Orchestrates evaluate_date for allowlisted Visibility Decision Types.
Decision Type configuration supplies intake, request building, and Package
semantics. family_id alone never activates a type.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any, Mapping, Protocol
from uuid import UUID, uuid4

from packages.decision_engine.evaluate.driver_assembly import (
    assemble_drivers_from_outcome,
    strategic_string_factors,
)
from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeProviderError,
    build_evaluate_base_envelope,
    extract_evaluate_date_from_framing,
    extract_natal_evidence,
    rating_to_candidate_band,
    rating_to_stance,
    score_to_candidate_band,
)
from packages.decision_engine.evaluate.type_evaluate_config import TypeEvaluateConfig
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

GenerateOutcomeFn = Callable[[DecisionRequest], DecisionOutcome]


class PackageAssembleConfig(Protocol):
    """Structural config surface used by Package assembly helpers.

    Visibility and Timing Opt type configs both provide these fields.
    """

    decision_type_id: str
    engine_id: str
    semantics: Any


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def build_insufficient_natal_package(
    config: PackageAssembleConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    target_date: str,
    answers: Any,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Honest Package when natal evidence is unavailable — no fake scores."""
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    sem = config.semantics
    payload: dict[str, Any] = {
        **build_evaluate_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
            decision_type_id=config.decision_type_id,
            engine_id=config.engine_id,
        ),
        "recommendation": {
            "stance": "insufficient_data",
            "conditions": [
                "Add birth date, birth time, and birth location evidence"
            ],
            "summary": sem.insufficient_summary(answers, target_date),
        },
        "timing": {
            "material": False,
            "band": "na",
            "score": None,
            "candidates": [
                {
                    "date": target_date,
                    "rank": 1,
                    "score": 0.0,
                    "band": "low",
                }
            ],
            "notes": sem.insufficient_timing_notes(),
        },
        "confidence": {
            "value": 0.0,
            "precision_level": "L3",
            "penalties": [
                {
                    "code": "MISSING_NATAL_EVIDENCE",
                    "message": sem.insufficient_confidence_message(),
                }
            ],
        },
        "evidence": {
            "items": [
                {
                    "framework_id": "astro_timing",
                    "eligibility": "unavailable",
                    "artifact_ref": "evidence://unavailable/natal",
                    "limits": ["Natal chart inputs were not present on the Case."],
                }
            ]
        },
        "drivers": {"items": []},
        "tradeoffs": {"items": []},
        "risks": {"items": []},
        "opportunities": {"items": []},
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": sem.insufficient_action(),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "insufficient_data",
            "summary": "",
            "reason": sem.insufficient_counter_reason(),
        },
        "explainability": {
            "why": "Evaluation did not run because natal evidence is missing.",
            "why_not": "Without natal inputs, timing quality cannot be computed.",
            "assumptions": [],
            "limits": sem.insufficient_limits(),
        },
        "improve_accuracy": {
            "items": [
                "Add birth date, birth time, and birth place to Case natal_evidence.",
            ]
        },
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }
    return DecisionEvaluationPackage.model_validate(payload)


def assemble_package_from_outcome(
    outcome: DecisionOutcome,
    config: PackageAssembleConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    target_date: str,
    answers: Any,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
    event_location_supplied: bool = False,
    semantic_shadow: dict[str, Any] | None = None,
) -> DecisionEvaluationPackage:
    """Map a real DecisionOutcome onto Package v1 without inventing fields."""
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    score = float(outcome.recommendation.score)
    rating = str(outcome.recommendation.rating or "")
    band = rating_to_candidate_band(rating) if rating else score_to_candidate_band(score)
    stance = rating_to_stance(rating) if rating else "wait"
    sem = config.semantics

    confidence_penalties: list[dict[str, str]] = []
    if outcome.confidence is not None and outcome.confidence.value is not None:
        confidence_value = round(float(outcome.confidence.value) * 100.0, 2)
    else:
        confidence_value = 0.0
        confidence_penalties.append(
            {
                "code": "CONFIDENCE_UNAVAILABLE",
                "message": sem.scored_confidence_unavailable_message(),
            }
        )

    drivers = assemble_drivers_from_outcome(outcome)
    risks = strategic_string_factors(outcome, "risk_factors")
    opportunities = strategic_string_factors(outcome, "opportunity_factors")

    why = outcome.explanation.summary or outcome.recommendation.text
    why_not = ""
    if outcome.explanation.reasons:
        harsh = [
            r
            for r in outcome.explanation.reasons
            if (r.importance or "").lower() in {"high", "critical"}
            and (r.score is not None and r.score < 0)
        ]
        if harsh and harsh[0].explanation:
            why_not = harsh[0].explanation

    payload: dict[str, Any] = {
        **build_evaluate_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
            decision_type_id=config.decision_type_id,
            engine_id=config.engine_id,
        ),
        "recommendation": {
            "stance": stance,
            "conditions": sem.scored_conditions(answers)[:5],
            "summary": sem.scored_summary(
                answers,
                target_date=target_date,
                rating=rating,
                outcome=outcome,
            ),
        },
        "timing": {
            "material": True,
            "band": band,
            "score": score,
            "candidates": [
                {
                    "date": target_date,
                    "rank": 1,
                    "score": score,
                    "band": band,
                }
            ],
            "notes": sem.scored_timing_notes(rating=rating),
        },
        "confidence": {
            "value": confidence_value,
            "precision_level": "L3",
            "penalties": confidence_penalties,
        },
        "evidence": {
            "items": [
                {
                    "framework_id": "astro_timing",
                    "eligibility": "registered",
                    "artifact_ref": f"evidence://astro_timing/{target_date}",
                    "limits": sem.scored_evidence_limits(),
                }
            ]
        },
        "drivers": {"items": drivers},
        "tradeoffs": {"items": []},
        "risks": {"items": risks},
        "opportunities": {"items": opportunities},
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": sem.scored_action_step(target_date),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "wait",
            "summary": "",
            "reason": sem.scored_counter_reason(),
        },
        "explainability": {
            "why": why,
            "why_not": why_not
            or "Negative timing factors were not isolated as a single driver.",
            "assumptions": sem.scored_assumptions(
                event_location_supplied=event_location_supplied
            ),
            "limits": sem.scored_limits(),
        },
        "improve_accuracy": {"items": sem.scored_improve_accuracy()},
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }
    if semantic_shadow:
        payload["semantic_shadow"] = semantic_shadow
    return DecisionEvaluationPackage.model_validate(payload)


def evaluate_visibility(
    config: TypeEvaluateConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome: GenerateOutcomeFn,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Shared Visibility Family EVALUATE spine for an allowlisted type config."""
    if config.family_id != "visibility":
        raise ValueError(
            "evaluate_visibility requires family_id='visibility'; "
            f"got {config.family_id!r}"
        )

    slot_eval = config.evaluate_intake(intake)
    if not slot_eval.is_complete:
        raise RuntimeFramingError(
            config.incomplete_error_message,
            details={
                config.incomplete_details_key: list(slot_eval.missing_required)
            },
        )

    target_date = extract_evaluate_date_from_framing(intake)
    answers = slot_eval.intake
    natal = extract_natal_evidence(intake)
    if natal is None:
        return build_insufficient_natal_package(
            config,
            case_id=case_id,
            case_version=case_version,
            target_date=target_date,
            answers=answers,
            evaluation_id=evaluation_id,
            created_at=created_at,
        )

    request, event_location_supplied = config.build_request(natal, target_date)
    if request.action_type != config.action_type:
        raise ValueError(
            "DecisionRequest.action_type must match TypeEvaluateConfig.action_type"
        )

    try:
        outcome = generate_outcome(request)
    except Exception as exc:  # noqa: BLE001 — surface as provider failure
        raise RuntimeProviderError(
            "scoring provider failed",
            details={"error_type": type(exc).__name__},
        ) from exc

    from packages.decision_engine.decision_assessment import (
        assessment_from_request,
        build_semantic_shadow,
        tagged_assessment_payload,
    )
    from packages.decision_engine.semantic_policy import evaluate_policy
    from packages.decision_engine.semantic_explanation import (
        explain_assessment,
        explanation_payload,
    )

    assessment = assessment_from_request(
        outcome,
        request,
        evaluation_date=target_date,
        natal=getattr(outcome, "source_natal", None),
        transit=getattr(outcome, "source_transit", None),
        decision_type_id=config.decision_type_id,
        family_id=config.family_id,
    )
    shadow = None
    assessed = outcome
    if assessment is not None:
        tagged = tagged_assessment_payload(assessment)
        assessed = outcome.model_copy(update={"decision_assessment": tagged})
        policy = evaluate_policy(
            score=assessment.score,
            posture=assessment.dimension_class,
            assessment=tagged,
        ).model_dump(mode="json")
        shadow = build_semantic_shadow(
            [tagged],
            policy=policy,
            explanation=explanation_payload(
                explain_assessment(
                    tagged,
                    score=assessment.score,
                    posture=assessment.dimension_class,
                    policy=policy,
                )
            ),
        )

    return assemble_package_from_outcome(
        assessed,
        config,
        case_id=case_id,
        case_version=case_version,
        target_date=target_date,
        answers=answers,
        evaluation_id=evaluation_id,
        created_at=created_at,
        event_location_supplied=event_location_supplied,
        semantic_shadow=shadow,
    )


__all__ = [
    "assemble_package_from_outcome",
    "build_insufficient_natal_package",
    "evaluate_visibility",
]
