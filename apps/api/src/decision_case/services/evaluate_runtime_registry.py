"""Runtime registry for executable EVALUATE decision types.

Dispatch is by explicit TypeEvaluateConfig allowlist → EvaluateRuntimeContract.
family_id alone never activates a type.
"""

from __future__ import annotations

# Import type modules so TypeEvaluateConfig allowlist is populated.
from packages.decision_engine.evaluate import car_interview_evaluate as _car  # noqa: F401
from packages.decision_engine.evaluate import (  # noqa: F401
    investor_meeting_evaluate as _investor,
)
from packages.decision_engine.evaluate.car_interview_evaluate import (
    CAR_INTERVIEW_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.contract import EvaluateRuntimeContract
from packages.decision_engine.evaluate.investor_meeting_evaluate import (
    INVESTOR_MEETING_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.type_evaluate_config import (
    get_type_evaluate_config,
)

_RUNTIMES: dict[str, EvaluateRuntimeContract] = {
    CAR_INTERVIEW_EVALUATE_RUNTIME.decision_type_id: CAR_INTERVIEW_EVALUATE_RUNTIME,
    INVESTOR_MEETING_EVALUATE_RUNTIME.decision_type_id: INVESTOR_MEETING_EVALUATE_RUNTIME,
}


def get_evaluate_runtime(decision_type_id: str) -> EvaluateRuntimeContract | None:
    """Return runtime only for allowlisted TypeEvaluateConfig entries."""
    if get_type_evaluate_config(decision_type_id) is None:
        return None
    return _RUNTIMES.get(decision_type_id)
