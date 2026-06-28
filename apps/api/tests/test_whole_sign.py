"""
Whole Sign house system regression tests.

Run:
    py -3.11 -m pytest apps/api/tests/test_whole_sign.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chart_data import compute_birth_chart  # noqa: E402

CITIES = [
    ("Rafsanjan", 30.402184, 55.994178),
    ("London", 51.5074, -0.1278),
    ("New York", 40.7128, -74.0060),
    ("Tokyo", 35.6762, 139.6503),
    ("Sydney", -33.8688, 151.2093),
]


def _whole_sign(lat, lon):
    return compute_birth_chart(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="test",
        latitude=lat,
        longitude=lon,
        house_system="whole_sign",
    )


@pytest.mark.parametrize("name,lat,lon", CITIES)
def test_whole_sign_twelve_houses(name, lat, lon):
    chart = _whole_sign(lat, lon)
    assert chart["house_system"] == "whole_sign"
    assert len(chart["houses"]) == 12
    assert all(0 <= c < 360 for c in chart["houses"])


@pytest.mark.parametrize("name,lat,lon", CITIES)
def test_whole_sign_cusps_on_sign_boundaries(name, lat, lon):
    chart = _whole_sign(lat, lon)
    asc = chart["ascendant"]
    asc_sign_start = (int(asc // 30)) * 30.0
    for i, cusp in enumerate(chart["houses"]):
        expected = (asc_sign_start + i * 30.0) % 360.0
        diff = abs((cusp % 360.0) - expected)
        assert diff < 0.1 or abs(diff - 360) < 0.1, f"house {i+1} cusp {cusp} vs {expected}"


def test_placidus_and_whole_sign_both_valid():
    placidus = compute_birth_chart(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        latitude=30.402184,
        longitude=55.994178,
        house_system="placidus",
    )
    whole = compute_birth_chart(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        latitude=30.402184,
        longitude=55.994178,
        house_system="whole_sign",
    )
    assert placidus["house_system"] == "placidus"
    assert whole["house_system"] == "whole_sign"
    assert placidus["houses"] != whole["houses"]
