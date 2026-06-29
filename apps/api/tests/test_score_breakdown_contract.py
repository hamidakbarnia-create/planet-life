"""API contract tests for component_breakdown across scoring endpoints."""

from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, r"C:\planet-life")

from packages.astro_engine.scoring_context import (  # noqa: E402
    CONTEXT_ASK_ELECTIONAL,
    CONTEXT_CALENDAR_DAY,
    CONTEXT_CALENDAR_HOURLY,
    CONTEXT_PROPERTY,
)
from schemas.score_breakdown import (  # noqa: E402
    COMPONENT_BREAKDOWN_FIELDS,
    build_scoring_response,
    validate_component_breakdown,
)
from services.scoring_pipeline import score_with_context  # noqa: E402

BIRTH = {
    "birth_date": "1982-02-25",
    "birth_time": "05:47",
    "location": "Rafsanjan",
    "latitude": 30.4067,
    "longitude": 56.0039,
}
TARGET_DATE = "2026-06-15"
LONDON = {
    "evaluation_location": "London, United Kingdom",
    "evaluation_latitude": 51.5074,
    "evaluation_longitude": -0.1278,
}
NYC = {
    "evaluation_location": "New York, United States",
    "evaluation_latitude": 40.7128,
    "evaluation_longitude": -74.0060,
}


def _assert_contract(breakdown: dict) -> None:
    for field in COMPONENT_BREAKDOWN_FIELDS:
        assert field in breakdown, f"missing field: {field}"
    model = validate_component_breakdown(breakdown)
    assert model.location_component_score == pytest.approx(
        model.transit_house_score + model.transit_angular_score,
        abs=0.02,
    )


def _score(context, *, target_time=None, eval_coords=LONDON, action="business_launch"):
    result, _, transit = score_with_context(
        **BIRTH,
        target_date=TARGET_DATE,
        target_time=target_time,
        action_type=action,
        context=context,
        **eval_coords,
    )
    return result, transit


@pytest.mark.parametrize(
    "context,location_mode,extra",
    [
        (CONTEXT_CALENDAR_DAY, "currentLiving", {"target_time": None}),
        (CONTEXT_CALENDAR_HOURLY, "currentLiving", {"target_time": "14:00"}),
        (CONTEXT_ASK_ELECTIONAL, "eventLocation", {"target_time": None}),
        (CONTEXT_PROPERTY, "targetSubject", {"target_time": None, "eval": NYC, "action": "real_estate"}),
    ],
    ids=["calendar-day", "calendar-hourly", "ask", "property"],
)
def test_score_pipeline_component_breakdown_contract(context, location_mode, extra):
    eval_coords = extra.get("eval", LONDON)
    result, transit = _score(
        context,
        target_time=extra.get("target_time"),
        eval_coords=eval_coords,
        action=extra.get("action", "business_launch"),
    )
    payload = build_scoring_response(result, location_context=transit.get("evaluation"))
    bd = payload["strategic"]["component_breakdown"]
    _assert_contract(bd)
    assert bd["location_mode"] == location_mode
    assert payload["technical"]["component_breakdown"] == bd


def test_calendar_day_location_mode():
    result, _ = _score(CONTEXT_CALENDAR_DAY)
    assert result["strategic"]["component_breakdown"]["location_mode"] == "currentLiving"


def test_ask_location_mode():
    result, _ = _score(CONTEXT_ASK_ELECTIONAL, action="contract_signing")
    assert result["strategic"]["component_breakdown"]["location_mode"] == "eventLocation"


def test_property_location_mode():
    result, _ = _score(CONTEXT_PROPERTY, eval_coords=NYC, action="real_estate")
    bd = result["strategic"]["component_breakdown"]
    assert bd["location_mode"] == "targetSubject"
    assert bd["calculated_for"] == NYC["evaluation_location"]


def test_build_scoring_response_validates_both_layers():
    result, transit = _score(CONTEXT_ASK_ELECTIONAL)
    payload = build_scoring_response(result, location_context=transit.get("evaluation"))
    assert "location_context" in payload
    _assert_contract(payload["strategic"]["component_breakdown"])
    _assert_contract(payload["technical"]["component_breakdown"])


def test_calendar_batch_payload_shape():
    """Mirrors /api/batch response structure per date."""
    result, _ = _score(CONTEXT_CALENDAR_DAY)
    day_payload = build_scoring_response(result)
    assert "strategic" in day_payload
    _assert_contract(day_payload["strategic"]["component_breakdown"])
    assert day_payload["strategic"]["component_breakdown"]["location_mode"] == "currentLiving"


def test_calendar_hourly_payload_shape():
    """Mirrors /api/batch-hourly response structure per hour."""
    result, _ = _score(CONTEXT_CALENDAR_HOURLY, target_time="12:00")
    bd = result["strategic"]["component_breakdown"]
    _assert_contract(bd)
    hourly_entry = {"score": result["executive"]["score"], "component_breakdown": bd}
    assert hourly_entry["component_breakdown"]["location_mode"] == "currentLiving"
    assert hourly_entry["component_breakdown"]["target_time"] == "12:00"


def test_ask_analyze_payload_shape():
    """Mirrors /api/business/analyze and /api/finance/analyze response."""
    result, transit = _score(CONTEXT_ASK_ELECTIONAL)
    payload = build_scoring_response(result, location_context=transit.get("evaluation"))
    _assert_contract(payload["strategic"]["component_breakdown"])
    assert payload["strategic"]["component_breakdown"]["location_mode"] == "eventLocation"


def test_property_analyze_payload_shape():
    """Mirrors /api/real-estate/analyze response."""
    result, _ = _score(CONTEXT_PROPERTY, eval_coords=NYC, action="real_estate")
    payload = build_scoring_response(result)
    bd = payload["strategic"]["component_breakdown"]
    _assert_contract(bd)
    assert bd["location_mode"] == "targetSubject"
