"""Generic contract for Decision Type FIND runtimes.

Separate from EvaluateRuntimeContract and CompareRuntimeContract.
FIND must not bind through generated compare options.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping, Protocol

from packages.decision_engine.package_models import DecisionEvaluationPackage


class IntakeCompletenessFn(Protocol):
    def __call__(self, intake: Mapping[str, Any]) -> Any: ...


class FindPackageFn(Protocol):
    def __call__(
        self,
        *,
        case_id: Any,
        case_version: int,
        intake: Mapping[str, Any],
        generate_outcome: Callable[..., Any],
    ) -> DecisionEvaluationPackage: ...


@dataclass(frozen=True)
class FindRuntimeContract:
    """Bindings required to execute one Decision Type in FIND mode."""

    decision_type_id: str
    mode: str
    engine_id: str
    evaluate_intake: IntakeCompletenessFn
    find_package: FindPackageFn

    def __post_init__(self) -> None:
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if self.mode != "find_dates":
            raise ValueError("FindRuntimeContract requires find_dates mode")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")


__all__ = [
    "FindPackageFn",
    "FindRuntimeContract",
    "IntakeCompletenessFn",
]
