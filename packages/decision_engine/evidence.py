"""Normalize scored astrology output into DecisionEvidence.

This module is an adapter only. It does not score, reweight, classify days,
emit commands, or invent temporal astrology fields the engine does not expose.

Pipeline position:
    astronomical signals → scored evidence → NORMALIZED EVIDENCE → …
"""

from __future__ import annotations

from typing import Any, Literal, Mapping, Sequence

from pydantic import BaseModel, ConfigDict

from packages.astro_engine.reasoning import (
    _natal_house_reasons,
    _retrograde_reasons,
    _split_charts,
    _transit_angular_reasons,
    _transit_house_reasons,
)
from packages.astro_engine.scoring_context import CONTEXT_NATAL, ScoringContext
from packages.decision_engine.evaluate.factor_keys import build_factor_key

EvidenceKind = Literal["aspect", "house", "angular", "retrograde"]
EvidencePolarity = Literal["supportive", "caution", "neutral"]
HouseScope = Literal["natal", "transit"]
ApplyingOrSeparating = Literal["applying", "separating"]

SOURCE_ENGINE = "astro_engine.scoring"

_SCORED_REASON_CATEGORIES = frozenset({"aspect", "house", "angular", "retrograde"})

UNKNOWN_TEMPORAL_FIELDS: tuple[str, ...] = (
    "applying_or_separating",
    "station_state",
    "speed_class",
    "duration_class",
    "orb_strength",
)


class DecisionEvidence(BaseModel):
    """One scored factor, identity-stable and localization-safe.

    Identity is ``evidence_id`` / ``factor_key`` from structured astronomy
    fields — never from translated titles or explanations.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    evidence_id: str
    factor_key: str | None
    kind: EvidenceKind
    polarity: EvidencePolarity
    contribution: float
    transit_body: str | None = None
    natal_target: str | None = None
    aspect_type: str | None = None
    orb: float | None = None
    house: int | None = None
    house_scope: HouseScope | None = None
    angle: str | None = None
    orb_band: str | None = None
    retrograde: bool | None = None
    source_engine: str = SOURCE_ENGINE
    source_layer: str
    # Explicit unknowns — do not populate unless the scoring engine emits them.
    applying_or_separating: ApplyingOrSeparating | None = None
    station_state: str | None = None
    speed_class: str | None = None
    duration_class: str | None = None
    orb_strength: float | None = None


def polarity_from_contribution(contribution: float) -> EvidencePolarity:
    """Map a signed score contribution to Decision Intelligence polarity.

    Package drivers use ``cautionary`` for the same negative sign. Calendar
    Decision Intelligence uses ``caution`` (Phase 0/1 vocabulary).
    """
    if contribution > 0:
        return "supportive"
    if contribution < 0:
        return "caution"
    return "neutral"


def dominant_evaluated_aspects(
    score_result: Mapping[str, Any],
    *,
    limit: int = 5,
) -> tuple[dict[str, Any], ...]:
    """Return the engine's own aspect records, ranked by |contribution|."""
    technical = score_result.get("technical") or {}
    raw = technical.get("aspects_evaluated") or []
    if not isinstance(raw, Sequence):
        return ()
    records = [dict(item) for item in raw if isinstance(item, Mapping)]
    records.sort(
        key=lambda rec: (
            -abs(float(rec.get("contribution") or 0.0)),
            float(rec.get("orb") or 0.0),
            str(rec.get("transit_planet") or ""),
            str(rec.get("natal_planet") or ""),
        )
    )
    return tuple(records[:limit])


def normalize_score_evidence(
    score_result: Mapping[str, Any],
    *,
    natal: Mapping[str, Any] | None = None,
    transit: Mapping[str, Any] | None = None,
    activity_type: str | None = None,
    reasoning: Mapping[str, Any] | None = None,
    scoring_context: ScoringContext | None = None,
) -> tuple[DecisionEvidence, ...]:
    """Project existing score/reasoning output into DecisionEvidence.

    Does not mutate ``score_result`` and does not recompute the 0–100 score.
    """
    ctx = scoring_context or _context_from_score_result(score_result)
    activity = activity_type or _activity_type_from_score_result(score_result)
    natal_data, transit_data = _resolve_charts(natal, transit)

    items: list[DecisionEvidence] = []
    seen_ids: set[str] = set()

    for rec in _aspect_records(score_result):
        evidence = _from_aspect_record(rec)
        _append_unique(items, seen_ids, evidence)

    reconstructed = _reconstruct_non_aspect_reasons(
        score_result,
        natal_data=natal_data,
        transit_data=transit_data,
        activity_type=activity,
        context=ctx,
    )
    if reconstructed:
        for reason in reconstructed:
            evidence = _from_reason(
                reason,
                source_layer=_source_layer_for_reason(reason),
            )
            _append_unique(items, seen_ids, evidence)
    elif isinstance(reasoning, Mapping):
        for reason in reasoning.get("reasons") or []:
            if not isinstance(reason, Mapping):
                continue
            if str(reason.get("category") or "") not in _SCORED_REASON_CATEGORIES:
                continue
            if str(reason.get("category") or "") == "aspect":
                # Aspects already come from technical.aspects_evaluated.
                continue
            evidence = _from_reason(reason, source_layer="reasoning.reasons")
            _append_unique(items, seen_ids, evidence)

    return tuple(items)


