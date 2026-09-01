"""Language-neutral contracts for actionable Day Intelligence.

These models deliberately separate opportunity from confidence and reserve
commands/classifications for deterministic semantics. They contain no LLM copy.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Literal

DecisionCommand = Literal[
    "ACT",
    "ADVANCE",
    "NEGOTIATE",
    "VERIFY",
    "REVIEW",
    "WAIT",
    "PROTECT",
    "REPAIR",
    "EXPLORE",
    "COMMIT_WITH_CAUTION",
    "AVOID_IRREVERSIBLE_ACTION",
]

DayClassification = Literal[
    "HIGH_LEVERAGE_DAY",
    "ACTION_DAY",
    "BUILD_DAY",
    "REVIEW_DAY",
    "DEFENSIVE_DAY",
    "RECOVERY_DAY",
    "MIXED_SELECTIVE_DAY",
    "AVOID_IRREVERSIBLE_DECISIONS",
]

PersonalizationLevel = Literal["full", "partial", "generic"]
ConfidenceBand = Literal["high", "moderate", "low"]
DomainState = Literal["strong", "supportive", "mixed", "caution", "weak"]


@dataclass(frozen=True, slots=True)
class DecisionDimensions:
    opportunity: float
    momentum: float
    clarity: float
    stability: float
    cooperation: float
    pressure: float
    reversibility_safety: float

    def __post_init__(self) -> None:
        for name in (
            "opportunity",
            "momentum",
            "clarity",
            "stability",
            "cooperation",
            "pressure",
            "reversibility_safety",
        ):
            value = float(getattr(self, name))
            if not 0.0 <= value <= 100.0:
                raise ValueError(f"{name} must be within 0..100")


@dataclass(frozen=True, slots=True)
class DomainIntelligence:
    domain: str
    score: float
    state: DomainState
    command: DecisionCommand
    confidence: float
    driver_ids: tuple[str, ...] = ()
    caution_ids: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.domain.strip():
            raise ValueError("domain must be non-empty")
        if not 0.0 <= self.score <= 100.0:
            raise ValueError("domain score must be within 0..100")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("domain confidence must be within 0..1")


@dataclass(frozen=True, slots=True)
class DayIntelligence:
    day: date
    action_type: str
    score: float
    classification: DayClassification
    command: DecisionCommand
    confidence: float
    confidence_band: ConfidenceBand
    personalization: PersonalizationLevel
    dimensions: DecisionDimensions
    domains: tuple[DomainIntelligence, ...] = ()
    best_move_keys: tuple[str, ...] = ()
    avoid_keys: tuple[str, ...] = ()
    supportive_evidence_ids: tuple[str, ...] = ()
    caution_evidence_ids: tuple[str, ...] = ()
    window_id: str | None = None
    next_similar_day: date | None = None
    better_alternative: date | None = None
    high_stakes: bool = False
    timing_only: bool = False

    def __post_init__(self) -> None:
        if not self.action_type.strip():
            raise ValueError("action_type must be non-empty")
        if not 0.0 <= self.score <= 100.0:
            raise ValueError("score must be within 0..100")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be within 0..1")
        if self.high_stakes and not self.timing_only:
            raise ValueError("high-stakes Day Intelligence must be timing_only")


__all__ = [
    "ConfidenceBand",
    "DayClassification",
    "DayIntelligence",
    "DecisionCommand",
    "DecisionDimensions",
    "DomainIntelligence",
    "DomainState",
    "PersonalizationLevel",
]
