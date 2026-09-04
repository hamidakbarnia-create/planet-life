"""car-offer-negotiation is EVALUATE-only at every runtime registry.

These assertions run without a database so the capability boundary is
verified even where the DB-backed route tests are skipped.
"""

from __future__ import annotations

from decision_case.services.compare_runtime_registry import get_compare_runtime
from decision_case.services.evaluate_runtime_registry import get_evaluate_runtime
from decision_case.services.find_runtime_registry import get_find_runtime
from packages.decision_engine.evaluate.car_interview_compare import (
    CAR_INTERVIEW_COMPARE_RUNTIME,
)
from packages.decision_engine.evaluate.car_interview_evaluate import (
    CAR_INTERVIEW_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.car_interview_find import (
    CAR_INTERVIEW_FIND_RUNTIME,
)
from packages.decision_engine.evaluate.offer_negotiation_evaluate import (
    OFFER_NEGOTIATION_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.type_evaluate_config import (
    get_type_evaluate_config,
)
from packages.decision_engine.evaluate.type_timing_opt_compare_config import (
    get_timing_opt_type_compare_config,
)
from packages.decision_engine.evaluate.type_timing_opt_evaluate_config import (
    get_timing_opt_type_evaluate_config,
)
from packages.decision_engine.evaluate.type_visibility_compare_config import (
    get_visibility_type_compare_config,
)
from packages.decision_engine.registry import get_decision_type

TYPE_ID = "car-offer-negotiation"


def test_evaluate_is_executable() -> None:
    assert get_evaluate_runtime(TYPE_ID) is OFFER_NEGOTIATION_EVALUATE_RUNTIME


def test_compare_is_not_executable() -> None:
    assert get_compare_runtime(TYPE_ID) is None


def test_find_is_not_executable() -> None:
    assert get_find_runtime(TYPE_ID) is None


def test_registry_allows_only_the_executable_mode() -> None:
    """Registry authority and shipped runtimes agree exactly."""
    allowed = get_decision_type(TYPE_ID).allowed_modes
    assert allowed == ("evaluate_date",)

    shipped = {
        "evaluate_date": get_evaluate_runtime(TYPE_ID),
        "compare_dates": get_compare_runtime(TYPE_ID),
        "find_dates": get_find_runtime(TYPE_ID),
    }
    assert {mode for mode, runtime in shipped.items() if runtime} == set(allowed)


def test_no_nearest_runtime_fallback_to_car_interview() -> None:
    """The type resolves to its own runtime or to nothing at all."""
    runtime = get_evaluate_runtime(TYPE_ID)
    assert runtime is OFFER_NEGOTIATION_EVALUATE_RUNTIME
    assert runtime is not CAR_INTERVIEW_EVALUATE_RUNTIME
    assert runtime.decision_type_id == TYPE_ID

    # Compare/Find must not silently borrow the interview implementations.
    assert get_compare_runtime(TYPE_ID) is not CAR_INTERVIEW_COMPARE_RUNTIME
    assert get_find_runtime(TYPE_ID) is not CAR_INTERVIEW_FIND_RUNTIME

    # Near-miss and unknown ids never fall back to a shipped runtime.
    for lookup in (get_evaluate_runtime, get_compare_runtime, get_find_runtime):
        assert lookup("car-offer-negotiation-compare") is None
        assert lookup("car-offer-negotiations") is None
        assert lookup("offer-negotiation") is None
        assert lookup("not-a-decision-type") is None


def test_no_compare_or_find_config_exists_for_this_type() -> None:
    """Fail-closed at the config layer, not only the runtime map."""
    assert get_visibility_type_compare_config(TYPE_ID) is None
    assert get_timing_opt_type_compare_config(TYPE_ID) is None
    # A visibility Evaluate config is the only thing this PR registered.
    assert get_type_evaluate_config(TYPE_ID) is not None
    assert get_timing_opt_type_evaluate_config(TYPE_ID) is None
