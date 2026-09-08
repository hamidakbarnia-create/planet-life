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
    CROSS_ENGINE_VALIDATION_TOL_DEG,
    INVARIANT_SEPARATION_TOL_DEG,
    LINE_ID_IC,
    LINE_ID_MC,
    LOCAL_SNAPSHOT_TOL_DEG,
    MERIDIAN_LAT_NORTH,
    MERIDIAN_LAT_SOUTH,
    PUBLIC_TEST_INSTANT_UTC,
    compute_sun_mc_ic,
    decode_swe_flags,
    ephemeris_fallback_warnings,
    julian_day_ut,
    meridians_from_ra_and_gast,
    meridian_linestring,
    normalize_longitude_east,
    require_utc_datetime,
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
