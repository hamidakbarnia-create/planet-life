"""Response validation stage for the Ask generation pipeline.

Validates provider output before it crosses the conversation boundary.
Failures are raised as existing generation error types.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from services.generation.errors import GenerationProviderError, GenerationValidationError
from services.generation.ports import GenerationResult

DEFAULT_MAX_RESPONSE_MESSAGE_CHARS = 16_384
_ALLOWED_RESPONSE_TYPES = frozenset({"decision", "conversational"})


@runtime_checkable
class ResponseValidator(Protocol):
    """Validate a generation result before returning it to the boundary."""

    def validate(self, result: GenerationResult) -> GenerationResult:
        """Return the result when valid; raise on failure."""


class DefaultResponseValidator:
    """Validate non-empty output, max length, and basic result shape."""

    def __init__(
        self,
        *,
        max_message_chars: int = DEFAULT_MAX_RESPONSE_MESSAGE_CHARS,
    ) -> None:
        self._max_message_chars = max_message_chars

    def validate(self, result: GenerationResult) -> GenerationResult:
        if not isinstance(result, GenerationResult):
            raise GenerationValidationError(
                "Conversation generation provider returned a malformed response"
            )

        if result.response_type not in _ALLOWED_RESPONSE_TYPES:
            raise GenerationValidationError(
                "Conversation generation provider returned a malformed response"
            )

        message = result.message
        if not isinstance(message, str) or not message.strip():
            raise GenerationValidationError(
                "Conversation generation provider returned an empty response"
            )

        if len(message) > self._max_message_chars:
            raise GenerationValidationError(
                "Conversation generation provider returned a response exceeding limits"
            )

        if not isinstance(result.request_id, str) or not result.request_id:
            raise GenerationValidationError(
                "Conversation generation provider returned a malformed response"
            )

        if result.response_type == "decision":
            if result.reasoning is None or result.uncertainty is None:
                raise GenerationValidationError(
                    "Conversation generation provider returned a malformed response"
                )

        if not isinstance(result.sources, tuple):
            raise GenerationValidationError(
                "Conversation generation provider returned a malformed response"
            )

        return result


def raise_as_provider_failure(exc: BaseException) -> None:
    """Normalize unexpected provider failures into ``GenerationProviderError``."""
    if isinstance(exc, GenerationProviderError):
        raise exc
    raise GenerationProviderError(
        "Conversation generation provider failed"
    ) from exc