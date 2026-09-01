"""Phase 2B — DecisionDimensions from normalized DecisionEvidence.

EXPERIMENTAL SHADOW LAYER. Not canonical classification or command semantics.

Semantic decomposition of existing scored evidence. Does not recompute
``executive.score``, emit commands, or replace provisional Phase 2A
classification.

Baseline ``50`` is a neutral midpoint on the same 0–100 display scale as the
legacy executive score. It is not a probability and is not ``executive.score``.
A baseline value with ``status=insufficient`` is unknown, not neutral evidence.

``evidence_strength`` is normalized evidence mass for that dimension
(``min(1, Σ|delta| / 18)``). It is not prediction confidence, certainty, or
probability.
"""

from __future__ import annotations

from typing import Literal, Sequence

from pydantic import BaseModel, ConfigDict, Field

from packages.decision_engine.day_classification import MATERIAL_CONTRIBUTION
from packages.decision_engine.dimension_mapping import (
    BODY_DIMENSION_WEIGHTS,
    CONTRIBUTION_UNIT,
    DIMENSION_BASELINE,
    DIMENSION_KEYS,
    INVERTED_DIMENSIONS,
    KIND_DIMENSION_WEIGHTS,
    MAPPING_VERSION,
    NATAL_TARGET_DIMENSION_WEIGHTS,
    SEMANTIC_STATUS,
    merge_dimension_weights,
)
from packages.decision_engine.evidence import DecisionEvidence

DimensionStatus = Literal["scored", "insufficient"]


class DecisionDimension(BaseModel):
    """One named decision dimension with value + evidence provenance.

    ``evidence_strength`` is evidence mass / support coverage, range 0..1 or
    null. It is not prediction confidence. Null iff ``status=insufficient``.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    value: int = Field(ge=0, le=100)
    evidence_strength: float | None = Field(default=None, ge=0.0, le=1.0)
    status: DimensionStatus
    supportive_evidence_ids: tuple[str, ...] = ()
    caution_evidence_ids: tuple[str, ...] = ()
    dominant_evidence_ids: tuple[str, ...] = ()
    conflicted: bool = False


class DecisionDimensions(BaseModel):
    """Parallel experimental dimension set. Independent of executive.score.

    ``semantic_status`` is ``experimental_shadow``. Do not treat as canonical
    day class or as a decision command.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    mapping_version: str = MAPPING_VERSION
    semantic_status: str = SEMANTIC_STATUS
    baseline: int = DIMENSION_BASELINE
    action_type: str | None = None
    opportunity: DecisionDimension
    momentum: DecisionDimension
    clarity: DecisionDimension
    stability: DecisionDimension
    cooperation: DecisionDimension
    pressure: DecisionDimension
    reversibility_safety: DecisionDimension

    def as_value_map(self) -> dict[str, int]:
        return {key: getattr(self, key).value for key in DIMENSION_KEYS}


def compute_decision_dimensions(
    evidence: Sequence[DecisionEvidence],
    *,
    action_type: str | None = None,
) -> DecisionDimensions:
    """Derive dimensions from evidence only. Order-independent. No LLM.

    Does not read ``executive.score`` or unsupported temporal fields.
    Generic body routing uses ``transit_body`` only.
    """
    ordered = tuple(sorted(evidence, key=lambda item: item.evidence_id))
    buckets: dict[str, _Bucket] = {key: _Bucket() for key in DIMENSION_KEYS}

    for item in ordered:
        weights = _weights_for(item)
        if not weights:
            continue
        for dimension, weight in weights.items():
            buckets[dimension].add(
                item,
                weight,
                invert=dimension in INVERTED_DIMENSIONS,
            )

    dims = {key: buckets[key].to_dimension() for key in DIMENSION_KEYS}
    return DecisionDimensions(
        mapping_version=MAPPING_VERSION,
        semantic_status=SEMANTIC_STATUS,
        baseline=DIMENSION_BASELINE,
        action_type=action_type,
        **dims,
    )


class _Bucket:
    def __init__(self) -> None:
        self.deltas: list[float] = []
        self.supportive: list[str] = []
        self.caution: list[str] = []
        self.ranked: list[tuple[float, str]] = []
        self.material_supportive = False
        self.material_caution = False

    def add(self, item: DecisionEvidence, weight: float, *, invert: bool) -> None:
        signed = item.contribution * weight
        delta = -signed if invert else signed
        self.deltas.append(delta)
        if item.polarity == "supportive":
            self.supportive.append(item.evidence_id)
            if abs(item.contribution) >= MATERIAL_CONTRIBUTION:
                self.material_supportive = True
        elif item.polarity == "caution":
            self.caution.append(item.evidence_id)
            if abs(item.contribution) >= MATERIAL_CONTRIBUTION:
                self.material_caution = True
        self.ranked.append((-abs(item.contribution), item.evidence_id))

    def to_dimension(self) -> DecisionDimension:
        if not self.deltas:
            return DecisionDimension(
                value=DIMENSION_BASELINE,
                evidence_strength=None,
                status="insufficient",
            )
        value = max(0, min(100, round(DIMENSION_BASELINE + sum(self.deltas))))
        mass = sum(abs(delta) for delta in self.deltas)
        strength = max(0.0, min(1.0, mass / CONTRIBUTION_UNIT))
        return DecisionDimension(
            value=value,
            evidence_strength=round(strength, 4),
            status="scored",
            supportive_evidence_ids=tuple(sorted(set(self.supportive))),
            caution_evidence_ids=tuple(sorted(set(self.caution))),
            dominant_evidence_ids=_dominant_ids(self.ranked),
            conflicted=self.material_supportive and self.material_caution,
        )


def _weights_for(item: DecisionEvidence) -> dict[str, float]:
    groups: list[tuple[tuple[str, float], ...]] = []
    if item.transit_body:
        mapped = BODY_DIMENSION_WEIGHTS.get(item.transit_body)
        if mapped:
            groups.append(mapped)
    if item.natal_target:
        natal_mapped = NATAL_TARGET_DIMENSION_WEIGHTS.get(item.natal_target)
        if natal_mapped:
            groups.append(natal_mapped)
    kind_mapped = KIND_DIMENSION_WEIGHTS.get(item.kind)
    if kind_mapped:
        groups.append(kind_mapped)
    if not groups:
        return {}
    return merge_dimension_weights(*groups)


def _dominant_ids(ranked: list[tuple[float, str]]) -> tuple[str, ...]:
    seen: list[str] = []
    for _, evidence_id in sorted(ranked):
        if evidence_id in seen:
            continue
        seen.append(evidence_id)
        if len(seen) == 3:
            break
    return tuple(seen)


def dimensions_payload(dimensions: DecisionDimensions) -> dict:
    """JSON-ready dump. No commands. Experimental shadow metadata included."""
    return dimensions.model_dump(mode="json")


__all__ = [
    "DecisionDimension",
    "DecisionDimensions",
    "compute_decision_dimensions",
    "dimensions_payload",
]
