"""Real investor-meeting EVALUATE runtime."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import UUID, uuid4

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from packages.decision_engine.evaluate.contract import EvaluateRuntimeContract
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
from packages.decision_engine.intake.evaluator import (
    evaluate_investor_meeting_intake,
)
from packages.decision_engine.intake.investor_meeting import (
    INVESTOR_MEETING_DECISION_TYPE_ID,
    InvestorMeetingIntake,
)
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

REAL_ENGINE_ID = "decision-engine-investor-meeting-v1"


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _base_envelope(
    *,
    case_id: UUID | str,
    case_version: int,
    evaluation_id: UUID | str,
    created_at: str,
) -> dict[str, Any]:
    return build_evaluate_base_envelope(
        case_id=case_id,
        case_version=case_version,
        evaluation_id=evaluation_id,
        created_at=created_at,
        decision_type_id=INVESTOR_MEETING_DECISION_TYPE_ID,
        engine_id=REAL_ENGINE_ID,
    )


def build_insufficient_natal_package(
    *,
    case_id: UUID | str,
    case_version: int,
    target_date: str,
    intake: InvestorMeetingIntake,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )

    payload: dict[str, Any] = {
        **_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
        ),
        "recommendation": {
            "stance": "insufficient_data",
            "conditions": [
                "Add birth date, birth time, and birth location evidence"
            ],
            "summary": (
                "Cannot evaluate the investor meeting date without natal evidence."
            ),
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
            "notes": (
                "Timing not evaluated: natal evidence unavailable. "
                "Candidate score/band are Package v1 placeholders."
            ),
        },
        "confidence": {
            "value": 0.0,
            "precision_level": "L3",
            "penalties": [
                {
                    "code": "MISSING_NATAL_EVIDENCE",
                    "message": (
                        "Birth date/time/location evidence is required "
                        "for timing evaluation."
                    ),
                }
            ],
        },
        "evidence": {
            "items": [
                {
                    "framework_id": "astro_timing",
                    "eligibility": "unavailable",
                    "artifact_ref": "evidence://unavailable/natal",
                    "limits": [
                        "Natal chart inputs were not present on the Case."
                    ],
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
                    "action": (
                        "Provide natal evidence, then re-evaluate "
                        "the investor meeting date."
                    ),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "insufficient_data",
            "summary": "",
            "reason": (
                "No alternative date was evaluated. "
                "EVALUATE assesses only the requested date."
            ),
        },
        "explainability": {
            "why": "Evaluation did not run because natal evidence is missing.",
            "why_not": "Without natal inputs, timing quality cannot be computed.",
            "assumptions": [],
            "limits": [
                "No clock-time window was computed.",
                "No alternative dates were searched.",
            ],
        },
        "improve_accuracy": {
            "items": [
                "Add birth date, birth time, and birth place to Case natal_evidence."
            ]
        },
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }

    return DecisionEvaluationPackage.model_validate(payload)


def assemble_package_from_outcome(
    outcome: DecisionOutcome,
    *,
    case_id: UUID | str,
    case_version: int,
    target_date: str,
    intake: InvestorMeetingIntake,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
    event_location_supplied: bool = False,
) -> DecisionEvaluationPackage:
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )

    score = float(outcome.recommendation.score)
    rating = str(outcome.recommendation.rating or "")
    band = (
        rating_to_candidate_band(rating)
        if rating
        else score_to_candidate_band(score)
    )
    stance = rating_to_stance(rating) if rating else "wait"

    confidence_penalties: list[dict[str, str]] = []
    if outcome.confidence is not None and outcome.confidence.value is not None:
        confidence_value = round(float(outcome.confidence.value) * 100.0, 2)
    else:
        confidence_value = 0.0
        confidence_penalties.append(
            {
                "code": "CONFIDENCE_UNAVAILABLE",
                "message": (
                    "Upstream scoring did not supply a reasoning confidence value."
                ),
            }
        )

    drivers: list[dict[str, Any]] = []
    for index, ref in enumerate(outcome.evidence_references[:5]):
        ref_score = float(ref.score) if ref.score is not None else score
        ref_score = max(0.0, min(100.0, ref_score))
        drivers.append(
            {
                "id": f"evidence-{index + 1}",
                "label": (
                    ref.title or ref.category or f"Evidence {index + 1}"
                )[:80],
                "score": ref_score,
                "band": score_to_candidate_band(ref_score),
                "support": (
                    ref.detail or outcome.recommendation.summary or ""
                )[:240],
                "friction": "",
            }
        )

    why = outcome.explanation.summary or outcome.recommendation.text

    summary = (
        f"{rating or 'Scored'} investor-meeting timing conditions "
        f"on {target_date}."
    )

    conditions: list[str] = []
    if not intake.investor_name:
        conditions.append(
            "Investor identity was not used in scoring."
        )
    if not intake.meeting_type:
        conditions.append(
            "Meeting type was not used in scoring."
        )

    payload: dict[str, Any] = {
        **_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
        ),
        "recommendation": {
            "stance": stance,
            "conditions": conditions[:5],
            "summary": summary,
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
            "notes": (
                f"Date-level score from decision-engine facade "
                f"(action=investor_meeting → negotiation profile, rating={rating}). "
                "No clock-time window was computed."
            ),
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
                    "limits": [
                        (
                            "Canonical activity mapping: "
                            "investor_meeting → negotiation profile."
                        ),
                        (
                            "Score reflects negotiation/communication timing, "
                            "not probability of receiving funding."
                        ),
                        (
                            "Investor identity, meeting goal, and meeting type "
                            "do not determine the numeric timing score."
                        ),
                    ],
                }
            ]
        },
        "drivers": {"items": drivers},
        "tradeoffs": {"items": []},
        "risks": {"items": []},
        "opportunities": {"items": []},
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": (
                        f"Decide whether to keep the investor meeting on "
                        f"{target_date} given the timing evidence above."
                    ),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "wait",
            "summary": "",
            "reason": (
                "No alternative date was evaluated. "
                "EVALUATE assesses only the requested date; FIND is not implemented."
            ),
        },
        "explainability": {
            "why": why,
            "why_not": (
                "Negative timing factors were not isolated as a single driver."
            ),
            "assumptions": [
                (
                    "Canonical pre-existing alias "
                    "investor_meeting→negotiation was used for scoring."
                ),
                (
                    "Event location was supplied separately from birth place."
                    if event_location_supplied
                    else "Event location was not supplied on the Case."
                ),
            ],
            "limits": [
                (
                    "This is negotiation/communication timing evidence, "
                    "not investment-outcome prediction."
                ),
                "No best clock-time window was computed.",
                "Alternative dates were not searched.",
            ],
        },
        "improve_accuracy": {
            "items": [
                "Provide meeting clock time for future hourly-window analysis."
            ]
        },
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }

    return DecisionEvaluationPackage.model_validate(payload)


def evaluate_investor_meeting(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    slot_eval = evaluate_investor_meeting_intake(intake)
    if not slot_eval.is_complete:
        raise RuntimeFramingError(
            "investor meeting intake incomplete",
            details={"missing": list(slot_eval.missing_required)},
        )

    answers = slot_eval.intake
    target_date = extract_evaluate_date_from_framing(intake)
    natal = extract_natal_evidence(intake)

    if natal is None:
        return build_insufficient_natal_package(
            case_id=case_id,
            case_version=case_version,
            target_date=target_date,
            intake=answers,
            evaluation_id=evaluation_id,
            created_at=created_at,
        )

    request = DecisionRequest(
        module_origin="ask",
        decision_intent="investor-meeting-evaluate-date",
        birth_date=natal["birth_date"],
        birth_time=natal["birth_time"],
        location=natal["location"],
        target_date=target_date,
        action_type="investor_meeting",
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=natal.get("latitude"),
        longitude=natal.get("longitude"),
        evaluation_location=natal.get("evaluation_location"),
        evaluation_latitude=natal.get("evaluation_latitude"),
        evaluation_longitude=natal.get("evaluation_longitude"),
    )

    try:
        outcome = generate_outcome(request)
    except Exception as exc:
        raise RuntimeProviderError(
            "scoring provider failed",
            details={"error_type": type(exc).__name__},
        ) from exc

    return assemble_package_from_outcome(
        outcome,
        case_id=case_id,
        case_version=case_version,
        target_date=target_date,
        intake=answers,
        evaluation_id=evaluation_id,
        created_at=created_at,
        event_location_supplied=bool(natal.get("evaluation_location")),
    )


INVESTOR_MEETING_EVALUATE_RUNTIME = EvaluateRuntimeContract(
    decision_type_id=INVESTOR_MEETING_DECISION_TYPE_ID,
    mode="evaluate_date",
    engine_id=REAL_ENGINE_ID,
    evaluate_intake=evaluate_investor_meeting_intake,
    evaluate_package=evaluate_investor_meeting,
)
