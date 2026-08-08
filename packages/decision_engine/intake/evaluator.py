"""Intake evaluator — single source of truth for car-interview completeness.

Web form UI may mirror field presentation only. Completeness authority stays
here until Decision Case intake APIs own the boundary in a later PR.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_SLOTS,
    REQUIRED_SLOT_IDS,
    CarInterviewIntake,
    merge_intake,
)


@dataclass(frozen=True, slots=True)
class IntakeEvaluation:
    intake: CarInterviewIntake
    missing_required: tuple[str, ...]
    answered_required: tuple[str, ...]
    is_complete: bool
    has_first_required_answer: bool

    @property
    def can_create_draft(self) -> bool:
        """Draft Decision Case may be created once any required slot is answered."""
        return self.has_first_required_answer


def evaluate_car_interview_intake(
    intake: Mapping[str, Any] | CarInterviewIntake | None = None,
    *,
    answers: Mapping[str, Any] | None = None,
) -> IntakeEvaluation:
    """Evaluate completeness for `car-interview` intake.

    Completeness = every required slot has a non-empty value.
    Optional slots never block completeness.
    """
    if isinstance(intake, CarInterviewIntake) and not answers:
        normalized = intake
    else:
        current = intake.as_dict() if isinstance(intake, CarInterviewIntake) else intake
        normalized = merge_intake(current, answers or {})

    values = {
        "target_date": normalized.target_date,
        "role": normalized.role,
        "company": normalized.company,
        "interview_type": normalized.interview_type,
    }

    missing = tuple(
        slot.slot_id
        for slot in CAR_INTERVIEW_SLOTS
        if slot.required and not values[slot.slot_id]
    )
    answered_required = tuple(
        slot_id for slot_id in ("target_date", "role") if values[slot_id]
    )

    return IntakeEvaluation(
        intake=normalized,
        missing_required=missing,
        answered_required=answered_required,
        is_complete=len(missing) == 0,
        has_first_required_answer=len(answered_required) > 0,
    )


def required_slot_ids() -> frozenset[str]:
    return REQUIRED_SLOT_IDS


from packages.decision_engine.intake.investor_meeting import (
    INVESTOR_MEETING_SLOTS,
    InvestorMeetingIntake,
    merge_investor_meeting_intake,
)


@dataclass(frozen=True, slots=True)
class InvestorMeetingIntakeEvaluation:
    intake: InvestorMeetingIntake
    missing_required: tuple[str, ...]
    answered_required: tuple[str, ...]
    is_complete: bool
    has_first_required_answer: bool


def evaluate_investor_meeting_intake(
    intake: Mapping[str, Any] | InvestorMeetingIntake | None = None,
    *,
    answers: Mapping[str, Any] | None = None,
) -> InvestorMeetingIntakeEvaluation:
    if isinstance(intake, InvestorMeetingIntake) and not answers:
        normalized = intake
    else:
        current = (
            intake.as_dict()
            if isinstance(intake, InvestorMeetingIntake)
            else intake
        )
        normalized = merge_investor_meeting_intake(
            current,
            answers or {},
        )

    values = {
        "target_date": normalized.target_date,
        "meeting_goal": normalized.meeting_goal,
        "investor_name": normalized.investor_name,
        "meeting_type": normalized.meeting_type,
    }

    missing = tuple(
        slot.slot_id
        for slot in INVESTOR_MEETING_SLOTS
        if slot.required and not values[slot.slot_id]
    )

    answered = tuple(
        key
        for key in ("target_date", "meeting_goal")
        if values[key]
    )

    return InvestorMeetingIntakeEvaluation(
        intake=normalized,
        missing_required=missing,
        answered_required=answered,
        is_complete=not missing,
        has_first_required_answer=bool(answered),
    )
