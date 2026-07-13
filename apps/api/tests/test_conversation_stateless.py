"""P1-T02 stateless conversation processing tests (ADR-0007 Decision D2).

Acceptance is proven by public-surface behaviour only. These tests fail if an
implementation introduces cross-request conversational state, and remain valid
for any correct frozen-contract implementation.
"""

from __future__ import annotations

import os
import sys
from typing import Any

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

import services.conversation_boundary as conversation_boundary  # noqa: E402
from main import app  # noqa: E402
from schemas.conversation import ConversationRequest, ConversationResponse  # noqa: E402
from services.conversation_boundary import execute_conversation_boundary  # noqa: E402

client = TestClient(app)

EXECUTE_PATH = "/api/v1/conversation/execute"

CONTINUITY_FORBIDDEN_PHRASES = (
    "remember",
    "i recall",
    "from our previous",
    "continuing our",
    "as we discussed",
    "temporary memory",
    "session memory",
    "stored conversation",
    "previous conversation",
)

STATE_STORE_NAME_MARKERS = (
    "cache",
    "session",
    "conversation_store",
    "memory_store",
    "history_store",
    "conversation_history",
    "conversation_memory",
    "session_memory",
)


def _request(
    *,
    messages: list[dict[str, Any]],
    conversation_id: str | None = None,
    include_conversation_id: bool = False,
) -> ConversationRequest:
    payload: dict[str, Any] = {
        "locale": "en",
        "messages": messages,
    }
    if include_conversation_id or conversation_id is not None:
        payload["conversation_id"] = conversation_id
    return ConversationRequest.model_validate(payload)


def _public_contract_fields(response: ConversationResponse) -> dict[str, Any]:
    return {
        "type": response.type,
        "message": response.message,
        "reasoning": response.reasoning,
        "uncertainty": response.uncertainty,
        "sources": response.sources,
    }


def _assert_contract_equivalent_except_request_id(
    left: ConversationResponse,
    right: ConversationResponse,
) -> None:
    assert _public_contract_fields(left) == _public_contract_fields(right)


def _assert_http_contract_equivalent_except_request_id(
    left: dict[str, Any],
    right: dict[str, Any],
) -> None:
    left_fields = {
        "type": left["type"],
        "message": left["message"],
        "reasoning": left.get("reasoning"),
        "uncertainty": left.get("uncertainty"),
        "sources": left["sources"],
    }
    right_fields = {
        "type": right["type"],
        "message": right["message"],
        "reasoning": right.get("reasoning"),
        "uncertainty": right.get("uncertainty"),
        "sources": right["sources"],
    }
    assert left_fields == right_fields


def _assert_contract_valid(response: ConversationResponse) -> None:
    assert response.type in {"conversational", "decision"}
    assert isinstance(response.message, str) and response.message
    assert isinstance(response.request_id, str) and response.request_id
    assert isinstance(response.sources, list)
    if response.type == "decision":
        assert response.reasoning is not None
        assert response.uncertainty is not None


def test_boundary_module_has_no_mutable_conversation_state_store() -> None:
    for name in dir(conversation_boundary):
        if name.startswith("__"):
            continue
        value = getattr(conversation_boundary, name)
        lowered = name.lower()
        if any(marker in lowered for marker in STATE_STORE_NAME_MARKERS):
            raise AssertionError(
                f"Boundary module exposes conversation-state name {name!r}"
            )
        if isinstance(value, (dict, list, set)):
            raise AssertionError(
                f"Boundary module exposes writable store {name!r}={type(value).__name__}"
            )


