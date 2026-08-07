"""Canonical DecisionEvaluationPackage v1 Python models.

Authority:
- ACR-0001 §B3
- EPIC-001 Decision Case Engineering Spec Part 3

These models do not replace the JSON Schema as the contract source.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


Stance = Literal[
    "proceed",
    "proceed_with_conditions",
    "wait",
    "prefer_alternate",
    "insufficient_data",
]
DecisionMode = Literal["evaluate_date", "compare_dates"]
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


class DriverItem(ContractModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    score: float = Field(ge=0, le=100)
    band: str = Field(min_length=1)
    support: str
    friction: str


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

    @model_validator(mode="after")
    def validate_mode_specific_timing(self) -> "DecisionEvaluationPackage":
        count = len(self.timing.candidates)

        if self.mode == "evaluate_date" and count != 1:
            raise ValueError("evaluate_date requires exactly one timing candidate")

        if self.mode == "compare_dates" and not 2 <= count <= 5:
            raise ValueError("compare_dates requires between 2 and 5 candidates")

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
    "ImproveAccuracyModule",
    "NextDecisionsModule",
    "PrecisionLevel",
    "RecommendationModule",
    "RelatedDecisionsModule",
    "Stance",
    "TimingCandidate",
    "TimingModule",
]
