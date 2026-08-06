"""Provider Partner Profile — ideal natal sketch + optional synastry."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.vault_readings import partner_profile_reading  # noqa: E402
from packages.astro_engine.vault_templates import render_partner_profile_reading  # noqa: E402


def test_render_partner_profile_ideal_only():
    reading = render_partner_profile_reading(
        mode="ideal_only",
        goal="romantic",
        lang="en",
        ideal_traits=["Affection style tends toward Venus in Leo tone"],
        compatibility_patterns=["ideal-partner tendencies only (no second chart)"],
        friction_points=["Unverified until lived behaviour matches the sketch"],
        dynamics={
            "financial": "Money tone tendency",
            "emotional": "Care language",
            "practical": "Pace matters",
        },
        verify_questions=["How do they show care when stressed?"],
        missing_inputs=["partner_birth_date", "partner_birth_time", "partner_location"],
        confidence="medium",
    )
    assert reading["mode"] == "ideal_only"
    assert "Tendencies, not verified facts" in reading["executive"]
    assert "loyalty" in reading["executive"].lower() or "destiny" in reading["executive"].lower()
    assert "partner_birth_date" in reading["missing_inputs"]
    assert reading["action"]


def test_render_partner_profile_langs():
    for lang in ("en", "fa", "ar", "ru"):
        reading = render_partner_profile_reading(
            mode="ideal_only",
            goal="marriage",
            lang=lang,
            ideal_traits=["trait"],
            verify_questions=["q1"],
            confidence="medium",
        )
        assert reading["executive"]
        assert reading["strategic"]


def test_partner_profile_ideal_only_no_second_person():
    payload = partner_profile_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        goal="romantic",
    )
    assert payload["planet"] == "partner"
    assert payload["mode"] == "ideal_only"
    assert payload["synastry_score"] is None
    assert "partner_birth_date" in payload["missing_inputs"]
    assert payload["ideal_traits"]
    assert payload["verify_questions"]
    assert payload["dynamics"]["financial"]
    assert payload["dynamics"]["emotional"]
    assert payload["dynamics"]["practical"]
    assert "relationship_profile" in payload["reading"]["technical"]
    # Must not claim a specific person is loyal/wealthy/dishonest/destined.
    blob = (payload["reading"]["executive"] + payload["reading"]["strategic"]).lower()
    assert "destined" not in blob
    assert "dishonest" not in blob
    assert "is loyal" not in blob
    assert "is wealthy" not in blob


def test_partner_profile_synastry_when_partner_present():
    payload = partner_profile_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        goal="marriage",
        partner_birth_date="1988-03-20",
        partner_birth_time="09:15",
        partner_location="40.7128,-74.0060",
        partner_relationship="spouse",
    )
    assert payload["mode"] == "synastry"
    assert payload["profile_key"] == "spouse"
    assert payload["missing_inputs"] == []
    assert isinstance(payload["synastry_score"], int)
    assert 0 <= payload["synastry_score"] <= 100
    assert payload["compatibility_patterns"]
    assert payload["friction_points"]
    assert payload["reading"]["confidence"] in {"high", "medium", "low"}
    assert "Synastry score" in payload["reading"]["executive"]
    assert "Verify:" in payload["reading"]["executive"]


def test_partner_profile_business_goal_maps_profile():
    payload = partner_profile_reading(
        birth_date="1990-06-15",
        birth_time="14:30",
        location="51.5074,-0.1278",
        lang="en",
        goal="financial_support",
    )
    assert payload["goal"] == "financial_support"
    assert payload["profile_key"] == "investor"
    assert payload["mode"] == "ideal_only"
