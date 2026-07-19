"""Focused unit tests for OpenAIConversationProvider (P1-T04-03).

Mocks the OpenAI SDK. Does not call the real API.
"""

from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch

import pytest
from openai import OpenAIError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from services.generation.errors import (  # noqa: E402
    GenerationConfigurationError,
    GenerationProviderError,
)
from services.generation.factory import resolve_generation_provider  # noqa: E402
from services.generation.openai_provider import (  # noqa: E402
    OpenAIConversationProvider,
    map_generation_messages_to_openai,
    map_openai_completion_to_result,
)
from services.generation.ports import GenerationInput, GenerationMessage  # noqa: E402
from services.generation.prompt_builder import STATIC_CONVERSATIONAL_PROMPT  # noqa: E402
from services.generation.static_provider import StaticConversationProvider  # noqa: E402


def _sample_input(*, request_id: str = "req-openai-1") -> GenerationInput:
    return GenerationInput(
        request_id=request_id,
        messages=(
            GenerationMessage(role="user", content="Hello"),
            GenerationMessage(role="assistant", content="Hi there"),
            GenerationMessage(role="user", content="Continue"),
        ),
        locale="en",
        conversation_id="ignored",
    )


def test_openai_provider_construction_with_injected_client() -> None:
    client = MagicMock()
    provider = OpenAIConversationProvider(
        client=client,
        model="gpt-test-model",
        api_key="unused-when-client-injected",
    )
    assert isinstance(provider, OpenAIConversationProvider)


def test_injected_client_bypasses_sdk_construction() -> None:
    client = MagicMock()
    with patch("services.generation.openai_provider.OpenAI") as openai_cls:
        provider = OpenAIConversationProvider(client=client)
        openai_cls.assert_not_called()
    assert provider._client is client


def test_injected_client_does_not_require_api_key_or_timeout() -> None:
    client = MagicMock()
    with patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "",
    ), patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "not-a-number",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        provider = OpenAIConversationProvider(client=client)
        openai_cls.assert_not_called()
    assert provider._client is client


def test_openai_provider_construction_requires_api_key() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_API_KEY",
        "",
    ):
        with pytest.raises(GenerationConfigurationError):
            OpenAIConversationProvider(api_key="")


def test_sdk_constructor_receives_api_key_timeout_and_max_retries_zero() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "25.0",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        openai_cls.return_value = MagicMock()
        OpenAIConversationProvider(api_key="test-key")
        openai_cls.assert_called_once_with(
            api_key="test-key",
            timeout=25.0,
            max_retries=0,
        )


def test_sdk_constructor_uses_configured_timeout() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "12.5",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        openai_cls.return_value = MagicMock()
        OpenAIConversationProvider(api_key="test-key")
        assert openai_cls.call_args.kwargs["timeout"] == 12.5
        assert openai_cls.call_args.kwargs["api_key"] == "test-key"
        assert openai_cls.call_args.kwargs["max_retries"] == 0


@pytest.mark.parametrize(
    "invalid_timeout",
    ["0", "0.0", "-1", "-0.01", "abc", "", " ", "NaN"],
)
def test_invalid_timeout_rejected_without_leaking_raw_value(
    invalid_timeout: str,
) -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        invalid_timeout,
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        with pytest.raises(GenerationConfigurationError) as exc_info:
            OpenAIConversationProvider(api_key="test-key")
        openai_cls.assert_not_called()
    message = str(exc_info.value)
    assert invalid_timeout.strip() == "" or invalid_timeout not in message
    assert "OpenAI timeout configuration is invalid" in message


def test_zero_timeout_rejected() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "0",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        with pytest.raises(GenerationConfigurationError):
            OpenAIConversationProvider(api_key="test-key")
        openai_cls.assert_not_called()


def test_negative_timeout_rejected() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "-5",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        with pytest.raises(GenerationConfigurationError):
            OpenAIConversationProvider(api_key="test-key")
        openai_cls.assert_not_called()


def test_non_numeric_timeout_rejected() -> None:
    with patch(
        "services.generation.openai_provider.OPENAI_TIMEOUT_SECONDS",
        "twenty-five",
    ), patch("services.generation.openai_provider.OpenAI") as openai_cls:
        with pytest.raises(GenerationConfigurationError) as exc_info:
            OpenAIConversationProvider(api_key="test-key")
        openai_cls.assert_not_called()
    assert "twenty-five" not in str(exc_info.value)


def test_request_mapping_preserves_roles_and_uses_prompt_exactly() -> None:
    generation_input = _sample_input()
    messages = map_generation_messages_to_openai(
        generation_input,
        prompt=STATIC_CONVERSATIONAL_PROMPT,
    )
    assert messages[0] == {
        "role": "system",
        "content": STATIC_CONVERSATIONAL_PROMPT,
    }
    assert messages[1:] == [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"},
        {"role": "user", "content": "Continue"},
    ]


def test_response_mapping_to_generation_result() -> None:
    completion = MagicMock()
    completion.choices = [MagicMock()]
    completion.choices[0].message.content = "Assistant reply"

    result = map_openai_completion_to_result(
        completion,
        request_id="req-map-1",
    )
    assert result.response_type == "conversational"
    assert result.message == "Assistant reply"
    assert result.sources == ()
    assert result.request_id == "req-map-1"


def test_generate_maps_request_and_response_via_sdk_mock() -> None:
    client = MagicMock()
    completion = MagicMock()
    completion.choices = [MagicMock()]
    completion.choices[0].message.content = "Live assistant text"
    client.chat.completions.create.return_value = completion

    provider = OpenAIConversationProvider(client=client, model="gpt-test-model")
    generation_input = _sample_input(request_id="req-gen-1")
    result = provider.generate(
        generation_input,
        prompt=STATIC_CONVERSATIONAL_PROMPT,
    )

    assert result == map_openai_completion_to_result(
        completion,
        request_id="req-gen-1",
    )
    client.chat.completions.create.assert_called_once_with(
        model="gpt-test-model",
        messages=map_generation_messages_to_openai(
            generation_input,
            prompt=STATIC_CONVERSATIONAL_PROMPT,
        ),
    )


def test_sdk_exception_mapped_to_generation_provider_error() -> None:
    client = MagicMock()
    client.chat.completions.create.side_effect = OpenAIError("secret upstream detail")

    provider = OpenAIConversationProvider(client=client, model="gpt-test-model")
    with pytest.raises(GenerationProviderError) as exc_info:
        provider.generate(_sample_input(), prompt=STATIC_CONVERSATIONAL_PROMPT)

    assert "secret upstream detail" not in str(exc_info.value)
    assert isinstance(exc_info.value, GenerationProviderError)


def test_factory_resolves_openai_provider() -> None:
    with patch(
        "services.generation.factory.OpenAIConversationProvider"
    ) as provider_cls:
        provider_cls.return_value = MagicMock()
        resolved = resolve_generation_provider("openai")
        provider_cls.assert_called_once_with()
        assert resolved is provider_cls.return_value


def test_factory_static_provider_still_works() -> None:
    provider = resolve_generation_provider("static")
    assert isinstance(provider, StaticConversationProvider)
    result = provider.generate(
        _sample_input(request_id="req-static"),
        prompt=STATIC_CONVERSATIONAL_PROMPT,
    )
    assert result.response_type == "conversational"
    assert result.message == STATIC_CONVERSATIONAL_PROMPT
    assert result.sources == ()
    assert result.request_id == "req-static"
