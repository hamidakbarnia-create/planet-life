"""Registry of shipped FIND runtimes (fail-closed)."""

from __future__ import annotations

from packages.decision_engine.evaluate.find_contract import FindRuntimeContract
from packages.decision_engine.evaluate.product_launch_find import (
    PRODUCT_LAUNCH_FIND_RUNTIME,
)

_FIND_RUNTIMES: dict[str, FindRuntimeContract] = {
    PRODUCT_LAUNCH_FIND_RUNTIME.decision_type_id: PRODUCT_LAUNCH_FIND_RUNTIME,
}


def get_find_runtime(decision_type_id: str) -> FindRuntimeContract | None:
    return _FIND_RUNTIMES.get(decision_type_id)


__all__ = ["get_find_runtime"]