def test_independent_boundary_invocations_remain_independent() -> None:
    first = execute_conversation_boundary(
        _request(
            messages=[
                {
                    "role": "user",
                    "content": "FIRST_REQUEST_SECRET_TOKEN independent boundary A",
                }
            ]
        ),
        request_id="rid-first",
    )
    second = execute_conversation_boundary(
        _request(
            messages=[
                {
                    "role": "user",
                    "content": "SECOND_REQUEST_SECRET_TOKEN independent boundary B",
                }
            ]
        ),
        request_id="rid-second",
    )

    _assert_contract_valid(first)
    _assert_contract_valid(second)
    assert first.request_id == "rid-first"
    assert second.request_id == "rid-second"
    assert "FIRST_REQUEST_SECRET_TOKEN" not in second.message
    assert "SECOND_REQUEST_SECRET_TOKEN" not in first.message
    assert "FIRST_REQUEST_SECRET_TOKEN" not in str(second.sources)
    assert "SECOND_REQUEST_SECRET_TOKEN" not in str(first.sources)


def test_shared_conversation_id_does_not_create_continuity() -> None:
    shared_id = "shared-id"
    first = execute_conversation_boundary(
        _request(
            messages=[
                {
                    "role": "user",
                    "content": "FIRST_REQUEST_SECRET_TOKEN for continuity falsification",
                }
            ],
            conversation_id=shared_id,
        ),
        request_id="rid-a",
    )
    second = execute_conversation_boundary(
        _request(
            messages=[
                {
                    "role": "user",
                    "content": "Second request history without the first token",
                }
            ],
            conversation_id=shared_id,
        ),
        request_id="rid-b",
    )
    control = execute_conversation_boundary(
        _request(
            messages=[
                {
                    "role": "user",
                    "content": "Second request history without the first token",
                }
            ],
            conversation_id="different-id",
        ),
        request_id="rid-c",
    )

    _assert_contract_valid(first)
    _assert_contract_valid(second)
    _assert_contract_valid(control)
    assert "FIRST_REQUEST_SECRET_TOKEN" not in second.message
    assert "FIRST_REQUEST_SECRET_TOKEN" not in str(second.model_dump())
    _assert_contract_equivalent_except_request_id(second, control)
    assert second.request_id != control.request_id


def test_http_shared_conversation_id_does_not_create_continuity() -> None:
    shared_id = "shared-http-id"
    first = client.post(
        EXECUTE_PATH,
        json={
            "locale": "en",
            "conversation_id": shared_id,
            "messages": [
                {
                    "role": "user",
                    "content": "FIRST_REQUEST_SECRET_TOKEN http continuity falsification",
                }
            ],
        },
    )
    second = client.post(
        EXECUTE_PATH,
        json={
            "locale": "en",
            "conversation_id": shared_id,
            "messages": [
                {
                    "role": "user",
                    "content": "HTTP second request history without the first token",
                }
            ],
        },
    )
    control = client.post(
        EXECUTE_PATH,
        json={
            "locale": "en",
            "messages": [
                {
                    "role": "user",
                    "content": "HTTP second request history without the first token",
                }
            ],
        },
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert control.status_code == 200

    body_first = first.json()
    body_second = second.json()
    body_control = control.json()

    assert isinstance(body_first.get("request_id"), str) and body_first["request_id"]
    assert isinstance(body_second.get("request_id"), str) and body_second["request_id"]
    assert isinstance(body_control.get("request_id"), str) and body_control["request_id"]
    assert body_second["request_id"] != body_control["request_id"]
    assert body_first["request_id"] != body_second["request_id"]

    assert body_second["type"] == "conversational"
    assert body_control["type"] == "conversational"
    assert isinstance(body_second.get("message"), str) and body_second["message"]
    assert isinstance(body_second.get("sources"), list)

    assert "FIRST_REQUEST_SECRET_TOKEN" not in body_second["message"]
    assert "FIRST_REQUEST_SECRET_TOKEN" not in str(body_second)
    _assert_http_contract_equivalent_except_request_id(body_second, body_control)


def test_fixed_public_response_does_not_imply_continuity() -> None:
    response = execute_conversation_boundary(
        _request(
            messages=[
                {"role": "user", "content": "Do you remember my last question?"},
            ]
        ),
        request_id="rid-no-memory-claim",
    )
    _assert_contract_valid(response)
    lowered = response.message.lower()
    for phrase in CONTINUITY_FORBIDDEN_PHRASES:
        assert phrase not in lowered
