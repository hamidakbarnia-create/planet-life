"""Vault reading service — chart → rules → templates."""

from __future__ import annotations

from datetime import date, timedelta

from packages.astro_engine.scoring_context import (
    CONTEXT_CALENDAR_DAY,
    CONTEXT_CALENDAR_HOURLY,
)
from services.chart_data import build_chart_payload, _import_swisseph, _local_datetime, resolve_coordinates
from services.scoring_pipeline import score_with_context
from packages.astro_engine.vault_rules import (
    build_mars_verdict,
    degree_in_sign,
    sign_of,
    verdict_to_dict,
)
from packages.astro_engine.relationship_profile import resolve_relationship_profile
from packages.astro_engine.scoring import _detect_aspect
from packages.astro_engine.vault_templates import (
    SIGN_LABEL,
    _LIVE_REEL_FOCUS,
    render_best_countries_reading,
    render_business_geography_reading,
    render_date_outfit_reading,
    render_ghost_days_reading,
    render_hot_attraction_days_reading,
    render_live_reel_time_reading,
    render_mars_reading,
    render_money_ask_days_reading,
    render_cheating_radar_reading,
    render_compatibility_reading,
    render_partner_profile_reading,
    render_todays_color_reading,
    render_todays_perfume_reading,
    render_communication_risk_reading,
    render_trust_patterns_reading,
    render_yes_day_reading,
)

_RADAR_DIM_PLANETS: dict[str, frozenset[str]] = {
    "trust_pressure": frozenset({"saturn", "sun", "moon", "venus"}),
    "communication_ambiguity": frozenset({"mercury", "moon", "venus", "sun"}),
    "emotional_withdrawal": frozenset({"moon", "saturn", "mars", "venus"}),
    "secrecy_avoidance": frozenset({"mercury", "saturn", "mars", "sun"}),
}

# Shadow Room — Trust Patterns (Moon/Mercury/Venus/Jupiter/Saturn only).
_TRUST_DIM_PLANETS: dict[str, frozenset[str]] = {
    "trust_building": frozenset({"moon", "venus", "jupiter"}),
    "trust_pressure": frozenset({"saturn", "moon", "mercury"}),
    "communication_reliability": frozenset({"mercury", "saturn", "venus"}),
    "boundary_risks": frozenset({"saturn", "mercury", "moon"}),
    "repair_opportunities": frozenset({"jupiter", "venus", "mercury"}),
}
# Distinct planet roles (not a Cheating Radar rename).
_TRUST_PLANET_ROLES: dict[str, str] = {
    "moon": "emotional_consistency_safety",
    "mercury": "communication_clarity_follow_through",
    "venus": "reciprocity_relational_ease",
    "jupiter": "goodwill_repair_capacity",
    "saturn": "boundaries_reliability_pressure_durability",
}

# Shadow Room — Communication Risk (Mercury/Moon/Mars/Saturn/Jupiter/Venus).
_COMM_RISK_DIM_PLANETS: dict[str, frozenset[str]] = {
    "clarity_risk": frozenset({"mercury", "saturn"}),
    "misunderstanding_risk": frozenset({"mercury", "moon", "venus"}),
    "emotional_reactivity": frozenset({"moon", "mars"}),
    "avoidance_silence": frozenset({"saturn", "mercury", "moon"}),
    "escalation_risk": frozenset({"mars", "saturn", "mercury"}),
    "repair_capacity": frozenset({"jupiter", "venus", "mercury"}),
}
_COMM_RISK_PLANET_ROLES: dict[str, str] = {
    "mercury": "clarity_interpretation_follow_through",
    "moon": "emotional_reception_reactivity",
    "mars": "conflict_activation_escalation",
    "saturn": "silence_inhibition_rigidity_durability",
    "jupiter": "perspective_repair_capacity",
    "venus": "tone_reciprocity_relational_ease",
}

_COMPAT_REL_TO_PROFILE = {
    "romantic": "romantic_partner",
    "marriage": "spouse",
    "business": "business_partner",
    "friendship": "friend",
}
_VALID_COMPAT_RELS = frozenset(_COMPAT_REL_TO_PROFILE)
_COMPAT_DIM_PLANETS: dict[str, frozenset[str]] = {
    "emotional": frozenset({"moon", "venus", "sun"}),
    "communication": frozenset({"mercury", "moon", "venus", "sun"}),
    "chemistry": frozenset({"venus", "mars", "moon"}),
    "stability": frozenset({"saturn", "sun", "moon", "jupiter"}),
    "growth": frozenset({"jupiter", "sun", "mercury", "mars"}),
}
from services.pathfinder import relocation_reading

_PARTNERSHIP_GOAL_TO_PROFILE = {
    "romantic": "romantic_partner",
    "marriage": "spouse",
    "business": "business_partner",
    "financial_support": "investor",
    "long_term_stability": "spouse",
}
_VALID_PARTNERSHIP_GOALS = frozenset(_PARTNERSHIP_GOAL_TO_PROFILE)
_SYNASTRY_PLANETS = ("sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn")
_SYNASTRY_HARMONY = frozenset({"trine", "sextile", "conjunction"})
_SYNASTRY_TENSION = frozenset({"square", "opposition"})

# Provider — Best Countries (Pathfinder relocation; no calendar scorers).
_GOAL_TO_AREA = {
    "wealth": "wealth",
    "career": "career",
    "relationship": "love",
    "visibility": "career",
    "stability": "home",
}
_VALID_GOALS = frozenset(_GOAL_TO_AREA)

# Provider — Business Geography: blend areas that already weight
# Jupiter / Mercury / Sun / Saturn and houses 2, 6, 10, 11.
_BUSINESS_GOAL_AREAS: dict[str, tuple[tuple[str, float], ...]] = {
    "sales": (("wealth", 0.55), ("community", 0.45)),
    "networking": (("community", 0.55), ("career", 0.45)),
    "credibility": (("career", 0.65), ("wealth", 0.35)),
    "expansion": (("wealth", 0.50), ("career", 0.50)),
    "investment": (("wealth", 0.70), ("career", 0.30)),
}
_VALID_BUSINESS_GOALS = frozenset(_BUSINESS_GOAL_AREAS)
_BUSINESS_AREAS = ("wealth", "career", "community")

# Power Calendar Ghost Days reuse the existing rest_recovery activity profile
# (Moon / Saturn / Neptune — strategic distance & withdrawal).
_GHOST_ACTION = "rest_recovery"
_GHOST_HORIZON_DAYS = 14
_GHOST_TOP_N = 5

# Power Calendar Money-Ask Days — Venus-forward finance_transaction.
_MONEY_ASK_ACTION = "finance_transaction"
_MONEY_ASK_HORIZON_DAYS = 14
_MONEY_ASK_TOP_N = 5

# Power Calendar Yes Day — decision/approval scorers (not business/attraction).
_YES_ASK_ACTION = "negotiation"
_YES_SIGN_ACTION = "contract_signing"
_YES_HORIZON_DAYS = 14

# Power Calendar Hot Attraction Days — dedicated Venus/Mars attraction profile.
_HOT_ACTION = "hot_attraction"
_HOT_HORIZON_DAYS = 14
_HOT_TOP_N = 5

# Style Timing Live / Reel Time — three existing hourly action profiles.
_REEL_POSTING_ACTION = "social_media_post"  # → networking
_REEL_FILMING_ACTION = "creative_work"
_REEL_LIVE_ACTION = "presentation"  # → networking (reach/presence, not business_launch)
_REEL_HOURS = tuple(range(24))

# Style Timing Date Outfit — hot_attraction hourly (Venus/Mars chemistry).
_OUTFIT_MEETING_ACTION = "hot_attraction"


def _reel_confidence(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 60:
        return "medium"
    return "low"


def _lilith_longitude(birth_date: str, birth_time: str, location: str) -> float:
    """Mean Black Moon Lilith longitude at birth."""
    swe = _import_swisseph()
    lat, lon = resolve_coordinates(location)
    dt = _local_datetime(birth_date, birth_time, lat, lon)
    jd = swe.julday(
        dt.year, dt.month, dt.day,
        dt.hour + dt.minute / 60.0,
        swe.GREG_CAL,
    )
    result, _ = swe.calc_ut(jd, swe.MEAN_APOG, swe.FLG_MOSEPH)
    return float(result[0])


def mars_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
) -> dict:
    """Full Mars reading for Vault Sensuality card."""
    today = date.today().isoformat()
    natal, _transit = build_chart_payload(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=today,
        target_time=birth_time,
        house_system=house_system,
        zodiac=zodiac,
    )
    lilith_lon = _lilith_longitude(birth_date, birth_time, location)
    verdict = build_mars_verdict(natal.get("planets", {}), lilith_lon=lilith_lon)
    vdict = verdict_to_dict(verdict)
    text = render_mars_reading(vdict, lang=lang)
    return {
        "planet": "mars",
        "lang": lang,
        "verdict": vdict,
        "reading": text,
    }


def ghost_days_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    horizon_days: int = _GHOST_HORIZON_DAYS,
) -> dict:
    """
    Power Calendar — Ghost Days.

    Reuses calendar-day scoring with action rest_recovery (existing infrastructure).
    Returns the same reading shape as Mars (executive / strategic / technical).
    """
    start = date.today()
    dates = [
        (start + timedelta(days=offset)).isoformat()
        for offset in range(max(1, int(horizon_days)))
    ]

    windows: list[dict] = []
    for target_date in dates:
        result, _natal, _transit = score_with_context(
            birth_date=birth_date,
            birth_time=birth_time,
            location=location,
            target_date=target_date,
            target_time=None,
            action_type=_GHOST_ACTION,
            context=CONTEXT_CALENDAR_DAY,
            latitude=latitude,
            longitude=longitude,
            evaluation_location=evaluation_location,
            evaluation_latitude=evaluation_latitude,
            evaluation_longitude=evaluation_longitude,
            evaluation_timezone=evaluation_timezone,
            house_system=house_system,
            zodiac=zodiac,
        )
        executive = result.get("executive") or {}
        score = executive.get("score")
        if not isinstance(score, (int, float)):
            continue
        windows.append(
            {
                "date": target_date,
                "score": int(score),
                "rating": executive.get("rating"),
            }
        )

    windows.sort(key=lambda w: (-int(w["score"]), w["date"]))
    top = windows[:_GHOST_TOP_N]
    text = render_ghost_days_reading(
        top, lang=lang, horizon_days=max(1, int(horizon_days))
    )
    return {
        "planet": "ghost",
        "action_type": _GHOST_ACTION,
        "lang": lang,
        "windows": top,
        "verdict": {
            "horizon_days": max(1, int(horizon_days)),
            "action_type": _GHOST_ACTION,
            "windows": top,
            "confidence": text.get("confidence"),
            "action": text.get("action"),
            "avoid": text.get("avoid"),
        },
        "reading": text,
    }


def money_ask_days_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    horizon_days: int = _MONEY_ASK_HORIZON_DAYS,
) -> dict:
    """
    Power Calendar — Money-Ask Days.

    Same calendar-day window pipeline as Ghost Days, scored with
    finance_transaction (Venus / Jupiter money ask timing).
    """
    start = date.today()
    dates = [
        (start + timedelta(days=offset)).isoformat()
        for offset in range(max(1, int(horizon_days)))
    ]

    windows: list[dict] = []
    for target_date in dates:
        result, _natal, _transit = score_with_context(
            birth_date=birth_date,
            birth_time=birth_time,
            location=location,
            target_date=target_date,
            target_time=None,
            action_type=_MONEY_ASK_ACTION,
            context=CONTEXT_CALENDAR_DAY,
            latitude=latitude,
            longitude=longitude,
            evaluation_location=evaluation_location,
            evaluation_latitude=evaluation_latitude,
            evaluation_longitude=evaluation_longitude,
            evaluation_timezone=evaluation_timezone,
            house_system=house_system,
            zodiac=zodiac,
        )
        executive = result.get("executive") or {}
        score = executive.get("score")
        if not isinstance(score, (int, float)):
            continue
        windows.append(
            {
                "date": target_date,
                "score": int(score),
                "rating": executive.get("rating"),
            }
        )

    windows.sort(key=lambda w: (-int(w["score"]), w["date"]))
    top = windows[:_MONEY_ASK_TOP_N]
    text = render_money_ask_days_reading(
        top, lang=lang, horizon_days=max(1, int(horizon_days))
    )
    return {
        "planet": "money",
        "action_type": _MONEY_ASK_ACTION,
        "lang": lang,
        "windows": top,
        "verdict": {
            "horizon_days": max(1, int(horizon_days)),
            "action_type": _MONEY_ASK_ACTION,
            "windows": top,
            "confidence": text.get("confidence"),
            "action": text.get("action"),
            "avoid": text.get("avoid"),
        },
        "reading": text,
    }


def _calendar_day_windows(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    action_type: str,
    house_system: str,
    zodiac: str,
    latitude: float | None,
    longitude: float | None,
    evaluation_location: str | None,
    evaluation_latitude: float | None,
    evaluation_longitude: float | None,
    evaluation_timezone: str | None,
    horizon_days: int,
) -> list[dict]:
    """Score each local calendar day (Money Ask / Ghost window pipeline)."""
    start = date.today()
    windows: list[dict] = []
    for offset in range(max(1, int(horizon_days))):
        target_date = (start + timedelta(days=offset)).isoformat()
        result, _natal, _transit = score_with_context(
            birth_date=birth_date,
            birth_time=birth_time,
            location=location,
            target_date=target_date,
            target_time=None,
            action_type=action_type,
            context=CONTEXT_CALENDAR_DAY,
            latitude=latitude,
            longitude=longitude,
            evaluation_location=evaluation_location,
            evaluation_latitude=evaluation_latitude,
            evaluation_longitude=evaluation_longitude,
            evaluation_timezone=evaluation_timezone,
            house_system=house_system,
            zodiac=zodiac,
        )
        executive = result.get("executive") or {}
        score = executive.get("score")
        if not isinstance(score, (int, float)):
            continue
        score_i = int(score)
        windows.append(
            {
                "date": target_date,
                "score": score_i,
                "rating": executive.get("rating"),
                "confidence": _reel_confidence(score_i),
                "action_type": action_type,
            }
        )
    windows.sort(key=lambda w: (-int(w["score"]), w["date"]))
    return windows


def yes_day_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    horizon_days: int = _YES_HORIZON_DAYS,
) -> dict:
    """
    Power Calendar — Yes Day.

    Reuses Money Ask calendar-day scoring:
    ask = negotiation, sign = contract_signing,
    commit = best day for both approval + terms clarity.
    """
    days = max(1, int(horizon_days))
    common = dict(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
        evaluation_location=evaluation_location,
        evaluation_latitude=evaluation_latitude,
        evaluation_longitude=evaluation_longitude,
        evaluation_timezone=evaluation_timezone,
        horizon_days=days,
    )
    ask_windows = _calendar_day_windows(action_type=_YES_ASK_ACTION, **common)
    sign_windows = _calendar_day_windows(action_type=_YES_SIGN_ACTION, **common)

    fallback = {
        "date": date.today().isoformat(),
        "score": 0,
        "rating": "",
        "confidence": "low",
        "action_type": _YES_ASK_ACTION,
    }
    ask = ask_windows[0] if ask_windows else {**fallback, "action_type": _YES_ASK_ACTION}
    sign = (
        sign_windows[0]
        if sign_windows
        else {**fallback, "action_type": _YES_SIGN_ACTION}
    )

    ask_map = {w["date"]: w for w in ask_windows}
    sign_map = {w["date"]: w for w in sign_windows}
    commit: dict | None = None
    for d, aw in ask_map.items():
        sw = sign_map.get(d)
        if sw is None:
            continue
        score_i = (int(aw["score"]) + int(sw["score"])) // 2
        candidate = {
            "date": d,
            "score": score_i,
            "rating": aw.get("rating") or sw.get("rating") or "",
            "confidence": _reel_confidence(score_i),
            "action_type": f"{_YES_ASK_ACTION}+{_YES_SIGN_ACTION}",
        }
        if commit is None or score_i > int(commit["score"]):
            commit = candidate
    if commit is None:
        commit = {
            "date": ask["date"],
            "score": int(ask.get("score", 0)),
            "rating": ask.get("rating") or "",
            "confidence": ask.get("confidence") or "low",
            "action_type": f"{_YES_ASK_ACTION}+{_YES_SIGN_ACTION}",
        }

    text = render_yes_day_reading(
        ask=ask,
        commit=commit,
        sign=sign,
        horizon_days=days,
        lang=lang,
    )
    return {
        "planet": "yes",
        "lang": lang,
        "verdict": {
            "horizon_days": days,
            "ask": ask,
            "commit": commit,
            "sign": sign,
            "confidence": text.get("confidence"),
            "avoid": text.get("avoid"),
            "reason": text.get("reason"),
        },
        "reading": text,
    }


