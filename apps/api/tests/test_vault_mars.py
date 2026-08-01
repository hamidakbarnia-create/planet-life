"""Sensuality — Mars desire signature reading shape and templates."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.astro_engine.vault_rules import (  # noqa: E402
    build_mars_verdict,
    verdict_to_dict,
)
from packages.astro_engine.vault_templates import render_mars_reading  # noqa: E402
from services.vault_readings import mars_reading  # noqa: E402


def test_render_mars_reading_from_verdict():
    verdict = build_mars_verdict(
        {
            "mars": {"longitude": 15.0, "house": 1, "retrograde": False},
            "venus": {"longitude": 40.0, "house": 2},
            "sun": {"longitude": 100.0, "house": 5},
            "moon": {"longitude": 200.0, "house": 8},
            "saturn": {"longitude": 250.0, "house": 10},
            "pluto": {"longitude": 280.0, "house": 11},
        }
    )
    reading = render_mars_reading(verdict_to_dict(verdict), lang="en")
    for key in ("executive", "strategic", "technical", "headline", "confidence", "action"):
        assert key in reading and reading[key]
    assert "Mars" in reading["technical"]
    assert "house" in reading["technical"]
    assert reading["confidence"] in {"high", "medium", "low"}
    assert "Action:" in reading["executive"] or reading["action"]


def test_mars_reading_shape():
    # Explicit coords avoid Nominatim in CI/sandbox.
    payload = mars_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
    )
    assert payload["planet"] == "mars"
    assert payload["lang"] == "en"
    assert "verdict" in payload
    assert payload["verdict"]["sign"]
    assert isinstance(payload["verdict"]["house"], int)
    assert isinstance(payload["verdict"]["degree"], (int, float))
    assert payload["verdict"]["intensity"] in {"extreme", "strong", "moderate", "subtle"}
    reading = payload["reading"]
    for key in ("executive", "strategic", "technical", "headline", "confidence", "action"):
        assert key in reading and reading[key]
    assert "Mars" in reading["technical"]


def test_mars_reading_locales_have_action():
    for lang in ("en", "fa", "ru", "ar"):
        payload = mars_reading(
            birth_date="1990-06-15",
            birth_time="14:30",
            location="51.5074,-0.1278",
            lang=lang,
        )
        assert payload["lang"] == lang
        assert payload["reading"]["action"]
        assert payload["reading"]["headline"]
