"""
Regression test for the Rafsanjan reference chart (Astro-Seek compatible).

Input:
  25 Feb 1982, 05:47, Rafsanjan, Iran
  Tropical, Placidus, Mean Node

Run from repo root:
    py -3.11 -m pytest apps/api/tests/test_rafsanjan_chart.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chart_data import compute_birth_chart  # noqa: E402

RAFSANJAN_LAT = 30.402184
RAFSANJAN_LON = 55.994178


def _chart(**kwargs):
    defaults = dict(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan, Iran",
        latitude=RAFSANJAN_LAT,
        longitude=RAFSANJAN_LON,
        house_system="placidus",
        zodiac="tropical",
        node_type="mean",
    )
    defaults.update(kwargs)
    return compute_birth_chart(**defaults)


def _sign_degree(longitude: float) -> tuple[int, float]:
    sign = int(longitude // 30) + 1
    degree = longitude % 30
    return sign, degree


def test_rafsanjan_utc_and_julian_day():
    chart = _chart()
    assert chart["utc_datetime"] == "1982-02-25 02:17:00"
    assert chart["timezone"] == "Asia/Tehran"
    assert abs(chart["julian_day"] - 2445025.59513889) < 0.0001


def test_rafsanjan_ascendant_and_midheaven():
    chart = _chart()
    asc_sign, asc_deg = _sign_degree(chart["ascendant"])
    mc_sign, mc_deg = _sign_degree(chart["midheaven"])
    # Aquarius = sign 11, Sagittarius = sign 9
    assert asc_sign == 11
    assert abs(asc_deg - 24.6) < 0.5
    assert mc_sign == 9
    assert abs(mc_deg - 6.72) < 0.5


def test_rafsanjan_planets():
    chart = _chart()
    p = chart["planets"]

    def check(name: str, sign: int, deg: float, *, retro: bool = False):
        body = p[name]
        s, d = _sign_degree(body["longitude"])
        assert s == sign, f"{name} sign {s} != {sign}"
        assert abs(d - deg) < 0.5, f"{name} deg {d} != {deg}"
        if retro:
            assert body.get("retrograde") is True

    check("sun", 12, 6.08)       # Pisces
    check("moon", 12, 20.98)     # Pisces
    check("mercury", 11, 9.32)   # Aquarius
    check("venus", 10, 27.03)    # Capricorn
    check("mars", 7, 19.05, retro=True)     # Libra R
    check("jupiter", 8, 10.32, retro=True)    # Scorpio R
    check("saturn", 7, 21.70, retro=True)     # Libra R


def test_rafsanjan_mean_node():
    chart = _chart(node_type="mean")
    node = chart["planets"]["north_node"]
    sign, deg = _sign_degree(node["longitude"])
    assert sign == 4  # Cancer
    assert abs(deg - 20.27) < 0.5
    assert chart["node_type"] == "mean"


def test_rafsanjan_houses_count():
    chart = _chart()
    assert len(chart["houses"]) == 12
    assert all(isinstance(c, float) for c in chart["houses"])


def test_rafsanjan_provenance_metadata():
    chart = _chart()
    assert chart["ephemeris_engine"] == "Swiss Ephemeris"
    assert chart["zodiac_label"] == "Tropical"
    assert chart["timezone_source"] == "IANA"
    assert chart["coordinate_source"] == "selected_city_coordinates"
    assert chart["calculation_timestamp"]


def test_provided_coords_preferred_over_geocode_name():
    """Explicit lat/lon must win even if location string differs."""
    chart = _chart(location="Wrong City Name", latitude=RAFSANJAN_LAT, longitude=RAFSANJAN_LON)
    assert chart["utc_datetime"] == "1982-02-25 02:17:00"
    assert abs(chart["latitude"] - RAFSANJAN_LAT) < 0.001
    assert abs(chart["longitude"] - RAFSANJAN_LON) < 0.001
