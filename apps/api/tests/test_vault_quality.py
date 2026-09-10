"""Real synthetic Vault API outputs: symbolic safety, completeness and variation.

Coordinates keep computation local. Relocation is the existing pure Vault
ranking dependency; neither Pathfinder Analyze nor Best Times is invoked.
"""
from datetime import date
import builtins
import json
from pathlib import Path
import socket
import sqlite3
import sys
import re

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(ROOT / "apps/api/src"), str(ROOT)]
from routes.vault import router
from services import vault_readings as vr
from services import pathfinder
from packages.astro_engine import vault_templates as templates

LANGS = ("en", "ru", "fa", "ar")
ENDPOINTS = ("hot-attraction-days", "todays-color", "todays-perfume", "date-outfit",
             "live-reel-time", "best-countries", "business-geography", "partner-profile",
             "compatibility", "trust-patterns")
PRIMARY = dict(birth_date="1990-06-15", birth_time="12:00", location="51.5074,-0.1278",
               evaluation_timezone="Europe/London", target_date="2026-09-10")
PARTNER = dict(partner_birth_date="1992-03-20", partner_birth_time="09:30", partner_location="48.8566,2.3522")
PROHIBITED = ("selective silence", "show up for heat", "clear enough to act on", "usable signal",
              "peaks for reach", "oriental overload", "if ignored", "watch for overreach",
              "use the sketch as a filter", "advisory confidence", "your sexuality is",
              "your partner is", "you are compatible", "will attract", "will succeed",
              "молчание по выбору", "достаточно для действия", "ваш партнёр верен",
              "سکوت گزینشی", "برای عمل کافی است", "طرف مقابل وفادار است",
              "الصمت الانتقائي", "كافية للتصرف", "الشريك وفي",
              "high confidence", "predictive confidence: high", "guarantees success",
              "avoid explaining the silence", "distance works better than explanation", "pull back hardest",
              "гарантирует успех", "высокая уверенность в прогнозе", "не объясняйте молчание",
              "موفقیت را تضمین", "اطمینان پیش‌بینی بالا", "سکوت را توضیح ندهید",
              "يضمن النجاح", "ثقة تنبؤية عالية", "لا تشرح الصمت")

@pytest.fixture(autouse=True)
def no_side_effects(monkeypatch):
    class FixedDate(date):
        @classmethod
        def today(cls): return cls(2026, 9, 10)
    monkeypatch.setattr(vr, "date", FixedDate)
    def forbidden(*args, **kwargs):
        raise AssertionError("Unexpected network, database, AI or Pathfinder Analyze/Best Times")
    monkeypatch.setattr(socket, "create_connection", forbidden)
    monkeypatch.setattr(sqlite3, "connect", forbidden)
    monkeypatch.setattr(pathfinder, "best_times", forbidden)
    from geopy.geocoders import Nominatim
    monkeypatch.setattr(Nominatim, "geocode", forbidden)
    original = builtins.__import__
    def guarded(name, *args, **kwargs):
        if name.split(".")[0] in {"openai", "anthropic", "psycopg", "psycopg2"} or name.startswith("services.generation"):
            forbidden()
        return original(name, *args, **kwargs)
    monkeypatch.setattr(builtins, "__import__", guarded)

@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router, prefix="/api/vault")
    with TestClient(app) as c: yield c

def probe(client, endpoint, lang, **changes):
    body = {**PRIMARY, "lang": lang}
    if endpoint in {"partner-profile", "compatibility", "trust-patterns"}: body.update(PARTNER)
    if endpoint in {"best-countries", "business-geography"}:
        body["locations"] = ["London|51.5074,-0.1278", "Paris|48.8566,2.3522", "New York|40.7128,-74.0060"]
    if endpoint == "best-countries": body["goal"] = "relationship"
    body.update(changes)
    response = client.post("/api/vault/" + endpoint, json=body)
    assert response.status_code == 200, response.text
    return response.json()

def visible(reading):
    return "\n".join(str(reading.get(k, "")) for k in ("headline", "interpretation", "action", "avoid", "limitation")) + "\n" + "\n".join(row["label"] + ": " + row["value"] + (" · " + row["reason"] if row.get("reason") else "") for row in reading.get("details", []))

