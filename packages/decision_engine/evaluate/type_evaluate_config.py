"""Explicit TypeEvaluateConfig allowlist for EVALUATE runtimes.

Family runtime alone never activates a Decision Type. Only types registered
here may execute. This is intentionally NOT "every type with family_id=X".
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Literal, Mapping, Protocol

from packages.decision_engine.evaluate.contract import (
    EvaluateRuntimeContract,
    IntakeCompletenessFn,
)
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

VisibilityFamilyId = Literal["visibility"]


class VisibilitySemantics(Protocol):
    """Type-specific Package wording / conditions for Visibility EVALUATE."""

    def insufficient_summary(self, answers: Any, target_date: str) -> str: ...

    def insufficient_action(self) -> str: ...

    def insufficient_counter_reason(self) -> str: ...

    def insufficient_limits(self) -> list[str]: ...

    def insufficient_timing_notes(self) -> str: ...

    def insufficient_confidence_message(self) -> str: ...

    def scored_summary(
        self,
        answers: Any,
        *,
        target_date: str,
        rating: str,
        outcome: DecisionOutcome,
    ) -> str: ...

    def scored_conditions(self, answers: Any) -> list[str]: ...

    def scored_evidence_limits(self) -> list[str]: ...

    def scored_timing_notes(self, *, rating: str) -> str: ...

    def scored_action_step(self, target_date: str) -> str: ...

    def scored_assumptions(self, *, event_location_supplied: bool) -> list[str]: ...

    def scored_limits(self) -> list[str]: ...

    def scored_improve_accuracy(self) -> list[str]: ...

    def scored_counter_reason(self) -> str: ...

    def scored_confidence_unavailable_message(self) -> str: ...


BuildRequestFn = Callable[
    [Mapping[str, Any], str],
    tuple[DecisionRequest, bool],
]


@dataclass(frozen=True)
class TypeEvaluateConfig:
    """Allowlisted Decision Type configuration for Visibility EVALUATE."""

    decision_type_id: str
    family_id: VisibilityFamilyId
    engine_id: str
    action_type: str
    decision_intent: str
    evaluate_intake: IntakeCompletenessFn
    build_request: BuildRequestFn
    semantics: VisibilitySemantics
    incomplete_error_message: str
    incomplete_details_key: str  # "missing_required" | "missing"

    def __post_init__(self) -> None:
        if self.family_id != "visibility":
            raise ValueError(
                "TypeEvaluateConfig for Visibility EVALUATE requires "
                f"family_id='visibility'; got {self.family_id!r}"
            )
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")
        if not self.action_type.strip():
            raise ValueError("action_type required")


# Populated by type modules at import time via register_type_evaluate_config.
_TYPE_EVALUATE_CONFIGS: dict[str, TypeEvaluateConfig] = {}


def register_type_evaluate_config(config: TypeEvaluateConfig) -> TypeEvaluateConfig:
    """Register an allowlisted type. Rejects family_id mismatches."""
    if config.family_id != "visibility":
        raise ValueError(
            f"cannot register {config.decision_type_id}: "
            f"family_id must be 'visibility', got {config.family_id!r}"
        )
    existing = _TYPE_EVALUATE_CONFIGS.get(config.decision_type_id)
    if existing is not None and existing is not config:
        raise ValueError(
            f"duplicate TypeEvaluateConfig for {config.decision_type_id}"
        )
    _TYPE_EVALUATE_CONFIGS[config.decision_type_id] = config
    return config


def get_type_evaluate_config(
    decision_type_id: str,
) -> TypeEvaluateConfig | None:
    return _TYPE_EVALUATE_CONFIGS.get(decision_type_id)


def list_type_evaluate_configs() -> tuple[TypeEvaluateConfig, ...]:
    return tuple(_TYPE_EVALUATE_CONFIGS[k] for k in sorted(_TYPE_EVALUATE_CONFIGS))


def clear_type_evaluate_configs_for_tests() -> None:
    """Test helper — do not use in production code."""
    _TYPE_EVALUATE_CONFIGS.clear()


def bind_evaluate_runtime(
    config: TypeEvaluateConfig,
    evaluate_package: Callable[..., DecisionEvaluationPackage],
) -> EvaluateRuntimeContract:
    """Build external EvaluateRuntimeContract for API dispatch."""
    return EvaluateRuntimeContract(
        decision_type_id=config.decision_type_id,
        mode="evaluate_date",
        engine_id=config.engine_id,
        evaluate_intake=config.evaluate_intake,
        evaluate_package=evaluate_package,
    )


__all__ = [
    "TypeEvaluateConfig",
    "VisibilitySemantics",
    "bind_evaluate_runtime",
    "clear_type_evaluate_configs_for_tests",
    "get_type_evaluate_config",
    "list_type_evaluate_configs",
    "register_type_evaluate_config",
]
