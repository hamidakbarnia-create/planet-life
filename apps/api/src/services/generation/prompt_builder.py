"""Prompt assembly seam for conversation generation.

T04-02 returns only the current static conversational prompt.
No derived context, system-prompt loading, persistence, or prompt files.
"""

from __future__ import annotations

from services.generation.ports import GenerationInput

# Provisional brand-neutral copy (ADR-0007 D13.2 Voice Layer PENDING).
STATIC_CONVERSATIONAL_PROMPT = (
    "Conversation request accepted under the P1 contract surface."
)


class PromptBuilder:
    """Build the prompt string supplied to a GenerationProvider."""

    def build(self, generation_input: GenerationInput) -> str:
        # Input reserved for future governed prompt assembly (T05/T09/T10).
        _ = generation_input
        return STATIC_CONVERSATIONAL_PROMPT
