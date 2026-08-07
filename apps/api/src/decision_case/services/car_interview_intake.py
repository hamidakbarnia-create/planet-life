"""Car-interview intake/evaluation transport over Decision Case SoR.

Completeness authority: packages.decision_engine.intake.evaluator
Runtime authority: packages.decision_engine.evaluate.car_interview_evaluate
Persistence authority: DecisionCaseRepository only.

Stub package is NOT used on the production evaluation path.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from decision_case.repository import DecisionCaseRepository
from decision_case.repository.errors import IllegalTransitionError
from decision_case.repository.models import CaseRecord, EvaluationRecord
from decision_case.services.decision_frame import DECISION_FRAME_INTAKE_KEY
from packages.decision_engine.evaluate.car_interview_evaluate import (
    NATAL_EVIDENCE_INTAKE_KEY,
    REAL_ENGINE_ID,
    RuntimeFramingError,
    RuntimeProviderError,
    RuntimeUnsupportedOperationError,
    evaluate_car_interview_dict,
)
from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_DECISION_TYPE_ID,
    merge_intake,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.state_machine import CaseState
from services.decision_engine import generate_decision_outcome

_CAR_INTERVIEW_MODE = "evaluate_date"

# Re-export for route handlers / tests.
__all__ = [
    "IntakeIncompleteError",
    "UnsupportedDecisionTypeError",
    "RuntimeFramingError",
    "RuntimeProviderError",
    "RuntimeUnsupportedOperationError",
    "save_car_interview_answers",
    "complete_car_interview_intake",
    "evaluate_car_interview_case",
]


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
    # Preserve authoritative namespaces across slot merges.
    existing_frame = current_intake.get(DECISION_FRAME_INTAKE_KEY)
    existing_natal = current_intake.get(NATAL_EVIDENCE_INTAKE_KEY)
    merged = merge_intake(current_intake, answers)
    intake_dict = merged.as_dict()
    if isinstance(existing_frame, dict):
        intake_dict[DECISION_FRAME_INTAKE_KEY] = existing_frame
    if isinstance(existing_natal, dict):
        intake_dict[NATAL_EVIDENCE_INTAKE_KEY] = existing_natal
    # Allow callers to attach natal evidence via answers namespace.
    natal_in_answers = answers.get(NATAL_EVIDENCE_INTAKE_KEY)
    if isinstance(natal_in_answers, dict):
        intake_dict[NATAL_EVIDENCE_INTAKE_KEY] = natal_in_answers

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
    if DECISION_FRAME_INTAKE_KEY in intake_dict:
        normalized[DECISION_FRAME_INTAKE_KEY] = intake_dict[DECISION_FRAME_INTAKE_KEY]
    if NATAL_EVIDENCE_INTAKE_KEY in intake_dict:
        normalized[NATAL_EVIDENCE_INTAKE_KEY] = intake_dict[NATAL_EVIDENCE_INTAKE_KEY]
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
    if DECISION_FRAME_INTAKE_KEY in intake_dict:
        normalized[DECISION_FRAME_INTAKE_KEY] = intake_dict[DECISION_FRAME_INTAKE_KEY]
    if NATAL_EVIDENCE_INTAKE_KEY in intake_dict:
        normalized[NATAL_EVIDENCE_INTAKE_KEY] = intake_dict[NATAL_EVIDENCE_INTAKE_KEY]
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
    package = evaluate_car_interview_dict(
        case_id=case.case_id,
        case_version=intake_version.version,
        intake=intake_dict,
        generate_outcome=generate_decision_outcome,
    )
    stance = str((package.get("recommendation") or {}).get("stance") or "")
    # insufficient_data is a recorded evaluation outcome, but DQ did not pass:
    # distinguish "could not score" from a completed recommendation.
    dq_status = "blocked" if stance == "insufficient_data" else "pass"
    return repo.append_evaluation(
        case_id,
        owner_subject_id,
        expected_case_version=expected_case_version,
        package=package,
        package_contract_version=str(package.get("schema_version") or "1.0.0"),
        engine_id=str(package.get("engine_id") or REAL_ENGINE_ID),
        dq_status=dq_status,
        case_version=intake_version.version,
        actor="system",
    )
