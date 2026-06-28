"""
Multi-city regression tests — chart payload completeness across global locations.

Run from repo root:
    py -3.11 -m pytest apps/api/tests/test_multi_city_charts.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chart_data import compute_birth_chart  # noqa: E402

REQUIRED_PLANETS = (
    "sun", "moon", "mercury", "venus", "mars",
    "jupiter", "saturn", "uranus", "neptune", "pluto", "north_node",
)

# name, lat, lon, expected IANA timezone
CITIES = [
    ("Tehran", 35.6892, 51.3890, "Asia/Tehran"),
    ("Rafsanjan", 30.402184, 55.994178, "Asia/Tehran"),
    ("Mashhad", 36.2970, 59.6062, "Asia/Tehran"),
    ("London", 51.5074, -0.1278, "Europe/London"),
    ("Manchester", 53.4808, -2.2426, "Europe/London"),
    ("Dubai", 25.2048, 55.2708, "Asia/Dubai"),
    ("Abu Dhabi", 24.4539, 54.3773, "Asia/Dubai"),
    ("New York", 40.7128, -74.0060, "America/New_York"),
    ("Los Angeles", 34.0522, -118.2437, "America/Los_Angeles"),
    ("Toronto", 43.6532, -79.3832, "America/Toronto"),
    ("Sydney", -33.8688, 151.2093, "Australia/Sydney"),
    ("Tokyo", 35.6762, 139.6503, "Asia/Tokyo"),
    ("Delhi", 28.7041, 77.1025, "Asia/Kolkata"),
    ("Moscow", 55.7558, 37.6173, "Europe/Moscow"),
]


def _chart_for_city(name: str, lat: float, lon: float, **kwargs):
    defaults = dict(
        birth_date="1990-06-15",
        birth_time="14:30",
        location=name,
        latitude=lat,
        longitude=lon,
        house_system="placidus",
        zodiac="tropical",
        node_type="mean",
    )
    defaults.update(kwargs)
    return compute_birth_chart(**defaults)


def _assert_chart_structure(chart: dict, *, lat: float, lon: float, tz: str, city: str):
    assert abs(chart["latitude"] - lat) < 0.001, f"{city}: latitude not preserved"
    assert abs(chart["longitude"] - lon) < 0.001, f"{city}: longitude not preserved"
    assert chart["timezone"] == tz, f"{city}: timezone {chart['timezone']} != {tz}"
    assert chart["utc_datetime"], f"{city}: missing UTC datetime"
    assert isinstance(chart["ascendant"], float), f"{city}: missing ascendant"
    assert isinstance(chart["midheaven"], float), f"{city}: missing midheaven"
    assert len(chart["houses"]) == 12, f"{city}: expected 12 house cusps"
    assert all(isinstance(c, float) for c in chart["houses"]), f"{city}: invalid house cusp"
    for pname in REQUIRED_PLANETS:
        assert pname in chart["planets"], f"{city}: missing planet {pname}"
        body = chart["planets"][pname]
        assert "longitude" in body and isinstance(body["longitude"], float)
        assert 1 <= body["sign"] <= 12
        assert 0 <= body["degree"] < 30
        assert "retrograde" in body
        assert isinstance(body["retrograde"], bool)
    assert chart["coordinate_source"] == "selected_city_coordinates"
    assert chart["ephemeris_engine"] == "Swiss Ephemeris"
    assert chart["timezone_source"] == "IANA"
    assert chart["house_system"] == "placidus"
    assert chart["node_type"] == "mean"


@pytest.mark.parametrize("city,lat,lon,tz", CITIES)
def test_multi_city_chart_structure(city, lat, lon, tz):
    chart = _chart_for_city(city, lat, lon)
    _assert_chart_structure(chart, lat=lat, lon=lon, tz=tz, city=city)


@pytest.mark.parametrize("city,lat,lon,tz", CITIES)
def test_multi_city_asc_mc_in_range(city, lat, lon, tz):
    chart = _chart_for_city(city, lat, lon)
    assert 0 <= chart["ascendant"] < 360
    assert 0 <= chart["midheaven"] < 360
    for cusp in chart["houses"]:
        assert 0 <= cusp < 360
