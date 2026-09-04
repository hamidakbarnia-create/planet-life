"""offer_negotiation must resolve to negotiation by name, not by fallback.

DEFAULT_ACTIVITY is itself "negotiation", so profile identity cannot prove
the mapping is deliberate. Both resolution paths are therefore pinned:
the alias is asserted to exist explicitly, and the transit-house-rules key
is asserted to be "negotiation" rather than the "default" bucket an
unmapped action_type would receive.
"""

import inspect

from packages.astro_engine.scoring import (
    ACTIVITY_PROFILES,
    DEFAULT_ACTIVITY,
    TRANSIT_HOUSE_RULES,
    _resolve_profile,
    _transit_house_rules_key,
)
from packages.decision_engine.evaluate.offer_negotiation_evaluate import (
    OFFER_NEGOTIATION_ACTION_TYPE,
)

ACTION = OFFER_NEGOTIATION_ACTION_TYPE


def test_action_type_is_the_canonical_identifier():
    assert ACTION == "offer_negotiation"


def test_offer_negotiation_resolves_to_the_negotiation_profile():
    profile = _resolve_profile(ACTION)
    assert profile is ACTIVITY_PROFILES["negotiation"]
    assert profile.label == "Negotiation"


def test_alias_is_declared_explicitly_not_reached_by_default():
    """DEFAULT_ACTIVITY == "negotiation", so only the alias proves intent."""
    assert DEFAULT_ACTIVITY == "negotiation"
    source = inspect.getsource(_resolve_profile)
    assert '"offer_negotiation": "negotiation"' in source


def test_offer_negotiation_transit_rules_resolve_to_negotiation():
    key = _transit_house_rules_key(ACTION)
    assert key == "negotiation"
    # An unmapped action_type lands in "default"; this one must not.
    assert key != "default"
    assert _transit_house_rules_key("offer_negotiation_typo") == "default"
    assert TRANSIT_HOUSE_RULES[key] is TRANSIT_HOUSE_RULES["negotiation"]
    assert TRANSIT_HOUSE_RULES[key] != TRANSIT_HOUSE_RULES["default"]


def test_both_resolution_paths_agree_for_offer_negotiation():
    """Profile lookup and house-rule lookup must name the same activity."""
    rules_key = _transit_house_rules_key(ACTION)
    assert _resolve_profile(ACTION) is ACTIVITY_PROFILES[rules_key]
    assert _resolve_profile(ACTION) is _resolve_profile("negotiation")
    assert rules_key == _transit_house_rules_key("negotiation")


def test_existing_action_types_are_unchanged():
    assert _resolve_profile("job_interview") is ACTIVITY_PROFILES["negotiation"]
    assert _transit_house_rules_key("job_interview") == "default"
    assert _resolve_profile("investor_meeting") is ACTIVITY_PROFILES[
        "negotiation"
    ]
    assert _transit_house_rules_key("investor_meeting") == "default"
    assert _resolve_profile("wedding_date") is ACTIVITY_PROFILES["wedding_date"]
    assert _transit_house_rules_key("wedding_date") == "wedding_date"
    assert _resolve_profile("business_launch") is ACTIVITY_PROFILES[
        "business_launch"
    ]
    assert _transit_house_rules_key("business_launch") == "business_launch"
