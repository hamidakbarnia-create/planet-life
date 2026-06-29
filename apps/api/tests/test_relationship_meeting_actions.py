"""Tests for relationship meeting action scoring aliases."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, r"C:\planet-life")

from packages.astro_engine.scoring import _resolve_profile  # noqa: E402


def test_romantic_meeting_alias_resolves():
    profile = _resolve_profile("romantic_meeting")
    assert profile.label == "Networking & PR"


def test_shared_life_planning_alias_resolves():
    profile = _resolve_profile("shared_life_planning")
    assert profile.label == "Real Estate"


def test_investor_pitch_alias_resolves():
    profile = _resolve_profile("investor_pitch")
    assert profile.label == "Investment"


def test_cofounder_planning_alias_resolves():
    profile = _resolve_profile("cofounder_planning")
    assert profile.label == "Business Launch"
