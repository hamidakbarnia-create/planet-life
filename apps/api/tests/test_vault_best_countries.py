"""Provider Best Countries — Pathfinder relocation ranking + reading shape."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import best_countries_reading  # noqa: E402
from packages.astro_engine.vault_templates import render_best_countries_reading  # noqa: E402


def test_render_best_countries_missing_shortlist():
    reading = render_best_countries_reading(
        [],
        goal="wealth",
        lang="en",
        missing_inputs=["locations"],
    )
    assert reading["confidence"] == "low"
    assert reading["missing_inputs"] == ["locations"]
    assert reading["ranked"] == []
    assert "Shortlist" in reading["headline"] or "shortlist" in reading["executive"].lower()
    assert "pathfinder.relocation" in reading["technical"]


def test_render_best_countries_ranked_en():
    reading = render_best_countries_reading(
        [
            {
                "label": "Dubai",
                "score": 78,
                "strongest_use_case": "wealth",
                "opportunity": "jupiter on MC",
                "risk": "saturn in house 12",
                "recommended_next_action": "Prioritize Dubai for wealth fieldwork",
            },
            {
                "label": "London",
                "score": 61,
                "strongest_use_case": "career",
                "opportunity": "sun on ASC",
                "risk": "sig_quiet",
            },
        ],
        goal="wealth",
        lang="en",
    )
    assert reading["intensity"] == "strong"
    assert reading["confidence"] == "high"
    assert "Dubai" in reading["executive"]
    assert "Opportunity:" in reading["executive"]
    assert "Risk:" in reading["executive"]
    assert "Dubai" in reading["strategic"]
    assert reading["action"]


def test_render_best_countries_langs():
    sample = [
        {
            "label": "Tokyo",
            "score": 66,
            "strongest_use_case": "career",
            "opportunity": "sun on MC",
            "risk": "sig_strain",
        }
    ]
    for lang in ("en", "fa", "ar", "ru"):
        reading = render_best_countries_reading(sample, goal="visibility", lang=lang)
        assert reading["executive"]
        assert reading["strategic"]
        assert reading["confidence"] == "medium"


def test_best_countries_missing_locations_no_invented_ranks():
    payload = best_countries_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        goal="wealth",
        locations=[],
    )
    assert payload["planet"] == "countries"
    assert payload["ranked"] == []
    assert "locations" in payload["missing_inputs"]
    assert payload["reading"]["confidence"] == "low"
    assert payload["reading"]["ranked"] == []


def test_best_countries_reading_ranks_shortlist():
    # Explicit lat,lon avoids Nominatim in CI/sandbox.
    payload = best_countries_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        goal="relationship",
        locations=[
            "London|51.5074,-0.1278",
            "Dubai|25.2048,55.2708",
            "New York|40.7128,-74.0060",
        ],
        current_location="Tehran|35.6892,51.3890",
    )
    assert payload["planet"] == "countries"
    assert payload["goal"] == "relationship"
    assert payload["goal_area"] == "love"
    assert len(payload["ranked"]) >= 3
    scores = [int(r["score"]) for r in payload["ranked"]]
    assert scores == sorted(scores, reverse=True)
    top = payload["ranked"][0]
    for key in (
        "label",
        "score",
        "strongest_use_case",
        "opportunity",
        "risk",
        "recommended_next_action",
        "confidence",
    ):
        assert key in top
    for key in ("executive", "strategic", "technical", "confidence", "explanation"):
        assert key in payload["reading"]
    assert "pathfinder.relocation" in payload["reading"]["technical"]
