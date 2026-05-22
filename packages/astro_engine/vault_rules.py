"""
Vault Rules Engine — interpretation layer for the women-focused Vault.

This module turns raw Swiss Ephemeris output into structured "verdicts"
that the LLM/template layer can render into magnetic, strategic prose.

The first slice covers Mars (the Sensuality module's first card). It
computes:

    - sign + decan
    - house placement
    - retrograde status
    - essential dignity (rulership, exaltation, detriment, fall)
    - aspects to Venus, Pluto, Sun, Moon, Lilith with exact orbs

Other planets and aspects can plug in the same way.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


SIGN_NAMES = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]

# Classical rulership: which planet rules / is exalted / falls / is in
# detriment in each sign. Source: traditional Western astrology.
RULERSHIPS = {
    "sun": {"rules": "leo", "exalt": "aries", "detriment": "aquarius", "fall": "libra"},
    "moon": {"rules": "cancer", "exalt": "taurus", "detriment": "capricorn", "fall": "scorpio"},
    "mercury": {"rules": ("gemini", "virgo"), "exalt": "virgo", "detriment": ("sagittarius", "pisces"), "fall": "pisces"},
    "venus": {"rules": ("taurus", "libra"), "exalt": "pisces", "detriment": ("scorpio", "aries"), "fall": "virgo"},
    "mars": {"rules": ("aries", "scorpio"), "exalt": "capricorn", "detriment": ("libra", "taurus"), "fall": "cancer"},
    "jupiter": {"rules": ("sagittarius", "pisces"), "exalt": "cancer", "detriment": ("gemini", "virgo"), "fall": "capricorn"},
    "saturn": {"rules": ("capricorn", "aquarius"), "exalt": "libra", "detriment": ("cancer", "leo"), "fall": "aries"},
}


def _norm_lon(lon: float) -> float:
    return lon % 360.0


def sign_of(longitude: float) -> str:
    return SIGN_NAMES[int(_norm_lon(longitude) // 30)]


def degree_in_sign(longitude: float) -> float:
    return _norm_lon(longitude) % 30.0


def decan_of(longitude: float) -> int:
    """1, 2, or 3 — which 10° third of the sign the body sits in."""
    deg = degree_in_sign(longitude)
    if deg < 10.0:
        return 1
    if deg < 20.0:
        return 2
    return 3


def essential_dignity(planet: str, sign: str) -> str:
    """Returns 'rulership' | 'exaltation' | 'detriment' | 'fall' | 'peregrine'."""
    table = RULERSHIPS.get(planet)
    if not table:
        return "peregrine"
    rules = table["rules"]
    if isinstance(rules, tuple) and sign in rules:
        return "rulership"
    if rules == sign:
        return "rulership"
    if table["exalt"] == sign:
        return "exaltation"
    detriment = table["detriment"]
    if isinstance(detriment, tuple) and sign in detriment:
        return "detriment"
    if detriment == sign:
        return "detriment"
    if table["fall"] == sign:
        return "fall"
    return "peregrine"


# ── Aspects ──────────────────────────────────────────────────────────────────

# Major aspects + classical orbs we tighten for "exact" verdicts.
ASPECTS = [
    ("conjunction", 0, 8.0, 1.5),
    ("opposition", 180, 8.0, 1.5),
    ("trine", 120, 6.0, 1.5),
    ("square", 90, 6.0, 1.5),
    ("sextile", 60, 4.0, 1.0),
]

# Lilith — Mean Black Moon Lilith (swe.MEAN_APOG = 12 in Swisseph).
# It's not in the default _planet_bodies set, so we compute it on demand.
LILITH_SWE_ID = 12


@dataclass
class Aspect:
    a: str
    b: str
    kind: str
    orb: float
    exact_within_deg: float  # how close to exact (smaller = tighter)
    is_exact: bool


def angular_distance(a: float, b: float) -> float:
    """Smallest angular gap between two longitudes, 0..180."""
    d = abs(_norm_lon(a) - _norm_lon(b))
    if d > 180.0:
        d = 360.0 - d
    return d


def find_aspects(planets: dict[str, dict], pairs: list[tuple[str, str]]) -> list[Aspect]:
    """Find aspects between specific planet pairs in a chart."""
    out: list[Aspect] = []
    for a, b in pairs:
        if a not in planets or b not in planets:
            continue
        lon_a = float(planets[a]["longitude"])
        lon_b = float(planets[b]["longitude"])
        gap = angular_distance(lon_a, lon_b)
        for name, target, orb_max, exact_threshold in ASPECTS:
            diff = abs(gap - target)
            if diff <= orb_max:
                out.append(
                    Aspect(
                        a=a,
                        b=b,
                        kind=name,
                        orb=round(diff, 2),
                        exact_within_deg=round(diff, 2),
                        is_exact=diff <= exact_threshold,
                    )
                )
                break  # one aspect per pair
    return out


# ── Mars verdict ─────────────────────────────────────────────────────────────


@dataclass
class MarsVerdict:
    """Structured findings about a chart's Mars — feeds the template engine."""
    sign: str
    house: int
    degree: float
    decan: int
    retrograde: bool
    dignity: str  # rulership | exaltation | detriment | fall | peregrine
    aspects: list[Aspect] = field(default_factory=list)
    archetype_keys: list[str] = field(default_factory=list)
    intensity: str = "moderate"  # subtle | moderate | strong | extreme