@pytest.mark.parametrize("endpoint", ENDPOINTS)
@pytest.mark.parametrize("lang", LANGS)
def test_api_localized_quality_and_determinism(client, endpoint, lang):
    payload = probe(client, endpoint, lang)
    assert payload == probe(client, endpoint, lang)
    reading = payload["reading"]
    fixtures = json.loads((ROOT / "apps/web/components/vault/fixtures/quality-api.json").read_text())
    assert reading == fixtures[lang][endpoint]  # DOM tests must use the current real API output.
    assert reading["evidence_status"] == "unvalidated"
    assert reading["data_completeness"] == "supplied_unverified"
    assert reading["limitation"] and reading["action"] and reading["avoid"]
    text = visible(reading)
    for token in PROHIBITED: assert token not in json.dumps(payload, ensure_ascii=False).lower()
    assert ".." not in reading["executive"]
    assert all(any(c.isalnum() for c in line) for line in text.splitlines() if line.strip())
    assert text.count(reading["limitation"]) == 1
    assert text.count(reading["action"]) == 1
    if lang != "en":
        assert not re.search(r"\b(high|medium|low|moderate|excellent|good|harmony|mixed|tension|strong|subtle)\b", text, re.I)
    assert reading["details"] or reading.get("strongest_window"), endpoint

@pytest.mark.parametrize("endpoint", ENDPOINTS)
def test_controlled_variation_changes_calculated_output(client, endpoint, monkeypatch):
    first = probe(client, endpoint, "en")
    # Colour is a transit-date palette, not a natal personality measurement.
    change = {"target_date": "2026-09-20"} if endpoint == "todays-color" else {"birth_date": "1981-12-01"}
    if endpoint in {"partner-profile", "compatibility", "trust-patterns"}: change = {"partner_birth_date": "1981-12-01"}
    if endpoint == "todays-color":
        assert first["reading"]["details"] == probe(client, endpoint, "en", birth_date="1981-12-01")["reading"]["details"]
        class LaterDate(date):
            @classmethod
            def today(cls): return cls(2026, 9, 20)
        monkeypatch.setattr(vr, "date", LaterDate)
    second = probe(client, endpoint, "en", **change)
    if endpoint == "todays-color":
        palette_label = templates._quality_label("palette", "en")
        palette = lambda p: next(row["value"] for row in p["reading"]["details"] if row["label"] == palette_label)
        assert palette(first) != palette(second)
    else:
        assert first["reading"]["details"] != second["reading"]["details"] or first.get("windows") != second.get("windows")
    assert first["reading"]["evidence_status"] == second["reading"]["evidence_status"]
    assert first["reading"]["data_completeness"] == second["reading"]["data_completeness"]

@pytest.mark.parametrize("lang", LANGS)
def test_business_partner_uses_working_context(client, lang):
    payload = probe(client, "partner-profile", lang, partner_relationship="business_partner")
    assert payload["profile_key"] == "business_partner"
    r = payload["reading"]
    assert {"en": "decision rights", "ru": "полномочия", "fa": "اختیار", "ar": "صلاحيات"}[lang] in visible(r)
    assert not re.search(r"\b(dates|attraction|romantic)\b", visible(r), re.I)

@pytest.mark.parametrize("lang", LANGS)
def test_identical_post_windows_are_merged(lang):
    slot = {"window": "14:00–15:00", "score": 94}
    r = templates.render_live_reel_time_reading(posting=slot, filming=slot, live_stream=slot, target_date="2026-09-10", lang=lang)
    assert visible(r).count("14:00–15:00") == 1
    assert "94/100" in visible(r)

@pytest.mark.parametrize("lang", LANGS)
def test_incomplete_ranked_entries_are_omitted(lang):
    r = templates.render_best_countries_reading([{"label": "London", "score": 80}, {"label": "Paris"}, {"score": 90}], lang=lang)
    assert r["details"] == [{"label": "London", "value": "80/100"}]

@pytest.mark.parametrize("endpoint", ("compatibility", "trust-patterns"))
def test_completeness_is_not_favorability(client, endpoint):
    complete = probe(client, endpoint, "en")
    incomplete = probe(client, endpoint, "en", user_birth_time_known=False)
    assert complete["reading"]["data_completeness"] == "supplied_unverified"
    assert incomplete["reading"]["data_completeness"] == "incomplete"
    assert complete["reading"]["evidence_status"] == incomplete["reading"]["evidence_status"] == "unvalidated"


