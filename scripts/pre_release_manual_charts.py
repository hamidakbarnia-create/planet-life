#!/usr/bin/env python3
"""Manual pre-release chart verification for 5 reference locations."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from services.chart_data import PlacidusLatitudeError, compute_birth_chart  # noqa: E402

CASES = [
    ("Rafsanjan", "1982-02-25", "05:47", 30.402184, 55.994178, "placidus"),
    ("London", "1990-06-15", "14:30", 51.5074, -0.1278, "placidus"),
    ("New York", "2000-07-04", "12:00", 40.7128, -74.0060, "placidus"),
    ("Tokyo", "2025-03-20", "12:00", 35.6762, 139.6503, "placidus"),
]

print("Pre-release manual chart verification")
print("=" * 40)
ok = 0
for name, date, time, lat, lon, hs in CASES:
    chart = compute_birth_chart(
        birth_date=date, birth_time=time, location=name,
        latitude=lat, longitude=lon, house_system=hs,
    )
    print(f"OK  {name}: ASC={chart['ascendant']:.2f} MC={chart['midheaven']:.2f} TZ={chart['timezone']}")
    ok += 1

# Tromsø Placidus should fail
try:
    compute_birth_chart(
        birth_date="1990-06-15", birth_time="12:00", location="Tromsø",
        latitude=69.6492, longitude=18.9553, house_system="placidus",
    )
    print("FAIL Tromsø Placidus: expected error")
    sys.exit(1)
except PlacidusLatitudeError as e:
    print(f"OK  Tromsø Placidus blocked: {e}")

# Tromsø Whole Sign should work
ws = compute_birth_chart(
    birth_date="1990-06-15", birth_time="12:00", location="Tromsø",
    latitude=69.6492, longitude=18.9553, house_system="whole_sign",
)
print(f"OK  Tromsø Whole Sign: {len(ws['houses'])} houses")
ok += 2

print(f"\n{ok}/{ok} checks passed")
