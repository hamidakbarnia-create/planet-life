"""Ask generation pipeline orchestration (internal only).

Pipeline:
  Conversation → Intent Detection → Context Assembly → Grounding →
  Prompt Builder v2 → GenerationProvider → Response Validation →
  Conversation Response

Public Conversation API contracts are unchanged.
"""

from __future__ import annotations

import time

from services.generation.context_assembly import (
    ContextAssembler,
    DefaultContextAssembler,
)
from services.generation.errors import GenerationProviderError, GenerationValidationError
from services.generation.factory import resolve_generation_provider
from services.generation.grounding import DefaultGrounder, Grounder
from services.generation.intent import IntentDetector, RuleBasedIntentDetector
from services.generation.ports import GenerationInput, GenerationProvider, GenerationResult
from services.generation.prompt_builder import PromptBuilder, PromptBuilderPort
from services.generation.telemetry import (
    GenerationTelemetryEvent,
    ProviderTelemetryIdentity,
    TelemetryRecorder,
    get_default_telemetry_recorder,
    resolve_provider_identity,
)
from services.generation.validation import DefaultResponseValidator, ResponseValidator


class ConversationService:
    """Execute the internal Ask intelligence pipeline end-to-end."""

    def __init__(
        self,
        *,
        intent_detector: IntentDetector | None = None,
        context_assembler: ContextAssembler | None = None,
        grounder: Grounder | None = None,
        prompt_builder: PromptBuilderPort | None = None,
        provider: GenerationProvider | None = None,
        response_validator: ResponseValidator | None = None,
        telemetry_recorder: TelemetryRecorder | None = None,
    ) -> None:
        self._intent_detector = intent_detector or RuleBasedIntentDetector()
        self._context_assembler = context_assembler or DefaultContextAssembler()
        self._grounder = grounder or DefaultGrounder()
        self._prompt_builder = prompt_builder or PromptBuilder()
        self._provider = provider or resolve_generation_provider()
        self._response_validator = response_validator or DefaultResponseValidator()
        self._telemetry = telemetry_recorder or get_default_telemetry_recorder()

    def execute(self, generation_input: GenerationInput) -> GenerationResult:
        intent = self._intent_detector.detect(generation_input)
        assembled = self._context_assembler.assemble(generation_input)
        grounded = self._grounder.ground(assembled, intent=intent)
        built = self._prompt_builder.build(generation_input, grounded=grounded)

        identity = resolve_provider_identity(self._provider)
        started = time.perf_counter()
        try:
            raw_result = self._provider.generate(
                generation_input,
                prompt=built.text,
            )
        except GenerationProviderError:
            latency_ms = (time.perf_counter() - started) * 1000.0
            self._record_telemetry(
                identity=identity,
                latency_ms=latency_ms,
                prompt_version=built.prompt_version,
                request_id=generation_input.request_id,
            )
            raise
        except Exception as exc:
            latency_ms = (time.perf_counter() - started) * 1000.0
            self._record_telemetry(
                identity=identity,
                latency_ms=latency_ms,
                prompt_version=built.prompt_version,
                request_id=generation_input.request_id,
            )
            raise GenerationProviderError(
                "Conversation generation provider failed"
            ) from exc

        latency_ms = (time.perf_counter() - started) * 1000.0
        self._record_telemetry(
            identity=identity,
            latency_ms=latency_ms,
            prompt_version=built.prompt_version,
            request_id=generation_input.request_id,
        )

        try:
            return self._response_validator.validate(raw_result)
        except GenerationValidationError as exc:
            # Map into the existing provider-failure containment path.
            raise GenerationProviderError(str(exc)) from exc

    def _record_telemetry(
        self,
        *,
        identity: ProviderTelemetryIdentity,
        latency_ms: float,
        prompt_version: str,
        request_id: str,
    ) -> None:
        self._telemetry.record(
            GenerationTelemetryEvent(
                provider=identity.provider,
                model=identity.model,
                latency_ms=latency_ms,
                prompt_version=prompt_version,
                request_id=request_id,
            )
        )
