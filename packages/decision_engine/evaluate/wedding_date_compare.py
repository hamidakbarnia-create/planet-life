"""mar-wedding-date COMPARE — TimingOptTypeCompareConfig + Timing Opt runtime."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping
from uuid import UUID

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from packages.decision_engine.evaluate.timing_opt_compare import compare_timing_opt
from packages.decision_engine.evaluate.timing_opt_semantics import (
    WeddingDateTimingOptCompareSemantics,
)
from packages.decision_engine.evaluate.type_timing_opt_compare_config import (
    TimingOptTypeCompareConfig,
    bind_timing_opt_compare_runtime,
    register_timing_opt_type_compare_config,
)
from packages.decision_engine.intake.evaluator import evaluate_wedding_date_intake
from packages.decision_engine.intake.wedding_date import (
    WEDDING_DATE_DECISION_TYPE_ID,
)
from packages.decision_engine.models import DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

REAL_ENGINE_ID = "decision-engine-wedding-date-v1"


def _build_wedding_date_compare_request(
    natal: Mapping[str, Any],
    target_date: str,
) -> tuple[DecisionRequest, bool]:
    request = DecisionRequest(
        module_origin="ask",
        decision_intent="wedding-date-compare-dates",
        birth_date=natal["birth_date"],
        birth_time=natal["birth_time"],
        location=natal["location"],
        target_date=target_date,
        action_type="wedding_date",
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=natal.get("latitude"),
        longitude=natal.get("longitude"),
        evaluation_location=natal.get("evaluation_location"),
        evaluation_latitude=natal.get("evaluation_latitude"),
        evaluation_longitude=natal.get("evaluation_longitude"),
    )
    return request, bool(natal.get("evaluation_location"))


WEDDING_DATE_COMPARE_TYPE_CONFIG = register_timing_opt_type_compare_config(
    TimingOptTypeCompareConfig(
        decision_type_id=WEDDING_DATE_DECISION_TYPE_ID,
        family_id="timing_opt",
        engine_id=REAL_ENGINE_ID,
        action_type="wedding_date",
        decision_intent="wedding-date-compare-dates",
        evaluate_intake=evaluate_wedding_date_intake,
        build_request=_build_wedding_date_compare_request,
        semantics=WeddingDateTimingOptCompareSemantics(),
        incomplete_error_message="wedding date intake incomplete",
        incomplete_details_key="missing",
    )
)


def compare_wedding_date(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Execute wedding-date COMPARE via Timing Opt Family runtime."""
    return compare_timing_opt(
        WEDDING_DATE_COMPARE_TYPE_CONFIG,
        case_id=case_id,
        case_version=case_version,
        intake=intake,
        generate_outcome=generate_outcome,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


WEDDING_DATE_COMPARE_RUNTIME = bind_timing_opt_compare_runtime(
    WEDDING_DATE_COMPARE_TYPE_CONFIG,
    compare_wedding_date,
)

__all__ = [
    "REAL_ENGINE_ID",
    "WEDDING_DATE_COMPARE_RUNTIME",
    "WEDDING_DATE_COMPARE_TYPE_CONFIG",
    "compare_wedding_date",
]
