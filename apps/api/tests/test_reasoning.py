"""Unit tests for deterministic astrological reasoning engine."""

from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, r"C:\planet-life")

from packages.astro_engine.reasoning import build_reasoning  # noqa: E402
from packages.astro_engine.scoring import calculate_activity_score  # noqa: E402
from packages.astro_engine.scoring_context import (  # noqa: E402
    CONTEXT_ASK_ELECTIONAL,
    CONTEXT_CALENDAR_DAY,
    CONTEXT_NATAL,
)
from services.scoring_pipeline import score_with_context  # noqa: E402

BIRTH_DATE = "1982-02-25"
BIRTH_TIME = "05:47"
BIRTH_LOCATION = "Rafsanjan"
BIRTH_LAT = 30.4067
BIRTH_LON = 56.0039
TARGET_DATE = "2026-06-15"
LONDON = {
    "evaluation_location": "London, United Kingdom",
    "evaluation_latitude": 51.5074,
    "evaluation_longitude": -0.1278,
}


def _executive_score(final: int = 65) -> dict:
    return {
        "score": final,
        "rating": "Favorable",
        "activity": "Business Launch",
    }


def _breakdown(**overrides) -> dict:
    base = {
        "aspect_score": 5.0,
        "natal_house_bonus": 0.0,
        "transit_house_score": 4.0,
        "transit_angular_score": 2.0,
        "location_component_score": 6.0,
        "retrograde_penalty": 0.0,
        "final_score": 65,
        "location_mode": "eventLocation",
        "calculated_for": "London, United Kingdom",
        "resolved_local_datetime": "2026-06-15T12:00:00+01:00",
        "resolved_utc_datetime": "2026-06-15T11:00:00Z",
        "timezone": "Europe/London",
        "target_time": "12:00",
    }
    base.update(overrides)
    return base


def test_aspect_reasoning_from_score_result():
    score_result = {
        "executive": _executive_score(),
        "strategic": {
            "component_breakdown": _breakdown(),
            "timing_notes": [],
        },
        "technical": {
            "aspects_evaluated": [
                {
                    "transit_planet": "jupiter",
                    "natal_planet": "sun",
                    "aspect": "trine",
                    "orb": 1.2,
                    "contribution": 5.5,
                    "label": "Transit Jupiter trine natal Sun (orb 1.2°)",
                }
            ],
        },
    }
    reasoning = build_reasoning(
        score_result,
        {"transit": {"planets": {}, "evaluation": {}}},
        "business_launch",
        CONTEXT_ASK_ELECTIONAL,
    )
    aspects = [r for r in reasoning["reasons"] if r["category"] == "aspect"]
    assert len(aspects) == 1
    assert aspects[0]["planet"] == "Jupiter"
    assert aspects[0]["score"] == 5.5
    assert "trine" in aspects[0]["title"].lower()


def test_house_reasoning_from_transit_chart():
    transit = {
        "planets": {
            "sun": {"longitude": 120.0, "house": 10, "retrograde": False},
        },
        "ascendant": 200.0,
        "midheaven": 300.0,
        "evaluation": {"calculated_for": "London, United Kingdom"},
    }
    score_result = {
        "executive": _executive_score(),
        "strategic": {
            "component_breakdown": _breakdown(transit_house_score=2.2),
            "timing_notes": [],
        },
        "technical": {"aspects_evaluated": []},
    }
    reasoning = build_reasoning(
        score_result,
        {"transit": transit},
        "business_launch",
        CONTEXT_ASK_ELECTIONAL,
    )
    houses = [r for r in reasoning["reasons"] if r["category"] == "house"]
    assert any(r["planet"] == "Sun" and r["score"] > 0 for r in houses)
    assert houses[0]["evidence"]["house"] == 10


