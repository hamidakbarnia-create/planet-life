"""car-interview COMPARE — VisibilityTypeCompareConfig + Visibility runtime."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping
from uuid import UUID

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from packages.decision_engine.evaluate.type_visibility_compare_config import (
    VisibilityTypeCompareConfig,
    bind_visibility_compare_runtime,
    register_visibility_type_compare_config,
)
from packages.decision_engine.evaluate.visibility_compare import compare_visibility
from packages.decision_engine.evaluate.visibility_semantics import (
    CarInterviewVisibilityCompareSemantics,
)
from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_DECISION_TYPE_ID,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.models import DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

REAL_ENGINE_ID = "decision-engine-car-interview-v1"


def _build_car_interview_compare_request(
    natal: Mapping[str, Any],
    target_date: str,
) -> tuple[DecisionRequest, bool]:
    # Birth location ≠ interview/event location. Only pass evaluation_* when the
    # Case snapshot explicitly has distinct event-location fields.
    event_location = natal.get("evaluation_location")
    if isinstance(event_location, str):
        event_location = event_location.strip() or None
    else:
        event_location = None
    if event_location and event_location == natal["location"]:
        if natal.get("evaluation_latitude") in (None, natal.get("latitude")) and natal.get(
            "evaluation_longitude"
        ) in (None, natal.get("longitude")):
            event_location = None

    request = DecisionRequest(
        module_origin="ask",
        decision_intent="car-interview-compare-dates",
        birth_date=natal["birth_date"],
        birth_time=natal["birth_time"],
        location=natal["location"],
        target_date=target_date,
        action_type="job_interview",
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=natal.get("latitude"),
        longitude=natal.get("longitude"),
        evaluation_location=event_location,
        evaluation_latitude=natal.get("evaluation_latitude") if event_location else None,
        evaluation_longitude=natal.get("evaluation_longitude") if event_location else None,
    )
    return request, event_location is not None


CAR_INTERVIEW_COMPARE_TYPE_CONFIG = register_visibility_type_compare_config(
    VisibilityTypeCompareConfig(
        decision_type_id=CAR_INTERVIEW_DECISION_TYPE_ID,
        family_id="visibility",
        engine_id=REAL_ENGINE_ID,
        action_type="job_interview",
        decision_intent="car-interview-compare-dates",
        evaluate_intake=evaluate_car_interview_intake,
        build_request=_build_car_interview_compare_request,
        semantics=CarInterviewVisibilityCompareSemantics(),
        incomplete_error_message="car-interview intake incomplete",
        incomplete_details_key="missing_required",
    )
)


def compare_car_interview(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Execute car-interview COMPARE via Visibility Family runtime."""
    return compare_visibility(
        CAR_INTERVIEW_COMPARE_TYPE_CONFIG,
        case_id=case_id,
        case_version=case_version,
        intake=intake,
        generate_outcome=generate_outcome,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


CAR_INTERVIEW_COMPARE_RUNTIME = bind_visibility_compare_runtime(
    CAR_INTERVIEW_COMPARE_TYPE_CONFIG,
    compare_car_interview,
)

__all__ = [
    "REAL_ENGINE_ID",
    "CAR_INTERVIEW_COMPARE_RUNTIME",
    "CAR_INTERVIEW_COMPARE_TYPE_CONFIG",
    "compare_car_interview",
]
