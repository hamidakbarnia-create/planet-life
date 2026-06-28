"""World / mundane astrology overlay.

This service does NOT predict news or prices. It computes the *current sky* —
the major aspects between the slow planets plus the outer-planet sign
placements — and tags each signal with a theme (markets / geopolitics), a tone
(supportive vs tension) and a topic keyword. The frontend turns those tokens
into localized sentences and overlays them on the live (factual) prices and
headlines, so the astrology explains the *cycle*, not the event.
"""

from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Any

from services.pathfinder import _active_lines, _calc_chart_for_instant

# Slow / structural bodies only — fast points (Moon, Mercury) add noise to a
# mundane read, so they are intentionally excluded.
MUNDANE_BODIES = ("sun", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto")

ASPECTS = {
    "conjunction": 0.0,
    "sextile": 60.0,
    "square": 90.0,
    "trine": 120.0,
    "opposition": 180.0,
}
HARD_ASPECTS = {"conjunction", "square", "opposition"}
MUNDANE_ORB = 4.0

# Planet pair -> (theme, topic keyword). The frontend localizes the topic.
# Keys are sorted tuples so order does not matter.
PAIR_TOPICS: dict[tuple[str, str], list[tuple[str, str]]] = {
    ("jupiter", "saturn"): [("markets", "economic_cycle")],
    ("jupiter", "uranus"): [("markets", "tech_breakout")],
    ("saturn", "uranus"): [("markets", "structural_change"), ("geopolitics", "old_vs_new_order")],
    ("mars", "pluto"): [("markets", "oil_volatility"), ("geopolitics", "power_struggle")],
    ("mars", "uranus"): [("markets", "sudden_shock"), ("geopolitics", "sudden_strike")],
    ("mars", "saturn"): [("geopolitics", "military_pressure")],
    ("saturn", "pluto"): [("geopolitics", "regime_power"), ("markets", "debt_pressure")],
    ("sun", "pluto"): [("geopolitics", "power_focus")],
    ("venus", "jupiter"): [("markets", "currency_luxury")],
    ("venus", "pluto"): [("markets", "currency_luxury")],
    ("jupiter", "pluto"): [("markets", "debt_pressure")],
    ("jupiter", "neptune"): [("markets", "speculation")],
    ("sun", "uranus"): [("markets", "sudden_shock")],
}

# Standing outer-planet placements that color the era (always present).
PLACEMENT_TOPICS: dict[str, list[tuple[str, str]]] = {
    "pluto": [("geopolitics", "power_restructure"), ("markets", "debt_pressure")],
    "uranus": [("markets", "supply_shock")],
    "neptune": [("markets", "speculation")],
    "saturn": [("geopolitics", "hard_limits")],
}
PLACEMENT_BODIES = ("saturn", "uranus", "neptune", "pluto")

_CACHE: dict[str, Any] = {"ts": 0.0, "data": None}
_CACHE_TTL = 1800.0  # 30 min — the sky barely moves; avoids recomputing per hit
_LOCK = threading.Lock()


def _norm(deg: float) -> float:
    return deg % 360.0


def _separation(a: float, b: float) -> float:
    diff = abs(_norm(a) - _norm(b))
    return min(diff, 360.0 - diff)


def _match_aspect(sep: float) -> tuple[str, float] | None:
    best: tuple[str, float] | None = None
    for name, exact in ASPECTS.items():
        orb = abs(sep - exact)
        if orb <= MUNDANE_ORB and (best is None or orb < best[1]):
            best = (name, orb)
    return best


def _tone(aspect: str, p1: str, p2: str) -> str:
    """Hard aspects between heavy planets read as tension; soft as supportive."""
    if aspect in HARD_ASPECTS:
        return "tension"
    return "supportive"


def _compute_sky(now: datetime) -> dict[str, Any]:
    # Planet longitudes are geocentric and location-independent, so lat/lon 0 is
    # fine for a mundane snapshot — we only use planets, not houses.
    chart = _calc_chart_for_instant(now, 0.0, 0.0)
    planets = chart["planets"]

    aspects: list[dict[str, Any]] = []
    bodies = [b for b in MUNDANE_BODIES if b in planets]
    for i in range(len(bodies)):
        for j in range(i + 1, len(bodies)):
            p1, p2 = bodies[i], bodies[j]
            sep = _separation(planets[p1]["longitude"], planets[p2]["longitude"])
            match = _match_aspect(sep)
            if not match:
                continue
            aspect, orb = match
            key = tuple(sorted((p1, p2)))
            topics = PAIR_TOPICS.get(key, [])
            if not topics:
                continue
            tone = _tone(aspect, p1, p2)
            for theme, topic in topics:
                aspects.append(
                    {
                        "kind": "aspect",
                        "theme": theme,
                        "topic": topic,
                        "tone": tone,
                        "p1": key[0],
                        "p2": key[1],
                        "aspect": aspect,
                        "orb": round(orb, 2),
                    }
                )

    placements: list[dict[str, Any]] = []
    for body in PLACEMENT_BODIES:
        if body not in planets:
            continue
        sign_name = planets[body]["sign_name"]
        retro = bool(planets[body].get("retrograde"))
        for theme, topic in PLACEMENT_TOPICS.get(body, []):
            placements.append(
                {
                    "kind": "placement",
                    "theme": theme,
                    "topic": topic,
                    "tone": "context",
                    "planet": body,
                    "sign": sign_name,
                    "retrograde": retro,
                }
            )

    # Build per-theme signal lists: tightest aspects first, then placements as
    # standing context. Cap so cards stay clean.
    def theme_signals(theme: str) -> list[dict[str, Any]]:
        asp = sorted(
            [a for a in aspects if a["theme"] == theme], key=lambda x: x["orb"]
        )
        plc = [p for p in placements if p["theme"] == theme]
        return (asp + plc)[:4]

    return {
        "computed_at": now.replace(microsecond=0).isoformat(),
        "themes": {
            "markets": theme_signals("markets"),
            "geopolitics": theme_signals("geopolitics"),
        },
        "aspects": sorted(aspects, key=lambda x: x["orb"]),
        "placements": placements,
    }


# Which property/markets theme each planet activates when it's angular over a
# specific city right now. This makes the real-estate read differ per city,
# because the angles (AC/MC/DC/IC) depend on the city's latitude/longitude.
CITY_PLANET_TOPIC: dict[str, tuple[str, str]] = {
    "jupiter": ("growth_luck", "supportive"),
    "venus": ("currency_luxury", "supportive"),
    "sun": ("power_focus", "supportive"),
    "moon": ("home_sentiment", "context"),
    "mercury": ("currency_luxury", "context"),
    "saturn": ("hard_limits", "tension"),
    "mars": ("drive_conflict", "tension"),
    "pluto": ("power_transformation", "tension"),
    "uranus": ("supply_shock", "context"),
    "neptune": ("speculation", "context"),
}

CITY_HOUSE_TOPIC: dict[int, tuple[str, str]] = {
    4: ("home_sentiment", "supportive"),
    2: ("currency_luxury", "supportive"),
    8: ("debt_pressure", "tension"),
    10: ("power_focus", "context"),
    12: ("speculation", "tension"),
}

CITY_HOUSE_PLANETS = {"moon", "venus", "jupiter", "saturn", "mars", "mercury", "neptune"}


def city_reading(lat: float, lon: float) -> dict[str, Any]:
    """Current sky read for a specific city — which planets sit on its local
    angles and property-relevant houses right now. Location-dependent, so each
    city gives a distinct read instead of repeating the global market sky."""
    chart = _calc_chart_for_instant(datetime.now(timezone.utc), float(lat), float(lon))
    lines = _active_lines(chart["planets"], chart["angles"])
    signals: list[dict[str, Any]] = []
    for line in lines:
        planet = line["planet"]
        meta = CITY_PLANET_TOPIC.get(planet)
        if not meta:
            continue
        topic, tone = meta
        signals.append(
            {
                "kind": "angular",
                "theme": "realEstate",
                "topic": topic,
                "tone": tone,
                "planet": planet,
                "angle": line["angle"],
                "orb": line["orb"],
            }
        )

    # House placement layer: even when no planet is exactly angular, the local
    # chart still changes by city. For real estate, houses 4 (home), 2 (assets),
    # 8 (debt/shared capital), 10 (public regulation/market direction), and 12
    # (fog/hidden costs) are the most useful. This keeps each city specific.
    for planet, body in chart["planets"].items():
        if planet not in CITY_HOUSE_PLANETS:
            continue
        house = int(body.get("house") or 0)
        meta = CITY_HOUSE_TOPIC.get(house)
        if not meta:
            continue
        topic, tone = meta
        # Avoid repeating the same planet if it already has a stronger angular signal.
        if any(s.get("planet") == planet and s.get("kind") == "angular" for s in signals):
            continue
        signals.append(
            {
                "kind": "placement",
                "theme": "realEstate",
                "topic": topic,
                "tone": tone,
                "planet": planet,
                "sign": str(body.get("sign_name", "")).lower(),
                "house": house,
                # Sort house signals behind angular signals but still deterministic.
                "orb": 20 + house,
            }
        )

    signals.sort(key=lambda x: (0 if x["kind"] == "angular" else 1, x.get("orb", 99)))
    return {
        "computed_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "signals": signals[:6],
    }


def current_sky() -> dict[str, Any]:
    """Cached mundane-sky snapshot (recomputed at most every 30 minutes)."""
    now_ts = time.time()
    with _LOCK:
        if _CACHE["data"] is not None and now_ts - _CACHE["ts"] < _CACHE_TTL:
            return _CACHE["data"]
    data = _compute_sky(datetime.now(timezone.utc))
    with _LOCK:
        _CACHE["ts"] = now_ts
        _CACHE["data"] = data
    return data
