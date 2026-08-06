"""Style Timing — Date Outfit from Venus/Asc/Moon + meeting hour."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import date_outfit_reading  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_date_outfit_reading,
)


def test_render_date_outfit_fields():
    reading = render_date_outfit_reading(
        natal_venus_sign="taurus",
        ascendant_sign="libra",
        transit_moon_sign="leo",
        meeting_window="19:00–20:00",
        meeting_score=82,
        target_date="2026-07-24",
        lang="en",
    )
    assert reading["outfit_style"] == "soft luxe"
    assert "Gold" in reading["primary_color"] or reading["primary_color"] == "Gold"
    assert reading["accent_color"]
    assert "bracelet" in reading["accessories"]
    assert reading["fragrance_family"] == "floral-woody"
    assert reading["best_meeting_time"] == "19:00–20:00"
    assert reading["avoid"]
    assert reading["confidence"] in {"high", "medium", "low"}
    assert "Confidence:" in reading["executive"]
    assert "Avoid:" in reading["executive"]
    assert "venus=taurus" in reading["technical"]


def test_date_outfit_reading_shape():
    payload = date_outfit_reading(
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
        hours=(18, 19, 20),
    )
    assert payload["planet"] == "outfit"
    verdict = payload["verdict"]
    for key in (
        "outfit_style",
        "primary_color",
        "accent_color",
        "accessories",
        "fragrance_family",
        "best_meeting_time",
        "avoid",
        "confidence",
        "natal_venus_sign",
        "ascendant_sign",
        "transit_moon_sign",
    ):
        assert key in verdict and verdict[key]
    assert verdict["meeting"]["action_type"] == "hot_attraction"
    assert verdict["meeting"]["action_type"] != "business_launch"
    assert verdict["meeting"]["action_type"] != "romantic_meeting"
    reading = payload["reading"]
    for key in ("executive", "strategic", "technical", "headline", "confidence"):
        assert key in reading and reading[key]