def hot_attraction_days_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    horizon_days: int = _HOT_HORIZON_DAYS,
) -> dict:
    """
    Power Calendar — Hot Attraction Days.

    Calendar-day scoring with action hot_attraction (Venus / Mars / Moon).
    Returns the same reading shape as Ghost Days / Mars.
    """
    start = date.today()
    dates = [
        (start + timedelta(days=offset)).isoformat()
        for offset in range(max(1, int(horizon_days)))
    ]

    windows: list[dict] = []
    for target_date in dates:
        result, _natal, _transit = score_with_context(
            birth_date=birth_date,
            birth_time=birth_time,
            location=location,
            target_date=target_date,
            target_time=None,
            action_type=_HOT_ACTION,
            context=CONTEXT_CALENDAR_DAY,
            latitude=latitude,
            longitude=longitude,
            evaluation_location=evaluation_location,
            evaluation_latitude=evaluation_latitude,
            evaluation_longitude=evaluation_longitude,
            evaluation_timezone=evaluation_timezone,
            house_system=house_system,
            zodiac=zodiac,
        )
        executive = result.get("executive") or {}
        score = executive.get("score")
        if not isinstance(score, (int, float)):
            continue
        windows.append(
            {
                "date": target_date,
                "score": int(score),
                "rating": executive.get("rating"),
            }
        )

    windows.sort(key=lambda w: (-int(w["score"]), w["date"]))
    top = windows[:_HOT_TOP_N]
    text = render_hot_attraction_days_reading(
        top, lang=lang, horizon_days=max(1, int(horizon_days))
    )
    return {
        "planet": "hot",
        "action_type": _HOT_ACTION,
        "lang": lang,
        "windows": top,
        "verdict": {
            "horizon_days": max(1, int(horizon_days)),
            "action_type": _HOT_ACTION,
            "windows": top,
            "confidence": text.get("confidence"),
            "action": text.get("action"),
            "avoid": text.get("avoid"),
        },
        "reading": text,
    }


def todays_color_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    target_date: str | None = None,
) -> dict:
    """
    Style Timing — Today's Color.

    Reuses chart_data transit Moon for the selected day (default: today).
    Returns the same reading shape as other Vault live cards.
    """
    day = target_date or date.today().isoformat()
    _natal, transit = build_chart_payload(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=day,
        target_time=None,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
        evaluation_location=evaluation_location,
        evaluation_latitude=evaluation_latitude,
        evaluation_longitude=evaluation_longitude,
        evaluation_timezone=evaluation_timezone,
    )
    moon = (transit.get("planets") or {}).get("moon") or {}
    lon = moon.get("longitude")
    if not isinstance(lon, (int, float)):
        raise ValueError("transit chart missing Moon longitude")
    moon_sign = sign_of(float(lon))
    moon_degree = round(degree_in_sign(float(lon)), 2)
    text = render_todays_color_reading(
        moon_sign=moon_sign,
        moon_degree=moon_degree,
        target_date=day,
        lang=lang,
    )
    return {
        "planet": "color",
        "lang": lang,
        "verdict": {
            "target_date": day,
            "moon_sign": moon_sign,
            "moon_degree": moon_degree,
            "moon_house": moon.get("house"),
            "confidence": text.get("confidence"),
            "action": text.get("action"),
            "avoid": text.get("avoid"),
        },
        "reading": text,
    }


def todays_perfume_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    target_date: str | None = None,
) -> dict:
    """
    Style Timing — Today's Perfume.

    Reuses the same chart_data pipeline as Today's Color, but personalizes
    from Natal Venus + Natal Moon + Ascendant + Transit Moon for the local day.
    """
    day = target_date or date.today().isoformat()
    natal, transit = build_chart_payload(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=day,
        target_time=None,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
        evaluation_location=evaluation_location,
        evaluation_latitude=evaluation_latitude,
        evaluation_longitude=evaluation_longitude,
        evaluation_timezone=evaluation_timezone,
    )
    natal_planets = natal.get("planets") or {}
    transit_planets = transit.get("planets") or {}

    venus = natal_planets.get("venus") or {}
    n_moon = natal_planets.get("moon") or {}
    t_moon = transit_planets.get("moon") or {}
    asc_lon = natal.get("ascendant")

    venus_lon = venus.get("longitude")
    n_moon_lon = n_moon.get("longitude")
    t_moon_lon = t_moon.get("longitude")
    if not isinstance(venus_lon, (int, float)):
        raise ValueError("natal chart missing Venus longitude")
    if not isinstance(n_moon_lon, (int, float)):
        raise ValueError("natal chart missing Moon longitude")
    if not isinstance(asc_lon, (int, float)):
        raise ValueError("natal chart missing Ascendant")
    if not isinstance(t_moon_lon, (int, float)):
        raise ValueError("transit chart missing Moon longitude")

    venus_sign = sign_of(float(venus_lon))
    natal_moon_sign = sign_of(float(n_moon_lon))
    asc_sign = sign_of(float(asc_lon))
    transit_moon_sign = sign_of(float(t_moon_lon))

    text = render_todays_perfume_reading(
        natal_venus_sign=venus_sign,
        natal_moon_sign=natal_moon_sign,
        ascendant_sign=asc_sign,
        transit_moon_sign=transit_moon_sign,
        target_date=day,
        lang=lang,
    )
    return {
        "planet": "perfume",
        "lang": lang,
        "verdict": {
            "target_date": day,
            "natal_venus_sign": venus_sign,
            "natal_moon_sign": natal_moon_sign,
            "ascendant_sign": asc_sign,
            "transit_moon_sign": transit_moon_sign,
            "natal_venus_degree": round(degree_in_sign(float(venus_lon)), 2),
            "natal_moon_degree": round(degree_in_sign(float(n_moon_lon)), 2),
            "ascendant_degree": round(degree_in_sign(float(asc_lon)), 2),
            "transit_moon_degree": round(degree_in_sign(float(t_moon_lon)), 2),
            "fragrance_family": text.get("fragrance_family"),
            "primary_notes": text.get("primary_notes"),
            "accent_note": text.get("accent_note"),
            "occasion": text.get("occasion"),
            "avoid": text.get("avoid"),
            "reason": text.get("reason"),
            "confidence": text.get("confidence"),
        },
        "reading": text,
    }


def _best_hourly_window(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    target_date: str,
    action_type: str,
    slot_key: str,
    house_system: str,
    zodiac: str,
    latitude: float | None,
    longitude: float | None,
    evaluation_location: str | None,
    evaluation_latitude: float | None,
    evaluation_longitude: float | None,
    evaluation_timezone: str | None,
    hours: tuple[int, ...] = _REEL_HOURS,
    lang: str = "en",
) -> dict:
    """Pick the strongest local hour for one content action on target_date."""
    lang_key = lang if lang in ("en", "fa", "ru", "ar") else "en"
    meeting_focus = {
        "en": "chemistry and first-impression timing",
        "fa": "شیمی و زمان‌بندی برداشت اول",
        "ru": "химия и тайминг первого впечатления",
        "ar": "الكيمياء وتوقيت الانطباع الأول",
    }
    best: dict | None = None
    for hour in hours:
        result, _natal, _transit = score_with_context(
            birth_date=birth_date,
            birth_time=birth_time,
            location=location,
            target_date=target_date,
            target_time=f"{int(hour):02d}:00",
            action_type=action_type,
            context=CONTEXT_CALENDAR_HOURLY,
            latitude=latitude,
            longitude=longitude,
            evaluation_location=evaluation_location,
            evaluation_latitude=evaluation_latitude,
            evaluation_longitude=evaluation_longitude,
            evaluation_timezone=evaluation_timezone,
            house_system=house_system,
            zodiac=zodiac,
        )
        executive = result.get("executive") or {}
        score = executive.get("score")
        if not isinstance(score, (int, float)):
            continue
        score_i = int(score)
        end = (int(hour) + 1) % 24
        window = f"{int(hour):02d}:00–{end:02d}:00"
        rating = executive.get("rating") or ""
        if slot_key == "meeting":
            focus = meeting_focus[lang_key]
        else:
            focus = (_LIVE_REEL_FOCUS.get(slot_key) or {}).get(lang_key) or slot_key
        reason = f"{rating}: {focus}".strip(": ").strip() if rating else focus
        candidate = {
            "hour": int(hour),
            "window": window,
            "score": score_i,
            "rating": rating,
            "confidence": _reel_confidence(score_i),
            "reason": reason,
            "action_type": action_type,
        }
        if best is None or score_i > int(best["score"]):
            best = candidate
    if best is None:
        if slot_key == "meeting":
            focus = meeting_focus[lang_key]
        else:
            focus = (_LIVE_REEL_FOCUS.get(slot_key) or {}).get(lang_key) or slot_key
        return {
            "hour": 12,
            "window": "12:00–13:00",
            "score": 0,
            "rating": "",
            "confidence": "low",
            "reason": focus,
            "action_type": action_type,
        }
    return best


def live_reel_time_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    target_date: str | None = None,
    hours: tuple[int, ...] | None = None,
) -> dict:
    """
    Style Timing — Live / Reel Time.

    Reuses calendar-hourly scoring for three existing action profiles:
    posting (social_media_post), filming (creative_work), live (business_launch).
    """
    day = target_date or date.today().isoformat()
    sample_hours = hours if hours is not None else _REEL_HOURS
    common = dict(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=day,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
        evaluation_location=evaluation_location,
        evaluation_latitude=evaluation_latitude,
        evaluation_longitude=evaluation_longitude,
        evaluation_timezone=evaluation_timezone,
        hours=sample_hours,
    )
    common["lang"] = lang
    posting = _best_hourly_window(
        action_type=_REEL_POSTING_ACTION,
        slot_key="posting",
        **common,
    )
    filming = _best_hourly_window(
        action_type=_REEL_FILMING_ACTION,
        slot_key="filming",
        **common,
    )
    live_stream = _best_hourly_window(
        action_type=_REEL_LIVE_ACTION,
        slot_key="live_stream",
        **common,
    )
    text = render_live_reel_time_reading(
        posting=posting,
        filming=filming,
        live_stream=live_stream,
        target_date=day,
        lang=lang,
    )
    return {
        "planet": "reel",
        "lang": lang,
        "verdict": {
            "target_date": day,
            "posting": posting,
            "filming": filming,
            "live_stream": live_stream,
            "confidence": text.get("confidence"),
            "reason": text.get("reason"),
        },
        "reading": text,
    }


def date_outfit_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    evaluation_timezone: str | None = None,
    target_date: str | None = None,
    hours: tuple[int, ...] | None = None,
) -> dict:
    """
    Style Timing — Date Outfit.

    Reuses chart_data (Venus/Asc/Moon) + Today's Color/Perfume tables +
    calendar-hourly hot_attraction for best meeting time.
    """
    day = target_date or date.today().isoformat()
    natal, transit = build_chart_payload(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=day,
        target_time=None,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
        evaluation_location=evaluation_location,
        evaluation_latitude=evaluation_latitude,
        evaluation_longitude=evaluation_longitude,
        evaluation_timezone=evaluation_timezone,
    )
    natal_planets = natal.get("planets") or {}
    transit_planets = transit.get("planets") or {}

    venus = natal_planets.get("venus") or {}
    t_moon = transit_planets.get("moon") or {}
    asc_lon = natal.get("ascendant")
    venus_lon = venus.get("longitude")
    t_moon_lon = t_moon.get("longitude")
    if not isinstance(venus_lon, (int, float)):
        raise ValueError("natal chart missing Venus longitude")
    if not isinstance(asc_lon, (int, float)):
        raise ValueError("natal chart missing Ascendant")
    if not isinstance(t_moon_lon, (int, float)):
        raise ValueError("transit chart missing Moon longitude")

    venus_sign = sign_of(float(venus_lon))
    asc_sign = sign_of(float(asc_lon))
    transit_moon_sign = sign_of(float(t_moon_lon))

    meeting = _best_hourly_window(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=day,
        action_type=_OUTFIT_MEETING_ACTION,
        slot_key="meeting",
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
        evaluation_location=evaluation_location,
        evaluation_latitude=evaluation_latitude,
        evaluation_longitude=evaluation_longitude,
        evaluation_timezone=evaluation_timezone,
        hours=hours if hours is not None else _REEL_HOURS,
        lang=lang,
    )

    text = render_date_outfit_reading(
        natal_venus_sign=venus_sign,
        ascendant_sign=asc_sign,
        transit_moon_sign=transit_moon_sign,
        meeting_window=str(meeting.get("window") or "—"),
        meeting_score=int(meeting.get("score") or 0),
        target_date=day,
        lang=lang,
    )
    return {
        "planet": "outfit",
        "lang": lang,
        "verdict": {
            "target_date": day,
            "natal_venus_sign": venus_sign,
            "ascendant_sign": asc_sign,
            "transit_moon_sign": transit_moon_sign,
            "outfit_style": text.get("outfit_style"),
            "primary_color": text.get("primary_color"),
            "accent_color": text.get("accent_color"),
            "accessories": text.get("accessories"),
            "fragrance_family": text.get("fragrance_family"),
            "best_meeting_time": text.get("best_meeting_time"),
            "avoid": text.get("avoid"),
            "confidence": text.get("confidence"),
            "meeting": meeting,
        },
        "reading": text,
    }


def _coord_location(location: str, latitude: float | None, longitude: float | None) -> str:
    if latitude is not None and longitude is not None:
        return f"{latitude},{longitude}"
    return location


def _parse_place_token(token: str) -> tuple[str, str]:
    """Accept 'Label|lat,lon', 'lat,lon', or a place name."""
    raw = (token or "").strip()
    if not raw:
        raise ValueError("empty location")
    if "|" in raw:
        label, loc = raw.split("|", 1)
        label, loc = label.strip(), loc.strip()
        if not loc:
            raise ValueError("empty location")
        return label or loc, loc
    return raw, raw


def _reason_line(reason: dict, *, lang: str) -> str:
    planet = str(reason.get("planet") or "")
    angle = reason.get("angle")
    house = reason.get("house")
    code = str(reason.get("code") or "")
    if angle:
        return {
            "en": f"{planet} on {angle}",
            "fa": f"{planet} روی {angle}",
            "ru": f"{planet} на {angle}",
            "ar": f"{planet} على {angle}",
        }.get(lang, f"{planet} on {angle}")
    if house:
        return {
            "en": f"{planet} in house {house} ({code})",
            "fa": f"{planet} در خانه {house} ({code})",
            "ru": f"{planet} в доме {house} ({code})",
            "ar": f"{planet} في البيت {house} ({code})",
        }.get(lang, f"{planet} in house {house}")
    return code or planet or "—"


