"""Visibility Family COMPARE runtime (shared spine).

Scores each framed option with the same natal evidence and type action
profile, then produces one compare_dates package via deterministic ranking.
Does NOT assemble N independent DecisionEvaluationPackages and sort them.
family_id alone never activates a type.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import UUID, uuid4

from packages.decision_engine.compare_dates import (
    ScoredCompareOption,
    rank_compare_options,
)
from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeProviderError,
    build_compare_base_envelope,
    extract_compare_options_from_framing,
    extract_natal_evidence,
    rating_to_candidate_band,
    score_to_candidate_band,
)
from packages.decision_engine.evaluate.type_visibility_compare_config import (
    VisibilityTypeCompareConfig,
)
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

GenerateOutcomeFn = Callable[[DecisionRequest], DecisionOutcome]


def _iso_now() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _confidence_from_outcomes(
    outcomes: list[DecisionOutcome],
    *,
    unavailable_message: str,
) -> tuple[float, list[dict[str, str]]]:
    values: list[float] = []
    for outcome in outcomes:
        if outcome.confidence is not None and outcome.confidence.value is not None:
            values.append(float(outcome.confidence.value) * 100.0)
    if not values:
        return 0.0, [
            {
                "code": "CONFIDENCE_UNAVAILABLE",
                "message": unavailable_message,
            }
        ]
    return round(sum(values) / len(values), 2), []


def build_insufficient_natal_compare_package(
    config: VisibilityTypeCompareConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    options,
    answers: Any,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    sem = config.semantics
    labels = [option.label for option in options]
    candidates = [
        {
            "date": option.date,
            "rank": index + 1,
            "score": 0.0,
            "band": "low",
            "option_id": option.option_id,
            "label": option.label,
        }
        for index, option in enumerate(options)
    ]
    payload: dict[str, Any] = {
        **build_compare_base_envelope(
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
            "summary": sem.insufficient_summary(answers, labels),
        },
        "timing": {
            "material": False,
            "band": "na",
            "score": None,
            "candidates": candidates,
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
            "why": "Comparison did not run because natal evidence is missing.",
            "why_not": "Without natal inputs, candidate dates cannot be ranked.",
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


def assemble_compare_package(
    config: VisibilityTypeCompareConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    answers: Any,
    ranking,
    outcomes_by_option_id: Mapping[str, DecisionOutcome],
    event_location_supplied: bool,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    sem = config.semantics
    ranked = ranking.ranked
    top = ranked[0]
    tied_labels = [
        item.label
        for item in ranked
        if item.option_id in ranking.tied_option_ids
    ]
    winner_label = top.label if ranking.unique_winner else None
    why, why_not = sem.relative_explanation(
        unique_winner=ranking.unique_winner,
        ranked_labels=[item.label for item in ranked],
        ranked_scores=[item.score for item in ranked],
        tied_labels=tied_labels,
    )
    outcomes = [outcomes_by_option_id[item.option_id] for item in ranked]
    confidence_value, confidence_penalties = _confidence_from_outcomes(
        outcomes,
        unavailable_message=sem.scored_confidence_unavailable_message(),
    )
    # Tie must not imply either candidate is preferred (prefer_alternate would).
    stance = (
        "proceed_with_conditions"
        if ranking.unique_winner
        else "no_unique_winner"
    )
    candidates = [
        {
            "date": item.date,
            "rank": item.rank,
            "score": item.score,
            "band": item.band,
            "option_id": item.option_id,
            "label": item.label,
            "strengths": list(item.strengths),
            "risks": list(item.risks),
        }
        for item in ranked
    ]
    drivers = [
        {
            "id": item.option_id,
            "label": item.label,
            "score": item.score,
            "band": item.band,
            "support": " ".join(item.strengths) if item.strengths else "",
            "friction": " ".join(item.risks) if item.risks else "",
        }
        for item in ranked
    ]
    payload: dict[str, Any] = {
        **build_compare_base_envelope(
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
                unique_winner=ranking.unique_winner,
                winner_label=winner_label,
                tied_labels=tied_labels,
            ),
        },
        "timing": {
            "material": True,
            "band": top.band if ranking.unique_winner else "moderate",
            "score": top.score,
            "candidates": candidates,
            "notes": sem.scored_timing_notes(unique_winner=ranking.unique_winner),
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
                    "artifact_ref": "evidence://astro_timing/compare",
                    "limits": sem.scored_evidence_limits(),
                }
            ]
        },
        "drivers": {"items": drivers},
        "tradeoffs": {
            "items": [
                "Higher visibility timing score may reduce scheduling flexibility among candidates."
            ]
        },
        "risks": {
            "items": [
                "Non-timing constraints may override the ranked preference.",
            ]
        },
        "opportunities": {
            "items": [
                "Reserve the preferred or tied dates before availability changes.",
            ]
        },
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": sem.scored_action_step(
                        unique_winner=ranking.unique_winner,
                        winner_label=winner_label,
                        tied_labels=tied_labels,
                    ),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "proceed_with_conditions",
            "summary": (
                ""
                if ranking.unique_winner
                else "Choose among tied dates using logistics, not timing."
            ),
            "reason": sem.scored_counter_reason(
                unique_winner=ranking.unique_winner
            ),
        },
        "explainability": {
            "why": why,
            "why_not": why_not,
            "assumptions": sem.scored_assumptions(
                event_location_supplied=event_location_supplied
            ),
            "limits": sem.scored_limits(),
        },
        "improve_accuracy": {"items": sem.scored_improve_accuracy()},
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }
    return DecisionEvaluationPackage.model_validate(payload)


def compare_visibility(
    config: VisibilityTypeCompareConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, object],
    generate_outcome: GenerateOutcomeFn,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Shared Visibility Family COMPARE spine for an allowlisted type config."""
    if config.family_id != "visibility":
        raise ValueError(
            "compare_visibility requires family_id='visibility'; "
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

    options = extract_compare_options_from_framing(intake)
    answers = slot_eval.intake
    natal = extract_natal_evidence(intake)
    if natal is None:
        return build_insufficient_natal_compare_package(
            config,
            case_id=case_id,
            case_version=case_version,
            options=options,
            answers=answers,
            evaluation_id=evaluation_id,
            created_at=created_at,
        )

    scored: list[ScoredCompareOption] = []
    outcomes_by_option_id: dict[str, DecisionOutcome] = {}
    event_location_supplied = False

    for option in options:
        request, location_supplied = config.build_request(natal, option.date)
        event_location_supplied = event_location_supplied or location_supplied
        if request.action_type != config.action_type:
            raise ValueError(
                "DecisionRequest.action_type must match "
                "VisibilityTypeCompareConfig.action_type"
            )
        # Fail closed: any single option scoring failure aborts the comparison.
        try:
            outcome = generate_outcome(request)
        except Exception as exc:  # noqa: BLE001 — surface as provider failure
            raise RuntimeProviderError(
                "scoring provider failed for compare option",
                details={
                    "error_type": type(exc).__name__,
                    "option_id": option.option_id,
                    "date": option.date,
                },
            ) from exc

        score = float(outcome.recommendation.score)
        rating = str(outcome.recommendation.rating or "")
        band = (
            rating_to_candidate_band(rating)
            if rating
            else score_to_candidate_band(score)
        )
        outcomes_by_option_id[option.option_id] = outcome
        scored.append(
            ScoredCompareOption(
                option_id=option.option_id,
                label=option.label,
                date=option.date,
                score=score,
                band=band,
                strengths=config.semantics.option_strengths(
                    score=score, band=band, rating=rating
                ),
                risks=config.semantics.option_risks(
                    score=score, band=band, rating=rating
                ),
            )
        )

    ranking = rank_compare_options(scored)
    return assemble_compare_package(
        config,
        case_id=case_id,
        case_version=case_version,
        answers=answers,
        ranking=ranking,
        outcomes_by_option_id=outcomes_by_option_id,
        event_location_supplied=event_location_supplied,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


__all__ = [
    "assemble_compare_package",
    "build_insufficient_natal_compare_package",
    "compare_visibility",
]
