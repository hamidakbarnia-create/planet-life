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
ANGLE_ASC = "ASC"
ANGLE_DSC = "DSC"
LINE_ID_MC = "spike.v1.sun.MC"
LINE_ID_IC = "spike.v1.sun.IC"
LINE_ID_ASC = "spike.v1.sun.ASC"
LINE_ID_DSC = "spike.v1.sun.DSC"
CALCULATION_VERSION_ASC_DSC = 2

LONGITUDE_CONVENTION = "east_positive_open_minus180_to_inclusive_180"
POSITION_CONVENTION = "apparent_geocentric_equatorial"
GAST_SOURCE = "swe.sidtime(JD_UT)"
FORMULA_MC = "normalize(ra_deg - gast_deg)"
FORMULA_IC = "normalize(longitude_mc + 180)"
FORMULA_ASC = "normalize(ra_deg - H0_deg - gast_deg)"
FORMULA_DSC = "normalize(ra_deg + H0_deg - gast_deg)"
HORIZON_CONVENTION = "geometric_geocentric_altitude_zero"
REFRACTION_POLICY = "none"
EPS_ACOS = 1e-12
HORIZON_ALTITUDE_TOL_DEG = 1e-8
ASC_DSC_INTERP_TOL_DEG = 0.05
ASC_DSC_INTERP_ERROR_METRIC = "wrapped_longitude_geographic_deg"
ASC_DSC_MAX_RECURSION_DEPTH = 16
ASC_DSC_MAX_POINTS = 2048
ASC_DSC_REFINE_PROBE_FRACTIONS = (0.25, 0.50, 0.75)
ASC_DSC_POST_VALIDATION_FRACTIONS = (
    0.125,
    0.25,
    0.375,
    0.50,
    0.625,
    0.75,
    0.875,
)
POLAR_INTERIOR_LIMIT_DEG = 89.999999
ANTIMERIDIAN_ROOT_TOL_DEG = 1e-10
ANTIMERIDIAN_ROOT_MAX_ITER = 80
POINT_DEDUP_TOL_DEG = 1e-12

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


def require_equatorial_sun_position(
    returned_flags: int,
    right_ascension_deg: float,
    declination_deg: float,
    swe: Any | None = None,
) -> dict[str, Any]:
    """Refuse ASC/DSC geometry unless returned coordinates are equatorial and finite."""
    decoded = decode_swe_flags(returned_flags, swe)
    if not decoded["equatorial"]:
        raise GeometrySpikeError(
            "returned flags omit EQUATORIAL; refusing ASC/DSC geometry"
        )
    if not math.isfinite(right_ascension_deg) or not math.isfinite(declination_deg):
        raise GeometrySpikeError("right ascension and declination must be finite")
    if not (-90.0 <= declination_deg <= 90.0):
        raise GeometrySpikeError("declination must be within [-90, 90] degrees")
    if decoded["ephemeris"] is None:
        raise GeometrySpikeError(
            "ephemeris provenance unresolved; refusing ASC/DSC geometry"
        )
    return decoded


def cut_longitude_east(longitude_deg: float) -> float:
    """Segment-boundary longitude. Allows both -180 and +180; does not fold -180."""
    if not math.isfinite(longitude_deg):
        raise GeometrySpikeError("longitude must be finite")
    if abs(longitude_deg - 180.0) <= 1e-15:
        return 180.0
    if abs(longitude_deg + 180.0) <= 1e-15:
        return -180.0
    return normalize_longitude_east(longitude_deg)


def unwrap_longitude(from_deg: float, to_deg: float) -> float:
    """Return to_deg shifted by ±360 so the step from from_deg is in (-180, 180]."""
    if not math.isfinite(from_deg) or not math.isfinite(to_deg):
        raise GeometrySpikeError("longitudes must be finite")
    candidate = to_deg
    delta = candidate - from_deg
    if delta > 180.0:
        candidate -= 360.0
    elif delta < -180.0:
        candidate += 360.0
    return candidate


