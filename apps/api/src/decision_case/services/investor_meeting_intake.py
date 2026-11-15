"""Investor-meeting intake transport over Decision Case SoR."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from decision_case.repository import DecisionCaseRepository
from decision_case.services.intake_errors import IntakeIncompleteError
from decision_case.repository.errors import IllegalTransitionError
from decision_case.repository.models import CaseRecord
from decision_case.services.decision_frame import DECISION_FRAME_INTAKE_KEY
from packages.decision_engine.evaluate.runtime_common import (
    NATAL_EVIDENCE_INTAKE_KEY,
)
from packages.decision_engine.intake.evaluator import (
    evaluate_investor_meeting_intake,
)
from packages.decision_engine.intake.investor_meeting import (
    INVESTOR_MEETING_DECISION_TYPE_ID,
    merge_investor_meeting_intake,
)
from packages.decision_engine.state_machine import CaseState

_INVESTOR_MEETING_MODE = "evaluate_date"


class UnsupportedDecisionTypeError(Exception):
    def __init__(self, decision_type_id: str):
        self.decision_type_id = decision_type_id
        super().__init__(f"unsupported decision_type_id: {decision_type_id}")


def _require_investor_meeting(case: CaseRecord) -> None:
    if case.decision_type_id != INVESTOR_MEETING_DECISION_TYPE_ID:
        raise UnsupportedDecisionTypeError(case.decision_type_id)


def _intake_snapshot(
    repo: DecisionCaseRepository,
    case: CaseRecord,
) -> dict[str, Any]:
    version = repo.get_current_version(case.case_id, case.owner_subject_id)
    return dict(version.intake or {})


def save_investor_meeting_answers(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
    answers: dict[str, Any],
):
    case = repo.get_case(case_id, owner_subject_id)
    _require_investor_meeting(case)

    current = _intake_snapshot(repo, case)
    existing_frame = current.get(DECISION_FRAME_INTAKE_KEY)
    existing_natal = current.get(NATAL_EVIDENCE_INTAKE_KEY)

    merged = merge_investor_meeting_intake(current, answers)
    intake = merged.as_dict()

    if isinstance(existing_frame, dict):
        intake[DECISION_FRAME_INTAKE_KEY] = existing_frame
    if isinstance(existing_natal, dict):
        intake[NATAL_EVIDENCE_INTAKE_KEY] = existing_natal

    natal_in_answers = answers.get(NATAL_EVIDENCE_INTAKE_KEY)
    if isinstance(natal_in_answers, dict):
        intake[NATAL_EVIDENCE_INTAKE_KEY] = natal_in_answers

    evaluation = evaluate_investor_meeting_intake(intake)
    if (
        case.state == CaseState.DRAFT.value
        and not evaluation.has_first_required_answer
    ):
        raise IntakeIncompleteError(evaluation.missing_required)

    version = repo.append_case_version(
        case_id,
        owner_subject_id,
        expected_case_version=expected_case_version,
        intake=intake,
        mode=_INVESTOR_MEETING_MODE,
        reason="intake_update",
        actor="user",
    )

    case = repo.get_case(case_id, owner_subject_id)

    if case.state == CaseState.DRAFT.value:
        case = repo.advance_state(
            case_id,
            owner_subject_id,
            to_state=CaseState.INTAKE.value,
            trigger="start_intake",
            expected_case_version=version.version,
            has_decision_type_or_classification_pending=True,
            actor="user",
        )

    normalized = evaluation.intake.as_dict()
    if DECISION_FRAME_INTAKE_KEY in intake:
        normalized[DECISION_FRAME_INTAKE_KEY] = intake[DECISION_FRAME_INTAKE_KEY]
    if NATAL_EVIDENCE_INTAKE_KEY in intake:
        normalized[NATAL_EVIDENCE_INTAKE_KEY] = intake[NATAL_EVIDENCE_INTAKE_KEY]

    return (
        repo.get_case(case_id, owner_subject_id),
        normalized,
        list(evaluation.missing_required),
        evaluation.is_complete,
    )


def complete_investor_meeting_intake(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
):
    case = repo.get_case(case_id, owner_subject_id)
    _require_investor_meeting(case)

    intake = _intake_snapshot(repo, case)
    evaluation = evaluate_investor_meeting_intake(intake)

    if not evaluation.is_complete:
        raise IntakeIncompleteError(evaluation.missing_required)

    if case.state == CaseState.DRAFT.value:
        case = repo.advance_state(
            case_id,
            owner_subject_id,
            to_state=CaseState.INTAKE.value,
            trigger="start_intake",
            expected_case_version=expected_case_version,
            has_decision_type_or_classification_pending=True,
            actor="user",
        )
        expected_case_version = case.current_case_version

    if case.state == CaseState.INTAKE.value:
        case = repo.advance_state(
            case_id,
            owner_subject_id,
            to_state=CaseState.EVIDENCE_READY.value,
            trigger="complete_intake",
            expected_case_version=expected_case_version,
            intake_complete_or_soft_gaps_accepted=True,
            actor="user",
        )
    elif case.state not in {
        CaseState.EVIDENCE_READY.value,
        CaseState.EVALUATED.value,
    }:
        raise IllegalTransitionError(
            f"cannot complete intake from state {case.state}"
        )

    normalized = evaluation.intake.as_dict()
    if DECISION_FRAME_INTAKE_KEY in intake:
        normalized[DECISION_FRAME_INTAKE_KEY] = intake[DECISION_FRAME_INTAKE_KEY]
    if NATAL_EVIDENCE_INTAKE_KEY in intake:
        normalized[NATAL_EVIDENCE_INTAKE_KEY] = intake[NATAL_EVIDENCE_INTAKE_KEY]

    return case, normalized, [], True
