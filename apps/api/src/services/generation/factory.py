"""Resolve the configured conversation GenerationProvider.

Contains selection only — no provider business logic.
"""

from __future__ import annotations

from config.conversation_generation import CONVERSATION_GENERATION_PROVIDER
from services.generation.errors import GenerationConfigurationError
from services.generation.ports import GenerationProvider
from services.generation.static_provider import StaticConversationProvider

_STATIC_PROVIDER_KEY = "static"


def resolve_generation_provider(
    provider_key: str | None = None,
) -> GenerationProvider:
    """Return the GenerationProvider for the configured (or overridden) key."""
    key = provider_key if provider_key is not None else CONVERSATION_GENERATION_PROVIDER

    if key == _STATIC_PROVIDER_KEY:
        return StaticConversationProvider()

    raise GenerationConfigurationError(
        "Unsupported conversation generation provider configuration"
    )
