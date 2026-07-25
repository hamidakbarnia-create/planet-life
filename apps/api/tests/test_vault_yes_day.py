"""Yes Day correctness — scorers, commit combo, locale, confidence/avoid."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services import vault_readings as vr  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    _YES_AVOID,
    render_yes_day_reading,
)


def test_yes_day_actions_are_negotiation_and_contract_signing():
    assert vr._YES_ASK_ACTION == "negotiation"
    assert vr._YES_SIGN_ACTION == "contract_signing"
    assert vr._YES_ASK_ACTION != "business_launch"
    assert vr._YES_SIGN_ACTION != "business_launch"
    assert vr._YES_ASK_ACTION != "hot_attraction"
    assert vr._YES_SIGN_ACTION != "hot_attraction"


def test_ask_sign_ranking_and_commit_combination(monkeypatch):
    """Ask=negotiation top; sign=contract_signing top; commit=avg(ask,sign)."""

    def fake_windows(*, action_type, **_kwargs):
        if action_type == "negotiation":
            return [
                {
                    "date": "2026-07-26",
                    "score": 80,
                    "rating": "A",
                    "confidence": "high",
                    "action_type": "negotiation",
                },
                {
                    "date": "2026-07-27",
                    "score": 70,
                    "rating": "B",
                    "confidence": "medium",
                    "action_type": "negotiation",
                },
            ]
        if action_type == "contract_signing":
            return [
                {
                    "date": "2026-07-27",
                    "score": 90,
                    "rating": "A",
                    "confidence": "high",
                    "action_type": "contract_signing",
                },
                {
                    "date": "2026-07-26",
                    "score": 60,
                    "rating": "B",
                    "confidence": "medium",
                    "action_type": "contract_signing",
                },
            ]
        raise AssertionError(f"unexpected scorer: {action_type}")

    monkeypatch.setattr(vr, "_calendar_day_windows", fake_windows)
    payload = vr.yes_day_reading(
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
    ask = payload["verdict"]["ask"]
    sign = payload["verdict"]["sign"]
    commit = payload["verdict"]["commit"]

    assert ask["action_type"] == "negotiation"
    assert ask["date"] == "2026-07-26"
    assert ask["score"] == 80

    assert sign["action_type"] == "contract_signing"
    assert sign["date"] == "2026-07-27"
    assert sign["score"] == 90

    # Day 26 avg (80+60)//2=70; day 27 avg (70+90)//2=80 → commit 27 @ 80
    assert commit["date"] == "2026-07-27"
    assert commit["score"] == (70 + 90) // 2
    assert commit["action_type"] == "negotiation+contract_signing"

    tech = payload["reading"]["technical"]
    assert "business_launch" not in tech
    assert "hot_attraction" not in tech
    assert "negotiation" in tech
    assert "contract_signing" in tech


def test_yes_day_localized_en_fa_ar_ru():
    slot = {
        "date": "2026-07-26",
        "score": 80,
        "confidence": "high",
        "action_type": "negotiation",
    }
    sign_slot = {**slot, "action_type": "contract_signing", "date": "2026-07-29"}
    commit_slot = {
        **slot,
        "action_type": "negotiation+contract_signing",
        "date": "2026-07-28",
        "score": 76,
    }
    for lang in ("en", "fa", "ru", "ar"):
        reading = render_yes_day_reading(
            ask=slot,
            commit=commit_slot,
            sign=sign_slot,
            horizon_days=14,
            lang=lang,
        )
        assert reading["executive"]
        assert reading["strategic"]
        assert reading["technical"]
        assert reading["avoid"] == _YES_AVOID[lang]
        assert reading["confidence"] in {"high", "medium", "low"}
        assert "Avoid:" in reading["executive"] or "پرهیز:" in reading[
            "executive"
        ] or "Избегать:" in reading["executive"] or "تجنبي:" in reading["executive"]


def test_yes_day_confidence_calculated_from_scores():
    high = render_yes_day_reading(
        ask={"date": "d1", "score": 90, "action_type": "negotiation"},
        commit={"date": "d2", "score": 88, "action_type": "negotiation+contract_signing"},
        sign={"date": "d3", "score": 86, "action_type": "contract_signing"},
        lang="en",
    )
    low = render_yes_day_reading(
        ask={"date": "d1", "score": 40, "action_type": "negotiation"},
        commit={"date": "d2", "score": 42, "action_type": "negotiation+contract_signing"},
        sign={"date": "d3", "score": 38, "action_type": "contract_signing"},
        lang="en",
    )
    assert high["confidence"] == "high"
    assert low["confidence"] == "low"
    assert high["avoid"]
    assert low["avoid"]
