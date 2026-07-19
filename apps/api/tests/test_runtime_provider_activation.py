"""Focused tests for runtime conversation provider activation (P1-T05).

No live OpenAI API calls.
"""

from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from services.generation.errors import GenerationConfigurationError  # noqa: E402
from services.generation.factory import (  # noqa: E402
    resolve_generation_provider,
    validate_generation_provider_configuration,
)
from services.generation.openai_provider import OpenAIConversationProvider  # noqa: E402
from services.generation.ports import GenerationInput, GenerationMessage  # noqa: E402
from services.generation.prompt_builder import STATIC_CONVERSATIONAL_PROMPT  # noqa: E402
from services.generation.static_provider import StaticConversationProvider  # noqa: E402


def _sample_input(*, request_id: str = "req-runtime-1") -> GenerationInput:
    return GenerationInput(
        request_id=request_id,
        messages=(GenerationMessage(role="user", content="Hello"),),
        locale="en",
    )


def test_static_configuration_default_selection() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "static",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        provider = resolve_generation_provider()
        openai_cls.assert_not_called()
    assert isinstance(provider, StaticConversationProvider)
    result = provider.generate(
        _sample_input(),
        prompt=STATIC_CONVERSATIONAL_PROMPT,
    )
    assert result.message == STATIC_CONVERSATIONAL_PROMPT
    assert result.request_id == "req-runtime-1"


def test_static_configuration_requires_no_api_key() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "static",
    ), patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        provider = resolve_generation_provider()
        validate_generation_provider_configuration()
        openai_cls.assert_not_called()
    assert isinstance(provider, StaticConversationProvider)


def test_openai_configuration_selects_openai_provider() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "openai",
    ), patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "test-key",
    ), patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "25.0",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        openai_cls.return_value = MagicMock()
        provider = resolve_generation_provider()
        openai_cls.assert_called_once_with(
            api_key="test-key",
            timeout=25.0,
            max_retries=0,
        )
    assert isinstance(provider, OpenAIConversationProvider)


def test_unknown_provider_raises_generation_configuration_error() -> None:
    with pytest.raises(GenerationConfigurationError) as exc_info:
        resolve_generation_provider("not-a-provider")
    assert "Unsupported conversation generation provider configuration" in str(
        exc_info.value
    )


def test_unknown_provider_from_configured_key() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "anthropic",
    ):
        with pytest.raises(GenerationConfigurationError):
            validate_generation_provider_configuration()


def test_missing_api_key_for_openai_raises() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        with pytest.raises(GenerationConfigurationError) as exc_info:
            resolve_generation_provider("openai")
        openai_cls.assert_not_called()
    assert "OpenAI API key is not configured" in str(exc_info.value)


def test_invalid_timeout_for_openai_raises() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "test-key",
    ), patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "not-a-timeout",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        with pytest.raises(GenerationConfigurationError) as exc_info:
            resolve_generation_provider("openai")
        openai_cls.assert_not_called()
    message = str(exc_info.value)
    assert "not-a-timeout" not in message
    assert "OpenAI timeout configuration is invalid" in message


def test_provider_selection_explicit_override() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "openai",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        # Explicit static override must win over configured openai.
        provider = resolve_generation_provider("static")
        openai_cls.assert_not_called()
    assert isinstance(provider, StaticConversationProvider)


def test_validate_generation_provider_configuration_static_ok() -> None:
    with patch(
        "services.generation.factory.CONVERSATION_GENERATION_PROVIDER",
        "static",
    ):
        validate_generation_provider_configuration()
