from __future__ import annotations
import re
from datetime import datetime, timezone
from typing import Any

_COORD_PATTERN = re.compile(
    r"^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$"
)

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

def resolve_coordinates(location):
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


def _build_chart_payload(dt_local, lat, lon, *, house_system: str = "placidus", zodiac: str = "tropical"):
    swe = _import_swisseph()
    dt_utc = dt_local.astimezone(timezone.utc)
    jd_ut = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day,
        dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0, swe.GREG_CAL)
    hs = _HOUSE_SYSTEMS.get(house_system, b"P")
    cusps, _ascmc = swe.houses(jd_ut, lat, lon, hs)
    cusp_list = [float(cusps[i]) for i in range(1, 13)] if len(cusps) >= 13 else [float(c) for c in cusps[:12]]
    if zodiac == "sidereal":
        swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
    calc_flags = swe.FLG_MOSEPH
    if zodiac == "sidereal":
        calc_flags |= swe.FLG_SIDEREAL
    planets = {}
    for planet_id, name in _planet_bodies(swe):
        try:
            result, _flag = swe.calc_ut(jd_ut, planet_id, calc_flags)
        except Exception:
            result, _flag = swe.calc_ut(jd_ut, planet_id, calc_flags | swe.FLG_SPEED)
        longitude = float(result[0])
        speed = float(result[3]) if len(result) > 3 else 0.0
        body = {"longitude": longitude, "house": _planet_house(longitude, cusp_list)}
        if speed < 0:
            body["retrograde"] = True
        planets[name] = body
    return {"planets": planets}

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
