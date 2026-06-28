from __future__ import annotations
import logging
import math
import re
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

logger = logging.getLogger("planet_life.chart")

_COORD_PATTERN = re.compile(
    r"^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$"
)

PLacidus_MAX_RELIABLE_LAT = 66.5
PLacidus_USER_MESSAGE = (
    "Placidus houses cannot be calculated reliably for this latitude. "
    "Please switch to Whole Sign."
)


class PlacidusLatitudeError(ValueError):
    """Raised when Placidus house cusps are invalid at high latitude."""

    def __init__(self, message: str = PLacidus_USER_MESSAGE):
        super().__init__(message)
def _planet_bodies(swe):
    return (
        (swe.SUN, "sun"),(swe.MOON, "moon"),(swe.MERCURY, "mercury"),
        (swe.VENUS, "venus"),(swe.MARS, "mars"),(swe.JUPITER, "jupiter"),
        (swe.SATURN, "saturn"),(swe.URANUS, "uranus"),(swe.NEPTUNE, "neptune"),
        (swe.PLUTO, "pluto"),(swe.TRUE_NODE, "north_node"),
    )

class ChartComputationError(RuntimeError):
    pass

def _import_swisseph():
    try:
        import swisseph as swe
        swe.set_ephe_path('')
    except ImportError as exc:
        raise ChartComputationError("pyswisseph not installed") from exc
    return swe

def resolve_location(location, latitude=None, longitude=None):
    """Resolve birth location, preferring explicit coordinates when provided.

    Returns (lat, lon, coordinate_source).
    """
    if latitude is not None and longitude is not None:
        lat = float(latitude)
        lon = float(longitude)
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            raise ValueError("Invalid coordinates.")
        return lat, lon, "selected_city_coordinates"
    coord_match = _COORD_PATTERN.match(location)
    if coord_match:
        lat = float(coord_match.group(1))
        lon = float(coord_match.group(2))
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            raise ValueError("Invalid coordinates.")
        return lat, lon, "explicit_coordinates"
    lat, lon = resolve_coordinates(location)
    return lat, lon, "geocoded_fallback"


@lru_cache(maxsize=2048)
def resolve_coordinates(location):
    """Resolve a location string ('City' or 'lat,lon') to (lat, lon).

    Cached across the process so repeated requests for the same location
    don't re-hit Nominatim. This is the single biggest speed-up: a 30-day
    calendar batch previously did 30 geocoding HTTP calls.
    """
    coord_match = _COORD_PATTERN.match(location)
    if coord_match:
        lat = float(coord_match.group(1))
        lon = float(coord_match.group(2))
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            raise ValueError("Invalid coordinates.")
        return lat, lon
    from geopy.geocoders import Nominatim
    geolocator = Nominatim(user_agent="planet-life-api/1.0")
    result = geolocator.geocode(location.strip(), timeout=10)
    if result is None:
        raise ValueError(f"Could not resolve location: {location!r}")
    return float(result.latitude), float(result.longitude)

@lru_cache(maxsize=2048)
def _timezone_at(lat, lon):
    from timezonefinder import TimezoneFinder
    tz_name = TimezoneFinder().timezone_at(lat=lat, lng=lon)
    if not tz_name:
        raise ValueError(f"No timezone found for ({lat}, {lon}).")
    return tz_name

def _local_datetime(date_str, time_str, lat, lon):
    import pytz
    hour, minute = (int(p) for p in time_str.split(":"))
    tz = pytz.timezone(_timezone_at(lat, lon))
    naive_dt = datetime(*[int(x) for x in date_str.split("-")], hour=hour, minute=minute)
    return tz.localize(naive_dt)

def _planet_house(longitude, cusps):
    lon = longitude % 360.0
    for index in range(12):
        start = cusps[index] % 360.0
        end = cusps[(index + 1) % 12] % 360.0
        if start <= end:
            if start <= lon < end:
                return index + 1
        elif lon >= start or lon < end:
            return index + 1
    return 1

_HOUSE_SYSTEMS = {
    "placidus": b"P",
    "whole_sign": b"W",
}

_AYANAMSA = "Fagan-Bradley"


def _extract_cusp_list(cusps) -> list[float]:
    if len(cusps) >= 13:
        return [float(cusps[i]) for i in range(1, 13)]
    return [float(c) for c in cusps[:12]]