def interpolation_error_deg(
    lon0_deg: float,
    lon1_deg: float,
    lon_true_deg: float,
    latitude_deg: float,
    fraction: float = 0.5,
) -> float:
    """Wrap-safe geographic interpolation error at a fractional edge probe.

    Metric `wrapped_longitude_geographic_deg`:
    unwrap the rendered segment, take the implied longitude at `fraction`
    along the unwrapped edge, then |Δλ_unwrap| × |cos(φ)| in degrees.
    Default `fraction=0.5` is the midpoint used by older callers.
    """
    if not all(
        math.isfinite(v)
        for v in (lon0_deg, lon1_deg, lon_true_deg, latitude_deg, fraction)
    ):
        raise GeometrySpikeError("interpolation error inputs must be finite")
    if not (0.0 <= fraction <= 1.0):
        raise GeometrySpikeError("interpolation fraction must lie in [0, 1]")
    lon1_u = unwrap_longitude(lon0_deg, lon1_deg)
    lon_implied = lon0_deg + fraction * (lon1_u - lon0_deg)
    lon_true_u = unwrap_longitude(lon_implied, lon_true_deg)
    return abs(lon_true_u - lon_implied) * abs(math.cos(math.radians(latitude_deg)))


def geometric_altitude_deg(
    latitude_deg: float,
    declination_deg: float,
    hour_angle_deg: float,
) -> float:
    """Independent geometric altitude. Not a Swiss Ephemeris azalt call."""
    if not all(
        math.isfinite(v) for v in (latitude_deg, declination_deg, hour_angle_deg)
    ):
        raise GeometrySpikeError("altitude inputs must be finite")
    if abs(abs(latitude_deg) - 90.0) <= 1e-15:
        raise GeometrySpikeError("exact geographic poles are excluded")
    phi = math.radians(latitude_deg)
    delta = math.radians(declination_deg)
    hour_angle = math.radians(hour_angle_deg)
    sine_h = (
        math.sin(phi) * math.sin(delta)
        + math.cos(phi) * math.cos(delta) * math.cos(hour_angle)
    )
    if abs(sine_h) > 1.0 + EPS_ACOS:
        raise GeometrySpikeError("altitude sine is outside [-1, 1]")
    sine_h = min(1.0, max(-1.0, sine_h))
    return math.degrees(math.asin(sine_h))


def _classify_no_horizon_solution(latitude_deg: float, declination_deg: float) -> str:
    h_meridian = geometric_altitude_deg(latitude_deg, declination_deg, 0.0)
    h_lower = geometric_altitude_deg(latitude_deg, declination_deg, 180.0)
    h_min = min(h_meridian, h_lower)
    h_max = max(h_meridian, h_lower)
    if h_min >= -HORIZON_ALTITUDE_TOL_DEG:
        return "continuously_above"
    if h_max <= HORIZON_ALTITUDE_TOL_DEG:
        return "continuously_below"
    if (h_meridian + h_lower) >= 0.0:
        return "continuously_above"
    return "continuously_below"


def solve_horizon_at_latitude(
    latitude_deg: float,
    declination_deg: float,
    right_ascension_deg: float,
    gast_deg: float,
) -> dict[str, Any]:
    """Pure horizon solver. No ephemeris dependency."""
    values = (latitude_deg, declination_deg, right_ascension_deg, gast_deg)
    if not all(math.isfinite(v) for v in values):
        raise GeometrySpikeError("horizon inputs must be finite")
    if abs(latitude_deg) > 90.0:
        raise GeometrySpikeError("latitude must be within [-90, 90] degrees")
    if not (-90.0 <= declination_deg <= 90.0):
        raise GeometrySpikeError("declination must be within [-90, 90] degrees")
    if abs(abs(latitude_deg) - 90.0) <= 1e-15:
        return {
            "status": "pole_excluded",
            "x": None,
            "clamped": False,
            "H0_deg": None,
            "H_asc_deg": None,
            "H_dsc_deg": None,
            "longitude_asc_deg": None,
            "longitude_dsc_deg": None,
            "altitude_asc_deg": None,
            "altitude_dsc_deg": None,
        }

    phi = math.radians(latitude_deg)
    delta = math.radians(declination_deg)
    cosine_h0 = -math.tan(phi) * math.tan(delta)
    if not math.isfinite(cosine_h0):
        raise GeometrySpikeError("horizon cosine is not finite")

    if abs(abs(cosine_h0) - 1.0) <= EPS_ACOS:
        x_used = 1.0 if cosine_h0 >= 0.0 else -1.0
        clamped = abs(cosine_h0) > 1.0
        status = "tangent"
    elif abs(cosine_h0) > 1.0:
        return {
            "status": _classify_no_horizon_solution(latitude_deg, declination_deg),
            "x": cosine_h0,
            "clamped": False,
            "H0_deg": None,
            "H_asc_deg": None,
            "H_dsc_deg": None,
            "longitude_asc_deg": None,
            "longitude_dsc_deg": None,
            "altitude_asc_deg": None,
            "altitude_dsc_deg": None,
        }
    else:
        x_used = cosine_h0
        clamped = False
        status = "two_solutions"

    hour_angle0 = math.degrees(math.acos(x_used))
    hour_asc = -hour_angle0
    hour_dsc = hour_angle0
    longitude_asc = normalize_longitude_east(
        right_ascension_deg + hour_asc - gast_deg
    )
    longitude_dsc = normalize_longitude_east(
        right_ascension_deg + hour_dsc - gast_deg
    )
    altitude_asc = geometric_altitude_deg(latitude_deg, declination_deg, hour_asc)
    altitude_dsc = geometric_altitude_deg(latitude_deg, declination_deg, hour_dsc)
    if max(abs(altitude_asc), abs(altitude_dsc)) > HORIZON_ALTITUDE_TOL_DEG:
        raise GeometrySpikeError(
            "horizon solution is not numerically on the geometric horizon"
        )
    return {
        "status": status,
        "x": cosine_h0,
        "clamped": clamped,
        "H0_deg": hour_angle0,
        "H_asc_deg": hour_asc,
        "H_dsc_deg": hour_dsc,
        "longitude_asc_deg": longitude_asc,
        "longitude_dsc_deg": longitude_dsc,
        "altitude_asc_deg": altitude_asc,
        "altitude_dsc_deg": altitude_dsc,
    }


