"""Best Times civil-timezone enforcement — deterministic, no birth-profile exposure."""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime
from unittest.mock import patch
from zoneinfo import ZoneInfo

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from routes.pathfinder import PathfinderBestTimesRequest, pathfinder_best_times  # noqa: E402
from services.pathfinder import (  # noqa: E402
    BEST_TIMES_CIVIL_TIMEZONE_REQUIRED,
    best_times,
    is_authoritative_civil_timezone,
    relocation_reading,
)
from services.transit_instant import timezone_at  # noqa: E402

SAMPLE_BIRTH = {
    "birth_date": "2000-01-15",
    "birth_time": "12:00",
    "birth_location": "35.70,51.42",
}
STUB_CHART = {
    "planets": {},
    "houses": [0.0] * 12,
    "angles": {"AC": 0.0, "DC": 180.0, "MC": 90.0, "IC": 270.0},
}
MAURITANIA = "20.0657,-9.9607"
ATLANTIC = "19.9327,-30.0326"


def _aware_local(_date: str, _time: str, *_args, timezone_name: str | None = None, **_kwargs):
    zone = timezone_name or "Asia/Tehran"
    return datetime(2000, 1, 15, 12, 0, tzinfo=ZoneInfo(zone))


@pytest.fixture
def stub_chart_path():
    with (
        patch("services.pathfinder._calc_chart_for_instant", return_value=STUB_CHART) as calc,
        patch("services.pathfinder._local_datetime", side_effect=_aware_local) as local,
        patch(
            "services.pathfinder.calculate_activity_score",
            return_value={"executive": {"score": 70}},
        ),
    ):
        yield calc, local


class TestCivilTimezonePredicate:
    @pytest.mark.parametrize(
        "name",
        [
            "Africa/Nouakchott",
            "Europe/London",
            "Asia/Dubai",
            "Pacific/Tongatapu",
            "Antarctica/Syowa",
        ],
    )
    def test_accepts_civil_region_zones(self, name: str) -> None:
        assert is_authoritative_civil_timezone(name) is True

    @pytest.mark.parametrize(
        "name",
        [
            "Etc/GMT+2",
            "Etc/GMT-10",
            "Etc/UTC",
            "UTC",
            "GMT",
            "",
            "   ",
            "GMT+2",
            "UTC+01:00",
            "+00:00",
        ],
    )
    def test_rejects_non_civil_names(self, name: str) -> None:
        assert is_authoritative_civil_timezone(name) is False

    def test_rejects_none(self) -> None:
        assert is_authoritative_civil_timezone(None) is False


class TestBestTimesEnforcement:
    def test_accepted_civil_zone_is_reused_for_every_candidate(self, stub_chart_path) -> None:
        calc, local = stub_chart_path
        with patch("services.pathfinder.timezone_at", return_value="Africa/Nouakchott") as lookup:
            result = best_times(
                **SAMPLE_BIRTH,
                target_location=MAURITANIA,
                start_date="2026-09-08",
                search_months=1,
                trip_days=3,
            )
        assert lookup.call_count == 1
        assert result["best_periods"]
        # Candidate days pass timezone_name=; birth natal localization does not.
        candidate_zones = [
            call.kwargs.get("timezone_name")
            for call in local.call_args_list
            if "timezone_name" in call.kwargs
        ]
        assert candidate_zones
        assert set(candidate_zones) == {"Africa/Nouakchott"}
        assert calc.called

    def test_etc_gmt_rejected_before_chart_calculation(self, stub_chart_path) -> None:
        calc, _local = stub_chart_path
        with patch("services.pathfinder.timezone_at", return_value="Etc/GMT+2"):
            with pytest.raises(ValueError, match=BEST_TIMES_CIVIL_TIMEZONE_REQUIRED):
                best_times(
                    **SAMPLE_BIRTH,
                    target_location=ATLANTIC,
                    start_date="2026-09-08",
                    search_months=1,
                    trip_days=3,
                )
        assert calc.call_count == 0

    def test_missing_lookup_rejected_as_validation_error(self, stub_chart_path) -> None:
        calc, _local = stub_chart_path
        with patch(
            "services.pathfinder.timezone_at",
            side_effect=ValueError("No timezone found for (0, 0)."),
        ):
            with pytest.raises(ValueError, match=BEST_TIMES_CIVIL_TIMEZONE_REQUIRED):
                best_times(
                    **SAMPLE_BIRTH,
                    target_location="0,0",
                    start_date="2026-09-08",
                    search_months=1,
                    trip_days=3,
                )
        assert calc.call_count == 0

    def test_direct_route_returns_422_without_timezone_field(self, stub_chart_path) -> None:
        body = PathfinderBestTimesRequest(
            birth_date=SAMPLE_BIRTH["birth_date"],
            birth_time=SAMPLE_BIRTH["birth_time"],
            birth_location=SAMPLE_BIRTH["birth_location"],
            target_location=ATLANTIC,
            start_date="2026-09-08",
            search_months=1,
            trip_days=3,
        )
        with patch("services.pathfinder.timezone_at", return_value="Etc/GMT+2"):
            with pytest.raises(HTTPException) as caught:
                asyncio.run(pathfinder_best_times(body))
        assert caught.value.status_code == 422
        assert caught.value.detail == BEST_TIMES_CIVIL_TIMEZONE_REQUIRED
        assert "house" not in str(caught.value.detail).lower()

    def test_relocation_still_allows_etc_offset_target(self, stub_chart_path) -> None:
        calc, _local = stub_chart_path
        with patch("services.pathfinder.timezone_at", return_value="Etc/GMT+2"):
            reading = relocation_reading(
                **SAMPLE_BIRTH,
                target_location=ATLANTIC,
                target_label="Selected location",
            )
        assert reading["target"]["location"] == ATLANTIC
        assert calc.call_count >= 1
        with patch("services.pathfinder.timezone_at", return_value="Etc/GMT+2"):
            with pytest.raises(ValueError, match=BEST_TIMES_CIVIL_TIMEZONE_REQUIRED):
                best_times(
                    **SAMPLE_BIRTH,
                    target_location=ATLANTIC,
                    start_date="2026-09-08",
                    search_months=1,
                    trip_days=3,
                )


class TestCoordinateRegressions:
    def test_mauritania_succeeds_when_derived_zone_is_civil(self, stub_chart_path) -> None:
        with patch("services.pathfinder.timezone_at", return_value="Africa/Nouakchott"):
            result = best_times(
                **SAMPLE_BIRTH,
                target_location=MAURITANIA,
                start_date="2026-09-08",
                search_months=1,
                trip_days=3,
            )
        assert result["purpose"] == "all"
        assert result["best_periods"]

    def test_atlantic_rejected_for_best_times(self, stub_chart_path) -> None:
        with patch("services.pathfinder.timezone_at", return_value="Etc/GMT+2"):
            with pytest.raises(ValueError, match=BEST_TIMES_CIVIL_TIMEZONE_REQUIRED):
                best_times(
                    **SAMPLE_BIRTH,
                    target_location=ATLANTIC,
                    start_date="2026-09-08",
                    search_months=1,
                    trip_days=3,
                )

    def test_empirical_mauritania_lookup_is_civil(self) -> None:
        derived = timezone_at(20.0657, -9.9607)
        assert derived == "Africa/Nouakchott"
        assert is_authoritative_civil_timezone(derived) is True