# Maps Mars sign → archetype key the template layer can localize.
MARS_SIGN_ARCHETYPE = {
    "aries": "warrior",
    "taurus": "slow_burn",
    "gemini": "verbal_seducer",
    "cancer": "tender_predator",
    "leo": "spotlight_lover",
    "virgo": "perfectionist_lover",
    "libra": "diplomat_lover",
    "scorpio": "obsessive_lover",
    "sagittarius": "free_lover",
    "capricorn": "powerful_lover",
    "aquarius": "rebel_lover",
    "pisces": "dream_lover",
}

# Maps Mars house → strategic theme.
MARS_HOUSE_THEME = {
    1: "self_warrior",
    2: "money_drive",
    3: "voice_warrior",
    4: "private_fire",
    5: "creative_fire",
    6: "work_drive",
    7: "partner_attractor",
    8: "deep_intensity",
    9: "global_drive",
    10: "career_warrior",
    11: "social_fire",
    12: "hidden_drive",
}


def build_mars_verdict(natal_planets: dict[str, dict], lilith_lon: Optional[float] = None) -> MarsVerdict:
    """Read everything the template layer needs to know about this chart's Mars."""
    if "mars" not in natal_planets:
        raise ValueError("natal chart missing Mars")
    mars = natal_planets["mars"]
    lon = float(mars["longitude"])
    sign = sign_of(lon)
    house = int(mars.get("house", 1))
    retrograde = bool(mars.get("retrograde", False))
    dignity = essential_dignity("mars", sign)

    # Synthetic lilith entry so find_aspects can include it uniformly.
    planets_for_aspects = dict(natal_planets)
    if lilith_lon is not None:
        planets_for_aspects["lilith"] = {"longitude": lilith_lon, "house": 1}

    pairs = [
        ("mars", "venus"),
        ("mars", "pluto"),
        ("mars", "sun"),
        ("mars", "moon"),
        ("mars", "saturn"),
    ]
    if "lilith" in planets_for_aspects:
        pairs.append(("mars", "lilith"))

    aspects = find_aspects(planets_for_aspects, pairs)

    archetype_keys: list[str] = []
    archetype_keys.append(f"sign:{MARS_SIGN_ARCHETYPE[sign]}")
    if 1 <= house <= 12:
        archetype_keys.append(f"house:{MARS_HOUSE_THEME[house]}")
    if retrograde:
        archetype_keys.append("flag:retrograde")
    if dignity != "peregrine":
        archetype_keys.append(f"dignity:{dignity}")

    # Intensity: heavy aspects with Pluto/Lilith bump it up.
    intensity = "moderate"
    heavy = sum(
        1 for a in aspects
        if a.is_exact and a.b in {"pluto", "lilith"} and a.kind in {"conjunction", "square", "opposition"}
    )
    if heavy >= 2:
        intensity = "extreme"
    elif heavy == 1 or dignity in {"rulership", "exaltation"}:
        intensity = "strong"
    elif dignity in {"detriment", "fall"} and any(a.is_exact for a in aspects):
        intensity = "strong"

    return MarsVerdict(
        sign=sign,
        house=house,
        degree=round(degree_in_sign(lon), 2),
        decan=decan_of(lon),
        retrograde=retrograde,
        dignity=dignity,
        aspects=aspects,
        archetype_keys=archetype_keys,
        intensity=intensity,
    )


def verdict_to_dict(v: MarsVerdict) -> dict:
    return {
        "sign": v.sign,
        "house": v.house,
        "degree": v.degree,
        "decan": v.decan,
        "retrograde": v.retrograde,
        "dignity": v.dignity,
        "intensity": v.intensity,
        "archetype_keys": v.archetype_keys,
        "aspects": [
            {
                "a": a.a,
                "b": a.b,
                "kind": a.kind,
                "orb": a.orb,
                "is_exact": a.is_exact,
            }
            for a in v.aspects
        ],
    }
