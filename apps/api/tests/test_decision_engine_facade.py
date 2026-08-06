"""Integration tests — facade parity with existing scoring pipeline."""

from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL  # noqa: E402
from packages.decision_engine import DecisionRequest  # noqa: E402
from schemas.score_breakdown import ActivityScoreResponse, build_scoring_response  # noqa: E402
from services.decision_engine import generate_decision_outcome  # noqa: E402
from services.scoring_pipeline import score_with_context  # noqa: E402

BIRTH = {
    "birth_date": "1982-02-25",
    "birth_time": "05:47",
    "location": "Rafsanjan",
    "latitude": 30.4067,
    "longitude": 56.0039,
}
LONDON = {
    "evaluation_location": "London, United Kingdom",
    "evaluation_latitude": 51.5074,
    "evaluation_longitude": -0.1278,
}


def test_facade_matches_existing_pipeline_recommendation_and_reasoning():
    action = "business_launch"
    result, natal, transit = score_with_context(
        **BIRTH,
        target_date="2026-06-15",
        target_time=None,
        action_type=action,
        context=CONTEXT_ASK_ELECTIONAL,
        **LONDON,
    )
    direct_payload = build_scoring_response(
        result,
        location_context=transit.get("evaluation", {}),
        natal=natal,
        transit=transit,
        activity_type=action,
        context=CONTEXT_ASK_ELECTIONAL,
    )
    ActivityScoreResponse.model_validate(direct_payload)

    request = DecisionRequest(
        module_origin="ask",
        decision_intent=action,
        birth_date=BIRTH["birth_date"],
        birth_time=BIRTH["birth_time"],
        location=BIRTH["location"],
        target_date="2026-06-15",
        action_type=action,
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=BIRTH["latitude"],
        longitude=BIRTH["longitude"],
        **LONDON,
    )
    outcome = generate_decision_outcome(request)

    assert outcome.recommendation.score == direct_payload["executive"]["score"]
    assert outcome.recommendation.text == direct_payload["executive"]["recommendation"]
    assert outcome.recommendation.rating == direct_payload["executive"]["rating"]

    direct_reasoning = direct_payload.get("reasoning")
    if direct_reasoning is None:
        assert outcome.confidence is None or outcome.confidence.value is None
        assert outcome.evidence_references == []
    else:
        assert outcome.confidence is not None
        assert outcome.confidence.value == pytest.approx(direct_reasoning["confidence"])
        assert len(outcome.evidence_references) == len(direct_reasoning["reasons"])
        assert outcome.explanation.summary == direct_reasoning["summary"]

    assert outcome.source_activity_response["executive"] == direct_payload["executive"]
    assert outcome.source_activity_response["strategic"]["component_breakdown"] == (
        direct_payload["strategic"]["component_breakdown"]
    )
