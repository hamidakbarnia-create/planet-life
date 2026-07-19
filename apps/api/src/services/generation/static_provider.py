"""Static in-process generation provider (no network, no SDKs).

Preserves the conversational behaviour previously returned directly by
``conversation_boundary`` before the provider abstraction was introduced.
"""

from __future__ import annotations

from services.generation.ports import GenerationInput, GenerationResult


class StaticConversationProvider:
    """GenerationProvider that echoes the assembled static prompt as the message."""

    def generate(
        self,
        generation_input: GenerationInput,
        *,
        prompt: str,
    ) -> GenerationResult:
        _ = generation_input.messages
        _ = generation_input.locale
        _ = generation_input.conversation_id

        return GenerationResult(
            response_type="conversational",
            message=prompt,
            sources=(),
            request_id=generation_input.request_id,
        )
