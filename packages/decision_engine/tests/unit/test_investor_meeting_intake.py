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


def test_compare_mode_requires_goal_not_target_date():
    incomplete = evaluate_investor_meeting_intake(
        {
            "decision_frame": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": ["2026-09-10", "2026-09-18"],
            }
        }
    )
    assert incomplete.is_complete is False
    assert set(incomplete.missing_required) == {"meeting_goal"}

    complete = evaluate_investor_meeting_intake(
        {
            "meeting_goal": "Raise seed",
            "decision_frame": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": ["2026-09-10", "2026-09-18"],
            },
        }
    )
    assert complete.is_complete is True
    assert complete.missing_required == ()
    assert complete.intake.target_date is None


def test_evaluate_mode_still_requires_target_date():
    result = evaluate_investor_meeting_intake(
        {"meeting_goal": "Raise seed"},
        mode="evaluate_date",
    )
    assert result.is_complete is False
    assert "target_date" in result.missing_required
