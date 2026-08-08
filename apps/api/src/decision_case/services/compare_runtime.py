"""Shared Decision Case orchestration for COMPARE runtimes."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any
from uuid import UUID

from decision_case.repository import DecisionCaseRepository
from decision_case.repository.errors import IllegalTransitionError
from decision_case.repository.models import CaseRecord, EvaluationRecord
from decision_case.services.compare_runtime_registry import get_compare_runtime
from packages.decision_engine.evaluate.compare_contract import CompareRuntimeContract
from packages.decision_engine.state_machine import CaseState
from services.decision_engine import generate_decision_outcome


class CompareIntakeIncompleteError(Exception):
    def __init__(self, missing_required):
        self.missing_required = tuple(missing_required)
        super().__init__("intake incomplete")


class UnsupportedCompareDecisionTypeError(Exception):
    def __init__(self, decision_type_id: str):
        self.decision_type_id = decision_type_id
        super().__init__(f"unsupported compare decision_type_id: {decision_type_id}")


def execute_compare_runtime(
    repo: DecisionCaseRepository,
    *,
    case: CaseRecord,
    owner_subject_id: str,
    expected_case_version: int,
    intake: dict[str, Any],
    runtime: CompareRuntimeContract,
    generate_outcome: Callable[..., Any],
) -> EvaluationRecord:
    """Execute a validated COMPARE runtime and persist its Package."""

    intake_version = repo.get_current_version(
        case.case_id,
        owner_subject_id,
    )

    package_model = runtime.compare_package(
        case_id=case.case_id,
        case_version=intake_version.version,
        intake=intake,
        generate_outcome=generate_outcome,
    )
    package = package_model.model_dump(mode="json")

    stance = str(
        (package.get("recommendation") or {}).get("stance") or ""
    )
    dq_status = (
        "blocked"
        if stance == "insufficient_data"
        else "pass"
    )

    return repo.append_evaluation(
        case.case_id,
        owner_subject_id,
        expected_case_version=expected_case_version,
        package=package,
        package_contract_version=str(
            package.get("schema_version") or "1.0.0"
        ),
        engine_id=str(
            package.get("engine_id") or runtime.engine_id
        ),
        dq_status=dq_status,
        case_version=intake_version.version,
        actor="system",
    )


def compare_decision_case(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
) -> EvaluationRecord:
    case = repo.get_case(case_id, owner_subject_id)

    runtime = get_compare_runtime(case.decision_type_id)
    if runtime is None:
        raise UnsupportedCompareDecisionTypeError(case.decision_type_id)

    intake_version = repo.get_current_version(case_id, owner_subject_id)
    intake = dict(intake_version.intake or {})

    evaluation = runtime.evaluate_intake(intake)
    if not evaluation.is_complete:
        raise CompareIntakeIncompleteError(evaluation.missing_required)

    if case.state == CaseState.INTAKE.value:
        raise IllegalTransitionError(
            "cannot compare before intake is complete"
        )

    if case.state not in {
        CaseState.EVIDENCE_READY.value,
        CaseState.EVALUATED.value,
        CaseState.COMPARED.value,
    }:
        raise IllegalTransitionError(
            f"cannot compare from state {case.state}"
        )

    return execute_compare_runtime(
        repo,
        case=case,
        owner_subject_id=owner_subject_id,
        expected_case_version=expected_case_version,
        intake=intake,
        runtime=runtime,
        generate_outcome=generate_decision_outcome,
    )
