"""
Pathfinder relocation divergence + audit test.

Why this exists
---------------
Julia's bar: errors must trend to zero, and different cities MUST give
different, defensible results. Earlier the engine returned a near-flat ~50 for
every city, which is itself an error. This test encodes the methodology spec's
acceptance criteria so the "all cities look the same" regression can never
return silently, and prints an auditable table you can cross-check line-by-line
against astro-seek.com relocation charts and geocult.ru.

Acceptance criteria (from the scoring spec):
  1. At least 4 life areas differ by >= 8 points across the four sample cities.
  2. At least 2 cities land in different verdict bands for at least 2 areas.

Run from repo root:
    py -3.11 -m pytest apps/api/tests/test_pathfinder_divergence.py -v
Or just print the audit table:
    py -3.11 apps/api/tests/test_pathfinder_divergence.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Make both `services.*` (apps/api/src) and `packages.*` (repo root) importable
# without installing, mirroring how the API process resolves them.
HERE = Path(__file__).resolve()
SRC = HERE.parents[1] / "src"
REPO_ROOT = HERE.parents[3]
for p in (str(SRC), str(REPO_ROOT)):
    if p not in sys.path:
        sys.path.insert(0, p)

from services.pathfinder import relocation_reading  # noqa: E402

# A fixed sample chart so the test is deterministic. Birth time known.
SAMPLE = {
    "birth_date": "1990-08-25",
    "birth_time": "14:30",
    "birth_location": "35.70,51.42",  # Tehran
}

# lat,lon passed straight through (no network geocoding in tests).
CITIES = {
    "Tehran": "35.70,51.42",
    "London": "51.51,-0.13",
    "Dubai": "25.20,55.27",
    "Omsk": "54.99,73.37",
}


def _band(score: int) -> str:
    if score >= 80:
        return "Strong+"
    if score >= 65:
        return "Supportive"
    if score >= 45:
        return "Mixed"
    if score >= 25:
        return "Caution"
    return "Avoid"


def _backend_verdict(score: int) -> str:
    if score >= 65:
        return "positive"
    if score <= 44:
        return "challenging"
    return "mixed"


def _read_all() -> dict[str, dict[str, dict]]:
    """Return {city: {area: effect}} for the sample chart."""
    out: dict[str, dict[str, dict]] = {}
    for city, loc in CITIES.items():
        reading = relocation_reading(
            birth_date=SAMPLE["birth_date"],
            birth_time=SAMPLE["birth_time"],
            birth_location=SAMPLE["birth_location"],
            target_location=loc,
            target_label=city,
        )
        out[city] = {e["area"]: e for e in reading["effects"]}
    return out


def test_areas_diverge_across_cities() -> None:
    data = _read_all()
    areas = sorted({a for city in data.values() for a in city})
    diverging = 0
    for area in areas:
        scores = [data[city][area]["score"] for city in CITIES]
        if max(scores) - min(scores) >= 8:
            diverging += 1
    assert diverging >= 4, (
        f"Only {diverging} areas diverge by >=8 pts across cities; "
        "cities are too similar (tighten orbs/weights)."
    )


def test_cities_land_in_different_bands() -> None:
    data = _read_all()
    areas = sorted({a for city in data.values() for a in city})
    areas_with_band_split = 0
    for area in areas:
        bands = {_band(data[city][area]["score"]) for city in CITIES}
        if len(bands) >= 2:
            areas_with_band_split += 1
    assert areas_with_band_split >= 2, (
        f"Only {areas_with_band_split} areas show a verdict-band split; "
        "expected >=2."
    )


def test_every_effect_has_a_concrete_reason() -> None:
    """Neutral rule: no card may be blank filler — each carries a reason."""
    data = _read_all()
    for city, areas in data.items():
        for area, effect in areas.items():
            assert effect.get("reasons"), f"{city}/{area} has no reason token"


def test_backend_verdict_matches_score_band() -> None:
    """The API verdict must not contradict the visible score band."""
    data = _read_all()
    for city, areas in data.items():
        for area, effect in areas.items():
            expected = _backend_verdict(effect["score"])
            assert effect["verdict"] == expected, (
                f"{city}/{area} score {effect['score']} should be {expected}, "
                f"got {effect['verdict']}"
            )


def _print_audit() -> None:
    data = _read_all()
    areas = sorted({a for city in data.values() for a in city})
    col_w = 16
    header = "area".ljust(col_w) + "".join(c.ljust(col_w) for c in CITIES)
    print("\n" + header)
    print("-" * len(header))
    for area in areas:
        row = area.ljust(col_w)
        for city in CITIES:
            e = data[city][area]
            row += f"{e['score']:>3} {_band(e['score'])[:9]}".ljust(col_w)
        print(row)
    print("\nReason audit (top driver per city/area):")
    for city in CITIES:
        print(f"\n{city}:")
        for area in areas:
            e = data[city][area]
            r = (e.get("reasons") or [{}])[0]
            print(
                f"  {area:<14} {e['score']:>3} {e['verdict']:<11} "
                f"{r.get('code','-'):<22} {r.get('planet','-')}/{r.get('angle') or r.get('house') or '-'}"
            )


if __name__ == "__main__":
    _print_audit()
