"""
Deterministic astrological reasoning from existing score components and chart evidence.

Converts scored chart facts into structured explanations without LLMs or new scoring.
"""

from __future__ import annotations

from typing import Any, Literal, Mapping

from packages.astro_engine.scoring import (
    ANGULAR_WEIGHT,
    BENEFIC_TRANSIT,
    PRESSURE_TRANSIT,
    TRANSIT_HOUSE_RULES,
    _angular_separation,
    _chart_angles,
    _extract_bodies,
    _house,
    _longitude,
    _nearest_angle_band,
    _planet_weight,
    _resolve_profile,
    _transit_house_rules_key,
)
from packages.astro_engine.scoring_context import CONTEXT_NATAL, ScoringContext

ReasonCategory = Literal[
    "house",
    "angular",
    "aspect",
    "retrograde",
    "electional_timing",
]

Importance = Literal["high", "medium", "low"]

IMPORTANCE_RANK: dict[str, int] = {"high": 0, "medium": 1, "low": 2}

HOUSE_ORDINALS = {
    1: "1st",
    2: "2nd",
    3: "3rd",
    4: "4th",
    5: "5th",
    6: "6th",
    7: "7th",
    8: "8th",
    9: "9th",
    10: "10th",
    11: "11th",
    12: "12th",
}

LOCATION_MODE_LABELS = {
    "birthOnly": "birth location",
    "currentLiving": "current living location",
    "eventLocation": "event location",
    "targetSubject": "target location",
    "birthAndTarget": "birth and target location",
}


def _planet_label(name: str) -> str:
    return name.replace("_", " ").title()


def _house_label(house: int) -> str:
    return HOUSE_ORDINALS.get(house, str(house))


def _importance(score: float, *, orb_band: str | None = None) -> Importance:
    if orb_band == "strong" and abs(score) >= 1.5:
        return "high"
    if abs(score) >= 4.0:
        return "high"
    if abs(score) >= 2.0:
        return "medium"
    return "low"


