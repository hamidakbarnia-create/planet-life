from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.investor_meeting_evaluate import (
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
TARGET = "2026-09-01"

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
            score=72,
            rating="Favorable",
            activity="negotiation",
            summary="Supportive negotiation timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Negotiation timing",
                detail="Supportive communication conditions.",
                score=72,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the investor meeting.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="investor-meeting-evaluate-date",
            action_type="investor_meeting",
        ),
    )


def test_investor_meeting_evaluate_api(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "bus-investor-meeting",
            "title": "Investor meeting",
            "entry_mode": "structured",
        },
    )
    assert created.status_code == 201, created.text

    case_id = created.json()["case_id"]

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {
                "target_date": TARGET,
                "meeting_goal": "Pitch seed round",
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
    version = completed.json()["case"]["case_version"]

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
    assert request.action_type == "investor_meeting"
    assert request.target_date == TARGET

    body = evaluation.json()
    assert body["engine_id"] == REAL_ENGINE_ID
    assert body["dq_status"] == "pass"

    package = body["package"]
    assert package["decision_type_id"] == "bus-investor-meeting"
    assert package["timing"]["score"] == 72.0
    assert package["timing"]["candidates"][0]["date"] == TARGET
