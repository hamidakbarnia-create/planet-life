"""Conversation generation orchestration between prompt assembly and provider."""

from __future__ import annotations

from services.generation.factory import resolve_generation_provider
from services.generation.ports import GenerationInput, GenerationProvider, GenerationResult
from services.generation.prompt_builder import PromptBuilder


class ConversationService:
    """Build prompt, resolve provider, execute generation, return result."""

    def __init__(
        self,
        *,
        prompt_builder: PromptBuilder | None = None,
        provider: GenerationProvider | None = None,
    ) -> None:
        self._prompt_builder = prompt_builder or PromptBuilder()
        self._provider = provider or resolve_generation_provider()

    def execute(self, generation_input: GenerationInput) -> GenerationResult:
        prompt = self._prompt_builder.build(generation_input)
        return self._provider.generate(generation_input, prompt=prompt)
