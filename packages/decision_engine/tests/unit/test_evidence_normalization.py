"""Phase 1: DecisionEvidence adapter correctness."""

from __future__ import annotations

import copy

from packages.astro_engine.reasoning import build_reasoning
from packages.astro_engine.scoring import calculate_activity_score
from packages.astro_engine.scoring_context import CONTEXT_CALENDAR_DAY, CONTEXT_NATAL
from packages.decision_engine.day_intelligence_models import (
    build_day_intelligence_snapshot,
)
from packages.decision_engine.evaluate.factor_keys import build_factor_key
from packages.decision_engine.evidence import (
    UNKNOWN_TEMPORAL_FIELDS,
    normalize_score_evidence,
    polarity_from_contribution,
    unknown_temporal_fields,
)
from packages.decision_engine.tests.fixtures.calendar_score_cases import (
    case_angular_contact,
    case_close_exact_aspect,
    case_evaluation_location_london,
    case_retrograde_penalty,
    case_strongly_supportive,
)


def _score_case(case: dict):
    result = calculate_activity_score(
        case["natal"],
        case["transit"],
        case["action_type"],
        scoring_context=case["scoring_context"],
    )
    return result


def test_polarity_from_contribution_signs() -> None:
    assert polarity_from_contribution(4.2) == "supportive"
    assert polarity_from_contribution(-1.1) == "caution"
    assert polarity_from_contribution(0.0) == "neutral"
    assert polarity_from_contribution(0) == "neutral"


def test_positive_negative_zero_polarity_on_normalized_records() -> None:
    score_result = {
        "executive": {"score": 50},
        "strategic": {"component_breakdown": {"final_score": 50}},
        "technical": {
            "activity_type": "business_launch",
            "scoring_context": {
                "location_mode": "currentLiving",
                "include_natal_house_bonus": False,
                "include_transit_house_score": False,
                "include_transit_angular_score": False,
            },
            "aspects_evaluated": [
                {
                    "transit_planet": "jupiter",
                    "natal_planet": "sun",
                    "aspect": "trine",
                    "orb": 0.2,
                    "contribution": 8.5,
                },
                {
                    "transit_planet": "saturn",
                    "natal_planet": "sun",
                    "aspect": "square",
                    "orb": 1.0,
                    "contribution": -6.0,
                },
                {
                    "transit_planet": "mercury",
                    "natal_planet": "venus",
                    "aspect": "sextile",
                    "orb": 3.9,
                    "contribution": 0.0,
                },
            ],
        },
    }
    evidence = normalize_score_evidence(score_result)
    by_key = {item.factor_key: item for item in evidence}
    assert by_key["aspect.jupiter.trine.sun"].polarity == "supportive"
    assert by_key["aspect.saturn.square.sun"].polarity == "caution"
    assert by_key["aspect.mercury.sextile.venus"].polarity == "neutral"


def test_evidence_ids_are_deterministic() -> None:
    case = case_strongly_supportive()
    result = _score_case(case)
    first = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    second = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    assert [item.evidence_id for item in first] == [item.evidence_id for item in second]
    assert [item.factor_key for item in first] == [item.factor_key for item in second]
    assert all(item.evidence_id.startswith("ev.") for item in first)
    assert "Transit" not in "".join(item.evidence_id for item in first)


def test_factor_key_matches_shared_builder_not_prose() -> None:
    result = {
        "executive": {"score": 60},
        "strategic": {"component_breakdown": {"final_score": 60}},
        "technical": {
            "activity_type": "business_launch",
            "aspects_evaluated": [
                {
                    "transit_planet": "Jupiter",
                    "natal_planet": "Sun",
                    "aspect": "trine",
                    "orb": 0.4,
                    "contribution": 12.0,
                    "label": "Transit Jupiter trine natal Sun (orb 0.4°)",
                }
            ],
        },
    }
    evidence = normalize_score_evidence(result)
    assert len(evidence) == 1
    expected = build_factor_key(
        {
            "transit_planet": "jupiter",
            "natal_planet": "sun",
            "aspect": "trine",
        },
        "aspect",
    )
    assert evidence[0].factor_key == expected
    assert evidence[0].evidence_id == f"ev.{expected}"
    assert evidence[0].factor_key != result["technical"]["aspects_evaluated"][0]["label"]


