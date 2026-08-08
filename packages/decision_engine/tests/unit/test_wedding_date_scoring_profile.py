"""Wedding action_type must use ceremony scoring, not negotiation/default."""

from packages.astro_engine.scoring import (
    ACTIVITY_PROFILES,
    TRANSIT_HOUSE_RULES,
    _resolve_profile,
    _transit_house_rules_key,
)


def test_wedding_date_is_first_class_profile_not_negotiation_alias():
    profile = _resolve_profile("wedding_date")
    negotiation = ACTIVITY_PROFILES["negotiation"]

    assert profile is ACTIVITY_PROFILES["wedding_date"]
    assert profile is not negotiation
    assert profile.label == "Wedding Date"
    assert profile.primary_planets == ("venus", "moon", "jupiter")
    assert profile.supportive_houses == (7, 5, 4, 9)
    assert "mutually beneficial terms" not in profile.executive_focus
    assert "communication, rapport" not in profile.executive_focus


def test_wedding_date_transit_rules_are_not_default_or_negotiation():
    key = _transit_house_rules_key("wedding_date")
    assert key == "wedding_date"
    assert key != "default"
    assert key != "negotiation"

    rules = TRANSIT_HOUSE_RULES["wedding_date"]
    default = TRANSIT_HOUSE_RULES["default"]
    negotiation = TRANSIT_HOUSE_RULES["negotiation"]

    assert rules["positive"] != default["positive"]
    assert rules["positive"] != negotiation["positive"]
    # Ceremony focus: partnership/celebration/home/ritual, not career houses.
    assert 7 in rules["positive"]
    assert 5 in rules["positive"]
    assert 10 not in rules["positive"]
