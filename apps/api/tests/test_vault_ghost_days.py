"""Ghost Days Power Calendar — rest_recovery scoring + reading shape."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import ghost_days_reading  # noqa: E402
from packages.astro_engine.vault_templates import render_ghost_days_reading  # noqa: E402


def test_render_ghost_days_empty_windows():
    reading = render_ghost_days_reading([], lang="en", horizon_days=14)
    assert reading["intensity"] == "subtle"
    assert "executive" in reading and reading["executive"]
    assert "rest_recovery" in reading["technical"]
    assert reading["action"]
    assert reading["avoid"]
    assert "Avoid:" in reading["executive"]


def test_render_ghost_days_ranked_windows():
    reading = render_ghost_days_reading(
        [
            {"date": "2026-07-25", "score": 82, "rating": "Excellent"},
            {"date": "2026-07-28", "score": 71, "rating": "Good"},
        ],
        lang="en",
        horizon_days=14,
    )
    assert reading["intensity"] == "strong"
    assert reading["confidence"] == "high"
    assert "2026-07-25" in reading["executive"]
    assert "82" in reading["executive"]
    assert "rest_recovery" not in reading["strategic"]
    assert "Confidence:" in reading["executive"]
    assert "Action:" in reading["executive"]
    assert "Avoid:" in reading["executive"]
    assert reading["action"]
    assert reading["avoid"]


def test_ghost_days_reading_shape():
    # Explicit coords avoid Nominatim in CI/sandbox.
    payload = ghost_days_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="London",
        lang="en",
        horizon_days=3,
        latitude=51.5074,
        longitude=-0.1278,
        evaluation_latitude=51.5074,
        evaluation_longitude=-0.1278,
        evaluation_timezone="Europe/London",
    )
    assert payload["planet"] == "ghost"
    assert payload["action_type"] == "rest_recovery"
    assert payload["verdict"]["confidence"] in {"high", "medium", "low"}
    assert "reading" in payload
    for key in ("executive", "strategic", "technical", "confidence"):
        assert key in payload["reading"]
    assert "rest_recovery" not in payload["reading"]["strategic"]
    assert isinstance(payload["windows"], list)
    assert len(payload["windows"]) <= 5
    if payload["windows"]:
        assert "date" in payload["windows"][0]
        assert "score" in payload["windows"][0]
