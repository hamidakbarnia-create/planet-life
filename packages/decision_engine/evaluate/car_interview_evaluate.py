"""car-interview EVALUATE — TypeEvaluateConfig + Visibility Family runtime.

Compatibility exports preserve prior import paths and EvaluateRuntimeContract
identity. Orchestration lives in visibility_evaluate.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from typing import Any, Mapping
from uuid import UUID

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from packages.decision_engine.evaluate.runtime_common import (
    NATAL_EVIDENCE_INTAKE_KEY,
    RuntimeFramingError,
    RuntimeProviderError,
    RuntimeUnsupportedOperationError,
    extract_evaluate_date_from_framing,
    rating_to_candidate_band,
    rating_to_stance,
)
from packages.decision_engine.evaluate.type_evaluate_config import (
    TypeEvaluateConfig,
    bind_evaluate_runtime,
    register_type_evaluate_config,
)
from packages.decision_engine.evaluate.visibility_evaluate import (
    assemble_package_from_outcome as assemble_visibility_package,
    evaluate_visibility,
)
from packages.decision_engine.evaluate.visibility_semantics import (
    CarInterviewVisibilitySemantics,
)
from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_DECISION_TYPE_ID,
    CarInterviewIntake,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

REAL_ENGINE_ID = "decision-engine-car-interview-v1"
GenerateOutcomeFn = Callable[[DecisionRequest], DecisionOutcome]


def _build_car_interview_request(
    natal: Mapping[str, Any],
    target_date: str,
) -> tuple[DecisionRequest, bool]:
    # Birth location ≠ interview/event location. Only pass evaluation_* when the
    # Case snapshot explicitly has distinct event-location fields. Never substitute
    # birth place as if it were the interview city. When omitted, the scoring
    # pipeline may fall back to birth for transit (existing engine default).
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
        decision_intent="car-interview-evaluate-date",
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


CAR_INTERVIEW_TYPE_CONFIG = register_type_evaluate_config(
    TypeEvaluateConfig(
        decision_type_id=CAR_INTERVIEW_DECISION_TYPE_ID,
        family_id="visibility",
        engine_id=REAL_ENGINE_ID,
        action_type="job_interview",
        decision_intent="car-interview-evaluate-date",
        evaluate_intake=evaluate_car_interview_intake,
        build_request=_build_car_interview_request,
        semantics=CarInterviewVisibilitySemantics(),
        incomplete_error_message="car-interview intake incomplete",
        incomplete_details_key="missing_required",
    )
)


def evaluate_car_interview(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome: GenerateOutcomeFn,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Execute car-interview EVALUATE via Visibility Family runtime."""
    return evaluate_visibility(
        CAR_INTERVIEW_TYPE_CONFIG,
        case_id=case_id,
        case_version=case_version,
        intake=intake,
        generate_outcome=generate_outcome,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


def assemble_package_from_outcome(
    outcome: DecisionOutcome,
    *,
    case_id: UUID | str,
    case_version: int,
    target_date: str,
    intake: CarInterviewIntake,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
    event_location_supplied: bool = False,
) -> DecisionEvaluationPackage:
    """Compatibility wrapper for unit tests / direct assembly."""
    return assemble_visibility_package(
        outcome,
        CAR_INTERVIEW_TYPE_CONFIG,
        case_id=case_id,
        case_version=case_version,
        target_date=target_date,
        answers=intake,
        evaluation_id=evaluation_id,
        created_at=created_at,
        event_location_supplied=event_location_supplied,
    )


def evaluate_car_interview_dict(**kwargs: Any) -> dict[str, Any]:
    package = evaluate_car_interview(**kwargs)
    return package.model_dump(mode="json")


CAR_INTERVIEW_EVALUATE_RUNTIME = bind_evaluate_runtime(
    CAR_INTERVIEW_TYPE_CONFIG,
    evaluate_car_interview,
)

__all__ = [
    "CAR_INTERVIEW_EVALUATE_RUNTIME",
    "CAR_INTERVIEW_TYPE_CONFIG",
    "NATAL_EVIDENCE_INTAKE_KEY",
    "REAL_ENGINE_ID",
    "RuntimeFramingError",
    "RuntimeProviderError",
    "RuntimeUnsupportedOperationError",
    "assemble_package_from_outcome",
    "evaluate_car_interview",
    "evaluate_car_interview_dict",
    "extract_evaluate_date_from_framing",
    "rating_to_candidate_band",
    "rating_to_stance",
]
