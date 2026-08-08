"""Timing Opt Family EVALUATE runtime (shared spine).

Orchestrates evaluate_date for allowlisted Timing Opt Decision Types.
Decision Type configuration supplies intake, request building, and Package
semantics. family_id alone never activates a type.

Package assembly helpers are reused from the Visibility spine because Package
v1 envelope mapping is family-agnostic; family gating stays in this module.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from typing import Mapping
from uuid import UUID

from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeProviderError,
    extract_evaluate_date_from_framing,
    extract_natal_evidence,
)
from packages.decision_engine.evaluate.type_timing_opt_evaluate_config import (
    TimingOptTypeEvaluateConfig,
)
from packages.decision_engine.evaluate.visibility_evaluate import (
    assemble_package_from_outcome,
    build_insufficient_natal_package,
)
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

GenerateOutcomeFn = Callable[[DecisionRequest], DecisionOutcome]


def evaluate_timing_opt(
    config: TimingOptTypeEvaluateConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, object],
    generate_outcome: GenerateOutcomeFn,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Shared Timing Opt Family EVALUATE spine for an allowlisted type config."""
    if config.family_id != "timing_opt":
        raise ValueError(
            "evaluate_timing_opt requires family_id='timing_opt'; "
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
            "DecisionRequest.action_type must match "
            "TimingOptTypeEvaluateConfig.action_type"
        )

    try:
        outcome = generate_outcome(request)
    except Exception as exc:  # noqa: BLE001 — surface as provider failure
        raise RuntimeProviderError(
            "scoring provider failed",
            details={"error_type": type(exc).__name__},
        ) from exc

    return assemble_package_from_outcome(
        outcome,
        config,
        case_id=case_id,
        case_version=case_version,
        target_date=target_date,
        answers=answers,
        evaluation_id=evaluation_id,
        created_at=created_at,
        event_location_supplied=event_location_supplied,
    )


__all__ = ["evaluate_timing_opt"]