def _opp_risk_from_effect(effect: dict, *, lang: str) -> tuple[str, str]:
    reasons = list(effect.get("reasons") or [])
    support = next(
        (r for r in reasons if str(r.get("code") or "").startswith("sig_support") or r.get("angle")),
        reasons[0] if reasons else None,
    )
    strain = next(
        (r for r in reasons if str(r.get("code") or "") in {"sig_strain", "sig_quiet"}),
        reasons[-1] if len(reasons) > 1 else None,
    )
    opportunity = _reason_line(support, lang=lang) if support else {
        "en": "relocated angular support",
        "fa": "پشتیبانی زاویه‌ای جابه‌جا",
        "ru": "угловая поддержка релокации",
        "ar": "دعم زاوي منقول",
    }.get(lang, "relocated angular support")
    risk = _reason_line(strain, lang=lang) if strain else {
        "en": "watch angular pressure in this city",
        "fa": "فشار زاویه‌ای این شهر را زیر نظر بگیر",
        "ru": "следите за угловым давлением в городе",
        "ar": "راقبي الضغط الزاوي في هذه المدينة",
    }.get(lang, "watch angular pressure")
    return opportunity, risk


def best_countries_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    goal: str = "wealth",
    locations: list[str] | None = None,
    current_location: str | None = None,
) -> dict:
    """
    Provider — Best Countries.

    Ranks a shortlist via Pathfinder relocation_reading (relocated angles +
    significator houses). Does not invent ranks without resolvable geography.
    """
    goal_key = goal if goal in _VALID_GOALS else "wealth"
    area = _GOAL_TO_AREA[goal_key]
    missing: list[str] = []
    birth_loc = _coord_location(location, latitude, longitude)

    tokens: list[str] = list(locations or [])
    if current_location and current_location.strip():
        tokens = [current_location.strip(), *tokens]

    # Dedupe by target location string while preserving order.
    seen: set[str] = set()
    candidates: list[tuple[str, str]] = []
    for token in tokens:
        try:
            label, loc = _parse_place_token(token)
        except ValueError:
            continue
        key = loc.lower()
        if key in seen:
            continue
        seen.add(key)
        candidates.append((label, loc))

    if not candidates:
        missing.append("locations")
        text = render_best_countries_reading(
            [],
            goal=goal_key,
            lang=lang,
            missing_inputs=missing,
        )
        return {
            "planet": "countries",
            "lang": lang,
            "goal": goal_key,
            "goal_area": area,
            "ranked": [],
            "missing_inputs": missing,
            "verdict": {
                "goal": goal_key,
                "goal_area": area,
                "confidence": text.get("confidence"),
                "missing_inputs": missing,
            },
            "reading": text,
        }

    ranked: list[dict] = []
    for label, loc in candidates:
        try:
            reloc = relocation_reading(
                birth_date=birth_date,
                birth_time=birth_time,
                birth_location=birth_loc,
                target_location=loc,
                target_label=label,
                house_system=house_system,
                zodiac=zodiac,
            )
        except ValueError:
            missing.append(f"location:{label}")
            continue

        effects = list(reloc.get("effects") or [])
        by_area = {e["area"]: e for e in effects if isinstance(e, dict) and e.get("area")}
        goal_effect = by_area.get(area) or (effects[0] if effects else None)
        if not goal_effect:
            missing.append(f"location:{label}")
            continue
        top_effect = effects[0] if effects else goal_effect
        opportunity, risk = _opp_risk_from_effect(goal_effect, lang=lang)
        score = int(goal_effect.get("score") or 0)
        next_action = {
            "en": f"Prioritize {label} for {goal_key} fieldwork",
            "fa": f"{label} را برای کار میدانی {goal_key} اولویت بده",
            "ru": f"Приоритизируйте {label} для цели {goal_key}",
            "ar": f"أولوي {label} لهدف {goal_key}",
        }.get(lang, f"Prioritize {label} for {goal_key}")
        ranked.append(
            {
                "label": label,
                "location": loc,
                "score": score,
                "verdict": goal_effect.get("verdict"),
                "strongest_use_case": top_effect.get("area") or area,
                "goal_area": area,
                "opportunity": opportunity,
                "risk": risk,
                "recommended_next_action": next_action,
                "confidence": (
                    "high" if score >= 75 else "medium" if score >= 60 else "low"
                ),
            }
        )

    ranked.sort(key=lambda r: int(r.get("score") or 0), reverse=True)
    if not ranked and "locations" not in missing:
        missing.append("locations")

    text = render_best_countries_reading(
        ranked,
        goal=goal_key,
        lang=lang,
        missing_inputs=missing,
    )
    return {
        "planet": "countries",
        "lang": lang,
        "goal": goal_key,
        "goal_area": area,
        "ranked": ranked,
        "missing_inputs": missing,
        "verdict": {
            "goal": goal_key,
            "goal_area": area,
            "confidence": text.get("confidence"),
            "top": ranked[0] if ranked else None,
            "missing_inputs": missing,
        },
        "reading": text,
    }


def _business_blend_score(
    by_area: dict[str, dict],
    weights: tuple[tuple[str, float], ...],
) -> tuple[int, str, dict | None]:
    """Weighted average of Pathfinder area scores; strongest business area."""
    total_w = 0.0
    acc = 0.0
    best_area = weights[0][0]
    best_score = -1
    best_effect: dict | None = None
    for area_key, w in weights:
        effect = by_area.get(area_key)
        if not effect:
            continue
        score = int(effect.get("score") or 0)
        acc += score * w
        total_w += w
        if score > best_score:
            best_score = score
            best_area = area_key
            best_effect = effect
    if total_w <= 0:
        return 0, best_area, None
    # Prefer strongest among business areas when available.
    for area_key in _BUSINESS_AREAS:
        effect = by_area.get(area_key)
        if not effect:
            continue
        score = int(effect.get("score") or 0)
        if score > best_score:
            best_score = score
            best_area = area_key
            best_effect = effect
    return int(round(acc / total_w)), best_area, best_effect


def business_geography_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    goal: str = "expansion",
    locations: list[str] | None = None,
    current_location: str | None = None,
) -> dict:
    """
    Provider — Business Geography.

    Ranks a shortlist via Pathfinder relocation_reading, blending wealth /
    career / community so Jupiter, Mercury, Sun, Saturn and houses 2/6/10/11
    contribute where the engine already supports them.
    """
    goal_key = goal if goal in _VALID_BUSINESS_GOALS else "expansion"
    weights = _BUSINESS_GOAL_AREAS[goal_key]
    missing: list[str] = []
    birth_loc = _coord_location(location, latitude, longitude)

    tokens: list[str] = list(locations or [])
    if current_location and current_location.strip():
        tokens = [current_location.strip(), *tokens]

    seen: set[str] = set()
    candidates: list[tuple[str, str]] = []
    for token in tokens:
        try:
            label, loc = _parse_place_token(token)
        except ValueError:
            continue
        key = loc.lower()
        if key in seen:
            continue
        seen.add(key)
        candidates.append((label, loc))

    if not candidates:
        missing.append("locations")
        text = render_business_geography_reading(
            [],
            goal=goal_key,
            lang=lang,
            missing_inputs=missing,
        )
        return {
            "planet": "jupiter",
            "lang": lang,
            "goal": goal_key,
            "goal_areas": [a for a, _ in weights],
            "ranked": [],
            "missing_inputs": missing,
            "verdict": {
                "goal": goal_key,
                "confidence": text.get("confidence"),
                "missing_inputs": missing,
                "signals": ["jupiter", "mercury", "sun", "saturn"],
                "houses": [2, 6, 10, 11],
            },
            "reading": text,
        }

    ranked: list[dict] = []
    for label, loc in candidates:
        try:
            reloc = relocation_reading(
                birth_date=birth_date,
                birth_time=birth_time,
                birth_location=birth_loc,
                target_location=loc,
                target_label=label,
                house_system=house_system,
                zodiac=zodiac,
            )
        except ValueError:
            missing.append(f"location:{label}")
            continue

        effects = list(reloc.get("effects") or [])
        by_area = {e["area"]: e for e in effects if isinstance(e, dict) and e.get("area")}
        score, use_area, goal_effect = _business_blend_score(by_area, weights)
        if goal_effect is None and not any(by_area.get(a) for a, _ in weights):
            missing.append(f"location:{label}")
            continue
        effect_for_reasons = goal_effect or by_area.get(use_area) or next(
            (by_area[a] for a, _ in weights if a in by_area),
            None,
        )
        if effect_for_reasons is None:
            missing.append(f"location:{label}")
            continue
        opportunity, risk = _opp_risk_from_effect(effect_for_reasons, lang=lang)
        next_action = {
            "en": f"Prioritize {label} for {goal_key} market work",
            "fa": f"{label} را برای کار بازار {goal_key} اولویت بده",
            "ru": f"Приоритизируйте {label} для рынка {goal_key}",
            "ar": f"أولوي {label} لعمل سوق {goal_key}",
        }.get(lang, f"Prioritize {label} for {goal_key}")
        ranked.append(
            {
                "label": label,
                "location": loc,
                "score": score,
                "verdict": effect_for_reasons.get("verdict"),
                "strongest_use_case": use_area,
                "goal_areas": [a for a, _ in weights],
                "opportunity": opportunity,
                "risk": risk,
                "commercial_risk": risk,
                "recommended_next_action": next_action,
                "confidence": (
                    "high" if score >= 75 else "medium" if score >= 60 else "low"
                ),
            }
        )

    ranked.sort(key=lambda r: int(r.get("score") or 0), reverse=True)
    if not ranked and "locations" not in missing:
        missing.append("locations")

    text = render_business_geography_reading(
        ranked,
        goal=goal_key,
        lang=lang,
        missing_inputs=missing,
    )
    return {
        "planet": "jupiter",
        "lang": lang,
        "goal": goal_key,
        "goal_areas": [a for a, _ in weights],
        "ranked": ranked,
        "missing_inputs": missing,
        "verdict": {
            "goal": goal_key,
            "confidence": text.get("confidence"),
            "top": ranked[0] if ranked else None,
            "missing_inputs": missing,
            "signals": ["jupiter", "mercury", "sun", "saturn"],
            "houses": [2, 6, 10, 11],
        },
        "reading": text,
    }


def _sign_label(sign: str, lang: str) -> str:
    return SIGN_LABEL.get(sign, {}).get(lang) or sign


def _orb_strength(orb: float, max_orb: float = 8.0) -> float:
    return max(0.0, 1.0 - float(orb) / max_orb)


def _compute_vault_synastry(
    mine: dict,
    theirs: dict,
    profile,
) -> tuple[int, list[dict], list[dict]]:
    """Cross-chart aspects using scoring._detect_aspect + relationship_profile weights."""
    harmony: list[dict] = []
    tension: list[dict] = []
    for p_a in _SYNASTRY_PLANETS:
        body_a = mine.get(p_a) or {}
        lon_a = body_a.get("longitude")
        if not isinstance(lon_a, (int, float)):
            continue
        for p_b in _SYNASTRY_PLANETS:
            body_b = theirs.get(p_b) or {}
            lon_b = body_b.get("longitude")
            if not isinstance(lon_b, (int, float)):
                continue
            hit = _detect_aspect(float(lon_a), float(lon_b))
            if not hit:
                continue
            aspect, orb = hit
            if aspect == "quincunx":
                continue
            row = {
                "my_planet": p_a,
                "their_planet": p_b,
                "aspect": aspect,
                "orb": round(float(orb), 2),
            }
            if aspect in _SYNASTRY_HARMONY:
                harmony.append(row)
            elif aspect in _SYNASTRY_TENSION:
                tension.append(row)

    score = float(profile.base_score)
    for h in harmony:
        w = float(profile.weighted_harmony_aspects.get(h["aspect"], 5.0))
        score += w * _orb_strength(h["orb"])
    for t in tension:
        w = float(profile.weighted_tension_aspects.get(t["aspect"], 6.0))
        score -= w * _orb_strength(t["orb"])
    final = int(max(0, min(100, round(score))))
    return final, harmony, tension


def _ideal_partner_traits(
    *,
    venus_sign: str,
    moon_sign: str,
    jupiter_sign: str,
    seventh_sign: str,
    goal: str,
    lang: str,
) -> list[str]:
    v = _sign_label(venus_sign, lang)
    m = _sign_label(moon_sign, lang)
    j = _sign_label(jupiter_sign, lang)
    s7 = _sign_label(seventh_sign, lang)
    return {
        "en": [
            f"Affection style tends toward Venus in {v} tone",
            f"Emotional climate often resonates with Moon in {m}",
            f"7th-house overlay leans {s7} (partnership atmosphere tendency)",
            f"Growth/support flavour often tracks Jupiter in {j} ({goal})",
        ],
        "fa": [
            f"سبک محبت معمولاً با تن زهره در {v} هم‌خوان است",
            f"فضای عاطفی اغلب با ماه در {m} می‌خواند",
            f"پوشش خانه ۷ به سمت {s7} تمایل دارد (جو شراکت)",
            f"طعم رشد/حمایت اغلب با مشتری در {j} هم‌راستا است ({goal})",
        ],
        "ru": [
            f"Стиль привязанности чаще в тоне Венеры в {v}",
            f"Эмоциональный климат часто резонирует с Луной в {m}",
            f"7-й дом склоняется к {s7} (атмосфера партнёрства)",
            f"Рост/поддержка часто в ключе Юпитера в {j} ({goal})",
        ],
        "ar": [
            f"أسلوب المودة يميل لنبرة الزهرة في {v}",
            f"المناخ العاطفي غالباً يتناغم مع القمر في {m}",
            f"غلاف البيت 7 يميل إلى {s7} (جو الشراكة)",
            f"نكهة النمو/الدعم غالباً تتبع المشتري في {j} ({goal})",
        ],
    }.get(lang, [])


def _partner_dynamics(
    *,
    venus_sign: str,
    moon_sign: str,
    jupiter_sign: str,
    saturn_house: int | None,
    lang: str,
) -> dict[str, str]:
    j = _sign_label(jupiter_sign, lang)
    m = _sign_label(moon_sign, lang)
    v = _sign_label(venus_sign, lang)
    sat = (
        {
            "en": f"Saturn in house {saturn_house} can slow commitments — pace matters",
            "fa": f"زحل در خانه {saturn_house} ممکن است تعهد را کند کند — ریتم مهم است",
            "ru": f"Сатурн в доме {saturn_house} может замедлять обязательства — важен темп",
            "ar": f"زحل في البيت {saturn_house} قد يبطئ الالتزام — الإيقاع مهم",
        }.get(lang, "")
        if saturn_house
        else {
            "en": "Practical pacing is chart-specific — confirm logistics early",
            "fa": "ریتم عملی به چارت بستگی دارد — لجستیک را زود روشن کن",
            "ru": "Практический темп зависит от карты — уточняйте логистику рано",
            "ar": "الإيقاع العملي يعتمد على الخريطة — وضّحي اللوجستيات مبكراً",
        }.get(lang, "")
    )
    return {
        "financial": {
            "en": f"Money tone tendency often follows Jupiter in {j} — verify generosity vs control in practice",
            "fa": f"تن پول اغلب با مشتری در {j} می‌آید — سخاوت در برابر کنترل را در عمل چک کن",
            "ru": f"Денежный тон часто следует Юпитеру в {j} — проверяйте щедрость vs контроль на практике",
            "ar": f"نبرة المال غالباً تتبع المشتري في {j} — تحققي من الكرم مقابل السيطرة عملياً",
        }.get(lang, ""),
        "emotional": {
            "en": f"Care language tends to echo Moon in {m} and Venus in {v}",
            "fa": f"زبان مراقبت معمولاً بازتاب ماه در {m} و زهره در {v} است",
            "ru": f"Язык заботы часто отражает Луну в {m} и Венеру в {v}",
            "ar": f"لغة الرعاية غالباً تعكس القمر في {m} والزهرة في {v}",
        }.get(lang, ""),
        "practical": sat,
    }


