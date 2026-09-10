"""Vault safety contract through real API routes, with no providers or persistence.

Unlike the chronology edge fixtures, the six-endpoint synthetic probes use actual
Swiss Ephemeris/scoring and repeat/variation comparisons. The ASGI app contains
only the Vault router; no production requests or background servers are needed.
"""
from __future__ import annotations

from datetime import date
import builtins
import json
from pathlib import Path
import socket
import sqlite3
import sys

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(ROOT / "apps/api/src"), str(ROOT)]
from routes.vault import router  # noqa: E402
from services import vault_readings as vr  # noqa: E402
from packages.astro_engine import vault_templates as templates  # noqa: E402

LANGS = ("en", "ru", "fa", "ar")
ENDPOINTS = ("yes-day", "ghost-days", "cheating-radar", "mars", "money-ask-days", "communication-risk")
PAIR = {"cheating-radar", "communication-risk"}
# VAULT-AUDIT-SYNTHETIC-PRIMARY / VAULT-AUDIT-SYNTHETIC-PARTNER.
PRIMARY = dict(birth_date="1990-06-15", birth_time="12:00", location="51.5074,-0.1278")
PARTNER = dict(partner_birth_date="1992-03-20", partner_birth_time="09:30", partner_location="48.8566,2.3522", relationship_type="romantic")
PROHIBITED = (
    "clear enough to act on", "avoid explaining the silence", "distance works better than explanation",
    "pull back hardest", "pull to rebuild", "money sky is open", "your sexuality is",
    "your desire ignites", "cheating likelihood", "detected secrecy", "loyalty indication",
    "clarity risk risk", "repair capacity: elevated",
    "بیشترین عقب‌نشینی", "فاصله بهتر از توضیح", "کشش خودش برگردد", "جنسیتت تحول",
    "میلت سریع روشن", "برای عمل کافی است", "آسمان پول باز",
    "максимальная дистанция", "дистанция работает лучше объяснений", "притяжение вернулось само",
    "сексуальность трансформационная", "желание вспыхивает быстро", "достаточно для действия",
    "المسافة هنا أنجع من الشرح", "ليعود الجذب وحده", "جنسيتكِ تحويلية", "رغبتكِ تشتعل بسرعة",
    "كافية للتصرف", "أقصى انسحاب",
)
INDEPENDENT = {"en": "Independent symbolic windows", "ru": "Независимые символические окна", "fa": "پنجره‌های نمادین مستقل", "ar": "نوافذ رمزية مستقلة"}
UNKNOWN = {"en": "Actual behavior and fidelity are unknown", "ru": "Реальное поведение и верность неизвестны", "fa": "رفتار واقعی و وفاداری نامشخص‌اند", "ar": "السلوك الفعلي والوفاء غير معروفين"}
REPAIR = {"en": "Repair difficulty", "ru": "Трудность восстановления", "fa": "دشواری ترمیم", "ar": "صعوبة الإصلاح"}


@pytest.fixture(autouse=True)
def forbid_side_effects(monkeypatch):
    class AuditDate(date):
        @classmethod
        def today(cls):
            return cls(2026, 9, 10)

    monkeypatch.setattr(vr, "date", AuditDate)

    def forbidden(*args, **kwargs):
        raise AssertionError("Vault safety probe attempted network, persistence or Pathfinder compute")

    monkeypatch.setattr(socket, "create_connection", forbidden)
    monkeypatch.setattr(sqlite3, "connect", forbidden)
    monkeypatch.setattr(vr, "relocation_reading", forbidden)
    from geopy.geocoders import Nominatim
    monkeypatch.setattr(Nominatim, "geocode", forbidden)
    original_import = builtins.__import__

    def guarded_import(name, *args, **kwargs):
        if name.split(".")[0] in {"openai", "anthropic", "psycopg", "psycopg2"} or name.startswith("services.generation"):
            forbidden()
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", guarded_import)


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router, prefix="/api/vault")
    with TestClient(app) as client:
        yield client


def probe(client, endpoint, lang, **change):
    body = {**PRIMARY, **(PARTNER if endpoint in PAIR else {}), "lang": lang, **change}
    response = client.post("/api/vault/" + endpoint, json=body)
    assert response.status_code == 200, response.text
    return response.json()


def assert_safe(payload):
    text = json.dumps(payload, ensure_ascii=False).lower()
    for phrase in PROHIBITED:
        assert phrase not in text, phrase
    reading = payload["reading"]
    assert reading["evidence_status"] == "unvalidated"
    assert reading["confidence_basis"] == "unvalidated_symbolic_guidance"
    assert reading["confidence_explanation"]
    assert reading["limitation"]
    assert reading["data_completeness"] == "supplied_unverified"


