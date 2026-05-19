"""
Map birth / target parameters to natal and transit payloads for the scoring engine.
"""

from __future__ import annotations

import re
from datetime import date, datetime, time
from typing import Any

_COORD_PATTERN = re.compile(
    r"^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$"
)

def _planet_bodies(swe: Any) -> tuple[tuple[int, str], ...]:
    return (
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
        (swe.TRUE_NODE, "north_node"),
        (swe.CHIRON, "chiron"),
    )


class ChartComputationError(RuntimeError):
    """Raised when ephemeris / chart data cannot be produced."""


def _import_swisseph():
    try:
        import swisseph as swe  # type: ignore[import-untyped]
    except ImportError as exc:
        raise ChartComputationError(
            "Ephemeris backend (pyswisseph) is not installed. "
            "Install API dependencies from apps/api/requirements.txt."
        ) from exc
    return swe


def resolve_coordinates(location: str) -> tuple[float, float]:
    """Resolve ``location`` to ``(latitude, longitude)``."""
    coord_match = _COORD_PATTERN.match(location)
    if coord_match:
        lat = float(coord_match.group(1))
        lon = float(coord_match.group(2))
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            raise ValueError("Coordinates must be valid latitude (-90..90) and longitude (-180..180).")
        return lat, lon

    try:
        from geopy.geocoders import Nominatim  # type: ignore[import-untyped]
    except ImportError as exc:
        raise ChartComputationError(
            "Geocoding requires geopy. Provide coordinates as 'lat,lon' or install geopy."
        ) from exc

    geolocator = Nominatim(user_agent="planet-life-api/1.0")
    result = geolocator.geocode(location.strip(), timeout=10)
    if result is None:
        raise ValueError(f"Could not resolve location: {location!r}")
    return float(result.latitude), float(result.longitude)


def _timezone_at(lat: float, lon: float) -> str:
    try:
        from timezonefinder import TimezoneFinder  # type: ignore[import-untyped]
    except ImportError as exc:
        raise ChartComputationError(
            "timezonefinder is required to localize birth times. Install API dependencies."
        ) from exc

    tz_name = TimezoneFinder().timezone_at(lat=lat, lng=lon)
    if not tz_name:
        raise ValueError(f"No timezone found for coordinates ({lat}, {lon}).")
    return tz_name


def _local_datetime(
    date_str: str,
    time_str: str,
    lat: float,
    lon: float,
) -> datetime:
    from zoneinfo import ZoneInfo

    hour, minute = (int(part) for part in time_str.split(":"))
    tz = ZoneInfo(_timezone_at(lat, lon))
    return datetime.combine(
        date.fromisoformat(date_str),
        time(hour=hour, minute=minute),
        tzinfo=tz,
    )


def _planet_house(longitude: float, cusps: list[float]) -> int:
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


def _build_chart_payload(dt_local: datetime, lat: float, lon: float) -> dict[str, Any]:
    from datetime import timezone

    swe = _import_swisseph()
    dt_utc = dt_local.astimezone(timezone.utc)

    jd_ut = swe.julday(
        dt_utc.year,
        dt_utc.month,
        dt_utc.day,
        dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0,
        swe.GREG_CAL,
    )

    cusps, _ascmc = swe.houses(jd_ut, lat, lon, b"P")
    # Swiss Ephemeris returns 13 values; index 0 is unused, 1–12 are house cusps.
    if len(cusps) >= 13:
        cusp_list = [float(cusps[i]) for i in range(1, 13)]
    else:
        cusp_list = [float(c) for c in cusps[:12]]

    planets: dict[str, dict[str, Any]] = {}
    for planet_id, name in _planet_bodies(swe):
        result, _flag = swe.calc_ut(jd_ut, planet_id)
        longitude = float(result[0])
        speed = float(result[3]) if len(result) > 3 else 0.0
        body: dict[str, Any] = {
            "longitude": longitude,
            "house": _planet_house(longitude, cusp_list),
        }
        if speed < 0:
            body["retrograde"] = True
        planets[name] = body

    return {"planets": planets}


def build_chart_payload(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    target_date: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Build ``user_natal_data`` and ``current_transit_data`` for ``calculate_activity_score``.

    Natal chart uses birth date/time at ``location``. Transits use ``target_date`` with the
    same clock time and location (electional evaluation at that moment).
    """
    lat, lon = resolve_coordinates(location)

    natal_dt = _local_datetime(birth_date, birth_time, lat, lon)
    transit_dt = _local_datetime(target_date, birth_time, lat, lon)

    user_natal_data = _build_chart_payload(natal_dt, lat, lon)
    current_transit_data = _build_chart_payload(transit_dt, lat, lon)
    current_transit_data["evaluation"] = {
        "target_date": target_date,
        "location": location,
        "latitude": lat,
        "longitude": lon,
    }

    return user_natal_data, current_transit_data
