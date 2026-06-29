"""Location role separation — birth vs evaluation for timing/scoring."""

import sys
import os

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.chart_data import build_chart_payload, compute_birth_chart  # noqa: E402

# Rafsanjan birth reference (user scenario)
BIRTH_DATE = "1982-02-25"
BIRTH_TIME = "05:47"
BIRTH_LOCATION = "Rafsanjan"
BIRTH_LAT = 30.4067
BIRTH_LON = 56.0039

LONDON_LAT = 51.5074
LONDON_LON = -0.1278
NYC_LAT = 40.7128
NYC_LON = -74.0060


def test_natal_chart_uses_birth_location_only():
    chart = compute_birth_chart(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
    )
    assert chart["location"] == BIRTH_LOCATION
    assert abs(chart["latitude"] - BIRTH_LAT) < 0.01
    assert abs(chart["longitude"] - BIRTH_LON) < 0.01


def test_contract_in_london_uses_london_not_rafsanjan():
    natal, transit = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        evaluation_location="London, United Kingdom",
        evaluation_latitude=LONDON_LAT,
        evaluation_longitude=LONDON_LON,
        target_date="2025-06-15",
        target_time="14:00",
    )
    meta = transit["evaluation"]
    assert meta["birth_location"] == BIRTH_LOCATION
    assert meta["evaluation_location"] == "London, United Kingdom"
    assert abs(meta["latitude"] - LONDON_LAT) < 0.01
    assert abs(meta["longitude"] - LONDON_LON) < 0.01
    assert meta["used_birth_for_evaluation"] is False
    # Natal houses differ from transit local houses when evaluation != birth
    natal_sun_house = natal["planets"]["sun"]["house"]
    transit_sun_house = transit["planets"]["sun"]["house"]
    # Not asserting exact house numbers — only that evaluation coords are London
    assert meta["evaluation_latitude"] == pytest.approx(LONDON_LAT, abs=0.01)


def test_nyc_property_uses_target_location():
    _, transit = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        evaluation_location="New York, United States",
        evaluation_latitude=NYC_LAT,
        evaluation_longitude=NYC_LON,
        target_date="2025-08-01",
    )
    meta = transit["evaluation"]
    assert meta["evaluation_location"] == "New York, United States"
    assert abs(meta["evaluation_latitude"] - NYC_LAT) < 0.01
    assert meta["used_birth_for_evaluation"] is False


def test_without_evaluation_falls_back_to_birth_for_api_compat():
    """Legacy clients that only send birth location still work."""
    _, transit = build_chart_payload(
        birth_date=BIRTH_DATE,
        birth_time=BIRTH_TIME,
        location=BIRTH_LOCATION,
        latitude=BIRTH_LAT,
        longitude=BIRTH_LON,
        target_date="2025-06-15",
    )
    meta = transit["evaluation"]
    assert meta["used_birth_for_evaluation"] is True
    assert abs(meta["latitude"] - BIRTH_LAT) < 0.01
