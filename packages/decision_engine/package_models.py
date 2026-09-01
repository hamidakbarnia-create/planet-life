"""Canonical DecisionEvaluationPackage v1 Python models.

Authority:
- ACR-0001 §B3
- EPIC-001 Decision Case Engineering Spec Part 3

These models do not replace the JSON Schema as the contract source.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_serializer, model_validator


Stance = Literal[
    "proceed",
    "proceed_with_conditions",
    "wait",
    "prefer_alternate",
    "no_unique_winner",
    "insufficient_data",
]
DecisionMode = Literal["evaluate_date", "compare_dates", "find_dates"]
PrecisionLevel = Literal["L1", "L2", "L3", "L4", "L5", "L6", "L7"]
TimingBand = Literal["high", "moderate", "low", "na"]
CandidateBand = Literal["high", "moderate", "low"]


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class RecommendationModule(ContractModel):
    stance: Stance
    conditions: tuple[str, ...] = Field(max_length=5)
    summary: str = Field(min_length=1)


class TimingCandidate(ContractModel):
    date: date
    rank: int = Field(ge=1)
    score: float = Field(ge=0, le=100)
    band: CandidateBand
    # Optional identity fields for compare_dates (evaluate_date omits these).
    option_id: str | None = None
    label: str | None = None
    strengths: tuple[str, ...] | None = Field(default=None, max_length=3)
    risks: tuple[str, ...] | None = Field(default=None, max_length=3)

    @model_serializer(mode="wrap")
    def _omit_empty_compare_fields(self, handler):
        data = handler(self)
        for key in ("option_id", "label", "strengths", "risks"):
            value = data.get(key)
            if value is None or value == [] or value == ():
                data.pop(key, None)
        return data


class TimingModule(ContractModel):
    material: bool
    band: TimingBand
    score: float | None = Field(default=None, ge=0, le=100)
    candidates: tuple[TimingCandidate, ...] = Field(max_length=5)
    notes: str

    @model_validator(mode="after")
    def validate_material_state(self) -> "TimingModule":
        if not self.material:
            if self.band != "na":
                raise ValueError("non-material timing requires band='na'")
            if self.score is not None:
                raise ValueError("non-material timing requires score=null")
        elif self.band == "na":
            raise ValueError("material timing cannot use band='na'")
        return self


class FindWindowCandidate(ContractModel):
    window_id: str = Field(min_length=1)
    start_date: date
    end_date: date
    peak_dates: tuple[date, ...] = Field(min_length=1, max_length=5)
    peak_score: float = Field(ge=0, le=100)
    band: CandidateBand
    rank: int = Field(ge=1)
    strengths: tuple[str, ...] = Field(default=(), max_length=3)
    risks: tuple[str, ...] = Field(default=(), max_length=3)

    @model_validator(mode="after")
    def validate_window_bounds(self) -> "FindWindowCandidate":
        if self.start_date > self.end_date:
            raise ValueError("window start_date must be <= end_date")
        for peak in self.peak_dates:
            if peak < self.start_date or peak > self.end_date:
                raise ValueError("peak_dates must lie within the window")
        return self


class FindModule(ContractModel):
    range_start: date
    range_end: date
    timezone: str = Field(min_length=1)
    windows: tuple[FindWindowCandidate, ...] = Field(max_length=5)
    unique_dominant: bool

    @model_validator(mode="after")
    def validate_range(self) -> "FindModule":
        if self.range_start > self.range_end:
            raise ValueError("find range_start must be <= range_end")
        ranks = [window.rank for window in self.windows]
        if len(ranks) != len(set(ranks)):
            raise ValueError("find window ranks must be unique")
        ids = [window.window_id for window in self.windows]
        if len(ids) != len(set(ids)):
            raise ValueError("find window_id values must be unique")
        if self.unique_dominant and len(self.windows) == 0:
            raise ValueError("unique_dominant requires at least one window")
        return self


class ConfidencePenalty(ContractModel):
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)


class ConfidenceModule(ContractModel):
    value: float = Field(ge=0, le=100)
    precision_level: PrecisionLevel
    penalties: tuple[ConfidencePenalty, ...]


class EvidenceItem(ContractModel):
    framework_id: str = Field(min_length=1)
    eligibility: str = Field(min_length=1)
    artifact_ref: str = Field(min_length=1)
    limits: tuple[str, ...]


class EvidenceModule(ContractModel):
    items: tuple[EvidenceItem, ...]


DriverPolarity = Literal["supportive", "cautionary", "neutral"]
DriverImportance = Literal["low", "medium", "high", "critical"]


class DriverItem(ContractModel):
    """Package driver: explanatory contribution, not timing-quality score.

    Canonical fields: contribution, polarity, (optional) importance.
    Deprecated compatibility: score (abs magnitude 0..100), band (polarity
    projection). Never derive those via score_to_candidate_band().
    """

    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    contribution: float | None = None
    polarity: DriverPolarity | None = None
    importance: DriverImportance | None = None
    # Optional stable localization key from structured reason evidence.
    factor_key: str | None = None
    # DEPRECATED: magnitude-only compatibility for Package v1 required field.
    score: float = Field(ge=0, le=100)
    # DEPRECATED: polarity projection for Package v1 required field.
    band: str = Field(min_length=1)
    support: str
    friction: str

    @model_serializer(mode="wrap")
    def _omit_null_canonical_fields(self, handler):
        data = handler(self)
        for key in ("contribution", "polarity", "importance", "factor_key"):
            if data.get(key) is None:
                data.pop(key, None)
        return data


class DriversModule(ContractModel):
    items: tuple[DriverItem, ...]


class LimitedStringItemsModule(ContractModel):
    items: tuple[str, ...] = Field(max_length=3)


class ActionStep(ContractModel):
    order: int = Field(ge=1)
    action: str = Field(min_length=1)
    condition: str | None


class ActionPlanModule(ContractModel):
    steps: tuple[ActionStep, ...] = Field(min_length=1, max_length=7)


class CounterRecommendationModule(ContractModel):
    stance: Stance
    summary: str
    reason: str


class ExplainabilityModule(ContractModel):
    why: str
    why_not: str
    assumptions: tuple[str, ...]
    limits: tuple[str, ...]


class ImproveAccuracyModule(ContractModel):
    items: tuple[str, ...] = Field(max_length=5)


class DecisionLink(ContractModel):
    decision_type_id: str = Field(min_length=1)
    label: str = Field(min_length=1)


class NextDecisionsModule(ContractModel):
    items: tuple[DecisionLink, ...] = Field(max_length=3)


class RelatedDecisionsModule(ContractModel):
    items: tuple[DecisionLink, ...]


class SemanticShadowModule(ContractModel):
    """Additive experimental_shadow assessments. Not canonical. Not ranking.

    Omitted from Package dumps when absent so Package v1 clients unchanged.
    """

    schema_version: Literal["decision_assessment.v1-shadow"]
    semantic_status: Literal["experimental_shadow"]
    assessments: tuple[dict[str, Any], ...]
    score_vs_class_disagreements: tuple[dict[str, Any], ...] = ()
    find_window_semantic_warnings: tuple[dict[str, Any], ...] = ()
    policy: dict[str, Any] | None = None
    policy_pairs: tuple[dict[str, Any], ...] = ()
    window_policies: tuple[dict[str, Any], ...] = ()
    explanation: dict[str, Any] | None = None
    explanations: tuple[dict[str, Any], ...] = ()
    window_explanations: tuple[dict[str, Any], ...] = ()

    @model_serializer(mode="wrap")
    def _omit_empty_policy(self, handler):
        data = handler(self)
        if data.get("policy") is None:
            data.pop("policy", None)
        if data.get("explanation") is None:
            data.pop("explanation", None)
        return data


class DecisionEvaluationPackage(ContractModel):
    case_id: UUID
    evaluation_id: UUID
    evaluation_version: int = Field(ge=1)
    case_version: int = Field(ge=1)
    decision_type_id: str = Field(min_length=1)
    family_id: str = Field(min_length=1)
    mode: DecisionMode
    precision_level: PrecisionLevel
    engine_id: str = Field(min_length=1)
    created_at: datetime
    schema_version: Literal["1.0.0"]

    recommendation: RecommendationModule
    timing: TimingModule
    find: FindModule | None = None
    confidence: ConfidenceModule
    evidence: EvidenceModule
    drivers: DriversModule
    tradeoffs: LimitedStringItemsModule
    risks: LimitedStringItemsModule
    opportunities: LimitedStringItemsModule
    action_plan: ActionPlanModule
    counter_recommendation: CounterRecommendationModule
    explainability: ExplainabilityModule
    improve_accuracy: ImproveAccuracyModule
    next_decisions: NextDecisionsModule
    related_decisions: RelatedDecisionsModule
    semantic_shadow: SemanticShadowModule | None = None

    @model_serializer(mode="wrap")
    def _omit_empty_find(self, handler):
        data = handler(self)
        if data.get("find") is None:
            data.pop("find", None)
        if data.get("semantic_shadow") is None:
            data.pop("semantic_shadow", None)
        return data

    @model_validator(mode="after")
    def validate_mode_specific_timing(self) -> "DecisionEvaluationPackage":
        count = len(self.timing.candidates)

        if self.mode == "evaluate_date" and count != 1:
            raise ValueError("evaluate_date requires exactly one timing candidate")

        if self.mode == "compare_dates" and not 2 <= count <= 5:
            raise ValueError("compare_dates requires between 2 and 5 candidates")

        if self.mode == "find_dates":
            if self.find is None:
                raise ValueError("find_dates requires find module")
            if count > 5:
                raise ValueError("find_dates allows at most 5 timing candidates")
            if self.find.windows and count != len(self.find.windows):
                raise ValueError(
                    "find_dates timing candidates must mirror find windows"
                )
            if not self.find.windows and count != 0:
                raise ValueError(
                    "find_dates with no windows requires zero timing candidates"
                )
        elif self.find is not None:
            raise ValueError("find module is only valid for find_dates mode")

        if self.precision_level != self.confidence.precision_level:
            raise ValueError(
                "envelope precision_level must match confidence precision_level"
            )

        ranks = [candidate.rank for candidate in self.timing.candidates]
        if len(ranks) != len(set(ranks)):
            raise ValueError("timing candidate ranks must be unique")

        return self


__all__ = [
    "ActionPlanModule",
    "ActionStep",
    "ConfidenceModule",
    "ConfidencePenalty",
    "CounterRecommendationModule",
    "DecisionEvaluationPackage",
    "DecisionLink",
    "DecisionMode",
    "DriversModule",
    "EvidenceModule",
    "ExplainabilityModule",
    "FindModule",
    "FindWindowCandidate",
    "ImproveAccuracyModule",
    "NextDecisionsModule",
    "PrecisionLevel",
    "RecommendationModule",
    "RelatedDecisionsModule",
    "SemanticShadowModule",
    "Stance",
    "TimingCandidate",
    "TimingModule",
]