def _compute_houses(swe, jd_ut: float, lat: float, lon: float, hs: bytes):
    """Compute house cusps; raises PlacidusLatitudeError when Placidus is invalid."""
    if hs == b"P" and abs(lat) > PLacidus_MAX_RELIABLE_LAT:
        try:
            cusps, ascmc = swe.houses(jd_ut, lat, lon, hs)
        except Exception as exc:
            raise PlacidusLatitudeError() from exc
        cusp_list = _extract_cusp_list(cusps)
        _validate_placidus_cusps(cusp_list, ascmc)
        return cusp_list, ascmc

    cusps, ascmc = swe.houses(jd_ut, lat, lon, hs)
    cusp_list = _extract_cusp_list(cusps)
    if hs == b"P":
        _validate_placidus_cusps(cusp_list, ascmc)
    elif hs == b"W":
        _validate_whole_sign_cusps(cusp_list, ascmc)
    return cusp_list, ascmc


def _validate_placidus_cusps(cusp_list: list[float], ascmc) -> None:
    asc = float(ascmc[0])
    mc = float(ascmc[1])
    values = cusp_list + [asc, mc]
    if not all(math.isfinite(v) for v in values):
        raise PlacidusLatitudeError()
    # Degenerate Placidus at polar latitudes — duplicate or collapsed cusps.
    rounded = [round(c, 2) for c in cusp_list]
    if len(set(rounded)) < 6:
        raise PlacidusLatitudeError()
    spans = []
    for i in range(12):
        a = cusp_list[i] % 360.0
        b = cusp_list[(i + 1) % 12] % 360.0
        span = (b - a) % 360.0
        spans.append(span)
    if any(s <= 0.01 or s >= 359.99 for s in spans):
        raise PlacidusLatitudeError()


def _validate_whole_sign_cusps(cusp_list: list[float], ascmc) -> None:
    if len(cusp_list) != 12:
        raise ValueError("Whole Sign houses must contain 12 cusps.")
    if not all(math.isfinite(c) for c in cusp_list):
        raise ValueError("Invalid Whole Sign house cusp values.")
    asc = float(ascmc[0])
    if not math.isfinite(asc):
        raise ValueError("Invalid ascendant for Whole Sign chart.")
    # Whole sign: each cusp falls on a sign boundary (multiples of 30 from ASC sign).
    asc_sign_start = math.floor(asc / 30.0) * 30.0
    for i, cusp in enumerate(cusp_list):
        expected = (asc_sign_start + i * 30.0) % 360.0
        diff = abs((cusp % 360.0) - expected)
        if diff > 0.05 and abs(diff - 360.0) > 0.05:
            raise ValueError(f"Whole Sign cusp {i + 1} unexpected: {cusp} vs {expected}")


def _sidereal_ayanamsa(swe, jd_ut: float) -> float:
    swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
    return float(swe.get_ayanamsa_ut(jd_ut))


def _tropical_longitude(swe, jd_ut: float, pid: int, flags: int) -> float:
    """Planet longitude in tropical zodiac regardless of sidereal flag state."""
    result, _ = swe.calc_ut(jd_ut, pid, flags & ~swe.FLG_SIDEREAL)
    return float(result[0])

def _build_chart_payload(dt_local, lat, lon, *, house_system: str = "placidus", zodiac: str = "tropical"):
    swe = _import_swisseph()
    dt_utc = dt_local.astimezone(timezone.utc)
    jd_ut = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day,
        dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0, swe.GREG_CAL)
    hs = _HOUSE_SYSTEMS.get(house_system, b"P")
    cusps, ascmc = swe.houses(jd_ut, lat, lon, hs)
    cusp_list = _extract_cusp_list(cusps)
    if zodiac == "sidereal":
        swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
    # FLG_SPEED is REQUIRED to compute planetary speed; without it, Swiss
    # Ephemeris returns speed=0 for every body and retrograde detection silently
    # fails. This was a critical credibility bug — Pluto/Mercury/Saturn retros
    # would never light up in the UI.
    calc_flags = swe.FLG_MOSEPH | swe.FLG_SPEED
    if zodiac == "sidereal":
        calc_flags |= swe.FLG_SIDEREAL
    planets = {}
    for planet_id, name in _planet_bodies(swe):
        result, _flag = swe.calc_ut(jd_ut, planet_id, calc_flags)
        longitude = float(result[0])
        speed = float(result[3]) if len(result) > 3 else 0.0
        body = {
            "longitude": longitude,
            "house": _planet_house(longitude, cusp_list),
            "speed": speed,
        }
        if speed < 0:
            body["retrograde"] = True
        planets[name] = body
    return {"planets": planets}


