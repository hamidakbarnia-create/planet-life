"""Runtime registry for executable EVALUATE decision types.

Dispatch is by explicit type-evaluate allowlist → EvaluateRuntimeContract.
family_id alone never activates a type.
"""

from __future__ import annotations

# Import type modules so type-evaluate allowlists are populated.
from packages.decision_engine.evaluate import car_interview_evaluate as _car  # noqa: F401
from packages.decision_engine.evaluate import (  # noqa: F401
    investor_meeting_evaluate as _investor,
)
from packages.decision_engine.evaluate import (  # noqa: F401
    offer_negotiation_evaluate as _offer_negotiation,
)
from packages.decision_engine.evaluate import (  # noqa: F401
    product_launch_evaluate as _product_launch,
)
from packages.decision_engine.evaluate import (  # noqa: F401
    wedding_date_evaluate as _wedding,
)
from packages.decision_engine.evaluate.car_interview_evaluate import (
    CAR_INTERVIEW_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.contract import EvaluateRuntimeContract
from packages.decision_engine.evaluate.investor_meeting_evaluate import (
    INVESTOR_MEETING_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.offer_negotiation_evaluate import (
    OFFER_NEGOTIATION_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.product_launch_evaluate import (
    PRODUCT_LAUNCH_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.type_evaluate_config import (
    get_type_evaluate_config,
)
from packages.decision_engine.evaluate.type_timing_opt_evaluate_config import (
    get_timing_opt_type_evaluate_config,
)
from packages.decision_engine.evaluate.wedding_date_evaluate import (
    WEDDING_DATE_EVALUATE_RUNTIME,
)

_RUNTIMES: dict[str, EvaluateRuntimeContract] = {
    CAR_INTERVIEW_EVALUATE_RUNTIME.decision_type_id: CAR_INTERVIEW_EVALUATE_RUNTIME,
    INVESTOR_MEETING_EVALUATE_RUNTIME.decision_type_id: INVESTOR_MEETING_EVALUATE_RUNTIME,
    WEDDING_DATE_EVALUATE_RUNTIME.decision_type_id: WEDDING_DATE_EVALUATE_RUNTIME,
    PRODUCT_LAUNCH_EVALUATE_RUNTIME.decision_type_id: PRODUCT_LAUNCH_EVALUATE_RUNTIME,
    OFFER_NEGOTIATION_EVALUATE_RUNTIME.decision_type_id: (
        OFFER_NEGOTIATION_EVALUATE_RUNTIME
    ),
}


def get_evaluate_runtime(decision_type_id: str) -> EvaluateRuntimeContract | None:
    """Return runtime only for allowlisted type-evaluate config entries."""
    if (
        get_type_evaluate_config(decision_type_id) is None
        and get_timing_opt_type_evaluate_config(decision_type_id) is None
    ):
        return None
    return _RUNTIMES.get(decision_type_id)