def test_aspect_provenance_survives_normalization() -> None:
    case = case_close_exact_aspect()
    result = _score_case(case)
    evidence = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    aspects = [item for item in evidence if item.kind == "aspect"]
    assert aspects
    jupiter_sun = next(
        item
        for item in aspects
        if item.transit_body == "jupiter" and item.natal_target == "sun"
    )
    assert jupiter_sun.aspect_type == "trine"
    assert jupiter_sun.orb is not None
    assert jupiter_sun.orb < 1.0
    assert jupiter_sun.source_layer == "technical.aspects_evaluated"
    assert jupiter_sun.source_engine == "astro_engine.scoring"


def test_house_provenance_survives_normalization() -> None:
    case = case_strongly_supportive()
    result = _score_case(case)
    evidence = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    houses = [item for item in evidence if item.kind == "house"]
    assert houses
    jupiter = next(
        item
        for item in houses
        if item.transit_body == "jupiter" and item.house_scope == "transit"
    )
    assert jupiter.house == 10
    assert jupiter.source_layer == "scoring.transit_house_score"


def test_angular_provenance_survives_normalization() -> None:
    case = case_angular_contact()
    result = _score_case(case)
    evidence = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    angular = [item for item in evidence if item.kind == "angular"]
    assert angular
    jupiter = next(item for item in angular if item.transit_body == "jupiter")
    assert jupiter.angle in {"asc", "mc", "dsc", "ic"}
    assert jupiter.orb_band in {"strong", "medium", "weak"}
    assert jupiter.source_layer == "scoring.transit_angular_score"


def test_retrograde_provenance_survives_normalization() -> None:
    case = case_retrograde_penalty()
    result = _score_case(case)
    evidence = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    retro = [item for item in evidence if item.kind == "retrograde"]
    assert retro
    mars = next(item for item in retro if item.transit_body == "mars")
    assert mars.retrograde is True
    assert mars.contribution < 0
    assert mars.polarity == "caution"
    assert mars.source_layer == "scoring.retrograde_penalty"


def test_missing_optional_temporal_data_remains_unknown() -> None:
    case = case_close_exact_aspect()
    result = _score_case(case)
    evidence = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    assert evidence
    for item in evidence:
        unknown = unknown_temporal_fields(item)
        assert set(unknown) == set(UNKNOWN_TEMPORAL_FIELDS)
        assert all(value is None for value in unknown.values())
        assert item.applying_or_separating is None
        assert item.station_state is None
        assert item.speed_class is None
        assert item.duration_class is None
        assert item.orb_strength is None


def test_normalized_evidence_cannot_alter_final_score() -> None:
    case = case_evaluation_location_london()
    result = _score_case(case)
    original = copy.deepcopy(result)
    snapshot = build_day_intelligence_snapshot(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    assert result == original
    assert snapshot.final_score == original["executive"]["score"]
    assert snapshot.final_score == original["strategic"]["component_breakdown"]["final_score"]
    assert snapshot.component_breakdown == original["strategic"]["component_breakdown"]


def test_natal_house_bonus_provenance_when_context_includes_it() -> None:
    natal = {"planets": {"sun": {"longitude": 10.0, "house": 10}}}
    transit = {"planets": {"jupiter": {"longitude": 200.0}}}
    result = calculate_activity_score(
        natal, transit, "business_launch", scoring_context=CONTEXT_NATAL
    )
    evidence = normalize_score_evidence(
        result,
        natal=natal,
        transit=transit,
        activity_type="business_launch",
        scoring_context=CONTEXT_NATAL,
    )
    natal_houses = [
        item
        for item in evidence
        if item.kind == "house" and item.house_scope == "natal"
    ]
    assert natal_houses
    sun = next(item for item in natal_houses if item.natal_target == "sun")
    assert sun.house == 10
    assert sun.transit_body is None
    assert sun.polarity == "supportive"
    assert result["strategic"]["component_breakdown"]["natal_house_bonus"] > 0


def test_reasoning_fallback_preserves_house_when_charts_omitted() -> None:
    case = case_strongly_supportive()
    result = _score_case(case)
    reasoning = build_reasoning(
        result,
        {"natal": case["natal"], "transit": case["transit"]},
        case["action_type"],
        CONTEXT_CALENDAR_DAY,
    )
    evidence = normalize_score_evidence(result, reasoning=reasoning)
    houses = [item for item in evidence if item.kind == "house"]
    assert houses
    assert all(item.source_layer == "reasoning.reasons" for item in houses)


def test_calendar_context_excludes_natal_house_bonus_from_evidence() -> None:
    case = case_strongly_supportive()
    result = _score_case(case)
    evidence = normalize_score_evidence(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=CONTEXT_CALENDAR_DAY,
    )
    assert result["strategic"]["component_breakdown"]["natal_house_bonus"] == 0.0
    assert not any(item.house_scope == "natal" for item in evidence)
