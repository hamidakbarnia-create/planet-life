"""
Regression test for the FLG_SPEED bug.

History: prior to May 22, 2026, _build_chart_payload was calling Swiss
Ephemeris WITHOUT the FLG_SPEED flag, which meant every planet's `speed`
returned as 0.0 and the retrograde flag silently never fired. Real-world
retrogrades (e.g. Pluto Rx in Aquarius from 2026-05-06 through 2026-10-14)
never appeared in the UI, destroying platform credibility.

These assertions encode a few well-known retrograde facts so the bug can
never reintroduce itself silently.

Run from repo root:
    py -3.11 -m pytest apps/api/tests/test_retrograde_detection.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

# Make `apps/api/src/services/chart_data` importable without installing.
ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from datetime import datetime
import pytz

from services.chart_data import _build_chart_payload  # noqa: E402


def _payload_for(date_str: str, *, hour: int = 12):
    """Build a transit payload for a given UTC date at noon, London coords."""
    tz = pytz.timezone("Europe/London")
    dt = tz.localize(
        datetime(
            *(int(p) for p in date_str.split("-")),
            hour=hour,
            minute=0,
        )
    )
    return _build_chart_payload(dt, 51.5074, -0.1278)["planets"]


def test_pluto_retrograde_in_aquarius_may_2026():
    """Pluto Rx 2026-05-06 → 2026-10-14 (well-documented external truth)."""
    p = _payload_for("2026-05-22")
    assert p["pluto"].get("retrograde") is True, (
        "Pluto should be retrograde on 2026-05-22. If this fails, the "
        "FLG_SPEED bug has returned in chart_data._build_chart_payload."
    )


def test_pluto_direct_before_retrograde_window():
    """Day before the 2026 Pluto Rx station — must still be direct."""
    p = _payload_for("2026-05-05")
    assert p["pluto"].get("retrograde") is not True


def test_pluto_direct_after_retrograde_window():
    """Day after the 2026 Pluto direct station — must be direct."""
    p = _payload_for("2026-10-20")
    assert p["pluto"].get("retrograde") is not True


def test_speed_field_is_populated_for_all_planets():
    """If FLG_SPEED is missing, every speed silently becomes 0.0."""
    p = _payload_for("2026-05-22")
    for name in ("sun", "moon", "mercury", "venus", "mars", "jupiter",
                 "saturn", "uranus", "neptune", "pluto"):
        speed = p[name].get("speed")
        assert speed is not None, f"{name} missing 'speed' field in payload"
        assert speed != 0.0, (
            f"{name} speed is exactly 0 — almost certainly the FLG_SPEED "
            f"flag was dropped from calc_flags."
        )


def test_sun_and_moon_are_never_retrograde():
    """Sun and Moon never retrograde — sanity check on the rules engine."""
    p = _payload_for("2026-05-22")
    assert p["sun"].get("retrograde") is not True
    assert p["moon"].get("retrograde") is not True
