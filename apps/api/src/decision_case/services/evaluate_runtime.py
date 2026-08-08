"""Shared Decision Case orchestration for EVALUATE runtimes."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from decision_case.repository import DecisionCaseRepository
from decision_case.repository.models import CaseRecord, EvaluationRecord
from packages.decision_engine.evaluate.contract import EvaluateRuntimeContract


def execute_evaluate_runtime(
    repo: DecisionCaseRepository,
    *,
    case: CaseRecord,
    owner_subject_id: str,
    expected_case_version: int,
    intake: dict[str, Any],
    runtime: EvaluateRuntimeContract,
    generate_outcome: Callable[..., Any],
) -> EvaluationRecord:
    """Execute a validated EVALUATE runtime and persist its Package."""

    intake_version = repo.get_current_version(
        case.case_id,
        owner_subject_id,
    )

    package_model = runtime.evaluate_package(
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
