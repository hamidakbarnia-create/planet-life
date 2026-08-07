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


class IntakeAnswersRequest(BaseModel):
    """Persist partial intake answers on an existing Decision Case."""

    model_config = ConfigDict(extra="forbid")

    expected_case_version: int = Field(..., ge=1)
    answers: dict[str, Any] = Field(default_factory=dict)


class IntakeCompleteRequest(BaseModel):
    """Mark intake complete when domain evaluator permits."""

    model_config = ConfigDict(extra="forbid")

    expected_case_version: int = Field(..., ge=1)


class PersistedDecisionFraming(BaseModel):
    """Minimum Frame fields persisted onto Case intake (authoritative).

    Canonical shapes:
    - evaluate + specific_date → date
    - compare + multiple_dates → dates[]
    - find + date_range → start, end

    Input also accepts legacy aliases dates[] (evaluate) and
    range_start/range_end (find); service normalizes to canonical names.
    """

    model_config = ConfigDict(extra="forbid")

    operation: Literal["evaluate", "compare", "find"]
    time_scope: Literal[
        "specific_date", "multiple_dates", "date_range", "none"
    ]
    date: str | None = None
    dates: list[str] = Field(default_factory=list)
    start: str | None = None
    end: str | None = None
    options: list[dict[str, Any]] = Field(default_factory=list)
    objective: str | None = None
    raw_intent: str | None = None

    @model_validator(mode="before")
    @classmethod
    def accept_legacy_aliases(cls, data: Any) -> Any:
        """Map legacy FIND aliases; reject conflicting canonical+legacy values.

        Identical canonical + legacy pairs are accepted deterministically
        (legacy dropped; canonical kept).
        """
        if not isinstance(data, dict):
            return data
        next_data = dict(data)

        start = next_data.get("start")
        range_start = next_data.get("range_start")
        if start is not None and range_start is not None:
            if start != range_start:
                raise ValueError("conflicting start and range_start")
        elif start is None and range_start is not None:
            next_data["start"] = range_start
        next_data.pop("range_start", None)

        end = next_data.get("end")
        range_end = next_data.get("range_end")
        if end is not None and range_end is not None:
            if end != range_end:
                raise ValueError("conflicting end and range_end")
        elif end is None and range_end is not None:
            next_data["end"] = range_end
        next_data.pop("range_end", None)

        return next_data


class CreateCaseFromFramingRequest(BaseModel):
    """Create a Decision Case only after Frame operation/time are resolved."""

    model_config = ConfigDict(extra="forbid")

    decision_type_id: str
    title: str
    framing: PersistedDecisionFraming

    @field_validator("title")
    @classmethod
    def title_trimmed_nonempty(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("title must be non-empty after trim")
        if len(trimmed) > 200:
            raise ValueError("title must be at most 200 characters")
        return trimmed

    @field_validator("decision_type_id")
    @classmethod
    def decision_type_trimmed(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("decision_type_id is required")
        return trimmed


class UpdateCaseFramingRequest(BaseModel):
    """Replace persisted framing on an existing Case (CAS)."""

    model_config = ConfigDict(extra="forbid")

    expected_case_version: int = Field(..., ge=1)
    framing: PersistedDecisionFraming


class CreateEvaluationRequest(BaseModel):
    """Request a DecisionEvaluationPackage via the Case evaluation boundary."""

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


class DecisionCaseDetailResource(DecisionCaseResource):
    """GET case detail including current intake snapshot (not a second Case model)."""

    intake: dict[str, Any] = Field(default_factory=dict)


class IntakeMutationResponse(BaseModel):
    """Case + authoritative intake snapshot after an intake write."""

    model_config = ConfigDict(extra="forbid")

    case: DecisionCaseResource
    intake: dict[str, Any]
    missing_required: list[str]
    is_complete: bool


class FramingMutationResponse(BaseModel):
    """Authoritative Case + intake after framing persist."""

    model_config = ConfigDict(extra="forbid")

    case: DecisionCaseResource
    intake: dict[str, Any]
    framing: dict[str, Any]


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
