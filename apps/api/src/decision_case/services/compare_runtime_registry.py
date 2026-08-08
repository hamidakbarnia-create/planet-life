"""Runtime registry for executable COMPARE decision types.

Dispatch is by explicit type-compare allowlist → CompareRuntimeContract.
family_id alone never activates a type. Registry allowed_modes alone is
insufficient.
"""

from __future__ import annotations

from packages.decision_engine.evaluate import wedding_date_compare as _wedding  # noqa: F401
from packages.decision_engine.evaluate.compare_contract import CompareRuntimeContract
from packages.decision_engine.evaluate.type_timing_opt_compare_config import (
    get_timing_opt_type_compare_config,
)
from packages.decision_engine.evaluate.wedding_date_compare import (
    WEDDING_DATE_COMPARE_RUNTIME,
)

_RUNTIMES: dict[str, CompareRuntimeContract] = {
    WEDDING_DATE_COMPARE_RUNTIME.decision_type_id: WEDDING_DATE_COMPARE_RUNTIME,
}


def get_compare_runtime(decision_type_id: str) -> CompareRuntimeContract | None:
    """Return runtime only for allowlisted type-compare config entries."""
    if get_timing_opt_type_compare_config(decision_type_id) is None:
        return None
    return _RUNTIMES.get(decision_type_id)
