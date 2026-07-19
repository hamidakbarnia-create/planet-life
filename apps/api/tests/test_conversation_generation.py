"""Focused unit tests for internal conversation generation hardening (T04-02)."""

from __future__ import annotations

import os
import sys
from dataclasses import FrozenInstanceError
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from schemas.conversation import ConversationMessage, ConversationRequest  # noqa: E402
from services.conversation_boundary import execute_conversation_boundary  # noqa: E402
from services.generation.ports import (  # noqa: E402
    GenerationInput,
    GenerationMessage,
    GenerationResult,
)
from services.generation.prompt_builder import STATIC_CONVERSATIONAL_PROMPT  # noqa: E402
from services.generation.service import ConversationService  # noqa: E402

EXPECTED_MESSAGE = "Conversation request accepted under the P1 contract surface."


def _sample_input(*, request_id: str = "req-1") -> GenerationInput:
    return GenerationInput(
        request_id=request_id,
        messages=(GenerationMessage(role="user", content="Hello"),),
        locale="en",
    )


def test_generation_result_sources_default_to_immutable_empty_tuple() -> None:
    result = GenerationResult(response_type="conversational", message="ok")
    assert result.sources == ()
    assert isinstance(result.sources, tuple)
    with pytest.raises(AttributeError):
        result.sources.append("x")  # type: ignore[attr-defined]
    with pytest.raises(FrozenInstanceError):
        result.sources = ("x",)  # type: ignore[misc]


def test_conversation_service_uses_injected_provider() -> None:
    injected = MagicMock()
    injected.generate.return_value = GenerationResult(
        response_type="conversational",
        message="from-injected",
        sources=(),
        request_id="req-injected",
    )
    service = ConversationService(provider=injected)
    result = service.execute(_sample_input(request_id="req-injected"))

    assert result.message == "from-injected"
    assert result.request_id == "req-injected"
    injected.generate.assert_called_once()


def test_provider_resolution_occurs_at_construction_not_every_execute() -> None:
    resolved = MagicMock()
    resolved.generate.return_value = GenerationResult(
        response_type="conversational",
        message=EXPECTED_MESSAGE,
        sources=(),
        request_id="req-once",
    )
    with patch(
        "services.generation.service.resolve_generation_provider",
        return_value=resolved,
    ) as resolve:
        service = ConversationService()
        assert resolve.call_count == 1

        service.execute(_sample_input(request_id="req-once"))
        service.execute(_sample_input(request_id="req-once"))

        assert resolve.call_count == 1
        assert resolved.generate.call_count == 2


def test_boundary_emits_public_sources_list_and_preserves_message_request_id() -> None:
    request = ConversationRequest(
        locale="en",
        messages=[ConversationMessage(role="user", content="Hello")],
    )
    response = execute_conversation_boundary(request, request_id="server-owned-42")

    assert response.sources == []
    assert isinstance(response.sources, list)
    assert response.message == EXPECTED_MESSAGE
    assert response.message == STATIC_CONVERSATIONAL_PROMPT
    assert response.request_id == "server-owned-42"
    assert response.type == "conversational"
