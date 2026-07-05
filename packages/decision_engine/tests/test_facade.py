"""Unit tests for DecisionEngineFacade with injected pipeline delegates."""

from __future__ import annotations

from packages.decision_engine.facade import DecisionEngineFacade
from packages.decision_engine.models import DecisionRequest
from packages.decision_engine.tests.test_mapper import SAMPLE_PAYLOAD
from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL


def _fake_score_with_context(**kwargs):
    executive = SAMPLE_PAYLOAD["executive"]
    result = {
        "executive": dict(executive),
        "strategic": dict(SAMPLE_PAYLOAD["strategic"]),
        "technical": dict(SAMPLE_PAYLOAD["technical"]),
    }
    natal = {"planets": {}}
    transit = {"evaluation": {"city": "London"}}
    return result, natal, transit


def _fake_build_scoring_response(result, **kwargs):
    payload = {
        "executive": result["executive"],
        "strategic": result["strategic"],
        "technical": result["technical"],
        "reasoning": SAMPLE_PAYLOAD.get("reasoning"),
    }
    location_context = kwargs.get("location_context")
    if location_context is not None:
        payload["location_context"] = location_context
    return payload


def test_facade_delegates_without_transforming_score():
    facade = DecisionEngineFacade(
        score_with_context=_fake_score_with_context,
        build_scoring_response=_fake_build_scoring_response,
    )
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
    outcome = facade.generate(request)
    assert outcome.recommendation.score == 72
    assert outcome.recommendation.text == SAMPLE_PAYLOAD["executive"]["recommendation"]
    assert outcome.explanation.summary == SAMPLE_PAYLOAD["reasoning"]["summary"]
    assert outcome.metadata.module_origin == "ask"


def test_facade_omits_location_context_when_disabled():
    facade = DecisionEngineFacade(
        score_with_context=_fake_score_with_context,
        build_scoring_response=_fake_build_scoring_response,
    )
    request = DecisionRequest(
        module_origin="finance",
        decision_intent="investment",
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        target_date="2026-06-15",
        action_type="investment",
        context=CONTEXT_ASK_ELECTIONAL,
        include_location_context=False,
    )
    outcome = facade.generate(request)
    assert "location_context" not in outcome.source_activity_response
    assert outcome.metadata.location_context is None
