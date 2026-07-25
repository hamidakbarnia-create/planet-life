"""Provider Business Geography — Pathfinder business blend + reading shape."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import business_geography_reading  # noqa: E402
from packages.astro_engine.vault_templates import (  # noqa: E402
    render_business_geography_reading,
)


def test_render_business_geography_missing_shortlist():
    reading = render_business_geography_reading(
        [],
        goal="expansion",
        lang="en",
        missing_inputs=["locations"],
    )
    assert reading["confidence"] == "low"
    assert reading["missing_inputs"] == ["locations"]
    assert reading["ranked"] == []
    assert "pathfinder.relocation" in reading["technical"]
    assert "mode=business" in reading["technical"]


def test_render_business_geography_ranked_en():
    reading = render_business_geography_reading(
        [
            {
                "label": "Dubai",
                "score": 80,
                "strongest_use_case": "wealth",
                "opportunity": "jupiter on MC",
                "commercial_risk": "saturn in house 12",
                "recommended_next_action": "Prioritize Dubai for expansion market work",
            },
            {
                "label": "London",
                "score": 62,
                "strongest_use_case": "career",
                "opportunity": "sun on ASC",
                "commercial_risk": "sig_quiet",
            },
        ],
        goal="expansion",
        lang="en",
    )
    assert reading["intensity"] == "strong"
    assert reading["confidence"] == "high"
    assert "Dubai" in reading["executive"]
    assert "Commercial risk:" in reading["executive"]
    assert "Strongest business use:" in reading["executive"]
    assert "jupiter" in reading["technical"]
    assert "houses=2,6,10,11" in reading["technical"]


def test_render_business_geography_langs():
    sample = [
        {
            "label": "Tokyo",
            "score": 66,
            "strongest_use_case": "community",
            "opportunity": "mercury on DC",
            "commercial_risk": "sig_strain",
        }
    ]
    for lang in ("en", "fa", "ar", "ru"):
        reading = render_business_geography_reading(
            sample, goal="networking", lang=lang
        )
        assert reading["executive"]
        assert reading["strategic"]
        assert reading["confidence"] == "medium"


def test_business_geography_missing_locations_no_invented_ranks():
    payload = business_geography_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        goal="investment",
        locations=[],
    )
    assert payload["planet"] == "jupiter"
    assert payload["ranked"] == []
    assert "locations" in payload["missing_inputs"]
    assert payload["reading"]["confidence"] == "low"
    assert payload["verdict"]["signals"] == ["jupiter", "mercury", "sun", "saturn"]
    assert payload["verdict"]["houses"] == [2, 6, 10, 11]


def test_business_geography_ranks_shortlist():
    payload = business_geography_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        goal="sales",
        locations=[
            "London|51.5074,-0.1278",
            "Dubai|25.2048,55.2708",
            "New York|40.7128,-74.0060",
        ],
        current_location="Tehran|35.6892,51.3890",
    )
    assert payload["planet"] == "jupiter"
    assert payload["goal"] == "sales"
    assert set(payload["goal_areas"]) == {"wealth", "community"}
    assert len(payload["ranked"]) >= 3
    scores = [int(r["score"]) for r in payload["ranked"]]
    assert scores == sorted(scores, reverse=True)
    top = payload["ranked"][0]
    for key in (
        "label",
        "score",
        "strongest_use_case",
        "opportunity",
        "commercial_risk",
        "recommended_next_action",
        "confidence",
    ):
        assert key in top
    assert top["strongest_use_case"] in {"wealth", "career", "community"}
    for key in ("executive", "strategic", "technical", "confidence", "explanation"):
        assert key in payload["reading"]
    assert "mode=business" in payload["reading"]["technical"]
    assert "Commercial risk:" in payload["reading"]["executive"]
