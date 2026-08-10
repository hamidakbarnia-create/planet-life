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
    intake_mode_from_mapping as car_interview_intake_mode_from_mapping,
    merge_intake,
    required_slot_ids_for_mode as car_interview_required_slot_ids_for_mode,
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
    mode: str | None = None,
) -> IntakeEvaluation:
    """Evaluate completeness for `car-interview` intake.

    Completeness = every mode-required slot has a non-empty value.
    Optional slots never block completeness. COMPARE does not require target_date.
    """
    if isinstance(intake, CarInterviewIntake) and not answers:
        normalized = intake
        mode_resolved = mode or "evaluate_date"
    else:
        current = intake.as_dict() if isinstance(intake, CarInterviewIntake) else intake
        mapping_for_mode: Mapping[str, Any] | None
        if isinstance(intake, CarInterviewIntake):
            mapping_for_mode = None
        else:
            mapping_for_mode = intake if isinstance(intake, Mapping) else None
        normalized = merge_intake(current, answers or {})
        mode_resolved = mode or car_interview_intake_mode_from_mapping(
            mapping_for_mode if mapping_for_mode is not None else current
        )

    values = {
        "target_date": normalized.target_date,
        "role": normalized.role,
        "company": normalized.company,
        "interview_type": normalized.interview_type,
    }

    required_ids = car_interview_required_slot_ids_for_mode(mode_resolved)
    missing = tuple(
        slot.slot_id
        for slot in CAR_INTERVIEW_SLOTS
        if slot.slot_id in required_ids and not values.get(slot.slot_id)
    )
    answered_required = tuple(
        slot_id for slot_id in required_ids if values.get(slot_id)
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


from packages.decision_engine.intake.wedding_date import (
    WEDDING_DATE_SLOTS,
    WeddingDateIntake,
    intake_mode_from_mapping,
    merge_wedding_date_intake,
    required_slot_ids_for_mode,
)


@dataclass(frozen=True, slots=True)
class WeddingDateIntakeEvaluation:
    intake: WeddingDateIntake
    missing_required: tuple[str, ...]
    answered_required: tuple[str, ...]
    is_complete: bool
    has_first_required_answer: bool


def evaluate_wedding_date_intake(
    intake: Mapping[str, Any] | WeddingDateIntake | None = None,
    *,
    answers: Mapping[str, Any] | None = None,
    mode: str | None = None,
) -> WeddingDateIntakeEvaluation:
    if isinstance(intake, WeddingDateIntake) and not answers:
        normalized = intake
        mode_resolved = mode or "evaluate_date"
    else:
        current = (
            intake.as_dict()
            if isinstance(intake, WeddingDateIntake)
            else intake
        )
        # Preserve decision_frame sibling for mode inference when mapping.
        mapping_for_mode: Mapping[str, Any] | None
        if isinstance(intake, WeddingDateIntake):
            mapping_for_mode = None
        else:
            mapping_for_mode = intake if isinstance(intake, Mapping) else None
            if answers and isinstance(answers, Mapping):
                # Prefer answers overlay only for slots; frame stays on current.
                pass
        normalized = merge_wedding_date_intake(current, answers or {})
        mode_resolved = mode or intake_mode_from_mapping(
            mapping_for_mode if mapping_for_mode is not None else current
        )

    values = {
        "target_date": normalized.target_date,
        "ceremony_type": normalized.ceremony_type,
        "partner_name": normalized.partner_name,
        "venue": normalized.venue,
    }

    required_ids = required_slot_ids_for_mode(mode_resolved)
    missing = tuple(
        slot.slot_id
        for slot in WEDDING_DATE_SLOTS
        if slot.slot_id in required_ids and not values[slot.slot_id]
    )

    answered = tuple(slot_id for slot_id in required_ids if values[slot_id])

    return WeddingDateIntakeEvaluation(
        intake=normalized,
        missing_required=missing,
        answered_required=answered,
        is_complete=not missing,
        has_first_required_answer=bool(answered),
    )


from packages.decision_engine.intake.product_launch import (
    PRODUCT_LAUNCH_SLOTS,
    ProductLaunchIntake,
    merge_product_launch_intake,
)


@dataclass(frozen=True, slots=True)
class ProductLaunchIntakeEvaluation:
    intake: ProductLaunchIntake
    missing_required: tuple[str, ...]
    answered_required: tuple[str, ...]
    is_complete: bool
    has_first_required_answer: bool


def evaluate_product_launch_intake(
    intake: Mapping[str, Any] | ProductLaunchIntake | None = None,
    *,
    answers: Mapping[str, Any] | None = None,
) -> ProductLaunchIntakeEvaluation:
    from packages.decision_engine.intake.product_launch import (
        intake_mode_from_mapping,
        required_slot_ids_for_mode,
    )

    raw_mapping: Mapping[str, Any] | None
    if isinstance(intake, ProductLaunchIntake) and not answers:
        normalized = intake
        raw_mapping = None
    else:
        current = (
            intake.as_dict()
            if isinstance(intake, ProductLaunchIntake)
            else intake
        )
        raw_mapping = current if isinstance(current, Mapping) else None
        normalized = merge_product_launch_intake(current, answers or {})

    mode = intake_mode_from_mapping(
        intake if isinstance(intake, Mapping) else raw_mapping
    )
    # Preserve decision_frame when present on the raw intake for mode inference.
    if isinstance(intake, Mapping):
        mode = intake_mode_from_mapping(intake)

    required_ids = required_slot_ids_for_mode(mode)

    values = {
        "target_date": normalized.target_date,
        "launch_object": normalized.launch_object,
        "launch_channel": normalized.launch_channel,
        "brand_or_company": normalized.brand_or_company,
    }

    missing = tuple(
        slot_id for slot_id in sorted(required_ids) if not values.get(slot_id)
    )

    answered = tuple(
        key for key in ("target_date", "launch_object") if values[key]
    )
    if mode == "find_dates":
        answered = tuple(key for key in ("launch_object",) if values[key])

    return ProductLaunchIntakeEvaluation(
        intake=normalized,
        missing_required=missing,
        answered_required=answered,
        is_complete=not missing,
        has_first_required_answer=bool(answered),
    )
