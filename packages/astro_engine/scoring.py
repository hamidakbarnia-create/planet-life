"""
Strategic timing scores from natal placements and current transits.

Translates geometric planetary relationships (aspects) into a 0–100 executive
score for business and lifestyle activities, with Executive / Strategic /
Technical response layers.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final, Mapping, Sequence

from packages.astro_engine.scoring_context import ScoringContext, CONTEXT_NATAL

# ---------------------------------------------------------------------------
# Aspect geometry
# ---------------------------------------------------------------------------

ASPECT_ANGLES: Final[dict[str, float]] = {
    "conjunction": 0.0,
    "sextile": 60.0,
    "square": 90.0,
    "trine": 120.0,
    "quincunx": 150.0,
    "opposition": 180.0,
}

# Maximum orb (degrees) before an aspect is ignored.
DEFAULT_ORBS: Final[dict[str, float]] = {
    "conjunction": 8.0,
    "sextile": 4.0,
    "square": 6.0,
    "trine": 6.0,
    "quincunx": 3.0,
    "opposition": 8.0,
}

# Base contribution by aspect type (−1 harsh … +1 supportive).
ASPECT_POLARITY: Final[dict[str, float]] = {
    "conjunction": 0.35,  # refined per planet pair
    "sextile": 0.85,
    "trine": 1.0,
    "square": -0.9,
    "quincunx": -0.25,
    "opposition": -0.75,
}

PLANETS: Final[tuple[str, ...]] = (
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
    "north_node",
    "chiron",
)

BENEFICS: Final[frozenset[str]] = frozenset({"sun", "venus", "jupiter", "north_node"})
MALEFICS: Final[frozenset[str]] = frozenset({"mars", "saturn", "pluto"})
NEUTRAL_OR_CONTEXT: Final[frozenset[str]] = frozenset(
    {"moon", "mercury", "uranus", "neptune", "chiron"}
)

# ---------------------------------------------------------------------------
# Activity profiles (financial & strategic astrology)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ActivityProfile:
    """Weights and narrative framing for one activity type."""

    label: str
    primary_planets: tuple[str, ...]
    secondary_planets: tuple[str, ...]
    supportive_houses: tuple[int, ...]
    executive_focus: str


ACTIVITY_PROFILES: Final[dict[str, ActivityProfile]] = {
    "business_launch": ActivityProfile(
        label="Business Launch",
        primary_planets=("sun", "mars", "jupiter"),
        secondary_planets=("mercury", "saturn"),
        supportive_houses=(1, 10, 11),
        executive_focus="visibility, momentum, and scalable growth",
    ),
    "negotiation": ActivityProfile(
        label="Negotiation",
        primary_planets=("mercury", "venus", "jupiter"),
        secondary_planets=("moon", "saturn"),
        supportive_houses=(3, 7, 11),
        executive_focus="communication, rapport, and mutually beneficial terms",
    ),
    "investment": ActivityProfile(
        label="Investment",
        primary_planets=("jupiter", "venus", "saturn", "pluto"),
        secondary_planets=("mercury", "neptune"),
        supportive_houses=(2, 8, 11),
        executive_focus="capital allocation, risk/reward, and long-term yield",
    ),
    "contract_signing": ActivityProfile(
        label="Contract Signing",
        primary_planets=("mercury", "saturn", "jupiter"),
        secondary_planets=("venus", "mars"),
        supportive_houses=(3, 7, 9),
        executive_focus="clarity of terms, enforceability, and good-faith commitment",
    ),
    "hiring": ActivityProfile(
        label="Hiring",
        primary_planets=("mercury", "jupiter", "moon"),
        secondary_planets=("venus", "saturn"),
        supportive_houses=(6, 10, 11),
        executive_focus="fit, capability, and team cohesion",
    ),
    "real_estate": ActivityProfile(
        label="Real Estate",
        primary_planets=("moon", "venus", "saturn", "jupiter"),
        secondary_planets=("mars", "pluto"),
        supportive_houses=(4, 8, 10),
        executive_focus="asset security, valuation, and structural soundness",
    ),
    "travel": ActivityProfile(
        label="Travel",
        primary_planets=("jupiter", "mercury", "sun"),
        secondary_planets=("moon", "uranus"),
        supportive_houses=(3, 9, 11),
        executive_focus="logistics, opportunity abroad, and safe passage",
    ),
    "creative_work": ActivityProfile(
        label="Creative Work",
        primary_planets=("venus", "neptune", "uranus"),
        secondary_planets=("sun", "mercury"),
        supportive_houses=(5, 11, 12),
        executive_focus="innovation, inspiration, and distinctive output",
    ),
    "rest_recovery": ActivityProfile(
        label="Rest & Recovery",
        primary_planets=("moon", "neptune", "saturn"),
        secondary_planets=("venus", "chiron"),
        supportive_houses=(4, 6, 12),
        executive_focus="restoration, boundaries, and sustainable pacing",
    ),
    "networking": ActivityProfile(
        label="Networking & PR",
        primary_planets=("venus", "mercury", "jupiter", "sun"),
        secondary_planets=("moon", "uranus"),
        supportive_houses=(3, 7, 11),
        executive_focus="reach, reputation, and strategic alliances",
    ),
    "finance_transaction": ActivityProfile(
        label="Finance Transaction",
        primary_planets=("venus", "jupiter", "saturn", "mercury"),
        secondary_planets=("pluto", "neptune"),
        supportive_houses=(2, 8, 10),
        executive_focus="liquidity, timing, and transactional integrity",
    ),
}

DEFAULT_ACTIVITY: Final[str] = "negotiation"
BASE_SCORE: Final[float] = 50.0

BENEFIC_TRANSIT: Final[frozenset[str]] = frozenset(
    {"sun", "venus", "jupiter", "mercury", "moon", "north_node"}
)
PRESSURE_TRANSIT: Final[frozenset[str]] = frozenset(
    {"mars", "saturn", "neptune", "pluto", "uranus"}
)

# Local transit house scoring — positive / caution houses per activity family.
TRANSIT_HOUSE_RULES: Final[dict[str, dict[str, tuple[int, ...]]]] = {
    "business_launch": {
        "positive": (10, 2, 6, 11, 1),
        "caution": (12, 8),
        "positive_planets": ("sun", "jupiter", "venus", "mercury", "moon", "mars"),
        "caution_planets": ("mars", "saturn", "neptune", "pluto"),
    },
    "contract_signing": {
        "positive": (3, 7, 10, 11),
        "caution": (12, 8),
        "positive_planets": ("mercury", "venus", "jupiter", "sun"),
        "caution_planets": ("mars", "saturn", "neptune", "pluto"),
    },
    "real_estate": {
        "positive": (4, 2, 10, 11),
        "caution": (4, 8, 12),
        "positive_planets": ("moon", "venus", "jupiter", "saturn"),
        "caution_planets": ("mars", "saturn", "neptune", "uranus"),
    },
    "negotiation": {
        "positive": (3, 7, 11, 5),
        "caution": (12, 8, 7),
        "positive_planets": ("venus", "moon", "jupiter", "mercury"),
        "caution_planets": ("mars", "saturn", "neptune", "pluto"),
    },
    "default": {
        "positive": (1, 10, 11, 2),
        "caution": (12, 8),
        "positive_planets": ("sun", "venus", "jupiter", "mercury", "moon"),
        "caution_planets": ("mars", "saturn", "neptune", "pluto"),
    },
}

ANGULAR_ORBS: Final[dict[str, float]] = {"strong": 3.0, "medium": 6.0, "weak": 10.0}
ANGULAR_WEIGHT: Final[dict[str, float]] = {"strong": 1.0, "medium": 0.6, "weak": 0.35}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_longitude(degree: float) -> float:
    return degree % 360.0


def _angular_separation(lon_a: float, lon_b: float) -> float:
    diff = abs(_normalize_longitude(lon_a) - _normalize_longitude(lon_b))
    return min(diff, 360.0 - diff)


def _planet_weight(planet: str, profile: ActivityProfile) -> float:
    if planet in profile.primary_planets:
        return 1.0
    if planet in profile.secondary_planets:
        return 0.55
    return 0.2


def _conjunction_modifier(transit: str, natal: str) -> float:
    """Conjunctions are context-sensitive: benefic pairs lift, malefic pairs press."""
    pair = {transit, natal}
    if pair <= BENEFICS or (transit in BENEFICS and natal in BENEFICS):
        return 1.0
    if pair <= MALEFICS or (transit in MALEFICS and natal in MALEFICS):
        return -1.0
    if transit in MALEFICS or natal in MALEFICS:
        return -0.45
    if transit in BENEFICS or natal in BENEFICS:
        return 0.65
    return 0.35


def _aspect_polarity(aspect: str, transit: str, natal: str) -> float:
    base = ASPECT_POLARITY[aspect]
    if aspect == "conjunction":
        return _conjunction_modifier(transit, natal)
    return base


def _orb_strength(orb: float, max_orb: float) -> float:
    """1.0 at exact aspect, tapering to 0 at max orb."""
    if max_orb <= 0:
        return 0.0
    return max(0.0, 1.0 - (orb / max_orb))


def _extract_bodies(data: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
    """Accept planets under 'planets' or at top level."""
    if "planets" in data and isinstance(data["planets"], dict):
        return {k.lower(): v for k, v in data["planets"].items() if isinstance(v, dict)}
    return {
        k.lower(): v
        for k, v in data.items()
        if k.lower() in PLANETS and isinstance(v, dict)
    }


def _longitude(body: Mapping[str, Any]) -> float | None:
    for key in ("longitude", "lon", "degree", "ecliptic_longitude"):
        if key in body and body[key] is not None:
            return float(body[key])
    return None


def _house(body: Mapping[str, Any]) -> int | None:
    if "house" in body and body["house"] is not None:
        return int(body["house"])
    return None


def _detect_aspect(
    transit_lon: float,
    natal_lon: float,
    orbs: Mapping[str, float] | None = None,
) -> tuple[str, float] | None:
    """Return (aspect_name, orb) if within orb, else None."""
    separation = _angular_separation(transit_lon, natal_lon)
    orb_table = orbs or DEFAULT_ORBS
    best: tuple[str, float] | None = None
    for aspect, target in ASPECT_ANGLES.items():
        orb = abs(separation - target)
        max_orb = orb_table.get(aspect, DEFAULT_ORBS[aspect])
        if orb <= max_orb and (best is None or orb < best[1]):
            best = (aspect, orb)
    return best


def _precomputed_aspects(transit_data: Mapping[str, Any]) -> list[dict[str, Any]]:
    raw = transit_data.get("aspects") or transit_data.get("natal_aspects") or []
    if not isinstance(raw, Sequence):
        return []
    return [a for a in raw if isinstance(a, dict)]


def _collect_aspects(
    natal: dict[str, dict[str, Any]],
    transit: dict[str, dict[str, Any]],
    profile: ActivityProfile,
    transit_data: Mapping[str, Any],
) -> list[dict[str, Any]]:
    """Build aspect records from precomputed list or longitude pairs."""
    results: list[dict[str, Any]] = []
    custom_orbs = transit_data.get("orbs")
    orb_table = custom_orbs if isinstance(custom_orbs, dict) else None

    for item in _precomputed_aspects(transit_data):
        t_planet = str(item.get("transit_planet", item.get("transit", ""))).lower()
        n_planet = str(item.get("natal_planet", item.get("natal", ""))).lower()
        aspect = str(item.get("aspect", item.get("type", ""))).lower()
        orb = item.get("orb")
        if not t_planet or not n_planet or aspect not in ASPECT_ANGLES:
            continue
        if orb is None and "longitude" in item:
            t_lon = _longitude(transit.get(t_planet, {}))
            n_lon = _longitude(natal.get(n_planet, {}))
            if t_lon is not None and n_lon is not None:
                detected = _detect_aspect(t_lon, n_lon, orb_table)
                if detected:
                    aspect, orb = detected
                else:
                    continue
            else:
                continue
        results.append(
            {
                "transit_planet": t_planet,
                "natal_planet": n_planet,
                "aspect": aspect,
                "orb": float(orb),
                "source": "precomputed",
            }
        )

    for t_name, t_body in transit.items():
        t_lon = _longitude(t_body)
        if t_lon is None:
            continue
        for n_name, n_body in natal.items():
            if any(
                r["transit_planet"] == t_name and r["natal_planet"] == n_name
                for r in results
            ):
                continue
            n_lon = _longitude(n_body)
            if n_lon is None:
                continue
            detected = _detect_aspect(t_lon, n_lon, orb_table)
            if not detected:
                continue
            aspect, orb = detected
            results.append(
                {
                    "transit_planet": t_name,
                    "natal_planet": n_name,
                    "aspect": aspect,
                    "orb": orb,
                    "source": "calculated",
                }
            )

    # Weight sort: most relevant planets and tightest orbs first
    results.sort(
        key=lambda r: (
            -max(_planet_weight(r["transit_planet"], profile), _planet_weight(r["natal_planet"], profile)),
            r["orb"],
        )
    )
    return results


def _score_aspect(
    aspect: str,
    orb: float,
    transit_planet: str,
    natal_planet: str,
    profile: ActivityProfile,
    orb_table: Mapping[str, float],
) -> float:
    max_orb = orb_table.get(aspect, DEFAULT_ORBS[aspect])
    strength = _orb_strength(orb, max_orb)
    polarity = _aspect_polarity(aspect, transit_planet, natal_planet)
    relevance = (
        _planet_weight(transit_planet, profile) + _planet_weight(natal_planet, profile)
    ) / 2.0
    return polarity * strength * relevance * 18.0


def _house_bonus(natal: dict[str, dict[str, Any]], profile: ActivityProfile) -> float:
    bonus = 0.0
    for body in natal.values():
        house = _house(body)
        if house in profile.supportive_houses:
            bonus += 1.5
    return min(bonus, 8.0)


def _retrograde_penalty(transit: dict[str, dict[str, Any]], profile: ActivityProfile) -> float:
    penalty = 0.0
    for name in profile.primary_planets:
        body = transit.get(name)
        if body and body.get("retrograde"):
            penalty += 2.5
    return min(penalty, 10.0)


def _transit_house_rules_key(activity_type: str) -> str:
    key = activity_type.strip().lower().replace("-", "_").replace(" ", "_")
    if key in ("business_launch", "contract_signing", "real_estate", "negotiation"):
        return key
    if key in ("contract", "sign", "lease_signing"):
        return "contract_signing"
    if key in ("property", "property_trade", "relocation"):
        return "real_estate"
    if key in ("launch", "startup", "fresh_start"):
        return "business_launch"
    if key in (
        "reconciliation",
        "first_meeting",
        "marriage_proposal",
        "relationship_ending",
        "difficult_conversation",
    ):
        return "negotiation"
    return "default"


def _transit_local_house_score(
    transit_data: Mapping[str, Any],
    activity_type: str,
) -> tuple[float, list[str]]:
    """Score transiting planets in local houses at evaluation location."""
    rules = TRANSIT_HOUSE_RULES[_transit_house_rules_key(activity_type)]
    transit = _extract_bodies(transit_data)
    positive_h = set(rules["positive"])
    caution_h = set(rules["caution"])
    pos_planets = set(rules["positive_planets"])
    caution_planets = set(rules["caution_planets"])

    score = 0.0
    notes: list[str] = []
    for name, body in transit.items():
        house = _house(body)
        if house is None:
            continue
        weight = _planet_weight(name, _resolve_profile(activity_type))
        if house in positive_h and name in pos_planets:
            pts = 2.2 * weight
            score += pts
            notes.append(f"+ Transit {name} in house {house} (supportive)")
        elif house in caution_h and name in caution_planets:
            pts = -2.0 * weight
            score += pts
            notes.append(f"- Transit {name} in house {house} (caution)")
        if body.get("retrograde") and name in ("mercury", "venus", "mars") and house in caution_h:
            score -= 1.5 * weight
            notes.append(f"- Retrograde {name} in house {house}")

    score = max(-15.0, min(15.0, score))
    return score, notes


def _chart_angles(transit_data: Mapping[str, Any]) -> dict[str, float]:
    asc = transit_data.get("ascendant")
    mc = transit_data.get("midheaven")
    if asc is None or mc is None:
        return {}
    asc_f = float(asc) % 360.0
    mc_f = float(mc) % 360.0
    return {
        "asc": asc_f,
        "mc": mc_f,
        "dsc": (asc_f + 180.0) % 360.0,
        "ic": (mc_f + 180.0) % 360.0,
    }


def _nearest_angle_band(lon: float, angle: float) -> str | None:
    diff = _angular_separation(lon, angle)
    if diff <= ANGULAR_ORBS["strong"]:
        return "strong"
    if diff <= ANGULAR_ORBS["medium"]:
        return "medium"
    if diff <= ANGULAR_ORBS["weak"]:
        return "weak"
    return None


def _transit_angular_score(
    transit_data: Mapping[str, Any],
    activity_type: str,
) -> tuple[float, list[str]]:
    """Score planets near local ASC / MC / DSC / IC."""
    angles = _chart_angles(transit_data)
    if not angles:
        return 0.0, []

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

    transit = _extract_bodies(transit_data)
    score = 0.0
    notes: list[str] = []

    for name, body in transit.items():
        lon = _longitude(body)
        if lon is None:
            continue
        weight = _planet_weight(name, _resolve_profile(activity_type))
        best_band: str | None = None
        best_angle = ""
        for angle_name, angle_val in angles.items():
            band = _nearest_angle_band(lon, angle_val)
            if band is None:
                continue
            if best_band is None or ANGULAR_WEIGHT[band] > ANGULAR_WEIGHT[best_band]:
                best_band = band
                best_angle = angle_name

        if best_band is None:
            continue

        mult = ANGULAR_WEIGHT[best_band]
        if name in BENEFIC_TRANSIT and best_angle in favored_angles:
            pts = 3.5 * mult * weight
            score += pts
            notes.append(f"+ {name} near {best_angle.upper()} ({best_band})")
        elif name in PRESSURE_TRANSIT and best_angle in pressure_angles:
            pts = -3.0 * mult * weight
            score += pts
            notes.append(f"- {name} near {best_angle.upper()} ({best_band})")

    score = max(-12.0, min(12.0, score))
    return score, notes


def _clamp_score(value: float) -> int:
    return int(max(0, min(100, round(value))))


def _rating(score: int) -> str:
    if score >= 80:
        return "Highly Favorable"
    if score >= 65:
        return "Favorable"
    if score >= 45:
        return "Mixed / Proceed with Awareness"
    if score >= 30:
        return "Challenging"
    return "Unfavorable"


def _recommendation(score: int, profile: ActivityProfile) -> str:
    if score >= 80:
        return (
            f"Strong window for {profile.label.lower()}: transits support "
            f"{profile.executive_focus}. Move decisively while monitoring details."
        )
    if score >= 65:
        return (
            f"Good conditions for {profile.label.lower()}. Favor core priorities around "
            f"{profile.executive_focus}; keep contingency plans light."
        )
    if score >= 45:
        return (
            f"Neutral-to-mixed timing. Viable for {profile.label.lower()} if "
            f"{profile.executive_focus} is well-prepared; avoid unnecessary risk."
        )
    if score >= 30:
        return (
            f"Friction in the sky. Delay or restructure {profile.label.lower()} unless "
            f"urgent; shore up {profile.executive_focus} before committing."
        )
    return (
        f"Poor strategic timing for {profile.label.lower()}. Defer major moves; "
        f"focus on research and stabilization instead of {profile.executive_focus}."
    )


def _executive_summary(score: int, profile: ActivityProfile, top_positive: list[str], top_negative: list[str]) -> str:
    lead = f"{profile.label} timing scores {score}/100 ({_rating(score)})."
    if top_positive:
        lead += f" Tailwinds: {', '.join(top_positive[:2])}."
    if top_negative:
        lead += f" Headwinds: {', '.join(top_negative[:2])}."
    return lead


def _resolve_profile(activity_type: str) -> ActivityProfile:
    key = activity_type.strip().lower().replace("-", "_").replace(" ", "_")
    if key in ACTIVITY_PROFILES:
        return ACTIVITY_PROFILES[key]

    # Aliases for API ergonomics. Each Oracle question (lib/oracle-questions.ts)
    # has an action_type; map them all to the closest existing profile so every
    # module returns a distinct, meaningful score instead of falling back to the
    # default "negotiation" profile.
    aliases = {
        # Short aliases
        "launch": "business_launch",
        "startup": "business_launch",
        "deal": "negotiation",
        "invest": "investment",
        "contract": "contract_signing",
        "sign": "contract_signing",
        "hire": "hiring",
        "property": "real_estate",
        "finance": "finance_transaction",
        "pr": "networking",
        "rest": "rest_recovery",

        # Oracle: Business & Wealth
        "loan_application": "finance_transaction",
        "asset_trade": "investment",
        "investor_meeting": "negotiation",

        # Oracle: Love & People
        "reconciliation": "negotiation",
        "difficult_conversation": "negotiation",
        "first_meeting": "networking",
        "marriage_proposal": "negotiation",
        "relationship_ending": "negotiation",

        # Oracle: Travel & Place
        "travel_start": "travel",
        "business_trip": "travel",
        "relocation": "real_estate",
        "property_trade": "real_estate",
        "lease_signing": "contract_signing",

        # Oracle: Health & Body — closest profile is rest_recovery
        "surgery": "rest_recovery",
        "fasting_start": "rest_recovery",
        "dental_visit": "rest_recovery",
        "fertility_treatment": "rest_recovery",
        "workout_routine": "creative_work",

        # Oracle: Work & Voice
        "social_media_post": "networking",
        "job_interview": "negotiation",
        "presentation": "networking",
        "job_application": "networking",
        "creative_project": "creative_work",

        # Oracle: Luck & Crisis
        "risk_taking": "investment",
        "fresh_start": "business_launch",
        "ending_chapter": "rest_recovery",
        "major_decision": "negotiation",
        # Oracle: Relationship meeting semantics (synastry best-days)
        "romantic_meeting": "networking",
        "relationship_repair": "rest_recovery",
        "shared_life_planning": "real_estate",
        "social_meeting": "networking",
        "mentorship_session": "networking",
        "family_discussion": "negotiation",
        "investor_pitch": "investment",
        "client_meeting": "contract_signing",
        "cofounder_planning": "business_launch",
    }
    return ACTIVITY_PROFILES.get(aliases.get(key, DEFAULT_ACTIVITY), ACTIVITY_PROFILES[DEFAULT_ACTIVITY])


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_activity_score(
    user_natal_data: dict,
    current_transit_data: dict,
    activity_type: str,
    scoring_context: ScoringContext | None = None,
) -> dict:
    """
    Calculate a strategic time score from 0 to 100 based on transits and natal placements.

    Parameters
    ----------
    user_natal_data : dict
        Natal chart. Expected shape: ``{"planets": {"sun": {"longitude": 123.4, "house": 10}, ...}}``
        Longitude keys also accepted: ``lon``, ``degree``, ``ecliptic_longitude``.
    current_transit_data : dict
        Current sky. Same planet shape as natal, plus optional precomputed ``aspects`` list::
        ``[{"transit_planet": "jupiter", "natal_planet": "sun", "aspect": "trine", "orb": 1.2}, ...]``
    activity_type : str
        One of ACTIVITY_PROFILES keys (e.g. ``investment``, ``contract_signing``) or alias.

    Returns
    -------
    dict
        Three-layer payload: ``executive``, ``strategic``, ``technical``.
    """
    profile = _resolve_profile(activity_type)
    ctx = scoring_context or CONTEXT_NATAL
    natal = _extract_bodies(user_natal_data)
    transit = _extract_bodies(current_transit_data)

    orb_table = current_transit_data.get("orbs")
    if not isinstance(orb_table, dict):
        orb_table = DEFAULT_ORBS

    aspects = _collect_aspects(natal, transit, profile, current_transit_data)

    raw_contributions: list[dict[str, Any]] = []
    total_delta = 0.0
    opportunities: list[str] = []
    risks: list[str] = []

    for rec in aspects:
        contribution = _score_aspect(
            rec["aspect"],
            rec["orb"],
            rec["transit_planet"],
            rec["natal_planet"],
            profile,
            orb_table,
        )
        total_delta += contribution
        label = (
            f"Transit {rec['transit_planet'].title()} {rec['aspect']} natal "
            f"{rec['natal_planet'].title()} (orb {rec['orb']:.1f}°)"
        )
        raw_contributions.append({**rec, "contribution": round(contribution, 2), "label": label})
        if contribution >= 4.0:
            opportunities.append(label)
        elif contribution <= -4.0:
            risks.append(label)

    house_adj = _house_bonus(natal, profile) if ctx.include_natal_house_bonus else 0.0
    retro_pen = _retrograde_penalty(transit, profile)
    retro_adj = -retro_pen

    transit_house_score = 0.0
    transit_house_notes: list[str] = []
    if ctx.include_transit_house_score:
        transit_house_score, transit_house_notes = _transit_local_house_score(
            current_transit_data, activity_type
        )

    transit_angular_score = 0.0
    transit_angular_notes: list[str] = []
    if ctx.include_transit_angular_score:
        transit_angular_score, transit_angular_notes = _transit_angular_score(
            current_transit_data, activity_type
        )

    aspect_score = round(total_delta, 2)
    final_score = _clamp_score(
        BASE_SCORE
        + total_delta
        + house_adj
        + retro_adj
        + transit_house_score
        + transit_angular_score
    )

    eval_meta = current_transit_data.get("evaluation") or {}
    calculated_for = eval_meta.get("calculated_for") or eval_meta.get("evaluation_location")
    location_component_score = round(transit_house_score + transit_angular_score, 2)

    component_breakdown = {
        "aspect_score": aspect_score,
        "natal_house_bonus": round(house_adj, 2),
        "transit_house_score": round(transit_house_score, 2),
        "transit_angular_score": round(transit_angular_score, 2),
        "location_component_score": location_component_score,
        "retrograde_penalty": round(retro_adj, 2),
        "final_score": final_score,
        "location_mode": ctx.location_mode,
        "calculated_for": calculated_for,
        "resolved_local_datetime": eval_meta.get("resolved_local_datetime"),
        "resolved_utc_datetime": eval_meta.get("resolved_utc_datetime"),
        "timezone": eval_meta.get("timezone") or eval_meta.get("evaluation_timezone"),
        "target_time": eval_meta.get("target_time"),
    }

    key_themes = _build_key_themes(profile, opportunities, risks, final_score)
    timing_notes = _build_timing_notes(transit, profile, retro_adj)

    return {
        "executive": {
            "score": final_score,
            "rating": _rating(final_score),
            "activity": profile.label,
            "summary": _executive_summary(final_score, profile, opportunities, risks),
            "recommendation": _recommendation(final_score, profile),
        },
        "strategic": {
            "score": final_score,
            "base_score": BASE_SCORE,
            "adjustments": {
                "aspects": aspect_score,
                "natal_house_alignment": round(house_adj, 2),
                "transit_house_score": round(transit_house_score, 2),
                "transit_angular_score": round(transit_angular_score, 2),
                "transit_retrograde": round(retro_adj, 2),
            },
            "component_breakdown": component_breakdown,
            "transit_house_notes": transit_house_notes[:8],
            "transit_angular_notes": transit_angular_notes[:8],
            "key_themes": key_themes,
            "opportunity_factors": opportunities[:6],
            "risk_factors": risks[:6],
            "timing_notes": timing_notes,
            "primary_planets": list(profile.primary_planets),
        },
        "technical": {
            "activity_type": activity_type,
            "resolved_activity": profile.label,
            "scoring_context": {
                "location_mode": ctx.location_mode,
                "include_natal_house_bonus": ctx.include_natal_house_bonus,
                "include_transit_house_score": ctx.include_transit_house_score,
                "include_transit_angular_score": ctx.include_transit_angular_score,
            },
            "natal_points_used": sorted(natal.keys()),
            "transit_points_used": sorted(transit.keys()),
            "aspects_evaluated": raw_contributions,
            "aspect_count": len(raw_contributions),
            "component_breakdown": component_breakdown,
            "calculation_metadata": {
                "base_score": BASE_SCORE,
                "orbs": dict(orb_table),
                "formula": (
                    "score = clamp(50 + aspects + natal_house_bonus? + "
                    "transit_house_score? + transit_angular_score? - retrograde_penalty)"
                ),
            },
        },
    }


def _build_key_themes(
    profile: ActivityProfile,
    opportunities: list[str],
    risks: list[str],
    score: int,
) -> list[str]:
    themes = [f"Strategic focus: {profile.executive_focus}"]
    if opportunities:
        themes.append("Supportive transits to natal rulers of this activity.")
    if risks:
        themes.append("Hard aspects suggest resistance, delays, or rework.")
    if score >= 65:
        themes.append("Overall sky favors initiative over hesitation.")
    elif score < 45:
        themes.append("Consolidate and plan; avoid overextension.")
    return themes


def _build_timing_notes(
    transit: dict[str, dict[str, Any]],
    profile: ActivityProfile,
    retro_adj: float,
) -> list[str]:
    notes: list[str] = []
    retrograde_primary = [
        p for p in profile.primary_planets if transit.get(p, {}).get("retrograde")
    ]
    if retrograde_primary:
        notes.append(
            f"Primary rulers retrograde: {', '.join(retrograde_primary)} — review, revise, or delay."
        )
    if retro_adj < -3:
        notes.append("Retrograde load reduces forward momentum; double-check communications and contracts.")
    if not notes:
        notes.append("No major retrograde friction on primary rulers; standard due diligence applies.")
    return notes