def unknown_temporal_fields(evidence: DecisionEvidence) -> dict[str, None]:
    """Return the temporal fields that must stay unknown in Phase 0/1."""
    return {name: getattr(evidence, name) for name in UNKNOWN_TEMPORAL_FIELDS}


def _append_unique(
    items: list[DecisionEvidence],
    seen_ids: set[str],
    evidence: DecisionEvidence | None,
) -> None:
    if evidence is None:
        return
    if evidence.evidence_id in seen_ids:
        return
    seen_ids.add(evidence.evidence_id)
    items.append(evidence)


def _aspect_records(score_result: Mapping[str, Any]) -> list[Mapping[str, Any]]:
    technical = score_result.get("technical") or {}
    raw = technical.get("aspects_evaluated") or []
    if not isinstance(raw, Sequence):
        return []
    return [item for item in raw if isinstance(item, Mapping)]


def _from_aspect_record(rec: Mapping[str, Any]) -> DecisionEvidence | None:
    transit = _token(rec.get("transit_planet"))
    natal = _token(rec.get("natal_planet"))
    aspect = _token(rec.get("aspect"))
    if not transit or not natal or not aspect:
        return None
    contribution = _round_contribution(rec.get("contribution", 0.0))
    orb = _optional_float(rec.get("orb"))
    structured = {
        "transit_planet": transit,
        "natal_planet": natal,
        "aspect": aspect,
        "orb": orb,
        "contribution": contribution,
    }
    factor_key = build_factor_key(structured, "aspect")
    return DecisionEvidence(
        evidence_id=_evidence_id(factor_key, "aspect", transit, aspect, natal),
        factor_key=factor_key,
        kind="aspect",
        polarity=polarity_from_contribution(contribution),
        contribution=contribution,
        transit_body=transit,
        natal_target=natal,
        aspect_type=aspect,
        orb=orb,
        source_layer="technical.aspects_evaluated",
    )


def _from_reason(
    reason: Mapping[str, Any],
    *,
    source_layer: str,
) -> DecisionEvidence | None:
    kind = str(reason.get("category") or "")
    if kind not in _SCORED_REASON_CATEGORIES:
        return None
    payload = reason.get("evidence") if isinstance(reason.get("evidence"), Mapping) else {}
    contribution = _round_contribution(reason.get("score", 0.0))
    factor_key = build_factor_key(payload, kind)

    transit_body = _token(
        payload.get("transit_planet") or payload.get("planet") or reason.get("planet")
    )
    natal_target = _token(payload.get("natal_planet"))
    aspect_type = _token(payload.get("aspect"))
    house = _optional_int(payload.get("house"))
    house_scope = _house_scope(payload.get("scope"))
    angle = _token(payload.get("angle"))
    orb = _optional_float(payload.get("orb"))
    orb_band = _token(payload.get("orb_band"))
    retrograde = _optional_bool(payload.get("retrograde"))
    if kind == "retrograde":
        retrograde = True if retrograde is None else retrograde
        natal_target = None
        aspect_type = None

    identity_parts = _identity_parts(
        kind,
        transit_body=transit_body,
        natal_target=natal_target,
        aspect_type=aspect_type,
        house=house,
        house_scope=house_scope,
        angle=angle,
        retrograde=retrograde if kind in {"house", "retrograde"} else None,
    )
    return DecisionEvidence(
        evidence_id=_evidence_id(factor_key, *identity_parts),
        factor_key=factor_key,
        kind=kind,  # type: ignore[arg-type]
        polarity=polarity_from_contribution(contribution),
        contribution=contribution,
        transit_body=transit_body if kind != "house" or house_scope == "transit" else None,
        natal_target=(
            natal_target
            if kind == "aspect"
            else (_token(payload.get("planet")) if kind == "house" and house_scope == "natal" else None)
        ),
        aspect_type=aspect_type,
        orb=orb,
        house=house,
        house_scope=house_scope,
        angle=angle,
        orb_band=orb_band,
        retrograde=retrograde,
        source_layer=source_layer,
    )


