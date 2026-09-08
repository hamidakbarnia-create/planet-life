"""Experimental Sun MC/IC geometry spike. Not production-validated astrocartography.

This module is isolated from relocation scoring, Pathfinder Analyze/Best Times,
and HTTP routes. It must not call Swiss Ephemeris house functions.
"""

from __future__ import annotations

import copy
import math
import sys
from datetime import datetime, timezone
from typing import Any

SCHEMA_VERSION = 1
CALCULATION_VERSION = 1
SPIKE_STATUS = "experimental"
BODY_SUN = "sun"
ANGLE_MC = "MC"
ANGLE_IC = "IC"
LINE_ID_MC = "spike.v1.sun.MC"
LINE_ID_IC = "spike.v1.sun.IC"

LONGITUDE_CONVENTION = "east_positive_open_minus180_to_inclusive_180"
POSITION_CONVENTION = "apparent_geocentric_equatorial"
GAST_SOURCE = "swe.sidtime(JD_UT)"
FORMULA_MC = "normalize(ra_deg - gast_deg)"
FORMULA_IC = "normalize(longitude_mc + 180)"

MERIDIAN_LAT_SOUTH = -89.999999
MERIDIAN_LAT_NORTH = 89.999999

INVARIANT_SEPARATION_TOL_DEG = 1e-10
LOCAL_SNAPSHOT_TOL_DEG = 1e-8
# Reserved for a later independent-engine comparison. Not a pass/fail gate here.
CROSS_ENGINE_VALIDATION_TOL_DEG = None

PUBLIC_TEST_INSTANT_UTC = datetime(2020, 6, 21, 12, 0, 0, tzinfo=timezone.utc)

_SWE_FLAG_ATTRS = (
    "FLG_JPLEPH",
    "FLG_SWIEPH",
    "FLG_MOSEPH",
    "FLG_HELCTR",
    "FLG_TRUEPOS",
    "FLG_J2000",
    "FLG_NONUT",
    "FLG_SPEED3",
    "FLG_SPEED",
    "FLG_NOGDEFL",
    "FLG_NOABERR",
    "FLG_EQUATORIAL",
    "FLG_XYZ",
    "FLG_RADIANS",
    "FLG_BARYCTR",
    "FLG_TOPOCTR",
    "FLG_SIDEREAL",
    "FLG_ICRS",
)

_EPHEMERIS_NAMES = ("JPLEPH", "SWIEPH", "MOSEPH")


class GeometrySpikeError(ValueError):
    """Invalid input or non-finite geometry for the experimental spike."""


def normalize_longitude_east(longitude_deg: float) -> float:
    """Normalize east-positive longitude into (-180, 180]."""
    if not math.isfinite(longitude_deg):
        raise GeometrySpikeError("longitude must be finite")
    wrapped = ((longitude_deg + 180.0) % 360.0 + 360.0) % 360.0 - 180.0
    if wrapped == -180.0:
        return 180.0
    if abs(wrapped) < 1e-15:
        return 0.0
    return wrapped


def meridians_from_ra_and_gast(
    right_ascension_deg: float,
    gast_deg: float,
) -> tuple[float, float]:
    """Pure transform: (RA°, GAST°) → (λ_MC, λ_IC). No ephemeris dependency.

    Finite RA/GAST values outside 0..360 are accepted. Only their difference
    is normalized to east-positive (-180, 180]. Non-finite inputs are rejected
    before any modulo.
    """
    if not math.isfinite(right_ascension_deg) or not math.isfinite(gast_deg):
        raise GeometrySpikeError("right ascension and GAST must be finite")
    longitude_mc = normalize_longitude_east(right_ascension_deg - gast_deg)
    longitude_ic = normalize_longitude_east(longitude_mc + 180.0)
    return longitude_mc, longitude_ic


def require_utc_datetime(instant: datetime) -> datetime:
    if not isinstance(instant, datetime):
        raise GeometrySpikeError("birth_instant must be a datetime")
    if instant.tzinfo is None:
        raise GeometrySpikeError("birth_instant must be timezone-aware UTC")
    offset = instant.utcoffset()
    if offset is None or offset.total_seconds() != 0:
        raise GeometrySpikeError("birth_instant must be UTC (offset +00:00)")
    return instant.astimezone(timezone.utc)


