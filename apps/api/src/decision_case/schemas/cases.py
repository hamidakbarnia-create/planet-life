"""Pydantic request/response models for Decision Case HTTP API (E5)."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

EntryMode = Literal["structured", "natural_language"]
CaseMode = Literal["none", "evaluate_date", "compare_dates"]
PrecisionLevel = Literal["L1", "L2", "L3", "L4", "L5", "L6", "L7"]
DqStatus = Literal["pass", "blocked"]
ActivationPhaseWire = Literal[
    "draft",
    "intake",
    "evidence_ready",
    "evaluated",
    "compared",
    "completed",
    "archived",
]


class CreateDecisionCaseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision_type_id: str | None = None
    title: str
    entry_mode: EntryMode
    classification_text: str | None = None

    @field_validator("title")
    @classmethod
    def title_trimmed_nonempty(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("title must be non-empty after trim")
        if len(trimmed) > 200:
            raise ValueError("title must be at most 200 characters")
        return trimmed

    @model_validator(mode="after")
    def structured_requires_decision_type(self) -> CreateDecisionCaseRequest:
        if self.entry_mode == "structured":
            type_id = (self.decision_type_id or "").strip()
            if not type_id:
                raise ValueError("decision_type_id is required when entry_mode=structured")
            self.decision_type_id = type_id
        return self


class CaseVersionCommandRequest(BaseModel):
    """Body for complete / archive material writes."""

    model_config = ConfigDict(extra="forbid")

    expected_case_version: int = Field(..., ge=1)


class DecisionCaseResource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    case_id: UUID
    owner_subject_id: str
    decision_type_id: str
    family_id: str
    title: str
    state: str
    activation_phase: ActivationPhaseWire | None
    mode: CaseMode
    precision_level: PrecisionLevel
    case_version: int
    created_at: str
    updated_at: str


class DecisionCaseListEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cases: list[DecisionCaseResource]


class DecisionEvaluationListItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    evaluation_id: UUID
    case_id: UUID
    case_version: int
    evaluation_version: int
    package_contract_version: str
    engine_id: str
    dq_status: DqStatus
    created_at: str


class DecisionEvaluationListEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    evaluations: list[DecisionEvaluationListItem]


class DecisionEvaluationResource(DecisionEvaluationListItem):
    package: dict[str, Any]


class DecisionHistoryEventResource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    history_id: UUID
    case_id: UUID
    at: str
    actor: str
    event: str
    from_state: str | None
    to_state: str | None
    case_version: int | None
    payload: dict[str, Any]


class DecisionHistoryEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    events: list[DecisionHistoryEventResource]


class DecisionApiErrorBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    code: str
    message: str
    request_id: str = Field(alias="requestId")
    details: dict[str, Any] = Field(default_factory=dict)


class DecisionApiErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: DecisionApiErrorBody