def _reconstruct_non_aspect_reasons(
    score_result: Mapping[str, Any],
    *,
    natal_data: Mapping[str, Any],
    transit_data: Mapping[str, Any],
    activity_type: str | None,
    context: ScoringContext,
) -> list[dict[str, Any]]:
    if not activity_type:
        return []
    has_natal = bool(_extract_planets(natal_data))
    has_transit = bool(_extract_planets(transit_data) or transit_data.get("evaluation"))
    if not has_natal and not has_transit:
        return []

    reasons: list[dict[str, Any]] = []
    reasons.extend(
        _natal_house_reasons(natal_data, activity_type, score_result, context)
    )
    reasons.extend(_transit_house_reasons(transit_data, activity_type, context))
    reasons.extend(_transit_angular_reasons(transit_data, activity_type, context))
    reasons.extend(_retrograde_reasons(transit_data, activity_type, score_result))
    return reasons


def _source_layer_for_reason(reason: Mapping[str, Any]) -> str:
    category = str(reason.get("category") or "")
    evidence = reason.get("evidence") if isinstance(reason.get("evidence"), Mapping) else {}
    if category == "house":
        scope = str(evidence.get("scope") or "")
        if evidence.get("retrograde") is True:
            return "scoring.transit_house_score"
        if scope == "natal":
            return "scoring.natal_house_bonus"
        return "scoring.transit_house_score"
    if category == "angular":
        return "scoring.transit_angular_score"
    if category == "retrograde":
        return "scoring.retrograde_penalty"
    return "astro_engine.reasoning"


def _context_from_score_result(score_result: Mapping[str, Any]) -> ScoringContext:
    technical = score_result.get("technical") or {}
    raw = technical.get("scoring_context") or {}
    if not isinstance(raw, Mapping):
        return CONTEXT_NATAL
    location_mode = raw.get("location_mode") or CONTEXT_NATAL.location_mode
    return ScoringContext(
        location_mode=location_mode,
        include_natal_house_bonus=bool(
            raw.get("include_natal_house_bonus", CONTEXT_NATAL.include_natal_house_bonus)
        ),
        include_transit_house_score=bool(
            raw.get("include_transit_house_score", CONTEXT_NATAL.include_transit_house_score)
        ),
        include_transit_angular_score=bool(
            raw.get("include_transit_angular_score", CONTEXT_NATAL.include_transit_angular_score)
        ),
    )


def _activity_type_from_score_result(score_result: Mapping[str, Any]) -> str | None:
    technical = score_result.get("technical") or {}
    value = technical.get("activity_type")
    return str(value) if value else None


def _resolve_charts(
    natal: Mapping[str, Any] | None,
    transit: Mapping[str, Any] | None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    if natal is None and transit is None:
        return {}, {}
    if natal is not None and transit is not None:
        return dict(natal), dict(transit)
    combined: dict[str, Any] = {}
    if natal is not None:
        combined["natal"] = dict(natal)
    if transit is not None:
        combined["transit"] = dict(transit)
    return _split_charts(combined)


def _extract_planets(chart: Mapping[str, Any]) -> dict[str, Any]:
    planets = chart.get("planets")
    if isinstance(planets, Mapping) and planets:
        return dict(planets)
    return {}


def _evidence_id(factor_key: str | None, *parts: Any) -> str:
    if factor_key:
        return f"ev.{factor_key}"
    tokens = [str(part).strip().lower() for part in parts if part not in (None, "")]
    return "ev." + ".".join(tokens) if tokens else "ev.unknown"


def _identity_parts(
    kind: str,
    *,
    transit_body: str | None,
    natal_target: str | None,
    aspect_type: str | None,
    house: int | None,
    house_scope: str | None,
    angle: str | None,
    retrograde: bool | None,
) -> tuple[Any, ...]:
    extra = "retrograde" if retrograde is True else None
    return (
        kind,
        house_scope,
        transit_body,
        natal_target,
        aspect_type,
        house,
        angle,
        extra,
    )


def _house_scope(value: Any) -> HouseScope | None:
    token = _token(value)
    if token in {"natal", "transit"}:
        return token  # type: ignore[return-value]
    return None


def _token(value: Any) -> str | None:
    if value is None or isinstance(value, bool):
        return None
    text = str(value).strip().lower().replace(" ", "_")
    return text or None


def _optional_float(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def _optional_int(value: Any) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _optional_bool(value: Any) -> bool | None:
    if value is True:
        return True
    if value is False:
        return False
    return None


def _round_contribution(value: Any) -> float:
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


__all__ = [
    "DecisionEvidence",
    "EvidenceKind",
    "EvidencePolarity",
    "SOURCE_ENGINE",
    "UNKNOWN_TEMPORAL_FIELDS",
    "dominant_evaluated_aspects",
    "normalize_score_evidence",
    "polarity_from_contribution",
    "unknown_temporal_fields",
]
