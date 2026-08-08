"""Generic contract for Decision Type COMPARE runtimes.

Separate from EvaluateRuntimeContract — compare mode must not bind through
the evaluate-only contract.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping, Protocol

from packages.decision_engine.package_models import DecisionEvaluationPackage


class IntakeCompletenessFn(Protocol):
    def __call__(self, intake: Mapping[str, Any]) -> Any: ...


class ComparePackageFn(Protocol):
    def __call__(
        self,
        *,
        case_id: Any,
        case_version: int,
        intake: Mapping[str, Any],
        generate_outcome: Callable[..., Any],
    ) -> DecisionEvaluationPackage: ...


@dataclass(frozen=True)
class CompareRuntimeContract:
    """Bindings required to execute one Decision Type in COMPARE mode."""

    decision_type_id: str
    mode: str
    engine_id: str
    evaluate_intake: IntakeCompletenessFn
    compare_package: ComparePackageFn

    def __post_init__(self) -> None:
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if self.mode != "compare_dates":
            raise ValueError("CompareRuntimeContract requires compare_dates mode")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")


__all__ = [
    "ComparePackageFn",
    "CompareRuntimeContract",
    "IntakeCompletenessFn",
]