@pytest.mark.parametrize("endpoint", ENDPOINTS)
@pytest.mark.parametrize("lang", LANGS)
def test_synthetic_api_repeat_variation_and_localized_safety(client, endpoint, lang):
    original = probe(client, endpoint, lang)
    repeated = probe(client, endpoint, lang)
    changed = probe(client, endpoint, lang, **{("partner_birth_date" if endpoint in PAIR else "birth_date"): "1981-12-01"})
    assert original == repeated
    for result in (original, changed):
        assert_safe(result)
    # Relevant calculated fields must change, not only wording or input echoes.
    field = "signals" if endpoint in PAIR else "verdict"
    assert original[field] != changed[field]
    if endpoint == "yes-day":
        for result in (original, changed):
            assert result["reading"]["window_relationship"] == "independent"
            assert INDEPENDENT[lang] in result["reading"]["headline"]
            assert all(result["verdict"][slot]["confidence"] in {"low", "medium", "high"} for slot in ("ask", "commit", "sign"))  # Legacy enum compatibility only.
    if endpoint == "cheating-radar":
        assert UNKNOWN[lang] in original["reading"]["limitation"]
        assert original["observed"] == []
        assert original["reading"]["observed"] == []
        assert "secrecy_avoidance" in original["signals"]  # Stable legacy key, not visible label.
        assert original["signals"]["secrecy_avoidance"]["meaning"] == "symbolic_reflection_weight_not_behavior"
    if endpoint == "communication-risk":
        assert REPAIR[lang] in original["reading"]["executive"]
        assert original["signals"]["repair_capacity"]["meaning"] == "repair_difficulty"


@pytest.mark.parametrize("lang", LANGS)
@pytest.mark.parametrize("dates", [
    ("2026-09-12", "2026-09-11"),  # Sign before ask: independent, not a sequence.
    ("2026-09-12", "2026-09-12"),  # Same-day maxima do not require same-day action.
    ("2026-09-11", "2026-09-13"),  # Chronological maxima are still independent.
])
def test_yes_day_api_independent_window_invariant(client, monkeypatch, lang, dates):
    def windows(*, action_type, **kwargs):
        d = dates[0] if action_type == "negotiation" else dates[1]
        return [{"date": d, "score": 85, "rating": "Favorable", "confidence": "low", "action_type": action_type}]
    monkeypatch.setattr(vr, "_calendar_day_windows", windows)
    result = probe(client, "yes-day", lang)
    assert result["verdict"]["ask"]["date"] == dates[0]
    assert result["verdict"]["sign"]["date"] == dates[1]
    assert result["verdict"]["window_relationship"] == "independent"
    assert INDEPENDENT[lang] in result["reading"]["headline"]
    assert "then hold terms" not in result["reading"]["action"]
    assert "sequence the ask" not in result["reading"]["strategic"]


@pytest.mark.parametrize("lang", LANGS)
def test_money_api_maximum_score_is_not_outcome_probability(client, monkeypatch, lang):
    monkeypatch.setattr(vr, "score_with_context", lambda **kwargs: ({"executive": {"score": 100, "rating": "Highly Favorable"}}, {}, {}))
    result = probe(client, "money-ask-days", lang)
    assert result["windows"][0]["score"] == 100
    reading = result["reading"]
    assert "100/100" in reading["limitation"]
    assert reading["limitation"] not in reading["executive"]
    assert reading["limitation"] not in reading["strategic"]
    assert reading["evidence_status"] == "unvalidated"
    assert reading["intensity"] == "strong"


@pytest.mark.parametrize("score,expected", [(30,"elevated"),(50,"moderate"),(75,"low")])
@pytest.mark.parametrize("lang", LANGS)
def test_communication_api_repair_difficulty_polarity(client, monkeypatch, score, expected, lang):
    monkeypatch.setattr(vr, "_score_compat_dimension", lambda *args: {"score": score, "hits": 2, "band": "mixed"})
    result = probe(client, "communication-risk", lang)
    signal = result["signals"]["repair_capacity"]
    assert signal["band"] == expected
    assert signal["meaning"] == "repair_difficulty"
    assert REPAIR[lang] in result["reading"]["strategic"]
    assert result["reading"]["evidence_status"] == "unvalidated"


@pytest.mark.parametrize("endpoint", sorted(PAIR))
@pytest.mark.parametrize("lang", LANGS)
def test_input_completeness_separate_from_reliability(client, endpoint, lang):
    complete = probe(client, endpoint, lang)
    incomplete = probe(client, endpoint, lang, partner_birth_time=None, partner_birth_time_known=False)
    assert complete["reading"]["data_completeness"] == "supplied_unverified"
    assert incomplete["reading"]["data_completeness"] == "incomplete"
    assert "exact_birth_time" in incomplete["missing_inputs"]
    assert complete["reading"]["evidence_status"] == incomplete["reading"]["evidence_status"] == "unvalidated"


