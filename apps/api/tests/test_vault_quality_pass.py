"""Vault Quality Pass v1 — correctness guards for LIVE endpoints."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.astro_engine.scoring import _transit_house_rules_key  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_ghost_days_reading,
    render_hot_attraction_days_reading,
    render_todays_color_reading,
    render_todays_perfume_reading,
)
from services import vault_readings as vr  # noqa: E402


def test_live_actions_are_not_business_launch():
    assert vr._HOT_ACTION == "hot_attraction"
    assert vr._HOT_ACTION != "business_launch"
    assert vr._GHOST_ACTION == "rest_recovery"
    assert vr._GHOST_ACTION != "business_launch"
    assert vr._OUTFIT_MEETING_ACTION == "hot_attraction"
    assert vr._OUTFIT_MEETING_ACTION != "business_launch"
    assert vr._OUTFIT_MEETING_ACTION != "romantic_meeting"
    assert vr._REEL_LIVE_ACTION != "business_launch"


def test_transit_house_rules_match_vault_profiles():
    assert _transit_house_rules_key("rest_recovery") == "rest_recovery"
    assert _transit_house_rules_key("hot_attraction") == "hot_attraction"
    assert _transit_house_rules_key("social_media_post") == "networking"
    assert _transit_house_rules_key("presentation") == "networking"
    assert _transit_house_rules_key("creative_work") == "creative_work"


def test_live_readings_expose_confidence():
    color = render_todays_color_reading(
        moon_sign="leo", moon_degree=12.0, target_date="2026-07-24", lang="en"
    )
    perfume = render_todays_perfume_reading(
        natal_venus_sign="taurus",
        natal_moon_sign="cancer",
        ascendant_sign="libra",
        transit_moon_sign="leo",
        target_date="2026-07-24",
        lang="en",
    )
    ghost = render_ghost_days_reading(
        [{"date": "2026-07-25", "score": 80}], lang="en", horizon_days=14
    )
    hot = render_hot_attraction_days_reading(
        [{"date": "2026-07-26", "score": 80}], lang="en", horizon_days=14
    )
    for reading in (color, perfume, ghost, hot):
        assert reading.get("confidence") in {"high", "medium", "low"}


def test_strategy_copy_has_no_internal_action_ids():
    ghost = render_ghost_days_reading(
        [{"date": "2026-07-25", "score": 80}], lang="en", horizon_days=14
    )
    hot = render_hot_attraction_days_reading(
        [{"date": "2026-07-26", "score": 80}], lang="en", horizon_days=14
    )
    assert "rest_recovery" not in ghost["strategic"]
    assert "hot_attraction" not in hot["strategic"]
    assert "business_launch" not in hot["strategic"]


def test_perfume_localized_keys_exist():
    for lang in ("en", "fa", "ru", "ar"):
        reading = render_todays_perfume_reading(
            natal_venus_sign="taurus",
            natal_moon_sign="cancer",
            ascendant_sign="libra",
            transit_moon_sign="leo",
            target_date="2026-07-24",
            lang=lang,
        )
        for key in ("executive", "strategic", "technical", "confidence"):
            assert reading[key]
