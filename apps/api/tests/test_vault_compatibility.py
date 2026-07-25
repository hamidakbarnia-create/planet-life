"""Provider Compatibility — synastry dimensions + relationship weighting."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import compatibility_reading  # noqa: E402
from packages.astro_engine.vault_templates import render_compatibility_reading  # noqa: E402

_BASE = dict(
    birth_date="1990-06-15",
    birth_time="14:30",
    location="51.5074,-0.1278",
    lang="en",
    partner_birth_date="1988-03-20",
    partner_birth_time="09:15",
    partner_location="40.7128,-74.0060",
)


def test_changing_second_person_changes_results():
    a = compatibility_reading(**_BASE, relationship_type="romantic")
    b = compatibility_reading(
        **{
            **_BASE,
            "partner_birth_date": "1995-11-02",
            "partner_birth_time": "18:45",
            "partner_location": "35.6762,139.6503",
        },
        relationship_type="romantic",
    )
    assert a["overall_score"] is not None and b["overall_score"] is not None
    assert (
        a["overall_score"] != b["overall_score"]
        or a["strengths"] != b["strengths"]
        or a["friction_points"] != b["friction_points"]
        or a["dimensions"] != b["dimensions"]
    )


def test_relationship_type_changes_weighting():
    romantic = compatibility_reading(**_BASE, relationship_type="romantic")
    business = compatibility_reading(**_BASE, relationship_type="business")
    assert romantic["profile_key"] == "romantic_partner"
    assert business["profile_key"] == "business_partner"
    assert (
        romantic["overall_score"] != business["overall_score"]
        or romantic["dimensions"]["chemistry"] != business["dimensions"]["chemistry"]
        or romantic["dimensions"]["stability"] != business["dimensions"]["stability"]
    )


def test_harmony_and_tension_can_appear():
    payload = compatibility_reading(**_BASE, relationship_type="marriage")
    assert payload["harmony_count"] >= 0
    assert payload["tension_count"] >= 0
    # At least one side should surface in strengths/friction text paths.
    assert payload["strengths"]
    assert payload["friction_points"]
    bands = {d.get("band") for d in payload["dimensions"].values()}
    assert bands & {"harmony", "tension", "mixed", "unknown"}


def test_missing_birth_time_lowers_confidence():
    exact = compatibility_reading(
        **_BASE,
        relationship_type="romantic",
        user_birth_time_known=True,
        partner_birth_time_known=True,
    )
    unknown = compatibility_reading(
        **_BASE,
        relationship_type="romantic",
        user_birth_time_known=False,
        partner_birth_time_known=False,
    )
    assert exact["reading"]["confidence"] in {"high", "medium", "low"}
    assert unknown["reading"]["confidence"] == "low"
    assert "exact_birth_time" in unknown["missing_inputs"]
    assert "house" in (unknown["reading"]["executive"] + unknown["reading"].get("explanation", "")).lower() or \
        "birth time" in unknown["reading"]["executive"].lower()


def test_localized_output_exists():
    for lang in ("en", "fa", "ar", "ru"):
        payload = compatibility_reading(**{**_BASE, "lang": lang}, relationship_type="friendship")
        assert payload["reading"]["executive"]
        assert payload["reading"]["strategic"]
        assert payload["reading"]["technical"]
        reading = render_compatibility_reading(
            lang=lang,
            relationship_type="friendship",
            dimensions=payload["dimensions"],
            strengths=payload["strengths"],
            friction_points=payload["friction_points"],
            verify_questions=payload["verify_questions"],
            confidence=payload["reading"]["confidence"],
            overall_score=payload["overall_score"],
        )
        assert reading["executive"]
        assert "relationship_profile" in reading["technical"]


def test_missing_partner_no_invented_scores():
    payload = compatibility_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        relationship_type="romantic",
    )
    assert payload["overall_score"] is None
    assert payload["dimensions"] == {}
    assert "partner_birth_date" in payload["missing_inputs"]
    assert payload["reading"]["confidence"] == "low"
