"""
Location-aware scoring audit — Phase 1+2 verification.
Run: apps\\api\\.venv\\Scripts\\python.exe scripts/scoring_location_audit.py
"""
from __future__ import annotations

import sys
from datetime import date

sys.path.insert(0, r"C:\planet-life\apps\api\src")
sys.path.insert(0, r"C:\planet-life")

from packages.astro_engine.scoring_context import CONTEXT_CALENDAR_DAY, CONTEXT_CALENDAR_HOURLY
from services.scoring_pipeline import score_with_context

BIRTH_DATE = "1982-02-25"
BIRTH_TIME = "05:47"
BIRTH_LOCATION = "Rafsanjan"
BIRTH_LAT = 30.4067
BIRTH_LON = 56.0039
TARGET_DATE = date.today().isoformat()
ACTION = "business_launch"

EVAL_CITIES = {
    "Rafsanjan": (30.4067, 56.0039, "Rafsanjan"),
    "London": (51.5074, -0.1278, "London, United Kingdom"),
    "Sydney": (-33.8688, 151.2093, "Sydney, Australia"),
    "Los Angeles": (34.0522, -118.2437, "Los Angeles, United States"),
}


def hourly_best_worst(birth_date, birth_time, location, lat, lon, eval_label, eval_lat, eval_lon):
    scores = []
    for h in range(24):
        result, _, _ = score_with_context(
            birth_date=birth_date,
            birth_time=birth_time,
            location=location,
            latitude=lat,
            longitude=lon,
            target_date=TARGET_DATE,
            target_time=f"{h:02d}:00",
            action_type=ACTION,
            context=CONTEXT_CALENDAR_HOURLY,
            evaluation_location=eval_label,
            evaluation_latitude=eval_lat,
            evaluation_longitude=eval_lon,
        )
        scores.append((h, result["executive"]["score"]))
    best = max(scores, key=lambda x: x[1])
    worst = min(scores, key=lambda x: x[1])
    return best, worst


def _debug_line(bd: dict) -> str:
    return (
        f"  debug: local={bd.get('resolved_local_datetime')} "
        f"utc={bd.get('resolved_utc_datetime')} "
        f"tz={bd.get('timezone')} mode={bd.get('location_mode')} "
        f"for={bd.get('calculated_for')}"
    )


def main():
    print("=" * 110)
    print("LOCATION-AWARE SCORING AUDIT (Calendar day @ 12:00 local, Phase 2 hardened)")
    print(f"Birth: {BIRTH_LOCATION} | Date: {TARGET_DATE} | Action: {ACTION}")
    print("=" * 110)
    header = (
        f"{'Location':<14} {'Eval lat,lon':<22} {'Transit ASC':<12} {'Transit MC':<12} "
        f"{'Moon h':<7} {'Sun h':<7} {'Loc score':<10} {'Final':<6}"
    )
    print(header)
    print("-" * len(header))

    rows = []
    natal_sun_houses: dict[str, int] = {}
    for label, (lat, lon, eval_label) in EVAL_CITIES.items():
        result, natal, transit = score_with_context(
            birth_date=BIRTH_DATE,
            birth_time=BIRTH_TIME,
            location=BIRTH_LOCATION,
            latitude=BIRTH_LAT,
            longitude=BIRTH_LON,
            target_date=TARGET_DATE,
            target_time=None,
            action_type=ACTION,
            context=CONTEXT_CALENDAR_DAY,
            evaluation_location=eval_label,
            evaluation_latitude=lat,
            evaluation_longitude=lon,
        )
        bd = result["strategic"]["component_breakdown"]
        planets = transit.get("planets", {})
        best, worst = hourly_best_worst(
            BIRTH_DATE, BIRTH_TIME, BIRTH_LOCATION, BIRTH_LAT, BIRTH_LON,
            eval_label, lat, lon,
        )
        loc_score = bd["location_component_score"]
        row = {
            "label": label,
            "lat": lat,
            "lon": lon,
            "asc": transit.get("ascendant"),
            "mc": transit.get("midheaven"),
            "moon_h": planets.get("moon", {}).get("house"),
            "sun_h": planets.get("sun", {}).get("house"),
            "th": bd["transit_house_score"],
            "ang": bd["transit_angular_score"],
            "loc_score": loc_score,
            "final": bd["final_score"],
            "best_hour": best,
            "worst_hour": worst,
            "bd": bd,
        }
        rows.append(row)
        natal_sun_houses[label] = natal["planets"]["sun"]["house"]
        print(
            f"{label:<14} {lat:>6.2f},{lon:>7.2f}   "
            f"{row['asc']!s:<12} {row['mc']!s:<12} "
            f"{row['moon_h']!s:<7} {row['sun_h']!s:<7} "
            f"{loc_score!s:<10} {row['final']!s:<6}"
        )
        print(_debug_line(bd))
        print(
            f"  components: aspects={bd['aspect_score']} "
            f"house={bd['transit_house_score']} angular={bd['transit_angular_score']} "
            f"natal_house={bd['natal_house_bonus']} retro={bd['retrograde_penalty']}"
        )
        print(
            f"  hourly: best={best[0]:02d}:00({best[1]}) worst={worst[0]:02d}:00({worst[1]})"
        )

    finals = [r["final"] for r in rows]
    loc_scores = [r["loc_score"] for r in rows]
    print("-" * len(header))
    print(f"Final score spread: {min(finals)} - {max(finals)} = {max(finals) - min(finals)} points")
    print(
        f"Location component spread: {min(loc_scores):.2f} - {max(loc_scores):.2f} "
        f"(= transit_house + transit_angular)"
    )

    if len(set(natal_sun_houses.values())) == 1:
        print("Natal sun house unchanged across evaluation cities (expected).")

    paired = [
        ("London", "Los Angeles"),
        ("Rafsanjan", "Sydney"),
    ]
    for a, b in paired:
        ra, rb = next(r for r in rows if r["label"] == a), next(r for r in rows if r["label"] == b)
        if ra["sun_h"] == rb["sun_h"] and ra["moon_h"] == rb["moon_h"]:
            delta = abs(ra["loc_score"] - rb["loc_score"])
            print(
                f"Paired {a}/{b}: same Sun/Moon houses -> location scores "
                f"{ra['loc_score']} vs {rb['loc_score']} (delta={delta:.2f}, acceptable)"
            )

    print("=" * 110)


if __name__ == "__main__":
    main()
