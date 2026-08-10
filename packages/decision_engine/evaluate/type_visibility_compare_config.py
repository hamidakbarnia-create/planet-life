"""Explicit Visibility TypeCompareConfig allowlist for COMPARE runtimes.

Family runtime alone never activates a Decision Type. Only types registered
here may execute visibility COMPARE. This is intentionally NOT
"every type with family_id=visibility" and NOT every type that allows
compare_dates in the registry.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Literal, Mapping, Protocol

from packages.decision_engine.evaluate.compare_contract import (
    CompareRuntimeContract,
    IntakeCompletenessFn,
)
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

VisibilityFamilyId = Literal["visibility"]


class VisibilityCompareSemantics(Protocol):
    """Type-specific Package wording for Visibility COMPARE."""

    def insufficient_summary(self, answers: Any, option_labels: list[str]) -> str: ...

    def insufficient_action(self) -> str: ...

    def insufficient_counter_reason(self) -> str: ...

    def insufficient_limits(self) -> list[str]: ...

    def insufficient_timing_notes(self) -> str: ...

    def insufficient_confidence_message(self) -> str: ...

    def scored_summary(
        self,
        answers: Any,
        *,
        unique_winner: bool,
        winner_label: str | None,
        tied_labels: list[str],
    ) -> str: ...

    def scored_conditions(self, answers: Any) -> list[str]: ...

    def scored_evidence_limits(self) -> list[str]: ...

    def scored_timing_notes(self, *, unique_winner: bool) -> str: ...

    def scored_action_step(
        self,
        *,
        unique_winner: bool,
        winner_label: str | None,
        tied_labels: list[str],
    ) -> str: ...

    def scored_assumptions(self, *, event_location_supplied: bool) -> list[str]: ...

    def scored_limits(self) -> list[str]: ...

    def scored_improve_accuracy(self) -> list[str]: ...

    def scored_counter_reason(self, *, unique_winner: bool) -> str: ...

    def scored_confidence_unavailable_message(self) -> str: ...

    def relative_explanation(
        self,
        *,
        unique_winner: bool,
        ranked_labels: list[str],
        ranked_scores: list[float],
        tied_labels: list[str],
    ) -> tuple[str, str]: ...

    def option_strengths(self, *, score: float, band: str, rating: str) -> tuple[str, ...]: ...

    def option_risks(self, *, score: float, band: str, rating: str) -> tuple[str, ...]: ...


BuildRequestFn = Callable[
    [Mapping[str, Any], str],
    tuple[DecisionRequest, bool],
]


@dataclass(frozen=True)
class VisibilityTypeCompareConfig:
    """Allowlisted Decision Type configuration for Visibility COMPARE."""

    decision_type_id: str
    family_id: VisibilityFamilyId
    engine_id: str
    action_type: str
    decision_intent: str
    evaluate_intake: IntakeCompletenessFn
    build_request: BuildRequestFn
    semantics: VisibilityCompareSemantics
    incomplete_error_message: str
    incomplete_details_key: str

    def __post_init__(self) -> None:
        if self.family_id != "visibility":
            raise ValueError(
                "VisibilityTypeCompareConfig requires "
                f"family_id='visibility'; got {self.family_id!r}"
            )
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")
        if not self.action_type.strip():
            raise ValueError("action_type required")


_VISIBILITY_TYPE_COMPARE_CONFIGS: dict[str, VisibilityTypeCompareConfig] = {}


def register_visibility_type_compare_config(
    config: VisibilityTypeCompareConfig,
) -> VisibilityTypeCompareConfig:
    if config.family_id != "visibility":
        raise ValueError(
            f"cannot register {config.decision_type_id}: "
            f"family_id must be 'visibility', got {config.family_id!r}"
        )
    existing = _VISIBILITY_TYPE_COMPARE_CONFIGS.get(config.decision_type_id)
    if existing is not None and existing is not config:
        raise ValueError(
            f"duplicate VisibilityTypeCompareConfig for {config.decision_type_id}"
        )
    _VISIBILITY_TYPE_COMPARE_CONFIGS[config.decision_type_id] = config
    return config


def get_visibility_type_compare_config(
    decision_type_id: str,
) -> VisibilityTypeCompareConfig | None:
    return _VISIBILITY_TYPE_COMPARE_CONFIGS.get(decision_type_id)


def clear_visibility_type_compare_configs_for_tests() -> None:
    _VISIBILITY_TYPE_COMPARE_CONFIGS.clear()


def bind_visibility_compare_runtime(
    config: VisibilityTypeCompareConfig,
    compare_package: Callable[..., DecisionEvaluationPackage],
) -> CompareRuntimeContract:
    return CompareRuntimeContract(
        decision_type_id=config.decision_type_id,
        mode="compare_dates",
        engine_id=config.engine_id,
        evaluate_intake=config.evaluate_intake,
        compare_package=compare_package,
    )


__all__ = [
    "VisibilityCompareSemantics",
    "VisibilityFamilyId",
    "VisibilityTypeCompareConfig",
    "bind_visibility_compare_runtime",
    "clear_visibility_type_compare_configs_for_tests",
    "get_visibility_type_compare_config",
    "register_visibility_type_compare_config",
]
