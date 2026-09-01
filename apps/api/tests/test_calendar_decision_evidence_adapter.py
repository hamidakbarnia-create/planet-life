"""Calendar /api/batch path: evidence adapter must not change engine scores."""

from __future__ import annotations

import copy
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from packages.astro_engine.scoring_context import CONTEXT_CALENDAR_DAY
from packages.decision_engine.day_intelligence_models import (
    attach_calendar_day_intelligence,
    build_day_intelligence_snapshot,
)
from packages.decision_engine.dimension_mapping import DIMENSION_KEYS
from schemas.score_breakdown import build_scoring_response
from services.scoring_pipeline import score_with_context


def test_calendar_day_pipeline_score_unchanged_by_evidence_adapter():
    result, natal, transit = score_with_context(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        latitude=30.4067,
        longitude=56.0039,
        target_date="2026-06-15",
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location="London, United Kingdom",
        evaluation_latitude=51.5074,
        evaluation_longitude=-0.1278,
    )
    original_score = result["executive"]["score"]
    original = copy.deepcopy(result)
    payload = build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
    )
    snapshot = build_day_intelligence_snapshot(
        payload,
        natal=natal,
        transit=transit,
        activity_type="business_launch",
        scoring_context=CONTEXT_CALENDAR_DAY,
    )
    assert result == original
    assert snapshot.final_score == original_score
    assert snapshot.final_score == payload["executive"]["score"]
    assert snapshot.evidence
    assert any(item.kind == "aspect" for item in snapshot.evidence)
    assert payload["reasoning"] is not None
    attached = attach_calendar_day_intelligence(
        payload,
        natal=natal,
        transit=transit,
        activity_type="business_launch",
        scoring_context=CONTEXT_CALENDAR_DAY,
    )
    assert attached["executive"]["score"] == original_score
    day_intelligence = attached["day_intelligence"]
    assert day_intelligence["final_score"] == original_score
    assert day_intelligence["day_class"] in {
        "strongly_supportive",
        "supportive",
        "mixed",
        "caution",
        "adverse",
        "insufficient",
    }
    assert "command" not in day_intelligence
    assert isinstance(day_intelligence["evidence"], list)
    assert day_intelligence["evidence"]
    assert snapshot.classification.score == original_score
    assert "dimensions" in day_intelligence
    dim_values = [
        day_intelligence["dimensions"][key]["value"]
        for key in DIMENSION_KEYS
    ]
    assert any(value != original_score for value in dim_values)
    assert "command" not in day_intelligence["dimensions"]
    assert snapshot.dimensions.mapping_version == day_intelligence["dimensions"]["mapping_version"]
    assert "day_intelligence" not in payload


def test_analyze_style_scoring_response_has_no_day_intelligence():
    """Ask/analyze payloads stay on build_scoring_response — no Calendar 2A layer."""
    result, natal, transit = score_with_context(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        latitude=30.4067,
        longitude=56.0039,
        target_date="2026-06-15",
        target_time=None,
        action_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
        evaluation_location="London, United Kingdom",
        evaluation_latitude=51.5074,
        evaluation_longitude=-0.1278,
    )
    payload = build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type="business_launch",
        context=CONTEXT_CALENDAR_DAY,
    )
    assert "day_intelligence" not in payload
    assert payload["executive"]["score"] == result["executive"]["score"]
