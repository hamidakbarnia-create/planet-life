"""Provider-agnostic generation port and internal DTOs (ADR-0007 D1).

MUST NOT import FastAPI, public Conversation HTTP schemas, or vendor SDKs.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Protocol, runtime_checkable

GenerationResponseType = Literal["decision", "conversational"]


@dataclass(frozen=True)
class GenerationMessage:
    role: str
    content: str


@dataclass(frozen=True)
class GenerationInput:
    """Internal generation request assembled at the conversation boundary."""

    request_id: str
    messages: tuple[GenerationMessage, ...]
    locale: str
    conversation_id: str | None = None


@dataclass(frozen=True)
class GenerationResult:
    """Internal generation result mapped to ConversationResponse at the boundary."""

    response_type: GenerationResponseType
    message: str
    sources: tuple[Any, ...] = field(default_factory=tuple)
    request_id: str = ""
    reasoning: str | None = None
    uncertainty: str | None = None


@runtime_checkable
class GenerationProvider(Protocol):
    """Internal provider-agnostic generation interface."""

    def generate(
        self,
        generation_input: GenerationInput,
        *,
        prompt: str,
    ) -> GenerationResult:
        """Produce a generation result from input and an assembled prompt."""
...
