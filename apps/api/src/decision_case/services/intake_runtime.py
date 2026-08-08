"""Dispatch Decision Case intake operations by decision type."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from decision_case.repository import DecisionCaseRepository
from decision_case.services.car_interview_intake import (
    IntakeIncompleteError,
    UnsupportedDecisionTypeError,
    complete_car_interview_intake,
    save_car_interview_answers,
)
from decision_case.services.investor_meeting_intake import (
    complete_investor_meeting_intake,
    save_investor_meeting_answers,
)


def save_intake_answers(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
    answers: dict[str, Any],
):
    case = repo.get_case(case_id, owner_subject_id)

    if case.decision_type_id == "car-interview":
        return save_car_interview_answers(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=expected_case_version,
            answers=answers,
        )

    if case.decision_type_id == "bus-investor-meeting":
        return save_investor_meeting_answers(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=expected_case_version,
            answers=answers,
        )

    raise UnsupportedDecisionTypeError(case.decision_type_id)


def complete_intake(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
):
    case = repo.get_case(case_id, owner_subject_id)

    if case.decision_type_id == "car-interview":
        return complete_car_interview_intake(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=expected_case_version,
        )

    if case.decision_type_id == "bus-investor-meeting":
        return complete_investor_meeting_intake(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=expected_case_version,
        )

    raise UnsupportedDecisionTypeError(case.decision_type_id)
