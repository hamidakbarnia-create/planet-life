"""Contract-surface tests for Conversation API v1.0 (ADR-0007 + Amendment A1).

Provider-independent. No SDK mocks.
Authorised public route: POST /api/v1/conversation/execute.
"""

from __future__ import annotations

import json
import os
import sys
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from main import app  # noqa: E402
from schemas.conversation import (  # noqa: E402
    MAX_CONVERSATION_MESSAGES,
    MAX_REQUEST_PAYLOAD_BYTES,
    ConversationRequest,
    ConversationResponse,
)
from services.conversation_boundary import execute_conversation_boundary  # noqa: E402
from services.conversation_request_acceptance import (  # noqa: E402
    AcceptedConversationRequest,
    ConversationAcceptanceError,
    accept_conversation_request_body,
    generate_conversation_request_id,
)

client = TestClient(app)

VALID_REQUEST = {
    "locale": "en",
    "messages": [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"},
        {"role": "user", "content": "Can we continue?"},
    ],
}

EXECUTE_PATH = "/api/v1/conversation/execute"


def _raw(payload: dict | str) -> bytes:
    if isinstance(payload, str):
        return payload.encode("utf-8")
    return json.dumps(payload, separators=(",", ":")).encode("utf-8")


def _assert_error_envelope(payload: dict, *, request_id: str | None = None) -> None:
    assert "error" in payload
    error = payload["error"]
    assert isinstance(error.get("code"), str) and error["code"]
    assert isinstance(error.get("message"), str) and error["message"]
    assert "requestId" in error
    assert isinstance(error["requestId"], str) and error["requestId"]
    assert set(error.keys()) == {"code", "message", "requestId"}
    if request_id is not None:
        assert error["requestId"] == request_id


def test_conversation_request_must_not_require_client_request_id() -> None:
    parsed = ConversationRequest.model_validate(VALID_REQUEST)
    assert not hasattr(parsed, "request_id") or "request_id" not in ConversationRequest.model_fields
    assert "request_id" not in ConversationRequest.model_fields


def test_client_supplied_request_id_is_ignored_at_acceptance() -> None:
    body = {**VALID_REQUEST, "request_id": "client-supplied-must-be-ignored"}
    fixed_id = "server-owned-0001"
    result = accept_conversation_request_body(_raw(body), request_id=fixed_id)
    assert isinstance(result, AcceptedConversationRequest)
    assert result.request_id == fixed_id
    response = execute_conversation_boundary(result.request, request_id=result.request_id)
    assert response.request_id == fixed_id
    assert response.request_id != "client-supplied-must-be-ignored"


def test_server_generated_request_id_present_on_success() -> None:
    result = accept_conversation_request_body(_raw(VALID_REQUEST))
    assert isinstance(result, AcceptedConversationRequest)
    assert result.request_id
    response = execute_conversation_boundary(result.request, request_id=result.request_id)
    assert response.request_id == result.request_id
    assert response.type == "conversational"
    assert response.sources == []


def test_server_generated_request_id_consistent_on_validation_error() -> None:
    fixed_id = "server-owned-validation"
    result = accept_conversation_request_body(
        _raw({**VALID_REQUEST, "messages": [{"role": "system", "content": "x"}]}),
        request_id=fixed_id,
    )
    assert isinstance(result, ConversationAcceptanceError)
    assert result.status_code == 400
    assert result.code == "VALIDATION_ERROR"
    assert result.request_id == fixed_id
    envelope = result.to_envelope_dict()
    _assert_error_envelope(envelope, request_id=fixed_id)


def test_server_generated_request_id_consistent_on_oversized_body() -> None:
    fixed_id = "server-owned-oversize"
    raw = b"x" * (MAX_REQUEST_PAYLOAD_BYTES + 1)
    result = accept_conversation_request_body(raw, request_id=fixed_id)
    assert isinstance(result, ConversationAcceptanceError)
    assert result.request_id == fixed_id
    _assert_error_envelope(result.to_envelope_dict(), request_id=fixed_id)


def test_server_generated_request_id_consistent_on_malformed_json() -> None:
    fixed_id = "server-owned-malformed"
    result = accept_conversation_request_body(b"{not-json", request_id=fixed_id)
    assert isinstance(result, ConversationAcceptanceError)
    assert result.request_id == fixed_id
    _assert_error_envelope(result.to_envelope_dict(), request_id=fixed_id)