def _verify_questions(goal: str, lang: str) -> list[str]:
    bank = {
        "en": {
            "romantic": [
                "How do they show care when stressed?",
                "What pace of closeness feels safe to them?",
                "How do they repair after conflict?",
            ],
            "marriage": [
                "How do they define commitment in daily life?",
                "What family or privacy boundaries matter most?",
                "How are money decisions shared?",
            ],
            "business": [
                "How are roles and decision rights written down?",
                "What happens when goals diverge?",
                "How do they handle accountability under pressure?",
            ],
            "financial_support": [
                "What does support look like without control?",
                "How transparent are money expectations?",
                "What milestones unlock next steps?",
            ],
            "long_term_stability": [
                "What routines keep them steady?",
                "How do they handle change and risk?",
                "What does reliability look like week to week?",
            ],
        },
        "fa": {
            "romantic": [
                "در استرس چطور مراقبت نشان می‌دهند؟",
                "چه سرعت نزدیکی برایشان امن است؟",
                "بعد از تنش چطور ترمیم می‌کنند؟",
            ],
            "marriage": [
                "تعهد را در زندگی روزمره چطور تعریف می‌کنند؟",
                "کدام مرز خانواده/حریم مهم است؟",
                "تصمیم‌های پول چطور مشترک می‌شود؟",
            ],
            "business": [
                "نقش‌ها و حق تصمیم کجا مکتوب است؟",
                "اگر اهداف جدا شد چه می‌کنند؟",
                "زیر فشار مسئولیت را چطور مدیریت می‌کنند؟",
            ],
            "financial_support": [
                "حمایت بدون کنترل چه شکلی دارد؟",
                "انتظارات مالی چقدر شفاف است؟",
                "کدام نقطه عطف قدم بعد را باز می‌کند؟",
            ],
            "long_term_stability": [
                "کدام روتین آن‌ها را پایدار نگه می‌دارد؟",
                "با تغییر و ریسک چطور روبه‌رو می‌شوند؟",
                "قابل‌اتکا بودن هفته‌به‌هفته چه شکلی است؟",
            ],
        },
        "ru": {
            "romantic": [
                "Как они проявляют заботу в стрессе?",
                "Какой темп близости для них безопасен?",
                "Как они чинят связь после конфликта?",
            ],
            "marriage": [
                "Как они определяют обязательства в быту?",
                "Какие границы семьи/приватности важны?",
                "Как делятся денежные решения?",
            ],
            "business": [
                "Где зафиксированы роли и право решения?",
                "Что происходит при расхождении целей?",
                "Как они держат ответственность под давлением?",
            ],
            "financial_support": [
                "Как выглядит поддержка без контроля?",
                "Насколько прозрачны денежные ожидания?",
                "Какие вехи открывают следующий шаг?",
            ],
            "long_term_stability": [
                "Какие ритуалы держат их устойчивыми?",
                "Как они относятся к переменам и риску?",
                "Как выглядит надёжность неделю за неделей?",
            ],
        },
        "ar": {
            "romantic": [
                "كيف يظهرون الرعاية تحت الضغط؟",
                "أي إيقاع قرب يشعرهم بالأمان؟",
                "كيف يصلحون بعد الخلاف؟",
            ],
            "marriage": [
                "كيف يعرّفون الالتزام يومياً؟",
                "أي حدود عائلة/خصوصية أهم؟",
                "كيف تُتّخذ قرارات المال معاً؟",
            ],
            "business": [
                "أين تُوثَّق الأدوار وحقوق القرار؟",
                "ماذا يحدث عند تباعد الأهداف؟",
                "كيف يديرون المسؤولية تحت الضغط؟",
            ],
            "financial_support": [
                "كيف يبدو الدعم بلا سيطرة؟",
                "ما مدى شفافية توقعات المال؟",
                "أي معالم تفتح الخطوة التالية؟",
            ],
            "long_term_stability": [
                "أي عادات تبقيهم ثابتين؟",
                "كيف يتعاملون مع التغيير والمخاطر؟",
                "كيف تبدو الموثوقية أسبوعاً بعد أسبوع؟",
            ],
        },
    }
    return list(bank.get(lang, bank["en"]).get(goal, bank["en"]["romantic"]))


def partner_profile_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    goal: str = "romantic",
    partner_birth_date: str | None = None,
    partner_birth_time: str | None = None,
    partner_location: str | None = None,
    partner_latitude: float | None = None,
    partner_longitude: float | None = None,
    partner_relationship: str | None = None,
) -> dict:
    """
    Provider — Partner Profile.

    Natal ideal-partner sketch always. Optional synastry when second-person
    birth data is complete (relationship_profile + cross-chart aspects).
    """
    goal_key = goal if goal in _VALID_PARTNERSHIP_GOALS else "romantic"
    profile_key = _PARTNERSHIP_GOAL_TO_PROFILE[goal_key]
    if partner_relationship:
        try:
            profile_key = resolve_relationship_profile(partner_relationship).key
        except ValueError:
            profile_key = _PARTNERSHIP_GOAL_TO_PROFILE[goal_key]
    profile = resolve_relationship_profile(profile_key)

    today = date.today().isoformat()
    natal, _transit = build_chart_payload(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=today,
        target_time=birth_time,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
    )
    planets = natal.get("planets") or {}
    venus = planets.get("venus") or {}
    moon = planets.get("moon") or {}
    jupiter = planets.get("jupiter") or {}
    saturn = planets.get("saturn") or {}
    venus_lon = venus.get("longitude")
    moon_lon = moon.get("longitude")
    jupiter_lon = jupiter.get("longitude")
    if not isinstance(venus_lon, (int, float)):
        raise ValueError("natal chart missing Venus longitude")
    if not isinstance(moon_lon, (int, float)):
        raise ValueError("natal chart missing Moon longitude")
    if not isinstance(jupiter_lon, (int, float)):
        raise ValueError("natal chart missing Jupiter longitude")

    venus_sign = sign_of(float(venus_lon))
    moon_sign = sign_of(float(moon_lon))
    jupiter_sign = sign_of(float(jupiter_lon))
    houses = natal.get("houses") or []
    if len(houses) >= 7 and isinstance(houses[6], (int, float)):
        seventh_sign = sign_of(float(houses[6]))
    else:
        asc = natal.get("ascendant")
        if not isinstance(asc, (int, float)):
            raise ValueError("natal chart missing houses/ascendant for 7th house")
        seventh_sign = sign_of((float(asc) + 180.0) % 360.0)
    saturn_house = int(saturn["house"]) if isinstance(saturn.get("house"), int) else None

    traits = _ideal_partner_traits(
        venus_sign=venus_sign,
        moon_sign=moon_sign,
        jupiter_sign=jupiter_sign,
        seventh_sign=seventh_sign,
        goal=goal_key,
        lang=lang,
    )
    dynamics = _partner_dynamics(
        venus_sign=venus_sign,
        moon_sign=moon_sign,
        jupiter_sign=jupiter_sign,
        saturn_house=saturn_house,
        lang=lang,
    )
    questions = _verify_questions(goal_key, lang)

    missing: list[str] = []
    partner_fields = (partner_birth_date, partner_birth_time, partner_location)
    partner_complete = all(bool(x and str(x).strip()) for x in partner_fields)

    patterns: list[str] = []
    friction: list[str] = []
    synastry_score: int | None = None
    mode = "ideal_only"
    confidence = "medium"

    if not partner_complete:
        for name, val in (
            ("partner_birth_date", partner_birth_date),
            ("partner_birth_time", partner_birth_time),
            ("partner_location", partner_location),
        ):
            if not (val and str(val).strip()):
                missing.append(name)
        patterns = [
            {
                "en": f"Profile priorities for {profile.label}: {', '.join(profile.scoring_priorities[:3])}",
                "fa": f"اولویت‌های پروفایل {profile.label}: {', '.join(profile.scoring_priorities[:3])}",
                "ru": f"Приоритеты профиля {profile.label}: {', '.join(profile.scoring_priorities[:3])}",
                "ar": f"أولويات ملف {profile.label}: {', '.join(profile.scoring_priorities[:3])}",
            }.get(lang, ""),
            {
                "en": "No second chart — patterns are ideal-partner tendencies only",
                "fa": "چارت دوم نیست — الگوها فقط تمایل شریک ایده‌آل‌اند",
                "ru": "Нет второй карты — только тенденции идеального партнёра",
                "ar": "لا خريطة ثانية — الأنماط ميول الشريك المثالي فقط",
            }.get(lang, ""),
        ]
        friction = [
            {
                "en": "Unverified until lived behaviour matches the sketch",
                "fa": "تا رفتار واقعی با طرح هم‌خوان نشود تأیید نشده",
                "ru": "Не подтверждено, пока поведение не совпадёт с эскизом",
                "ar": "غير مؤكد حتى يطابق السلوك المعاش الملامح",
            }.get(lang, ""),
        ]
    else:
        mode = "synastry"
        partner_natal, _ = build_chart_payload(
            birth_date=partner_birth_date,  # type: ignore[arg-type]
            birth_time=partner_birth_time,  # type: ignore[arg-type]
            location=partner_location,  # type: ignore[arg-type]
            target_date=today,
            target_time=partner_birth_time,
            house_system=house_system,
            zodiac=zodiac,
            latitude=partner_latitude,
            longitude=partner_longitude,
        )
        their_planets = partner_natal.get("planets") or {}
        synastry_score, harmony, tension = _compute_vault_synastry(
            planets, their_planets, profile
        )
        confidence = (
            "high" if synastry_score >= 70 else "medium" if synastry_score >= 40 else "low"
        )
        for h in sorted(harmony, key=lambda r: r["orb"])[:3]:
            patterns.append(
                {
                    "en": (
                        f"Supportive pattern: your {h['my_planet']} "
                        f"{h['aspect']} their {h['their_planet']} (orb {h['orb']}°)"
                    ),
                    "fa": (
                        f"الگوی حمایتی: {h['my_planet']} تو "
                        f"{h['aspect']} با {h['their_planet']} آن‌ها (اورب {h['orb']}°)"
                    ),
                    "ru": (
                        f"Поддерживающий паттерн: ваш {h['my_planet']} "
                        f"{h['aspect']} их {h['their_planet']} (орб {h['orb']}°)"
                    ),
                    "ar": (
                        f"نمط داعم: {h['my_planet']} لديك "
                        f"{h['aspect']} مع {h['their_planet']} لديهم (قوس {h['orb']}°)"
                    ),
                }.get(lang, "")
            )
        if not patterns:
            patterns.append(
                {
                    "en": "No major harmony aspects in orb — keep expectations moderate",
                    "fa": "جنبه هماهنگی عمده در اورب نیست — انتظار را متعادل نگه دار",
                    "ru": "Нет крупных гармоничных аспектов в орбе — держите ожидания умеренными",
                    "ar": "لا جوانب انسجام كبرى ضمن القوس — أبقي التوقعات معتدلة",
                }.get(lang, "")
            )
        for t in sorted(tension, key=lambda r: r["orb"])[:3]:
            friction.append(
                {
                    "en": (
                        f"Friction signal: your {t['my_planet']} "
                        f"{t['aspect']} their {t['their_planet']} (orb {t['orb']}°) — "
                        f"pace and clarify, do not moralize"
                    ),
                    "fa": (
                        f"سیگنال اصطکاک: {t['my_planet']} تو "
                        f"{t['aspect']} با {t['their_planet']} آن‌ها (اورب {t['orb']}°) — "
                        f"آهسته و روشن کن، قضاوت اخلاقی نکن"
                    ),
                    "ru": (
                        f"Сигнал трения: ваш {t['my_planet']} "
                        f"{t['aspect']} их {t['their_planet']} (орб {t['orb']}°) — "
                        f"замедляйтесь и проясняйте, без морали"
                    ),
                    "ar": (
                        f"إشارة احتكاك: {t['my_planet']} لديك "
                        f"{t['aspect']} مع {t['their_planet']} لديهم (قوس {t['orb']}°) — "
                        f"أبطئي ووضّحي دون أحكام أخلاقية"
                    ),
                }.get(lang, "")
            )
        if not friction:
            friction.append(
                {
                    "en": "No major tension aspects flagged — still verify values in conversation",
                    "fa": "تنش عمده پرچم نشده — باز هم ارزش‌ها را در گفتگو چک کن",
                    "ru": "Крупных напряжённых аспектов нет — всё равно проверьте ценности в разговоре",
                    "ar": "لا جوانب توتر كبرى — تحققي القيم في الحوار",
                }.get(lang, "")
            )

    text = render_partner_profile_reading(
        mode=mode,
        goal=goal_key,
        lang=lang,
        ideal_traits=traits,
        compatibility_patterns=patterns,
        friction_points=friction,
        dynamics=dynamics,
        verify_questions=questions,
        missing_inputs=missing,
        confidence=confidence,
        synastry_score=synastry_score,
    )
    return {
        "planet": "partner",
        "lang": lang,
        "goal": goal_key,
        "profile_key": profile.key,
        "mode": mode,
        "missing_inputs": missing,
        "synastry_score": synastry_score,
        "ideal_traits": traits,
        "compatibility_patterns": patterns,
        "friction_points": friction,
        "dynamics": dynamics,
        "verify_questions": questions,
        "verdict": {
            "goal": goal_key,
            "profile_key": profile.key,
            "mode": mode,
            "confidence": confidence,
            "synastry_score": synastry_score,
            "missing_inputs": missing,
            "venus_sign": venus_sign,
            "moon_sign": moon_sign,
            "jupiter_sign": jupiter_sign,
            "seventh_sign": seventh_sign,
        },
        "reading": text,
    }


def _dimension_band(score: int | None, hits: int) -> str:
    if hits <= 0 or score is None:
        return "unknown"
    if score >= 62:
        return "harmony"
    if score <= 42:
        return "tension"
    return "mixed"


def _score_compat_dimension(
    harmony: list[dict],
    tension: list[dict],
    planet_set: frozenset[str],
    profile,
) -> dict:
    """Score one compatibility dimension from synastry aspects + profile weights."""
    lift = 0.0
    press = 0.0
    hits = 0
    for h in harmony:
        if h["my_planet"] not in planet_set and h["their_planet"] not in planet_set:
            continue
        pw = (
            float(profile.weighted_planets.get(h["my_planet"], 5.0))
            + float(profile.weighted_planets.get(h["their_planet"], 5.0))
        ) / 20.0
        aw = float(profile.weighted_harmony_aspects.get(h["aspect"], 5.0))
        lift += aw * _orb_strength(h["orb"]) * max(0.4, pw)
        hits += 1
    for t in tension:
        if t["my_planet"] not in planet_set and t["their_planet"] not in planet_set:
            continue
        pw = (
            float(profile.weighted_planets.get(t["my_planet"], 5.0))
            + float(profile.weighted_planets.get(t["their_planet"], 5.0))
        ) / 20.0
        aw = float(profile.weighted_tension_aspects.get(t["aspect"], 6.0))
        press += aw * _orb_strength(t["orb"]) * max(0.4, pw)
        hits += 1
    if hits <= 0:
        return {"score": None, "band": "unknown", "hits": 0}
    raw = int(max(0, min(100, round(50.0 + lift - press))))
    return {"score": raw, "band": _dimension_band(raw, hits), "hits": hits}


