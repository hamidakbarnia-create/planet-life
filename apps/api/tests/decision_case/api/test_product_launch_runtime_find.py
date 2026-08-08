from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.product_launch_find import REAL_ENGINE_ID
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
START = "2026-09-01"
END = "2026-09-14"

NATAL = {
    "birth_date": "1988-06-15",
    "birth_time": "09:30",
    "location": "Paris",
    "latitude": 48.8566,
    "longitude": 2.3522,
}


def _outcome(score: float = 70.0, rating: str = "Favorable") -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating=rating,
            activity="Business Launch",
            summary="Supportive launch timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Launch timing",
                detail="Supportive conditions.",
                score=score,
            )
        ],
        explanation=Explanation(
            summary="Timing supports launch windows.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="product-launch-find-dates",
            action_type="business_launch",
        ),
    )


def _prepare_find_case(client: TestClient) -> tuple[str, int]:
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

    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": START,
                "end": END,
            },
        },
    )
    assert framed.status_code == 200, framed.text
    version = framed.json()["case"]["case_version"]
    assert framed.json()["case"]["mode"] == "find_dates"

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": version,
            "answers": {
                "launch_object": "mobile app v2",
                "natal_evidence": NATAL,
            },
        },
    )
    assert answers.status_code == 200, answers.text
    version = answers.json()["case"]["case_version"]

    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert completed.status_code == 200, completed.text
    version = completed.json()["case"]["case_version"]
    assert completed.json()["case"]["state"] == "evidence_ready"
    return case_id, version


def test_product_launch_find_api_lifecycle_and_isolation(client: TestClient) -> None:
    case_id, version = _prepare_find_case(client)

    scores = [40.0] * 14
    # Days 2-4 eligible high; day 10 eligible high → two windows.
    # Rating must track score so band eligibility is not forced Favorable.
    scores[2] = 70.0
    scores[3] = 72.0
    scores[4] = 68.0
    scores[10] = 71.0
    outcomes = iter(
        _outcome(
            score=s,
            rating="Favorable" if s >= 65 else "Challenging",
        )
        for s in scores
    )

    with patch(
        "decision_case.services.find_runtime.generate_decision_outcome",
        side_effect=lambda _req: next(outcomes),
    ) as mocked:
        finding = client.post(
            f"{BASE}/{case_id}/findings",
            json={"expected_case_version": version},
        )

    assert finding.status_code == 201, finding.text
    assert mocked.call_count == 14
    body = finding.json()
    assert body["engine_id"] == REAL_ENGINE_ID
    assert body["dq_status"] == "pass"
    package = body["package"]
    assert package["mode"] == "find_dates"
    assert package["family_id"] == "timing_opt"
    assert package["decision_type_id"] == "bus-product-launch"
    assert package["find"]["range_start"] == START
    assert package["find"]["range_end"] == END
    assert len(package["find"]["windows"]) == 2
    assert package["recommendation"]["stance"] in {
        "proceed_with_conditions",
        "no_unique_winner",
    }
    assert "market" not in package["recommendation"]["summary"].lower()
    limits = " ".join(package["explainability"]["limits"]).lower()
    assert "does not predict" in limits
    assert "product hunt" in limits
    assert package["recommendation"]["stance"] != "proceed"

    case = client.get(f"{BASE}/{case_id}")
    assert case.status_code == 200
    assert case.json()["state"] == "found"
    assert case.json()["activation_phase"] == "found"
    assert case.json()["mode"] == "find_dates"

    listed_findings = client.get(f"{BASE}/{case_id}/findings")
    assert listed_findings.status_code == 200
    assert len(listed_findings.json()["findings"]) == 1

    got = client.get(f"{BASE}/{case_id}/findings/{body['finding_id']}")
    assert got.status_code == 200
    assert got.json()["finding_version"] == 1

    evaluations = client.get(f"{BASE}/{case_id}/evaluations")
    assert evaluations.status_code == 200
    assert evaluations.json()["evaluations"] == []

    comparisons = client.get(f"{BASE}/{case_id}/comparisons")
    assert comparisons.status_code == 200
    assert comparisons.json()["comparisons"] == []


def test_product_launch_find_no_strong_window(client: TestClient) -> None:
    case_id, version = _prepare_find_case(client)
    with patch(
        "decision_case.services.find_runtime.generate_decision_outcome",
        return_value=_outcome(score=50.0, rating="Mixed / Proceed with Awareness"),
    ):
        finding = client.post(
            f"{BASE}/{case_id}/findings",
            json={"expected_case_version": version},
        )
    assert finding.status_code == 201, finding.text
    package = finding.json()["package"]
    assert package["find"]["windows"] == []
    assert package["recommendation"]["stance"] == "wait"
    assert package["timing"]["material"] is False


def test_product_launch_find_missing_natal_fails_closed(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "bus-product-launch",
            "title": "Launch a project or product",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": START,
                "end": END,
            },
        },
    )
    version = framed.json()["case"]["case_version"]
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": version,
            "answers": {"launch_object": "mobile app v2"},
        },
    )
    version = answers.json()["case"]["case_version"]
    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    version = completed.json()["case"]["case_version"]

    finding = client.post(
        f"{BASE}/{case_id}/findings",
        json={"expected_case_version": version},
    )
    assert finding.status_code == 201, finding.text
    package = finding.json()["package"]
    assert package["recommendation"]["stance"] == "insufficient_data"
    assert finding.json()["dq_status"] == "blocked"
    assert package["find"]["windows"] == []


def test_product_launch_find_rejects_short_range(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "bus-product-launch",
            "title": "Launch",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": "2026-09-01",
                "end": "2026-09-05",
            },
        },
    )
    assert framed.status_code == 400, framed.text
    assert framed.json()["error"]["code"] in {"FRAMING_INVALID", "VALIDATION_ERROR"}