def horizon_longitude_deg(
    latitude_deg: float,
    declination_deg: float,
    right_ascension_deg: float,
    gast_deg: float,
    angle: str,
) -> float:
    solution = solve_horizon_at_latitude(
        latitude_deg, declination_deg, right_ascension_deg, gast_deg
    )
    if solution["status"] not in {"two_solutions", "tangent"}:
        raise GeometrySpikeError(
            f"no ordinary horizon longitude at latitude {latitude_deg}: {solution['status']}"
        )
    if angle == ANGLE_ASC:
        return float(solution["longitude_asc_deg"])
    if angle == ANGLE_DSC:
        return float(solution["longitude_dsc_deg"])
    raise GeometrySpikeError(f"unsupported horizon angle {angle!r}")


def critical_latitude_deg(declination_deg: float) -> float | None:
    if not math.isfinite(declination_deg):
        raise GeometrySpikeError("declination must be finite")
    if abs(declination_deg) <= 1e-15:
        return None
    phi_crit = 90.0 - abs(declination_deg)
    if phi_crit >= POLAR_INTERIOR_LIMIT_DEG:
        return None
    return phi_crit


def tangent_meets_angle(declination_deg: float, hemisphere: str) -> str | None:
    """Which MC/IC meridian a critical-latitude tangent coincides with."""
    if abs(declination_deg) <= 1e-15:
        return None
    if hemisphere == "north":
        return ANGLE_IC if declination_deg > 0.0 else ANGLE_MC
    if hemisphere == "south":
        return ANGLE_MC if declination_deg > 0.0 else ANGLE_IC
    raise GeometrySpikeError("hemisphere must be north or south")


def mandatory_seed_latitudes(south_deg: float, north_deg: float) -> list[float]:
    """Protected latitudes: southern endpoint, equator if interior, northern endpoint."""
    if not math.isfinite(south_deg) or not math.isfinite(north_deg):
        raise GeometrySpikeError("domain endpoints must be finite")
    if south_deg >= north_deg:
        raise GeometrySpikeError("horizon latitude domain is empty")
    seeds = [south_deg, north_deg]
    if south_deg < 0.0 < north_deg:
        seeds.append(0.0)
    return sorted(set(seeds))


def probe_edge_errors(
    lat0: float,
    lon0: float,
    lat1: float,
    lon1: float,
    longitude_at_latitude,
    fractions: tuple[float, ...],
    *,
    interp_tol_deg: float = ASC_DSC_INTERP_TOL_DEG,
) -> list[dict[str, Any]]:
    """Evaluate wrap-safe error at each fractional latitude on one edge."""
    probes: list[dict[str, Any]] = []
    for fraction in fractions:
        latitude = lat0 + fraction * (lat1 - lat0)
        lon_true = longitude_at_latitude(latitude)
        error = interpolation_error_deg(lon0, lon1, lon_true, latitude, fraction)
        probes.append(
            {
                "fraction": fraction,
                "latitude_deg": latitude,
                "error_deg": error,
                "over_tolerance": error > interp_tol_deg + 1e-12,
            }
        )
    return probes


