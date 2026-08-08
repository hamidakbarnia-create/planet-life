"""Runtime registry for executable EVALUATE decision types."""

from packages.decision_engine.evaluate.car_interview_evaluate import (
    CAR_INTERVIEW_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.investor_meeting_evaluate import (
    INVESTOR_MEETING_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.contract import EvaluateRuntimeContract


_RUNTIMES: dict[str, EvaluateRuntimeContract] = {
    CAR_INTERVIEW_EVALUATE_RUNTIME.decision_type_id: CAR_INTERVIEW_EVALUATE_RUNTIME,
    INVESTOR_MEETING_EVALUATE_RUNTIME.decision_type_id: INVESTOR_MEETING_EVALUATE_RUNTIME,
}


def get_evaluate_runtime(decision_type_id: str) -> EvaluateRuntimeContract | None:
    return _RUNTIMES.get(decision_type_id)
