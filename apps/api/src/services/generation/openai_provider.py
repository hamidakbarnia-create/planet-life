"""OpenAI GenerationProvider implementation (ADR-0007 D1).

Maps internal GenerationInput + PromptBuilder output to the OpenAI Chat
Completions API. Provider-specific details remain behind the generation port.
"""

from __future__ import annotations

import math
from typing import Any

from openai import OpenAI, OpenAIError

from config.conversation_generation import (
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_TIMEOUT_SECONDS,
)
from services.generation.errors import (
    GenerationConfigurationError,
    GenerationProviderError,
)
from services.generation.ports import GenerationInput, GenerationResult

_INVALID_TIMEOUT_MESSAGE = "OpenAI timeout configuration is invalid"


def _validated_timeout_seconds(configured: str) -> float:
    """Parse and validate timeout; never echo the configured value."""
    try:
        timeout = float(configured)
    except (TypeError, ValueError) as exc:
        raise GenerationConfigurationError(_INVALID_TIMEOUT_MESSAGE) from exc
    if not math.isfinite(timeout) or timeout <= 0:
        raise GenerationConfigurationError(_INVALID_TIMEOUT_MESSAGE)
    return timeout


def map_generation_messages_to_openai(
    generation_input: GenerationInput,
    *,
    prompt: str,
) -> list[dict[str, str]]:
    """Map PromptBuilder output and GenerationInput messages to OpenAI messages.

    PromptBuilder output is used exactly as the sole system message.
    Conversation messages preserve role and content with no other transforms.
    """
    messages: list[dict[str, str]] = [{"role": "system", "content": prompt}]
    messages.extend(
        {"role": message.role, "content": message.content}
        for message in generation_input.messages
    )
    return messages


def map_openai_completion_to_result(
    completion: Any,
    *,
    request_id: str,
) -> GenerationResult:
    """Map an OpenAI chat completion into an internal GenerationResult."""
    try:
        content = completion.choices[0].message.content
    except (AttributeError, IndexError, TypeError) as exc:
        raise GenerationProviderError(
            "Conversation generation provider failed"
        ) from exc

    if not isinstance(content, str) or not content:
        raise GenerationProviderError("Conversation generation provider failed")

    return GenerationResult(
        response_type="conversational",
        message=content,
        sources=(),
        request_id=request_id,
    )


class OpenAIConversationProvider:
    """GenerationProvider backed by the official OpenAI Python SDK."""

    def __init__(
        self,
        *,
        client: OpenAI | None = None,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        self._model = OPENAI_MODEL if model is None else model
        if client is not None:
            self._client = client
            return

        resolved_key = OPENAI_API_KEY if api_key is None else api_key
        if not resolved_key:
            raise GenerationConfigurationError(
                "OpenAI API key is not configured"
            )
        timeout = _validated_timeout_seconds(OPENAI_TIMEOUT_SECONDS)
        self._client = OpenAI(
            api_key=resolved_key,
            timeout=timeout,
            max_retries=0,
        )

    def generate(
        self,
        generation_input: GenerationInput,
        *,
        prompt: str,
    ) -> GenerationResult:
        _ = generation_input.locale
        _ = generation_input.conversation_id

        messages = map_generation_messages_to_openai(
            generation_input,
            prompt=prompt,
        )
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
            )
        except OpenAIError as exc:
            raise GenerationProviderError(
                "Conversation generation provider failed"
            ) from exc

        return map_openai_completion_to_result(
            completion,
            request_id=generation_input.request_id,
        )
