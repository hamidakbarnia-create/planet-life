"""
Historical timezone regression tests — IANA offsets, not fixed UTC offsets.

Verifies that UTC conversion uses pytz/IANA historical rules for edge dates.

Run from repo root:
    py -3.11 -m pytest apps/api/tests/test_historical_timezones.py -v
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

import pytest
import pytz

ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chart_data import compute_birth_chart  # noqa: E402


def _expected_utc(tz_name: str, date_str: str, time_str: str) -> str:
    """Compute expected UTC string via IANA timezone (ground truth)."""
    hour, minute = (int(p) for p in time_str.split(":"))
    tz = pytz.timezone(tz_name)
    local = tz.localize(
        datetime(*(int(x) for x in date_str.split("-")), hour=hour, minute=minute)
    )
    utc = local.astimezone(pytz.UTC)
    return utc.strftime("%Y-%m-%d %H:%M:%S")


# (label, birth_date, birth_time, lat, lon, tz, location)
HISTORICAL_CASES = [
    (
        "London 1900 (GMT, no BST)",
        "1900-01-15",
        "12:00",
        51.5074,
        -0.1278,
        "Europe/London",
        "London",
    ),
    (
        "London 1950 summer (BST +1)",
        "1950-07-01",
        "12:00",
        51.5074,
        -0.1278,
        "Europe/London",
        "London",
    ),
    (
        "Rafsanjan 1982 (+03:30 Iran)",
        "1982-02-25",
        "05:47",
        30.402184,
        55.994178,
        "Asia/Tehran",
        "Rafsanjan",
    ),
    (
        "New York 2000 (EST/EDT)",
        "2000-07-04",
        "12:00",
        40.7128,
        -74.0060,
        "America/New_York",
        "New York",
    ),
    (
        "Sydney 2025 summer (AEDT)",
        "2025-01-15",
        "12:00",
        -33.8688,
        151.2093,
        "Australia/Sydney",
        "Sydney",
    ),
    (
        "Moscow 2025 (MSK UTC+3)",
        "2025-01-15",
        "12:00",
        55.7558,
        37.6173,
        "Europe/Moscow",
        "Moscow",
    ),
    (
        "Delhi 1950",
        "1950-08-15",
        "06:30",
        28.7041,
        77.1025,
        "Asia/Kolkata",
        "Delhi",
    ),
    (
        "Tokyo 1900",
        "1900-06-01",
        "09:00",
        35.6762,
        139.6503,
        "Asia/Tokyo",
        "Tokyo",
    ),
]


@pytest.mark.parametrize("label,date,time,lat,lon,tz,location", HISTORICAL_CASES)
def test_historical_utc_conversion(label, date, time, lat, lon, tz, location):
    chart = compute_birth_chart(
        birth_date=date,
        birth_time=time,
        location=location,
        latitude=lat,
        longitude=lon,
    )
    expected_utc = _expected_utc(tz, date, time)
    assert chart["timezone"] == tz, f"{label}: wrong IANA timezone"
    assert chart["utc_datetime"] == expected_utc, (
        f"{label}: UTC mismatch — got {chart['utc_datetime']}, "
        f"expected {expected_utc} (IANA historical)"
    )
    assert chart["timezone_source"] == "IANA"


@pytest.mark.parametrize("label,date,time,lat,lon,tz,location", HISTORICAL_CASES)
def test_historical_not_naive_offset(label, date, time, lat, lon, tz, location):
    """UTC must come from IANA rules, not a fixed modern offset."""
    chart = compute_birth_chart(
        birth_date=date,
        birth_time=time,
        location=location,
        latitude=lat,
        longitude=lon,
    )
    # Naive offset: use *current* UTC offset at runtime — wrong for historical dates.
    tz_obj = pytz.timezone(tz)
    now_offset = tz_obj.localize(datetime.utcnow()).utcoffset()
    hour, minute = (int(p) for p in time.split(":"))
    naive_utc = datetime(
        *(int(x) for x in date.split("-")), hour=hour, minute=minute
    ) - now_offset
    iana_utc = _expected_utc(tz, date, time)
    # If naive happens to match IANA for this case, skip inequality check.
    if naive_utc.strftime("%Y-%m-%d %H:%M:%S") != iana_utc:
        assert chart["utc_datetime"] == iana_utc
        assert chart["utc_datetime"] != naive_utc.strftime("%Y-%m-%d %H:%M:%S"), (
            f"{label}: chart used naive offset instead of IANA historical rules"
        )


def test_geocoded_fallback_coordinate_source(monkeypatch):
    """Geocoding by name must mark coordinate_source as geocoded_fallback."""
    monkeypatch.setattr(
        "services.chart_data.resolve_coordinates",
        lambda loc: (30.402184, 55.994178),
    )
    chart = compute_birth_chart(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan, Iran",
    )
    assert chart["coordinate_source"] == "geocoded_fallback"
    assert chart["timezone"] == "Asia/Tehran"


def test_selected_coordinates_source():
    chart = compute_birth_chart(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        latitude=30.402184,
        longitude=55.994178,
    )
    assert chart["coordinate_source"] == "selected_city_coordinates"