def test_generate_conversation_request_id_is_non_empty_product_owned() -> None:
    value = generate_conversation_request_id()
    assert isinstance(value, str) and value


def test_invalid_role_rejected() -> None:
    result = accept_conversation_request_body(
        _raw({**VALID_REQUEST, "messages": [{"role": "system", "content": "x"}]}),
        request_id="rid-role",
    )
    assert isinstance(result, ConversationAcceptanceError)
    assert result.code == "VALIDATION_ERROR"


@pytest.mark.parametrize("role", ["tool", "developer", "memory", "system"])
def test_unsupported_roles_rejected(role: str) -> None:
    result = accept_conversation_request_body(
        _raw({**VALID_REQUEST, "messages": [{"role": role, "content": "x"}]}),
        request_id="rid-roles",
    )
    assert isinstance(result, ConversationAcceptanceError)


def test_missing_content_rejected() -> None:
    result = accept_conversation_request_body(
        _raw({**VALID_REQUEST, "messages": [{"role": "user"}]}),
        request_id="rid-missing-content",
    )
    assert isinstance(result, ConversationAcceptanceError)


def test_more_than_20_messages_rejected() -> None:
    messages = [
        {"role": "user" if i % 2 == 0 else "assistant", "content": f"m{i}"}
        for i in range(MAX_CONVERSATION_MESSAGES + 1)
    ]
    result = accept_conversation_request_body(
        _raw({**VALID_REQUEST, "messages": messages}),
        request_id="rid-msg-ceiling",
    )
    assert isinstance(result, ConversationAcceptanceError)
    assert result.status_code == 400


def test_payload_exactly_32768_bytes_allowed() -> None:
    # Build a valid JSON body whose UTF-8 length is exactly the ceiling.
    prefix = b'{"locale":"en","messages":[{"role":"user","content":"'
    suffix = b'"}]}'
    filler_len = MAX_REQUEST_PAYLOAD_BYTES - len(prefix) - len(suffix)
    assert filler_len > 0
    raw = prefix + (b"a" * filler_len) + suffix
    assert len(raw) == MAX_REQUEST_PAYLOAD_BYTES
    result = accept_conversation_request_body(raw, request_id="rid-exact-ceiling")
    assert isinstance(result, AcceptedConversationRequest)
    assert result.request_id == "rid-exact-ceiling"


def test_payload_32769_bytes_rejected_before_parse() -> None:
    raw = b"{" + (b"a" * MAX_REQUEST_PAYLOAD_BYTES)  # 1 + 32768 = 32769 bytes
    assert len(raw) == MAX_REQUEST_PAYLOAD_BYTES + 1
    result = accept_conversation_request_body(raw, request_id="rid-over-by-one")
    assert isinstance(result, ConversationAcceptanceError)
    assert result.code == "VALIDATION_ERROR"
    assert result.request_id == "rid-over-by-one"
    # Must reject by size without depending on JSON validity.
    assert "must not exceed" in result.message


def test_oversized_valid_json_rejected_before_pydantic() -> None:
    content = "x" * (MAX_REQUEST_PAYLOAD_BYTES + 2048)
    raw = _raw({**VALID_REQUEST, "messages": [{"role": "user", "content": content}]})
    assert len(raw) > MAX_REQUEST_PAYLOAD_BYTES
    result = accept_conversation_request_body(raw, request_id="rid-over-valid-json")
    assert isinstance(result, ConversationAcceptanceError)
    assert "must not exceed" in result.message


def test_oversized_malformed_json_rejected_before_parse() -> None:
    raw = b"{not-json-" + (b"y" * MAX_REQUEST_PAYLOAD_BYTES)
    assert len(raw) > MAX_REQUEST_PAYLOAD_BYTES
    result = accept_conversation_request_body(raw, request_id="rid-over-malformed")
    assert isinstance(result, ConversationAcceptanceError)
    assert "must not exceed" in result.message


def test_size_check_uses_actual_body_not_content_length_header() -> None:
    """Acceptance API takes raw bytes only; misleading Content-Length cannot bypass it."""
    raw = b"x" * (MAX_REQUEST_PAYLOAD_BYTES + 10)
    result = accept_conversation_request_body(raw, request_id="rid-ignore-cl")
    assert isinstance(result, ConversationAcceptanceError)
    assert result.request_id == "rid-ignore-cl"


