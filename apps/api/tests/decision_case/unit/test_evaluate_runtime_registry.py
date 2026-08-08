"""Fail-closed evaluate runtime registry (TypeEvaluateConfig allowlist)."""

from __future__ import annotations

from decision_case.services.evaluate_runtime_registry import get_evaluate_runtime
from packages.decision_engine.evaluate.car_interview_evaluate import (
    CAR_INTERVIEW_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.investor_meeting_evaluate import (
    INVESTOR_MEETING_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.product_launch_evaluate import (
    PRODUCT_LAUNCH_EVALUATE_RUNTIME,
)
from packages.decision_engine.evaluate.wedding_date_evaluate import (
    WEDDING_DATE_EVALUATE_RUNTIME,
)


def test_allowlisted_types_resolve() -> None:
    assert get_evaluate_runtime("car-interview") is CAR_INTERVIEW_EVALUATE_RUNTIME
    assert (
        get_evaluate_runtime("bus-investor-meeting")
        is INVESTOR_MEETING_EVALUATE_RUNTIME
    )
    assert get_evaluate_runtime("mar-wedding-date") is WEDDING_DATE_EVALUATE_RUNTIME
    assert get_evaluate_runtime("bus-product-launch") is PRODUCT_LAUNCH_EVALUATE_RUNTIME


def test_mar_wedding_date_has_timing_opt_runtime() -> None:
    runtime = get_evaluate_runtime("mar-wedding-date")
    assert runtime is not None
    assert runtime.decision_type_id == "mar-wedding-date"
    assert runtime.engine_id == "decision-engine-wedding-date-v1"
    assert runtime.mode == "evaluate_date"


def test_bus_product_launch_has_timing_opt_runtime() -> None:
    runtime = get_evaluate_runtime("bus-product-launch")
    assert runtime is not None
    assert runtime.decision_type_id == "bus-product-launch"
    assert runtime.engine_id == "decision-engine-product-launch-v1"
    assert runtime.mode == "evaluate_date"


def test_unknown_type_has_no_runtime() -> None:
    assert get_evaluate_runtime("not-a-type") is None


def test_family_id_alone_does_not_activate() -> None:
    # tim-compare-three is timing_opt; no visibility unconfigured type exists
    # in the 4-type registry. Unknown id proves allowlist, not family, gates.
    assert get_evaluate_runtime("tim-compare-three") is None
