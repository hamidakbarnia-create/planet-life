"""car-offer-negotiation EVALUATE over the Decision Case API.

EVALUATE is the only shipped mode, so the COMPARE and FIND route surfaces
are asserted to stay unavailable for this Decision Type.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.offer_negotiation_evaluate import (
    REAL_ENGINE_ID,
)
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)

pytestmark = pytest.mark.identity_db

BASE = "/api/v1/decision-cases"
TARGET = "2026-09-15"

NATAL = {
    "birth_date": "1982-02-25",
    "birth_time": "05:47",
    "location": "Tehran",
    "latitude": 35.6892,
    "longitude": 51.389,
}


def _outcome() -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=71,
            rating="Favorable",
            activity="negotiation",
            summary="Supportive negotiation timing.",
            text="Communication conditions cooperate.",
        ),
        confidence=Confidence(value=0.62, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Negotiation timing",
                detail="Supportive communication conditions.",
                score=71,
            )
        ],
        explanation=Explanation(
            summary="Timing supports presenting terms clearly.",
            recommendation_text="Communication conditions cooperate.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="offer-negotiation-evaluate-date",
            action_type="offer_negotiation",
        ),
    )


def _create_case(client: TestClient) -> str:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-offer-negotiation",
            "title": "Negotiate a job offer",
            "entry_mode": "structured",
        },
    )
    assert created.status_code == 201, created.text
    return created.json()["case_id"]


def _prepare_case(client: TestClient) -> tuple[str, int]:
    case_id = _create_case(client)

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {
                "target_date": TARGET,
                "negotiation_goal": "salary",
                "natal_evidence": NATAL,
            },
        },
    )
    assert answers.status_code == 200, answers.text
    version = answers.json()["case"]["case_version"]

    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
        },
    )
    assert framed.status_code == 200, framed.text
    version = framed.json()["case"]["case_version"]

    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert completed.status_code == 200, completed.text
    return case_id, completed.json()["case"]["case_version"]


def test_offer_negotiation_evaluate_api(client: TestClient) -> None:
    case_id, version = _prepare_case(client)

    with patch(
        "decision_case.services.evaluate_runtime.generate_decision_outcome",
        return_value=_outcome(),
    ) as mocked:
        evaluation = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": version},
        )

    assert evaluation.status_code == 201, evaluation.text
    assert mocked.called

    request = mocked.call_args.args[0]
    assert request.action_type == "offer_negotiation"
    assert request.target_date == TARGET

    body = evaluation.json()
    assert body["engine_id"] == REAL_ENGINE_ID
    assert body["dq_status"] == "pass"

    package = body["package"]
    assert package["decision_type_id"] == "car-offer-negotiation"
    assert package["timing"]["score"] == 71.0
    assert package["timing"]["candidates"][0]["date"] == TARGET
    assert len(package["timing"]["candidates"]) == 1

    # The package must survive persistence, not just the POST response.
    evaluation_id = body["evaluation_id"]

    listed = client.get(f"{BASE}/{case_id}/evaluations")
    assert listed.status_code == 200, listed.text
    entries = listed.json()["evaluations"]
    assert [entry["evaluation_id"] for entry in entries] == [evaluation_id]

    fetched = client.get(f"{BASE}/{case_id}/evaluations/{evaluation_id}")
    assert fetched.status_code == 200, fetched.text
    stored = fetched.json()
    assert stored["engine_id"] == REAL_ENGINE_ID
    assert stored["dq_status"] == "pass"
    assert stored["package"] == package


def test_intake_requires_only_the_evaluated_date(client: TestClient) -> None:
    case_id = _create_case(client)

    # Context without a date cannot complete.
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"negotiation_goal": "salary"},
        },
    )
    assert answers.status_code == 400, answers.text
    error = answers.json()["error"]
    assert error["code"] == "INTAKE_INCOMPLETE"
    assert error["details"]["missing_required"] == ["target_date"]

    # The date alone completes intake.
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"target_date": TARGET},
        },
    )
    assert answers.status_code == 200, answers.text
    body = answers.json()
    assert body["missing_required"] == []
    assert body["is_complete"] is True


def test_unauthorized_goal_is_not_stored(client: TestClient) -> None:
    case_id = _create_case(client)

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {
                "target_date": TARGET,
                "negotiation_goal": "equity_refresh",
            },
        },
    )
    assert answers.status_code == 200, answers.text
    body = answers.json()
    # Dropped rather than persisted; the required date is unaffected.
    assert "negotiation_goal" not in body["intake"]
    assert body["intake"]["target_date"] == TARGET
    assert body["missing_required"] == []


def test_compare_and_find_are_unavailable_for_this_type(
    client: TestClient,
) -> None:
    case_id, version = _prepare_case(client)

    for path, operation in (("comparisons", "compare"), ("findings", "find")):
        response = client.post(
            f"{BASE}/{case_id}/{path}",
            json={"expected_case_version": version},
        )
        assert response.status_code == 400, (path, response.text)
        body = response.json()
        assert body["error"]["code"] == "OPERATION_NOT_IMPLEMENTED"
        assert body["error"]["details"]["operation"] == operation
        assert (
            body["error"]["details"]["decision_type_id"]
            == "car-offer-negotiation"
        )