def _compat_verify_questions(relationship_type: str, lang: str) -> list[str]:
    bank = {
        "en": {
            "romantic": [
                "How do you both repair after a sharp moment?",
                "What pace of closeness feels mutual?",
                "Where does play meet respect?",
            ],
            "marriage": [
                "How are daily duties and care shared?",
                "What does commitment look like in practice?",
                "How are hard money talks handled?",
            ],
            "business": [
                "Are roles and decision rights written down?",
                "What happens when priorities diverge?",
                "How is accountability tracked?",
            ],
            "friendship": [
                "How do you show up when one of you is low?",
                "What boundaries keep the friendship light?",
                "How do you handle uneven effort?",
            ],
        },
        "fa": {
            "romantic": [
                "بعد از لحظه تند چطور ترمیم می‌کنید؟",
                "چه سرعت نزدیکی برای هر دو امن است؟",
                "بازی و احترام کجا به هم می‌رسند؟",
            ],
            "marriage": [
                "وظایف روزمره و مراقبت چطور تقسیم می‌شود؟",
                "تعهد در عمل چه شکلی دارد؟",
                "حرف سخت پول را چطور پیش می‌برید؟",
            ],
            "business": [
                "نقش‌ها و حق تصمیم مکتوب است؟",
                "اگر اولویت‌ها جدا شد چه می‌کنید؟",
                "پاسخگویی چطور پیگیری می‌شود؟",
            ],
            "friendship": [
                "وقتی یکی پایین است چطور حاضرید؟",
                "کدام مرز دوستی را سبک نگه می‌دارد؟",
                "تلاش نابرابر را چطور مدیریت می‌کنید؟",
            ],
        },
        "ru": {
            "romantic": [
                "Как вы чините связь после острого момента?",
                "Какой темп близости взаимно безопасен?",
                "Где игра встречает уважение?",
            ],
            "marriage": [
                "Как делятся быт и забота?",
                "Как выглядит обязательство на практике?",
                "Как проходят трудные разговоры о деньгах?",
            ],
            "business": [
                "Зафиксированы ли роли и право решения?",
                "Что происходит при расхождении приоритетов?",
                "Как отслеживается ответственность?",
            ],
            "friendship": [
                "Как вы появляетесь, когда кому-то тяжело?",
                "Какие границы держат дружбу лёгкой?",
                "Как вы справляетесь с неравным вкладом?",
            ],
        },
        "ar": {
            "romantic": [
                "كيف تصلحان بعد لحظة حادة؟",
                "أي إيقاع قرب يشعركما بالأمان معاً؟",
                "أين يلتقي اللعب بالاحترام؟",
            ],
            "marriage": [
                "كيف تُقسم المهام اليومية والرعاية؟",
                "كيف يبدو الالتزام عملياً؟",
                "كيف تداران أحاديث المال الصعبة؟",
            ],
            "business": [
                "هل الأدوار وحقوق القرار موثّقة؟",
                "ماذا يحدث عند تباعد الأولويات؟",
                "كيف تُتتبَّع المساءلة؟",
            ],
            "friendship": [
                "كيف تظهران حين يكون أحدكما منهكاً؟",
                "أي حدود تبقي الصداقة خفيفة؟",
                "كيف تتعاملان مع جهد غير متساوٍ؟",
            ],
        },
    }
    return list(
        bank.get(lang, bank["en"]).get(relationship_type, bank["en"]["romantic"])
    )


def compatibility_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    relationship_type: str = "romantic",
    partner_birth_date: str | None = None,
    partner_birth_time: str | None = None,
    partner_location: str | None = None,
    partner_latitude: float | None = None,
    partner_longitude: float | None = None,
    concern: str | None = None,
    user_birth_time_known: bool = True,
    partner_birth_time_known: bool = True,
) -> dict:
    """
    Provider — Compatibility.

    Requires second-person birth data. Uses Partner Profile synastry utilities
    (_compute_vault_synastry + relationship_profile weights) for dimensions.
    """
    rel = relationship_type if relationship_type in _VALID_COMPAT_RELS else "romantic"
    profile = resolve_relationship_profile(_COMPAT_REL_TO_PROFILE[rel])
    missing: list[str] = []

    if not (partner_birth_date and str(partner_birth_date).strip()):
        missing.append("partner_birth_date")
    if not (partner_location and str(partner_location).strip()):
        missing.append("partner_location")
    # Time may be unknown — still allow scoring with noon, but flag confidence.
    partner_time = (partner_birth_time or "").strip()
    if not partner_time:
        missing.append("partner_birth_time")
        partner_time = "12:00"
        partner_birth_time_known = False

    user_time = (birth_time or "").strip() or "12:00"
    if not user_birth_time_known:
        user_time = "12:00"

    if "partner_birth_date" in missing or "partner_location" in missing:
        # Without identity of second person, do not invent scores.
        text = render_compatibility_reading(
            lang=lang,
            relationship_type=rel,
            missing_inputs=missing,
            confidence="low",
            concern=concern,
        )
        return {
            "planet": "compatibility",
            "lang": lang,
            "relationship_type": rel,
            "profile_key": profile.key,
            "missing_inputs": missing,
            "dimensions": {},
            "overall_score": None,
            "verdict": {
                "relationship_type": rel,
                "profile_key": profile.key,
                "confidence": "low",
                "missing_inputs": missing,
            },
            "reading": text,
        }

    today = date.today().isoformat()
    natal, _ = build_chart_payload(
        birth_date=birth_date,
        birth_time=user_time,
        location=location,
        target_date=today,
        target_time=user_time,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
    )
    partner_natal, _ = build_chart_payload(
        birth_date=partner_birth_date,  # type: ignore[arg-type]
        birth_time=partner_time,
        location=partner_location,  # type: ignore[arg-type]
        target_date=today,
        target_time=partner_time,
        house_system=house_system,
        zodiac=zodiac,
        latitude=partner_latitude,
        longitude=partner_longitude,
    )
    mine = natal.get("planets") or {}
    theirs = partner_natal.get("planets") or {}
    overall_raw, harmony, tension = _compute_vault_synastry(mine, theirs, profile)

    dimensions: dict[str, dict] = {}
    dim_scores: list[int] = []
    for key, planets in _COMPAT_DIM_PLANETS.items():
        dimensions[key] = _score_compat_dimension(harmony, tension, planets, profile)
        sc = dimensions[key].get("score")
        if isinstance(sc, int):
            dim_scores.append(sc)

    # Overall blends full synastry with known dimensions — not Sun–Saturn alone.
    if dim_scores:
        overall = int(round(0.45 * overall_raw + 0.55 * (sum(dim_scores) / len(dim_scores))))
    else:
        overall = overall_raw
    dimensions["overall"] = {
        "score": overall,
        "band": _dimension_band(overall, len(harmony) + len(tension)),
        "hits": len(harmony) + len(tension),
    }

    strengths: list[str] = []
    for h in sorted(harmony, key=lambda r: r["orb"])[:3]:
        strengths.append(
            {
                "en": (
                    f"your {h['my_planet']} {h['aspect']} their {h['their_planet']} "
                    f"(orb {h['orb']}°)"
                ),
                "fa": (
                    f"{h['my_planet']} تو {h['aspect']} با {h['their_planet']} آن‌ها "
                    f"(اورب {h['orb']}°)"
                ),
                "ru": (
                    f"ваш {h['my_planet']} {h['aspect']} их {h['their_planet']} "
                    f"(орб {h['orb']}°)"
                ),
                "ar": (
                    f"{h['my_planet']} لديك {h['aspect']} مع {h['their_planet']} لديهم "
                    f"(قوس {h['orb']}°)"
                ),
            }.get(lang, "")
        )
    if not strengths:
        strengths.append(
            {
                "en": "No major harmony aspects in orb — keep expectations moderate",
                "fa": "جنبه هماهنگی عمده در اورب نیست — انتظار متعادل",
                "ru": "Нет крупных гармоничных аспектов в орбе — умеренные ожидания",
                "ar": "لا جوانب انسجام كبرى ضمن القوس — توقعات معتدلة",
            }.get(lang, "")
        )

    friction: list[str] = []
    for t in sorted(tension, key=lambda r: r["orb"])[:3]:
        friction.append(
            {
                "en": (
                    f"your {t['my_planet']} {t['aspect']} their {t['their_planet']} "
                    f"(orb {t['orb']}°) — clarify, do not moralize"
                ),
                "fa": (
                    f"{t['my_planet']} تو {t['aspect']} با {t['their_planet']} آن‌ها "
                    f"(اورب {t['orb']}°) — روشن کن، قضاوت نکن"
                ),
                "ru": (
                    f"ваш {t['my_planet']} {t['aspect']} их {t['their_planet']} "
                    f"(орб {t['orb']}°) — проясняйте, без морали"
                ),
                "ar": (
                    f"{t['my_planet']} لديك {t['aspect']} مع {t['their_planet']} لديهم "
                    f"(قوس {t['orb']}°) — وضّحي دون أحكام"
                ),
            }.get(lang, "")
        )
    if not friction:
        friction.append(
            {
                "en": "No major tension aspects flagged — still verify values in conversation",
                "fa": "تنش عمده پرچم نشده — باز هم ارزش‌ها را در گفتگو چک کن",
                "ru": "Крупных напряжённых аспектов нет — всё равно проверьте ценности",
                "ar": "لا جوانب توتر كبرى — تحققي القيم في الحوار",
            }.get(lang, "")
        )

    confidence = "high" if overall >= 70 else "medium" if overall >= 45 else "low"
    time_note = None
    if not user_birth_time_known or not partner_birth_time_known:
        confidence = "low"
        if "partner_birth_time" not in missing:
            missing.append("exact_birth_time")
        time_note = {
            "en": "Exact birth time missing — house claims avoided; confidence reduced.",
            "fa": "ساعت دقیق تولد ناقص است — ادعای خانه‌ای نیست؛ اطمینان کمتر.",
            "ru": "Точное время рождения отсутствует — без домов; уверенность снижена.",
            "ar": "وقت الولادة الدقيق ناقص — بلا ادعاء بيوت؛ ثقة أقل.",
        }.get(lang)

    questions = _compat_verify_questions(rel, lang)
    text = render_compatibility_reading(
        lang=lang,
        relationship_type=rel,
        dimensions=dimensions,
        strengths=strengths,
        friction_points=friction,
        verify_questions=questions,
        missing_inputs=missing,
        confidence=confidence,
        overall_score=overall,
        concern=concern,
        time_precision_note=time_note,
    )
    return {
        "planet": "compatibility",
        "lang": lang,
        "relationship_type": rel,
        "profile_key": profile.key,
        "missing_inputs": missing,
        "overall_score": overall,
        "dimensions": dimensions,
        "strengths": strengths,
        "friction_points": friction,
        "verify_questions": questions,
        "harmony_count": len(harmony),
        "tension_count": len(tension),
        "verdict": {
            "relationship_type": rel,
            "profile_key": profile.key,
            "overall_score": overall,
            "confidence": confidence,
            "missing_inputs": missing,
            "user_birth_time_known": user_birth_time_known,
            "partner_birth_time_known": partner_birth_time_known,
            "signals": list(_SYNASTRY_PLANETS),
        },
        "reading": text,
    }


def _radar_band_from_compat(dim: dict) -> str:
    """Map compatibility band to radar pressure band (signals, not guilt)."""
    band = str(dim.get("band") or "unknown")
    if band == "unknown" or dim.get("score") is None:
        return "unknown"
    if band == "tension":
        return "elevated"
    if band == "harmony":
        return "calm"
    return "moderate"


def _radar_verify_behaviors(lang: str) -> list[str]:
    return {
        "en": [
            "Consistency between words and follow-through over 2–3 weeks",
            "Willingness to answer simple logistics without defensiveness",
            "Warmth returning after distance — or staying flat",
        ],
        "fa": [
            "هم‌خوانی حرف و عمل در ۲–۳ هفته",
            "پاسخ به جزئیات ساده بدون دفاعی شدن",
            "بازگشت گرما بعد از فاصله — یا ماندن سرد",
        ],
        "ru": [
            "Совпадение слов и дел за 2–3 недели",
            "Готовность отвечать на простую логистику без защиты",
            "Возвращается ли тепло после дистанции",
        ],
        "ar": [
            "اتساق الكلام والفعل خلال ٢–٣ أسابيع",
            "الاستعداد للإجابة على تفاصيل بسيطة بلا دفاعية",
            "عودة الدفء بعد البعد — أو البقاء بارداً",
        ],
    }.get(lang, [])


def _radar_questions(relationship_type: str, lang: str) -> list[str]:
    bank = {
        "en": {
            "romantic": [
                "What would help you feel safer telling me hard things?",
                "When you need space, how should I read it?",
                "What feels unclear between us right now?",
            ],
            "marriage": [
                "Which routines make trust easier for you?",
                "What topics feel hardest to name?",
                "How do we repair after a cold week?",
            ],
            "business": [
                "Where should decisions be written down?",
                "What information should always be shared?",
                "How do we flag risk without blame?",
            ],
            "friendship": [
                "What does check-in look like when one of us is distant?",
                "What feels off that we haven't named?",
                "How do we keep the friendship light and honest?",
            ],
        },
        "fa": {
            "romantic": [
                "چه چیزی گفتن حرف سخت را برایت امن‌تر می‌کند؟",
                "وقتی فضا می‌خواهی، چطور بخوانمش؟",
                "الان چه چیزی بین ما مبهم است؟",
            ],
            "marriage": [
                "کدام روتین اعتماد را برایت آسان‌تر می‌کند؟",
                "کدام موضوع نامیدنش سخت است؟",
                "بعد از هفته سرد چطور ترمیم کنیم؟",
            ],
            "business": [
                "تصمیم‌ها کجا باید مکتوب شود؟",
                "چه اطلاعاتی همیشه باید مشترک باشد؟",
                "ریسک را بدون سرزنش چطور علامت بزنیم؟",
            ],
            "friendship": [
                "وقتی یکی دور است چک‌این چه شکلی است؟",
                "چه چیزی نامانده که حسش می‌کنیم؟",
                "دوستی را چطور سبک و صادق نگه داریم؟",
            ],
        },
        "ru": {
            "romantic": [
                "Что поможет тебе безопаснее говорить трудное?",
                "Как мне читать твою потребность в пространстве?",
                "Что сейчас между нами неясно?",
            ],
            "marriage": [
                "Какие ритуалы облегчают тебе доверие?",
                "Какие темы труднее всего назвать?",
                "Как мы чиним связь после холодной недели?",
            ],
            "business": [
                "Где должны быть зафиксированы решения?",
                "Какой информацией всегда нужно делиться?",
                "Как отмечать риск без обвинений?",
            ],
            "friendship": [
                "Как выглядит check-in, когда кто-то отдаляется?",
                "Что ощущается странным, но не названо?",
                "Как сохранить дружбу лёгкой и честной?",
            ],
        },
        "ar": {
            "romantic": [
                "ما الذي يساعدك على قول الصعب بأمان أكثر؟",
                "حين تحتاجين مساحة، كيف أقرأ ذلك؟",
                "ما الذي يبدو غير واضح بيننا الآن؟",
            ],
            "marriage": [
                "أي عادات تسهّل عليك الثقة؟",
                "أي مواضيع أصعب أن نسمّيها؟",
                "كيف نصلح بعد أسبوع بارد؟",
            ],
            "business": [
                "أين يجب توثيق القرارات؟",
                "ما المعلومات التي يجب مشاركتها دائماً؟",
                "كيف نُشير إلى المخاطر بلا لوم؟",
            ],
            "friendship": [
                "كيف يبدو التواصل حين يبتعد أحدنا؟",
                "ما الذي نشعر به ولم نسمّه؟",
                "كيف نبقي الصداقة خفيفة وصادقة؟",
            ],
        },
    }
    return list(
        bank.get(lang, bank["en"]).get(relationship_type, bank["en"]["romantic"])
    )


