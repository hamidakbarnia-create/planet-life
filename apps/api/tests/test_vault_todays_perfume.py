"""Style Timing — Today's Perfume from Venus/Moon/Asc + transit Moon."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import todays_perfume_reading  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_todays_perfume_reading,
)


def test_render_perfume_uses_all_four_inputs_and_required_outputs():
    reading = render_todays_perfume_reading(
        natal_venus_sign="taurus",
        natal_moon_sign="cancer",
        ascendant_sign="libra",
        transit_moon_sign="leo",
        target_date="2026-07-24",
        lang="en",
    )
    assert reading["fragrance_family"]
    assert "rose + sandalwood" in reading["primary_notes"]
    assert "white musk + lotus" in reading["primary_notes"]
    assert reading["accent_note"] == "jasmine + amber"
    assert reading["occasion"]
    assert reading["avoid"]
    assert reading["reason"]
    assert reading["confidence"] in {"high", "medium", "low"}
    assert "Family:" in reading["executive"]
    assert "Confidence:" in reading["executive"]
    assert "Natal Venus" in reading["reason"] or "Venus" in reading["reason"]
    assert "Asc" in reading["reason"]
    assert "Transit Moon" in reading["reason"]
    assert "natal_venus=taurus" in reading["technical"]
    assert "asc=libra" in reading["technical"]
    assert "transit_moon=leo" in reading["technical"]


def test_render_perfume_not_transit_moon_alone():
    # Same transit Moon, different Venus → different family/primary notes.
    a = render_todays_perfume_reading(
        natal_venus_sign="taurus",
        natal_moon_sign="cancer",
        ascendant_sign="libra",
        transit_moon_sign="leo",
        target_date="2026-07-24",
        lang="en",
    )
    b = render_todays_perfume_reading(
        natal_venus_sign="scorpio",
        natal_moon_sign="cancer",
        ascendant_sign="libra",
        transit_moon_sign="leo",
        target_date="2026-07-24",
        lang="en",
    )
    assert a["fragrance_family"] != b["fragrance_family"] or a["primary_notes"] != b[
        "primary_notes"
    ]


def test_render_perfume_optional_accent_omitted_when_same_as_venus():
    reading = render_todays_perfume_reading(
        natal_venus_sign="leo",
        natal_moon_sign="cancer",
        ascendant_sign="aries",
        transit_moon_sign="leo",
        target_date="2026-07-24",
        lang="en",
    )
    assert reading["accent_note"] == ""


def test_render_perfume_high_confidence_when_venus_aligns():
    # Venus Taurus (earth) + Asc Virgo (earth) + natal Moon Capricorn (earth)
    reading = render_todays_perfume_reading(
        natal_venus_sign="taurus",
        natal_moon_sign="capricorn",
        ascendant_sign="virgo",
        transit_moon_sign="aries",
        target_date="2026-07-24",
        lang="en",
    )
    assert reading["confidence"] == "high"
    assert reading["intensity"] == "strong"


def test_todays_perfume_reading_shape():
    payload = todays_perfume_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="London",
        lang="en",
        latitude=51.5074,
        longitude=-0.1278,
        evaluation_latitude=51.5074,
        evaluation_longitude=-0.1278,
        evaluation_timezone="Europe/London",
        target_date="2026-07-24",
    )
    assert payload["planet"] == "perfume"
    v = payload["verdict"]
    for key in (
        "natal_venus_sign",
        "natal_moon_sign",
        "ascendant_sign",
        "transit_moon_sign",
        "target_date",
        "fragrance_family",
        "primary_notes",
        "occasion",
        "avoid",
        "reason",
        "confidence",
    ):
        assert key in v and v[key] is not None
    assert "accent_note" in v
    reading = payload["reading"]
    for key in (
        "executive",
        "strategic",
        "technical",
        "headline",
        "intensity",
        "fragrance_family",
        "primary_notes",
        "confidence",
        "reason",
    ):
        assert key in reading and reading[key] != ""