def julian_day_ut(instant: datetime) -> float:
    swe = _import_swisseph()
    dt = require_utc_datetime(instant)
    ut_hours = (
        dt.hour
        + dt.minute / 60.0
        + dt.second / 3600.0
        + dt.microsecond / 3_600_000_000.0
    )
    return float(swe.julday(dt.year, dt.month, dt.day, ut_hours, swe.GREG_CAL))


def decode_swe_flags(flags: int, swe: Any | None = None) -> dict[str, Any]:
    """Decode Swiss Ephemeris calculation flags without rewriting them."""
    library = swe if swe is not None else _import_swisseph()
    if not isinstance(flags, int):
        raise GeometrySpikeError("flags must be an int")
    bits: dict[str, bool] = {}
    names: list[str] = []
    catalog: dict[str, int] = {}
    for attr in _SWE_FLAG_ATTRS:
        if not hasattr(library, attr):
            continue
        value = int(getattr(library, attr))
        short = attr.removeprefix("FLG_")
        catalog[short] = value
        present = (flags & value) == value and value != 0
        bits[short] = present
        if present:
            names.append(short)
    known_mask = 0
    for value in catalog.values():
        known_mask |= value
    unknown_flag_bits = flags & ~known_mask
    ephemeris = None
    for name in _EPHEMERIS_NAMES:
        if bits.get(name):
            ephemeris = name
            break
    return {
        "value": flags,
        "names": names,
        "bits": bits,
        "catalog": catalog,
        "ephemeris": ephemeris,
        "equatorial": bool(bits.get("EQUATORIAL")),
        "truepos": bool(bits.get("TRUEPOS")),
        "unknown_flag_bits": unknown_flag_bits,
    }


def ephemeris_fallback_warnings(
    requested_flags: int,
    returned_flags: int,
    swe: Any | None = None,
) -> list[str]:
    requested = decode_swe_flags(requested_flags, swe)
    returned = decode_swe_flags(returned_flags, swe)
    warnings: list[str] = []
    requested_ephemeris = requested["ephemeris"]
    actual_ephemeris = returned["ephemeris"]
    if requested_ephemeris is None or actual_ephemeris is None:
        warnings.append(
            "ephemeris provenance unresolved: "
            f"requested={requested_ephemeris!r} actual={actual_ephemeris!r}"
        )
    elif requested_ephemeris != actual_ephemeris:
        if requested_ephemeris == "SWIEPH" and actual_ephemeris == "MOSEPH":
            warnings.append(
                "requested FLG_SWIEPH but returned flags include MOSEPH; "
                "Swiss Ephemeris data files were not used"
            )
        else:
            warnings.append(
                f"requested {requested_ephemeris} but returned flags include {actual_ephemeris}"
            )
    if requested["equatorial"] and not returned["equatorial"]:
        warnings.append("requested FLG_EQUATORIAL but returned flags omit EQUATORIAL")
    if (not requested["truepos"]) and returned["truepos"]:
        warnings.append("requested apparent position but returned flags include TRUEPOS")
    return warnings


def meridian_linestring(longitude_deg: float) -> dict[str, Any]:
    lon = normalize_longitude_east(longitude_deg)
    if not math.isfinite(lon):
        raise GeometrySpikeError("meridian longitude must be finite")
    if not (math.isfinite(MERIDIAN_LAT_SOUTH) and math.isfinite(MERIDIAN_LAT_NORTH)):
        raise GeometrySpikeError("meridian latitudes must be finite")
    return {
        "type": "LineString",
        "coordinates": [
            [lon, MERIDIAN_LAT_SOUTH],
            [lon, MERIDIAN_LAT_NORTH],
        ],
    }