def cheating_radar_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    relationship_type: str = "romantic",
    partner_birth_date: str | None = None,
    partner_birth_time: str | None = None,
    partner_location: str | None = None,
    partner_latitude: float | None = None,
    partner_longitude: float | None = None,
    concern: str | None = None,
    user_birth_time_known: bool = True,
    partner_birth_time_known: bool = True,
) -> dict:
    """
    Shadow Room — Cheating Radar.

    Synastry tension/harmony signals only — never a cheating verdict.
    Without second-person data: self-pattern + verification guide.
    """
    rel = relationship_type if relationship_type in _VALID_COMPAT_RELS else "romantic"
    profile = resolve_relationship_profile(_COMPAT_REL_TO_PROFILE[rel])
    missing: list[str] = []
    observed: list[str] = []
    inferred: list[str] = []
    unknown: list[str] = []

    if concern and str(concern).strip():
        observed.append(
            {
                "en": f"user concern text provided ({len(concern.strip())} chars)",
                "fa": f"متن دغدغه کاربر ارائه شد ({len(concern.strip())} نویسه)",
                "ru": f"текст запроса пользователя ({len(concern.strip())} симв.)",
                "ar": f"نص قلق المستخدم مقدَّم ({len(concern.strip())} حرفاً)",
            }.get(lang, "")
        )

    has_partner = bool(
        partner_birth_date
        and str(partner_birth_date).strip()
        and partner_location
        and str(partner_location).strip()
    )
    if not has_partner:
        if not (partner_birth_date and str(partner_birth_date).strip()):
            missing.append("partner_birth_date")
        if not (partner_location and str(partner_location).strip()):
            missing.append("partner_location")
        if not (partner_birth_time and str(partner_birth_time).strip()):
            missing.append("partner_birth_time")

    user_time = (birth_time or "").strip() or "12:00"
    if not user_birth_time_known:
        user_time = "12:00"

    today = date.today().isoformat()
    natal, _ = build_chart_payload(
        birth_date=birth_date,
        birth_time=user_time,
        location=location,
        target_date=today,
        target_time=user_time,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
    )
    planets = natal.get("planets") or {}
    moon = planets.get("moon") or {}
    mercury = planets.get("mercury") or {}
    saturn = planets.get("saturn") or {}
    moon_sign = (
        sign_of(float(moon["longitude"]))
        if isinstance(moon.get("longitude"), (int, float))
        else None
    )
    mercury_sign = (
        sign_of(float(mercury["longitude"]))
        if isinstance(mercury.get("longitude"), (int, float))
        else None
    )
    saturn_sign = (
        sign_of(float(saturn["longitude"]))
        if isinstance(saturn.get("longitude"), (int, float))
        else None
    )

    signals: dict[str, dict] = {}
    mode = "self"
    confidence = "medium"

    if not has_partner:
        mode = "self"
        confidence = "low"
        observed.append(
            {
                "en": "user natal chart loaded; no second-person chart",
                "fa": "چارت تولد کاربر بار شد؛ چارت نفر دوم نیست",
                "ru": "натал пользователя загружен; второй карты нет",
                "ar": "خريطة المستخدم محمّلة؛ لا خريطة للشخص الثاني",
            }.get(lang, "")
        )
        if moon_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Moon in {_sign_label(moon_sign, lang)} — "
                        f"sensitivity to distance may run high (tendency, not a verdict)"
                    ),
                    "fa": (
                        f"الگوی خود: ماه در {_sign_label(moon_sign, lang)} — "
                        f"حساسیت به فاصله ممکن است بالا باشد (تمایل، نه حکم)"
                    ),
                    "ru": (
                        f"свой паттерн: Луна в {_sign_label(moon_sign, lang)} — "
                        f"чувствительность к дистанции может быть выше (тенденция)"
                    ),
                    "ar": (
                        f"نمط ذاتي: القمر في {_sign_label(moon_sign, lang)} — "
                        f"الحساسية للبعد قد تكون أعلى (ميل لا حكم)"
                    ),
                }.get(lang, "")
            )
        if mercury_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Mercury in {_sign_label(mercury_sign, lang)} — "
                        f"watch for reading ambiguity into silence"
                    ),
                    "fa": (
                        f"الگوی خود: عطارد در {_sign_label(mercury_sign, lang)} — "
                        f"مراقب خواندن ابهام در سکوت باش"
                    ),
                    "ru": (
                        f"свой паттерн: Меркурий в {_sign_label(mercury_sign, lang)} — "
                        f"осторожнее с домысливанием тишины"
                    ),
                    "ar": (
                        f"نمط ذاتي: عطارد في {_sign_label(mercury_sign, lang)} — "
                        f"راقبي قراءة الغموض في الصمت"
                    ),
                }.get(lang, "")
            )
        if saturn_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Saturn in {_sign_label(saturn_sign, lang)} — "
                        f"trust pressure may feel heavier under uncertainty"
                    ),
                    "fa": (
                        f"الگوی خود: زحل در {_sign_label(saturn_sign, lang)} — "
                        f"فشار اعتماد زیر ابهام ممکن است سنگین‌تر حس شود"
                    ),
                    "ru": (
                        f"свой паттерн: Сатурн в {_sign_label(saturn_sign, lang)} — "
                        f"давление на доверие сильнее при неопределённости"
                    ),
                    "ar": (
                        f"نمط ذاتي: زحل في {_sign_label(saturn_sign, lang)} — "
                        f"ضغط الثقة قد يثقل مع عدم اليقين"
                    ),
                }.get(lang, "")
            )
        unknown.extend(
            [
                {
                    "en": "partner synastry signals — unknown without second chart",
                    "fa": "سیگنال هم‌خوانی شریک — بدون چارت دوم نامشخص",
                    "ru": "синастрия партнёра — неизвестна без второй карты",
                    "ar": "إشارات توافق الشريك — غير معروفة بلا خريطة ثانية",
                }.get(lang, ""),
                {
                    "en": "whether any secrecy behaviour is occurring — unknown",
                    "fa": "اینکه رفتار پنهان‌کاری رخ می‌دهد یا نه — نامشخص",
                    "ru": "происходит ли скрытное поведение — неизвестно",
                    "ar": "ما إذا كان سلوك كتمان يحدث — غير معروف",
                }.get(lang, ""),
            ]
        )
        for key in _RADAR_DIM_PLANETS:
            signals[key] = {
                "band": "unknown",
                "layer": "unknown",
                "score": None,
                "hits": 0,
            }
    else:
        mode = "synastry"
        partner_time = (partner_birth_time or "").strip()
        if not partner_time:
            missing.append("partner_birth_time")
            partner_time = "12:00"
            partner_birth_time_known = False
        partner_natal, _ = build_chart_payload(
            birth_date=partner_birth_date,  # type: ignore[arg-type]
            birth_time=partner_time,
            location=partner_location,  # type: ignore[arg-type]
            target_date=today,
            target_time=partner_time,
            house_system=house_system,
            zodiac=zodiac,
            latitude=partner_latitude,
            longitude=partner_longitude,
        )
        observed.append(
            {
                "en": "second-person birth data provided for synastry",
                "fa": "داده تولد نفر دوم برای هم‌خوانی ارائه شد",
                "ru": "данные рождения второго человека для синастрии",
                "ar": "بيانات ولادة الشخص الثاني للتوافق مقدَّمة",
            }.get(lang, "")
        )
        _overall, harmony, tension = _compute_vault_synastry(
            planets, partner_natal.get("planets") or {}, profile
        )
        for key, pset in _RADAR_DIM_PLANETS.items():
            dim = _score_compat_dimension(harmony, tension, pset, profile)
            band = _radar_band_from_compat(dim)
            layer = "inferred" if dim.get("hits", 0) > 0 else "unknown"
            signals[key] = {
                "band": band,
                "layer": layer,
                "score": dim.get("score"),
                "hits": dim.get("hits", 0),
            }
            if layer == "inferred":
                inferred.append(
                    {
                        "en": (
                            f"{key.replace('_', ' ')} signal band={band} "
                            f"(synastry pattern — not a behaviour fact)"
                        ),
                        "fa": (
                            f"سیگنال {key}: باند={band} "
                            f"(الگوی هم‌خوانی — نه واقعیت رفتار)"
                        ),
                        "ru": (
                            f"сигнал {key}: полоса={band} "
                            f"(паттерн синастрии — не факт поведения)"
                        ),
                        "ar": (
                            f"إشارة {key}: النطاق={band} "
                            f"(نمط توافق — ليس حقيقة سلوك)"
                        ),
                    }.get(lang, "")
                )
            else:
                unknown.append(
                    {
                        "en": f"{key.replace('_', ' ')} — unknown (no aspects in orb)",
                        "fa": f"{key} — نامشخص (جنبه‌ای در اورب نیست)",
                        "ru": f"{key} — неизвестно (нет аспектов в орбе)",
                        "ar": f"{key} — غير معروف (لا جوانب ضمن القوس)",
                    }.get(lang, "")
                )
        unknown.append(
            {
                "en": "real-world secrecy or loyalty status — unknown from charts alone",
                "fa": "وضعیت واقعی پنهان‌کاری یا وفاداری — فقط از چارت نامشخص",
                "ru": "реальная скрытность или верность — по картам неизвестны",
                "ar": "الكتمان أو الولاء في الواقع — غير معروف من الخرائط وحدها",
            }.get(lang, "")
        )
        elev = sum(1 for s in signals.values() if s.get("band") == "elevated")
        confidence = "high" if elev == 0 and all(
            s.get("layer") == "inferred" for s in signals.values()
        ) else "medium"
        if elev >= 2:
            confidence = "medium"

    time_note = None
    if not user_birth_time_known or (
        has_partner and not partner_birth_time_known
    ):
        confidence = "low"
        if "exact_birth_time" not in missing:
            missing.append("exact_birth_time")
        time_note = {
            "en": "Exact birth time missing — house claims avoided; confidence reduced.",
            "fa": "ساعت دقیق تولد ناقص است — ادعای خانه‌ای نیست؛ اطمینان کمتر.",
            "ru": "Точное время рождения отсутствует — без домов; уверенность снижена.",
            "ar": "وقت الولادة الدقيق ناقص — بلا ادعاء بيوت؛ ثقة أقل.",
        }.get(lang)

    behaviors = _radar_verify_behaviors(lang)
    questions = _radar_questions(rel, lang)
    text = render_cheating_radar_reading(
        lang=lang,
        mode=mode,
        relationship_type=rel,
        signals=signals,
        observed=observed,
        inferred=inferred,
        unknown=unknown,
        behaviors=behaviors,
        questions=questions,
        missing_inputs=missing,
        confidence=confidence,
        concern=concern,
        time_precision_note=time_note,
        planet_roles={},
    )
    return {
        "planet": "radar",
        "lang": lang,
        "relationship_type": rel,
        "profile_key": profile.key,
        "mode": mode,
        "missing_inputs": missing,
        "signals": signals,
        "planet_roles": {},
        "observed": observed,
        "inferred": inferred,
        "unknown": unknown,
        "behaviors": behaviors,
        "questions": questions,
        "verdict": {
            "relationship_type": rel,
            "profile_key": profile.key,
            "mode": mode,
            "confidence": confidence,
            "missing_inputs": missing,
            "claim": "signals_only_never_verdict",
            "user_birth_time_known": user_birth_time_known,
            "partner_birth_time_known": partner_birth_time_known if has_partner else False,
            "signals": list(_RADAR_DIM_PLANETS.keys()),
            "planet_roles": {},
        },
        "reading": text,
    }


def _trust_verify_behaviors(lang: str) -> list[str]:
    return {
        "en": [
            "Agreements kept or renegotiated within the promised window",
            "Repair attempt after friction — specific, not vague",
            "Boundaries named calmly and respected without scorekeeping",
        ],
        "fa": [
            "توافق‌ها در بازه وعده‌داده‌شده رعایت یا بازتعریف می‌شوند",
            "تلاش ترمیم بعد از اصطکاک — مشخص، نه مبهم",
            "مرزها آرام نامیده و بدون حساب‌کشی رعایت می‌شوند",
        ],
        "ru": [
            "Договорённости соблюдаются или пересматриваются в срок",
            "Попытка ремонта после трения — конкретная, не общая",
            "Границы называются спокойно и соблюдаются без подсчёта очков",
        ],
        "ar": [
            "الالتزامات تُحفظ أو تُعاد صياغتها ضمن المهلة",
            "محاولة إصلاح بعد الاحتكاك — محددة لا غامضة",
            "الحدود تُسمّى بهدوء وتُحترم بلا تسجيل نقاط",
        ],
    }.get(lang, [])


def _trust_questions(relationship_type: str, lang: str) -> list[str]:
    bank = {
        "en": {
            "romantic": [
                "What helps you feel emotionally consistent with me?",
                "How should we repair after a cold stretch?",
                "Which boundary needs clearer wording?",
            ],
            "marriage": [
                "Which weekly ritual builds trust for both of us?",
                "How do we track follow-through without blame?",
                "What repair gesture lands best after pressure?",
            ],
            "business": [
                "Where should commitments be written?",
                "How do we escalate risk early and cleanly?",
                "What does reliable communication look like this month?",
            ],
            "friendship": [
                "How do we check in when one of us is distant?",
                "What goodwill gesture resets ease between us?",
                "Which expectation needs a lighter boundary?",
            ],
        },
        "fa": {
            "romantic": [
                "چه چیزی حس ثبات عاطفی با من را برایت آسان می‌کند؟",
                "بعد از دوره سرد چطور ترمیم کنیم؟",
                "کدام مرز نیاز به عبارت واضح‌تر دارد؟",
            ],
            "marriage": [
                "کدام آیین هفتگی برای هر دو اعتماد می‌سازد؟",
                "پیگیری تعهد را بدون سرزنش چطور انجام دهیم؟",
                "بعد از فشار کدام ژست ترمیم بهتر می‌نشیند؟",
            ],
            "business": [
                "تعهدها کجا باید مکتوب شود؟",
                "ریسک را زود و تمیز چطور بالا ببریم؟",
                "ارتباط قابل اتکا این ماه چه شکلی است؟",
            ],
            "friendship": [
                "وقتی یکی دور است چطور چک‌این کنیم؟",
                "کدام ژست حسن‌نیت راحتی را برمی‌گرداند؟",
                "کدام انتظار به مرز سبک‌تر نیاز دارد؟",
            ],
        },
        "ru": {
            "romantic": [
                "Что помогает тебе чувствовать эмоциональную устойчивость со мной?",
                "Как нам чинить связь после холодного периода?",
                "Какая граница нуждается в более ясной формулировке?",
            ],
            "marriage": [
                "Какой недельный ритуал строит доверие для обоих?",
                "Как отслеживать выполнение без обвинений?",
                "Какой жест ремонта лучше работает после давления?",
            ],
            "business": [
                "Где должны быть зафиксированы обязательства?",
                "Как рано и чисто эскалировать риск?",
                "Как выглядит надёжная коммуникация в этом месяце?",
            ],
            "friendship": [
                "Как мы check-in'имся, когда кто-то отдаляется?",
                "Какой жест доброй воли возвращает лёгкость?",
                "Какое ожидание нуждается в более мягкой границе?",
            ],
        },
        "ar": {
            "romantic": [
                "ما الذي يساعدك على الشعور بثبات عاطفي معي؟",
                "كيف نصلح بعد فترة باردة؟",
                "أي حد يحتاج صياغة أوضح؟",
            ],
            "marriage": [
                "أي طقس أسبوعي يبني الثقة لكلينا؟",
                "كيف نتتبّع الالتزام بلا لوم؟",
                "أي إيماءة إصلاح تنجح بعد الضغط؟",
            ],
            "business": [
                "أين يجب توثيق الالتزامات؟",
                "كيف نصعّد المخاطر مبكراً ونظيفاً؟",
                "كيف يبدو التواصل الموثوق هذا الشهر؟",
            ],
            "friendship": [
                "كيف نتواصل حين يبتعد أحدنا؟",
                "أي إيماءة حسن نية تعيد الخفة؟",
                "أي توقع يحتاج حداً أخف؟",
            ],
        },
    }
    return list(
        bank.get(lang, bank["en"]).get(relationship_type, bank["en"]["romantic"])
    )


