"""P1-T03 history ownership and validation ceilings (ADR-0007 D5, D12).

Production ceilings and rejection behaviour are already implemented by P1-T01.
This module adds only the remaining public-surface proofs:

* accepted history is preserved without mutation
* Conversation and Decision validation errors share envelope structure
* exactly 20 messages are accepted (complements existing 21-reject coverage)
"""

from __future__ import annotations

import json
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from main import app  # noqa: E402
from schemas.conversation import MAX_CONVERSATION_MESSAGES  # noqa: E402
from services.conversation_request_acceptance import (  # noqa: E402
    AcceptedConversationRequest,
    accept_conversation_request_body,
)

client = TestClient(app)

CONVERSATION_EXECUTE_PATH = "/api/v1/conversation/execute"
DECISION_EXECUTE_PATH = "/api/v1/decision/execute"


def _raw(payload: dict) -> bytes:
    return json.dumps(payload, separators=(",", ":")).encode("utf-8")


def test_acceptance_preserves_message_order_and_content() -> None:
    messages = [
        {"role": "user", "content": "m1-unique-alpha-content"},
        {"role": "assistant", "content": "m2-unique-bravo-content"},
        {"role": "user", "content": "m3-unique-charlie-content"},
        {"role": "assistant", "content": "m4-unique-delta-content"},
        {"role": "user", "content": "m5-unique-echo-content"},
    ]
    result = accept_conversation_request_body(
        _raw({"locale": "en", "messages": messages}),
        request_id="rid-history-preserve",
    )
    assert isinstance(result, AcceptedConversationRequest)
    accepted = result.request.messages
    assert len(accepted) == len(messages)
    for original, accepted_message in zip(messages, accepted, strict=True):
        assert accepted_message.role == original["role"]
        assert accepted_message.content == original["content"]
    assert [m.role for m in accepted] == [m["role"] for m in messages]
    assert [m.content for m in accepted] == [m["content"] for m in messages]


def test_exactly_20_messages_are_accepted() -> None:
    messages = [
        {
            "role": "user" if i % 2 == 0 else "assistant",
            "content": f"ceiling-ok-{i}",
        }
        for i in range(MAX_CONVERSATION_MESSAGES)
    ]
    assert len(messages) == 20
    result = accept_conversation_request_body(
        _raw({"locale": "en", "messages": messages}),
        request_id="rid-exactly-20",
    )
    assert isinstance(result, AcceptedConversationRequest)
    assert len(result.request.messages) == 20
    assert [m.content for m in result.request.messages] == [
        f"ceiling-ok-{i}" for i in range(20)
    ]


def test_conversation_and_decision_validation_error_envelopes_are_structurally_aligned() -> None:
    conversation_response = client.post(
        CONVERSATION_EXECUTE_PATH,
        json={
            "locale": "zz",
            "messages": [{"role": "user", "content": "parity probe"}],
        },
    )
    decision_response = client.post(
        DECISION_EXECUTE_PATH,
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

    assert conversation_response.status_code == 400
    assert decision_response.status_code == 400

    conversation_payload = conversation_response.json()
    decision_payload = decision_response.json()

    assert set(conversation_payload.keys()) == set(decision_payload.keys()) == {"error"}
    assert set(conversation_payload["error"].keys()) == set(
        decision_payload["error"].keys()
    ) == {"code", "message", "requestId"}

    for payload in (conversation_payload, decision_payload):
        error = payload["error"]
        assert error["code"] == "VALIDATION_ERROR"
        assert isinstance(error["message"], str) and error["message"]
        assert isinstance(error["requestId"], str)
        assert "detail" not in payload
        assert "detail" not in error
        assert "correlation_id" not in payload
        assert "correlation_id" not in error
        body_text = json.dumps(payload).lower()
        assert "openai" not in body_text
        assert "anthropic" not in body_text
        assert "traceback" not in body_text
        assert "stack" not in body_text
