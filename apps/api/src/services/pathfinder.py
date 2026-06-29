"""Relocation astrology / Pathfinder service.

Phase 1 intentionally avoids drawing astrocartography lines. Instead it
computes the same foundation those lines depend on: a relocated natal chart for
the selected city, planets close to the relocated angles (AC/DC/MC/IC), and
life-area verdicts derived from those placements.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from packages.astro_engine.scoring import calculate_activity_score
from packages.astro_engine.scoring_context import CONTEXT_NATAL, CONTEXT_PATHFINDER
from services.chart_data import (
    _HOUSE_SYSTEMS,
    _import_swisseph,
    _local_datetime,
    _planet_bodies,
    _planet_house,
    resolve_coordinates,
)

ANGLE_ORB = 6.0

SIGN_NAMES = (
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
)

PLANET_LABELS = {
    "sun": "Sun",
    "moon": "Moon",
    "mercury": "Mercury",
    "venus": "Venus",
    "mars": "Mars",
    "jupiter": "Jupiter",
    "saturn": "Saturn",
    "uranus": "Uranus",
    "neptune": "Neptune",
    "pluto": "Pluto",
    "north_node": "North Node",
}

ANGLE_LABELS = {
    "AC": "Ascendant",
    "DC": "Descendant",
    "MC": "Midheaven",
    "IC": "Imum Coeli",
}

AREA_META: dict[str, dict[str, str]] = {
    "love": {"icon": "heart", "title": "Love"},
    "career": {"icon": "briefcase", "title": "Career"},
    "wealth": {"icon": "coin", "title": "Wealth"},
    "home": {"icon": "home", "title": "Home & Family"},
    "wellbeing": {"icon": "lotus", "title": "Wellbeing"},
    "community": {"icon": "users", "title": "Community & Friends"},
    "spirituality": {"icon": "sparkles", "title": "Spirituality"},
}

PURPOSE_TO_ACTION = {
    "all": "travel",
    "love": "networking",
    "career": "business_launch",
    "wealth": "investment",
    "home": "real_estate",
    "wellbeing": "rest_recovery",
    "community": "networking",
    "spirituality": "rest_recovery",
}

BENEFIC = {"sun", "moon", "venus", "jupiter", "mercury", "north_node"}
PRESSURE = {"mars", "saturn", "pluto"}
MYSTIC = {"neptune", "uranus"}

# Each life area has a significator (the planet that "rules" it) and the
# relocated houses that strengthen vs. strain it. Reading where the significator
# falls in THIS city's relocated chart always yields a concrete, location-
# specific line — so no card is ever left at a blank "neutral 50".
AREA_SIGNIFICATOR = {
    "love": "venus",
    "career": "sun",
    "wealth": "jupiter",
    "home": "moon",
    "wellbeing": "mars",
    "community": "mercury",
    "spirituality": "neptune",
}
AREA_SUPPORTIVE_HOUSES = {
    "love": {5, 7, 11},
    "career": {1, 6, 10},
    "wealth": {2, 8, 10, 11},
    "home": {2, 4, 12},
    "wellbeing": {1, 5, 6},
    "community": {3, 7, 11},
    "spirituality": {4, 9, 12},
}
AREA_CHALLENGING_HOUSES = {
    "love": {6, 8, 12},
    "career": {4, 8, 12},
    "wealth": {6, 12},
    "home": {6, 8, 10},
    "wellbeing": {8, 12},
    "community": {6, 8, 12},
    "spirituality": {6, 8},
}

# Angles are weighted: the rising (AC) and Midheaven (MC) are the strongest
# relocation drivers; DC and IC matter a bit less. This is the single biggest
# lever that makes one city differ from another.
ANGLE_WEIGHT = {"AC": 1.0, "MC": 1.0, "DC": 0.85, "IC": 0.75}

# ---------------------------------------------------------------------------
# Layered relocation scoring (methodology spec, validated against astro-seek /
# geocult geometry). Ordering by driver strength:
#   1. relocated angular planets   (primary — changes most sharply per city)
#   2. relocated significator house placement
# Deferred (need altitude/declination-event astronomy; omitted rather than
# shipped wrong, per the zero-error bar): parans, great-circle line distance,
# transits to relocated angles, local-space lines. When added they slot in as
# extra lift/penalty buckets without changing the contract below.
# ---------------------------------------------------------------------------

# Spec orb table for a relocated planet sitting on a relocated angle. Effect
# falls off fast after ~3° so two cities stop looking alike. >5° = no effect.
ANGLE_ORB_MAX = 5.0
# AC/MC are the power axes; DC/IC slightly less.
ANGLE_MULT = {"AC": 1.0, "MC": 1.0, "DC": 0.90, "IC": 0.90}
# Heavier, slower outer planets get a smaller personal weight than luminaries.
PLANET_CLASS_MULT = {
    "sun": 1.0,
    "moon": 1.0,
    "mercury": 0.95,
    "venus": 0.95,
    "mars": 0.95,
    "jupiter": 0.85,
    "saturn": 0.85,
    "uranus": 0.75,
    "neptune": 0.75,
    "pluto": 0.75,
    "north_node": 0.55,
}

# Per-area angular table: planet -> (area_weight, polarity_sign, reason_code).
# polarity +1 lifts the city for that area, -1 presses it. Reason codes match
# the frontend i18n templates so the sentence renders fully localized.
AREA_ANGULAR: dict[str, dict[str, tuple[float, int, str]]] = {
    "love": {
        "venus": (1.00, 1, "love_partner_support"),
        "moon": (0.80, 1, "love_partner_support"),
        "jupiter": (0.60, 1, "love_partner_support"),
        "saturn": (0.70, -1, "love_intense"),
        "mars": (0.70, -1, "love_intense"),
        "uranus": (0.50, -1, "love_intense"),
    },
    "career": {
        "sun": (0.90, 1, "career_drive"),
        "jupiter": (0.75, 1, "career_drive"),
        "saturn": (0.70, 1, "career_drive"),
        "mars": (0.60, 1, "career_drive"),
        "mercury": (0.60, 1, "career_drive"),
        "uranus": (0.50, 1, "career_unconventional"),
        "neptune": (0.45, 1, "career_unconventional"),
    },
    "wealth": {
        "jupiter": (1.00, 1, "wealth_support"),
        "venus": (0.75, 1, "wealth_support"),
        "mercury": (0.60, 1, "wealth_support"),
        "saturn": (0.50, 1, "wealth_support"),
        "neptune": (0.70, -1, "wealth_boundaries"),
        "pluto": (0.50, -1, "wealth_boundaries"),
    },
    "home": {
        "moon": (1.00, 1, "home_supportive"),
        "venus": (0.60, 1, "home_supportive"),
        "jupiter": (0.55, 1, "home_supportive"),
        "mars": (0.70, -1, "home_intense"),
        "saturn": (0.60, -1, "home_intense"),
        "uranus": (0.60, -1, "home_intense"),
    },
    "wellbeing": {
        "sun": (0.80, 1, "wellbeing_vitality"),
        "moon": (0.60, 1, "wellbeing_vitality"),
        "venus": (0.55, 1, "wellbeing_vitality"),
        "jupiter": (0.60, 1, "wellbeing_vitality"),
        "mars": (0.70, -1, "wellbeing_pressure"),
        "saturn": (0.70, -1, "wellbeing_pressure"),
        "neptune": (0.50, -1, "wellbeing_pressure"),
    },
    "community": {
        "mercury": (0.85, 1, "community_people"),
        "venus": (0.70, 1, "community_people"),
        "jupiter": (0.65, 1, "community_people"),
        "uranus": (0.50, 1, "community_people"),
    },
    "spirituality": {
        "neptune": (0.85, 1, "spirituality_open"),
        "jupiter": (0.80, 1, "spirituality_open"),
        "moon": (0.50, 1, "spirituality_open"),
        "saturn": (0.40, 1, "spirituality_open"),
    },
}

# Preferred axis per area — an angular hit on this axis gets a small boost.
AREA_PREF_ANGLES: dict[str, set[str]] = {
    "love": {"AC", "DC"},
    "career": {"MC", "AC"},
    "wealth": {"MC", "AC"},
    "home": {"IC", "AC"},
    "wellbeing": {"AC"},
    "community": {"DC", "MC"},
    "spirituality": {"IC", "AC"},
}

# Graded relocated-house placement score for the area significator. Positive =
# lift, negative = strain. Houses not listed are quietly neutral (0).
AREA_HOUSE_SCORE: dict[str, dict[int, float]] = {
    "love": {7: 1.00, 5: 0.85, 11: 0.50, 8: 0.45, 1: 0.30, 4: 0.20, 6: -0.40, 12: -0.40},
    "career": {10: 1.00, 6: 0.70, 11: 0.70, 1: 0.50, 2: 0.30, 4: -0.20, 8: -0.20, 12: -0.30},
    "wealth": {2: 1.00, 11: 0.70, 8: 0.60, 10: 0.50, 5: 0.30, 6: -0.40, 12: -0.40},
    "home": {4: 1.00, 1: 0.55, 2: 0.40, 12: 0.20, 10: -0.25, 6: -0.40, 8: -0.40},
    "wellbeing": {1: 1.00, 6: 0.80, 5: 0.50, 11: 0.30, 8: -0.40, 12: -0.40},
    "community": {11: 1.00, 7: 0.70, 3: 0.70, 1: 0.40, 6: -0.40, 8: -0.40, 12: -0.40},
    "spirituality": {12: 1.00, 9: 0.85, 4: 0.50, 8: 0.30, 6: -0.40},
}

# Neutral baseline. A city with no angular hits and a neutral significator
# house lands here (mixed band), then lift/penalty move it from city to city.
SCORE_BASE = 50.0
LIFT_MAX = 45.0      # max upward swing from positive angular + house
PENALTY_MAX = 45.0   # max downward swing from afflicting angular + house
CAP_ANG = 1.8        # saturating cap for summed positive angular contributions
CAP_HOUSE = 1.0      # significator house score is already 0..1


def _ang_falloff(orb: float) -> float:
    """Spec falloff: 1.0 on the angle, dropping fast, 0 at the 5° ceiling."""
    if orb >= ANGLE_ORB_MAX:
        return 0.0
    return max(0.0, 1.0 - (orb / ANGLE_ORB_MAX) ** 1.7)


def _closest_angle_within(longitude: float, angles: dict[str, float], orb_max: float) -> tuple[str, float] | None:
    best: tuple[str, float] | None = None
    for key, ang in angles.items():
        orb = _angle_distance(longitude, float(ang))
        if orb <= orb_max and (best is None or orb < best[1]):
            best = (key, orb)
    return best


def _norm(deg: float) -> float:
    return deg % 360.0


def _angle_distance(a: float, b: float) -> float:
    diff = abs(_norm(a) - _norm(b))
    return min(diff, 360.0 - diff)


def _orb_factor(orb: float) -> float:
    """1.0 when a planet is exactly on an angle, tapering to 0 at the orb limit."""
    if ANGLE_ORB <= 0:
        return 0.0
    return max(0.0, 1.0 - orb / ANGLE_ORB)


def _closest_angle(longitude: float, angles: dict[str, float]) -> tuple[str, float] | None:
    """Nearest relocated angle within orb as (angle_key, orb), else None."""
    best: tuple[str, float] | None = None
    for key, ang in angles.items():
        orb = _angle_distance(longitude, float(ang))
        if orb <= ANGLE_ORB and (best is None or orb < best[1]):
            best = (key, orb)
    return best


def _angularity_delta(
    planets: dict[str, dict[str, Any]],
    angles: dict[str, float],
    *,
    benefic_pts: float,
    pressure_pts: float,
    mystic_pts: float,
    cap: float,
) -> float:
    """Location-dependent score shift from planets sitting on relocated angles.

    Because relocation only moves the houses/angles (planet zodiac positions are
    fixed for a birth instant), angularity is the term that genuinely changes
    from city to city. Benefics on an angle lift the city; malefics press it.
    """
    delta = 0.0
    for name, body in planets.items():
        hit = _closest_angle(float(body["longitude"]), angles)
        if not hit:
            continue
        key, orb = hit
        factor = _orb_factor(orb) * ANGLE_WEIGHT.get(key, 0.75)
        if name in BENEFIC:
            delta += benefic_pts * factor
        elif name in PRESSURE:
            delta -= pressure_pts * factor
        elif name in MYSTIC:
            delta -= mystic_pts * factor
    return max(-cap, min(cap, delta))


def _sign(longitude: float) -> tuple[int, str, float]:
    idx = int(_norm(longitude) // 30)
    return idx + 1, SIGN_NAMES[idx], _norm(longitude) % 30


def _cusps_to_list(cusps: Any) -> list[float]:
    values = [float(x) for x in cusps]
    # pyswisseph builds differ: some are 12-long (0..11), some 13-long with a
    # dummy 0th cusp. Normalize to a 12 item list.
    if len(values) >= 13:
        return values[1:13]
    return values[:12]


def _calc_chart_for_instant(
    dt_utc: datetime,
    lat: float,
    lon: float,
    *,
    house_system: str = "placidus",
    zodiac: str = "tropical",
) -> dict[str, Any]:
    swe = _import_swisseph()
    jd_ut = swe.julday(
        dt_utc.year,
        dt_utc.month,
        dt_utc.day,
        dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0,
        swe.GREG_CAL,
    )
    if zodiac == "sidereal":
        swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
    flags = swe.FLG_MOSEPH | swe.FLG_SPEED
    if zodiac == "sidereal":
        flags |= swe.FLG_SIDEREAL

    hs = _HOUSE_SYSTEMS.get(house_system, b"P")
    cusps, ascmc = swe.houses(jd_ut, lat, lon, hs)
    cusp_list = _cusps_to_list(cusps)

    planets: dict[str, dict[str, Any]] = {}
    for planet_id, name in _planet_bodies(swe):
        result, _flag = swe.calc_ut(jd_ut, planet_id, flags)
        longitude = float(result[0])
        speed = float(result[3]) if len(result) > 3 else 0.0
        sign_index, sign_name, degree = _sign(longitude)
        body = {
            "longitude": round(longitude, 4),
            "house": _planet_house(longitude, cusp_list),
            "speed": speed,
            "sign": sign_index,
            "sign_name": sign_name,
            "degree": round(degree, 2),
        }
        if speed < 0:
            body["retrograde"] = True
        planets[name] = body

    asc = float(ascmc[0])
    mc = float(ascmc[1])
    return {
        "planets": planets,
        "houses": cusp_list,
        "angles": {
            "AC": round(_norm(asc), 4),
            "DC": round(_norm(asc + 180.0), 4),
            "MC": round(_norm(mc), 4),
            "IC": round(_norm(mc + 180.0), 4),
        },
    }


def _active_lines(planets: dict[str, dict[str, Any]], angles: dict[str, float]) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    for planet, body in planets.items():
        longitude = float(body["longitude"])
        for angle_key, angle_lon in angles.items():
            orb = _angle_distance(longitude, angle_lon)
            if orb <= ANGLE_ORB:
                lines.append(
                    {
                        "planet": planet,
                        "planet_label": PLANET_LABELS.get(planet, planet.title()),
                        "angle": angle_key,
                        "angle_label": ANGLE_LABELS[angle_key],
                        "orb": round(orb, 2),
                        "strength": "exact" if orb <= 2 else "strong" if orb <= 4 else "moderate",
                    }
                )
    return sorted(lines, key=lambda x: x["orb"])


def _score_area(
    area: str,
    planets: dict[str, dict[str, Any]],
    angles: dict[str, float],
) -> tuple[int, str, list[dict[str, Any]]]:
    """Layered, deterministic relocation score for one life area.

    Score = base 50 + lift(positive angular + significator house) - penalty
    (afflicting angular + adverse house). Because relocated angles and house
    cusps change per city, neighbouring cities diverge instead of collapsing
    to a flat ~50. Every result carries concrete, city-specific reasons.
    """
    angular = AREA_ANGULAR.get(area, {})
    pref = AREA_PREF_ANGLES.get(area, set())

    pos: list[tuple[float, dict[str, Any]]] = []
    neg: list[tuple[float, dict[str, Any]]] = []

    # 1. Relocated angular planets (primary driver).
    for name, body in planets.items():
        cfg = angular.get(name)
        if not cfg:
            continue
        hit = _closest_angle_within(float(body["longitude"]), angles, ANGLE_ORB_MAX)
        if hit is None:
            continue
        weight, sign, code = cfg
        key, orb = hit
        mag = (
            _ang_falloff(orb)
            * ANGLE_MULT.get(key, 0.9)
            * PLANET_CLASS_MULT.get(name, 0.8)
            * weight
        )
        if key in pref:
            mag *= 1.15
        if orb <= 0.5:
            mag *= 1.15  # bang-on the angle
        if mag <= 0:
            continue
        reason = {"code": code, "planet": name, "angle": key, "house": None}
        (pos if sign > 0 else neg).append((mag, reason))

    # 2. Relocated significator house placement (always present → never blank).
    sig = AREA_SIGNIFICATOR.get(area)
    sig_body = planets.get(sig) if sig else None
    house_pos = 0.0
    house_pen = 0.0
    sig_reason: dict[str, Any] | None = None
    if sig and sig_body:
        sig_house = int(sig_body.get("house") or 0)
        h = AREA_HOUSE_SCORE.get(area, {}).get(sig_house, 0.0)
        if h > 0:
            house_pos = h
            sig_reason = {"code": "sig_support", "planet": sig, "angle": None, "house": sig_house}
        elif h < 0:
            house_pen = -h
            sig_reason = {"code": "sig_strain", "planet": sig, "angle": None, "house": sig_house}
        else:
            sig_reason = {"code": "sig_quiet", "planet": sig, "angle": None, "house": sig_house}

    # Keep the strongest few of each, per the spec's "top-N" anti-clutter rule.
    pos.sort(key=lambda x: x[0], reverse=True)
    neg.sort(key=lambda x: x[0], reverse=True)
    ang_pos_sum = sum(m for m, _ in pos[:3])
    ang_neg_sum = sum(m for m, _ in neg[:3])

    n_ang = min(1.0, ang_pos_sum / CAP_ANG)
    n_house = min(1.0, house_pos / CAP_HOUSE)
    lift = LIFT_MAX * (0.70 * n_ang + 0.30 * n_house)

    penalty = min(PENALTY_MAX, (ang_neg_sum + house_pen) * 22.0)

    final = int(round(max(0.0, min(100.0, SCORE_BASE + lift - penalty))))
    verdict = "positive" if final >= 65 else "challenging" if final <= 44 else "mixed"

    # Reasons: lead with whichever side is driving the verdict, then the
    # significator house line so every card says something city-specific.
    reasons: list[dict[str, Any]] = []
    primary = pos if lift >= penalty else neg
    secondary = neg if lift >= penalty else pos
    for _, r in primary[:2]:
        reasons.append(r)
    if sig_reason:
        reasons.append(sig_reason)
    for _, r in secondary[:1]:
        reasons.append(r)
    return final, verdict, reasons[:3]


def relocation_reading(
    *,
    birth_date: str,
    birth_time: str,
    birth_location: str,
    target_location: str,
    target_label: str | None = None,
    house_system: str = "placidus",
    zodiac: str = "tropical",
) -> dict[str, Any]:
    birth_lat, birth_lon = resolve_coordinates(birth_location)
    target_lat, target_lon = resolve_coordinates(target_location)
    birth_dt_local = _local_datetime(birth_date, birth_time, birth_lat, birth_lon)
    birth_dt_utc = birth_dt_local.astimezone(timezone.utc)

    relocated = _calc_chart_for_instant(
        birth_dt_utc,
        target_lat,
        target_lon,
        house_system=house_system,
        zodiac=zodiac,
    )
    lines = _active_lines(relocated["planets"], relocated["angles"])

    effects = []
    for area in AREA_META:
        score, verdict, reasons = _score_area(area, relocated["planets"], relocated["angles"])
        effects.append(
            {
                "area": area,
                "icon": AREA_META[area]["icon"],
                "score": score,
                "verdict": verdict,
                "reasons": reasons,
            }
        )
    effects.sort(key=lambda x: x["score"], reverse=True)

    return {
        "target": {
            "label": target_label or target_location,
            "location": target_location,
            "latitude": target_lat,
            "longitude": target_lon,
        },
        "angles": relocated["angles"],
        "active_lines": lines,
        "effects": effects,
        "planets": relocated["planets"],
    }


def _relocated_natal_for_scoring(
    birth_date: str,
    birth_time: str,
    birth_location: str,
    target_location: str,
    *,
    house_system: str,
    zodiac: str,
) -> dict[str, Any]:
    birth_lat, birth_lon = resolve_coordinates(birth_location)
    target_lat, target_lon = resolve_coordinates(target_location)
    birth_dt_local = _local_datetime(birth_date, birth_time, birth_lat, birth_lon)
    birth_dt_utc = birth_dt_local.astimezone(timezone.utc)
    return _calc_chart_for_instant(
        birth_dt_utc,
        target_lat,
        target_lon,
        house_system=house_system,
        zodiac=zodiac,
    )


def best_times(
    *,
    birth_date: str,
    birth_time: str,
    birth_location: str,
    target_location: str,
    start_date: str,
    search_months: int = 3,
    trip_days: int = 7,
    purpose: str = "all",
    house_system: str = "placidus",
    zodiac: str = "tropical",
) -> dict[str, Any]:
    start = date.fromisoformat(start_date)
    end = start + timedelta(days=max(1, min(search_months, 12)) * 30)
    trip_days = max(3, min(trip_days, 30))
    action = PURPOSE_TO_ACTION.get(purpose, "travel")
    natal = _relocated_natal_for_scoring(
        birth_date,
        birth_time,
        birth_location,
        target_location,
        house_system=house_system,
        zodiac=zodiac,
    )

    target_lat, target_lon = resolve_coordinates(target_location)
    reloc_angles = natal["angles"]
    # City baseline: which natal planets are angular *in this city*. This is
    # constant across the trip dates but differs strongly between cities, so it
    # gives each location its own starting favorability instead of the near-
    # identical transit-only score the engine produced before.
    natal_baseline = _angularity_delta(
        natal["planets"],
        reloc_angles,
        benefic_pts=10.0,
        pressure_pts=9.0,
        mystic_pts=2.0,
        cap=14.0,
    )

    periods: list[dict[str, Any]] = []
    cursor = start
    while cursor + timedelta(days=trip_days - 1) <= end:
        scores: list[int] = []
        for offset in range(trip_days):
            d = cursor + timedelta(days=offset)
            dt_local = _local_datetime(d.isoformat(), birth_time, target_lat, target_lon)
            transit = _calc_chart_for_instant(
                dt_local.astimezone(timezone.utc),
                target_lat,
                target_lon,
                house_system=house_system,
                zodiac=zodiac,
            )
            result = calculate_activity_score(natal, transit, action, CONTEXT_PATHFINDER)
            # Transiting planets crossing this city's relocated angles activate
            # the location on that date — location- AND date-dependent.
            transit_angularity = _angularity_delta(
                transit["planets"],
                reloc_angles,
                benefic_pts=8.0,
                pressure_pts=8.0,
                mystic_pts=2.0,
                cap=14.0,
            )
            day_score = int(
                round(
                    max(
                        0.0,
                        min(
                            100.0,
                            result["executive"]["score"] + natal_baseline + transit_angularity,
                        ),
                    )
                )
            )
            scores.append(day_score)
        avg = round(sum(scores) / len(scores))
        periods.append(
            {
                "start": cursor.isoformat(),
                "end": (cursor + timedelta(days=trip_days - 1)).isoformat(),
                "days": trip_days,
                "score": avg,
                "label": "Favorable" if avg >= 65 else "Challenging" if avg <= 42 else "Balanced",
                "daily_scores": scores,
            }
        )
        cursor += timedelta(days=7)

    periods.sort(key=lambda x: x["score"], reverse=True)
    return {
        "purpose": purpose,
        "action_type": action,
        "best_periods": periods[:8],
        "challenging_periods": sorted(periods, key=lambda x: x["score"])[:5],
    }
