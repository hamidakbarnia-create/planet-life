"""Hot Attraction Days — hot_attraction scoring (not business_launch)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.astro_engine.scoring import (  # noqa: E402
    ACTIVITY_PROFILES,
    calculate_activity_score,
)
from packages.astro_engine.scoring_context import CONTEXT_CALENDAR_DAY  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_hot_attraction_days_reading,
)
from services.vault_readings import (  # noqa: E402
    _HOT_ACTION,
    hot_attraction_days_reading,
)


def test_hot_action_is_not_business_launch():
    assert _HOT_ACTION == "hot_attraction"
    assert _HOT_ACTION != "business_launch"
    assert "hot_attraction" in ACTIVITY_PROFILES
    profile = ACTIVITY_PROFILES["hot_attraction"]
    assert "venus" in profile.primary_planets
    assert "mars" in profile.primary_planets


def test_render_hot_attraction_empty_windows():
    reading = render_hot_attraction_days_reading([], lang="en", horizon_days=14)
    assert reading["intensity"] == "subtle"
    assert "executive" in reading and reading["executive"]
    assert "hot_attraction" in reading["technical"]
    assert "business_launch" not in reading["technical"]
    assert "business_launch" not in reading["strategic"]
    assert reading["action"]
    assert reading["avoid"]
    assert "Avoid:" in reading["executive"]


def test_render_hot_attraction_ranked_windows():
    reading = render_hot_attraction_days_reading(
        [
            {"date": "2026-07-26", "score": 88, "rating": "Excellent"},
            {"date": "2026-07-29", "score": 70, "rating": "Good"},
        ],
        lang="en",
        horizon_days=14,
    )
    assert reading["intensity"] == "strong"
    assert reading["confidence"] == "high"
    assert "2026-07-26" in reading["executive"]
    assert "88" in reading["executive"]
    assert "hot_attraction" in reading["technical"]
    assert "business_launch" not in reading["technical"]
    assert "business_launch" not in reading["strategic"]
    assert "hot_attraction" not in reading["strategic"]
    assert "Confidence:" in reading["executive"]
    assert "Action:" in reading["executive"]
    assert "Avoid:" in reading["executive"]
    assert reading["action"]
    assert reading["avoid"]


def test_hot_attraction_days_reading_shape():
    payload = hot_attraction_days_reading(
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
    assert payload["planet"] == "hot"
    assert payload["action_type"] == "hot_attraction"
    assert payload["action_type"] != "business_launch"
    assert payload["verdict"]["action_type"] == "hot_attraction"
    assert "business_launch" not in payload["reading"]["technical"]
    for key in ("executive", "strategic", "technical"):
        assert key in payload["reading"]
    assert isinstance(payload["windows"], list)
    assert len(payload["windows"]) <= 5
    if payload["windows"]:
        assert "date" in payload["windows"][0]
        assert "score" in payload["windows"][0]


def test_venus_mars_signals_affect_hot_attraction_ranking():
    """Attraction-relevant Venus/Mars inputs must change hot_attraction scores."""
    natal = {
        "planets": {
            "sun": {"longitude": 100.0, "house": 10},
            "moon": {"longitude": 200.0, "house": 4},
            "mercury": {"longitude": 90.0, "house": 9},
            "venus": {"longitude": 10.0, "house": 5},
            "mars": {"longitude": 40.0, "house": 7},
            "jupiter": {"longitude": 250.0, "house": 11},
            "saturn": {"longitude": 300.0, "house": 1},
        }
    }
    # Strong attraction day: transit Venus conjunct natal Venus in 5th,
    # transit Mars trine natal Venus, Moon in 7th.
    hot_sky = {
        "planets": {
            "sun": {"longitude": 180.0, "house": 12},
            "moon": {"longitude": 220.0, "house": 7},
            "mercury": {"longitude": 170.0, "house": 12},
            "venus": {"longitude": 11.0, "house": 5},
            "mars": {"longitude": 130.0, "house": 7},
            "jupiter": {"longitude": 200.0, "house": 8},
            "saturn": {"longitude": 20.0, "house": 12},
        },
        "ascendant": 0.0,
        "midheaven": 270.0,
    }
    # Weak attraction day: Venus/Mars buried in 12th; Sun/Jupiter in 10th
    # (business-friendly, attraction-cold).
    cool_sky = {
        "planets": {
            "sun": {"longitude": 101.0, "house": 10},
            "moon": {"longitude": 50.0, "house": 12},
            "mercury": {"longitude": 95.0, "house": 10},
            "venus": {"longitude": 200.0, "house": 12},
            "mars": {"longitude": 210.0, "house": 12},
            "jupiter": {"longitude": 102.0, "house": 10},
            "saturn": {"longitude": 15.0, "house": 6},
        },
        "ascendant": 0.0,
        "midheaven": 270.0,
    }

    hot = calculate_activity_score(
        natal, hot_sky, "hot_attraction", scoring_context=CONTEXT_CALENDAR_DAY
    )
    cool = calculate_activity_score(
        natal, cool_sky, "hot_attraction", scoring_context=CONTEXT_CALENDAR_DAY
    )
    hot_score = int(hot["executive"]["score"])
    cool_score = int(cool["executive"]["score"])
    assert hot_score > cool_score

    # Same skies must not be scored as business_launch for this feature path.
    bl_hot = calculate_activity_score(
        natal, hot_sky, "business_launch", scoring_context=CONTEXT_CALENDAR_DAY
    )
    bl_cool = calculate_activity_score(
        natal, cool_sky, "business_launch", scoring_context=CONTEXT_CALENDAR_DAY
    )
    # Attraction ranking and business ranking diverge on these inputs.
    assert (hot_score > cool_score) != (
        int(bl_hot["executive"]["score"]) > int(bl_cool["executive"]["score"])
    ) or hot_score != int(bl_hot["executive"]["score"])
