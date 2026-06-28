"""
Sidereal vs Tropical regression tests.

Run:
    py -3.11 -m pytest apps/api/tests/test_sidereal.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chart_data import _import_swisseph, compute_birth_chart  # noqa: E402

CASES = [
    ("Rafsanjan 1982", "1982-02-25", "05:47", 30.402184, 55.994178),
    ("London 1990", "1990-06-15", "14:30", 51.5074, -0.1278),
    ("New York 2000", "2000-01-01", "08:00", 40.7128, -74.0060),
    ("Tokyo 2025", "2025-03-20", "12:00", 35.6762, 139.6503),
    ("Delhi 1950", "1950-08-15", "06:30", 28.7041, 77.1025),
]


def _pair(zodiac: str, date, time, lat, lon):
    return compute_birth_chart(
        birth_date=date,
        birth_time=time,
        location="test",
        latitude=lat,
        longitude=lon,
        zodiac=zodiac,
    )


@pytest.mark.parametrize("label,date,time,lat,lon", CASES)
def test_sidereal_applies_ayanamsa(label, date, time, lat, lon):
    tropical = _pair("tropical", date, time, lat, lon)
    sidereal = _pair("sidereal", date, time, lat, lon)
    assert sidereal["zodiac"] == "sidereal"
    assert sidereal["zodiac_label"] == "Sidereal"
    assert sidereal["ayanamsa"] is not None
    assert sidereal["ayanamsa"] > 20
    assert sidereal["ayanamsa_system"] == "Fagan-Bradley"
    ay = sidereal["ayanamsa"]
    for planet in ("sun", "moon", "mercury"):
        t_lon = tropical["planets"][planet]["longitude"]
        s_lon = sidereal["planets"][planet]["longitude"]
        diff = (t_lon - s_lon) % 360
        if diff > 180:
            diff = 360 - diff
        assert abs(diff - ay) < 0.2, f"{label} {planet}: sidereal offset != ayanamsa"


@pytest.mark.parametrize("label,date,time,lat,lon", CASES)
def test_tropical_has_no_ayanamsa_offset(label, date, time, lat, lon):
    tropical = _pair("tropical", date, time, lat, lon)
    assert tropical["zodiac"] == "tropical"
    assert tropical["zodiac_label"] == "Tropical"
    assert tropical.get("ayanamsa") is None
    swe = _import_swisseph()
    from datetime import timezone as tz_mod
    from services.chart_data import _local_datetime  # noqa: E402

    natal_dt = _local_datetime(date, time, lat, lon)
    dt_utc = natal_dt.astimezone(tz_mod.utc)
    jd = swe.julday(
        dt_utc.year, dt_utc.month, dt_utc.day,
        dt_utc.hour + dt_utc.minute / 60.0, swe.GREG_CAL,
    )
    result, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_MOSEPH | swe.FLG_SPEED)
    pure_tropical = float(result[0])
    assert abs(tropical["planets"]["sun"]["longitude"] - pure_tropical) < 0.05


def test_sidereal_and_tropical_sun_differ():
    tropical = _pair("tropical", *CASES[0][1:])
    sidereal = _pair("sidereal", *CASES[0][1:])
    assert tropical["planets"]["sun"]["longitude"] != sidereal["planets"]["sun"]["longitude"]
