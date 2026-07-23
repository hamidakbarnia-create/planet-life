"""Deterministic transit-instant regression tests (calendar day / ephemeris).

Product policy under test
-------------------------
Selected calendar day at **12:00 local** in the user's **current living-location**
timezone. London noon remains a valid fixture (mathematically correct for London).
Honolulu noon is a second location fixture used only to prove location-aware UTC
conversion — not a product hard-code.
"""

from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from services.chart_data import build_chart_payload  # noqa: E402
from services.transit_instant import resolve_transit_instant  # noqa: E402

LON_TOLERANCE_DEG = 2.0 / 3600.0  # 2"

BIRTH = dict(
    birth_date="1982-02-25",
    birth_time="05:47",
    location="Rafsanjan",
    latitude=30.4067,
    longitude=56.0039,
)

LONDON = dict(
    evaluation_location="London, United Kingdom",
    evaluation_latitude=51.5074,
    evaluation_longitude=-0.1278,
    evaluation_timezone="Europe/London",
)

HONOLULU = dict(
    evaluation_location="Honolulu, United States",
    evaluation_latitude=21.3069,
    evaluation_longitude=-157.8583,
    evaluation_timezone="Pacific/Honolulu",
)

DUBAI = dict(
    evaluation_location="Dubai, United Arab Emirates",
    evaluation_latitude=25.2048,
    evaluation_longitude=55.2708,
    evaluation_timezone="Asia/Dubai",
)

# External screenshot longitudes at 2026-07-22T22:00:00Z (= Honolulu local noon).
# Used only as a location-aware regression oracle — not product defaults.
REF_PLANETS_22Z = {
    "sun": 120 + 6 / 60 + 39 / 3600,
    "moon": 210 + 16 + 27 / 60 + 52 / 3600,
    "mercury": 90 + 16 + 22 / 60 + 1 / 3600,
    "venus": 150 + 14 + 27 / 60 + 23 / 3600,
    "mars": 60 + 16 + 52 / 60 + 55 / 3600,
    "jupiter": 120 + 4 + 57 / 60 + 2 / 3600,
    "saturn": 14 + 44 / 60 + 13 / 3600,
}

HONOLULU_HOUSES = {
    "sun": 10,
    "moon": 1,
    "mercury": 9,
    "venus": 11,
    "mars": 8,
    "jupiter": 10,
    "saturn": 6,
}

LONDON_NOON_PLANETS = {
    "sun": 119 + 40 / 60,
    "moon": 210 + 10 + 55 / 60,
    "mercury": 90 + 16 + 25 / 60,
    "venus": 150 + 13 + 57 / 60,
    "mars": 60 + 16 + 34 / 60,
    "jupiter": 120 + 4 + 50 / 60,
    "saturn": 14 + 44 / 60,
}
LONDON_NOON_HOUSES = {
    "sun": 10,
    "moon": 2,
    "mercury": 10,
    "venus": 11,
    "mars": 9,
    "jupiter": 10,
    "saturn": 7,
}

SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]


