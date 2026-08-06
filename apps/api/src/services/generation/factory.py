"""Resolve the configured conversation GenerationProvider.

Contains selection only — no provider business logic.

OpenAI SDK construction occurs only when the ``openai`` provider is selected.
"""

from __future__ import annotations

from config.conversation_generation import CONVERSATION_GENERATION_PROVIDER
from services.generation.errors import GenerationConfigurationError
from services.generation.ports import GenerationProvider
from services.generation.static_provider import StaticConversationProvider

_STATIC_PROVIDER_KEY = "static"
_OPENAI_PROVIDER_KEY = "openai"


def resolve_generation_provider(
    provider_key: str | None = None,
) -> GenerationProvider:
    """Return the GenerationProvider for the configured (or overridden) key.

    Raises ``GenerationConfigurationError`` for an unknown provider name or when
    the selected provider's required configuration is invalid (for example,
    ``openai`` without an API key or with an invalid timeout).
    """
    key = provider_key if provider_key is not None else CONVERSATION_GENERATION_PROVIDER

    if key == _STATIC_PROVIDER_KEY:
        return StaticConversationProvider()

    if key == _OPENAI_PROVIDER_KEY:
        # Lazy import: static mode must not construct (or require) the OpenAI SDK.
        from services.generation.openai_provider import OpenAIConversationProvider

        return OpenAIConversationProvider()

    raise GenerationConfigurationError(
        "Unsupported conversation generation provider configuration"
    )


def validate_generation_provider_configuration(
    provider_key: str | None = None,
) -> None:
    """Fail fast on invalid provider selection or provider configuration."""
    resolve_generation_provider(provider_key)
