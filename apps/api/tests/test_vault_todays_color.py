"""Style Timing — Today's Color from transit Moon."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import todays_color_reading  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_todays_color_reading,
)


def test_render_todays_color_leo():
    reading = render_todays_color_reading(
        moon_sign="leo",
        moon_degree=12.5,
        target_date="2026-07-24",
        lang="en",
    )
    assert "Gold" in reading["details"][1]["value"]
    assert "optional" in reading["headline"]
    assert "leo" in reading["technical"]
    assert reading["evidence_status"] == "unvalidated"
    assert "Confidence:" not in reading["executive"]
    assert reading["limitation"]
    assert "Action:" in reading["executive"]
    assert "Avoid:" in reading["executive"]
    assert reading["action"]
    assert reading["avoid"]
    for key in ("executive", "strategic", "technical"):
        assert reading[key]


def test_render_todays_color_libra_fa_uses_unambiguous_blush_label():
    reading = render_todays_color_reading(
        moon_sign="libra",
        moon_degree=10.0,
        target_date="2026-09-12",
        lang="fa",
    )
    palette = reading["details"][1]["value"]
    assert "صورتی ملایم" in palette
    assert "رز ملایم" not in palette
    assert palette.split(" · ")[0] == "صورتی ملایم"


def test_todays_color_reading_shape():
    payload = todays_color_reading(
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
    assert payload["planet"] == "color"
    assert "moon_sign" in payload["verdict"]
    assert isinstance(payload["verdict"]["moon_degree"], float)
    assert payload["verdict"]["confidence"] in {"high", "medium", "low"}
    reading = payload["reading"]
    for key in ("executive", "strategic", "technical", "headline", "confidence"):
        assert key in reading and reading[key]
