"""Canonical evidence contract for Decision Intelligence.

This module does not score astrology and does not generate recommendations.
It provides stable, typed provenance so Calendar, Evaluate, Compare and Find can
consume the same engine-backed facts without inventing parallel semantics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Mapping

EvidenceKind = Literal[
    "aspect",
    "natal_house",
    "transit_house",
    "angular",
    "retrograde",
    "electional_timing",
]
EvidencePolarity = Literal["supportive", "caution", "neutral"]
TemporalPhase = Literal["applying", "exact", "separating", "unknown"]
SpeedClass = Literal["fast", "structural", "unknown"]
StationState = Literal[
    "approaching_station",
    "stationary",
    "leaving_station",
    "none",
    "unknown",
]
DurationClass = Literal["intraday", "short", "medium", "structural", "unknown"]


@dataclass(frozen=True, slots=True)
class DecisionEvidence:
    """One traceable scored fact consumed by decision semantics.

    Temporal fields default to ``unknown`` until the astronomy pipeline can
    provide them deterministically. Consumers must never infer them from prose.
    """

    evidence_id: str
    factor_key: str
    kind: EvidenceKind
    polarity: EvidencePolarity
    contribution: float
    domain_tags: tuple[str, ...] = ()
    context_tags: tuple[str, ...] = ()
    transit_body: str | None = None
    natal_target: str | None = None
    aspect_type: str | None = None
    orb: float | None = None
    orb_strength: float | None = None
    phase: TemporalPhase = "unknown"
    speed_class: SpeedClass = "unknown"
    station_state: StationState = "unknown"
    duration_class: DurationClass = "unknown"
    retrograde: bool | None = None
    transit_house: int | None = None
    natal_house: int | None = None
    angle: str | None = None
    angular_orb: float | None = None
    raw_weight: float | None = None
    weighted_contribution: float | None = None
    source: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.evidence_id.strip():
            raise ValueError("evidence_id must be non-empty")
        if not self.factor_key.strip():
            raise ValueError("factor_key must be non-empty")
        if self.orb is not None and self.orb < 0:
            raise ValueError("orb must be >= 0")
        if self.orb_strength is not None and not 0.0 <= self.orb_strength <= 1.0:
            raise ValueError("orb_strength must be within 0..1")
        if self.angular_orb is not None and self.angular_orb < 0:
            raise ValueError("angular_orb must be >= 0")
        for house in (self.transit_house, self.natal_house):
            if house is not None and not 1 <= house <= 12:
                raise ValueError("house must be within 1..12")


def polarity_from_contribution(contribution: float) -> EvidencePolarity:
    if contribution > 0:
        return "supportive"
    if contribution < 0:
        return "caution"
    return "neutral"


__all__ = [
    "DecisionEvidence",
    "DurationClass",
    "EvidenceKind",
    "EvidencePolarity",
    "SpeedClass",
    "StationState",
    "TemporalPhase",
    "polarity_from_contribution",
]