def test_angular_reasoning_from_transit_chart():
    transit = {
        "planets": {
            "sun": {"longitude": 84.5, "house": 10, "retrograde": False},
        },
        "ascendant": 174.0,
        "midheaven": 84.0,
        "evaluation": {"calculated_for": "London, United Kingdom"},
    }
    score_result = {
        "executive": _executive_score(),
        "strategic": {
            "component_breakdown": _breakdown(transit_angular_score=3.5),
            "timing_notes": [],
        },
        "technical": {"aspects_evaluated": []},
    }
    reasoning = build_reasoning(
        score_result,
        {"transit": transit},
        "business_launch",
        CONTEXT_ASK_ELECTIONAL,
    )
    angular = [r for r in reasoning["reasons"] if r["category"] == "angular"]
    assert len(angular) >= 1
    assert angular[0]["planet"] == "Sun"
    assert angular[0]["score"] > 0
    assert angular[0]["evidence"]["angle"] == "mc"


def test_retrograde_reasoning_for_primary_ruler():
    transit = {
        "planets": {
            "mercury": {"longitude": 50.0, "house": 12, "retrograde": True},
        },
        "evaluation": {},
    }
    score_result = {
        "executive": _executive_score(final=48),
        "strategic": {
            "component_breakdown": _breakdown(
                retrograde_penalty=-2.5,
                final_score=48,
            ),
            "timing_notes": [
                "Primary rulers retrograde: mercury — review, revise, or delay."
            ],
        },
        "technical": {"aspects_evaluated": []},
    }
    reasoning = build_reasoning(
        score_result,
        {"transit": transit},
        "contract_signing",
        CONTEXT_ASK_ELECTIONAL,
    )
    retro = [r for r in reasoning["reasons"] if r["category"] == "retrograde"]
    assert len(retro) == 1
    assert retro[0]["planet"] == "Mercury"
    assert retro[0]["score"] < 0


def test_reason_sorting_by_importance_and_score():
    score_result = {
        "executive": _executive_score(),
        "strategic": {
            "component_breakdown": _breakdown(),
            "timing_notes": [],
        },
        "technical": {
            "aspects_evaluated": [
                {
                    "transit_planet": "mars",
                    "natal_planet": "saturn",
                    "aspect": "square",
                    "orb": 0.5,
                    "contribution": -6.0,
                },
                {
                    "transit_planet": "jupiter",
                    "natal_planet": "sun",
                    "aspect": "trine",
                    "orb": 0.8,
                    "contribution": 2.0,
                },
            ],
        },
    }
    reasoning = build_reasoning(
        score_result,
        {"transit": {"planets": {}, "evaluation": {}}},
        "business_launch",
        CONTEXT_ASK_ELECTIONAL,
    )
    reasons = reasoning["reasons"]
    assert len(reasons) >= 2
    assert reasons[0]["importance"] == "high"
    assert abs(reasons[0]["score"]) >= abs(reasons[1]["score"])


def test_confidence_generation():
    score_result = {
        "executive": _executive_score(final=72),
        "strategic": {
            "component_breakdown": _breakdown(final_score=72),
            "timing_notes": ["No major retrograde friction on primary rulers."],
        },
        "technical": {
            "aspects_evaluated": [
                {
                    "transit_planet": "jupiter",
                    "natal_planet": "sun",
                    "aspect": "trine",
                    "orb": 1.0,
                    "contribution": 5.0,
                }
            ],
        },
    }
    reasoning = build_reasoning(
        score_result,
        {"transit": {"planets": {}, "evaluation": {"calculated_for": "London"}}},
        "business_launch",
        CONTEXT_ASK_ELECTIONAL,
    )
    assert 0.0 <= reasoning["confidence"] <= 1.0
    assert reasoning["confidence"] >= 0.6


def test_deterministic_summary():
    score_result = {
        "executive": _executive_score(final=63),
        "strategic": {
            "component_breakdown": _breakdown(final_score=63),
            "timing_notes": [],
        },
        "technical": {
            "aspects_evaluated": [
                {
                    "transit_planet": "venus",
                    "natal_planet": "moon",
                    "aspect": "sextile",
                    "orb": 2.0,
                    "contribution": 3.0,
                }
            ],
        },
    }
    chart = {"transit": {"planets": {}, "evaluation": {"calculated_for": "London"}}}
    first = build_reasoning(score_result, chart, "business_launch", CONTEXT_ASK_ELECTIONAL)
    second = build_reasoning(score_result, chart, "business_launch", CONTEXT_ASK_ELECTIONAL)
    assert first["summary"] == second["summary"]
    assert "63/100" in first["summary"]
    assert "supporting factor" in first["summary"]


