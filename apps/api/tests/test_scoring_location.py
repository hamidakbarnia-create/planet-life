"""Location-aware scoring — Phase 1 datetime policy + Phase 2 validation hardening."""

import sys
import os
from datetime import datetime

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, r"C:\planet-life")

from packages.astro_engine.scoring import calculate_activity_score  # noqa: E402
from packages.astro_engine.scoring_context import (  # noqa: E402
    CONTEXT_ASK_ELECTIONAL,
    CONTEXT_CALENDAR_DAY,
    CONTEXT_CALENDAR_HOURLY,
    CONTEXT_NATAL,
    CONTEXT_PATHFINDER,
    CONTEXT_PROPERTY,
    CONTEXT_SYNASTRY,
    resolve_transit_time,
)
from services.chart_data import build_chart_payload, compute_birth_chart  # noqa: E402
from services.scoring_pipeline import score_with_context  # noqa: E402

BIRTH_DATE = "1982-02-25"
BIRTH_TIME = "05:47"
BIRTH_LOCATION = "Rafsanjan"
BIRTH_LAT = 30.4067
BIRTH_LON = 56.0039
TARGET_DATE = "2026-06-15"

LONDON = (51.5074, -0.1278, "London, United Kingdom")
SYDNEY = (-33.8688, 151.2093, "Sydney, Australia")
LOS_ANGELES = (34.0522, -118.2437, "Los Angeles, United States")
RAFSANJAN = (30.4067, 56.0039, "Rafsanjan")

# ---------------------------------------------------------------------------
# Datetime policy
# ---------------------------------------------------------------------------


def test_calendar_date_only_uses_noon_not_birth_time():
    resolved = resolve_transit_time(CONTEXT_CALENDAR_DAY, None)
    assert resolved == "12:00"
    _, transit = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
        target_date=TARGET_DATE,
        target_time=resolved,
    )
    assert transit["evaluation"]["target_time"] == "12:00"


def test_invariant_calendar_never_uses_birth_time():
    """Calendar date-only must resolve to 12:00 local, never birth_time (05:47)."""
    result, _, transit = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    ev = transit["evaluation"]
    bd = result["strategic"]["component_breakdown"]
    assert ev["target_time"] == "12:00"
    assert ev["target_time"] != BIRTH_TIME
    local_dt = datetime.fromisoformat(ev["resolved_local_datetime"])
    assert local_dt.hour == 12
    assert local_dt.minute == 0
    assert bd["resolved_local_datetime"] == ev["resolved_local_datetime"]
    assert "Europe/London" in (bd["timezone"] or "")


def test_ask_date_only_uses_noon_at_event_location():
    resolved = resolve_transit_time(CONTEXT_ASK_ELECTIONAL, None)
    assert resolved == "12:00"


def test_invariant_ask_date_only_resolves_noon_at_event_location():
    result, _, transit = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="contract_signing",
        context=CONTEXT_ASK_ELECTIONAL,
        evaluation_location=SYDNEY[2],
        evaluation_latitude=SYDNEY[0],
        evaluation_longitude=SYDNEY[1],
    )
    ev = transit["evaluation"]
    bd = result["strategic"]["component_breakdown"]
    assert ev["target_time"] == "12:00"
    local_dt = datetime.fromisoformat(ev["resolved_local_datetime"])
    assert local_dt.hour == 12
    assert "Australia/Sydney" in (ev["timezone"] or bd["timezone"] or "")
    assert bd["location_mode"] == "eventLocation"
    assert bd["calculated_for"] == SYDNEY[2]


def test_calendar_hourly_requires_explicit_hour():
    with pytest.raises(ValueError):
        resolve_transit_time(CONTEXT_CALENDAR_HOURLY, None)
    assert resolve_transit_time(CONTEXT_CALENDAR_HOURLY, "14:00") == "14:00"


# ---------------------------------------------------------------------------
# Component flags / location modes
# ---------------------------------------------------------------------------


def test_calendar_excludes_natal_house_bonus():
    result, _, _ = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    bd = result["strategic"]["component_breakdown"]
    assert bd["natal_house_bonus"] == 0.0
    assert bd["location_mode"] == "currentLiving"


@pytest.mark.parametrize(
    "context,expected_mode",
    [
        (CONTEXT_CALENDAR_DAY, "currentLiving"),
        (CONTEXT_ASK_ELECTIONAL, "eventLocation"),
    ],
)
def test_invariant_calendar_and_ask_natal_house_bonus_always_zero(context, expected_mode):
    result, _, _ = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=context,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    bd = result["strategic"]["component_breakdown"]
    assert bd["natal_house_bonus"] == 0.0
    assert bd["location_mode"] == expected_mode


def test_invariant_property_uses_target_subject_mode():
    result, _, _ = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="real_estate",
        context=CONTEXT_PROPERTY,
        evaluation_location="New York, United States",
        evaluation_latitude=40.7128,
        evaluation_longitude=-74.0060,
    )
    bd = result["strategic"]["component_breakdown"]
    assert bd["location_mode"] == "targetSubject"
    assert bd["calculated_for"] == "New York, United States"


def test_invariant_pathfinder_uses_birth_and_target_mode():
    natal, transit = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time="12:00",
        evaluation_location=LOS_ANGELES[2],
        evaluation_latitude=LOS_ANGELES[0],
        evaluation_longitude=LOS_ANGELES[1],
    )
    result = calculate_activity_score(
        natal, transit, "travel", scoring_context=CONTEXT_PATHFINDER
    )
    bd = result["strategic"]["component_breakdown"]
    assert bd["location_mode"] == "birthAndTarget"