@pytest.mark.parametrize("lang", LANGS)
def test_all_mars_template_branches_are_optional_reflections(lang):
    for index, sign_key in enumerate(templates.SIGN_COPY):
        house_key = list(templates.HOUSE_COPY)[index]
        for dignity in templates.DIGNITY_COPY:
            reading = templates.render_mars_reading({
                "archetype_keys": ["sign:" + sign_key, "house:" + house_key],
                "sign": "aries", "house": index + 1, "intensity": "extreme",
                "dignity": dignity, "retrograde": True,
                "aspects": [{"a": "mars", "b": "venus", "kind": "conjunction", "orb": 0}],
            }, lang=lang)
            for phrase in PROHIBITED:
                assert phrase not in json.dumps(reading, ensure_ascii=False).lower()
            assert reading["limitation"] == templates._DESIRE_LIMITATION[lang]
            assert reading["evidence_status"] == "unvalidated"


@pytest.mark.parametrize("endpoint", ("ghost-days", "money-ask-days"))
@pytest.mark.parametrize("lang", LANGS)
def test_ranked_window_structure_and_evidence_independent_of_score(client, monkeypatch, endpoint, lang):
    readings = []
    for score in (20, 100):
        monkeypatch.setattr(vr, "score_with_context", lambda **kwargs: ({"executive": {"score": score, "rating": "Good"}}, {}, {}))
        payload = probe(client, endpoint, lang)
        reading = payload["reading"]
        readings.append(reading)
        assert reading["strongest_window"] == payload["windows"][0]
        assert reading["secondary_windows"] == payload["windows"][1:5]
        assert len(reading["secondary_windows"]) == 4
        assert all(w["date"] not in reading["headline"] for w in payload["windows"])
        assert reading["interpretation"] and reading["action"] and reading["avoid"]
        assert reading["limitation"] not in reading["executive"]
        assert reading["limitation"] not in reading["strategic"]
        assert_safe(payload)
    assert readings[0]["intensity"] != readings[1]["intensity"]
    assert readings[0]["evidence_status"] == readings[1]["evidence_status"] == "unvalidated"
    assert readings[0]["data_completeness"] == readings[1]["data_completeness"] == "supplied_unverified"


@pytest.mark.parametrize("lang", LANGS)
def test_mars_api_placements_have_distinct_visible_interpretations(client, lang):
    first = probe(client, "mars", lang)
    second = probe(client, "mars", lang, birth_date="1981-12-01")
    assert first["verdict"]["sign"] != second["verdict"]["sign"]
    for payload in (first, second):
        reading = payload["reading"]
        assert_safe(payload)
        verdict = payload["verdict"]
        for prefix, mapping in (("sign", templates.SIGN_COPY), ("house", templates.HOUSE_COPY)):
            key = templates._archetype_from_keys(verdict["archetype_keys"], prefix)
            assert mapping[key][lang] in reading["interpretation"]
        if verdict.get("dignity") in templates.DIGNITY_COPY:
            assert templates.DIGNITY_COPY[verdict["dignity"]][lang] in reading["interpretation"]
        assert reading["limitation"] not in reading["strategic"]
    assert first["reading"]["interpretation"] != second["reading"]["interpretation"]


@pytest.mark.parametrize("lang", LANGS)
def test_every_mars_symbolic_theme_is_distinct_and_non_categorical(lang):
    for mapping in (templates.SIGN_COPY, templates.HOUSE_COPY, templates.DIGNITY_COPY, templates.ASPECT_SNIPPETS):
        interpretations = [item[lang] for item in mapping.values()]
        assert len(set(interpretations)) == len(interpretations)
        for text in interpretations:
            assert {"en": "symbolic", "ru": "символическ", "fa": "نماد", "ar": "رمز"}[lang] in text
            assert not any(phrase in text.lower() for phrase in PROHIBITED)


@pytest.mark.parametrize("endpoint", ENDPOINTS)
@pytest.mark.parametrize("lang", LANGS)
def test_api_limitation_is_structured_not_duplicated_in_prose(client, endpoint, lang):
    reading = probe(client, endpoint, lang)["reading"]
    assert reading["limitation"] not in reading["executive"]
    assert reading["limitation"] not in reading["strategic"]
    # Public field retained for old clients; its particular value is not the
    # evidence contract. New clients use evidence_status, not this enum.
    assert reading["confidence"] in {"low", "medium", "high"}


def test_web_mars_fixtures_match_actual_synthetic_api_responses(client):
    fixture = json.loads((ROOT / "apps/web/components/vault/fixtures/mars-symbolic-api.json").read_text())
    assert fixture == [
        probe(client, "mars", "en")["reading"],
        probe(client, "mars", "en", birth_date="1981-12-01")["reading"],
    ]
