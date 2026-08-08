"""Authoritative PR-1 runtime stub for DecisionEvaluationPackage v1.

PR-1 only — no real scoring. Package is validated via package_models.
The Web walking skeleton consumes a checked-in fixture produced from this
builder; do not re-implement stub scoring in TypeScript.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Mapping
from uuid import UUID, uuid4

from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_DECISION_TYPE_ID,
    CarInterviewIntake,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.package_models import DecisionEvaluationPackage
from packages.decision_engine.registry import get_decision_type

STUB_ENGINE_ID = "decision-engine-stub-v1"


def build_car_interview_stub_package(
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any] | CarInterviewIntake,
    *,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Build and validate a stub Package for a complete car-interview intake."""
    record = get_decision_type(CAR_INTERVIEW_DECISION_TYPE_ID)
    evaluation = evaluate_car_interview_intake(intake)
    if not evaluation.is_complete:
        raise ValueError(
            "car-interview intake is incomplete: missing "
            + ", ".join(evaluation.missing_required)
        )

    answers = evaluation.intake
    target = date.fromisoformat(answers.target_date)  # type: ignore[arg-type]
    role = answers.role or "the role"
    company = answers.company
    interview_type = answers.interview_type

    conditions: list[str] = ["Prepare concrete examples tied to the role"]
    if interview_type:
        conditions.append(f"Rehearse for a {interview_type} interview format")
    if not company:
        conditions.append("Confirm employer context before the interview")

    improve: list[str] = []
    if not company:
        improve.append("Add the company name for sharper employer context.")
    if not interview_type:
        improve.append("Specify interview format (phone, onsite, panel).")
    if not improve:
        improve.append("Add interviewers or seniority level for higher precision.")

    payload: dict[str, Any] = {
        "case_id": str(case_id),
        "evaluation_id": str(evaluation_id or uuid4()),
        "evaluation_version": 1,
        "case_version": case_version,
        "decision_type_id": record.decision_type_id,
        "family_id": record.family_id,
        "mode": "evaluate_date",
        "precision_level": "L3",
        "engine_id": STUB_ENGINE_ID,
        "created_at": (created_at or datetime.now(timezone.utc)).isoformat().replace(
            "+00:00", "Z"
        ),
        "schema_version": "1.0.0",
        "recommendation": {
            "stance": "proceed_with_conditions",
            "conditions": conditions[:5],
            "summary": (
                f"Proceed with the {role} interview"
                + (f" at {company}" if company else "")
                + ", provided preparation and practical constraints are addressed."
            ),
        },
        "timing": {
            "material": True,
            "band": "high",
            "score": 81.0,
            "candidates": [
                {
                    "date": target.isoformat(),
                    "rank": 1,
                    "score": 81.0,
                    "band": "high",
                }
            ],
            "notes": "Stub timing supports attending on the selected date.",
        },
        "confidence": {
            "value": 72.0,
            "precision_level": "L3",
            "penalties": [
                {
                    "code": "STUB_ENGINE",
                    "message": "Runtime stub — not a production evaluation.",
                }
            ],
        },
        "evidence": {
            "items": [
                {
                    "framework_id": "astro_timing",
                    "eligibility": "provisional",
                    "artifact_ref": "evidence://stub/car-interview/1",
                    "limits": ["Stub evidence does not determine interview outcome."],
                }
            ]
        },
        "drivers": {
            "items": [
                {
                    "id": "visibility",
                    "label": "Visibility",
                    "contribution": 4.5,
                    "polarity": "supportive",
                    "importance": "high",
                    "score": 4.5,
                    "band": "high",
                    "support": "The selected date supports clear presentation.",
                    "friction": "",
                },
                {
                    "id": "preparation",
                    "label": "Preparation remains decisive",
                    "contribution": -2.0,
                    "polarity": "cautionary",
                    "importance": "medium",
                    "score": 2.0,
                    "band": "low",
                    "support": "",
                    "friction": "Preparation quality remains decisive.",
                },
            ]
        },
        "tradeoffs": {"items": ["Attend now — less preparation buffer"]},
        "risks": {"items": ["Under-preparation may weaken interview performance."]},
        "opportunities": {
            "items": [f"Use the interview to present a clear narrative for {role}."]
        },
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": f"Prepare three evidence-based examples for {role}.",
                    "condition": None,
                },
                {
                    "order": 2,
                    "action": "Confirm logistics and materials the day before.",
                    "condition": None,
                },
            ]
        },
        "counter_recommendation": {
            "stance": "wait",
            "summary": "Delay only when preparation is materially incomplete.",
            "reason": "Preparation quality outweighs a favorable date.",
        },
        "explainability": {
            "why": "Stub evidence moderately supports attending on the selected date.",
            "why_not": "The date cannot compensate for incomplete preparation.",
            "assumptions": ["The interview date can still be changed if needed."],
            "limits": ["Stub runtime does not inspect live employer process data."],
        },
        "improve_accuracy": {"items": improve[:5]},
        "next_decisions": {
            "items": [
                {
                    "decision_type_id": "car-negotiate-offer",
                    "label": "Negotiate job offer",
                }
            ]
        },
        "related_decisions": {"items": []},
    }

    return DecisionEvaluationPackage.model_validate(payload)


def build_car_interview_stub_package_dict(
    **kwargs: Any,
) -> dict[str, Any]:
    """JSON-serializable stub package for web / persistence layers."""
    package = build_car_interview_stub_package(**kwargs)
    return package.model_dump(mode="json")
