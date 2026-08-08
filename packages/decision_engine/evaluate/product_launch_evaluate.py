"""bus-product-launch EVALUATE — TimingOptTypeEvaluateConfig + Timing Opt runtime."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping
from uuid import UUID

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from packages.decision_engine.evaluate.timing_opt_evaluate import evaluate_timing_opt
from packages.decision_engine.evaluate.timing_opt_semantics import (
    ProductLaunchTimingOptSemantics,
)
from packages.decision_engine.evaluate.type_timing_opt_evaluate_config import (
    TimingOptTypeEvaluateConfig,
    bind_timing_opt_evaluate_runtime,
    register_timing_opt_type_evaluate_config,
)
from packages.decision_engine.intake.evaluator import evaluate_product_launch_intake
from packages.decision_engine.intake.product_launch import (
    PRODUCT_LAUNCH_DECISION_TYPE_ID,
)
from packages.decision_engine.models import DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

REAL_ENGINE_ID = "decision-engine-product-launch-v1"


def _build_product_launch_request(
    natal: Mapping[str, Any],
    target_date: str,
) -> tuple[DecisionRequest, bool]:
    request = DecisionRequest(
        module_origin="ask",
        decision_intent="product-launch-evaluate-date",
        birth_date=natal["birth_date"],
        birth_time=natal["birth_time"],
        location=natal["location"],
        target_date=target_date,
        action_type="business_launch",
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=natal.get("latitude"),
        longitude=natal.get("longitude"),
        evaluation_location=natal.get("evaluation_location"),
        evaluation_latitude=natal.get("evaluation_latitude"),
        evaluation_longitude=natal.get("evaluation_longitude"),
    )
    return request, bool(natal.get("evaluation_location"))


PRODUCT_LAUNCH_TYPE_CONFIG = register_timing_opt_type_evaluate_config(
    TimingOptTypeEvaluateConfig(
        decision_type_id=PRODUCT_LAUNCH_DECISION_TYPE_ID,
        family_id="timing_opt",
        engine_id=REAL_ENGINE_ID,
        action_type="business_launch",
        decision_intent="product-launch-evaluate-date",
        evaluate_intake=evaluate_product_launch_intake,
        build_request=_build_product_launch_request,
        semantics=ProductLaunchTimingOptSemantics(),
        incomplete_error_message="product launch intake incomplete",
        incomplete_details_key="missing",
    )
)


def evaluate_product_launch(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Execute product-launch EVALUATE via Timing Opt Family runtime."""
    return evaluate_timing_opt(
        PRODUCT_LAUNCH_TYPE_CONFIG,
        case_id=case_id,
        case_version=case_version,
        intake=intake,
        generate_outcome=generate_outcome,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


PRODUCT_LAUNCH_EVALUATE_RUNTIME = bind_timing_opt_evaluate_runtime(
    PRODUCT_LAUNCH_TYPE_CONFIG,
    evaluate_product_launch,
)

__all__ = [
    "REAL_ENGINE_ID",
    "PRODUCT_LAUNCH_EVALUATE_RUNTIME",
    "PRODUCT_LAUNCH_TYPE_CONFIG",
    "evaluate_product_launch",
]
