"""Map repository DTOs to Decision Case HTTP wire resources."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from packages.decision_engine.state_machine import NO_ACTIVE_PHASE, activation_phase

from decision_case.repository.models import (
    CaseRecord,
    ComparisonRecord,
    EvaluationRecord,
    HistoryEventRecord,
)
from decision_case.schemas.cases import (
    DecisionCaseResource,
    DecisionComparisonListItem,
    DecisionComparisonResource,
    DecisionEvaluationListItem,
    DecisionEvaluationResource,
    DecisionHistoryEventResource,
)


def format_utc_z(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


def derive_activation_phase(case: CaseRecord) -> str | None:
    phase = activation_phase(
        case.state,
        mode=case.mode,
        prior_active_state=case.prior_active_state,
    )
    if phase == NO_ACTIVE_PHASE:
        return None
    return str(phase)


def to_case_resource(case: CaseRecord) -> DecisionCaseResource:
    return DecisionCaseResource(
        case_id=case.case_id,
        owner_subject_id=case.owner_subject_id,
        decision_type_id=case.decision_type_id,
        family_id=case.family_id,
        title=case.title,
        state=case.state,
        activation_phase=derive_activation_phase(case),  # type: ignore[arg-type]
        mode=case.mode,  # type: ignore[arg-type]
        precision_level=case.precision_level,  # type: ignore[arg-type]
        case_version=case.current_case_version,
        created_at=format_utc_z(case.created_at),
        updated_at=format_utc_z(case.updated_at),
    )


def to_evaluation_list_item(record: EvaluationRecord) -> DecisionEvaluationListItem:
    return DecisionEvaluationListItem(
        evaluation_id=record.evaluation_id,
        case_id=record.case_id,
        case_version=record.case_version,
        evaluation_version=record.evaluation_version,
        package_contract_version=record.package_contract_version,
        engine_id=record.engine_id,
        dq_status=record.dq_status,  # type: ignore[arg-type]
        created_at=format_utc_z(record.created_at),
    )


def to_evaluation_resource(record: EvaluationRecord) -> DecisionEvaluationResource:
    base = to_evaluation_list_item(record)
    return DecisionEvaluationResource(
        **base.model_dump(),
        package=dict(record.package) if record.package is not None else {},
    )


def to_comparison_list_item(record: ComparisonRecord) -> DecisionComparisonListItem:
    return DecisionComparisonListItem(
        comparison_id=record.comparison_id,
        case_id=record.case_id,
        case_version=record.case_version,
        evaluation_id=record.evaluation_id,
        created_at=format_utc_z(record.created_at),
    )


def to_comparison_resource(
    record: ComparisonRecord,
    evaluation: EvaluationRecord,
) -> DecisionComparisonResource:
    base = to_comparison_list_item(record)
    return DecisionComparisonResource(
        **base.model_dump(),
        ranking=list(record.ranking or []),
        package=dict(evaluation.package) if evaluation.package is not None else {},
    )


def to_history_event(record: HistoryEventRecord) -> DecisionHistoryEventResource:
    payload: dict[str, Any] = dict(record.payload) if record.payload is not None else {}
    return DecisionHistoryEventResource(
        history_id=record.history_id,
        case_id=record.case_id,
        at=format_utc_z(record.at),
        actor=record.actor,
        event=record.event,
        from_state=record.from_state,
        to_state=record.to_state,
        case_version=record.case_version,
        payload=payload,
    )


def sort_cases_for_list(cases: list[CaseRecord]) -> list[CaseRecord]:
    """Wire ordering: updated_at DESC, case_id ASC."""
    return sorted(
        cases,
        key=lambda c: (-c.updated_at.timestamp(), str(c.case_id)),
    )
