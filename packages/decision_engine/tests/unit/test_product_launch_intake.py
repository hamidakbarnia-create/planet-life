from packages.decision_engine.intake.evaluator import evaluate_product_launch_intake
from packages.decision_engine.intake.product_launch import (
    REQUIRED_SLOT_IDS,
    PRODUCT_LAUNCH_DECISION_TYPE_ID,
    assert_product_launch_registered,
    merge_product_launch_intake,
)


def test_product_launch_registered_timing_opt():
    assert_product_launch_registered()
    assert PRODUCT_LAUNCH_DECISION_TYPE_ID == "bus-product-launch"
    assert REQUIRED_SLOT_IDS == frozenset({"target_date", "launch_object"})


def test_required_slots_gate_completeness():
    incomplete = evaluate_product_launch_intake({"target_date": "2026-09-01"})
    assert incomplete.is_complete is False
    assert incomplete.missing_required == ("launch_object",)

    complete = evaluate_product_launch_intake(
        {
            "target_date": "2026-09-01",
            "launch_object": "mobile app v2",
        }
    )
    assert complete.is_complete is True
    assert complete.missing_required == ()


def test_merge_does_not_invent_launch_object():
    merged = merge_product_launch_intake(
        {"target_date": "2026-09-01"},
        {"brand_or_company": "Acme"},
    )
    assert merged.launch_object is None
    assert merged.brand_or_company == "Acme"
