"""API contract tests for deterministic score reasoning."""

from __future__ import annotations

import os
import sys
from unittest.mock import patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, r"C:\planet-life")

from packages.astro_engine.scoring_context import (  # noqa: E402
    CONTEXT_ASK_ELECTIONAL,
    CONTEXT_CALENDAR_DAY,
    CONTEXT_PROPERTY,
)
from schemas.score_breakdown import (  # noqa: E402
    ActivityScoreResponse,
    build_scoring_response,
)
from schemas.score_reasoning import (  # noqa: E402
    REASON_REQUIRED_FIELDS,
    validate_score_reasoning,
)
from services.scoring_pipeline import score_with_context  # noqa: E402

BIRTH = {
    "birth_date": "1982-02-25",
    "birth_time": "05:47",
    "location": "Rafsanjan",
    "latitude": 30.4067,
    "longitude": 56.0039,
}
TARGET_DATE = "2026-06-15"
LONDON = {
    "evaluation_location": "London, United Kingdom",
    "evaluation_latitude": 51.5074,
    "evaluation_longitude": -0.1278,
}
NYC = {
    "evaluation_location": "New York, United States",
    "evaluation_latitude": 40.7128,
    "evaluation_longitude": -74.0060,
}


def _assert_reasoning_contract(reasoning: dict) -> None:
    model = validate_score_reasoning(reasoning)
    assert model.summary
    assert 0.0 <= model.confidence <= 1.0
    assert isinstance(model.reasons, list)
    for reason in model.reasons:
        dumped = reason.model_dump()
        for field in REASON_REQUIRED_FIELDS:
            assert field in dumped
        assert dumped["evidence"] is not None


def test_analyze_response_includes_reasoning():
    result, natal, transit = score_with_context(
        **BIRTH,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_ASK_ELECTIONAL,
        **LONDON,
    )
    payload = build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type="business_launch",
        context=CONTEXT_ASK_ELECTIONAL,
    )
    assert payload["reasoning"] is not None
    _assert_reasoning_contract(payload["reasoning"])
    ActivityScoreResponse.model_validate(payload)


def test_property_analyze_response_includes_reasoning():
    result, natal, transit = score_with_context(
        **BIRTH,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="real_estate",
        context=CONTEXT_PROPERTY,
        **NYC,
    )
    payload = build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type="real_estate",
        context=CONTEXT_PROPERTY,
    )
    assert payload["reasoning"] is not None
    _assert_reasoning_contract(payload["reasoning"])


def test_calendar_batch_day_includes_reasoning():
    result, natal, transit = score_with_context(
        **BIRTH,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        **LONDON,
    )
    payload = build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
    )
    assert payload["reasoning"] is not None
    _assert_reasoning_contract(payload["reasoning"])


def test_reasoning_null_when_chart_data_missing():
    result, _, _ = score_with_context(
        **BIRTH,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_ASK_ELECTIONAL,
        **LONDON,
    )
    payload = build_scoring_response(result)
    assert payload["reasoning"] is None


def test_api_does_not_crash_when_reasoning_build_fails():
    result, natal, transit = score_with_context(
        **BIRTH,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_ASK_ELECTIONAL,
        **LONDON,
    )
    with patch(
        "schemas.score_reasoning.build_reasoning",
        side_effect=RuntimeError("reasoning failed"),
    ):
        payload = build_scoring_response(
            result,
            natal=natal,
            transit=transit,
            activity_type="business_launch",
            context=CONTEXT_ASK_ELECTIONAL,
        )
    assert payload["reasoning"] is None
    assert payload["executive"]["score"] == result["executive"]["score"]


def test_reasoning_does_not_change_final_score():
    result, natal, transit = score_with_context(
        **BIRTH,
        target_date=TARGET_DATE,
        target_time=None,
        action_type="contract_signing",
        context=CONTEXT_ASK_ELECTIONAL,
        **LONDON,
    )
    before = result["executive"]["score"]
    breakdown_before = result["strategic"]["component_breakdown"]["final_score"]

    payload = build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type="contract_signing",
        context=CONTEXT_ASK_ELECTIONAL,
    )

    assert payload["executive"]["score"] == before
    assert payload["strategic"]["component_breakdown"]["final_score"] == breakdown_before
    assert payload["strategic"]["score"] == result["strategic"]["score"]
