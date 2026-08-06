"""Shadow Room Communication Risk — risk bands, never lying/abuse verdicts."""

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
    _comm_risk_band,
    communication_risk_reading,
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

_VERDICT_RE = re.compile(
    "|".join(
        [
            r"\bis lying\b",
            r"\bare lying\b",
            r"\bis manipulating\b",
            r"\bis abusive\b",
            r"\bis silent\b",
            r"\bis avoidant\b",
            r"\bis deceptive\b",
            r"\bdiagnosed\b",
            r"\bverified (?:lying|manipulation|abuse)\b",
            r"دروغ می‌گوید",
            r"دستکاری می‌کند",
            r"آزارگر است",
            r"лж[её]т\b",
            r"манипулирует\b",
            r"насильник\b",
            r"يكذب كحقيقة",
            r"يتلاعب كحقيقة",
            r"مؤذٍ كحقيقة",
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


def test_changing_second_person_changes_risk_output():
    a = communication_risk_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="romantic"
    )
    b = communication_risk_reading(
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
    romantic = communication_risk_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="romantic"
    )
    business = communication_risk_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="business"
    )
    assert romantic["profile_key"] == "romantic_partner"
    assert business["profile_key"] == "business_partner"
    assert (
        romantic["signals"] != business["signals"]
        or romantic["planet_roles"] != business["planet_roles"]
        or romantic["reading"]["executive"] != business["reading"]["executive"]
    )


def test_harmony_and_tension_produce_different_risk_bands():
    assert _comm_risk_band({"hits": 2, "score": 75}) == "low"
    assert _comm_risk_band({"hits": 2, "score": 30}) == "elevated"
    assert _comm_risk_band({"hits": 2, "score": 50}) == "moderate"
    assert _comm_risk_band({"hits": 0, "score": None}) == "unknown"
    payload = communication_risk_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="marriage"
    )
    bands = {s.get("band") for s in payload["signals"].values()}
    assert bands & {"low", "moderate", "elevated", "unknown"}


def test_missing_second_person_self_pattern_and_unknown():
    payload = communication_risk_reading(
        **_BASE, lang="en", relationship_type="friendship"
    )
    assert payload["mode"] == "self"
    assert "partner_birth_date" in payload["missing_inputs"]
    assert any("self-pattern" in str(x) for x in payload["inferred"])
    assert payload["unknown"]
    for key in (
        "clarity_risk",
        "misunderstanding_risk",
        "emotional_reactivity",
        "avoidance_silence",
        "escalation_risk",
        "repair_capacity",
    ):
        assert payload["signals"][key]["band"] == "unknown"
    assert "unknown" in payload["reading"]["executive"].lower()


def test_missing_birth_time_lowers_confidence():
    with_time = communication_risk_reading(
        **_BASE,
        **_PARTNER,
        lang="en",
        relationship_type="romantic",
        user_birth_time_known=True,
        partner_birth_time_known=True,
    )
    missing_time = communication_risk_reading(
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


def test_no_deterministic_lying_manipulation_abuse_verdict_all_langs():
    for lang in ("en", "fa", "ar", "ru"):
        self_only = communication_risk_reading(
            **_BASE, lang=lang, relationship_type="romantic"
        )
        with_partner = communication_risk_reading(
            **_BASE, **_PARTNER, lang=lang, relationship_type="marriage"
        )
        for payload in (self_only, with_partner):
            text = _blob(payload)
            assert not _VERDICT_RE.search(text), f"{lang}: {text}"
            assert payload["verdict"]["claim"] == "risk_patterns_only_never_verdict"
            assert "verdict=never" in payload["reading"]["technical"]


def test_localized_output_exists():
    for lang in ("en", "fa", "ar", "ru"):
        payload = communication_risk_reading(
            **_BASE, lang=lang, relationship_type="business"
        )
        assert payload["reading"]["executive"]
        assert payload["reading"]["strategic"]
        assert "mercury,moon,mars,saturn,jupiter,venus" in payload["reading"]["technical"]
