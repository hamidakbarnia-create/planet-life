"""Explicit Timing Opt TypeEvaluateConfig allowlist for EVALUATE runtimes.

Family runtime alone never activates a Decision Type. Only types registered
here may execute timing_opt EVALUATE. This is intentionally NOT
"every type with family_id=timing_opt".
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

TimingOptFamilyId = Literal["timing_opt"]


class TimingOptSemantics(Protocol):
    """Type-specific Package wording for Timing Opt EVALUATE."""

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
class TimingOptTypeEvaluateConfig:
    """Allowlisted Decision Type configuration for Timing Opt EVALUATE."""

    decision_type_id: str
    family_id: TimingOptFamilyId
    engine_id: str
    action_type: str
    decision_intent: str
    evaluate_intake: IntakeCompletenessFn
    build_request: BuildRequestFn
    semantics: TimingOptSemantics
    incomplete_error_message: str
    incomplete_details_key: str

    def __post_init__(self) -> None:
        if self.family_id != "timing_opt":
            raise ValueError(
                "TimingOptTypeEvaluateConfig requires "
                f"family_id='timing_opt'; got {self.family_id!r}"
            )
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")
        if not self.action_type.strip():
            raise ValueError("action_type required")


_TIMING_OPT_TYPE_EVALUATE_CONFIGS: dict[str, TimingOptTypeEvaluateConfig] = {}


def register_timing_opt_type_evaluate_config(
    config: TimingOptTypeEvaluateConfig,
) -> TimingOptTypeEvaluateConfig:
    if config.family_id != "timing_opt":
        raise ValueError(
            f"cannot register {config.decision_type_id}: "
            f"family_id must be 'timing_opt', got {config.family_id!r}"
        )
    existing = _TIMING_OPT_TYPE_EVALUATE_CONFIGS.get(config.decision_type_id)
    if existing is not None and existing is not config:
        raise ValueError(
            f"duplicate TimingOptTypeEvaluateConfig for {config.decision_type_id}"
        )
    _TIMING_OPT_TYPE_EVALUATE_CONFIGS[config.decision_type_id] = config
    return config


def get_timing_opt_type_evaluate_config(
    decision_type_id: str,
) -> TimingOptTypeEvaluateConfig | None:
    return _TIMING_OPT_TYPE_EVALUATE_CONFIGS.get(decision_type_id)


def clear_timing_opt_type_evaluate_configs_for_tests() -> None:
    _TIMING_OPT_TYPE_EVALUATE_CONFIGS.clear()


def bind_timing_opt_evaluate_runtime(
    config: TimingOptTypeEvaluateConfig,
    evaluate_package: Callable[..., DecisionEvaluationPackage],
) -> EvaluateRuntimeContract:
    return EvaluateRuntimeContract(
        decision_type_id=config.decision_type_id,
        mode="evaluate_date",
        engine_id=config.engine_id,
        evaluate_intake=config.evaluate_intake,
        evaluate_package=evaluate_package,
    )


__all__ = [
    "TimingOptFamilyId",
    "TimingOptSemantics",
    "TimingOptTypeEvaluateConfig",
    "bind_timing_opt_evaluate_runtime",
    "clear_timing_opt_type_evaluate_configs_for_tests",
    "get_timing_opt_type_evaluate_config",
    "register_timing_opt_type_evaluate_config",
]