def test_natal_house_reasoning_when_context_includes_bonus():
    natal = {
        "planets": {
            "sun": {"longitude": 10.0, "house": 10, "retrograde": False},
        }
    }
    score_result = {
        "executive": _executive_score(),
        "strategic": {
            "component_breakdown": _breakdown(
                natal_house_bonus=1.5,
                location_mode="birthOnly",
            ),
            "timing_notes": [],
        },
        "technical": {"aspects_evaluated": []},
    }
    reasoning = build_reasoning(
        score_result,
        {"natal": natal, "transit": {"planets": {}, "evaluation": {}}},
        "business_launch",
        CONTEXT_NATAL,
    )
    natal_houses = [
        r
        for r in reasoning["reasons"]
        if r["category"] == "house" and r["evidence"].get("scope") == "natal"
    ]
    assert len(natal_houses) == 1
    assert natal_houses[0]["score"] == 1.5


def test_electional_timing_reasoning():
    score_result = {
        "executive": _executive_score(),
        "strategic": {
            "component_breakdown": _breakdown(),
            "timing_notes": ["No major retrograde friction on primary rulers."],
        },
        "technical": {"aspects_evaluated": []},
    }
    reasoning = build_reasoning(
        score_result,
        {
            "transit": {
                "planets": {},
                "evaluation": {"calculated_for": "London, United Kingdom"},
            }
        },
        "business_launch",
        CONTEXT_ASK_ELECTIONAL,
    )
    electional = [r for r in reasoning["reasons"] if r["category"] == "electional_timing"]
    assert any("event location" in r["explanation"].lower() for r in electional)


def test_integration_with_live_scoring_pipeline():
    score_result, natal, transit = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        **LONDON,
    )
    reasoning = build_reasoning(
        score_result,
        {"natal": natal, "transit": transit},
        "business_launch",
        CONTEXT_CALENDAR_DAY,
    )
    assert reasoning["summary"]
    assert isinstance(reasoning["confidence"], float)
    assert isinstance(reasoning["reasons"], list)
    categories = {r["category"] for r in reasoning["reasons"]}
    assert "electional_timing" in categories
    if score_result["technical"]["aspect_count"] > 0:
        assert "aspect" in categories


def test_reasoning_uses_only_existing_score_data():
    """Aspect reasons must match aspects_evaluated contributions exactly."""
    natal = {
        "planets": {
            "sun": {"longitude": 336.0, "house": 1, "retrograde": False},
            "moon": {"longitude": 100.0, "house": 5, "retrograde": False},
        }
    }
    transit = {
        "planets": {
            "jupiter": {"longitude": 96.0, "house": 4, "retrograde": False},
        },
        "ascendant": 324.0,
        "midheaven": 246.0,
        "evaluation": {"calculated_for": "Test City"},
    }
    score_result = calculate_activity_score(
        natal,
        transit,
        "business_launch",
        scoring_context=CONTEXT_ASK_ELECTIONAL,
    )
    reasoning = build_reasoning(
        score_result,
        {"natal": natal, "transit": transit},
        "business_launch",
        CONTEXT_ASK_ELECTIONAL,
    )
    aspect_reasons = [r for r in reasoning["reasons"] if r["category"] == "aspect"]
    evaluated = score_result["technical"]["aspects_evaluated"]
    nonzero = [a for a in evaluated if a["contribution"] != 0]
    assert len(aspect_reasons) == len(nonzero)
    by_key = {
        (
            r["evidence"]["transit_planet"],
            r["evidence"]["natal_planet"],
            r["evidence"]["aspect"],
        ): r
        for r in aspect_reasons
    }
    for rec in nonzero:
        key = (rec["transit_planet"], rec["natal_planet"], rec["aspect"])
        assert key in by_key
        assert by_key[key]["score"] == rec["contribution"]
