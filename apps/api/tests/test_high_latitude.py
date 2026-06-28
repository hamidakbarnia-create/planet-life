"""
High-latitude Placidus handling tests.

Run:
    py -3.11 -m pytest apps/api/tests/test_high_latitude.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chart_data import (  # noqa: E402
    PLacidus_USER_MESSAGE,
    PlacidusLatitudeError,
    compute_birth_chart,
)

# name, lat, lon, expect_placidus_ok
HIGH_LAT = [
    ("Reykjavik", 64.1466, -21.9426, True),
    ("Helsinki", 60.1699, 24.9384, True),
    ("Anchorage", 61.2181, -149.9003, True),
    ("Tromsø", 69.6492, 18.9553, False),
]


@pytest.mark.parametrize("name,lat,lon,ok", HIGH_LAT)
def test_placidus_high_latitude(name, lat, lon, ok):
    if ok:
        chart = compute_birth_chart(
            birth_date="1990-06-15",
            birth_time="12:00",
            location=name,
            latitude=lat,
            longitude=lon,
            house_system="placidus",
        )
        assert len(chart["houses"]) == 12
    else:
        with pytest.raises(PlacidusLatitudeError) as exc:
            compute_birth_chart(
                birth_date="1990-06-15",
                birth_time="12:00",
                location=name,
                latitude=lat,
                longitude=lon,
                house_system="placidus",
            )
        assert "Whole Sign" in str(exc.value)


def test_whole_sign_works_at_tromso():
    chart = compute_birth_chart(
        birth_date="1990-06-15",
        birth_time="12:00",
        location="Tromsø",
        latitude=69.6492,
        longitude=18.9553,
        house_system="whole_sign",
    )
    assert len(chart["houses"]) == 12


def test_placidus_error_message_exact():
    assert "Placidus houses cannot be calculated reliably" in PLacidus_USER_MESSAGE
    assert "Whole Sign" in PLacidus_USER_MESSAGE
