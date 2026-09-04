"""car-offer-negotiation EVALUATE — TypeEvaluateConfig + Visibility runtime.

EVALUATE only. No COMPARE or FIND config is registered for this type, so
those operations stay fail-closed at the runtime registries.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping
from uuid import UUID

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from packages.decision_engine.evaluate.type_evaluate_config import (
    TypeEvaluateConfig,
    bind_evaluate_runtime,
    register_type_evaluate_config,
)
from packages.decision_engine.evaluate.visibility_evaluate import evaluate_visibility
from packages.decision_engine.evaluate.visibility_semantics import (
    OfferNegotiationVisibilitySemantics,
)
from packages.decision_engine.intake.evaluator import (
    evaluate_offer_negotiation_intake,
)
from packages.decision_engine.intake.offer_negotiation import (
    OFFER_NEGOTIATION_DECISION_TYPE_ID,
)
from packages.decision_engine.models import DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

REAL_ENGINE_ID = "decision-engine-offer-negotiation-v1"

# Explicit scoring authority. offer_negotiation resolves to the negotiation
# ActivityProfile and to negotiation transit house rules, not to the default.
OFFER_NEGOTIATION_ACTION_TYPE = "offer_negotiation"


def _build_offer_negotiation_request(
    natal: Mapping[str, Any],
    target_date: str,
) -> tuple[DecisionRequest, bool]:
    request = DecisionRequest(
        module_origin="ask",
        decision_intent="offer-negotiation-evaluate-date",
        birth_date=natal["birth_date"],
        birth_time=natal["birth_time"],
        location=natal["location"],
        target_date=target_date,
        action_type=OFFER_NEGOTIATION_ACTION_TYPE,
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=natal.get("latitude"),
        longitude=natal.get("longitude"),
        evaluation_location=natal.get("evaluation_location"),
        evaluation_latitude=natal.get("evaluation_latitude"),
        evaluation_longitude=natal.get("evaluation_longitude"),
    )
    return request, bool(natal.get("evaluation_location"))


OFFER_NEGOTIATION_TYPE_CONFIG = register_type_evaluate_config(
    TypeEvaluateConfig(
        decision_type_id=OFFER_NEGOTIATION_DECISION_TYPE_ID,
        family_id="visibility",
        engine_id=REAL_ENGINE_ID,
        action_type=OFFER_NEGOTIATION_ACTION_TYPE,
        decision_intent="offer-negotiation-evaluate-date",
        evaluate_intake=evaluate_offer_negotiation_intake,
        build_request=_build_offer_negotiation_request,
        semantics=OfferNegotiationVisibilitySemantics(),
        incomplete_error_message="offer negotiation intake incomplete",
        incomplete_details_key="missing",
    )
)


def evaluate_offer_negotiation(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Execute offer-negotiation EVALUATE via Visibility Family runtime."""
    return evaluate_visibility(
        OFFER_NEGOTIATION_TYPE_CONFIG,
        case_id=case_id,
        case_version=case_version,
        intake=intake,
        generate_outcome=generate_outcome,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


OFFER_NEGOTIATION_EVALUATE_RUNTIME = bind_evaluate_runtime(
    OFFER_NEGOTIATION_TYPE_CONFIG,
    evaluate_offer_negotiation,
)

__all__ = [
    "OFFER_NEGOTIATION_ACTION_TYPE",
    "OFFER_NEGOTIATION_EVALUATE_RUNTIME",
    "OFFER_NEGOTIATION_TYPE_CONFIG",
    "REAL_ENGINE_ID",
    "evaluate_offer_negotiation",
]