@pytest.mark.parametrize("lang", LANGS)
def test_only_partner_changes_calculation_and_visible_prompt(client, lang):
    first = probe(client, "partner-profile", lang)
    second = probe(client, "partner-profile", lang, partner_birth_date="1981-12-01")
    assert first["synastry_score"] != second["synastry_score"]
    # Primary-chart rows can merge; distinguish their provenance, not their count.
    primary = lambda payload: [row for row in payload["reading"]["details"] if row.get("source") != "two_chart_comparison"]
    prompts = lambda payload: " ".join(row["value"] for row in payload["reading"]["details"] if row.get("source") == "two_chart_comparison")
    assert primary(first) == primary(second)
    a, b = prompts(first), prompts(second)
    assert a and b and re.sub(r"[\d°]+", "", a) != re.sub(r"[\d°]+", "", b)
    for result in (first, second):
        for token in PROHIBITED: assert token not in visible(result["reading"]).lower()


@pytest.mark.parametrize("lang", LANGS)
def test_date_outfit_returns_one_calculated_window(client, monkeypatch, lang):
    selected = dict(window="19:00–20:00", score=82, timezone="Europe/Paris")
    monkeypatch.setattr(vr, "_best_hourly_window", lambda **kwargs: dict(selected))
    first = probe(client, "date-outfit", lang)["reading"]
    selected.update(window="09:00–10:00", score=31, timezone="Asia/Tokyo")
    second = probe(client, "date-outfit", lang)["reading"]
    label = templates._quality_label("meeting", lang)
    row = lambda reading: next(r for r in reading["details"] if r["label"] == label)
    assert row(first)["value"] == "19:00–20:00 · 82/100 · Europe/Paris"
    assert row(second)["value"] == "09:00–10:00 · 31/100 · Asia/Tokyo"
    assert visible(first).count("19:00–20:00") == 1
    assert visible(second).count("09:00–10:00") == 1
    assert "19:00–20:00" not in visible(second)
    assert row(first)["direction"] == row(second)["direction"] == "ltr"
    assert visible(first).count(first["limitation"]) == 1


@pytest.mark.parametrize("lang", LANGS)
@pytest.mark.parametrize("endpoint", ("best-countries", "business-geography"))
def test_geography_distinct_calculated_reasoning(client, endpoint, lang):
    payload = probe(client, endpoint, lang)
    details = payload["reading"]["details"]
    # Independent expected ranking and factors, not equality between copies of prose.
    expected = [("London", 67), ("New York", 66), ("Paris", 63)] if endpoint == "best-countries" else [("London", 62), ("Paris", 60), ("New York", 58)]
    assert [(row["label"], row["score"]) for row in payload["ranked"]] == expected
    assert [(row["label"], row["value"]) for row in details] == [(name, f"{score}/100") for name, score in expected]
    by_city = {row["label"]: row["reason"] for row in details}
    if endpoint == "best-countries":
        moon = {"en": "Moon", "ru": "Луна", "fa": "ماه", "ar": "القمر"}[lang]
        jupiter = {"en": "Jupiter", "ru": "Юпитер", "fa": "مشتری", "ar": "المشتري"}[lang]
        assert moon in by_city["London"]  # Calculated Moon/DC factor.
        assert jupiter in by_city["New York"]  # Calculated Jupiter/AC factor.
    else:
        # Mercury is 38.69° from AC, not the formerly selected 71.65° from MC.
        assert "38.69" in by_city["New York"]
        assert "71.65" not in by_city["New York"]
    if lang in {"fa", "ar"}:
        assert all(";" not in reason for reason in by_city.values())
        assert "؛" in by_city["London"]
    assert visible(payload["reading"]).count(payload["reading"]["limitation"]) == 1



@pytest.mark.parametrize("lang", LANGS)
@pytest.mark.parametrize("location,zone", (("51.5074,-0.1278", "Europe/London"), ("48.8566,2.3522", "Europe/Paris")))
def test_browser_shaped_post_request_uses_resolved_timezone(client, monkeypatch, lang, location, zone):
    actual = vr.score_with_context
    resolved = []
    def capture(**kwargs):
        assert kwargs["evaluation_timezone"] is None
        result = actual(**kwargs)
        resolved.append(result[2]["evaluation"]["timezone"])
        return result
    monkeypatch.setattr(vr, "score_with_context", capture)
    # Match the browser: no evaluation_timezone property, not even null.
    body = {k: v for k, v in PRIMARY.items() if k not in {"evaluation_timezone", "target_date"}}
    body.update(lang=lang, location=location)
    response = client.post("/api/vault/live-reel-time", json=body)
    assert response.status_code == 200
    payload = response.json()
    assert resolved and set(resolved) == {zone}
    for key in ("posting", "filming", "live_stream"):
        assert payload["verdict"][key]["timezone"] == zone
    row = next(r for r in payload["reading"]["details"] if r["label"] == templates._quality_label("timezone", lang))
    assert row["value"] == zone


