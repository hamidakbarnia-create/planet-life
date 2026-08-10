"""Explicit Visibility TypeFindConfig allowlist for FIND runtimes.

Family runtime alone never activates a Decision Type. Only types registered
here may execute visibility FIND. This is intentionally NOT
"every type with family_id=visibility" and NOT every type that allows
find_dates in the registry.
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

VisibilityFamilyId = Literal["visibility"]


class VisibilityFindSemantics(Protocol):
    """Type-specific Package wording for Visibility FIND."""

    def insufficient_summary(
        self, answers: Any, *, range_start: str, range_end: str
    ) -> str: ...

    def insufficient_action(self) -> str: ...

    def insufficient_counter_reason(self) -> str: ...

    def insufficient_limits(self) -> list[str]: ...

    def insufficient_timing_notes(self) -> str: ...

    def insufficient_confidence_message(self) -> str: ...

    def insufficient_why_not(self) -> str: ...

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

    def scored_opportunities(self, *, has_windows: bool) -> list[str]: ...

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
class VisibilityTypeFindConfig:
    """Allowlisted Decision Type configuration for Visibility FIND."""

    decision_type_id: str
    family_id: VisibilityFamilyId
    engine_id: str
    action_type: str
    decision_intent: str
    evaluate_intake: IntakeCompletenessFn
    build_request: BuildRequestFn
    semantics: VisibilityFindSemantics
    incomplete_error_message: str
    incomplete_details_key: str

    def __post_init__(self) -> None:
        if self.family_id != "visibility":
            raise ValueError(
                "VisibilityTypeFindConfig requires "
                f"family_id='visibility'; got {self.family_id!r}"
            )
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")
        if not self.action_type.strip():
            raise ValueError("action_type required")


_VISIBILITY_TYPE_FIND_CONFIGS: dict[str, VisibilityTypeFindConfig] = {}


def register_visibility_type_find_config(
    config: VisibilityTypeFindConfig,
) -> VisibilityTypeFindConfig:
    if config.family_id != "visibility":
        raise ValueError(
            f"cannot register {config.decision_type_id}: "
            f"family_id must be 'visibility', got {config.family_id!r}"
        )
    existing = _VISIBILITY_TYPE_FIND_CONFIGS.get(config.decision_type_id)
    if existing is not None and existing is not config:
        raise ValueError(
            f"duplicate VisibilityTypeFindConfig for {config.decision_type_id}"
        )
    _VISIBILITY_TYPE_FIND_CONFIGS[config.decision_type_id] = config
    return config


def get_visibility_type_find_config(
    decision_type_id: str,
) -> VisibilityTypeFindConfig | None:
    return _VISIBILITY_TYPE_FIND_CONFIGS.get(decision_type_id)


def clear_visibility_type_find_configs_for_tests() -> None:
    _VISIBILITY_TYPE_FIND_CONFIGS.clear()


def bind_visibility_find_runtime(
    config: VisibilityTypeFindConfig,
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
    "VisibilityFamilyId",
    "VisibilityFindSemantics",
    "VisibilityTypeFindConfig",
    "bind_visibility_find_runtime",
    "clear_visibility_type_find_configs_for_tests",
    "get_visibility_type_find_config",
    "register_visibility_type_find_config",
]
