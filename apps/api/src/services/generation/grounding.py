"""Grounding stage for the Ask generation pipeline.

Merges non-message context sources, drops empty sources, enforces size limits,
normalizes formatting, and prepares prompt input.

Conversation history is intentionally excluded: it is delivered to the model
via native ``GenerationInput.messages`` roles only.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Protocol, runtime_checkable

from services.generation.context_assembly import (
    MESSAGE_CONTEXT_SOURCES,
    AssembledContext,
    ContextFragment,
)
from services.generation.intent import ConversationIntent, IntentDetectionResult

# Internal grounding budgets (not public API ceilings).
DEFAULT_MAX_FRAGMENT_CHARS = 4_000
DEFAULT_MAX_TOTAL_CHARS = 12_000

_WHITESPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")


@dataclass(frozen=True)
class GroundedContext:
    """Normalized, size-bounded non-message context for Prompt Builder v2."""

    intent: ConversationIntent
    locale: str
    fragments: tuple[ContextFragment, ...]
    grounding_text: str


@runtime_checkable
class Grounder(Protocol):
    """Ground assembled context into prompt-ready input."""

    def ground(
        self,
        assembled: AssembledContext,
        *,
        intent: IntentDetectionResult,
    ) -> GroundedContext:
        """Merge, filter, and normalize non-message context for prompts."""


def _normalize_text(value: str) -> str:
    collapsed = _WHITESPACE_RE.sub(" ", value.replace("\r\n", "\n").replace("\r", "\n"))
    collapsed = _MULTI_NEWLINE_RE.sub("\n\n", collapsed)
    return collapsed.strip()


def _truncate(value: str, *, max_chars: int) -> str:
    if len(value) <= max_chars:
        return value
    if max_chars <= 1:
        return "…"
    return value[: max_chars - 1].rstrip() + "…"


class DefaultGrounder:
    """Ground only non-message contextual sources."""

    def __init__(
        self,
        *,
        max_fragment_chars: int = DEFAULT_MAX_FRAGMENT_CHARS,
        max_total_chars: int = DEFAULT_MAX_TOTAL_CHARS,
    ) -> None:
        self._max_fragment_chars = max_fragment_chars
        self._max_total_chars = max_total_chars

    def ground(
        self,
        assembled: AssembledContext,
        *,
        intent: IntentDetectionResult,
    ) -> GroundedContext:
        # Conversation history / latest user message are not grounded into the
        # system prompt; they travel via GenerationInput.messages instead.
        _ = assembled.conversation_history
        _ = assembled.user_message

        kept: list[ContextFragment] = []
        remaining = self._max_total_chars
        for fragment in assembled.fragments:
            if fragment.source in MESSAGE_CONTEXT_SOURCES:
                continue
            normalized = _normalize_text(fragment.content)
            if not normalized:
                continue
            clipped = _truncate(
                normalized,
                max_chars=min(self._max_fragment_chars, remaining),
            )
            if not clipped:
                continue
            kept.append(ContextFragment(source=fragment.source, content=clipped))
            remaining -= len(clipped)
            if remaining <= 0:
                break

        grounding_parts = [
            f"[{fragment.source}]\n{fragment.content}" for fragment in kept
        ]
        grounding_text = _truncate(
            _normalize_text("\n\n".join(grounding_parts)),
            max_chars=self._max_total_chars,
        )

        return GroundedContext(
            intent=intent.intent,
            locale=assembled.locale,
            fragments=tuple(kept),
            grounding_text=grounding_text,
        )
