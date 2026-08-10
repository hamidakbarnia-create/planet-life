"""bus-investor-meeting COMPARE — VisibilityTypeCompareConfig + Visibility runtime."""

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
    InvestorMeetingVisibilityCompareSemantics,
)
from packages.decision_engine.intake.evaluator import evaluate_investor_meeting_intake
from packages.decision_engine.intake.investor_meeting import (
    INVESTOR_MEETING_DECISION_TYPE_ID,
)
from packages.decision_engine.models import DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

REAL_ENGINE_ID = "decision-engine-investor-meeting-v1"


def _build_investor_meeting_compare_request(
    natal: Mapping[str, Any],
    target_date: str,
) -> tuple[DecisionRequest, bool]:
    request = DecisionRequest(
        module_origin="ask",
        decision_intent="investor-meeting-compare-dates",
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
    return request, bool(natal.get("evaluation_location"))


INVESTOR_MEETING_COMPARE_TYPE_CONFIG = register_visibility_type_compare_config(
    VisibilityTypeCompareConfig(
        decision_type_id=INVESTOR_MEETING_DECISION_TYPE_ID,
        family_id="visibility",
        engine_id=REAL_ENGINE_ID,
        action_type="investor_meeting",
        decision_intent="investor-meeting-compare-dates",
        evaluate_intake=evaluate_investor_meeting_intake,
        build_request=_build_investor_meeting_compare_request,
        semantics=InvestorMeetingVisibilityCompareSemantics(),
        incomplete_error_message="investor meeting intake incomplete",
        incomplete_details_key="missing",
    )
)


def compare_investor_meeting(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Execute investor-meeting COMPARE via Visibility Family runtime."""
    return compare_visibility(
        INVESTOR_MEETING_COMPARE_TYPE_CONFIG,
        case_id=case_id,
        case_version=case_version,
        intake=intake,
        generate_outcome=generate_outcome,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


INVESTOR_MEETING_COMPARE_RUNTIME = bind_visibility_compare_runtime(
    INVESTOR_MEETING_COMPARE_TYPE_CONFIG,
    compare_investor_meeting,
)

__all__ = [
    "REAL_ENGINE_ID",
    "INVESTOR_MEETING_COMPARE_RUNTIME",
    "INVESTOR_MEETING_COMPARE_TYPE_CONFIG",
    "compare_investor_meeting",
]