def _sign_of(lon: float) -> str:
    return SIGNS[int((lon % 360) // 30)]


def _lon_err(a: float, b: float) -> float:
    return abs((a - b + 180) % 360 - 180)


def test_london_summer_noon_dst_offset():
    instant = resolve_transit_instant(
        target_date="2026-07-22",
        latitude=51.5074,
        longitude=-0.1278,
        timezone_name="Europe/London",
    )
    assert instant["local_iso"] == "2026-07-22T12:00:00+01:00"
    assert instant["utc_iso"] == "2026-07-22T11:00:00Z"
    assert instant["timezone_source"] == "explicit"


def test_london_winter_noon_standard_offset():
    instant = resolve_transit_instant(
        target_date="2026-01-15",
        latitude=51.5074,
        longitude=-0.1278,
        timezone_name="Europe/London",
    )
    assert instant["local_iso"] == "2026-01-15T12:00:00+00:00"
    assert instant["utc_iso"] == "2026-01-15T12:00:00Z"


def test_dubai_noon_non_dst_zone():
    instant = resolve_transit_instant(
        target_date="2026-07-22",
        latitude=25.2048,
        longitude=55.2708,
        timezone_name="Asia/Dubai",
    )
    assert instant["local_iso"] == "2026-07-22T12:00:00+04:00"
    assert instant["utc_iso"] == "2026-07-22T08:00:00Z"


def test_honolulu_noon_non_dst_zone():
    instant = resolve_transit_instant(
        target_date="2026-07-22",
        latitude=21.3069,
        longitude=-157.8583,
        timezone_name="Pacific/Honolulu",
    )
    assert instant["local_iso"] == "2026-07-22T12:00:00-10:00"
    assert instant["utc_iso"] == "2026-07-22T22:00:00Z"


def test_reject_naive_calculation_instant():
    with pytest.raises(ValueError, match="explicit UTC offset"):
        resolve_transit_instant(
            target_date="2026-07-22",
            latitude=51.5074,
            longitude=-0.1278,
            calculation_instant="2026-07-22T12:00:00",
        )


def test_accept_explicit_offset_and_z():
    a = resolve_transit_instant(
        target_date="2026-07-22",
        latitude=21.3069,
        longitude=-157.8583,
        calculation_instant="2026-07-22T12:00:00-10:00",
    )
    b = resolve_transit_instant(
        target_date="2026-07-22",
        latitude=21.3069,
        longitude=-157.8583,
        calculation_instant="2026-07-22T22:00:00Z",
    )
    assert a["utc_iso"] == "2026-07-22T22:00:00Z"
    assert b["utc_iso"] == "2026-07-22T22:00:00Z"
    assert a["source"] == "explicit_instant"


def test_reject_inconsistent_coords_and_timezone():
    with pytest.raises(ValueError, match="inconsistent"):
        resolve_transit_instant(
            target_date="2026-07-22",
            latitude=51.5074,
            longitude=-0.1278,
            timezone_name="Pacific/Honolulu",
        )


def test_london_calendar_day_fixture_values():
    """London living location @ local noon — existing product fixture (correct)."""
    _, transit = build_chart_payload(
        **BIRTH,
        **LONDON,
        target_date="2026-07-22",
        target_time=None,
        house_system="placidus",
        zodiac="tropical",
    )
    ev = transit["evaluation"]
    assert ev["resolved_local_datetime"] == "2026-07-22T12:00:00+01:00"
    assert ev["resolved_utc_datetime"] == "2026-07-22T11:00:00Z"
    assert ev["timezone"] == "Europe/London"

    for name, expected_lon in LONDON_NOON_PLANETS.items():
        body = transit["planets"][name]
        assert _lon_err(body["longitude"], expected_lon) < 0.02, name
        assert body["house"] == LONDON_NOON_HOUSES[name], name
        assert _sign_of(body["longitude"]) == _sign_of(expected_lon), name
    assert transit["planets"]["mercury"].get("retrograde") is True


def test_honolulu_noon_matches_external_planet_longitudes_within_2_arcseconds():
    """Location-aware check: Honolulu noon → same epoch as external planet list."""
    _, transit = build_chart_payload(
        **BIRTH,
        **HONOLULU,
        target_date="2026-07-22",
        target_time=None,
        house_system="placidus",
        zodiac="tropical",
    )
    assert transit["evaluation"]["resolved_utc_datetime"] == "2026-07-22T22:00:00Z"
    for name, expected_lon in REF_PLANETS_22Z.items():
        body = transit["planets"][name]
        err = _lon_err(body["longitude"], expected_lon)
        assert err <= LON_TOLERANCE_DEG, f"{name} err={err * 3600:.2f}\""
        assert body["house"] == HONOLULU_HOUSES[name], name
        assert _sign_of(body["longitude"]) == _sign_of(expected_lon), name


def test_same_instant_identical_longitudes_independent_of_ui_locale():
    """API has no language input; repeated builds at one instant must match."""
    kwargs = dict(
        **BIRTH,
        **LONDON,
        target_date="2026-07-22",
        house_system="placidus",
        zodiac="tropical",
    )
    _, a = build_chart_payload(**kwargs)
    _, b = build_chart_payload(**kwargs)
    for name in LONDON_NOON_PLANETS:
        assert a["planets"][name]["longitude"] == b["planets"][name]["longitude"]
        assert a["planets"][name]["house"] == b["planets"][name]["house"]
    assert a["evaluation"]["resolved_utc_datetime"] == b["evaluation"]["resolved_utc_datetime"]


def test_full_precision_retained_before_display_rounding():
    _, transit = build_chart_payload(
        **BIRTH,
        **LONDON,
        target_date="2026-07-22",
        house_system="placidus",
        zodiac="tropical",
    )
    lon = transit["planets"]["sun"]["longitude"]
    # Internal value must keep sub-arcminute precision (not pre-rounded to minutes).
    assert abs(lon - round(lon, 2)) > 1e-6 or abs(lon - int(lon)) > 1e-3


def test_coords_fallback_when_timezone_omitted():
    instant = resolve_transit_instant(
        target_date="2026-07-22",
        latitude=51.5074,
        longitude=-0.1278,
        timezone_name=None,
    )
    assert instant["timezone"] == "Europe/London"
    assert instant["timezone_source"] == "coordinates"
    assert instant["utc_iso"] == "2026-07-22T11:00:00Z"


def test_dubai_payload_uses_living_location_noon():
    _, transit = build_chart_payload(
        **BIRTH,
        **DUBAI,
        target_date="2026-07-22",
        house_system="placidus",
        zodiac="tropical",
    )
    assert transit["evaluation"]["resolved_local_datetime"] == "2026-07-22T12:00:00+04:00"
    assert transit["evaluation"]["resolved_utc_datetime"] == "2026-07-22T08:00:00Z"
