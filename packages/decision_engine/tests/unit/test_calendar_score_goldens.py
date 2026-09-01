"""Golden regression for Calendar scoring — engine output is the authority."""

from __future__ import annotations

import json
from pathlib import Path

from packages.astro_engine.reasoning import build_reasoning
from packages.astro_engine.scoring import calculate_activity_score
from packages.astro_engine.scoring_context import ScoringContext
from packages.decision_engine.day_intelligence_models import (
    build_day_intelligence_snapshot,
)
from packages.decision_engine.evidence import dominant_evaluated_aspects
from packages.decision_engine.tests.fixtures.calendar_score_cases import CASE_BUILDERS
from packages.decision_engine.tests.fixtures.generate_calendar_score_goldens import (
    GOLDEN_DIR,
    _json_safe_context,
)

REQUIRED_GOLDEN_IDS = {
    "strongly_supportive",
    "strongly_adverse",
    "mixed_conflicting",
    "close_exact_aspect",
    "loose_aspect",
    "angular_contact",
    "retrograde_penalty",
    "action_type_business_launch",
    "action_type_rest_recovery",
    "natal_personalization_a",
    "natal_personalization_b",
    "evaluation_location_london",
    "evaluation_location_sydney",
}


def _load_goldens() -> dict[str, dict]:
    goldens = {}
    for path in GOLDEN_DIR.glob("*.json"):
        payload = json.loads(path.read_text())
        goldens[payload["id"]] = payload
    return goldens


def _context_from_golden(raw: dict) -> ScoringContext:
    return ScoringContext(
        location_mode=raw["location_mode"],
        include_natal_house_bonus=raw["include_natal_house_bonus"],
        include_transit_house_score=raw["include_transit_house_score"],
        include_transit_angular_score=raw["include_transit_angular_score"],
        default_transit_time=raw.get("default_transit_time"),
    )


def test_required_golden_ids_are_present() -> None:
    assert set(_load_goldens()) == REQUIRED_GOLDEN_IDS
    assert {builder()["id"] for builder in CASE_BUILDERS} == REQUIRED_GOLDEN_IDS


def test_goldens_match_live_engine_output() -> None:
    goldens = _load_goldens()
    for golden in goldens.values():
        natal = golden["input"]["natal"]
        transit = golden["input"]["transit"]
        action_type = golden["input"]["action_type"]
        context = _context_from_golden(golden["input"]["scoring_context"])
        result = calculate_activity_score(
            natal, transit, action_type, scoring_context=context
        )
        reasoning = build_reasoning(
            result,
            {"natal": natal, "transit": transit},
            action_type,
            context,
        )
        assert result["executive"]["score"] == golden["final_score"]
        assert result["strategic"]["component_breakdown"] == golden["component_breakdown"]
        assert list(dominant_evaluated_aspects(result)) == golden["dominant_aspects"]
        assert reasoning == golden["reasoning"]
        assert _json_safe_context(context) == golden["input"]["scoring_context"]


def test_goldens_preserve_required_fields() -> None:
    for golden in _load_goldens().values():
        assert "input" in golden
        assert golden["input"]["action_type"]
        assert "natal" in golden["input"]
        assert "transit" in golden["input"]
        assert "final_score" in golden
        assert "component_breakdown" in golden
        assert "dominant_aspects" in golden
        assert "reasoning" in golden
        breakdown = golden["component_breakdown"]
        for field in (
            "aspect_score",
            "natal_house_bonus",
            "transit_house_score",
            "transit_angular_score",
            "location_component_score",
            "retrograde_penalty",
            "final_score",
        ):
            assert field in breakdown


def test_scenario_contrasts_are_engine_derived() -> None:
    goldens = _load_goldens()
    assert goldens["strongly_supportive"]["final_score"] >= 80
    assert goldens["strongly_adverse"]["final_score"] <= 20
    assert (
        goldens["mixed_conflicting"]["final_score"]
        != goldens["strongly_supportive"]["final_score"]
    )
    close = goldens["close_exact_aspect"]
    loose = goldens["loose_aspect"]
    assert close["dominant_aspects"][0]["orb"] < loose["dominant_aspects"][0]["orb"]
    assert close["final_score"] > loose["final_score"]
    angular = goldens["angular_contact"]
    assert angular["component_breakdown"]["transit_angular_score"] > 0
    assert angular["component_breakdown"]["aspect_score"] == 0
    retro = goldens["retrograde_penalty"]
    assert retro["component_breakdown"]["retrograde_penalty"] < 0
    assert (
        goldens["action_type_business_launch"]["final_score"]
        != goldens["action_type_rest_recovery"]["final_score"]
    )
    assert (
        goldens["action_type_business_launch"]["input"]["natal"]
        == goldens["action_type_rest_recovery"]["input"]["natal"]
    )
    assert (
        goldens["natal_personalization_a"]["final_score"]
        != goldens["natal_personalization_b"]["final_score"]
    )
    london = goldens["evaluation_location_london"]
    sydney = goldens["evaluation_location_sydney"]
    assert london["final_score"] != sydney["final_score"]
    assert (
        london["component_breakdown"]["aspect_score"]
        == sydney["component_breakdown"]["aspect_score"]
    )
    assert (
        london["component_breakdown"]["location_component_score"]
        != sydney["component_breakdown"]["location_component_score"]
    )


def test_snapshot_preserves_golden_score() -> None:
    for golden in _load_goldens().values():
        context = _context_from_golden(golden["input"]["scoring_context"])
        result = calculate_activity_score(
            golden["input"]["natal"],
            golden["input"]["transit"],
            golden["input"]["action_type"],
            scoring_context=context,
        )
        snapshot = build_day_intelligence_snapshot(
            result,
            natal=golden["input"]["natal"],
            transit=golden["input"]["transit"],
            activity_type=golden["input"]["action_type"],
            scoring_context=context,
        )
        assert snapshot.final_score == golden["final_score"]
        assert snapshot.action_type == golden["input"]["action_type"]
        assert snapshot.evidence
        assert Path(GOLDEN_DIR).is_dir()
