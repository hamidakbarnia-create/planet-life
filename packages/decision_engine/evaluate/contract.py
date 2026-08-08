"""Generic contract for Decision Type EVALUATE runtimes."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping, Protocol

from packages.decision_engine.package_models import DecisionEvaluationPackage


class IntakeCompletenessFn(Protocol):
    def __call__(self, intake: Mapping[str, Any]) -> Any: ...


class EvaluatePackageFn(Protocol):
    def __call__(
        self,
        *,
        case_id: Any,
        case_version: int,
        intake: Mapping[str, Any],
        generate_outcome: Callable[..., Any],
    ) -> DecisionEvaluationPackage: ...


@dataclass(frozen=True)
class EvaluateRuntimeContract:
    """Bindings required to execute one Decision Type in EVALUATE mode."""

    decision_type_id: str
    mode: str
    engine_id: str
    evaluate_intake: IntakeCompletenessFn
    evaluate_package: EvaluatePackageFn

    def __post_init__(self) -> None:
        if not self.decision_type_id.strip():
            raise ValueError("decision_type_id required")
        if self.mode != "evaluate_date":
            raise ValueError("EvaluateRuntimeContract requires evaluate_date mode")
        if not self.engine_id.strip():
            raise ValueError("engine_id required")