def test_absent_content_length_equivalent_raw_body_still_enforced() -> None:
    # No header exists at this boundary; empty and small bodies are size-checked by len(raw_body).
    result = accept_conversation_request_body(_raw(VALID_REQUEST), request_id="rid-no-cl")
    assert isinstance(result, AcceptedConversationRequest)


def test_conversation_id_optional_and_ignored_by_boundary() -> None:
    without = accept_conversation_request_body(_raw(VALID_REQUEST), request_id="a")
    with_id = accept_conversation_request_body(
        _raw({**VALID_REQUEST, "conversation_id": "reserved"}),
        request_id="b",
    )
    assert isinstance(without, AcceptedConversationRequest)
    assert isinstance(with_id, AcceptedConversationRequest)
    r1 = execute_conversation_boundary(without.request, request_id=without.request_id)
    r2 = execute_conversation_boundary(with_id.request, request_id=with_id.request_id)
    assert r1.type == r2.type == "conversational"
    assert r1.sources == r2.sources == []


def test_discriminator_decision_without_reasoning_rejected() -> None:
    with pytest.raises(ValidationError):
        ConversationResponse(
            type="decision",
            message="Wait",
            sources=[],
            request_id="r1",
            uncertainty="uncertain",
            reasoning=None,
        )


def test_discriminator_decision_without_uncertainty_rejected() -> None:
    with pytest.raises(ValidationError):
        ConversationResponse(
            type="decision",
            message="Wait",
            sources=[],
            request_id="r1",
            reasoning="because",
            uncertainty=None,
        )


def test_conversational_response_accepted() -> None:
    model = ConversationResponse(
        type="conversational",
        message="Hello",
        sources=[],
        request_id="r1",
    )
    assert model.type == "conversational"


def test_decision_with_required_fields_accepted() -> None:
    model = ConversationResponse(
        type="decision",
        message="Waiting may be preferable.",
        sources=[],
        request_id="r1",
        reasoning="Based on available timing context",
        uncertainty="Probabilistic assessment only",
    )
    assert model.reasoning and model.uncertainty


def test_error_envelope_matches_adr_shape() -> None:
    result = accept_conversation_request_body(
        _raw({**VALID_REQUEST, "locale": "zz"}),
        request_id="rid-envelope",
    )
    assert isinstance(result, ConversationAcceptanceError)
    payload = result.to_envelope_dict()
    assert set(payload.keys()) == {"error"}
    assert set(payload["error"].keys()) == {"code", "message", "requestId"}
    assert payload["error"]["code"] == "VALIDATION_ERROR"
    assert "detail" not in payload


# ── HTTP route (ADR-0007 Amendment A1) ───────────────────────────────────────


def test_conversation_execute_route_is_mounted() -> None:
    response = client.post(EXECUTE_PATH, json=VALID_REQUEST)
    assert response.status_code != 404


def test_valid_request_returns_http_200() -> None:
    response = client.post(EXECUTE_PATH, json=VALID_REQUEST)
    assert response.status_code == 200
    payload = response.json()
    assert payload["type"] == "conversational"
    assert isinstance(payload.get("request_id"), str) and payload["request_id"]
    assert payload.get("sources") == []
    assert isinstance(payload.get("message"), str) and payload["message"]


def test_http_response_discriminator_present() -> None:
    response = client.post(EXECUTE_PATH, json=VALID_REQUEST)
    assert response.status_code == 200
    assert response.json()["type"] == "conversational"


def test_http_server_generated_request_id_present() -> None:
    response = client.post(EXECUTE_PATH, json=VALID_REQUEST)
    assert response.status_code == 200
    request_id = response.json()["request_id"]
    assert isinstance(request_id, str) and request_id


def test_http_invalid_request_returns_contractual_400() -> None:
    response = client.post(
        EXECUTE_PATH,
        json={**VALID_REQUEST, "locale": "zz"},
    )
    assert response.status_code == 400
    payload = response.json()
    _assert_error_envelope(payload)
    assert payload["error"]["code"] == "VALIDATION_ERROR"


