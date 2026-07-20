"""Static in-process generation provider (no network, no SDKs).

Preserves the conversational user-facing message previously returned by the
static rollback path. Assembled Prompt Builder v2 text is intentionally not
echoed to clients.
"""

from __future__ import annotations

from services.generation.ports import GenerationInput, GenerationResult
from services.generation.prompt_builder import STATIC_CONVERSATIONAL_PROMPT


class StaticConversationProvider:
    """GenerationProvider that returns the fixed static conversational message."""

    provider_name = "static"
    model_name = "static"

    def generate(
        self,
        generation_input: GenerationInput,
        *,
        prompt: str,
    ) -> GenerationResult:
        _ = prompt
        _ = generation_input.messages
        _ = generation_input.locale
        _ = generation_input.conversation_id

        return GenerationResult(
            response_type="conversational",
            message=STATIC_CONVERSATIONAL_PROMPT,
            sources=(),
            request_id=generation_input.request_id,
        )
