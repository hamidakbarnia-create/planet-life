#!/usr/bin/env python3
"""Planet Life astrology compatibility report."""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))

from services.chart_data import compute_birth_chart, PlacidusLatitudeError  # noqa: E402

REFERENCE_CASES = [
    {
        "name": "Rafsanjan 1982",
        "birth_date": "1982-02-25",
        "birth_time": "05:47",
        "latitude": 30.402184,
        "longitude": 55.994178,
        "checks": {
            "utc_datetime": "1982-02-25 02:17:00",
            "timezone": "Asia/Tehran",
            "asc_sign": 11,
            "asc_deg": 24.6,
            "mc_sign": 9,
            "mc_deg": 6.72,
            "sun_sign": 12,
            "sun_deg": 6.08,
            "node_sign": 4,
            "node_deg": 20.27,
        },
    },
    {
        "name": "London 1990",
        "birth_date": "1990-06-15",
        "birth_time": "14:30",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "checks": {"timezone": "Europe/London"},
    },
    {
        "name": "New York 2000",
        "birth_date": "2000-07-04",
        "birth_time": "12:00",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "checks": {"timezone": "America/New_York"},
    },
    {
        "name": "Tokyo 2025",
        "birth_date": "2025-03-20",
        "birth_time": "12:00",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "checks": {"timezone": "Asia/Tokyo"},
    },
    {
        "name": "Sydney 2025",
        "birth_date": "2025-01-15",
        "birth_time": "12:00",
        "latitude": -33.8688,
        "longitude": 151.2093,
        "checks": {"timezone": "Australia/Sydney"},
    },
]

HIGH_LAT_FAIL = {
    "name": "Tromsø Placidus (expect fail)",
    "birth_date": "1990-06-15",
    "birth_time": "12:00",
    "latitude": 69.6492,
    "longitude": 18.9553,
    "expect_error": True,
}


@dataclass
class Report:
    tested: int = 0
    passed: int = 0
    failed: list[str] = field(default_factory=list)
    max_planet_diff: float = 0.0
    max_asc_diff: float = 0.0
    max_mc_diff: float = 0.0


def _sign_deg(lon: float) -> tuple[int, float]:
    return int(lon // 30) + 1, lon % 30


def _check_angle(chart: dict, key: str, lon: float, checks: dict, report: Report) -> list[str]:
    errors = []
    sign_key = f"{key}_sign"
    deg_key = f"{key}_deg"
    if sign_key not in checks:
        return errors
    sign, deg = _sign_deg(lon)
    if sign != checks[sign_key]:
        errors.append(f"{key} sign {sign} != {checks[sign_key]}")
    if deg_key in checks:
        diff = abs(deg - checks[deg_key])
        if key in ("asc", "sun", "node"):
            report.max_planet_diff = max(report.max_planet_diff, diff) if key != "asc" else report.max_planet_diff
        if key == "asc":
            report.max_asc_diff = max(report.max_asc_diff, diff)
        elif key == "mc":
            report.max_mc_diff = max(report.max_mc_diff, diff)
        elif key in ("sun", "node"):
            report.max_planet_diff = max(report.max_planet_diff, diff)
        if diff > 0.5:
            errors.append(f"{key} deg {deg:.2f} != {checks[deg_key]}")
    return errors


def _run_case(case: dict, report: Report) -> None:
    report.tested += 1
    name = case["name"]
    try:
        if case.get("expect_error"):
            try:
                compute_birth_chart(
                    birth_date=case["birth_date"],
                    birth_time=case["birth_time"],
                    location=name,
                    latitude=case["latitude"],
                    longitude=case["longitude"],
                    house_system="placidus",
                )
                report.failed.append(f"{name}: expected PlacidusLatitudeError")
            except PlacidusLatitudeError:
                report.passed += 1
            return

        chart = compute_birth_chart(
            birth_date=case["birth_date"],
            birth_time=case["birth_time"],
            location=name,
            latitude=case["latitude"],
            longitude=case["longitude"],
            node_type="mean",
        )
        checks = case.get("checks", {})
        errors: list[str] = []

        if "utc_datetime" in checks and chart["utc_datetime"] != checks["utc_datetime"]:
            errors.append(f"UTC {chart['utc_datetime']} != {checks['utc_datetime']}")
        if "timezone" in checks and chart["timezone"] != checks["timezone"]:
            errors.append(f"TZ {chart['timezone']} != {checks['timezone']}")
        if len(chart["houses"]) != 12:
            errors.append("houses != 12")
        if chart["node_type"] != "mean":
            errors.append(f"node_type {chart['node_type']}")

        errors += _check_angle(chart, "asc", chart["ascendant"], checks, report)
        errors += _check_angle(chart, "mc", chart["midheaven"], checks, report)
        errors += _check_angle(chart, "sun", chart["planets"]["sun"]["longitude"], checks, report)
        errors += _check_angle(chart, "node", chart["planets"]["north_node"]["longitude"], checks, report)

        if errors:
            report.failed.append(f"{name}: " + "; ".join(errors))
        else:
            report.passed += 1
    except Exception as exc:
        report.failed.append(f"{name}: {exc}")


def main() -> int:
    report = Report()
    for case in REFERENCE_CASES:
        _run_case(case, report)
    _run_case(HIGH_LAT_FAIL, report)

    pass_rate = (report.passed / report.tested * 100) if report.tested else 0
    out = {
        "charts_tested": report.tested,
        "passed": report.passed,
        "failed_count": len(report.failed),
        "pass_rate_pct": round(pass_rate, 1),
        "max_planet_diff_deg": round(report.max_planet_diff, 3),
        "max_asc_diff_deg": round(report.max_asc_diff, 3),
        "max_mc_diff_deg": round(report.max_mc_diff, 3),
        "failed_cases": report.failed,
    }

    print("Planet Life Astrology Compatibility Report")
    print("=" * 44)
    print(f"Charts tested:     {out['charts_tested']}")
    print(f"Passed:            {out['passed']}")
    print(f"Pass rate:         {out['pass_rate_pct']}%")
    print(f"Max planet diff:   {out['max_planet_diff_deg']}°")
    print(f"Max ASC diff:      {out['max_asc_diff_deg']}°")
    print(f"Max MC diff:       {out['max_mc_diff_deg']}°")
    if out["failed_cases"]:
        print("\nFailed cases:")
        for f in out["failed_cases"]:
            print(f"  - {f}")
    else:
        print("\nAll reference cases passed.")

    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        print(json.dumps(out, indent=2))

    return 0 if not out["failed_cases"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
