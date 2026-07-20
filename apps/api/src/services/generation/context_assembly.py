"""Context assembly stage for the Ask generation pipeline.

Builds non-conversation model context from pluggable context providers.
Conversation history remains on ``GenerationInput.messages`` and is delivered
to the model via native user/assistant roles — it is not serialized into
grounding or the system prompt.

Retrieval is not implemented — placeholder providers reserve integration
points for Profile, Today, Calendar, World, and Vault.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable

from services.generation.ports import GenerationInput, GenerationMessage

# Message-derived sources must never be injected into grounding / system prompt.
MESSAGE_CONTEXT_SOURCES = frozenset({"conversation_history", "user_message"})


@dataclass(frozen=True)
class ContextFragment:
    """One named context contribution for grounding / prompt assembly."""

    source: str
    content: str


@dataclass(frozen=True)
class AssembledContext:
    """Assembled context prior to grounding.

    ``conversation_history`` and ``user_message`` are retained for pipeline
    inspection (e.g. intent already computed separately). They are not emitted
    as grounding fragments.
    """

    conversation_history: tuple[GenerationMessage, ...]
    user_message: str
    locale: str
    fragments: tuple[ContextFragment, ...]


@runtime_checkable
class ContextProvider(Protocol):
    """Provider interface for a single non-message context source."""

    @property
    def source_name(self) -> str:
        """Stable source identifier (e.g. ``profile``, ``world``)."""

    def provide(self, generation_input: GenerationInput) -> ContextFragment | None:
        """Return a fragment, or ``None`` when no content is available."""


@runtime_checkable
class ContextAssembler(Protocol):
    """Assemble non-message context; history remains on GenerationInput."""

    def assemble(self, generation_input: GenerationInput) -> AssembledContext:
        """Build assembled context for the current request."""


class PlaceholderContextProvider:
    """No-op context provider reserved for future retrieval integration."""

    def __init__(self, source_name: str) -> None:
        self._source_name = source_name

    @property
    def source_name(self) -> str:
        return self._source_name

    def provide(self, generation_input: GenerationInput) -> ContextFragment | None:
        _ = generation_input
        return None


def default_context_providers() -> tuple[ContextProvider, ...]:
    """Return P1 non-message context providers (placeholders until retrieval)."""
    return (
        PlaceholderContextProvider("profile"),
        PlaceholderContextProvider("today"),
        PlaceholderContextProvider("calendar"),
        PlaceholderContextProvider("world"),
        PlaceholderContextProvider("vault"),
    )


def _latest_user_message(generation_input: GenerationInput) -> str:
    for message in reversed(generation_input.messages):
        if message.role == "user":
            return message.content.strip()
    return ""


class DefaultContextAssembler:
    """Assemble non-message context; preserve history only for inspection."""

    def __init__(
        self,
        *,
        providers: tuple[ContextProvider, ...] | None = None,
    ) -> None:
        self._providers = providers if providers is not None else default_context_providers()

    def assemble(self, generation_input: GenerationInput) -> AssembledContext:
        fragments: list[ContextFragment] = []
        for provider in self._providers:
            if provider.source_name in MESSAGE_CONTEXT_SOURCES:
                # Defence in depth: never inject message-derived prompt text.
                continue
            fragment = provider.provide(generation_input)
            if fragment is None:
                continue
            if fragment.source in MESSAGE_CONTEXT_SOURCES:
                continue
            fragments.append(fragment)

        return AssembledContext(
            conversation_history=generation_input.messages,
            user_message=_latest_user_message(generation_input),
            locale=generation_input.locale,
            fragments=tuple(fragments),
        )
