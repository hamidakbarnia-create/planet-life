"""Unit tests for ActivityScoreResponse → DecisionOutcome mapping."""

from __future__ import annotations

from packages.decision_engine.mapper import map_activity_response_to_decision_outcome
from packages.decision_engine.models import DecisionRequest
from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL


SAMPLE_PAYLOAD = {
    "executive": {
        "score": 72,
        "rating": "Favorable",
        "activity": "Business Launch",
        "summary": "Business Launch timing scores 72/100 (Favorable).",
        "recommendation": (
            "Good conditions for business launch. Favor core priorities around "
            "momentum; keep contingency plans light."
        ),
    },
    "strategic": {
        "score": 72,
        "base_score": 50,
        "adjustments": {},
        "component_breakdown": {
            "aspect_score": 4.0,
            "natal_house_bonus": 0.0,
            "transit_house_score": 3.0,
            "transit_angular_score": 2.0,
            "location_component_score": 5.0,
            "retrograde_penalty": 0.0,
            "final_score": 72,
            "location_mode": "eventLocation",
            "calculated_for": "London, United Kingdom",
            "resolved_local_datetime": "2026-06-15T12:00:00",
            "resolved_utc_datetime": "2026-06-15T11:00:00+00:00",
            "timezone": "Europe/London",
            "target_time": "12:00",
        },
        "transit_house_notes": [],
        "transit_angular_notes": [],
        "key_themes": [],
        "opportunity_factors": [],
        "risk_factors": [],
        "timing_notes": [],
        "primary_planets": [],
    },
    "technical": {
        "activity_type": "business_launch",
        "resolved_activity": "business_launch",
        "scoring_context": {"location_mode": "eventLocation"},
        "natal_points_used": [],
        "transit_points_used": [],
        "aspects_evaluated": [],
        "aspect_count": 0,
        "component_breakdown": {},
        "calculation_metadata": {},
    },
    "location_context": {"city": "London"},
    "reasoning": {
        "summary": "Transit support is moderate with manageable friction.",
        "confidence": 0.74,
        "reasons": [
            {
                "category": "house",
                "planet": "jupiter",
                "importance": "high",
                "score": 4.5,
                "title": "Jupiter supports the 10th house",
                "explanation": "Jupiter transiting the 10th house supports visibility.",
                "evidence": {"house": 10, "planet": "jupiter"},
            }
        ],
    },
}


def test_mapper_preserves_recommendation_and_score():
    outcome = map_activity_response_to_decision_outcome(SAMPLE_PAYLOAD)
    assert outcome.recommendation.score == 72
    assert outcome.recommendation.rating == "Favorable"
    assert outcome.recommendation.text == SAMPLE_PAYLOAD["executive"]["recommendation"]


def test_mapper_preserves_reasoning_confidence_and_evidence():
    outcome = map_activity_response_to_decision_outcome(SAMPLE_PAYLOAD)
    assert outcome.confidence is not None
    assert outcome.confidence.value == 0.74
    assert outcome.confidence.rating == "Favorable"
    assert len(outcome.evidence_references) == 1
    assert outcome.evidence_references[0].category == "house"
    assert outcome.evidence_references[0].evidence == {"house": 10, "planet": "jupiter"}
    assert len(outcome.explanation.reasons) == 1
    assert outcome.explanation.summary == SAMPLE_PAYLOAD["reasoning"]["summary"]


def test_mapper_attaches_request_metadata():
    request = DecisionRequest(
        module_origin="ask",
        decision_intent="business_launch_timing",
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        target_date="2026-06-15",
        action_type="business_launch",
        context=CONTEXT_ASK_ELECTIONAL,
    )
    outcome = map_activity_response_to_decision_outcome(SAMPLE_PAYLOAD, request=request)
    assert outcome.metadata.module_origin == "ask"
    assert outcome.metadata.decision_intent == "business_launch_timing"
    assert outcome.metadata.location_mode == "eventLocation"


def test_mapper_preserves_source_payload():
    outcome = map_activity_response_to_decision_outcome(SAMPLE_PAYLOAD)
    assert outcome.source_activity_response == SAMPLE_PAYLOAD