def test_http_raw_body_larger_than_32kib_returns_400() -> None:
    raw = b"x" * (MAX_REQUEST_PAYLOAD_BYTES + 1)
    response = client.post(
        EXECUTE_PATH,
        content=raw,
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400
    payload = response.json()
    _assert_error_envelope(payload)
    assert payload["error"]["code"] == "VALIDATION_ERROR"
    assert "must not exceed" in payload["error"]["message"]


def test_http_more_than_20_messages_returns_400() -> None:
    messages = [
        {"role": "user" if i % 2 == 0 else "assistant", "content": f"m{i}"}
        for i in range(MAX_CONVERSATION_MESSAGES + 1)
    ]
    response = client.post(
        EXECUTE_PATH,
        json={**VALID_REQUEST, "messages": messages},
    )
    assert response.status_code == 400
    payload = response.json()
    _assert_error_envelope(payload)
    assert payload["error"]["code"] == "VALIDATION_ERROR"


def test_http_invalid_role_returns_400() -> None:
    response = client.post(
        EXECUTE_PATH,
        json={**VALID_REQUEST, "messages": [{"role": "system", "content": "x"}]},
    )
    assert response.status_code == 400
    payload = response.json()
    _assert_error_envelope(payload)
    assert payload["error"]["code"] == "VALIDATION_ERROR"


def test_http_malformed_json_returns_400() -> None:
    response = client.post(
        EXECUTE_PATH,
        content=b"{not-json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400
    payload = response.json()
    _assert_error_envelope(payload)
    assert payload["error"]["code"] == "VALIDATION_ERROR"


def test_http_conversation_id_optional_does_not_alter_boundary_behaviour() -> None:
    without = client.post(EXECUTE_PATH, json=VALID_REQUEST)
    with_id = client.post(
        EXECUTE_PATH,
        json={**VALID_REQUEST, "conversation_id": "reserved"},
    )
    assert without.status_code == 200
    assert with_id.status_code == 200
    body_without = without.json()
    body_with = with_id.json()
    assert body_without["type"] == body_with["type"] == "conversational"
    assert body_without["sources"] == body_with["sources"] == []
    assert body_without["message"] == body_with["message"]


def test_conversation_chat_route_is_not_mounted() -> None:
    response = client.post("/api/v1/conversation/chat", json=VALID_REQUEST)
    assert response.status_code == 404


def test_decision_api_still_returns_locked_400_envelope() -> None:
    response = client.post(
        "/api/v1/decision/execute",
        json={
            "request_id": "career-focus-week:career_focus",
            "display_text": "x",
            "action_type": "career_focus",
            "guided_question_id": "career-focus-week",
            "category_id": "career-work",
            "needs_time": False,
            "locale": "zz",
            "profile": {
                "birth_date": "1990-06-15",
                "birth_time": "14:30",
                "location": "New York",
                "latitude": 40.7128,
                "longitude": -74.006,
                "action_type": "business_launch",
            },
        },
    )
    assert response.status_code == 400
    payload = response.json()
    _assert_error_envelope(payload, request_id="career-focus-week:career_focus")
    assert payload["error"]["code"] == "VALIDATION_ERROR"


def test_existing_route_still_uses_default_validation() -> None:
    response = client.post("/api/finance/analyze", json={"action_type": "invest"})
    assert response.status_code == 422


def test_conversation_openapi_has_no_422() -> None:
    schema = app.openapi()
    assert EXECUTE_PATH in schema["paths"]
    post = schema["paths"][EXECUTE_PATH]["post"]
    assert "422" not in post["responses"]


def test_conversation_openapi_documents_200_400_500() -> None:
    schema = app.openapi()
    responses = schema["paths"][EXECUTE_PATH]["post"]["responses"]
    assert "200" in responses
    assert "400" in responses
    assert "500" in responses
    assert "ConversationResponse" in responses["200"]["content"]["application/json"]["schema"]["$ref"]
    error_ref_400 = responses["400"]["content"]["application/json"]["schema"]["$ref"]
    error_ref_500 = responses["500"]["content"]["application/json"]["schema"]["$ref"]
    assert error_ref_400 == error_ref_500
    assert "ConversationApiErrorResponse" in error_ref_400


def test_http_boundary_exception_returns_500_envelope() -> None:
    secret = "sensitive-internal-detail-conversation-9a2f"
    with patch(
        "routes.conversation.execute_conversation_boundary",
        side_effect=RuntimeError(secret),
    ):
        response = client.post(EXECUTE_PATH, json=VALID_REQUEST)
    assert response.status_code == 500
    payload = response.json()
    body_text = response.text
    _assert_error_envelope(payload)
    assert payload["error"]["code"] == "INTERNAL_ERROR"
    assert payload["error"]["message"] == "Internal conversation execution failure"
    assert secret not in body_text
    assert "RuntimeError" not in body_text
