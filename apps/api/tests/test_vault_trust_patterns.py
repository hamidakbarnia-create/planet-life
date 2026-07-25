"""Shadow Room Trust Patterns — behavioral safety + distinct scoring."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import (  # noqa: E402
    _RADAR_DIM_PLANETS,
    _TRUST_DIM_PLANETS,
    _TRUST_PLANET_ROLES,
    cheating_radar_reading,
    trust_patterns_reading,
)

_BASE = dict(
    birth_date="1990-06-15",
    birth_time="14:30",
    location="51.5074,-0.1278",
)

_PARTNER = dict(
    partner_birth_date="1988-03-20",
    partner_birth_time="09:15",
    partner_location="40.7128,-74.0060",
)

_CONF = {"high": 2, "medium": 1, "low": 0}

_TRUST_KEYS = tuple(_TRUST_DIM_PLANETS.keys())

_VERDICT_RE = re.compile(
    "|".join(
        [
            r"\bis loyal\b",
            r"\bis disloyal\b",
            r"\bis dishonest\b",
            r"\bis trustworthy\b",
            r"\bis untrustworthy\b",
            r"\bis betraying\b",
            r"\bare betraying\b",
            r"\bdefinitely betray",
            r"\bis hiding\b",
            r"\bverified (?:loyalty|dishonesty|betrayal|secrecy)\b",
            r"وفادار است",
            r"نادرست است",
            r"خیانت‌کار است",
            r"قابل اعتماد است",
            r"\bон верен\b",
            r"\bона верна\b",
            r"неверен\b",
            r"нечестен\b",
            r"предаёт\b",
            r"هو مخلص\b",
            r"هي مخلصة\b",
            r"غير أمين\b",
            r"جدير بالثقة كحقيقة",
            r"يخون\b",
        ]
    ),
    re.I,
)


def _blob(payload: dict) -> str:
    r = payload["reading"]
    parts = [
        str(r.get(k) or "")
        for k in (
            "executive",
            "strategic",
            "technical",
            "explanation",
            "headline",
            "action",
        )
    ]
    for key in ("observed", "inferred", "unknown"):
        parts.extend(str(x) for x in payload.get(key) or [])
    return " ".join(parts)


def test_not_renamed_cheating_radar():
    assert set(_TRUST_DIM_PLANETS) != set(_RADAR_DIM_PLANETS)
    trust = trust_patterns_reading(**_BASE, **_PARTNER, lang="en")
    radar = cheating_radar_reading(**_BASE, **_PARTNER, lang="en")
    assert set(trust["signals"]) == set(_TRUST_DIM_PLANETS)
    assert set(radar["signals"]) == set(_RADAR_DIM_PLANETS)
    assert "repair_opportunities" in trust["signals"]
    assert "secrecy_avoidance" not in trust["signals"]
    assert trust["planet"] == "trust"
    assert radar["planet"] == "radar"


def test_separate_planet_roles_moon_mercury_venus_jupiter_saturn():
    payload = trust_patterns_reading(**_BASE, **_PARTNER, lang="en")
    roles = payload["planet_roles"]
    assert set(roles) == {"moon", "mercury", "venus", "jupiter", "saturn"}
    assert roles["moon"]["role"] == "emotional_consistency_safety"
    assert roles["mercury"]["role"] == "communication_clarity_follow_through"
    assert roles["venus"]["role"] == "reciprocity_relational_ease"
    assert roles["jupiter"]["role"] == "goodwill_repair_capacity"
    assert roles["saturn"]["role"] == "boundaries_reliability_pressure_durability"
    # Distinct role strings — not one shared label.
    assert len({roles[p]["role"] for p in roles}) == 5
    strategic = payload["reading"]["strategic"]
    assert "moon:emotional_consistency_safety" in strategic
    assert "saturn:boundaries_reliability_pressure_durability" in strategic


def test_no_deterministic_loyalty_verdict_all_langs():
    for lang in ("en", "fa", "ar", "ru"):
        self_only = trust_patterns_reading(
            **_BASE, lang=lang, relationship_type="romantic"
        )
        with_partner = trust_patterns_reading(
            **_BASE, **_PARTNER, lang=lang, relationship_type="marriage"
        )
        for payload in (self_only, with_partner):
            text = _blob(payload)
            assert not _VERDICT_RE.search(text), f"{lang}: {text}"
            assert payload["verdict"]["claim"] == "patterns_only_never_verdict"
            assert "verdict=never" in payload["reading"]["technical"]


def test_changing_second_person_changes_inferred_patterns():
    a = trust_patterns_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="romantic"
    )
    b = trust_patterns_reading(
        **_BASE,
        lang="en",
        relationship_type="romantic",
        partner_birth_date="1995-11-02",
        partner_birth_time="18:45",
        partner_location="35.6762,139.6503",
    )
    assert a["mode"] == "synastry" and b["mode"] == "synastry"
    assert (
        a["signals"] != b["signals"]
        or a["planet_roles"] != b["planet_roles"]
        or a["inferred"] != b["inferred"]
    )


def test_relationship_type_changes_weighting_or_output():
    romantic = trust_patterns_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="romantic"
    )
    business = trust_patterns_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="business"
    )
    assert romantic["profile_key"] == "romantic_partner"
    assert business["profile_key"] == "business_partner"
    assert (
        romantic["signals"] != business["signals"]
        or romantic["planet_roles"] != business["planet_roles"]
        or romantic["reading"]["executive"] != business["reading"]["executive"]
    )


def test_missing_second_person_self_pattern_and_unknown():
    payload = trust_patterns_reading(**_BASE, lang="en", relationship_type="friendship")
    assert payload["mode"] == "self"
    assert "partner_birth_date" in payload["missing_inputs"]
    assert any("self-pattern" in str(x) for x in payload["inferred"])
    assert payload["unknown"]
    assert payload["questions"]
    for key in _TRUST_KEYS:
        assert payload["signals"][key]["band"] == "unknown"
        assert payload["signals"][key]["layer"] == "unknown"
    for planet in _TRUST_PLANET_ROLES:
        assert payload["planet_roles"][planet]["layer"] == "unknown"
    assert "unknown" in payload["reading"]["executive"].lower()


def test_concern_is_observed_input_not_verified_fact():
    concern = "distance feels sharp this week"
    payload = trust_patterns_reading(
        **_BASE,
        **_PARTNER,
        lang="en",
        relationship_type="romantic",
        concern=concern,
    )
    exec_text = payload["reading"]["executive"]
    assert "Observed:" in exec_text
    assert "Inferred:" in exec_text
    assert "Unknown:" in exec_text
    assert "observed input" in exec_text.lower()
    assert "verified fact" not in exec_text.lower()
    assert any("concern" in str(o).lower() for o in payload["observed"])


def test_missing_birth_time_lowers_confidence():
    with_time = trust_patterns_reading(
        **_BASE,
        **_PARTNER,
        lang="en",
        relationship_type="romantic",
        user_birth_time_known=True,
        partner_birth_time_known=True,
    )
    missing_time = trust_patterns_reading(
        **_BASE,
        **_PARTNER,
        lang="en",
        relationship_type="romantic",
        user_birth_time_known=False,
        partner_birth_time_known=False,
    )
    assert missing_time["reading"]["confidence"] == "low"
    assert "exact_birth_time" in missing_time["missing_inputs"]
    if with_time["reading"]["confidence"] != "low":
        assert (
            _CONF[missing_time["reading"]["confidence"]]
            < _CONF[with_time["reading"]["confidence"]]
        )


def test_localized_output_exists():
    for lang in ("en", "fa", "ar", "ru"):
        payload = trust_patterns_reading(
            **_BASE, lang=lang, relationship_type="business"
        )
        assert payload["reading"]["executive"]
        assert payload["reading"]["strategic"]
        assert "moon,mercury,venus,jupiter,saturn" in payload["reading"]["technical"]
