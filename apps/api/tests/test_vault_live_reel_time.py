"""Style Timing — Live / Reel Time hourly windows."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import live_reel_time_reading  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_live_reel_time_reading,
)


def test_render_live_reel_includes_windows_confidence_reason():
    reading = render_live_reel_time_reading(
        posting={
            "window": "14:00–15:00",
            "score": 82,
            "confidence": "high",
            "reason": "Highly Favorable: reach and shareability",
            "action_type": "social_media_post",
        },
        filming={
            "window": "10:00–11:00",
            "score": 71,
            "confidence": "medium",
            "reason": "Favorable: creative flow and distinctive capture",
            "action_type": "creative_work",
        },
        live_stream={
            "window": "19:00–20:00",
            "score": 88,
            "confidence": "high",
            "reason": "Highly Favorable: visibility, presence, and live momentum",
            "action_type": "presentation",
        },
        target_date="2026-07-24",
        lang="en",
    )
    assert "14:00–15:00" in reading["executive"]
    assert "10:00–11:00" in reading["executive"]
    assert "19:00–20:00" in reading["executive"]
    assert "Confidence:" in reading["executive"]
    assert "Reason:" in reading["strategic"]
    assert reading["confidence"] in {"high", "medium", "low"}
    assert reading["reason"]
    assert "social_media_post" in reading["technical"]
    assert "creative_work" in reading["technical"]
    assert "presentation" in reading["technical"]
    assert "business_launch" not in reading["technical"]


def test_live_reel_time_reading_shape():
    # Narrow hour sample keeps CI/sandbox fast; coords avoid Nominatim.
    payload = live_reel_time_reading(
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
        hours=(10, 14, 19),
    )
    assert payload["planet"] == "reel"
    verdict = payload["verdict"]
    for key in ("posting", "filming", "live_stream", "confidence", "reason"):
        assert key in verdict
    for slot_key, action in (
        ("posting", "social_media_post"),
        ("filming", "creative_work"),
        ("live_stream", "presentation"),
    ):
        slot = verdict[slot_key]
        assert slot["action_type"] == action
        assert "window" in slot and slot["window"]
        assert "score" in slot
        assert slot["confidence"] in {"high", "medium", "low"}
        assert slot["reason"]
    reading = payload["reading"]
    for key in (
        "executive",
        "strategic",
        "technical",
        "headline",
        "confidence",
        "reason",
    ):
        assert key in reading and reading[key]
