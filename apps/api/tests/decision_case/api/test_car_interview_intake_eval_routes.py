"""PR-2 HTTP transport: car-interview intake + stub evaluation boundary."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.identity_db

BASE = "/api/v1/decision-cases"


def _create_car_interview(client: TestClient) -> dict:
    response = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "Attend job interview",
            "entry_mode": "structured",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_intake_answers_start_intake_and_persist_same_case(
    client: TestClient,
) -> None:
    created = _create_car_interview(client)
    case_id = created["case_id"]
    assert created["case_version"] == 1
    assert created["state"] == "draft"

    first = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"target_date": "2026-08-10"},
        },
    )
    assert first.status_code == 200
    body = first.json()
    assert body["case"]["case_id"] == case_id
    assert body["case"]["state"] == "intake"
    assert body["case"]["case_version"] >= 2
    assert body["intake"]["target_date"] == "2026-08-10"
    assert body["is_complete"] is False
    assert "role" in body["missing_required"]

    version_after_first = body["case"]["case_version"]
    second = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": version_after_first,
            "answers": {"role": "Engineer"},
        },
    )
    assert second.status_code == 200
    body2 = second.json()
    assert body2["case"]["case_id"] == case_id
    assert body2["intake"]["target_date"] == "2026-08-10"
    assert body2["intake"]["role"] == "Engineer"
    assert body2["is_complete"] is True
    assert body2["missing_required"] == []
    assert body2["case"]["case_version"] > version_after_first


def test_incomplete_intake_cannot_complete_or_evaluate(
    client: TestClient,
) -> None:
    created = _create_car_interview(client)
    case_id = created["case_id"]
    first = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"role": "PM"},
        },
    )
    assert first.status_code == 200
    version = first.json()["case"]["case_version"]

    incomplete = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert incomplete.status_code == 400
    assert incomplete.json()["error"]["code"] == "INTAKE_INCOMPLETE"
    assert "target_date" in incomplete.json()["error"]["details"]["missing_required"]

    blocked = client.post(
        f"{BASE}/{case_id}/evaluations",
        json={"expected_case_version": version},
    )
    assert blocked.status_code in {400, 409}


def test_complete_intake_then_runtime_requires_framing(
    client: TestClient,
) -> None:
    """Without Case framing, evaluation must not fall back to stub."""
    created = _create_car_interview(client)
    case_id = created["case_id"]
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {
                "target_date": "2026-08-12",
                "role": "Designer",
                "company": "Metioro",
            },
        },
    )
    assert answers.status_code == 200
    version = answers.json()["case"]["case_version"]
    assert answers.json()["is_complete"] is True

    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert completed.status_code == 200
    assert completed.json()["case"]["state"] == "evidence_ready"
    version = completed.json()["case"]["case_version"]

    evaluation = client.post(
        f"{BASE}/{case_id}/evaluations",
        json={"expected_case_version": version},
    )
    assert evaluation.status_code == 400
    assert evaluation.json()["error"]["code"] == "FRAMING_REQUIRED"

    detail = client.get(f"{BASE}/{case_id}")
    assert detail.status_code == 200
    assert detail.json()["intake"]["role"] == "Designer"
    # Still evidence_ready — no stub evaluation was created.
    assert detail.json()["state"] == "evidence_ready"


def test_stale_version_conflict_on_intake_answers(client: TestClient) -> None:
    created = _create_car_interview(client)
    case_id = created["case_id"]
    ok = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"target_date": "2026-08-10"},
        },
    )
    assert ok.status_code == 200
    stale = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"role": "Engineer"},
        },
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "VERSION_CONFLICT"
