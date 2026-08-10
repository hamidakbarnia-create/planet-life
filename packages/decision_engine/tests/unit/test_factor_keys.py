"""Unit tests for deterministic Package driver factor_key builder."""

from __future__ import annotations

from packages.decision_engine.evaluate.factor_keys import (
    build_factor_key,
    normalize_factor_token,
)
from packages.decision_engine.evaluate.driver_assembly import (
    map_evidence_reference_to_driver,
)
from packages.decision_engine.models import EvidenceReference


def test_normalize_factor_token_stable() -> None:
    assert normalize_factor_token("Mercury") == "mercury"
    assert normalize_factor_token("birthOnly") == "birthonly"
    assert normalize_factor_token("event-location") == "event_location"
    assert normalize_factor_token(10) == "10"
    assert normalize_factor_token(None) is None
    assert normalize_factor_token("") is None
    assert normalize_factor_token(True) is None


def test_aspect_key() -> None:
    assert (
        build_factor_key(
            {
                "transit_planet": "Mercury",
                "natal_planet": "Saturn",
                "aspect": "square",
                "orb": 1.2,
                "contribution": -3.5,
            },
            "aspect",
        )
        == "aspect.mercury.square.saturn"
    )


def test_house_natal_and_transit_keys() -> None:
    assert (
        build_factor_key(
            {"scope": "natal", "planet": "mercury", "house": 10},
            "house",
        )
        == "house.natal.mercury.10"
    )
    assert (
        build_factor_key(
            {
                "scope": "transit",
                "planet": "mercury",
                "house": 12,
                "retrograde": True,
            },
            "house",
        )
        == "house.transit.mercury.12.retrograde"
    )
    assert (
        build_factor_key(
            {"scope": "transit", "planet": "jupiter", "house": 10},
            "house",
        )
        == "house.transit.jupiter.10"
    )


def test_angular_and_retrograde_keys() -> None:
    assert (
        build_factor_key({"planet": "Sun", "angle": "MC"}, "angular")
        == "angular.sun.mc"
    )
    assert (
        build_factor_key(
            {"planet": "mercury", "retrograde": True, "primary_ruler": True},
            "retrograde",
        )
        == "retrograde.mercury"
    )


def test_electional_location_mode_key_not_timing_note() -> None:
    assert (
        build_factor_key(
            {
                "location_mode": "eventLocation",
                "calculated_for": "Tehran",
                "timezone": "Asia/Tehran",
            },
            "electional_timing",
        )
        == "electional.location_mode.eventlocation"
    )
    assert (
        build_factor_key(
            {"timing_note": "Mercury retrograde reduces direct launch."},
            "electional_timing",
        )
        is None
    )


def test_unknown_or_malformed_returns_none() -> None:
    assert build_factor_key(None, "aspect") is None
    assert build_factor_key({}, "aspect") is None
    assert build_factor_key({"transit_planet": "mercury"}, "aspect") is None
    assert (
        build_factor_key(
            {
                "transit_planet": "mercury",
                "natal_planet": "saturn",
                "aspect": "not-an-aspect",
            },
            "aspect",
        )
        is None
    )
    assert build_factor_key({"planet": "mercury", "house": 10}, "house") is None
    assert build_factor_key({"planet": "mercury", "angle": "vertex"}, "angular") is None
    assert build_factor_key({"planet": "mercury"}, "unknown_family") is None
    # Title prose must never be used.
    assert (
        build_factor_key(
            {"title": "Transit Mercury square natal Saturn"},
            "aspect",
        )
        is None
    )


def test_driver_assembly_attaches_optional_factor_key() -> None:
    with_key = map_evidence_reference_to_driver(
        EvidenceReference(
            title="Transit Mercury square natal Saturn",
            detail="Pressure on communication.",
            importance="high",
            score=-3.5,
            category="aspect",
            evidence={
                "transit_planet": "mercury",
                "natal_planet": "saturn",
                "aspect": "square",
            },
        ),
        index=0,
    )
    assert with_key["factor_key"] == "aspect.mercury.square.saturn"
    assert with_key["contribution"] == -3.5
    assert with_key["polarity"] == "cautionary"

    without = map_evidence_reference_to_driver(
        EvidenceReference(
            title="Timing note",
            detail="Free text note.",
            score=-0.5,
            category="electional_timing",
            evidence={"timing_note": "Watch the weather."},
        ),
        index=1,
    )
    assert "factor_key" not in without


def test_factor_key_does_not_alter_contribution_or_polarity() -> None:
    ref = EvidenceReference(
        title="Transit Jupiter trine natal Sun",
        detail="Support",
        score=4.0,
        category="aspect",
        evidence={
            "transit_planet": "jupiter",
            "natal_planet": "sun",
            "aspect": "trine",
        },
    )
    driver = map_evidence_reference_to_driver(ref, index=0)
    assert driver["contribution"] == 4.0
    assert driver["polarity"] == "supportive"
    assert driver["score"] == 4.0
    assert driver["band"] == "high"
    assert driver["factor_key"] == "aspect.jupiter.trine.sun"