def compute_birth_chart(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    latitude: float | None = None,
    longitude: float | None = None,
    house_system: str = "placidus",
    zodiac: str = "tropical",
    node_type: str = "mean",
    country: str | None = None,
) -> dict[str, Any]:
    """Full natal chart payload for the profile renderer (Swiss Ephemeris)."""
    from datetime import datetime as dt_now

    lat, lon, coordinate_source = resolve_location(location, latitude, longitude)
    natal_dt = _local_datetime(birth_date, birth_time, lat, lon)
    swe = _import_swisseph()
    dt_utc = natal_dt.astimezone(timezone.utc)
    jd_ut = swe.julday(
        dt_utc.year,
        dt_utc.month,
        dt_utc.day,
        dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0,
        swe.GREG_CAL,
    )
    if zodiac == "sidereal":
        swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
    hs = _HOUSE_SYSTEMS.get(house_system, b"P")
    cusp_list, ascmc = _compute_houses(swe, jd_ut, lat, lon, hs)
    ayanamsa = _sidereal_ayanamsa(swe, jd_ut) if zodiac == "sidereal" else 0.0
    calc_flags = swe.FLG_MOSEPH | swe.FLG_SPEED
    if zodiac == "sidereal":
        calc_flags |= swe.FLG_SIDEREAL
    node_id = swe.TRUE_NODE if node_type == "true" else swe.MEAN_NODE
    bodies = [
        (swe.SUN, "sun"),
        (swe.MOON, "moon"),
        (swe.MERCURY, "mercury"),
        (swe.VENUS, "venus"),
        (swe.MARS, "mars"),
        (swe.JUPITER, "jupiter"),
        (swe.SATURN, "saturn"),
        (swe.URANUS, "uranus"),
        (swe.NEPTUNE, "neptune"),
        (swe.PLUTO, "pluto"),
        (node_id, "north_node"),
    ]
    planets: dict[str, Any] = {}
    for pid, name in bodies:
        result, _ = swe.calc_ut(jd_ut, pid, calc_flags)
        lng = float(result[0])
        spd = float(result[3]) if len(result) > 3 else 0.0
        body: dict[str, Any] = {
            "longitude": round(lng, 4),
            "house": _planet_house(lng, cusp_list),
            "sign": int(lng // 30) + 1,
            "degree": round(lng % 30, 2),
            "retrograde": spd < 0,
        }
        planets[name] = body
    tz_name = _timezone_at(lat, lon)
    zodiac_label = "Sidereal" if zodiac == "sidereal" else "Tropical"
    return {
        "planets": planets,
        "ascendant": round(float(ascmc[0]), 4),
        "midheaven": round(float(ascmc[1]), 4),
        "houses": [round(c, 4) for c in cusp_list],
        "latitude": lat,
        "longitude": lon,
        "timezone": tz_name,
        "local_datetime": natal_dt.isoformat(),
        "utc_datetime": dt_utc.strftime("%Y-%m-%d %H:%M:%S"),
        "julian_day": round(jd_ut, 8),
        "house_system": house_system,
        "zodiac": zodiac,
        "node_type": "true" if node_type == "true" else "mean",
        "location": location,
        "country": country,
        "ephemeris_engine": "Swiss Ephemeris",
        "zodiac_label": zodiac_label,
        "ayanamsa": round(ayanamsa, 4) if zodiac == "sidereal" else None,
        "ayanamsa_system": _AYANAMSA if zodiac == "sidereal" else None,
        "timezone_source": "IANA",
        "coordinate_source": coordinate_source,
        "calculation_timestamp": dt_now.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

def preview_birth_location(
    location: str,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict[str, Any]:
    """Resolve coordinates and IANA timezone — same path as chart API, no ephemeris."""
    lat, lon, coordinate_source = resolve_location(location, latitude, longitude)
    tz_name = _timezone_at(lat, lon)
    return {
        "latitude": lat,
        "longitude": lon,
        "timezone": tz_name,
        "coordinate_source": coordinate_source,
        "timezone_source": "IANA",
    }


def build_chart_payload(
    *,
    birth_date,
    birth_time,
    location,
    target_date,
    target_time=None,
    house_system: str = "placidus",
    zodiac: str = "tropical",
):
    lat, lon = resolve_coordinates(location)
    natal_dt = _local_datetime(birth_date, birth_time, lat, lon)
    transit_dt = _local_datetime(target_date, target_time or birth_time, lat, lon)
    chart_kw = {"house_system": house_system, "zodiac": zodiac}
    user_natal_data = _build_chart_payload(natal_dt, lat, lon, **chart_kw)
    current_transit_data = _build_chart_payload(transit_dt, lat, lon, **chart_kw)
    current_transit_data["evaluation"] = {
        "target_date": target_date, "location": location,
        "latitude": lat, "longitude": lon,
    }
    return user_natal_data, current_transit_data
