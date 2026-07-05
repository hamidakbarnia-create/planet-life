"""Finance route parity — legacy pipeline vs DecisionEngineFacade."""

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
TARGET_DATE = "2026-06-15"


def _legacy_finance_pipeline(*, action_type: str, eval_coords: dict | None = None) -> dict:
    """Replicate pre-migration POST /api/finance/analyze response construction."""
    eval_coords = eval_coords or {}
    result, natal, transit = score_with_context(
        birth_date=BIRTH["birth_date"],
        birth_time=BIRTH["birth_time"],
        location=BIRTH["location"],
        target_date=TARGET_DATE,
        target_time=None,
        action_type=action_type,
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=BIRTH.get("latitude"),
        longitude=BIRTH.get("longitude"),
        **eval_coords,
    )
    return build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type=action_type,
        context=CONTEXT_ASK_ELECTIONAL,
    )


def _facade_finance_pipeline(*, action_type: str, eval_coords: dict | None = None) -> dict:
    """Replicate migrated POST /api/finance/analyze via DecisionEngineFacade."""
    eval_coords = eval_coords or {}
    outcome = generate_decision_outcome(
        DecisionRequest(
            module_origin="finance",
            decision_intent=action_type,
            birth_date=BIRTH["birth_date"],
            birth_time=BIRTH["birth_time"],
            location=BIRTH["location"],
            target_date=TARGET_DATE,
            target_time=None,
            action_type=action_type,
            context=CONTEXT_ASK_ELECTIONAL,
            latitude=BIRTH.get("latitude"),
            longitude=BIRTH.get("longitude"),
            include_location_context=False,
            **eval_coords,
        )
    )
    return outcome.source_activity_response


@pytest.mark.parametrize(
    "action_type",
    ["investment", "finance_transaction", "negotiation", "contract_signing", "invest", "contract"],
)
def test_finance_route_facade_matches_legacy_pipeline(action_type: str):
    legacy = _legacy_finance_pipeline(action_type=action_type, eval_coords=LONDON)
    facade = _facade_finance_pipeline(action_type=action_type, eval_coords=LONDON)

    assert facade == legacy
    ActivityScoreResponse.model_validate(facade)
    assert "location_context" not in facade


def test_finance_route_facade_matches_legacy_without_evaluation_coords():
    action_type = "negotiation"
    legacy = _legacy_finance_pipeline(action_type=action_type)
    facade = _facade_finance_pipeline(action_type=action_type)

    assert facade == legacy
    ActivityScoreResponse.model_validate(facade)
    assert "location_context" not in facade
