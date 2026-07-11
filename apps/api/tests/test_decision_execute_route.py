"""Route-level HTTP tests for Decision API Contract v1 (ADR-0006)."""

from __future__ import annotations

import os
import sys
import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from main import app  # noqa: E402

client = TestClient(app)

VALID_REQUEST = {
    "request_id": "career-focus-week:career_focus",
    "display_text": "What should I focus on in my career this week?",
    "action_type": "career_focus",
    "guided_question_id": "career-focus-week",
    "category_id": "career-work",
    "needs_time": False,
    "locale": "en",
    "profile": {
        "birth_date": "1990-06-15",
        "birth_time": "14:30",
        "location": "New York",
        "latitude": 40.7128,
        "longitude": -74.006,
        "action_type": "business_launch",
    },
}


def _assert_error_envelope(payload: dict, *, request_id: str | None = None) -> None:
    assert "error" in payload
    error = payload["error"]
    assert isinstance(error.get("code"), str) and error["code"]
    assert isinstance(error.get("message"), str) and error["message"]
    assert "requestId" in error
    if request_id is not None:
        assert error["requestId"] == request_id


def test_valid_request_returns_contract_valid_success() -> None:
    response = client.post("/api/v1/decision/execute", json=VALID_REQUEST)
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "completed"
    result = payload["result"]
    assert result["requestId"] == VALID_REQUEST["request_id"]
    assert result["actionType"] == VALID_REQUEST["action_type"]
    assert result["guidedQuestionId"] == VALID_REQUEST["guided_question_id"]
    assert result["categoryId"] == VALID_REQUEST["category_id"]
    assert result["needsTime"] == VALID_REQUEST["needs_time"]
    assert result["summary"] == VALID_REQUEST["display_text"]
    assert result["source"] == "decision_api_boundary"
    assert result["source"] != "decision_engine"


def test_malformed_json_returns_400_envelope() -> None:
    response = client.post(
        "/api/v1/decision/execute",
        content=b"{not-json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400
    _assert_error_envelope(response.json())


def test_missing_field_returns_400_envelope() -> None:
    body = dict(VALID_REQUEST)
    del body["request_id"]
    response = client.post("/api/v1/decision/execute", json=body)
    assert response.status_code == 400
    _assert_error_envelope(response.json(), request_id="")


def test_invalid_field_returns_400_envelope() -> None:
    body = {
        **VALID_REQUEST,
        "profile": {
            **VALID_REQUEST["profile"],
            "birth_date": "not-a-date",
        },
    }
    response = client.post("/api/v1/decision/execute", json=body)
    assert response.status_code == 400
    _assert_error_envelope(response.json(), request_id=VALID_REQUEST["request_id"])


def test_timeout_returns_500_envelope() -> None:
    def _slow_boundary(_request):
        time.sleep(0.2)
        return None

    with (
        patch("routes.decision.EXECUTION_BUDGET_SECONDS", 0.01),
        patch("routes.decision.execute_decision_boundary", side_effect=_slow_boundary),
    ):
        response = client.post("/api/v1/decision/execute", json=VALID_REQUEST)
    assert response.status_code == 500
    payload = response.json()
    _assert_error_envelope(payload, request_id=VALID_REQUEST["request_id"])
    assert payload["error"]["code"] == "EXECUTION_TIMEOUT"
    assert payload["error"]["message"] == "Decision execution timed out"


def test_boundary_exception_returns_500_envelope() -> None:
    secret = "sensitive-internal-detail-7f3c"
    with patch(
        "routes.decision.execute_decision_boundary",
        side_effect=RuntimeError(secret),
    ):
        response = client.post("/api/v1/decision/execute", json=VALID_REQUEST)
    assert response.status_code == 500
    payload = response.json()
    body_text = response.text
    _assert_error_envelope(payload, request_id=VALID_REQUEST["request_id"])
    assert payload["error"]["code"] == "INTERNAL_ERROR"
    assert payload["error"]["message"] == "Internal decision execution failure"
    assert payload["error"]["requestId"] == VALID_REQUEST["request_id"]
    assert secret not in body_text
    assert "RuntimeError" not in body_text
    assert "sensitive-internal" not in body_text
    assert set(payload["error"].keys()) == {"code", "message", "requestId"}


def test_request_id_propagation_in_success_and_error() -> None:
    success = client.post("/api/v1/decision/execute", json=VALID_REQUEST)
    assert success.json()["result"]["requestId"] == VALID_REQUEST["request_id"]

    invalid = client.post(
        "/api/v1/decision/execute",
        json={**VALID_REQUEST, "locale": "zz"},
    )
    assert invalid.status_code == 400
    _assert_error_envelope(invalid.json(), request_id=VALID_REQUEST["request_id"])


def test_no_authentication_required() -> None:
    response = client.post("/api/v1/decision/execute", json=VALID_REQUEST)
    assert response.status_code == 200


def test_openapi_path_exists() -> None:
    schema = app.openapi()
    assert "/api/v1/decision/execute" in schema["paths"]
    post = schema["paths"]["/api/v1/decision/execute"]["post"]
    assert "200" in post["responses"]
    assert "400" in post["responses"]
    assert "500" in post["responses"]
    assert "422" not in post["responses"]


def test_openapi_documents_intended_response_contracts() -> None:
    schema = app.openapi()
    responses = schema["paths"]["/api/v1/decision/execute"]["post"]["responses"]
    assert "DecisionExecuteResponse" in responses["200"]["content"]["application/json"]["schema"]["$ref"]
    error_ref = responses["400"]["content"]["application/json"]["schema"]["$ref"]
    assert error_ref == responses["500"]["content"]["application/json"]["schema"]["$ref"]


def test_legacy_engine_never_invoked() -> None:
    with patch("services.decision_engine.generate_decision_outcome") as generate_outcome, patch(
        "packages.decision_engine.facade.DecisionEngineFacade.generate"
    ) as facade_generate:
        response = client.post("/api/v1/decision/execute", json=VALID_REQUEST)
    assert response.status_code == 200
    generate_outcome.assert_not_called()
    facade_generate.assert_not_called()


def test_existing_route_still_uses_default_validation_behavior() -> None:
    response = client.post("/api/finance/analyze", json={"action_type": "invest"})
    assert response.status_code == 422