def trust_patterns_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    relationship_type: str = "romantic",
    partner_birth_date: str | None = None,
    partner_birth_time: str | None = None,
    partner_location: str | None = None,
    partner_latitude: float | None = None,
    partner_longitude: float | None = None,
    concern: str | None = None,
    user_birth_time_known: bool = True,
    partner_birth_time_known: bool = True,
) -> dict:
    """
    Shadow Room — Trust Patterns.

    Synastry patterns (Moon/Mercury/Venus/Jupiter/Saturn) with
    observed/inferred/unknown layers — never loyalty verdicts.
    """
    rel = relationship_type if relationship_type in _VALID_COMPAT_RELS else "romantic"
    profile = resolve_relationship_profile(_COMPAT_REL_TO_PROFILE[rel])
    missing: list[str] = []
    observed: list[str] = []
    inferred: list[str] = []
    unknown: list[str] = []

    if concern and str(concern).strip():
        observed.append(
            {
                "en": f"user concern text provided ({len(concern.strip())} chars)",
                "fa": f"متن دغدغه کاربر ارائه شد ({len(concern.strip())} نویسه)",
                "ru": f"текст запроса пользователя ({len(concern.strip())} симв.)",
                "ar": f"نص قلق المستخدم مقدَّم ({len(concern.strip())} حرفاً)",
            }.get(lang, "")
        )

    has_partner = bool(
        partner_birth_date
        and str(partner_birth_date).strip()
        and partner_location
        and str(partner_location).strip()
    )
    if not has_partner:
        if not (partner_birth_date and str(partner_birth_date).strip()):
            missing.append("partner_birth_date")
        if not (partner_location and str(partner_location).strip()):
            missing.append("partner_location")
        if not (partner_birth_time and str(partner_birth_time).strip()):
            missing.append("partner_birth_time")

    user_time = (birth_time or "").strip() or "12:00"
    if not user_birth_time_known:
        user_time = "12:00"

    today = date.today().isoformat()
    natal, _ = build_chart_payload(
        birth_date=birth_date,
        birth_time=user_time,
        location=location,
        target_date=today,
        target_time=user_time,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
    )
    planets = natal.get("planets") or {}

    def _body_sign(name: str) -> str | None:
        body = planets.get(name) or {}
        lon = body.get("longitude")
        if isinstance(lon, (int, float)):
            return sign_of(float(lon))
        return None

    moon_sign = _body_sign("moon")
    mercury_sign = _body_sign("mercury")
    venus_sign = _body_sign("venus")
    jupiter_sign = _body_sign("jupiter")
    saturn_sign = _body_sign("saturn")

    signals: dict[str, dict] = {}
    planet_roles: dict[str, dict] = {}
    mode = "self"
    confidence = "medium"

    if not has_partner:
        mode = "self"
        confidence = "low"
        observed.append(
            {
                "en": "user natal chart loaded; no second-person chart",
                "fa": "چارت تولد کاربر بار شد؛ چارت نفر دوم نیست",
                "ru": "натал пользователя загружен; второй карты нет",
                "ar": "خريطة المستخدم محمّلة؛ لا خريطة للشخص الثاني",
            }.get(lang, "")
        )
        if moon_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Moon in {_sign_label(moon_sign, lang)} — "
                        f"emotional consistency needs may run high (tendency)"
                    ),
                    "fa": (
                        f"الگوی خود: ماه در {_sign_label(moon_sign, lang)} — "
                        f"نیاز به ثبات عاطفی ممکن است بالا باشد (تمایل)"
                    ),
                    "ru": (
                        f"свой паттерн: Луна в {_sign_label(moon_sign, lang)} — "
                        f"потребность в эмоциональной устойчивости может быть выше"
                    ),
                    "ar": (
                        f"نمط ذاتي: القمر في {_sign_label(moon_sign, lang)} — "
                        f"الحاجة لثبات عاطفي قد تكون أعلى (ميل)"
                    ),
                }.get(lang, "")
            )
        if mercury_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Mercury in {_sign_label(mercury_sign, lang)} — "
                        f"clarity and follow-through style is chart-specific"
                    ),
                    "fa": (
                        f"الگوی خود: عطارد در {_sign_label(mercury_sign, lang)} — "
                        f"سبک وضوح و پیگیری به چارت وابسته است"
                    ),
                    "ru": (
                        f"свой паттерн: Меркурий в {_sign_label(mercury_sign, lang)} — "
                        f"стиль ясности и выполнения зависит от карты"
                    ),
                    "ar": (
                        f"نمط ذاتي: عطارد في {_sign_label(mercury_sign, lang)} — "
                        f"أسلوب الوضوح والمتابعة يعتمد على الخريطة"
                    ),
                }.get(lang, "")
            )
        if venus_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Venus in {_sign_label(venus_sign, lang)} — "
                        f"reciprocity ease is a tendency to verify in life"
                    ),
                    "fa": (
                        f"الگوی خود: زهره در {_sign_label(venus_sign, lang)} — "
                        f"سهولت بده‌بستان تمایلی است که در زندگی راستی‌آزمایی شود"
                    ),
                    "ru": (
                        f"свой паттерн: Венера в {_sign_label(venus_sign, lang)} — "
                        f"лёгкость взаимности — тенденция для проверки в жизни"
                    ),
                    "ar": (
                        f"نمط ذاتي: الزهرة في {_sign_label(venus_sign, lang)} — "
                        f"سهولة التبادل ميل يُتحقق منه في الحياة"
                    ),
                }.get(lang, "")
            )
        if jupiter_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Jupiter in {_sign_label(jupiter_sign, lang)} — "
                        f"goodwill/repair capacity is a tendency, not a guarantee"
                    ),
                    "fa": (
                        f"الگوی خود: مشتری در {_sign_label(jupiter_sign, lang)} — "
                        f"ظرفیت حسن‌نیت/ترمیم تمایل است نه تضمین"
                    ),
                    "ru": (
                        f"свой паттерн: Юпитер в {_sign_label(jupiter_sign, lang)} — "
                        f"запас доброй воли/ремонта — тенденция, не гарантия"
                    ),
                    "ar": (
                        f"نمط ذاتي: المشتري في {_sign_label(jupiter_sign, lang)} — "
                        f"سعة حسن النية/الإصلاح ميل لا ضمان"
                    ),
                }.get(lang, "")
            )
        if saturn_sign:
            inferred.append(
                {
                    "en": (
                        f"self-pattern: Saturn in {_sign_label(saturn_sign, lang)} — "
                        f"boundary and durability pressure may feel heavier"
                    ),
                    "fa": (
                        f"الگوی خود: زحل در {_sign_label(saturn_sign, lang)} — "
                        f"فشار مرز و دوام ممکن است سنگین‌تر حس شود"
                    ),
                    "ru": (
                        f"свой паттерн: Сатурн в {_sign_label(saturn_sign, lang)} — "
                        f"давление границ и прочности может ощущаться сильнее"
                    ),
                    "ar": (
                        f"نمط ذاتي: زحل في {_sign_label(saturn_sign, lang)} — "
                        f"ضغط الحدود والمتانة قد يثقل أكثر"
                    ),
                }.get(lang, "")
            )
        unknown.extend(
            [
                {
                    "en": "partner synastry trust patterns — unknown without second chart",
                    "fa": "الگوهای اعتماد هم‌خوانی شریک — بدون چارت دوم نامشخص",
                    "ru": "синастрические паттерны доверия партнёра — неизвестны без второй карты",
                    "ar": "أنماط ثقة توافق الشريك — غير معروفة بلا خريطة ثانية",
                }.get(lang, ""),
                {
                    "en": "real-world character conclusions — unknown from charts alone",
                    "fa": "نتیجه‌گیری شخصیتی واقعی — فقط از چارت نامشخص",
                    "ru": "реальные выводы о характере — по картам неизвестны",
                    "ar": "استنتاجات شخصية واقعية — غير معروفة من الخرائط وحدها",
                }.get(lang, ""),
            ]
        )
        for key in _TRUST_DIM_PLANETS:
            signals[key] = {
                "band": "unknown",
                "layer": "unknown",
                "score": None,
                "hits": 0,
            }
    else:
        mode = "synastry"
        partner_time = (partner_birth_time or "").strip()
        if not partner_time:
            missing.append("partner_birth_time")
            partner_time = "12:00"
            partner_birth_time_known = False
        partner_natal, _ = build_chart_payload(
            birth_date=partner_birth_date,  # type: ignore[arg-type]
            birth_time=partner_time,
            location=partner_location,  # type: ignore[arg-type]
            target_date=today,
            target_time=partner_time,
            house_system=house_system,
            zodiac=zodiac,
            latitude=partner_latitude,
            longitude=partner_longitude,
        )
        observed.append(
            {
                "en": "second-person birth data provided for synastry",
                "fa": "داده تولد نفر دوم برای هم‌خوانی ارائه شد",
                "ru": "данные рождения второго человека для синастрии",
                "ar": "بيانات ولادة الشخص الثاني للتوافق مقدَّمة",
            }.get(lang, "")
        )
        _overall, harmony, tension = _compute_vault_synastry(
            planets, partner_natal.get("planets") or {}, profile
        )
        for key, pset in _TRUST_DIM_PLANETS.items():
            dim = _score_compat_dimension(harmony, tension, pset, profile)
            band = str(dim.get("band") or "unknown")
            layer = "inferred" if dim.get("hits", 0) > 0 else "unknown"
            signals[key] = {
                "band": band,
                "layer": layer,
                "score": dim.get("score"),
                "hits": dim.get("hits", 0),
            }
            if layer == "inferred":
                inferred.append(
                    {
                        "en": (
                            f"{key.replace('_', ' ')} band={band} "
                            f"(synastry pattern — not a character verdict)"
                        ),
                        "fa": (
                            f"{key}: باند={band} "
                            f"(الگوی هم‌خوانی — نه حکم شخصیت)"
                        ),
                        "ru": (
                            f"{key}: полоса={band} "
                            f"(паттерн синастрии — не вердикт о характере)"
                        ),
                        "ar": (
                            f"{key}: النطاق={band} "
                            f"(نمط توافق — ليس حكماً على الشخصية)"
                        ),
                    }.get(lang, "")
                )
            else:
                unknown.append(
                    {
                        "en": f"{key.replace('_', ' ')} — unknown (no aspects in orb)",
                        "fa": f"{key} — نامشخص (جنبه‌ای در اورب نیست)",
                        "ru": f"{key} — неизвестно (нет аспектов в орбе)",
                        "ar": f"{key} — غير معروف (لا جوانب ضمن القوس)",
                    }.get(lang, "")
                )
        unknown.append(
            {
                "en": "real-world character conclusions — unknown from charts alone",
                "fa": "نتیجه‌گیری شخصیتی واقعی — فقط از چارت نامشخص",
                "ru": "реальные выводы о характере — по картам неизвестны",
                "ar": "استنتاجات شخصية واقعية — غير معروفة من الخرائط وحدها",
            }.get(lang, "")
        )
        known_scores = [
            int(s["score"])
            for s in signals.values()
            if isinstance(s.get("score"), int)
        ]
        if known_scores:
            avg = sum(known_scores) / len(known_scores)
            confidence = "high" if avg >= 65 else "medium" if avg >= 45 else "low"
        else:
            confidence = "low"

        # Per-planet role scores (separate from Cheating Radar dims).
        for planet, role in _TRUST_PLANET_ROLES.items():
            dim = _score_compat_dimension(
                harmony, tension, frozenset({planet}), profile
            )
            planet_roles[planet] = {
                "role": role,
                "band": str(dim.get("band") or "unknown"),
                "layer": "inferred" if dim.get("hits", 0) > 0 else "unknown",
                "score": dim.get("score"),
                "hits": dim.get("hits", 0),
            }
            if planet_roles[planet]["layer"] == "inferred":
                inferred.append(
                    {
                        "en": (
                            f"{planet} role={role} band={planet_roles[planet]['band']} "
                            f"(pattern only)"
                        ),
                        "fa": (
                            f"{planet} نقش={role} باند={planet_roles[planet]['band']} "
                            f"(فقط الگو)"
                        ),
                        "ru": (
                            f"{planet} роль={role} полоса={planet_roles[planet]['band']} "
                            f"(только паттерн)"
                        ),
                        "ar": (
                            f"{planet} دور={role} نطاق={planet_roles[planet]['band']} "
                            f"(نمط فقط)"
                        ),
                    }.get(lang, "")
                )

    if not has_partner:
        for planet, role in _TRUST_PLANET_ROLES.items():
            planet_roles[planet] = {
                "role": role,
                "band": "unknown",
                "layer": "unknown",
                "score": None,
                "hits": 0,
            }

    time_note = None
    if not user_birth_time_known or (has_partner and not partner_birth_time_known):
        confidence = "low"
        if "exact_birth_time" not in missing:
            missing.append("exact_birth_time")
        time_note = {
            "en": "Exact birth time missing — house claims avoided; confidence reduced.",
            "fa": "ساعت دقیق تولد ناقص است — ادعای خانه‌ای نیست؛ اطمینان کمتر.",
            "ru": "Точное время рождения отсутствует — без домов; уверенность снижена.",
            "ar": "وقت الولادة الدقيق ناقص — بلا ادعاء بيوت؛ ثقة أقل.",
        }.get(lang)

    behaviors = _trust_verify_behaviors(lang)
    questions = _trust_questions(rel, lang)
    text = render_trust_patterns_reading(
        lang=lang,
        mode=mode,
        relationship_type=rel,
        signals=signals,
        observed=observed,
        inferred=inferred,
        unknown=unknown,
        behaviors=behaviors,
        questions=questions,
        missing_inputs=missing,
        confidence=confidence,
        concern=concern,
        time_precision_note=time_note,
        planet_roles=planet_roles,
    )
    return {
        "planet": "trust",
        "lang": lang,
        "relationship_type": rel,
        "profile_key": profile.key,
        "mode": mode,
        "missing_inputs": missing,
        "signals": signals,
        "planet_roles": planet_roles,
        "observed": observed,
        "inferred": inferred,
        "unknown": unknown,
        "behaviors": behaviors,
        "questions": questions,
        "verdict": {
            "relationship_type": rel,
            "profile_key": profile.key,
            "mode": mode,
            "confidence": confidence,
            "missing_inputs": missing,
            "claim": "patterns_only_never_verdict",
            "user_birth_time_known": user_birth_time_known,
            "partner_birth_time_known": partner_birth_time_known if has_partner else False,
            "signals": ["moon", "mercury", "venus", "jupiter", "saturn"],
            "planet_roles": {
                p: _TRUST_PLANET_ROLES[p] for p in _TRUST_PLANET_ROLES
            },
        },
        "reading": text,
    }