def _split_charts(chart_data: Mapping[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    if not isinstance(chart_data, dict):
        return {}, {}

    natal_raw = chart_data.get("natal")
    transit_raw = chart_data.get("transit")
    if isinstance(natal_raw, dict) and isinstance(transit_raw, dict):
        return natal_raw, transit_raw
    if isinstance(transit_raw, dict):
        natal = natal_raw if isinstance(natal_raw, dict) else {}
        return natal, transit_raw
    if isinstance(natal_raw, dict):
        return natal_raw, chart_data if "evaluation" in chart_data else {}
    if "evaluation" in chart_data or "planets" in chart_data:
        return {}, chart_data
    return {}, {}


def _reason(
    *,
    category: ReasonCategory,
    planet: str,
    score: float,
    title: str,
    explanation: str,
    evidence: dict[str, Any],
    orb_band: str | None = None,
) -> dict[str, Any]:
    rounded = round(score, 2)
    return {
        "category": category,
        "planet": _planet_label(planet) if planet else "",
        "importance": _importance(rounded, orb_band=orb_band),
        "score": rounded,
        "title": title,
        "explanation": explanation,
        "evidence": evidence,
    }


def _aspect_reasons(score_result: Mapping[str, Any]) -> list[dict[str, Any]]:
    technical = score_result.get("technical") or {}
    aspects = technical.get("aspects_evaluated") or []
    reasons: list[dict[str, Any]] = []
    for rec in aspects:
        contribution = float(rec.get("contribution", 0.0))
        if contribution == 0.0:
            continue
        transit = str(rec.get("transit_planet", ""))
        natal = str(rec.get("natal_planet", ""))
        aspect = str(rec.get("aspect", ""))
        orb = float(rec.get("orb", 0.0))
        direction = "supports" if contribution > 0 else "challenges"
        title = (
            f"Transit {_planet_label(transit)} {aspect} natal {_planet_label(natal)}"
        )
        explanation = (
            f"Transit {_planet_label(transit)} forms a {aspect} to natal "
            f"{_planet_label(natal)} (orb {orb:.1f}°), which {direction} this activity."
        )
        reasons.append(
            _reason(
                category="aspect",
                planet=transit,
                score=contribution,
                title=title,
                explanation=explanation,
                evidence={
                    "transit_planet": transit,
                    "natal_planet": natal,
                    "aspect": aspect,
                    "orb": round(orb, 2),
                    "contribution": round(contribution, 2),
                    "label": rec.get("label"),
                },
            )
        )
    return reasons


def _natal_house_reasons(
    natal_data: Mapping[str, Any],
    activity_type: str,
    score_result: Mapping[str, Any],
    context: ScoringContext,
) -> list[dict[str, Any]]:
    if not context.include_natal_house_bonus:
        return []
    breakdown = (score_result.get("strategic") or {}).get("component_breakdown") or {}
    if float(breakdown.get("natal_house_bonus", 0.0)) == 0.0:
        return []

    profile = _resolve_profile(activity_type)
    natal = _extract_bodies(natal_data)
    reasons: list[dict[str, Any]] = []
    for name, body in natal.items():
        house = _house(body)
        if house is None or house not in profile.supportive_houses:
            continue
        pts = 1.5
        reasons.append(
            _reason(
                category="house",
                planet=name,
                score=pts,
                title=f"Natal {_planet_label(name)} in {_house_label(house)} house",
                explanation=(
                    f"Natal {_planet_label(name)} occupies the {_house_label(house)} house, "
                    f"a supportive sector for {profile.label.lower()}."
                ),
                evidence={
                    "scope": "natal",
                    "planet": name,
                    "house": house,
                    "longitude": _longitude(body),
                    "supportive_houses": list(profile.supportive_houses),
                },
            )
        )
    return reasons


def _transit_house_reasons(
    transit_data: Mapping[str, Any],
    activity_type: str,
    context: ScoringContext,
) -> list[dict[str, Any]]:
    if not context.include_transit_house_score:
        return []

    rules_key = _transit_house_rules_key(activity_type)
    rules = TRANSIT_HOUSE_RULES[rules_key]
    profile = _resolve_profile(activity_type)
    transit = _extract_bodies(transit_data)
    positive_h = set(rules["positive"])
    caution_h = set(rules["caution"])
    pos_planets = set(rules["positive_planets"])
    caution_planets = set(rules["caution_planets"])
    eval_meta = transit_data.get("evaluation") or {}

    reasons: list[dict[str, Any]] = []
    for name, body in transit.items():
        house = _house(body)
        if house is None:
            continue
        weight = _planet_weight(name, profile)
        lon = _longitude(body)

        if house in positive_h and name in pos_planets:
            pts = 2.2 * weight
            reasons.append(
                _reason(
                    category="house",
                    planet=name,
                    score=pts,
                    title=f"Transit {_planet_label(name)} in local {_house_label(house)} house",
                    explanation=(
                        f"Transit {_planet_label(name)} falls in the local {_house_label(house)} "
                        f"house at the evaluation location, a supportive placement for "
                        f"{profile.label.lower()}."
                    ),
                    evidence={
                        "scope": "transit",
                        "planet": name,
                        "house": house,
                        "longitude": lon,
                        "evaluation_location": eval_meta.get("calculated_for"),
                        "rule_set": rules_key,
                        "polarity": "supportive",
                    },
                )
            )
        elif house in caution_h and name in caution_planets:
            pts = -2.0 * weight
            reasons.append(
                _reason(
                    category="house",
                    planet=name,
                    score=pts,
                    title=f"Transit {_planet_label(name)} in caution house {house}",
                    explanation=(
                        f"Transit {_planet_label(name)} occupies the local {_house_label(house)} "
                        f"house, flagged as caution for {profile.label.lower()}."
                    ),
                    evidence={
                        "scope": "transit",
                        "planet": name,
                        "house": house,
                        "longitude": lon,
                        "evaluation_location": eval_meta.get("calculated_for"),
                        "rule_set": rules_key,
                        "polarity": "caution",
                    },
                )
            )

        if (
            body.get("retrograde")
            and name in ("mercury", "venus", "mars")
            and house in caution_h
        ):
            pts = -1.5 * weight
            reasons.append(
                _reason(
                    category="house",
                    planet=name,
                    score=pts,
                    title=f"Retrograde {_planet_label(name)} in caution house {house}",
                    explanation=(
                        f"Retrograde {_planet_label(name)} in the local {_house_label(house)} "
                        f"house adds friction for timing and follow-through."
                    ),
                    evidence={
                        "scope": "transit",
                        "planet": name,
                        "house": house,
                        "retrograde": True,
                        "evaluation_location": eval_meta.get("calculated_for"),
                        "rule_set": rules_key,
                    },
                )
            )
    return reasons


def _transit_angular_reasons(
    transit_data: Mapping[str, Any],
    activity_type: str,
    context: ScoringContext,
) -> list[dict[str, Any]]:
    if not context.include_transit_angular_score:
        return []

    angles = _chart_angles(transit_data)
    if not angles:
        return []

    rules_key = _transit_house_rules_key(activity_type)
    if rules_key == "real_estate":
        favored_angles = ("ic", "asc", "mc")
        pressure_angles = ("ic", "mc", "asc", "dsc")
    elif rules_key == "contract_signing":
        favored_angles = ("mc", "asc", "dsc")
        pressure_angles = ("dsc", "mc", "asc")
    else:
        favored_angles = ("mc", "asc")
        pressure_angles = ("mc", "asc", "dsc")

    profile = _resolve_profile(activity_type)
    transit = _extract_bodies(transit_data)
    eval_meta = transit_data.get("evaluation") or {}
    reasons: list[dict[str, Any]] = []

    for name, body in transit.items():
        lon = _longitude(body)
        if lon is None:
            continue
        weight = _planet_weight(name, profile)
        best_band: str | None = None
        best_angle = ""
        best_separation = 999.0
        for angle_name, angle_val in angles.items():
            band = _nearest_angle_band(lon, angle_val)
            if band is None:
                continue
            separation = _angular_separation(lon, angle_val)
            if best_band is None or ANGULAR_WEIGHT[band] > ANGULAR_WEIGHT[best_band]:
                best_band = band
                best_angle = angle_name
                best_separation = separation

        if best_band is None:
            continue

        mult = ANGULAR_WEIGHT[best_band]
        angle_label = best_angle.upper()
        if name in BENEFIC_TRANSIT and best_angle in favored_angles:
            pts = 3.5 * mult * weight
            reasons.append(
                _reason(
                    category="angular",
                    planet=name,
                    score=pts,
                    title=f"{_planet_label(name)} near {angle_label}",
                    explanation=(
                        f"Transit {_planet_label(name)} is within a {best_band} orb of "
                        f"local {angle_label}, highlighting visibility and timing at the "
                        f"evaluation location."
                    ),
                    evidence={
                        "planet": name,
                        "angle": best_angle,
                        "orb_band": best_band,
                        "separation_degrees": round(best_separation, 2),
                        "longitude": lon,
                        "angle_longitude": angles[best_angle],
                        "evaluation_location": eval_meta.get("calculated_for"),
                    },
                    orb_band=best_band,
                )
            )
        elif name in PRESSURE_TRANSIT and best_angle in pressure_angles:
            pts = -3.0 * mult * weight
            reasons.append(
                _reason(
                    category="angular",
                    planet=name,
                    score=pts,
                    title=f"{_planet_label(name)} pressure near {angle_label}",
                    explanation=(
                        f"Transit {_planet_label(name)} sits near local {angle_label} "
                        f"({best_band} orb), adding resistance or delay themes."
                    ),
                    evidence={
                        "planet": name,
                        "angle": best_angle,
                        "orb_band": best_band,
                        "separation_degrees": round(best_separation, 2),
                        "longitude": lon,
                        "angle_longitude": angles[best_angle],
                        "evaluation_location": eval_meta.get("calculated_for"),
                    },
                    orb_band=best_band,
                )
            )
    return reasons


def _retrograde_reasons(
    transit_data: Mapping[str, Any],
    activity_type: str,
    score_result: Mapping[str, Any],
) -> list[dict[str, Any]]:
    profile = _resolve_profile(activity_type)
    transit = _extract_bodies(transit_data)
    breakdown = (score_result.get("strategic") or {}).get("component_breakdown") or {}
    retro_total = float(breakdown.get("retrograde_penalty", 0.0))
    if retro_total == 0.0:
        return []

    reasons: list[dict[str, Any]] = []
    for name in profile.primary_planets:
        body = transit.get(name)
        if not body or not body.get("retrograde"):
            continue
        pts = -2.5
        reasons.append(
            _reason(
                category="retrograde",
                planet=name,
                score=pts,
                title=f"{_planet_label(name)} retrograde on primary rulers",
                explanation=(
                    f"Transit {_planet_label(name)} is retrograde while ruling "
                    f"{profile.label.lower()} themes, favoring review over direct launch."
                ),
                evidence={
                    "planet": name,
                    "retrograde": True,
                    "primary_ruler": True,
                    "longitude": _longitude(body),
                },
            )
        )
    return reasons


def _electional_timing_reasons(
    transit_data: Mapping[str, Any],
    score_result: Mapping[str, Any],
    context: ScoringContext,
) -> list[dict[str, Any]]:
    strategic = score_result.get("strategic") or {}
    breakdown = strategic.get("component_breakdown") or {}
    eval_meta = transit_data.get("evaluation") or {}
    timing_notes = strategic.get("timing_notes") or []
    reasons: list[dict[str, Any]] = []

    location_mode = breakdown.get("location_mode") or context.location_mode
    calculated_for = breakdown.get("calculated_for") or eval_meta.get("calculated_for")
    target_time = breakdown.get("target_time") or eval_meta.get("target_time")
    timezone = breakdown.get("timezone") or eval_meta.get("timezone")
    local_dt = breakdown.get("resolved_local_datetime") or eval_meta.get(
        "resolved_local_datetime"
    )

    if calculated_for and location_mode != "birthOnly":
        mode_label = LOCATION_MODE_LABELS.get(location_mode, location_mode)
        time_part = f" at {target_time} local" if target_time else ""
        reasons.append(
            _reason(
                category="electional_timing",
                planet="",
                score=0.5,
                title=f"Timed for {mode_label}",
                explanation=(
                    f"Transit houses and angles are calculated for {calculated_for}"
                    f"{time_part} using {mode_label}."
                ),
                evidence={
                    "location_mode": location_mode,
                    "calculated_for": calculated_for,
                    "target_time": target_time,
                    "timezone": timezone,
                    "resolved_local_datetime": local_dt,
                },
            )
        )

    for note in timing_notes:
        note_text = str(note)
        lower = note_text.lower()
        if "retrograde" in lower:
            score = -1.5 if "reduces" in lower or "delay" in lower else -0.5
        elif "no major retrograde" in lower:
            score = 1.0
        else:
            score = 0.0
        reasons.append(
            _reason(
                category="electional_timing",
                planet="",
                score=score,
                title="Timing note",
                explanation=note_text,
                evidence={"timing_note": note_text},
            )
        )
    return reasons


def _sort_reasons(reasons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        reasons,
        key=lambda r: (
            IMPORTANCE_RANK.get(str(r.get("importance")), 9),
            -abs(float(r.get("score", 0.0))),
        ),
    )


def _confidence(reasons: list[dict[str, Any]], final_score: int) -> float:
    if not reasons:
        return 0.5

    support = sum(1 for r in reasons if float(r["score"]) > 0)
    conflict = sum(1 for r in reasons if float(r["score"]) < 0)
    net = sum(float(r["score"]) for r in reasons)
    balance = (support - conflict) / max(1, support + conflict)
    net_factor = max(-1.0, min(1.0, net / 20.0))
    score_factor = max(-1.0, min(1.0, (final_score - 50) / 50.0))
    raw = 0.55 + 0.15 * balance + 0.15 * net_factor + 0.15 * score_factor
    return round(max(0.0, min(1.0, raw)), 2)


def _build_summary(
    score_result: Mapping[str, Any],
    reasons: list[dict[str, Any]],
) -> str:
    executive = score_result.get("executive") or {}
    final_score = int(executive.get("score", 0))
    rating = str(executive.get("rating", ""))
    activity = str(executive.get("activity", "Activity"))

    support = [r for r in reasons if float(r["score"]) > 0]
    conflict = [r for r in reasons if float(r["score"]) < 0]

    parts = [
        f"{activity} scores {final_score}/100 ({rating}).",
        (
            f"{len(support)} supporting factor(s) and {len(conflict)} caution "
            f"factor(s) identified from scored chart evidence."
        ),
    ]
    if support:
        parts.append(f"Strongest support: {support[0]['title']}.")
    if conflict:
        parts.append(f"Main caution: {conflict[0]['title']}.")
    return " ".join(parts)


def build_reasoning(
    score_result: Mapping[str, Any],
    chart_data: Mapping[str, Any],
    activity_type: str,
    context: ScoringContext | None = None,
) -> dict[str, Any]:
    """
    Build deterministic structured reasoning from an existing score result and charts.

    Parameters
    ----------
    score_result:
        Output of ``calculate_activity_score`` (executive / strategic / technical).
    chart_data:
        ``{"natal": {...}, "transit": {...}}`` or a transit payload with ``evaluation``.
    activity_type:
        Activity key used for scoring (e.g. ``business_launch``).
    context:
        Scoring context that controlled which components were included.
    """
    ctx = context or CONTEXT_NATAL
    natal_data, transit_data = _split_charts(chart_data)

    reasons: list[dict[str, Any]] = []
    reasons.extend(_aspect_reasons(score_result))
    reasons.extend(_natal_house_reasons(natal_data, activity_type, score_result, ctx))
    reasons.extend(_transit_house_reasons(transit_data, activity_type, ctx))
    reasons.extend(_transit_angular_reasons(transit_data, activity_type, ctx))
    reasons.extend(_retrograde_reasons(transit_data, activity_type, score_result))
    reasons.extend(_electional_timing_reasons(transit_data, score_result, ctx))

    sorted_reasons = _sort_reasons(reasons)
    final_score = int((score_result.get("executive") or {}).get("score", 0))
    return {
        "summary": _build_summary(score_result, sorted_reasons),
        "confidence": _confidence(sorted_reasons, final_score),
        "reasons": sorted_reasons,
    }