def compute_sun_mc_ic(birth_instant_utc: datetime) -> dict[str, Any]:
    """Compute experimental Sun MC and IC meridians for a fixed UTC instant.

    Birthplace latitude/longitude are intentionally not accepted. Global MC/IC
    meridians at a known UTC depend on JD_UT, GAST, and solar RA only.
    """
    dt = require_utc_datetime(birth_instant_utc)
    swe = _import_swisseph()
    requested_flags = int(swe.FLG_SWIEPH | swe.FLG_EQUATORIAL)
    jd_ut = julian_day_ut(dt)
    gast_hours = float(swe.sidtime(jd_ut))
    gast_deg = gast_hours * 15.0
    result, returned_flags = swe.calc_ut(jd_ut, swe.SUN, requested_flags)
    returned_flags = int(returned_flags)
    ra_deg = float(result[0])
    dec_deg = float(result[1])
    if not all(math.isfinite(v) for v in (jd_ut, gast_hours, gast_deg, ra_deg, dec_deg)):
        raise GeometrySpikeError("ephemeris intermediates must be finite")

    longitude_mc, longitude_ic = meridians_from_ra_and_gast(ra_deg, gast_deg)
    requested = decode_swe_flags(requested_flags, swe)
    returned = decode_swe_flags(returned_flags, swe)
    warnings = ephemeris_fallback_warnings(requested_flags, returned_flags, swe)
    warnings.append(
        "experimental spike: convention is not production-validated astrocartography"
    )

    provenance = {
        "spike": "sun_mc_ic",
        "production_validated": False,
        "formula_mc": FORMULA_MC,
        "formula_ic": FORMULA_IC,
        "gast_source": GAST_SOURCE,
        "pyswisseph_version": str(getattr(swe, "__version__", "unknown")),
        "swisseph_version": str(getattr(swe, "version", "unknown")),
        "python_version": sys.version.split()[0],
        "ephemeris_configuration": "consumed_from_process_without_mutation",
        "delta_t_days": float(swe.deltat(jd_ut)),
        "note": (
            "GAST from swe.sidtime, not GMST; apparent position (no FLG_TRUEPOS); "
            "relocated ecliptic MC is not geographic MC"
        ),
    }
    shared = {
        "schema_version": SCHEMA_VERSION,
        "calculation_version": CALCULATION_VERSION,
        "status": SPIKE_STATUS,
        "body": BODY_SUN,
        "birth_instant_utc": _utc_z(dt),
        "julian_day_ut": jd_ut,
        "right_ascension_deg": ra_deg,
        "declination_deg": dec_deg,
        "greenwich_sidereal_time_hours": gast_hours,
        "greenwich_sidereal_time_deg": gast_deg,
        "longitude_convention": LONGITUDE_CONVENTION,
        "position_convention": POSITION_CONVENTION,
        "requested_ephemeris": requested["ephemeris"],
        "actual_ephemeris": returned["ephemeris"],
        "requested_flags": requested_flags,
        "returned_flags": returned_flags,
        "requested_unknown_flag_bits": requested["unknown_flag_bits"],
        "returned_unknown_flag_bits": returned["unknown_flag_bits"],
        "warnings": list(warnings),
        "provenance": dict(provenance),
    }
    lines = [
        _line_record(shared, ANGLE_MC, LINE_ID_MC, longitude_mc),
        _line_record(shared, ANGLE_IC, LINE_ID_IC, longitude_ic),
    ]
    top = copy.deepcopy(shared)
    top["lines"] = lines
    return top


def _line_record(
    shared: dict[str, Any],
    angle: str,
    line_id: str,
    longitude_deg: float,
) -> dict[str, Any]:
    record = copy.deepcopy(shared)
    record["angle"] = angle
    record["line_id"] = line_id
    record["longitude_deg"] = longitude_deg
    record["geometry"] = meridian_linestring(longitude_deg)
    return record


def _utc_z(instant: datetime) -> str:
    return (
        instant.astimezone(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _import_swisseph():
    """Import pyswisseph without changing process-global configuration."""
    try:
        import swisseph as swe
    except ImportError as exc:
        raise GeometrySpikeError("pyswisseph is not installed") from exc
    return swe
