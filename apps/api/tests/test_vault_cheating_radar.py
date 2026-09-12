"""Shadow Room Cheating Radar — safety: signals only, never verdicts."""

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

from services.vault_readings import cheating_radar_reading  # noqa: E402

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

# Deterministic verdict / fact-claim phrases across EN/FA/AR/RU.
_VERDICT_RE = re.compile(
    "|".join(
        [
            r"\bis cheating\b",
            r"\bare cheating\b",
            r"\bdefinitely cheating\b",
            r"\bcaught cheating\b",
            r"\bis lying\b",
            r"\bare lying\b",
            r"\bis loyal\b",
            r"\bis disloyal\b",
            r"\bis hiding\b",
            r"\bare hiding\b",
            r"\bbetray(?:s|ed|al)\b",
            r"\bproven secrecy\b",
            r"\bverified (?:cheating|lying|loyalty|betrayal|secrecy)\b",
            r"خیانت می‌کند",
            r"دروغ می‌گوید",
            r"وفادار است",
            r"خیانت‌کار است",
            r"پنهان می‌کند",
            r"изменяет\b",
            r"лж[её]т\b",
            r"верен\b",
            r"неверен\b",
            r"скрывает\b",
            r"предаёт\b",
            r"يخون\b",
            r"يكذب\b",
            r"مخلص\b",
            r"غير مخلص\b",
            r"يخفي شيئاً كحقيقة",
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
    parts.extend(str(x) for x in payload.get("observed") or [])
    parts.extend(str(x) for x in payload.get("inferred") or [])
    parts.extend(str(x) for x in payload.get("unknown") or [])
    return " ".join(parts)


def test_no_deterministic_verdict_all_langs():
    for lang in ("en", "fa", "ar", "ru"):
        self_only = cheating_radar_reading(
            **_BASE, lang=lang, relationship_type="romantic"
        )
        with_partner = cheating_radar_reading(
            **_BASE,
            **_PARTNER,
            lang=lang,
            relationship_type="marriage",
        )
        for payload in (self_only, with_partner):
            text = _blob(payload)
            assert not _VERDICT_RE.search(text), f"{lang}: {text}"
            assert payload["verdict"]["claim"] == "signals_only_never_verdict"
            assert "verdict=never" in payload["reading"]["technical"]


def test_missing_second_person_unknown_and_verification():
    payload = cheating_radar_reading(**_BASE, lang="en", relationship_type="romantic")
    assert payload["mode"] == "self"
    assert "partner_birth_date" in payload["missing_inputs"]
    assert payload["unknown"] == [
        "partner synastry trust signals — unknown without second chart"
    ]
    assert payload["reading"]["unknown"] == payload["unknown"]
    assert payload["reading"]["limitation"] not in payload["unknown"]
    assert payload["behaviors"]
    assert payload["questions"]
    for key in (
        "trust_pressure",
        "communication_ambiguity",
        "emotional_withdrawal",
        "secrecy_avoidance",
    ):
        assert payload["signals"][key]["band"] == "unknown"
        assert payload["signals"][key]["layer"] == "unknown"
    exec_l = payload["reading"]["executive"].lower()
    assert "actual behavior and fidelity are unknown" in payload["reading"]["limitation"].lower()
    assert "verify" in exec_l


def test_missing_partner_unknown_stays_out_of_limitation_and_has_no_invented_scores():
    payload = cheating_radar_reading(**_BASE, lang="en", relationship_type="romantic")
    reading = payload["reading"]
    assert payload["unknown"] == [
        "partner synastry trust signals — unknown without second chart"
    ]
    assert reading["unknown"] == payload["unknown"]
    assert reading["limitation"] not in payload["unknown"]
    values = [row["value"] for row in reading.get("details") or []]
    assert "partner synastry trust signals — unknown without second chart" in values
    assert not any(str(value).endswith("/100") for value in values)
    fa = cheating_radar_reading(**_BASE, lang="fa", relationship_type="romantic")
    assert "برای شما" in " ".join(fa["questions"])
    assert "برایت" not in " ".join(fa["questions"])
    assert fa["reading"]["action"].startswith("برداشت خود را")


def test_supplied_partner_does_not_copy_limitation_into_unknown():
    payload = cheating_radar_reading(
        **_BASE, **_PARTNER, lang="en", relationship_type="romantic"
    )
    assert payload["mode"] == "synastry"
    assert payload["reading"]["limitation"] not in (payload["unknown"] or [])
    assert "actual behavior and fidelity are unknown" in payload["reading"]["limitation"].lower()


def test_observed_concern_not_presented_as_verified_fact():
    concern = "distance feels sharp this week"
    payload = cheating_radar_reading(
        **_BASE,
        **_PARTNER,
        lang="en",
        relationship_type="romantic",
        concern=concern,
    )
    exec_text = payload["reading"]["executive"]
    assert payload["observed"] == []
    assert "actual behavior and fidelity are unknown" in payload["reading"]["limitation"].lower()
    assert "observable behavior" in exec_text.lower()
    assert "direct, calm conversation" in exec_text.lower()
    assert concern not in exec_text
    assert payload["reading"]["confidence_basis"] == "unvalidated_symbolic_guidance"
    assert not re.search(r"\bverified\b.*\b" + re.escape(concern), exec_text, re.I)


def test_missing_partner_birth_time_changes_completeness_not_evidence_status():
    with_time = cheating_radar_reading(
        **_BASE,
        **_PARTNER,
        lang="en",
        relationship_type="romantic",
        user_birth_time_known=True,
        partner_birth_time_known=True,
    )
    missing_partner_time = cheating_radar_reading(
        **_BASE,
        **_PARTNER,
        lang="en",
        relationship_type="romantic",
        user_birth_time_known=True,
        partner_birth_time_known=False,
    )
    assert "exact_birth_time" in missing_partner_time["missing_inputs"]
    assert with_time["reading"]["data_completeness"] == "supplied_unverified"
    assert missing_partner_time["reading"]["data_completeness"] == "incomplete"
    assert with_time["reading"]["evidence_status"] == missing_partner_time["reading"]["evidence_status"] == "unvalidated"