@pytest.mark.parametrize("lang", LANGS)
def test_style_lookup_language_and_distinctions(lang):
    styles = []
    for sign, look in templates.SIGN_DATE_LOOK.items():
        text = look[lang]["style"] + " " + look[lang]["accessory"]
        styles.append(look[lang]["style"])
        for token in ("لوکس نرم", "минимальная цепь", "فاخر ناعم", "حافة حديثة", "современный край"):
            assert token not in text
        assert all(any(c.isalnum() for c in value) for value in look[lang].values())
    assert len(set(styles)) == 12


# Independently supplied coordinates/factors: do not derive expectations from the formatter.
AXIS_THEMES = {
    "AC": {"en": "presentation", "ru": "самовыражение", "fa": "نحوه حضور", "ar": "أسلوب الحضور"},
    "DC": {"en": "agreements", "ru": "договорённости", "fa": "توافق‌ها", "ar": "الاتفاقات"},
    "MC": {"en": "public roles", "ru": "общественные роли", "fa": "نقش‌های اجتماعی", "ar": "الأدوار العامة"},
    "IC": {"en": "foundations", "ru": "основы", "fa": "پایه‌ها", "ar": "الأسس"},
}

@pytest.mark.parametrize("lang", LANGS)
@pytest.mark.parametrize("axis", ("AC", "DC", "MC", "IC"))
def test_geography_retains_supplied_angular_factor(axis, lang):
    from packages.astro_engine.vault_quality_copy import geography_symbolic_reason
    angles = {"AC": 0, "DC": 180, "MC": 90, "IC": 270}
    effect = {"reasons": [{"planet": "moon", "angle": axis, "house": None}]}
    relocation = {"angles": angles, "planets": {"moon": {"longitude": angles[axis] + 2.5}}}
    reason = geography_symbolic_reason(effect, relocation, lang)
    assert "2.50" in reason
    assert AXIS_THEMES[axis][lang] in reason
    assert {"en": "Moon", "ru": "Луна", "fa": "ماه", "ar": "القمر"}[lang] in reason
    assert not re.search(r"\b(AC|DC|MC|IC|ASC|DSC)\b", reason)

@pytest.mark.parametrize("lang", LANGS)
@pytest.mark.parametrize("longitude,nearest", ((359, "AC"), (179, "DC"), (89, "MC"), (269, "IC")))
def test_geography_nearest_axis_uses_all_four_numeric_distances(longitude, nearest, lang):
    from packages.astro_engine.vault_quality_copy import geography_symbolic_reason
    # AC regression includes wraparound: distance to AC is 1°, to MC is 91°.
    relocation = {"angles": {"AC": 0, "DC": 180, "MC": 90, "IC": 270},
                  "planets": {"venus": {"longitude": longitude}}}
    effect = {"reasons": [{"planet": "venus", "angle": None, "house": 5}]}
    reason = geography_symbolic_reason(effect, relocation, lang)
    assert "1.00" in reason
    assert AXIS_THEMES[nearest][lang] in reason
    for axis in AXIS_THEMES:
        if axis != nearest: assert AXIS_THEMES[axis][lang] not in reason
    if lang in {"fa", "ar"}: assert "؛" in reason and ";" not in reason
    else: assert "; " in reason

@pytest.mark.parametrize("lang", LANGS)
def test_geography_retains_every_supplied_axis_and_localizes_separator(lang):
    from packages.astro_engine.vault_quality_copy import geography_symbolic_reason
    relocation = {"angles": {"AC": 0, "DC": 180, "MC": 90, "IC": 270},
                  "planets": {"moon": {"longitude": 2}}}
    effect = {"reasons": [{"planet": "moon", "angle": axis, "house": None} for axis in ("AC", "DC", "MC", "IC")]}
    reason = geography_symbolic_reason(effect, relocation, lang)
    for angle in ("2.00", "178.00", "88.00", "92.00"): assert angle in reason
    for axis in AXIS_THEMES: assert AXIS_THEMES[axis][lang] in reason
    separator = "؛ " if lang in {"fa", "ar"} else "; "
    assert reason.count(separator) == 3
    if lang in {"fa", "ar"}: assert ";" not in reason
