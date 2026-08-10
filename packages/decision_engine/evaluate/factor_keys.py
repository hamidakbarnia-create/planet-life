"""Deterministic semantic factor keys from structured reason evidence.

Keys are localization handles — not display prose and not scoring inputs.
Unknown or under-specified shapes return None (fail closed).
"""

from __future__ import annotations

import re
from typing import Any, Mapping

_TOKEN_RE = re.compile(r"[^a-z0-9]+")

# Aspect names emitted by scoring technical.aspects_evaluated.
_KNOWN_ASPECTS = frozenset(
    {
        "conjunction",
        "opposition",
        "trine",
        "square",
        "sextile",
        "quincunx",
        "semisextile",
        "semisquare",
        "sesquiquadrate",
    }
)

_KNOWN_ANGLES = frozenset({"asc", "dsc", "mc", "ic"})

_KNOWN_LOCATION_MODES = frozenset(
    {
        "birthonly",
        "currentliving",
        "eventlocation",
        "targetsubject",
        "birthandtarget",
    }
)


def normalize_factor_token(value: Any) -> str | None:
    """Normalize an identifier to a stable lowercase ASCII token."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if isinstance(value, float) and not value.is_integer():
            return None
        return str(int(value))
    text = str(value).strip().lower().replace("-", "_")
    if not text:
        return None
    text = _TOKEN_RE.sub("_", text).strip("_")
    return text or None


def build_factor_key(
    evidence: Mapping[str, Any] | None,
    category: str | None,
) -> str | None:
    """Build an optional factor_key from structured reason evidence.

    Does not parse titles. Does not include scores, orbs, ordinals, or locations.
    """
    if not isinstance(evidence, Mapping):
        return None
    cat = normalize_factor_token(category)
    if not cat:
        return None

    try:
        if cat == "aspect":
            return _key_aspect(evidence)
        if cat == "house":
            return _key_house(evidence)
        if cat == "angular":
            return _key_angular(evidence)
        if cat == "retrograde":
            return _key_retrograde(evidence)
        if cat == "electional_timing":
            return _key_electional(evidence)
    except Exception:
        return None
    return None


def _key_aspect(evidence: Mapping[str, Any]) -> str | None:
    transit = normalize_factor_token(evidence.get("transit_planet"))
    natal = normalize_factor_token(evidence.get("natal_planet"))
    aspect = normalize_factor_token(evidence.get("aspect"))
    if not transit or not natal or not aspect:
        return None
    if aspect not in _KNOWN_ASPECTS:
        return None
    return f"aspect.{transit}.{aspect}.{natal}"


def _key_house(evidence: Mapping[str, Any]) -> str | None:
    scope = normalize_factor_token(evidence.get("scope"))
    planet = normalize_factor_token(evidence.get("planet"))
    house = normalize_factor_token(evidence.get("house"))
    if scope not in {"natal", "transit"} or not planet or not house:
        return None
    try:
        house_n = int(house)
    except ValueError:
        return None
    if house_n < 1 or house_n > 12:
        return None
    key = f"house.{scope}.{planet}.{house_n}"
    if evidence.get("retrograde") is True:
        key = f"{key}.retrograde"
    return key


def _key_angular(evidence: Mapping[str, Any]) -> str | None:
    planet = normalize_factor_token(evidence.get("planet"))
    angle = normalize_factor_token(evidence.get("angle"))
    if not planet or not angle or angle not in _KNOWN_ANGLES:
        return None
    return f"angular.{planet}.{angle}"


def _key_retrograde(evidence: Mapping[str, Any]) -> str | None:
    planet = normalize_factor_token(evidence.get("planet"))
    if not planet:
        return None
    if evidence.get("retrograde") is not True and not evidence.get("primary_ruler"):
        # Still allow planet-only when category is retrograde and planet present.
        pass
    return f"retrograde.{planet}"


def _key_electional(evidence: Mapping[str, Any]) -> str | None:
    # Free-text timing notes are not catalog-stable.
    if evidence.get("timing_note"):
        return None
    mode = normalize_factor_token(evidence.get("location_mode"))
    if not mode or mode not in _KNOWN_LOCATION_MODES:
        return None
    # Do not embed calculated_for / timezone (location strings).
    return f"electional.location_mode.{mode}"


__all__ = [
    "build_factor_key",
    "normalize_factor_token",
]
