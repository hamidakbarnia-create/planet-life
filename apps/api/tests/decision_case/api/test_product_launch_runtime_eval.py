from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.product_launch_evaluate import REAL_ENGINE_ID
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
TARGET = "2026-11-05"

NATAL = {
    "birth_date": "1988-06-15",
    "birth_time": "09:30",
    "location": "Paris",
    "latitude": 48.8566,
    "longitude": 2.3522,
}


def _outcome() -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=70,
            rating="Favorable",
            activity="Business Launch",
            summary="Supportive launch timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Launch timing",
                detail="Supportive conditions.",
                score=70,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the launch date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="product-launch-evaluate-date",
            action_type="business_launch",
        ),
    )


def test_product_launch_evaluate_api(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "bus-product-launch",
            "title": "Launch a project or product",
            "entry_mode": "structured",
        },
    )
    assert created.status_code == 201, created.text
    case_id = created.json()["case_id"]
    assert created.json()["family_id"] == "timing_opt"

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {
                "target_date": TARGET,
                "launch_object": "mobile app v2",
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
    assert request.action_type == "business_launch"
    assert request.target_date == TARGET
    assert request.latitude == 48.8566
    assert request.longitude == 2.3522

    body = evaluation.json()
    assert body["engine_id"] == REAL_ENGINE_ID
    assert body["dq_status"] == "pass"
    package = body["package"]
    assert package["decision_type_id"] == "bus-product-launch"
    assert package["family_id"] == "timing_opt"
    assert package["timing"]["score"] == 70.0
    assert package["timing"]["candidates"][0]["date"] == TARGET


def test_product_launch_incomplete_intake_rejects_complete(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "bus-product-launch",
            "title": "Launch a project or product",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"target_date": TARGET},
        },
    )
    assert answers.status_code == 200, answers.text
    version = answers.json()["case"]["case_version"]
    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert completed.status_code == 400
    assert completed.json()["error"]["code"] == "INTAKE_INCOMPLETE"
