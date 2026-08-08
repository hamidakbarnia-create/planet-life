from packages.decision_engine.intake.evaluator import (
    evaluate_investor_meeting_intake,
)
from packages.decision_engine.intake.investor_meeting import (
    INVESTOR_MEETING_DECISION_TYPE_ID,
    assert_investor_meeting_registered,
)


def test_investor_meeting_registry_binding():
    assert INVESTOR_MEETING_DECISION_TYPE_ID == "bus-investor-meeting"
    assert_investor_meeting_registered()


def test_investor_meeting_requires_date_and_goal():
    result = evaluate_investor_meeting_intake({})
    assert result.is_complete is False
    assert result.missing_required == ("target_date", "meeting_goal")


def test_investor_meeting_accepts_required_fields():
    result = evaluate_investor_meeting_intake(
        {
            "target_date": "2026-09-01",
            "meeting_goal": "Pitch seed round",
        }
    )

    assert result.is_complete is True
    assert result.missing_required == ()
    assert result.intake.target_date == "2026-09-01"
    assert result.intake.meeting_goal == "Pitch seed round"


def test_optional_fields_do_not_block():
    result = evaluate_investor_meeting_intake(
        {
            "target_date": "2026-09-01",
            "meeting_goal": "Pitch seed round",
            "investor_name": "Example VC",
            "meeting_type": "pitch",
        }
    )

    assert result.is_complete is True
    assert result.intake.investor_name == "Example VC"
    assert result.intake.meeting_type == "pitch"
