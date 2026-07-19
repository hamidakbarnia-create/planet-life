"""Local HTTP envelope checks for OpenAI generation failure (P1-T06 negative path).

No live OpenAI API calls in this module.
Does not assert production OpenAI activation (production remains static until
operator Railway activation completes).
"""

from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from main import app  # noqa: E402
from services.generation.errors import (  # noqa: E402
    GenerationConfigurationError,
    GenerationProviderError,
)
from services.generation.factory import validate_generation_provider_configuration  # noqa: E402

EXECUTE_PATH = "/api/v1/conversation/execute"
VALID_REQUEST = {
    "messages": [{"role": "user", "content": "Hello"}],
    "locale": "en",
}


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_generation_provider_error_returns_public_500_envelope(client: TestClient) -> None:
    secret = "sk-proj-leaked-key-must-not-appear"
    with patch(
        "services.conversation_boundary.ConversationService.execute",
        side_effect=GenerationProviderError("Conversation generation provider failed"),
    ):
        response = client.post(EXECUTE_PATH, json=VALID_REQUEST)

    assert response.status_code == 500
    payload = response.json()
    assert set(payload.keys()) == {"error"}
    assert set(payload["error"].keys()) == {"code", "message", "requestId"}
    assert payload["error"]["code"] == "INTERNAL_ERROR"
    assert payload["error"]["message"] == "Internal conversation execution failure"
    assert payload["error"]["requestId"]
    body = response.text
    assert secret not in body
    assert "OpenAI" not in body
    assert "Traceback" not in body
    assert "GenerationProviderError" not in body


def test_startup_fails_fast_for_openai_without_api_key() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "openai",
    ), patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "",
    ):
        with pytest.raises(GenerationConfigurationError):
            validate_generation_provider_configuration()


def test_startup_succeeds_for_openai_with_local_client_construction_only() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "openai",
    ), patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "sk-local-config-only",
    ), patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "25.0",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        openai_cls.return_value = MagicMock()
        validate_generation_provider_configuration()
        openai_cls.assert_called_once()
        # No chat completion at validation time.
        assert not openai_cls.return_value.chat.completions.create.called
