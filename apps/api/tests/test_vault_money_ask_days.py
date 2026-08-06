"""Money-Ask Days Power Calendar — finance_transaction + reading shape."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import money_ask_days_reading  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_money_ask_days_reading,
)


def test_render_money_ask_empty_windows():
    reading = render_money_ask_days_reading([], lang="en", horizon_days=14)
    assert reading["intensity"] == "subtle"
    assert "finance_transaction" in reading["technical"]
    assert "business_launch" not in reading["technical"]
    assert reading["action"]
    assert reading["avoid"]
    assert "Avoid:" in reading["executive"]
    assert "Confidence:" in reading["executive"]


def test_render_money_ask_ranked_windows():
    reading = render_money_ask_days_reading(
        [
            {"date": "2026-07-27", "score": 84, "rating": "Excellent"},
            {"date": "2026-07-30", "score": 69, "rating": "Good"},
        ],
        lang="en",
        horizon_days=14,
    )
    assert reading["intensity"] == "strong"
    assert reading["confidence"] == "high"
    assert "2026-07-27" in reading["executive"]
    assert "Action:" in reading["executive"]
    assert "Avoid:" in reading["executive"]
    assert reading["action"]
    assert reading["avoid"]
    assert "finance_transaction" in reading["technical"]
    assert "business_launch" not in reading["strategic"]


def test_money_ask_days_reading_shape():
    payload = money_ask_days_reading(
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
    assert payload["planet"] == "money"
    assert payload["action_type"] == "finance_transaction"
    assert payload["action_type"] != "business_launch"
    assert payload["verdict"]["confidence"] in {"high", "medium", "low"}
    assert payload["verdict"]["action"]
    assert payload["verdict"]["avoid"]
    for key in ("executive", "strategic", "technical", "confidence", "action", "avoid"):
        assert key in payload["reading"] and payload["reading"][key]
    assert isinstance(payload["windows"], list)
    assert len(payload["windows"]) <= 5