def _comm_risk_band(dim: dict) -> str:
    """Map compatibility score/band → low / moderate / elevated / unknown."""
    if dim.get("hits", 0) <= 0 or dim.get("score") is None:
        return "unknown"
    score = int(dim["score"])
    # Higher compatibility score ⇒ lower communication risk (except repair is capacity).
    if score >= 62:
        return "low"
    if score <= 42:
        return "elevated"
    return "moderate"


def _comm_risk_verify_behaviors(lang: str) -> list[str]:
    return {
        "en": [
            "Answers stay specific when logistics are asked twice",
            "Tone recovers after a sharp exchange within one day",
            "Silence is labeled as need-for-space rather than left unexplained",
        ],
        "fa": [
            "وقتی لجستیک دوباره پرسیده می‌شود پاسخ مشخص می‌ماند",
            "تن صدا بعد از تبادل تند ظرف یک روز ترمیم می‌شود",
            "سکوت به‌عنوان نیاز به فضا نامیده می‌شود نه بی‌توضیح",
        ],
        "ru": [
            "Ответы остаются конкретными, когда логистику спрашивают дважды",
            "Тон восстанавливается после острого обмена в течение дня",
            "Тишина называется потребностью в пространстве, а не остаётся без объяснения",
        ],
        "ar": [
            "الإجابات تبقى محددة حين تُسأل اللوجستيات مرتين",
            "النبرة تتعافى بعد تبادل حاد خلال يوم",
            "الصمت يُسمّى حاجة لمساحة لا يُترك بلا تفسير",
        ],
    }.get(lang, [])


def _comm_risk_questions(relationship_type: str, lang: str) -> list[str]:
    bank = {
        "en": {
            "romantic": [
                "What did you hear me ask — in your words?",
                "When you go quiet, what should I assume?",
                "What would make repair feel safe after heat?",
            ],
            "marriage": [
                "Which topic needs a slower format this week?",
                "How do we pause escalation without stonewalling?",
                "What follow-through would rebuild clarity?",
            ],
            "business": [
                "What decision needs a written summary today?",
                "Where did interpretation diverge last meeting?",
                "How do we flag risk without blame language?",
            ],
            "friendship": [
                "What felt unclear in our last exchange?",
                "How do we check in after distance?",
                "What tone helps you stay open?",
            ],
        },
        "fa": {
            "romantic": [
                "چه چیزی از حرفم شنیدی — با کلمات خودت؟",
                "وقتی ساکت می‌شوی باید چه فرض کنم؟",
                "بعد از تنش چه چیزی ترمیم را امن می‌کند؟",
            ],
            "marriage": [
                "این هفته کدام موضوع به فرمت آهسته‌تر نیاز دارد؟",
                "تشدید را بدون دیوار چطور متوقف کنیم؟",
                "کدام پیگیری وضوح را برمی‌گرداند؟",
            ],
            "business": [
                "کدام تصمیم امروز به خلاصه مکتوب نیاز دارد؟",
                "جلسه قبل تفسیر کجا جدا شد؟",
                "ریسک را بدون زبان سرزنش چطور علامت بزنیم؟",
            ],
            "friendship": [
                "در تبادل آخر چه چیزی مبهم بود؟",
                "بعد از فاصله چطور چک‌این کنیم؟",
                "کدام تن به باز ماندن کمک می‌کند؟",
            ],
        },
        "ru": {
            "romantic": [
                "Что ты услышал(а) в моей просьбе — своими словами?",
                "Когда ты замолкаешь, что мне предполагать?",
                "Что сделает ремонт безопасным после жара?",
            ],
            "marriage": [
                "Какая тема на этой неделе нуждается в более медленном формате?",
                "Как поставить паузу эскалации без стены?",
                "Какое выполнение вернёт ясность?",
            ],
            "business": [
                "Какое решение сегодня нужно письменно резюмировать?",
                "Где разошлись интерпретации на прошлой встрече?",
                "Как отмечать риск без языка обвинений?",
            ],
            "friendship": [
                "Что было неясно в нашем последнем обмене?",
                "Как мы check-in'имся после дистанции?",
                "Какой тон помогает тебе оставаться открытым(ой)?",
            ],
        },
        "ar": {
            "romantic": [
                "ماذا سمعتِ من طلبي — بكلماتك؟",
                "حين تصمتين، ماذا يفترض أن أفهم؟",
                "ما الذي يجعل الإصلاح آمناً بعد التوتر؟",
            ],
            "marriage": [
                "أي موضوع يحتاج تنسيقاً أبطأ هذا الأسبوع؟",
                "كيف نوقف التصعيد بلا جدار؟",
                "أي متابعة تعيد الوضوح؟",
            ],
            "business": [
                "أي قرار يحتاج ملخصاً مكتوباً اليوم؟",
                "أين افترق التفسير في اللقاء السابق؟",
                "كيف نُشير إلى المخاطر بلا لغة لوم؟",
            ],
            "friendship": [
                "ما الذي بدا غير واضح في آخر تبادل؟",
                "كيف نتواصل بعد البعد؟",
                "أي نبرة تساعدك على البقاء منفتحة؟",
            ],
        },
    }
    return list(
        bank.get(lang, bank["en"]).get(relationship_type, bank["en"]["romantic"])
    )


def communication_risk_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
    latitude: float | None = None,
    longitude: float | None = None,
    relationship_type: str = "romantic",
    partner_birth_date: str | None = None,
    partner_birth_time: str | None = None,
    partner_location: str | None = None,
    partner_latitude: float | None = None,
    partner_longitude: float | None = None,
    concern: str | None = None,
    user_birth_time_known: bool = True,
    partner_birth_time_known: bool = True,
) -> dict:
    """
    Shadow Room — Communication Risk.

    Synastry risk bands for Mercury/Moon/Mars/Saturn/Jupiter/Venus.
    Never lying/manipulation/abuse verdicts.
    """
    rel = relationship_type if relationship_type in _VALID_COMPAT_RELS else "romantic"
    profile = resolve_relationship_profile(_COMPAT_REL_TO_PROFILE[rel])
    missing: list[str] = []
    observed: list[str] = []
    inferred: list[str] = []
    unknown: list[str] = []
    signals: dict[str, dict] = {}
    planet_roles: dict[str, dict] = {}

    if concern and str(concern).strip():
        observed.append(
            {
                "en": f"user concern text provided ({len(concern.strip())} chars)",
                "fa": f"متن دغدغه کاربر ارائه شد ({len(concern.strip())} نویسه)",
                "ru": f"текст запроса пользователя ({len(concern.strip())} симв.)",
                "ar": f"نص قلق المستخدم مقدَّم ({len(concern.strip())} حرفاً)",
            }.get(lang, "")
        )

    has_partner = bool(
        partner_birth_date
        and str(partner_birth_date).strip()
        and partner_location
        and str(partner_location).strip()
    )
    if not has_partner:
        if not (partner_birth_date and str(partner_birth_date).strip()):
            missing.append("partner_birth_date")
        if not (partner_location and str(partner_location).strip()):
            missing.append("partner_location")
        if not (partner_birth_time and str(partner_birth_time).strip()):
            missing.append("partner_birth_time")

    user_time = (birth_time or "").strip() or "12:00"
    if not user_birth_time_known:
        user_time = "12:00"

    today = date.today().isoformat()
    natal, _ = build_chart_payload(
        birth_date=birth_date,
        birth_time=user_time,
        location=location,
        target_date=today,
        target_time=user_time,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
    )
    planets = natal.get("planets") or {}

    def _body_sign(name: str) -> str | None:
        body = planets.get(name) or {}
        lon = body.get("longitude")
        if isinstance(lon, (int, float)):
            return sign_of(float(lon))
        return None

    mode = "self"
    confidence = "medium"

    if not has_partner:
        mode = "self"
        confidence = "low"
        observed.append(
            {
                "en": "user natal chart loaded; no second-person chart",
                "fa": "چارت تولد کاربر بار شد؛ چارت نفر دوم نیست",
                "ru": "натал пользователя загружен; второй карты нет",
                "ar": "خريطة المستخدم محمّلة؛ لا خريطة للشخص الثاني",
            }.get(lang, "")
        )
        for planet, role in _COMM_RISK_PLANET_ROLES.items():
            sgn = _body_sign(planet)
            planet_roles[planet] = {
                "role": role,
                "band": "unknown",
                "layer": "unknown",
                "score": None,
                "hits": 0,
            }
            if sgn:
                inferred.append(
                    {
                        "en": (
                            f"self-pattern: {planet} in {_sign_label(sgn, lang)} — "
                            f"{role.replace('_', ' ')} tendency (not a diagnosis)"
                        ),
                        "fa": (
                            f"الگوی خود: {planet} در {_sign_label(sgn, lang)} — "
                            f"تمایل {role} (نه تشخیص)"
                        ),
                        "ru": (
                            f"свой паттерн: {planet} в {_sign_label(sgn, lang)} — "
                            f"тенденция {role} (не диагноз)"
                        ),
                        "ar": (
                            f"نمط ذاتي: {planet} في {_sign_label(sgn, lang)} — "
                            f"ميل {role} (ليس تشخيصاً)"
                        ),
                    }.get(lang, "")
                )
        unknown.extend(
            [
                {
                    "en": "partner synastry communication risk — unknown without second chart",
                    "fa": "ریسک ارتباط هم‌خوانی شریک — بدون چارت دوم نامشخص",
                    "ru": "синастрический риск общения партнёра — неизвестен без второй карты",
                    "ar": "مخاطر تواصل توافق الشريك — غير معروفة بلا خريطة ثانية",
                }.get(lang, ""),
                {
                    "en": "real-world communication intent — unknown from charts alone",
                    "fa": "نیت ارتباط واقعی — فقط از چارت نامشخص",
                    "ru": "реальные коммуникативные намерения — по картам неизвестны",
                    "ar": "نية التواصل في الواقع — غير معروفة من الخرائط وحدها",
                }.get(lang, ""),
            ]
        )
        for key in _COMM_RISK_DIM_PLANETS:
            signals[key] = {
                "band": "unknown",
                "layer": "unknown",
                "score": None,
                "hits": 0,
            }
    else:
        mode = "synastry"
        partner_time = (partner_birth_time or "").strip()
        if not partner_time:
            missing.append("partner_birth_time")
            partner_time = "12:00"
            partner_birth_time_known = False
        partner_natal, _ = build_chart_payload(
            birth_date=partner_birth_date,  # type: ignore[arg-type]
            birth_time=partner_time,
            location=partner_location,  # type: ignore[arg-type]
            target_date=today,
            target_time=partner_time,
            house_system=house_system,
            zodiac=zodiac,
            latitude=partner_latitude,
            longitude=partner_longitude,
        )
        observed.append(
            {
                "en": "second-person birth data provided for synastry",
                "fa": "داده تولد نفر دوم برای هم‌خوانی ارائه شد",
                "ru": "данные рождения второго человека для синастрии",
                "ar": "بيانات ولادة الشخص الثاني للتوافق مقدَّمة",
            }.get(lang, "")
        )
        _overall, harmony, tension = _compute_vault_synastry(
            planets, partner_natal.get("planets") or {}, profile
        )
        for key, pset in _COMM_RISK_DIM_PLANETS.items():
            dim = _score_compat_dimension(harmony, tension, pset, profile)
            # Harmony ⇒ low risk / healthier repair capacity; tension ⇒ elevated.
            band = _comm_risk_band(dim)
            layer = "inferred" if dim.get("hits", 0) > 0 else "unknown"
            if layer == "unknown":
                band = "unknown"
            signals[key] = {
                "band": band,
                "layer": layer,
                "score": dim.get("score"),
                "hits": dim.get("hits", 0),
            }
            if layer == "inferred":
                inferred.append(
                    {
                        "en": (
                            f"{key.replace('_', ' ')} risk band={band} "
                            f"(synastry pattern — not a behaviour fact)"
                        ),
                        "fa": (
                            f"{key}: باند ریسک={band} "
                            f"(الگوی هم‌خوانی — نه واقعیت رفتار)"
                        ),
                        "ru": (
                            f"{key}: риск={band} "
                            f"(паттерн синастрии — не факт поведения)"
                        ),
                        "ar": (
                            f"{key}: نطاق المخاطر={band} "
                            f"(نمط توافق — ليس حقيقة سلوك)"
                        ),
                    }.get(lang, "")
                )
            else:
                unknown.append(
                    {
                        "en": f"{key.replace('_', ' ')} — unknown (no aspects in orb)",
                        "fa": f"{key} — نامشخص (جنبه‌ای در اورب نیست)",
                        "ru": f"{key} — неизвестно (нет аспектов в орбе)",
                        "ar": f"{key} — غير معروف (لا جوانب ضمن القوس)",
                    }.get(lang, "")
                )

        for planet, role in _COMM_RISK_PLANET_ROLES.items():
            dim = _score_compat_dimension(
                harmony, tension, frozenset({planet}), profile
            )
            band = _comm_risk_band(dim)
            layer = "inferred" if dim.get("hits", 0) > 0 else "unknown"
            if layer == "unknown":
                band = "unknown"
            planet_roles[planet] = {
                "role": role,
                "band": band,
                "layer": layer,
                "score": dim.get("score"),
                "hits": dim.get("hits", 0),
            }

        unknown.append(
            {
                "en": "real-world communication intent — unknown from charts alone",
                "fa": "نیت ارتباط واقعی — فقط از چارت نامشخص",
                "ru": "реальные коммуникативные намерения — по картам неизвестны",
                "ar": "نية التواصل في الواقع — غير معروفة من الخرائط وحدها",
            }.get(lang, "")
        )
        elev = sum(1 for s in signals.values() if s.get("band") == "elevated")
        confidence = "high" if elev == 0 else "medium" if elev <= 2 else "low"

    time_note = None
    if not user_birth_time_known or (has_partner and not partner_birth_time_known):
        confidence = "low"
        if "exact_birth_time" not in missing:
            missing.append("exact_birth_time")
        time_note = {
            "en": "Exact birth time missing — house claims avoided; confidence reduced.",
            "fa": "ساعت دقیق تولد ناقص است — ادعای خانه‌ای نیست؛ اطمینان کمتر.",
            "ru": "Точное время рождения отсутствует — без домов; уверенность снижена.",
            "ar": "وقت الولادة الدقيق ناقص — بلا ادعاء بيوت؛ ثقة أقل.",
        }.get(lang)

    behaviors = _comm_risk_verify_behaviors(lang)
    questions = _comm_risk_questions(rel, lang)
    text = render_communication_risk_reading(
        lang=lang,
        mode=mode,
        relationship_type=rel,
        signals=signals,
        observed=observed,
        inferred=inferred,
        unknown=unknown,
        behaviors=behaviors,
        questions=questions,
        missing_inputs=missing,
        confidence=confidence,
        concern=concern,
        time_precision_note=time_note,
        planet_roles=planet_roles,
    )
    return {
        "planet": "commrisk",
        "lang": lang,
        "relationship_type": rel,
        "profile_key": profile.key,
        "mode": mode,
        "missing_inputs": missing,
        "signals": signals,
        "planet_roles": planet_roles,
        "observed": observed,
        "inferred": inferred,
        "unknown": unknown,
        "behaviors": behaviors,
        "questions": questions,
        "verdict": {
            "relationship_type": rel,
            "profile_key": profile.key,
            "mode": mode,
            "confidence": confidence,
            "missing_inputs": missing,
            "claim": "risk_patterns_only_never_verdict",
            "user_birth_time_known": user_birth_time_known,
            "partner_birth_time_known": partner_birth_time_known if has_partner else False,
            "signals": list(_COMM_RISK_PLANET_ROLES.keys()),
            "planet_roles": dict(_COMM_RISK_PLANET_ROLES),
        },
        "reading": text,
    }
