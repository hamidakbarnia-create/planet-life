"""PR-2 car-interview intake/evaluation transport over Decision Case SoR.

Completeness authority: packages.decision_engine.intake.evaluator
Stub package authority: packages.decision_engine.evaluate.stub_package
Persistence authority: DecisionCaseRepository only.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from decision_case.repository import DecisionCaseRepository
from decision_case.repository.errors import IllegalTransitionError
from decision_case.repository.models import CaseRecord, EvaluationRecord
from packages.decision_engine.evaluate.stub_package import (
    STUB_ENGINE_ID,
    build_car_interview_stub_package_dict,
)
from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_DECISION_TYPE_ID,
    merge_intake,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.state_machine import CaseState

_CAR_INTERVIEW_MODE = "evaluate_date"


class IntakeIncompleteError(Exception):
    def __init__(self, missing_required: tuple[str, ...]):
        self.missing_required = missing_required
        super().__init__("intake incomplete")


class UnsupportedDecisionTypeError(Exception):
    def __init__(self, decision_type_id: str):
        self.decision_type_id = decision_type_id
        super().__init__(f"unsupported decision_type_id: {decision_type_id}")


def _require_car_interview(case: CaseRecord) -> None:
    if case.decision_type_id != CAR_INTERVIEW_DECISION_TYPE_ID:
        raise UnsupportedDecisionTypeError(case.decision_type_id)


def _intake_snapshot(repo: DecisionCaseRepository, case: CaseRecord) -> dict[str, Any]:
    version = repo.get_current_version(case.case_id, case.owner_subject_id)
    return dict(version.intake or {})


def _evaluation_status(intake: dict[str, Any]) -> tuple[dict[str, Any], list[str], bool]:
    result = evaluate_car_interview_intake(intake)
    return (
        result.intake.as_dict(),
        list(result.missing_required),
        result.is_complete,
    )


def save_car_interview_answers(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
    answers: dict[str, Any],
) -> tuple[CaseRecord, dict[str, Any], list[str], bool]:
    case = repo.get_case(case_id, owner_subject_id)
    _require_car_interview(case)

    current_intake = _intake_snapshot(repo, case)
    merged = merge_intake(current_intake, answers)
    intake_dict = merged.as_dict()

    # Domain draft gate: refuse empty first write with no required progress.
    evaluation = evaluate_car_interview_intake(intake_dict)
    if case.state == CaseState.DRAFT.value and not evaluation.has_first_required_answer:
        raise IntakeIncompleteError(evaluation.missing_required)

    version = repo.append_case_version(
        case_id,
        owner_subject_id,
        expected_case_version=expected_case_version,
        intake=intake_dict,
        mode=_CAR_INTERVIEW_MODE,
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
    elif case.state == CaseState.INTAKE.value:
        # answer_intake is a self-transition; content already versioned above.
        pass
    else:
        # Later states may still receive intake updates as new versions without
        # forcing a lifecycle rewind in PR-2.
        pass

    normalized, missing, is_complete = _evaluation_status(intake_dict)
    case = repo.get_case(case_id, owner_subject_id)
    return case, normalized, missing, is_complete


def complete_car_interview_intake(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
) -> tuple[CaseRecord, dict[str, Any], list[str], bool]:
    case = repo.get_case(case_id, owner_subject_id)
    _require_car_interview(case)

    intake_dict = _intake_snapshot(repo, case)
    normalized, missing, is_complete = _evaluation_status(intake_dict)
    if not is_complete:
        raise IntakeIncompleteError(tuple(missing))

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
    elif case.state in {
        CaseState.EVIDENCE_READY.value,
        CaseState.EVALUATED.value,
    }:
        case = repo.get_case(case_id, owner_subject_id)
    else:
        raise IllegalTransitionError(
            f"cannot complete intake from state {case.state}"
        )

    return case, normalized, missing, True


def evaluate_car_interview_case(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
) -> EvaluationRecord:
    case = repo.get_case(case_id, owner_subject_id)
    _require_car_interview(case)

    intake_dict = _intake_snapshot(repo, case)
    evaluation = evaluate_car_interview_intake(intake_dict)
    if not evaluation.is_complete:
        raise IntakeIncompleteError(evaluation.missing_required)

    if case.state == CaseState.INTAKE.value:
        # Invariant failure path: evaluation requires completed intake.
        raise IllegalTransitionError(
            "cannot evaluate before intake is complete"
        )
    if case.state not in {
        CaseState.EVIDENCE_READY.value,
        CaseState.EVALUATED.value,
    }:
        raise IllegalTransitionError(
            f"cannot evaluate from state {case.state}"
        )

    # Evaluation rows must reference an existing decision_versions snapshot.
    # State transitions may bump current_case_version without a version row.
    intake_version = repo.get_current_version(case_id, owner_subject_id)
    package = build_car_interview_stub_package_dict(
        case_id=case.case_id,
        case_version=intake_version.version,
        intake=evaluation.intake,
    )
    return repo.append_evaluation(
        case_id,
        owner_subject_id,
        expected_case_version=expected_case_version,
        package=package,
        package_contract_version=str(package.get("schema_version") or "1.0.0"),
        engine_id=STUB_ENGINE_ID,
        dq_status="pass",
        case_version=intake_version.version,
        actor="system",
    )
