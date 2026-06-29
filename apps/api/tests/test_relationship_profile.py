"""Tests for relationship intelligence profiles."""

from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, r"C:\planet-life")

from packages.astro_engine.relationship_profile import (  # noqa: E402
    RELATIONSHIP_PROFILES,
    resolve_relationship_profile,
)


def test_all_twelve_profiles_exist():
    expected = {
        "spouse",
        "romantic_partner",
        "business_partner",
        "cofounder",
        "employee",
        "employer",
        "friend",
        "family",
        "parent_child",
        "mentor",
        "investor",
        "client",
    }
    assert set(RELATIONSHIP_PROFILES.keys()) == expected


def test_profile_has_required_fields():
    profile = RELATIONSHIP_PROFILES["mentor"]
    assert profile.weighted_planets["jupiter"] > profile.weighted_planets["mercury"]
    assert profile.insight_sections
    assert profile.recommendation_templates.aligned
    assert profile.meeting_action_type == "networking"


def test_romantic_profiles_use_semantic_meeting_actions():
    spouse = RELATIONSHIP_PROFILES["spouse"]
    romantic = RELATIONSHIP_PROFILES["romantic_partner"]
    assert spouse.preferred_meeting_action_type == "shared_life_planning"
    assert spouse.fallback_meeting_action_type == "relationship_repair"
    assert romantic.preferred_meeting_action_type == "romantic_meeting"
    assert spouse.preferred_meeting_action_type != "negotiation"
    assert romantic.preferred_meeting_action_type != "negotiation"


def test_legacy_rival_alias():
    assert resolve_relationship_profile("rival").key == "business_partner"


def test_unknown_profile_raises():
    with pytest.raises(ValueError, match="Unknown relationship profile"):
        resolve_relationship_profile("unknown")


def test_missing_profile_raises():
    with pytest.raises(ValueError, match="Relationship type is required"):
        resolve_relationship_profile(None)