def validate_vertices_against_horizon(
    vertices: list[tuple[float, float]],
    longitude_at_latitude,
    fractions: tuple[float, ...] = ASC_DSC_POST_VALIDATION_FRACTIONS,
    *,
    interp_tol_deg: float = ASC_DSC_INTERP_TOL_DEG,
) -> dict[str, Any]:
    """Finite-probe rendering validation. Not a formal global-maximum proof."""
    probe_count = 0
    over_count = 0
    max_error = 0.0
    max_latitude: float | None = None
    max_edge: int | None = None
    for edge_index, ((lat0, lon0), (lat1, lon1)) in enumerate(
        zip(vertices, vertices[1:])
    ):
        for probe in probe_edge_errors(
            lat0,
            lon0,
            lat1,
            lon1,
            longitude_at_latitude,
            fractions,
            interp_tol_deg=interp_tol_deg,
        ):
            probe_count += 1
            if probe["error_deg"] > max_error:
                max_error = probe["error_deg"]
                max_latitude = probe["latitude_deg"]
                max_edge = edge_index
            if probe["over_tolerance"]:
                over_count += 1
    return {
        "probe_fractions": list(fractions),
        "probe_count": probe_count,
        "max_error_deg": max_error,
        "over_tolerance_count": over_count,
        "max_error_latitude_deg": max_latitude,
        "max_error_edge_index": max_edge,
        "contract": "experimental_finite_probe_set_not_global_maximum_proof",
    }


def _latitude_present(
    vertices: list[tuple[float, float]], latitude_deg: float
) -> bool:
    return any(
        abs(lat - latitude_deg) <= POINT_DEDUP_TOL_DEG for lat, _lon in vertices
    )


def horizon_domain_endpoints(
    declination_deg: float,
) -> tuple[float, float, bool, list[str]]:
    """Southern and northern curve endpoints, including valid tangents."""
    if not math.isfinite(declination_deg):
        raise GeometrySpikeError("declination must be finite")
    warnings: list[str] = []
    phi_crit = critical_latitude_deg(declination_deg)
    if phi_crit is None:
        warnings.append(
            "polar-endpoint: exact geographic poles excluded; "
            f"using interior limit ±{POLAR_INTERIOR_LIMIT_DEG}"
        )
        return (
            -POLAR_INTERIOR_LIMIT_DEG,
            POLAR_INTERIOR_LIMIT_DEG,
            True,
            warnings,
        )
    return -phi_crit, phi_crit, False, warnings


def _nearly_same_vertex(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> bool:
    return (
        abs(latitude_a - latitude_b) <= POINT_DEDUP_TOL_DEG
        and abs(longitude_a - longitude_b) <= POINT_DEDUP_TOL_DEG
    )


def _dedup_vertices(vertices: list[tuple[float, float]]) -> list[tuple[float, float]]:
    cleaned: list[tuple[float, float]] = []
    for lat, lon in vertices:
        if cleaned and _nearly_same_vertex(cleaned[-1][0], cleaned[-1][1], lat, lon):
            continue
        cleaned.append((lat, lon))
    return cleaned


def find_antimeridian_crossing_latitude(
    latitude0: float,
    longitude0: float,
    latitude1: float,
    longitude1: float,
    longitude_at_latitude,
) -> tuple[float, float, float]:
    """Bracketed bisection for the actual horizon longitude crossing ±180.

    Returns (latitude, end_cut_longitude, start_cut_longitude).
    """
    lon1_u = unwrap_longitude(longitude0, longitude1)
    if lon1_u > longitude0:
        target_end, target_start = 180.0, -180.0
    else:
        target_end, target_start = -180.0, 180.0

    def residual(latitude: float) -> float:
        return unwrap_longitude(longitude0, longitude_at_latitude(latitude)) - target_end

    if abs(longitude0 - target_end) <= ANTIMERIDIAN_ROOT_TOL_DEG:
        return latitude0, target_end, target_start
    if abs(lon1_u - target_end) <= ANTIMERIDIAN_ROOT_TOL_DEG:
        return latitude1, target_end, target_start

    lo, hi = latitude0, latitude1
    residual_lo = residual(lo)
    residual_hi = residual(hi)
    if residual_lo * residual_hi > 0.0:
        raise GeometrySpikeError("antimeridian crossing is not bracketed")

    latitude_mid = 0.5 * (lo + hi)
    for _ in range(ANTIMERIDIAN_ROOT_MAX_ITER):
        latitude_mid = 0.5 * (lo + hi)
        residual_mid = residual(latitude_mid)
        if abs(residual_mid) <= ANTIMERIDIAN_ROOT_TOL_DEG:
            return latitude_mid, target_end, target_start
        if residual_lo * residual_mid <= 0.0:
            hi = latitude_mid
            residual_hi = residual_mid
        else:
            lo = latitude_mid
            residual_lo = residual_mid
    return latitude_mid, target_end, target_start


def split_antimeridian_segments(
    vertices: list[tuple[float, float]],
    longitude_at_latitude,
) -> list[list[tuple[float, float]]]:
    """Split a south-to-north vertex list at root-solved antimeridian cuts."""
    cleaned = _dedup_vertices(vertices)
    if len(cleaned) < 2:
        return []
    segments: list[list[tuple[float, float]]] = []
    current = [cleaned[0]]
    for latitude, longitude in cleaned[1:]:
        prev_lat, prev_lon = current[-1]
        if _nearly_same_vertex(prev_lat, prev_lon, latitude, longitude):
            continue
        if abs(longitude - prev_lon) > 180.0:
            lat_x, end_cut, start_cut = find_antimeridian_crossing_latitude(
                prev_lat,
                prev_lon,
                latitude,
                longitude,
                longitude_at_latitude,
            )
            end_cut = cut_longitude_east(end_cut)
            start_cut = cut_longitude_east(start_cut)
            cut_end = (lat_x, end_cut)
            cut_start = (lat_x, start_cut)
            if not _nearly_same_vertex(prev_lat, prev_lon, cut_end[0], cut_end[1]):
                current.append(cut_end)
            current = _dedup_vertices(current)
            if len(current) >= 2:
                segments.append(current)
            current = [cut_start]
            if not _nearly_same_vertex(cut_start[0], cut_start[1], latitude, longitude):
                current.append((latitude, longitude))
        else:
            current.append((latitude, longitude))
    current = _dedup_vertices(current)
    if len(current) >= 2:
        segments.append(current)
    return [segment for segment in segments if len(segment) >= 2]


def sample_horizon_curve(
    right_ascension_deg: float,
    gast_deg: float,
    declination_deg: float,
    angle: str,
    *,
    interp_tol_deg: float = ASC_DSC_INTERP_TOL_DEG,
    max_recursion_depth: int = ASC_DSC_MAX_RECURSION_DEPTH,
    max_points: int = ASC_DSC_MAX_POINTS,
) -> dict[str, Any]:
    """Deterministic adaptive ASC or DSC curve. Pure transform; no SWE calls."""
    if angle not in {ANGLE_ASC, ANGLE_DSC}:
        raise GeometrySpikeError(f"unsupported horizon angle {angle!r}")
    if max_points < 1:
        raise GeometrySpikeError("point budget must be a positive integer")
    south, north, polar_limit, domain_warnings = horizon_domain_endpoints(
        declination_deg
    )
    seeds = mandatory_seed_latitudes(south, north)
    n_mandatory = len(seeds)
    if max_points < n_mandatory:
        raise GeometrySpikeError(
            "point budget cannot contain mandatory vertices: "
            f"max_points={max_points} mandatory={n_mandatory}"
        )

    def longitude_at(latitude: float) -> float:
        return horizon_longitude_deg(
            latitude, declination_deg, right_ascension_deg, gast_deg, angle
        )

    seed_points = [(lat, longitude_at(lat)) for lat in seeds]
    incomplete_reasons: list[str] = []
    interior_budget = max_points - n_mandatory

    def refine(
        point0: tuple[float, float],
        point1: tuple[float, float],
        depth: int,
        remaining: int,
    ) -> list[tuple[float, float]]:
        """Interior subdivision vertices, south to north.

        Acceptance uses 25/50/75 probes. Any probe above tolerance subdivides
        at the midpoint, kept exactly once as left + midpoint + right.
        """
        lat0, lon0 = point0
        lat1, lon1 = point1
        probes = probe_edge_errors(
            lat0,
            lon0,
            lat1,
            lon1,
            longitude_at,
            ASC_DSC_REFINE_PROBE_FRACTIONS,
            interp_tol_deg=interp_tol_deg,
        )
        if not any(probe["over_tolerance"] for probe in probes):
            return []
        lat_mid = 0.5 * (lat0 + lat1)
        midpoint = (lat_mid, longitude_at(lat_mid))

        def children_within_tolerance() -> bool:
            left_probes = probe_edge_errors(
                lat0,
                lon0,
                midpoint[0],
                midpoint[1],
                longitude_at,
                ASC_DSC_REFINE_PROBE_FRACTIONS,
                interp_tol_deg=interp_tol_deg,
            )
            right_probes = probe_edge_errors(
                midpoint[0],
                midpoint[1],
                lat1,
                lon1,
                longitude_at,
                ASC_DSC_REFINE_PROBE_FRACTIONS,
                interp_tol_deg=interp_tol_deg,
            )
            return not any(
                probe["over_tolerance"] for probe in (*left_probes, *right_probes)
            )

        if remaining <= 0:
            incomplete_reasons.append("adaptive sampling reached maximum point count")
            return []
        at_depth_limit = depth >= max_recursion_depth
        at_point_limit = remaining == 1
        if at_depth_limit or at_point_limit:
            if not children_within_tolerance():
                if at_point_limit and not at_depth_limit:
                    incomplete_reasons.append(
                        "adaptive sampling reached maximum point count"
                    )
                elif at_depth_limit and not at_point_limit:
                    incomplete_reasons.append(
                        "adaptive sampling reached maximum recursion depth"
                    )
                elif at_point_limit:
                    incomplete_reasons.append(
                        "adaptive sampling reached maximum point count"
                    )
                else:
                    incomplete_reasons.append(
                        "adaptive sampling reached maximum recursion depth"
                    )
            return [midpoint]
        left = refine(point0, midpoint, depth + 1, remaining)
        used = len(left) + 1
        right = refine(midpoint, point1, depth + 1, max(0, remaining - used))
        return left + [midpoint] + right

    vertices: list[tuple[float, float]] = [seed_points[0]]
    interiors_left = interior_budget
    for index in range(len(seed_points) - 1):
        start = seed_points[index]
        end = seed_points[index + 1]
        interiors = refine(start, end, 0, interiors_left)
        for point in interiors:
            if interiors_left <= 0:
                incomplete_reasons.append(
                    "adaptive sampling reached maximum point count"
                )
                break
            if not _nearly_same_vertex(
                vertices[-1][0], vertices[-1][1], point[0], point[1]
            ):
                vertices.append(point)
                interiors_left -= 1
        if not _nearly_same_vertex(vertices[-1][0], vertices[-1][1], end[0], end[1]):
            vertices.append(end)

    vertices = _dedup_vertices(vertices)
    unique_reasons = list(dict.fromkeys(incomplete_reasons))

    present = {
        "south": _latitude_present(vertices, south),
        "north": _latitude_present(vertices, north),
        "equator": (
            _latitude_present(vertices, 0.0) if south < 0.0 < north else True
        ),
    }
    for name, ok in present.items():
        if not ok:
            unique_reasons.append(f"missing mandatory endpoint: {name}")

    validation = validate_vertices_against_horizon(
        vertices,
        longitude_at,
        ASC_DSC_POST_VALIDATION_FRACTIONS,
        interp_tol_deg=interp_tol_deg,
    )
    if validation["over_tolerance_count"] > 0:
        unique_reasons.append(
            "post-validation: "
            f"{validation['over_tolerance_count']} probes exceed "
            f"{interp_tol_deg}° rendering tolerance; geometry marked incomplete"
        )

    segmentation_failed = False
    try:
        segments = split_antimeridian_segments(vertices, longitude_at)
    except GeometrySpikeError as exc:
        segmentation_failed = True
        segments = []
        unique_reasons.append(f"antimeridian segmentation failed: {exc}")

    invalid_segments = any(len(segment) < 2 for segment in segments) or (
        len(vertices) >= 2 and not segments
    )
    if invalid_segments:
        unique_reasons.append("invalid or empty rendered segment")

    unique_reasons = list(dict.fromkeys(unique_reasons))
    geometry_complete = (
        not unique_reasons
        and all(present.values())
        and validation["over_tolerance_count"] == 0
        and not segmentation_failed
        and not invalid_segments
        and bool(segments)
    )
    return {
        "angle": angle,
        "vertices": vertices,
        "segments": segments,
        "south_endpoint_deg": south,
        "north_endpoint_deg": north,
        "polar_endpoint_limit": polar_limit,
        "domain_warnings": domain_warnings,
        "incomplete_reasons": unique_reasons,
        "geometry_complete": geometry_complete,
        "interp_tol_deg": interp_tol_deg,
        "max_recursion_depth": max_recursion_depth,
        "max_points": max_points,
        "mandatory_vertex_count": n_mandatory,
        "interior_point_budget": interior_budget,
        "mandatory_vertices_present": present,
        "validation": validation,
    }


def _segments_to_geojson(
    segments: list[list[tuple[float, float]]],
) -> list[dict[str, Any]]:
    geojson: list[dict[str, Any]] = []
    for segment in segments:
        if len(segment) < 2:
            continue
        coordinates = [[float(lon), float(lat)] for lat, lon in segment]
        distinct = False
        for index in range(1, len(coordinates)):
            if coordinates[index] != coordinates[0]:
                distinct = True
                break
        if not distinct:
            continue
        geojson.append({"type": "LineString", "coordinates": coordinates})
    return geojson


def compute_sun_asc_dsc(
    birth_instant_utc: datetime,
    *,
    interp_tol_deg: float = ASC_DSC_INTERP_TOL_DEG,
    max_recursion_depth: int = ASC_DSC_MAX_RECURSION_DEPTH,
    max_points: int = ASC_DSC_MAX_POINTS,
) -> dict[str, Any]:
    """Compute experimental Sun ASC and DSC horizon curves for a fixed UTC instant.

    Birthplace latitude/longitude are intentionally not accepted. Global ASC/DSC
    loci at a known UTC depend on JD_UT, GAST, solar RA, and solar declination.
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
    if not all(math.isfinite(v) for v in (jd_ut, gast_hours, gast_deg)):
        raise GeometrySpikeError("ephemeris intermediates must be finite")
    returned = require_equatorial_sun_position(returned_flags, ra_deg, dec_deg, swe)
    requested = decode_swe_flags(requested_flags, swe)
    warnings = ephemeris_fallback_warnings(requested_flags, returned_flags, swe)
    warnings.append(
        "experimental spike: convention is not production-validated astrocartography"
    )
    warnings.append(
        "geometric geocentric horizon only; refraction, semidiameter, elevation, "
        "and topocentric parallax are not applied"
    )
    warnings.append(
        "Swiss Ephemeris licensing/deployment hold: experimental local use only"
    )

    traces = {}
    for angle in (ANGLE_ASC, ANGLE_DSC):
        traces[angle] = sample_horizon_curve(
            ra_deg,
            gast_deg,
            dec_deg,
            angle,
            interp_tol_deg=interp_tol_deg,
            max_recursion_depth=max_recursion_depth,
            max_points=max_points,
        )
    for angle, trace in traces.items():
        warnings.extend(trace["domain_warnings"])
        for reason in trace["incomplete_reasons"]:
            warnings.append(f"{angle}: {reason}; geometry marked incomplete")
    warnings = list(dict.fromkeys(warnings))

    longitude_mc, longitude_ic = meridians_from_ra_and_gast(ra_deg, gast_deg)
    south, north, polar_limit, _ = horizon_domain_endpoints(dec_deg)
    phi_crit = critical_latitude_deg(dec_deg)
    tangent_endpoints: list[dict[str, Any]] = []
    if phi_crit is not None:
        for latitude, hemisphere in ((-phi_crit, "south"), (phi_crit, "north")):
            solution = solve_horizon_at_latitude(latitude, dec_deg, ra_deg, gast_deg)
            tangent_endpoints.append(
                {
                    "latitude_deg": latitude,
                    "longitude_deg": solution["longitude_asc_deg"],
                    "status": solution["status"],
                    "meets": tangent_meets_angle(dec_deg, hemisphere),
                    "hemisphere": hemisphere,
                }
            )

    provenance = {
        "spike": "sun_asc_dsc",
        "production_validated": False,
        "formula_asc": FORMULA_ASC,
        "formula_dsc": FORMULA_DSC,
        "gast_source": GAST_SOURCE,
        "horizon_convention": HORIZON_CONVENTION,
        "refraction_policy": REFRACTION_POLICY,
        "pyswisseph_version": str(getattr(swe, "__version__", "unknown")),
        "swisseph_version": str(getattr(swe, "version", "unknown")),
        "python_version": sys.version.split()[0],
        "ephemeris_configuration": "consumed_from_process_without_mutation",
        "delta_t_days": float(swe.deltat(jd_ut)),
        "sampling": {
            "method": "deterministic_adaptive_multi_probe",
            "refine_probe_fractions": list(ASC_DSC_REFINE_PROBE_FRACTIONS),
            "post_validation_fractions": list(ASC_DSC_POST_VALIDATION_FRACTIONS),
            "error_metric": ASC_DSC_INTERP_ERROR_METRIC,
            "tolerance_deg": interp_tol_deg,
            "max_recursion_depth": max_recursion_depth,
            "max_points": max_points,
            "point_budget": "total vertices; mandatory seeds reserved first",
            "seed_latitudes": "southern_endpoint, equator_if_interior, northern_endpoint",
            "order": "south_to_north",
            "validation_contract": (
                "experimental_finite_probe_set_not_global_maximum_proof"
            ),
        },
        "note": (
            "GAST from swe.sidtime, not GMST; apparent position (no FLG_TRUEPOS); "
            "relocated ecliptic ASC is not geographic ASC; "
            "cut endpoints may be -180 and +180"
        ),
    }
    shared = {
        "schema_version": SCHEMA_VERSION,
        "calculation_version": CALCULATION_VERSION_ASC_DSC,
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
        "horizon_convention": HORIZON_CONVENTION,
        "refraction_policy": REFRACTION_POLICY,
        "semidiameter_applied": False,
        "observer_elevation_applied": False,
        "topocentric_parallax_applied": False,
        "valid_latitude_min_deg": south,
        "valid_latitude_max_deg": north,
        "polar_endpoint_limit": polar_limit,
        "polar_interior_limit_deg": POLAR_INTERIOR_LIMIT_DEG,
        "tangent_endpoints": copy.deepcopy(tangent_endpoints),
        "mc_longitude_deg": longitude_mc,
        "ic_longitude_deg": longitude_ic,
        "sampling_tolerance_deg": interp_tol_deg,
        "sampling_error_metric": ASC_DSC_INTERP_ERROR_METRIC,
        "sampling_max_recursion_depth": max_recursion_depth,
        "sampling_max_points": max_points,
        "sampling_refine_probe_fractions": list(ASC_DSC_REFINE_PROBE_FRACTIONS),
        "sampling_post_validation_fractions": list(
            ASC_DSC_POST_VALIDATION_FRACTIONS
        ),
        "geometry_complete": all(trace["geometry_complete"] for trace in traces.values()),
        "requested_ephemeris": requested["ephemeris"],
        "actual_ephemeris": returned["ephemeris"],
        "requested_flags": requested_flags,
        "returned_flags": returned_flags,
        "requested_unknown_flag_bits": requested["unknown_flag_bits"],
        "returned_unknown_flag_bits": returned["unknown_flag_bits"],
        "warnings": list(warnings),
        "provenance": dict(provenance),
    }
    lines = []
    for angle, line_id in ((ANGLE_ASC, LINE_ID_ASC), (ANGLE_DSC, LINE_ID_DSC)):
        record = copy.deepcopy(shared)
        geojson = _segments_to_geojson(traces[angle]["segments"])
        record["angle"] = angle
        record["line_id"] = line_id
        record["segments"] = copy.deepcopy(geojson)
        record["segment_count"] = len(geojson)
        record["vertex_count"] = len(traces[angle]["vertices"])
        record["geometry_complete"] = traces[angle]["geometry_complete"]
        record["validation"] = copy.deepcopy(traces[angle]["validation"])
        record["mandatory_vertices_present"] = dict(
            traces[angle]["mandatory_vertices_present"]
        )
        record["tangent_endpoints"] = copy.deepcopy(tangent_endpoints)
        record["warnings"] = list(warnings)
        record["provenance"] = copy.deepcopy(provenance)
        lines.append(record)
    top = copy.deepcopy(shared)
    top["lines"] = lines
    return top
