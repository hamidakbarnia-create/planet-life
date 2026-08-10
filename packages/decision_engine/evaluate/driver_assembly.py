"""Canonical Package driver assembly from Outcome evidence references.

Concepts (must not share scales):
- candidate.score: timing-quality 0..100
- driver.contribution: signed explanatory contribution (not timing quality)
- driver.polarity: supportive | cautionary | neutral
- driver.importance: explanatory magnitude metadata (not polarity)
- confidence: assessment confidence (separate)

Legacy Package v1 fields ``score`` / ``band`` remain for compatibility only:
- score = abs(contribution) clamped to 0..100 (magnitude, not timing quality)
- band = polarity projection (supportive→high, cautionary→low, neutral→moderate)
These MUST NOT be derived via score_to_candidate_band().
"""

from __future__ import annotations

from typing import Any, Literal, Mapping

from packages.decision_engine.evaluate.factor_keys import build_factor_key
from packages.decision_engine.models import DecisionOutcome, EvidenceReference

DriverPolarity = Literal["supportive", "cautionary", "neutral"]

_VALID_IMPORTANCE = frozenset({"low", "medium", "high", "critical"})


def polarity_from_contribution(contribution: float) -> DriverPolarity:
    if contribution > 0:
        return "supportive"
    if contribution < 0:
        return "cautionary"
    return "neutral"


def legacy_score_from_contribution(contribution: float) -> float:
    """Deprecated magnitude-only field for Package v1 required ``score``."""
    return min(100.0, abs(float(contribution)))


def legacy_band_from_polarity(polarity: DriverPolarity) -> str:
    """Deprecated polarity projection for Package v1 required ``band``.

    Not candidate timing banding (score_to_candidate_band).
    """
    if polarity == "supportive":
        return "high"
    if polarity == "cautionary":
        return "low"
    return "moderate"


def normalize_importance(raw: str | None) -> str | None:
    if not raw:
        return None
    value = str(raw).strip().lower()
    if value in _VALID_IMPORTANCE:
        return value
    return None


def driver_id_for_reference(ref: EvidenceReference, index: int) -> str:
    """Stable-enough id from existing provenance — no invented metadata."""
    evidence = ref.evidence if isinstance(ref.evidence, dict) else {}
    planet = evidence.get("planet")
    parts: list[str] = []
    if ref.category:
        parts.append(str(ref.category).strip().lower().replace(" ", "_"))
    if planet:
        parts.append(str(planet).strip().lower().replace(" ", "_"))
    parts.append(str(index + 1))
    return "-".join(parts)


def map_evidence_reference_to_driver(
    ref: EvidenceReference,
    *,
    index: int,
) -> dict[str, Any]:
    """Map one Outcome evidence reference to a Package driver item."""
    contribution = float(ref.score) if ref.score is not None else 0.0
    polarity = polarity_from_contribution(contribution)
    importance = normalize_importance(ref.importance)
    label = (ref.title or ref.category or f"Evidence {index + 1}").strip()
    detail = (ref.detail or "").strip()

    if polarity == "cautionary":
        support = ""
        friction = detail[:240]
    else:
        support = detail[:240]
        friction = ""

    item: dict[str, Any] = {
        "id": driver_id_for_reference(ref, index),
        "label": label[:80],
        "contribution": contribution,
        "polarity": polarity,
        # Deprecated compatibility fields — see module docstring.
        "score": legacy_score_from_contribution(contribution),
        "band": legacy_band_from_polarity(polarity),
        "support": support,
        "friction": friction,
    }
    if importance is not None:
        item["importance"] = importance
    factor_key = build_factor_key(
        ref.evidence if isinstance(ref.evidence, dict) else None,
        ref.category,
    )
    if factor_key:
        item["factor_key"] = factor_key
    return item


def assemble_drivers_from_outcome(outcome: DecisionOutcome) -> list[dict[str, Any]]:
    return [
        map_evidence_reference_to_driver(ref, index=index)
        for index, ref in enumerate(outcome.evidence_references[:5])
    ]


def strategic_string_factors(
    outcome: DecisionOutcome,
    key: str,
    *,
    limit: int = 3,
) -> list[str]:
    """Pull existing strategic opportunity/risk factor strings when present."""
    payload = outcome.source_activity_response or {}
    strategic = payload.get("strategic")
    if not isinstance(strategic, Mapping):
        return []
    raw = strategic.get(key)
    if not isinstance(raw, list):
        return []
    items: list[str] = []
    for entry in raw:
        text = str(entry).strip()
        if text:
            items.append(text[:200])
        if len(items) >= limit:
            break
    return items


__all__ = [
    "DriverPolarity",
    "assemble_drivers_from_outcome",
    "build_factor_key",
    "driver_id_for_reference",
    "legacy_band_from_polarity",
    "legacy_score_from_contribution",
    "map_evidence_reference_to_driver",
    "normalize_importance",
    "polarity_from_contribution",
    "strategic_string_factors",
]
