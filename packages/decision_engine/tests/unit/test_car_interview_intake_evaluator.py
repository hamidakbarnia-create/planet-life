"""PR-1 intake evaluator tests for car-interview."""

from __future__ import annotations

import pytest

from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_DECISION_TYPE_ID,
    CAR_INTERVIEW_SLOTS,
    assert_car_interview_registered,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.registry import get_decision_type


def test_car_interview_is_registered() -> None:
    assert_car_interview_registered()
    record = get_decision_type(CAR_INTERVIEW_DECISION_TYPE_ID)
    assert record.label == "Attend job interview"
    assert record.family_id == "visibility"
    assert "evaluate_date" in record.allowed_modes
    assert "compare_dates" in record.allowed_modes


def test_compare_mode_requires_role_not_target_date() -> None:
    incomplete = evaluate_car_interview_intake(
        {
            "decision_frame": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": ["2026-09-10", "2026-09-18"],
            }
        }
    )
    assert incomplete.is_complete is False
    assert set(incomplete.missing_required) == {"role"}

    complete = evaluate_car_interview_intake(
        {
            "role": "Engineer",
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


def test_slots_define_required_and_optional_fields() -> None:
    by_id = {slot.slot_id: slot for slot in CAR_INTERVIEW_SLOTS}
    assert by_id["target_date"].required is True
    assert by_id["role"].required is True
    assert by_id["company"].required is False
    assert by_id["interview_type"].required is False


def test_evaluator_incomplete_until_required_slots_filled() -> None:
    empty = evaluate_car_interview_intake({})
    assert empty.is_complete is False
    assert empty.has_first_required_answer is False
    assert empty.can_create_draft is False
    assert set(empty.missing_required) == {"target_date", "role"}

    partial = evaluate_car_interview_intake({"target_date": "2026-08-10"})
    assert partial.has_first_required_answer is True
    assert partial.can_create_draft is True
    assert partial.is_complete is False
    assert partial.missing_required == ("role",)


def test_evaluator_complete_with_optional_slots_empty() -> None:
    result = evaluate_car_interview_intake(
        {
            "target_date": "2026-08-10",
            "role": "Product Manager",
        }
    )
    assert result.is_complete is True
    assert result.missing_required == ()
    assert result.intake.company is None
    assert result.intake.interview_type is None


def test_evaluator_merges_subsequent_answers() -> None:
    first = evaluate_car_interview_intake({"role": "Designer"})
    second = evaluate_car_interview_intake(
        first.intake,
        answers={"target_date": "2026-09-01", "company": "Metioro"},
    )
    assert second.is_complete is True
    assert second.intake.role == "Designer"
    assert second.intake.company == "Metioro"


def test_evaluator_ignores_blank_optional_values() -> None:
    result = evaluate_car_interview_intake(
        {
            "target_date": "2026-08-10",
            "role": "Engineer",
            "company": "   ",
            "interview_type": "",
        }
    )
    assert result.is_complete is True
    assert result.intake.company is None
    assert result.intake.interview_type is None
