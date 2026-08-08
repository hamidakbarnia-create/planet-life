"""Persistence DTOs for Decision Case Repository (no HTTP)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any
from uuid import UUID


@dataclass(frozen=True, slots=True)
class CaseRecord:
    case_id: UUID
    owner_subject_id: str
    decision_type_id: str
    family_id: str
    title: str
    state: str
    mode: str
    precision_level: str
    schema_version: str
    current_case_version: int
    prior_active_state: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class CaseVersionRecord:
    case_id: UUID
    version: int
    intake: dict[str, Any]
    constraints: dict[str, Any]
    mode: str
    reason: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class EvaluationRecord:
    evaluation_id: UUID
    case_id: UUID
    case_version: int
    evaluation_version: int
    package_contract_version: str
    package: dict[str, Any]
    engine_id: str
    dq_status: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class EvidenceBindingRecord:
    evidence_binding_id: UUID
    case_id: UUID
    framework_id: str
    eligibility: str
    artifact_ref: str
    limits: list[Any]
    bound_at: datetime
    evaluation_id: UUID | None


@dataclass(frozen=True, slots=True)
class ParticipantRecord:
    participant_id: UUID
    case_id: UUID
    person_ref: str
    role: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class CandidateDateRecord:
    candidate_date_id: UUID
    case_id: UUID
    case_version: int
    candidate_date: date
    label: str | None
    created_at: datetime


@dataclass(frozen=True, slots=True)
class ComparisonRank:
    candidate_date_id: UUID
    rank: int
    score: float
    band: str


@dataclass(frozen=True, slots=True)
class ComparisonRecord:
    comparison_id: UUID
    case_id: UUID
    case_version: int
    evaluation_id: UUID
    ranking: list[dict[str, Any]]
    ranks: tuple[ComparisonRank, ...]
    created_at: datetime


@dataclass(frozen=True, slots=True)
class FindingRecord:
    finding_id: UUID
    case_id: UUID
    case_version: int
    finding_version: int
    package_contract_version: str
    package: dict[str, Any]
    engine_id: str
    dq_status: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class HistoryEventRecord:
    history_id: UUID
    case_id: UUID
    at: datetime
    actor: str
    event: str
    payload: dict[str, Any]
    from_state: str | None
    to_state: str | None
    case_version: int | None


@dataclass(frozen=True, slots=True)
class TimelineEntry:
    kind: str
    at: datetime
    detail: dict[str, Any] = field(default_factory=dict)
