"""Explicit Timing Opt TypeFindConfig allowlist for FIND runtimes.

Family runtime alone never activates a Decision Type. Only types registered
here may execute timing_opt FIND.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Literal, Mapping, Protocol

from packages.decision_engine.evaluate.find_contract import (
    FindRuntimeContract,
    IntakeCompletenessFn,
)
from packages.decision_engine.models import DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

TimingOptFamilyId = Literal["timing_opt"]


class TimingOptFindSemantics(Protocol):
    """Type-specific Package wording for Timing Opt FIND."""

    def insufficient_summary(
        self, answers: Any, *, range_start: str, range_end: str
    ) -> str: ...

    def insufficient_action(self) -> str: ...

    def insufficient_counter_reason(self) -> str: ...

    def insufficient_limits(self) -> list[str]: ...

    def insufficient_timing_notes(self) -> str: ...

    def insufficient_confidence_message(self) -> str: ...

    def scored_summary(
        self,
        answers: Any,
        *,
        unique_dominant: bool,
        window_labels: list[str],
        tied_labels: list[str],
        no_strong_window: bool,
    ) -> str: ...

    def scored_conditions(self, answers: Any) -> list[str]: ...

    def scored_evidence_limits(self) -> list[str]: ...

    def scored_timing_notes(
        self, *, unique_dominant: bool, no_strong_window: bool
    ) -> str: ...

    def scored_action_step(
        self,
        *,
        unique_dominant: bool,
        window_labels: list[str],
        tied_labels: list[str],
        no_strong_window: bool,
    ) -> str: ...

    def scored_assumptions(
        self, *, event_location_supplied: bool, timezone: str
    ) -> list[str]: ...

    def scored_limits(self) -> list[str]: ...

    def scored_improve_accuracy(self) -> list[str]: ...

    def scored_counter_reason(
        self, *, unique_dominant: bool, no_strong_window: bool
    ) -> str: ...

    def scored_confidence_unavailable_message(self) -> str: ...

    def relative_explanation(
        self,
        *,
        unique_dominant: bool,
        no_strong_window: bool,
        window_labels: list[str],
        peak_scores: list[float],
        tied_labels: list[str],
    ) -> tuple[str, str]: ...

    def option_strengths(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]: ...

    def option_risks(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]: ...


BuildRequestFn = Callable[
    [Mapping[str, Any], str],
    tuple[DecisionRequest, bool],
]


@dataclass(frozen=True)
class TimingOptTypeFindConfig:
    """Allowlisted Decision Type configuration for Timing Opt FIND."""

    decision_type_id: str
    family_id: TimingOptFamilyId
    engine_id: str
    action_type: str
    decision_intent: str
    evaluate_intake: IntakeCompletenessFn
    build_request: BuildRequestFn
    semantics: TimingOptFindSemantics
    incomplete_error_message: str
    incomplete_details_key: str

    def __post_init__(self) -> None:
        if self.family_id != "timing_opt":
            raise ValueError(
                "TimingOptTypeFindConfig requires "
                f"family_id='timing_opt'; got {self.family_id!r}"
            )
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")
        if not self.action_type.strip():
            raise ValueError("action_type required")


_TIMING_OPT_TYPE_FIND_CONFIGS: dict[str, TimingOptTypeFindConfig] = {}


def register_timing_opt_type_find_config(
    config: TimingOptTypeFindConfig,
) -> TimingOptTypeFindConfig:
    if config.family_id != "timing_opt":
        raise ValueError(
            f"cannot register {config.decision_type_id}: "
            f"family_id must be 'timing_opt', got {config.family_id!r}"
        )
    existing = _TIMING_OPT_TYPE_FIND_CONFIGS.get(config.decision_type_id)
    if existing is not None and existing is not config:
        raise ValueError(
            f"duplicate TimingOptTypeFindConfig for {config.decision_type_id}"
        )
    _TIMING_OPT_TYPE_FIND_CONFIGS[config.decision_type_id] = config
    return config


def get_timing_opt_type_find_config(
    decision_type_id: str,
) -> TimingOptTypeFindConfig | None:
    return _TIMING_OPT_TYPE_FIND_CONFIGS.get(decision_type_id)


def clear_timing_opt_type_find_configs_for_tests() -> None:
    _TIMING_OPT_TYPE_FIND_CONFIGS.clear()


def bind_timing_opt_find_runtime(
    config: TimingOptTypeFindConfig,
    find_package: Callable[..., DecisionEvaluationPackage],
) -> FindRuntimeContract:
    return FindRuntimeContract(
        decision_type_id=config.decision_type_id,
        mode="find_dates",
        engine_id=config.engine_id,
        evaluate_intake=config.evaluate_intake,
        find_package=find_package,
    )


__all__ = [
    "TimingOptFamilyId",
    "TimingOptFindSemantics",
    "TimingOptTypeFindConfig",
    "bind_timing_opt_find_runtime",
    "clear_timing_opt_type_find_configs_for_tests",
    "get_timing_opt_type_find_config",
    "register_timing_opt_type_find_config",
]
