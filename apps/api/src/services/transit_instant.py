"""Canonical calculation instant for calendar-day / transit snapshots.

Product policy
--------------
For a selected calendar day without an explicit clock time, METIORO evaluates
transits at **12:00 local wall time** in the user's **current living-location**
timezone (evaluation location). That same instant drives planetary longitudes,
aspects, houses, and calendar-day scoring metadata.

Timestamp precedence (deterministic)
------------------------------------
1. ``calculation_instant`` — explicit ISO-8601 with offset or ``Z`` (required if set)
2. ``evaluation_timezone`` / living-location IANA timezone + local wall time
3. Fallback: IANA zone derived from evaluation latitude/longitude (TimezoneFinder)

Browser/OS timezone is never consulted on this path.
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import pytz


DEFAULT_TRANSIT_LOCAL_TIME = "12:00"


@lru_cache(maxsize=2048)
def timezone_at(lat: float, lon: float) -> str:
    from timezonefinder import TimezoneFinder

    tz_name = TimezoneFinder().timezone_at(lat=lat, lng=lon)
    if not tz_name:
        raise ValueError(f"No timezone found for ({lat}, {lon}).")
    return tz_name


def _validate_iana(name: str) -> str:
    cleaned = name.strip()
    if not cleaned:
        raise ValueError("IANA timezone must be a non-empty string.")
    try:
        ZoneInfo(cleaned)
    except ZoneInfoNotFoundError as exc:
        raise ValueError(f"Unknown IANA timezone: {cleaned!r}") from exc
    return cleaned


def assert_coords_match_timezone(
    *,
    target_date: str,
    target_time: str,
    latitude: float,
    longitude: float,
    timezone_name: str,
) -> None:
    """Reject lat/lon + timezone pairs that disagree on the UTC instant.

    Same living location must supply both coordinates (houses) and timezone
    (civil clock). If the explicit zone converts local noon to a different UTC
    than the zone derived from the coordinates, the combination is rejected.
    """
    derived = timezone_at(latitude, longitude)
    if derived == timezone_name:
        return
    hour, minute = parse_hhmm(target_time)
    y, m, d = (int(p) for p in target_date.split("-"))
    naive_local = datetime(y, m, d, hour, minute, 0)
    explicit_utc = pytz.timezone(timezone_name).localize(
        naive_local, is_dst=None
    ).astimezone(timezone.utc)
    derived_utc = pytz.timezone(derived).localize(
        naive_local, is_dst=None
    ).astimezone(timezone.utc)
    if explicit_utc != derived_utc:
        raise ValueError(
            f"Timezone {timezone_name!r} is inconsistent with coordinates "
            f"({latitude}, {longitude}), which resolve to {derived!r} "
            f"for {target_date} {target_time}."
        )


def resolve_iana_timezone(
    *,
    latitude: float,
    longitude: float,
    explicit_timezone: str | None = None,
) -> str:
    """Return the IANA zone used for localization.

    Precedence: explicit living-location timezone, else coords → TimezoneFinder.
    """
    if explicit_timezone:
        return _validate_iana(explicit_timezone)
    return timezone_at(latitude, longitude)


def parse_hhmm(time_str: str) -> tuple[int, int]:
    parts = time_str.split(":")
    if len(parts) != 2:
        raise ValueError(f"Invalid time (expected HH:MM): {time_str!r}")
    hour, minute = (int(parts[0]), int(parts[1]))
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError(f"Invalid time components: {time_str!r}")
    return hour, minute


def resolve_transit_instant(
    *,
    target_date: str,
    target_time: str | None = None,
    latitude: float,
    longitude: float,
    timezone_name: str | None = None,
    calculation_instant: str | None = None,
) -> dict[str, Any]:
    """Resolve the single canonical instant for a transit calculation.

    Parameters
    ----------
    target_date:
        Calendar day ``YYYY-MM-DD`` (civil date at the evaluation location).
    target_time:
        Local clock ``HH:MM``. Defaults to ``12:00`` (calendar-day policy).
    latitude / longitude:
        Evaluation (current living) coordinates — used for houses and, when no
        explicit timezone is given, for IANA zone lookup.
    timezone_name:
        Living-location IANA timezone. When set with coords, must agree on the
        UTC conversion of the civil wall time (see ``assert_coords_match_timezone``).
    calculation_instant:
        Optional explicit ISO-8601 timestamp with offset (or ``Z``). Highest
        precedence for ephemeris timing; naive timestamps are rejected.
        Coordinates still define the house circle.
    """
    if calculation_instant:
        return _from_explicit_instant(calculation_instant, latitude, longitude)

    time_str = target_time if target_time is not None else DEFAULT_TRANSIT_LOCAL_TIME
    hour, minute = parse_hhmm(time_str)
    y, m, d = (int(p) for p in target_date.split("-"))
    explicit = timezone_name.strip() if timezone_name else None
    if explicit:
        iana = _validate_iana(explicit)
        assert_coords_match_timezone(
            target_date=target_date,
            target_time=time_str,
            latitude=latitude,
            longitude=longitude,
            timezone_name=iana,
        )
    else:
        iana = timezone_at(latitude, longitude)
    naive_local = datetime(y, m, d, hour, minute, 0)
    local_dt = pytz.timezone(iana).localize(naive_local, is_dst=None)
    utc_dt = local_dt.astimezone(timezone.utc)
    return {
        "local_datetime": local_dt,
        "utc_datetime": utc_dt,
        "local_iso": local_dt.isoformat(),
        "utc_iso": _utc_z(utc_dt),
        "timezone": iana,
        "target_date": target_date,
        "target_time": time_str,
        "source": "local_wall_time",
        "timezone_source": "explicit" if explicit else "coordinates",
        "latitude": latitude,
        "longitude": longitude,
    }


def _from_explicit_instant(
    calculation_instant: str,
    latitude: float,
    longitude: float,
) -> dict[str, Any]:
    raw = calculation_instant.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError as exc:
        raise ValueError(
            f"calculation_instant must be ISO-8601 with offset, got {calculation_instant!r}"
        ) from exc
    if parsed.tzinfo is None:
        raise ValueError(
            "calculation_instant must include an explicit UTC offset (or Z); "
            "naive timestamps are rejected."
        )
    utc_dt = parsed.astimezone(timezone.utc)
    local_dt = parsed
    # Prefer the offset's zone key when available; else derive from coords.
    tz_key = getattr(parsed.tzinfo, "key", None)
    if not tz_key:
        tz_key = timezone_at(latitude, longitude)
        local_dt = utc_dt.astimezone(ZoneInfo(tz_key))
    return {
        "local_datetime": local_dt,
        "utc_datetime": utc_dt,
        "local_iso": local_dt.isoformat(),
        "utc_iso": _utc_z(utc_dt),
        "timezone": tz_key,
        "target_date": local_dt.date().isoformat(),
        "target_time": local_dt.strftime("%H:%M"),
        "source": "explicit_instant",
        "timezone_source": "explicit_instant",
        "latitude": latitude,
        "longitude": longitude,
    }


def _utc_z(dt: datetime) -> str:
    return (
        dt.astimezone(timezone.utc)
        .replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )
