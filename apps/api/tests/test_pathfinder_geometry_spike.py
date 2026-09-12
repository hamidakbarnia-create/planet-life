"""Focused Sun MC/IC geometry spike tests. Not a cross-engine astronomy suite."""

from __future__ import annotations

import ast
import inspect
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from services import pathfinder_geometry_spike as spike  # noqa: E402
from services.pathfinder_geometry_spike import (  # noqa: E402
    ANGLE_ASC,
    ANGLE_DSC,
    ASC_DSC_INTERP_TOL_DEG,
    ASC_DSC_POST_VALIDATION_FRACTIONS,
    ASC_DSC_REFINE_PROBE_FRACTIONS,
    CROSS_ENGINE_VALIDATION_TOL_DEG,
    EPS_ACOS,
    HORIZON_ALTITUDE_TOL_DEG,
    HORIZON_CONVENTION,
    INVARIANT_SEPARATION_TOL_DEG,
    LINE_ID_ASC,
    LINE_ID_DSC,
    LINE_ID_IC,
    LINE_ID_MC,
    LOCAL_SNAPSHOT_TOL_DEG,
    MERIDIAN_LAT_NORTH,
    MERIDIAN_LAT_SOUTH,
    POLAR_INTERIOR_LIMIT_DEG,
    PUBLIC_TEST_INSTANT_UTC,
    REFRACTION_POLICY,
    compute_sun_asc_dsc,
    compute_sun_mc_ic,
    cut_longitude_east,
    decode_swe_flags,
    ephemeris_fallback_warnings,
    find_antimeridian_crossing_latitude,
    geometric_altitude_deg,
    horizon_domain_endpoints,
    horizon_longitude_deg,
    interpolation_error_deg,
    julian_day_ut,
    mandatory_seed_latitudes,
    probe_edge_errors,
    meridians_from_ra_and_gast,
    meridian_linestring,
    normalize_longitude_east,
    require_equatorial_sun_position,
    require_utc_datetime,
    sample_horizon_curve,
    solve_horizon_at_latitude,
    split_antimeridian_segments,
    tangent_meets_angle,
)

# Local-environment snapshot from the correction audit (pyswisseph 20230604 /
# Swiss Ephemeris 2.10.03, Moshier fallback). Tight tolerance is not
# cross-engine astronomical accuracy.
AUDIT_JD_UT = 2459022.0000000000
AUDIT_GAST_HOURS = 6.0094399312
AUDIT_GAST_DEG = 90.1415989680
AUDIT_RA_DEG = 90.6186972581
AUDIT_DEC_DEG = 23.4352926277
AUDIT_MC_DEG = 0.4770982901
AUDIT_IC_DEG = -179.5229017099


def _source_tree() -> ast.AST:
    path = Path(inspect.getsourcefile(spike)).resolve()
    return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


def _called_names(tree: ast.AST) -> set[str]:
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute):
            names.add(node.attr)
        if isinstance(node, ast.Call):
            func = node.func
            if isinstance(func, ast.Name):
                names.add(func.id)
    return names


def _swe_lib():
    return spike._import_swisseph()


def test_timezone_aware_utc_accepted():
    dt = require_utc_datetime(PUBLIC_TEST_INSTANT_UTC)
    assert dt.tzinfo is not None
    assert dt.utcoffset() == timedelta(0)


def test_naive_datetime_rejected():
    with pytest.raises(spike.GeometrySpikeError, match="timezone-aware UTC"):
        require_utc_datetime(datetime(2020, 6, 21, 12, 0, 0))


def test_non_utc_aware_datetime_rejected():
    london = datetime(2020, 6, 21, 12, 0, 0, tzinfo=ZoneInfo("Europe/London"))
    with pytest.raises(spike.GeometrySpikeError, match="must be UTC"):
        require_utc_datetime(london)


def test_julian_day_trace():
    jd = julian_day_ut(PUBLIC_TEST_INSTANT_UTC)
    assert jd == pytest.approx(AUDIT_JD_UT, abs=1e-10)


def test_sidereal_and_equatorial_trace_matches_local_audit():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    assert result["julian_day_ut"] == pytest.approx(AUDIT_JD_UT, abs=1e-10)
    assert result["greenwich_sidereal_time_hours"] == pytest.approx(
        AUDIT_GAST_HOURS, abs=LOCAL_SNAPSHOT_TOL_DEG
    )
    assert result["greenwich_sidereal_time_deg"] == pytest.approx(
        AUDIT_GAST_DEG, abs=LOCAL_SNAPSHOT_TOL_DEG
    )
    assert result["right_ascension_deg"] == pytest.approx(AUDIT_RA_DEG, abs=LOCAL_SNAPSHOT_TOL_DEG)
    assert result["declination_deg"] == pytest.approx(AUDIT_DEC_DEG, abs=LOCAL_SNAPSHOT_TOL_DEG)


def test_east_positive_sign_and_snapshot_longitudes():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    mc = next(line for line in result["lines"] if line["angle"] == "MC")
    ic = next(line for line in result["lines"] if line["angle"] == "IC")
    assert mc["longitude_deg"] > 0
    assert ic["longitude_deg"] < 0
    assert mc["longitude_deg"] == pytest.approx(AUDIT_MC_DEG, abs=LOCAL_SNAPSHOT_TOL_DEG)
    assert ic["longitude_deg"] == pytest.approx(AUDIT_IC_DEG, abs=LOCAL_SNAPSHOT_TOL_DEG)
    assert result["longitude_convention"] == spike.LONGITUDE_CONVENTION


def test_longitude_normalization_contract():
    assert normalize_longitude_east(0.0) == 0.0
    assert normalize_longitude_east(180.0) == 180.0
    assert normalize_longitude_east(-180.0) == 180.0
    assert normalize_longitude_east(181.0) == pytest.approx(-179.0)
    assert normalize_longitude_east(-181.0) == pytest.approx(179.0)
    assert normalize_longitude_east(540.0) == 180.0
    for bad in (float("nan"), float("inf"), float("-inf")):
        with pytest.raises(spike.GeometrySpikeError, match="finite"):
            normalize_longitude_east(bad)


def test_ic_equals_normalized_mc_plus_180():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    mc = next(line for line in result["lines"] if line["angle"] == "MC")["longitude_deg"]
    ic = next(line for line in result["lines"] if line["angle"] == "IC")["longitude_deg"]
    assert ic == pytest.approx(normalize_longitude_east(mc + 180.0), abs=INVARIANT_SEPARATION_TOL_DEG)
    sep = abs(normalize_longitude_east(ic - mc))
    assert sep == pytest.approx(180.0, abs=INVARIANT_SEPARATION_TOL_DEG)


def test_constant_longitude_geojson_and_ranges():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    for line in result["lines"]:
        geom = line["geometry"]
        assert geom["type"] == "LineString"
        coords = geom["coordinates"]
        assert len(coords) == 2
        lons = [pair[0] for pair in coords]
        lats = [pair[1] for pair in coords]
        assert lons[0] == line["longitude_deg"]
        assert lons[0] == lons[1]
        assert lats == [MERIDIAN_LAT_SOUTH, MERIDIAN_LAT_NORTH]
        for lon, lat in coords:
            assert math.isfinite(lon) and math.isfinite(lat)
            assert -180.0 < lon <= 180.0
            assert -90.0 < lat < 90.0
            assert abs(lat) < 90.0


def test_no_nan_or_infinity_in_result():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    numeric = [
        result["julian_day_ut"],
        result["right_ascension_deg"],
        result["declination_deg"],
        result["greenwich_sidereal_time_hours"],
        result["greenwich_sidereal_time_deg"],
    ]
    numeric.extend(line["longitude_deg"] for line in result["lines"])
    for line in result["lines"]:
        for lon, lat in line["geometry"]["coordinates"]:
            numeric.extend((lon, lat))
    assert all(math.isfinite(v) for v in numeric)


def test_stable_identifiers():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    ids = [line["line_id"] for line in result["lines"]]
    angles = [line["angle"] for line in result["lines"]]
    assert ids == [LINE_ID_MC, LINE_ID_IC]
    assert angles == ["MC", "IC"]
    assert result["body"] == "sun"
    assert result["schema_version"] == 1
    assert result["calculation_version"] == 1
    assert result["status"] == "experimental"


def test_deterministic_repeat_execution():
    first = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    second = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    assert first["julian_day_ut"] == second["julian_day_ut"]
    assert first["right_ascension_deg"] == second["right_ascension_deg"]
    assert first["greenwich_sidereal_time_deg"] == second["greenwich_sidereal_time_deg"]
    assert first["returned_flags"] == second["returned_flags"]
    assert [line["longitude_deg"] for line in first["lines"]] == [
        line["longitude_deg"] for line in second["lines"]
    ]


def test_requested_versus_actual_ephemeris_reporting():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    requested = decode_swe_flags(result["requested_flags"])
    returned = decode_swe_flags(result["returned_flags"])
    assert requested["ephemeris"] == "SWIEPH"
    assert requested["equatorial"] is True
    assert requested["truepos"] is False
    assert result["requested_ephemeris"] == "SWIEPH"
    assert result["actual_ephemeris"] == returned["ephemeris"]
    assert result["returned_flags"] == returned["value"]
    assert "EQUATORIAL" in returned["names"]
    assert "TRUEPOS" not in returned["names"]


def test_flag_decoder_covers_required_bits():
    swe = spike._import_swisseph()
    decoded = decode_swe_flags(int(swe.FLG_SWIEPH | swe.FLG_EQUATORIAL | swe.FLG_TRUEPOS), swe)
    for name in ("SWIEPH", "MOSEPH", "JPLEPH", "EQUATORIAL", "TRUEPOS"):
        assert name in decoded["bits"]
        assert name in decoded["catalog"]
    assert decoded["ephemeris"] == "SWIEPH"
    assert decoded["equatorial"] is True
    assert decoded["truepos"] is True


def test_fallback_helper_swieph_to_moseph_warns():
    swe = _swe_lib()
    warnings = ephemeris_fallback_warnings(int(swe.FLG_SWIEPH), int(swe.FLG_MOSEPH), swe)
    assert any("SWIEPH" in item and "MOSEPH" in item for item in warnings)


def test_fallback_helper_swieph_to_jpleph_warns():
    swe = _swe_lib()
    warnings = ephemeris_fallback_warnings(int(swe.FLG_SWIEPH), int(swe.FLG_JPLEPH), swe)
    assert any("SWIEPH" in item and "JPLEPH" in item for item in warnings)


def test_fallback_helper_moseph_to_moseph_has_no_fallback_warning():
    swe = _swe_lib()
    warnings = ephemeris_fallback_warnings(int(swe.FLG_MOSEPH), int(swe.FLG_MOSEPH), swe)
    assert not any("requested" in item and "returned" in item for item in warnings)
    assert not any("unresolved" in item for item in warnings)


def test_fallback_helper_jpleph_to_jpleph_has_no_fallback_warning():
    swe = _swe_lib()
    warnings = ephemeris_fallback_warnings(int(swe.FLG_JPLEPH), int(swe.FLG_JPLEPH), swe)
    assert not any("requested" in item and "returned" in item for item in warnings)
    assert not any("unresolved" in item for item in warnings)


def test_fallback_helper_unresolved_ephemeris_warns():
    swe = _swe_lib()
    warnings = ephemeris_fallback_warnings(int(swe.FLG_EQUATORIAL), int(swe.FLG_EQUATORIAL), swe)
    assert any("unresolved" in item for item in warnings)


def test_live_compute_reports_requested_actual_and_fallback_when_present():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    assert result["requested_ephemeris"] == "SWIEPH"
    assert result["actual_ephemeris"] in {"MOSEPH", "SWIEPH", "JPLEPH"}
    assert isinstance(result["requested_flags"], int)
    assert isinstance(result["returned_flags"], int)
    if result["requested_ephemeris"] != result["actual_ephemeris"]:
        assert any("requested" in item for item in result["warnings"])
    if result["requested_ephemeris"] == "SWIEPH" and result["actual_ephemeris"] == "MOSEPH":
        assert any("Swiss Ephemeris data files were not used" in item for item in result["warnings"])
    assert CROSS_ENGINE_VALIDATION_TOL_DEG is None


def test_no_birthplace_latitude_or_longitude_parameter():
    signature = inspect.signature(compute_sun_mc_ic)
    assert list(signature.parameters) == ["birth_instant_utc"]
    with pytest.raises(TypeError):
        compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC, latitude=51.5, longitude=0.0)  # type: ignore[misc]


def test_module_contains_no_set_ephe_path_or_close():
    names = _called_names(_source_tree())
    forbidden = {"set_ephe_path", "close"}
    overlap = names & forbidden
    assert not overlap, overlap


def test_module_does_not_call_houses():
    names = _called_names(_source_tree())
    assert "houses" not in names


def test_module_does_not_import_relocation_scoring_or_routes():
    forbidden = {
        "pathfinder",
        "scoring",
        "scoring_pipeline",
        "vault_readings",
        "chart_data",
        "transit_instant",
        "fastapi",
        "routes",
        "APIRouter",
    }
    for node in ast.walk(_source_tree()):
        if isinstance(node, ast.Import):
            names = {alias.name.split(".")[0] for alias in node.names}
            overlap = names & forbidden
            assert not overlap, overlap
        if isinstance(node, ast.ImportFrom) and node.module:
            root = node.module.split(".")[0]
            assert root not in forbidden
            if node.module.startswith("services.") and node.module != "services.pathfinder_geometry_spike":
                pytest.fail(f"unexpected service import: {node.module}")


def test_pure_transform_hand_calculated_and_wrap_boundaries():
    mc, ic = meridians_from_ra_and_gast(90.6186972581, 90.1415989680)
    assert mc == pytest.approx(0.4770982901, abs=1e-10)
    assert ic == pytest.approx(-179.5229017099, abs=1e-10)

    mc_wrap, ic_wrap = meridians_from_ra_and_gast(10.0, 350.0)
    assert mc_wrap == pytest.approx(20.0)
    assert ic_wrap == pytest.approx(-160.0)

    mc_edge, ic_edge = meridians_from_ra_and_gast(0.0, 180.0)
    assert mc_edge == 180.0
    assert ic_edge == 0.0

    mc_zero, ic_zero = meridians_from_ra_and_gast(0.0, 0.0)
    assert mc_zero == 0.0
    assert ic_zero == 180.0

    mc_over, ic_over = meridians_from_ra_and_gast(450.0, 90.0)
    assert mc_over == 0.0
    assert ic_over == 180.0

    assert meridians_from_ra_and_gast.__module__ == "services.pathfinder_geometry_spike"
    source = inspect.getsource(meridians_from_ra_and_gast)
    assert "swisseph" not in source
    assert "calc_ut" not in source
    assert "sidtime" not in source


def test_meridian_linestring_is_not_a_curve():
    geom = meridian_linestring(0.4770982901)
    assert len(geom["coordinates"]) == 2
    assert geom["coordinates"][0][0] == geom["coordinates"][1][0]


def test_each_line_record_carries_required_trace_fields():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    required = {
        "schema_version",
        "calculation_version",
        "status",
        "body",
        "angle",
        "birth_instant_utc",
        "julian_day_ut",
        "right_ascension_deg",
        "declination_deg",
        "greenwich_sidereal_time_hours",
        "greenwich_sidereal_time_deg",
        "longitude_deg",
        "longitude_convention",
        "position_convention",
        "requested_ephemeris",
        "actual_ephemeris",
        "requested_flags",
        "returned_flags",
        "warnings",
        "geometry",
        "provenance",
    }
    assert result["birth_instant_utc"] == "2020-06-21T12:00:00Z"
    assert len(result["lines"]) == 2
    for line in result["lines"]:
        missing = required - set(line)
        assert not missing, missing
    assert result["position_convention"] == "apparent_geocentric_equatorial"
    assert result["provenance"]["production_validated"] is False
    assert result["provenance"]["ephemeris_configuration"] == (
        "consumed_from_process_without_mutation"
    )


def test_unknown_flag_bits_are_preserved_without_invented_names():
    swe = _swe_lib()
    unknown = 1 << 30
    combined = int(swe.FLG_MOSEPH | swe.FLG_EQUATORIAL | unknown)
    decoded = decode_swe_flags(combined, swe)
    assert decoded["ephemeris"] == "MOSEPH"
    assert decoded["equatorial"] is True
    assert decoded["value"] == combined
    assert decoded["unknown_flag_bits"] == unknown
    assert "UNKNOWN" not in decoded["names"]
    assert not any(name.startswith("BIT_") for name in decoded["names"])
    assert "MOSEPH" in decoded["names"]
    assert "EQUATORIAL" in decoded["names"]


def test_pure_transform_rejects_non_finite_inputs():
    for bad in (float("nan"), float("inf"), float("-inf")):
        with pytest.raises(spike.GeometrySpikeError, match="finite"):
            meridians_from_ra_and_gast(bad, 0.0)
        with pytest.raises(spike.GeometrySpikeError, match="finite"):
            meridians_from_ra_and_gast(0.0, bad)


def test_json_dumps_round_trip_of_public_instant():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    serialized = json.dumps(result)
    loaded = json.loads(serialized)
    assert [line["line_id"] for line in loaded["lines"]] == [LINE_ID_MC, LINE_ID_IC]
    assert loaded["requested_ephemeris"] == result["requested_ephemeris"]
    assert loaded["actual_ephemeris"] == result["actual_ephemeris"]
    for line in loaded["lines"]:
        assert line["geometry"]["type"] == "LineString"
        coords = line["geometry"]["coordinates"]
        assert len(coords) == 2
        assert coords[0][0] == line["longitude_deg"]
        assert coords[1][0] == line["longitude_deg"]
        for lon, lat in coords:
            assert isinstance(lon, float)
            assert isinstance(lat, float)
            assert math.isfinite(lon) and math.isfinite(lat)


def test_line_records_do_not_share_mutable_nested_values():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    first, second = result["lines"]
    first["warnings"].append("mutated-warning")
    first["provenance"]["note"] = "mutated-note"
    first["geometry"]["coordinates"][0][0] = 99.0
    assert "mutated-warning" not in second["warnings"]
    assert "mutated-warning" not in result["warnings"]
    assert second["provenance"]["note"] != "mutated-note"
    assert result["provenance"]["note"] != "mutated-note"
    assert second["geometry"]["coordinates"][0][0] != 99.0


def _horizon(phi, delta=AUDIT_DEC_DEG, ra=AUDIT_RA_DEG, gast=AUDIT_GAST_DEG):
    return solve_horizon_at_latitude(phi, delta, ra, gast)


def test_asc_dsc_equatorial_identity():
    solved = _horizon(0.0)
    assert solved["status"] == "two_solutions"
    assert solved["H0_deg"] == pytest.approx(90.0, abs=1e-12)
    assert solved["longitude_dsc_deg"] == pytest.approx(
        normalize_longitude_east(solved["longitude_asc_deg"] + 180.0),
        abs=INVARIANT_SEPARATION_TOL_DEG,
    )


def test_asc_rising_direction():
    solved = _horizon(45.0)
    earlier = geometric_altitude_deg(45.0, AUDIT_DEC_DEG, solved["H_asc_deg"] - 0.01)
    later = geometric_altitude_deg(45.0, AUDIT_DEC_DEG, solved["H_asc_deg"] + 0.01)
    assert earlier < 0.0 < later


def test_dsc_setting_direction():
    solved = _horizon(45.0)
    earlier = geometric_altitude_deg(45.0, AUDIT_DEC_DEG, solved["H_dsc_deg"] - 0.01)
    later = geometric_altitude_deg(45.0, AUDIT_DEC_DEG, solved["H_dsc_deg"] + 0.01)
    assert earlier > 0.0 > later


def test_zero_altitude_reconstruction():
    for phi in (0.0, 23.5, -45.0, 66.0):
        solved = _horizon(phi)
        assert abs(solved["altitude_asc_deg"]) <= HORIZON_ALTITUDE_TOL_DEG
        assert abs(solved["altitude_dsc_deg"]) <= HORIZON_ALTITUDE_TOL_DEG


def test_positive_declination_critical_endpoints():
    phi_crit = 90.0 - AUDIT_DEC_DEG
    north = _horizon(phi_crit)
    south = _horizon(-phi_crit)
    assert north["status"] == "tangent"
    assert south["status"] == "tangent"
    assert north["longitude_asc_deg"] == pytest.approx(AUDIT_IC_DEG, abs=1e-8)
    assert south["longitude_asc_deg"] == pytest.approx(AUDIT_MC_DEG, abs=1e-8)
    assert tangent_meets_angle(AUDIT_DEC_DEG, "north") == "IC"
    assert tangent_meets_angle(AUDIT_DEC_DEG, "south") == "MC"


def test_negative_declination_critical_endpoints():
    delta = -AUDIT_DEC_DEG
    phi_crit = 90.0 - abs(delta)
    north = _horizon(phi_crit, delta=delta)
    south = _horizon(-phi_crit, delta=delta)
    assert north["status"] == "tangent"
    assert south["status"] == "tangent"
    assert north["longitude_asc_deg"] == pytest.approx(AUDIT_MC_DEG, abs=1e-8)
    assert south["longitude_asc_deg"] == pytest.approx(AUDIT_IC_DEG, abs=1e-8)
    assert tangent_meets_angle(delta, "north") == "MC"
    assert tangent_meets_angle(delta, "south") == "IC"


def test_zero_declination_polar_limit():
    south, north, polar, warnings = horizon_domain_endpoints(0.0)
    assert polar is True
    assert south == -POLAR_INTERIOR_LIMIT_DEG
    assert north == POLAR_INTERIOR_LIMIT_DEG
    assert any("polar-endpoint" in item for item in warnings)
    solved = _horizon(0.0, delta=0.0)
    assert solved["H0_deg"] == pytest.approx(90.0)
    polar = solve_horizon_at_latitude(90.0, 0.0, AUDIT_RA_DEG, AUDIT_GAST_DEG)
    assert polar["status"] == "pole_excluded"
    with pytest.raises(spike.GeometrySpikeError, match="poles"):
        geometric_altitude_deg(90.0, 0.0, 0.0)


def test_continuously_above_classification():
    phi_crit = 90.0 - AUDIT_DEC_DEG
    solved = _horizon(phi_crit + 0.05)
    assert solved["status"] == "continuously_above"
    assert solved["longitude_asc_deg"] is None


def test_continuously_below_classification():
    phi_crit = 90.0 - AUDIT_DEC_DEG
    solved = _horizon(-(phi_crit + 0.05))
    assert solved["status"] == "continuously_below"
    assert solved["longitude_dsc_deg"] is None


def test_exact_tangent_behavior():
    phi_crit = 90.0 - AUDIT_DEC_DEG
    solved = _horizon(phi_crit)
    assert solved["status"] == "tangent"
    assert abs(abs(solved["x"]) - 1.0) <= EPS_ACOS
    assert solved["H0_deg"] == pytest.approx(180.0, abs=1e-10)
    assert solved["longitude_asc_deg"] == pytest.approx(solved["longitude_dsc_deg"])


def test_rounding_only_acos_clamp():
    phi_crit = 90.0 - AUDIT_DEC_DEG
    solved = _horizon(phi_crit)
    assert solved["status"] == "tangent"
    assert abs(abs(solved["x"]) - 1.0) <= EPS_ACOS
    # IEEE tan() at φ_crit is typically just past the unit interval; that is
    # the only allowed clamp. A material step north must not become a solution.
    north = _horizon(phi_crit + 0.2)
    assert north["status"] == "continuously_above"
    assert north["clamped"] is False


def test_material_out_of_domain_is_not_clamped():
    phi_crit = 90.0 - AUDIT_DEC_DEG
    solved = _horizon(phi_crit + 0.2)
    assert solved["status"] in {"continuously_above", "continuously_below"}
    assert solved["clamped"] is False
    assert solved["H0_deg"] is None


def test_horizon_rejects_non_finite_inputs():
    for bad in (float("nan"), float("inf"), float("-inf")):
        with pytest.raises(spike.GeometrySpikeError, match="finite"):
            solve_horizon_at_latitude(bad, AUDIT_DEC_DEG, AUDIT_RA_DEG, AUDIT_GAST_DEG)
        with pytest.raises(spike.GeometrySpikeError, match="finite"):
            geometric_altitude_deg(0.0, AUDIT_DEC_DEG, bad)


def test_missing_equatorial_is_hard_failure():
    swe = _swe_lib()
    with pytest.raises(spike.GeometrySpikeError, match="EQUATORIAL"):
        require_equatorial_sun_position(int(swe.FLG_MOSEPH), AUDIT_RA_DEG, AUDIT_DEC_DEG, swe)


def test_unresolved_or_invalid_coordinates_are_hard_failures():
    swe = _swe_lib()
    with pytest.raises(spike.GeometrySpikeError, match="provenance unresolved"):
        require_equatorial_sun_position(
            int(swe.FLG_EQUATORIAL), AUDIT_RA_DEG, AUDIT_DEC_DEG, swe
        )
    with pytest.raises(spike.GeometrySpikeError, match="finite"):
        require_equatorial_sun_position(
            int(swe.FLG_MOSEPH | swe.FLG_EQUATORIAL), float("nan"), AUDIT_DEC_DEG, swe
        )
    with pytest.raises(spike.GeometrySpikeError, match="\\[-90, 90\\]"):
        require_equatorial_sun_position(
            int(swe.FLG_MOSEPH | swe.FLG_EQUATORIAL), AUDIT_RA_DEG, 91.0, swe
        )


def test_adaptive_sampling_is_deterministic():
    first = sample_horizon_curve(AUDIT_RA_DEG, AUDIT_GAST_DEG, AUDIT_DEC_DEG, ANGLE_ASC)
    second = sample_horizon_curve(AUDIT_RA_DEG, AUDIT_GAST_DEG, AUDIT_DEC_DEG, ANGLE_ASC)
    assert first["vertices"] == second["vertices"]
    assert first["geometry_complete"] is True


def _assert_midpoint_error_within_tolerance(intervals, angle: str) -> None:
    for (lat0, lon0), (lat1, lon1) in intervals:
        lat_mid = 0.5 * (lat0 + lat1)
        lon_true = horizon_longitude_deg(
            lat_mid, AUDIT_DEC_DEG, AUDIT_RA_DEG, AUDIT_GAST_DEG, angle
        )
        error = interpolation_error_deg(lon0, lon1, lon_true, lat_mid)
        assert error <= ASC_DSC_INTERP_TOL_DEG + 1e-12


def _assert_fractional_probes_within_tolerance(
    intervals,
    angle: str,
    fractions,
    *,
    ra: float = AUDIT_RA_DEG,
    gast: float = AUDIT_GAST_DEG,
    delta: float = AUDIT_DEC_DEG,
) -> None:
    for (lat0, lon0), (lat1, lon1) in intervals:
        for probe in probe_edge_errors(
            lat0,
            lon0,
            lat1,
            lon1,
            lambda lat: horizon_longitude_deg(lat, delta, ra, gast, angle),
            tuple(fractions),
        ):
            assert probe["error_deg"] <= ASC_DSC_INTERP_TOL_DEG + 1e-12
            assert probe["over_tolerance"] is False


def _assert_mandatory_vertices(trace: dict) -> None:
    lats = [lat for lat, _lon in trace["vertices"]]
    assert abs(lats[0] - trace["south_endpoint_deg"]) <= 1e-12
    assert abs(lats[-1] - trace["north_endpoint_deg"]) <= 1e-12
    if trace["south_endpoint_deg"] < 0.0 < trace["north_endpoint_deg"]:
        assert any(abs(lat) <= 1e-12 for lat in lats)
    assert all(b > a for a, b in zip(lats, lats[1:]))
    assert trace["mandatory_vertices_present"]["south"] is True
    assert trace["mandatory_vertices_present"]["north"] is True
    assert trace["mandatory_vertices_present"]["equator"] is True


def test_midpoint_interpolation_error_within_tolerance():
    for angle in (ANGLE_ASC, ANGLE_DSC):
        trace = sample_horizon_curve(AUDIT_RA_DEG, AUDIT_GAST_DEG, AUDIT_DEC_DEG, angle)
        assert trace["geometry_complete"] is True
        vertices = trace["vertices"]
        _assert_midpoint_error_within_tolerance(zip(vertices, vertices[1:]), angle)
        rendered = [
            (pair, pair_next)
            for segment in trace["segments"]
            for pair, pair_next in zip(segment, segment[1:])
        ]
        _assert_midpoint_error_within_tolerance(rendered, angle)


def test_critical_end_probes_public_vector():
    for angle in (ANGLE_ASC, ANGLE_DSC):
        trace = sample_horizon_curve(AUDIT_RA_DEG, AUDIT_GAST_DEG, AUDIT_DEC_DEG, angle)
        assert trace["geometry_complete"] is True
        _assert_mandatory_vertices(trace)
        assert trace["validation"]["over_tolerance_count"] == 0
        assert trace["validation"]["max_error_deg"] <= ASC_DSC_INTERP_TOL_DEG + 1e-12
        ends = [trace["vertices"][0:2], trace["vertices"][-2:]]
        _assert_fractional_probes_within_tolerance(
            ends, angle, ASC_DSC_REFINE_PROBE_FRACTIONS
        )
        _assert_fractional_probes_within_tolerance(
            ends, angle, ASC_DSC_POST_VALIDATION_FRACTIONS
        )
        rendered = [
            (pair, pair_next)
            for segment in trace["segments"]
            for pair, pair_next in zip(segment, segment[1:])
        ]
        _assert_fractional_probes_within_tolerance(
            rendered, angle, ASC_DSC_POST_VALIDATION_FRACTIONS
        )


def test_critical_end_probes_negative_declination():
    delta = -AUDIT_DEC_DEG
    for angle in (ANGLE_ASC, ANGLE_DSC):
        trace = sample_horizon_curve(AUDIT_RA_DEG, AUDIT_GAST_DEG, delta, angle)
        assert trace["geometry_complete"] is True
        _assert_mandatory_vertices(trace)
        assert trace["validation"]["over_tolerance_count"] == 0
        assert trace["validation"]["max_error_deg"] <= ASC_DSC_INTERP_TOL_DEG + 1e-12
        ends = [trace["vertices"][0:2], trace["vertices"][-2:]]
        _assert_fractional_probes_within_tolerance(
            ends, angle, ASC_DSC_REFINE_PROBE_FRACTIONS, delta=delta
        )
        _assert_fractional_probes_within_tolerance(
            ends, angle, ASC_DSC_POST_VALIDATION_FRACTIONS, delta=delta
        )


def test_recursion_limit_marks_geometry_incomplete():
    trace = sample_horizon_curve(
        AUDIT_RA_DEG,
        AUDIT_GAST_DEG,
        AUDIT_DEC_DEG,
        ANGLE_ASC,
        interp_tol_deg=1e-12,
        max_recursion_depth=0,
        max_points=64,
    )
    assert trace["geometry_complete"] is False
    assert any("recursion depth" in item for item in trace["incomplete_reasons"])
    assert not any("point count" in item for item in trace["incomplete_reasons"])
    _assert_mandatory_vertices(trace)
    assert abs(trace["vertices"][0][0] - trace["south_endpoint_deg"]) <= 1e-12
    assert abs(trace["vertices"][-1][0] - trace["north_endpoint_deg"]) <= 1e-12
    assert trace["validation"]["over_tolerance_count"] > 0


def test_point_budget_one_is_invalid():
    with pytest.raises(spike.GeometrySpikeError, match="mandatory vertices"):
        sample_horizon_curve(
            AUDIT_RA_DEG,
            AUDIT_GAST_DEG,
            AUDIT_DEC_DEG,
            ANGLE_ASC,
            max_points=1,
        )
    with pytest.raises(spike.GeometrySpikeError, match="mandatory vertices"):
        compute_sun_asc_dsc(PUBLIC_TEST_INSTANT_UTC, max_points=1)


def test_point_count_limit_marks_geometry_incomplete():
    trace = sample_horizon_curve(
        AUDIT_RA_DEG,
        AUDIT_GAST_DEG,
        AUDIT_DEC_DEG,
        ANGLE_ASC,
        interp_tol_deg=1e-12,
        max_recursion_depth=16,
        max_points=4,
    )
    assert trace["geometry_complete"] is False
    assert any("point count" in item for item in trace["incomplete_reasons"])
    assert not any("recursion depth" in item for item in trace["incomplete_reasons"])
    assert len(trace["vertices"]) <= 4
    _assert_mandatory_vertices(trace)
    assert trace["validation"]["over_tolerance_count"] > 0


def test_point_budget_four_keeps_mandatory_vertices():
    trace = sample_horizon_curve(
        AUDIT_RA_DEG,
        AUDIT_GAST_DEG,
        AUDIT_DEC_DEG,
        ANGLE_ASC,
        interp_tol_deg=1e-12,
        max_recursion_depth=16,
        max_points=4,
    )
    assert len(mandatory_seed_latitudes(trace["south_endpoint_deg"], trace["north_endpoint_deg"])) == 3
    _assert_mandatory_vertices(trace)
    assert trace["geometry_complete"] is False
    assert any("point count" in item for item in trace["incomplete_reasons"])
    assert not any("recursion depth" in item for item in trace["incomplete_reasons"])


def test_point_budget_eight_keeps_mandatory_vertices():
    trace = sample_horizon_curve(
        AUDIT_RA_DEG,
        AUDIT_GAST_DEG,
        AUDIT_DEC_DEG,
        ANGLE_DSC,
        interp_tol_deg=1e-12,
        max_recursion_depth=16,
        max_points=8,
    )
    assert len(trace["vertices"]) <= 8
    _assert_mandatory_vertices(trace)
    assert trace["geometry_complete"] is False
    assert any("point count" in item for item in trace["incomplete_reasons"])
    assert trace["validation"]["over_tolerance_count"] > 0


def _forced_wrap_params(direction: str) -> tuple[float, float, float, str]:
    # Public-instant |δ|. DSC λ increases with |φ| and crosses +180 (east).
    # ASC λ decreases with |φ|; a small negative RA−GAST crosses −180 (west).
    if direction == "east":
        return (AUDIT_RA_DEG, AUDIT_GAST_DEG, AUDIT_DEC_DEG, ANGLE_DSC)
    return (AUDIT_GAST_DEG - 5.0, AUDIT_GAST_DEG, AUDIT_DEC_DEG, ANGLE_ASC)


def test_eastward_antimeridian_split():
    ra, gast, delta, angle = _forced_wrap_params("east")
    trace = sample_horizon_curve(ra, gast, delta, angle)
    cuts = []
    for segment in trace["segments"]:
        for _lat, lon in segment:
            if abs(abs(lon) - 180.0) <= 1e-9:
                cuts.append(lon)
    assert len(trace["segments"]) >= 2
    assert any(lon == 180.0 or abs(lon - 180.0) <= 1e-12 for lon in cuts)
    assert any(lon == -180.0 or abs(lon + 180.0) <= 1e-12 for lon in cuts)


def test_westward_antimeridian_split():
    ra, gast, delta, angle = _forced_wrap_params("west")
    trace = sample_horizon_curve(ra, gast, delta, angle)
    assert len(trace["segments"]) >= 2
    lons = [lon for segment in trace["segments"] for _lat, lon in segment]
    assert any(abs(lon - 180.0) <= 1e-9 for lon in lons)
    assert any(abs(lon + 180.0) <= 1e-9 for lon in lons)


def test_root_solved_crossing_latitude():
    ra, gast, delta, angle = _forced_wrap_params("east")
    trace = sample_horizon_curve(ra, gast, delta, angle)
    vertices = trace["vertices"]
    wrapped = None
    for (lat0, lon0), (lat1, lon1) in zip(vertices, vertices[1:]):
        if abs(lon1 - lon0) > 180.0:
            wrapped = (lat0, lon0, lat1, lon1)
            break
    assert wrapped is not None
    lat0, lon0, lat1, lon1 = wrapped
    lat_x, end_cut, start_cut = find_antimeridian_crossing_latitude(
        lat0,
        lon0,
        lat1,
        lon1,
        lambda lat: horizon_longitude_deg(lat, delta, ra, gast, angle),
    )
    assert lat0 <= lat_x <= lat1 or lat1 <= lat_x <= lat0
    actual = horizon_longitude_deg(lat_x, delta, ra, gast, angle)
    unwrapped = spike.unwrap_longitude(lon0, actual)
    assert abs(unwrapped - end_cut) <= 1e-8
    assert {end_cut, start_cut} == {180.0, -180.0}
    assert len(trace["segments"]) >= 2
    cut_lat = trace["segments"][0][-1][0]
    assert abs(cut_lat - trace["segments"][1][0][0]) <= 1e-12
    assert {trace["segments"][0][-1][1], trace["segments"][1][0][1]} == {180.0, -180.0}
    for segment in trace["segments"]:
        assert len(segment) >= 2
        assert all(b[0] >= a[0] for a, b in zip(segment, segment[1:]))


def test_signed_cut_endpoints_are_not_folded():
    assert cut_longitude_east(180.0) == 180.0
    assert cut_longitude_east(-180.0) == -180.0
    assert normalize_longitude_east(-180.0) == 180.0


def test_no_false_world_bridge():
    result = compute_sun_asc_dsc(PUBLIC_TEST_INSTANT_UTC)
    for line in result["lines"]:
        for segment in line["segments"]:
            coords = segment["coordinates"]
            assert len(coords) >= 2
            for (lon0, _lat0), (lon1, _lat1) in zip(coords, coords[1:]):
                assert abs(lon1 - lon0) <= 180.0 + 1e-12


def test_no_duplicate_consecutive_points():
    result = compute_sun_asc_dsc(PUBLIC_TEST_INSTANT_UTC)
    for line in result["lines"]:
        for segment in line["segments"]:
            coords = segment["coordinates"]
            for first, second in zip(coords, coords[1:]):
                assert first != second


def test_no_one_point_or_zero_length_segments():
    result = compute_sun_asc_dsc(PUBLIC_TEST_INSTANT_UTC)
    for line in result["lines"]:
        assert line["segment_count"] == len(line["segments"])
        for segment in line["segments"]:
            coords = segment["coordinates"]
            assert len(coords) >= 2
            assert coords[0] != coords[-1] or any(
                point != coords[0] for point in coords
            )


def test_asc_dsc_json_round_trip():
    result = compute_sun_asc_dsc(PUBLIC_TEST_INSTANT_UTC)
    loaded = json.loads(json.dumps(result))
    assert [line["line_id"] for line in loaded["lines"]] == [LINE_ID_ASC, LINE_ID_DSC]
    assert loaded["horizon_convention"] == HORIZON_CONVENTION
    assert loaded["refraction_policy"] == REFRACTION_POLICY
    assert loaded["requested_ephemeris"] == result["requested_ephemeris"]
    assert loaded["actual_ephemeris"] == result["actual_ephemeris"]
    for line in loaded["lines"]:
        assert line["segments"]
        for segment in line["segments"]:
            assert segment["type"] == "LineString"
            for lon, lat in segment["coordinates"]:
                assert math.isfinite(lon) and math.isfinite(lat)


def test_asc_dsc_records_do_not_share_mutable_nested_values():
    result = compute_sun_asc_dsc(PUBLIC_TEST_INSTANT_UTC)
    first, second = result["lines"]
    first["warnings"].append("mutated-warning")
    first["provenance"]["note"] = "mutated-note"
    first["segments"][0]["coordinates"][0][0] = 99.0
    first["tangent_endpoints"].append({"mutated": True})
    assert "mutated-warning" not in second["warnings"]
    assert second["provenance"]["note"] != "mutated-note"
    assert second["segments"][0]["coordinates"][0][0] != 99.0
    assert second["tangent_endpoints"][-1] != {"mutated": True}


def test_mc_ic_output_remains_unchanged_after_asc_dsc():
    result = compute_sun_mc_ic(PUBLIC_TEST_INSTANT_UTC)
    assert [line["line_id"] for line in result["lines"]] == [LINE_ID_MC, LINE_ID_IC]
    assert result["calculation_version"] == 1
    mc = next(line for line in result["lines"] if line["angle"] == "MC")
    ic = next(line for line in result["lines"] if line["angle"] == "IC")
    assert mc["longitude_deg"] == pytest.approx(AUDIT_MC_DEG, abs=LOCAL_SNAPSHOT_TOL_DEG)
    assert ic["longitude_deg"] == pytest.approx(AUDIT_IC_DEG, abs=LOCAL_SNAPSHOT_TOL_DEG)
    assert "segments" not in result
    assert result["provenance"]["spike"] == "sun_mc_ic"


def test_asc_dsc_live_result_contract():
    result = compute_sun_asc_dsc(PUBLIC_TEST_INSTANT_UTC)
    assert result["body"] == "sun"
    assert result["status"] == "experimental"
    assert result["provenance"]["production_validated"] is False
    assert result["semidiameter_applied"] is False
    assert result["observer_elevation_applied"] is False
    assert result["topocentric_parallax_applied"] is False
    assert result["horizon_convention"] == HORIZON_CONVENTION
    north = next(
        item for item in result["tangent_endpoints"] if item["hemisphere"] == "north"
    )
    south = next(
        item for item in result["tangent_endpoints"] if item["hemisphere"] == "south"
    )
    assert north["meets"] == "IC"
    assert south["meets"] == "MC"
    assert result["valid_latitude_max_deg"] == pytest.approx(90.0 - result["declination_deg"])
    assert result["valid_latitude_min_deg"] == pytest.approx(-(90.0 - result["declination_deg"]))
    assert result["geometry_complete"] is True
    for line in result["lines"]:
        lats = [lat for segment in line["segments"] for _lon, lat in segment["coordinates"]]
        assert any(abs(lat - south["latitude_deg"]) <= 1e-9 for lat in lats)
        assert any(abs(lat - north["latitude_deg"]) <= 1e-9 for lat in lats)
        assert any(abs(lat) <= 1e-9 for lat in lats)
        assert line["validation"]["over_tolerance_count"] == 0
        assert line["validation"]["max_error_deg"] <= ASC_DSC_INTERP_TOL_DEG + 1e-12


def test_module_still_has_no_forbidden_runtime_dependencies():
    names = _called_names(_source_tree())
    assert not names & {"houses", "set_ephe_path", "close"}
    forbidden = {
        "pathfinder",
        "scoring",
        "scoring_pipeline",
        "vault_readings",
        "chart_data",
        "transit_instant",
        "fastapi",
        "routes",
        "APIRouter",
    }
    for node in ast.walk(_source_tree()):
        if isinstance(node, ast.Import):
            imported = {alias.name.split(".")[0] for alias in node.names}
            assert not imported & forbidden
        if isinstance(node, ast.ImportFrom) and node.module:
            root = node.module.split(".")[0]
            assert root not in forbidden
