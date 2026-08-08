from packages.decision_engine.intake.evaluator import evaluate_wedding_date_intake
from packages.decision_engine.intake.wedding_date import (
    REQUIRED_SLOT_IDS,
    WEDDING_DATE_DECISION_TYPE_ID,
    assert_wedding_date_registered,
    merge_wedding_date_intake,
)


def test_wedding_date_registered_timing_opt():
    assert_wedding_date_registered()
    assert WEDDING_DATE_DECISION_TYPE_ID == "mar-wedding-date"
    assert REQUIRED_SLOT_IDS == frozenset({"target_date", "ceremony_type"})


def test_required_slots_gate_completeness():
    incomplete = evaluate_wedding_date_intake({"target_date": "2026-09-01"})
    assert incomplete.is_complete is False
    assert incomplete.missing_required == ("ceremony_type",)

    complete = evaluate_wedding_date_intake(
        {
            "target_date": "2026-09-01",
            "ceremony_type": "civil",
        }
    )
    assert complete.is_complete is True
    assert complete.missing_required == ()


def test_merge_does_not_invent_ceremony_type():
    merged = merge_wedding_date_intake(
        {"target_date": "2026-09-01"},
        {"partner_name": "Alex"},
    )
    assert merged.ceremony_type is None
    assert merged.partner_name == "Alex"