def test_calendar_includes_transit_house_and_angular_scores():
    result, _, transit = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    bd = result["strategic"]["component_breakdown"]
    assert transit.get("ascendant") is not None
    assert transit.get("midheaven") is not None
    assert bd["transit_house_score"] != 0.0 or bd["transit_angular_score"] != 0.0
    assert bd["location_component_score"] == pytest.approx(
        bd["transit_house_score"] + bd["transit_angular_score"], abs=0.01
    )


# ---------------------------------------------------------------------------
# Location differentiation
# ---------------------------------------------------------------------------


def test_london_vs_sydney_different_transit_houses():
    _, transit_lon = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
        target_date=TARGET_DATE,
        target_time="12:00",
    )
    _, transit_syd = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        evaluation_location=SYDNEY[2],
        evaluation_latitude=SYDNEY[0],
        evaluation_longitude=SYDNEY[1],
        target_date=TARGET_DATE,
        target_time="12:00",
    )
    lon_houses = {k: v["house"] for k, v in transit_lon["planets"].items()}
    syd_houses = {k: v["house"] for k, v in transit_syd["planets"].items()}
    assert lon_houses != syd_houses


def test_london_vs_sydney_different_final_score_from_location_components():
    res_lon, _, _ = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    res_syd, _, _ = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=SYDNEY[2],
        evaluation_latitude=SYDNEY[0],
        evaluation_longitude=SYDNEY[1],
    )
    bd_lon = res_lon["strategic"]["component_breakdown"]
    bd_syd = res_syd["strategic"]["component_breakdown"]
    location_delta = abs(bd_lon["location_component_score"] - bd_syd["location_component_score"])
    assert location_delta > 0.0
    assert res_lon["executive"]["score"] != res_syd["executive"]["score"]


def test_paired_cities_same_sun_moon_houses_may_have_similar_location_score():
    """When Sun/Moon houses match, similar location scores are acceptable — not a failure."""
    res_lon, _, t_lon = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    res_la, _, t_la = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=LOS_ANGELES[2],
        evaluation_latitude=LOS_ANGELES[0],
        evaluation_longitude=LOS_ANGELES[1],
    )
    lon_sun = t_lon["planets"]["sun"]["house"]
    lon_moon = t_lon["planets"]["moon"]["house"]
    la_sun = t_la["planets"]["sun"]["house"]
    la_moon = t_la["planets"]["moon"]["house"]

    bd_lon = res_lon["strategic"]["component_breakdown"]
    bd_la = res_la["strategic"]["component_breakdown"]

    if lon_sun == la_sun and lon_moon == la_moon:
        delta = abs(bd_lon["location_component_score"] - bd_la["location_component_score"])
        # Similar houses → location score may match or differ only by angular nuance.
        assert delta <= 2.0
    else:
        pytest.skip("Sun/Moon houses differ on this date; paired-city similarity not applicable")


# ---------------------------------------------------------------------------
# Natal invariants
# ---------------------------------------------------------------------------


def test_natal_chart_unchanged_when_evaluation_location_changes():
    natal_lon, _ = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
        target_date=TARGET_DATE,
        target_time="12:00",
    )
    natal_syd, _ = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        evaluation_location=SYDNEY[2],
        evaluation_latitude=SYDNEY[0],
        evaluation_longitude=SYDNEY[1],
        target_date=TARGET_DATE,
        target_time="12:00",
    )
    for planet in natal_lon["planets"]:
        assert natal_lon["planets"][planet]["longitude"] == pytest.approx(
            natal_syd["planets"][planet]["longitude"], abs=0.001
        )
        assert natal_lon["planets"][planet]["house"] == natal_syd["planets"][planet]["house"]


def test_invariant_natal_score_unchanged_across_evaluation_locations():
    """birthOnly context ignores evaluation coords — score identical regardless of input."""
    kwargs = dict(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=BIRTH_TIME,
        action_type="business_launch",
        context=CONTEXT_NATAL,
    )
    res_lon, _, _ = score_with_context(
        **kwargs,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    res_syd, _, _ = score_with_context(
        **kwargs,
        evaluation_location=SYDNEY[2],
        evaluation_latitude=SYDNEY[0],
        evaluation_longitude=SYDNEY[1],
    )
    assert res_lon["executive"]["score"] == res_syd["executive"]["score"]
    assert (
        res_lon["strategic"]["component_breakdown"]["aspect_score"]
        == res_syd["strategic"]["component_breakdown"]["aspect_score"]
    )


def test_synastry_context_is_birth_only():
    assert CONTEXT_SYNASTRY.include_natal_house_bonus is True
    assert CONTEXT_SYNASTRY.include_transit_house_score is False
    assert CONTEXT_SYNASTRY.include_transit_angular_score is False
    assert CONTEXT_SYNASTRY.location_mode == "birthOnly"


def test_natal_compute_birth_chart_uses_birth_location_only():
    chart = compute_birth_chart(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
    )
    assert chart["location"] == BIRTH_LOCATION
    assert abs(chart["latitude"] - BIRTH_LAT) < 0.01


def test_component_breakdown_includes_debug_fields():
    result, _, _ = score_with_context(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location=LONDON[2],
        evaluation_latitude=LONDON[0],
        evaluation_longitude=LONDON[1],
    )
    bd = result["strategic"]["component_breakdown"]
    for key in (
        "resolved_local_datetime",
        "resolved_utc_datetime",
        "timezone",
        "location_mode",
        "calculated_for",
        "location_component_score",
    ):
        assert key in bd
        assert bd[key] is not None
