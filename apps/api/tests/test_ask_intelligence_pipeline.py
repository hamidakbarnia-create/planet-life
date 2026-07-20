"""Unit tests for Ask Intelligence Architecture (P1-T05-01 / P1-T05-01A).

Covers intent, context assembly, grounding, prompt v2, validation, telemetry,
no prompt/history duplication, and public API compatibility.
No live provider calls.
"""

from __future__ import annotations

import os
import sys
from collections import Counter
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from schemas.conversation import ConversationMessage, ConversationRequest  # noqa: E402
from services.conversation_boundary import execute_conversation_boundary  # noqa: E402
from services.generation.context_assembly import (  # noqa: E402
    AssembledContext,
    ContextFragment,
    DefaultContextAssembler,
    PlaceholderContextProvider,
)
from services.generation.errors import (  # noqa: E402
    GenerationProviderError,
    GenerationValidationError,
)
from services.generation.grounding import DefaultGrounder  # noqa: E402
from services.generation.intent import (  # noqa: E402
    IntentDetectionResult,
    RuleBasedIntentDetector,
    is_known_intent,
)
from services.generation.openai_provider import map_generation_messages_to_openai  # noqa: E402
from services.generation.ports import (  # noqa: E402
    GenerationInput,
    GenerationMessage,
    GenerationResult,
)
from services.generation.prompt_builder import (  # noqa: E402
    PROMPT_VERSION_V2,
    STATIC_CONVERSATIONAL_PROMPT,
    PromptBuilder,
)
from services.generation.service import ConversationService  # noqa: E402
from services.generation.static_provider import StaticConversationProvider  # noqa: E402
from services.generation.telemetry import (  # noqa: E402
    InMemoryTelemetryRecorder,
    resolve_provider_identity,
)
from services.generation.validation import DefaultResponseValidator  # noqa: E402


def _input(
    *contents: str,
    locale: str = "en",
    request_id: str = "req-ask-1",
    with_assistant: str | None = None,
) -> GenerationInput:
    messages: list[GenerationMessage] = []
    if with_assistant is not None:
        messages.append(GenerationMessage(role="user", content="earlier"))
        messages.append(GenerationMessage(role="assistant", content=with_assistant))
    for content in contents:
        messages.append(GenerationMessage(role="user", content=content))
    return GenerationInput(
        request_id=request_id,
        messages=tuple(messages),
        locale=locale,
    )


def _multi_turn_input() -> GenerationInput:
    return GenerationInput(
        request_id="req-multi",
        locale="en",
        messages=(
            GenerationMessage(role="user", content="Hello"),
            GenerationMessage(role="assistant", content="Hi there"),
            GenerationMessage(role="user", content="Explain gravity"),
        ),
    )


def _build_system_prompt(generation_input: GenerationInput) -> str:
    assembled = DefaultContextAssembler().assemble(generation_input)
    grounded = DefaultGrounder().ground(
        assembled,
        intent=RuleBasedIntentDetector().detect(generation_input),
    )
    return PromptBuilder().build(generation_input, grounded=grounded).text


# --- Intent detection ---


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("What should I do about this?", "advice"),
        ("Help me plan my week", "planning"),
        ("Explain what Mercury retrograde means", "explanation"),
        ("Compare option A vs option B", "comparison"),
        ("Brainstorm ideas for a side project", "brainstorming"),
        ("Should I take the job offer?", "decision_support"),
        ("Hello", "general_conversation"),
    ],
)
def test_intent_detection_rules(text: str, expected: str) -> None:
    result = RuleBasedIntentDetector().detect(_input(text))
    assert result.intent == expected
    assert is_known_intent(result.intent)


def test_intent_detection_follow_up_with_history() -> None:
    result = RuleBasedIntentDetector().detect(
        _input("what about timing?", with_assistant="Here is a thought.")
    )
    assert result.intent == "follow_up"


# --- Context assembly ---


def test_context_assembly_inspects_history_without_message_fragments() -> None:
    assembler = DefaultContextAssembler()
    assembled = assembler.assemble(
        _input("Hello there", with_assistant="Hi"),
    )
    sources = {fragment.source for fragment in assembled.fragments}
    assert assembled.user_message == "Hello there"
    assert assembled.conversation_history[-1].content == "Hello there"
    assert assembled.locale == "en"
    # Message-derived sources must not become grounding fragments.
    assert "conversation_history" not in sources
    assert "user_message" not in sources
    # Empty placeholders must not appear.
    assert "profile" not in sources
    assert "today" not in sources
    assert "calendar" not in sources
    assert "world" not in sources
    assert "vault" not in sources
    assert assembled.fragments == ()


def test_placeholder_context_provider_returns_none() -> None:
    provider = PlaceholderContextProvider("world")
    assert provider.source_name == "world"
    assert provider.provide(_input("hi")) is None


# --- Grounding ---


def test_grounding_handles_only_non_message_sources() -> None:
    assembled = AssembledContext(
        conversation_history=(
            GenerationMessage(role="user", content="  Hello   world  "),
        ),
        user_message="  Hello   world  ",
        locale="en",
        fragments=(
            ContextFragment(source="conversation_history", content="user: Hello"),
            ContextFragment(source="user_message", content="Hello world"),
            ContextFragment(source="profile", content=""),
            ContextFragment(source="world", content="  news   item  "),
            ContextFragment(source="vault", content="   "),
        ),
    )
    grounded = DefaultGrounder().ground(
        assembled,
        intent=IntentDetectionResult(intent="general_conversation", confidence=0.5),
    )
    assert [fragment.source for fragment in grounded.fragments] == ["world"]
    assert "news item" in grounded.grounding_text
    assert "profile" not in grounded.grounding_text
    assert "vault" not in grounded.grounding_text
    assert "Hello world" not in grounded.grounding_text
    assert "user: Hello" not in grounded.grounding_text


def test_grounding_enforces_size_limits() -> None:
    assembled = AssembledContext(
        conversation_history=(GenerationMessage(role="user", content="x" * 50),),
        user_message="x" * 50,
        locale="en",
        fragments=(
            ContextFragment(source="world", content="W" * 500),
        ),
    )
    grounded = DefaultGrounder(max_fragment_chars=20, max_total_chars=40).ground(
        assembled,
        intent=IntentDetectionResult(intent="explanation", confidence=0.8),
    )
    assert len(grounded.grounding_text) <= 40
    assert grounded.fragments[0].content.endswith("…")


# --- Prompt Builder v2 / no duplication ---


def test_prompt_builder_v2_structured_sections_without_conversation_copy() -> None:
    generation_input = _multi_turn_input()
    prompt = _build_system_prompt(generation_input)

    assert 'prompt_version = "v2"' in prompt
    assert PromptBuilder.prompt_version == PROMPT_VERSION_V2
    for section in (
        "## System Role",
        "## User Context",
        "## Grounding Context",
        "## Reasoning Instructions",
        "## Response Requirements",
    ):
        assert section in prompt
    assert "## Conversation" not in prompt
    assert "intent: explanation" in prompt
    # Conversation contents must not be embedded in the system prompt.
    assert "Hello" not in prompt
    assert "Hi there" not in prompt
    assert "Explain gravity" not in prompt
    assert "latest_user_message" not in prompt
    assert "user:" not in prompt
    assert "assistant:" not in prompt


def test_provider_messages_preserve_roles_order_and_single_occurrence() -> None:
    generation_input = _multi_turn_input()
    system_prompt = _build_system_prompt(generation_input)
    messages = map_generation_messages_to_openai(
        generation_input,
        prompt=system_prompt,
    )

    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == system_prompt
    conversation = messages[1:]
    assert conversation == [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"},
        {"role": "user", "content": "Explain gravity"},
    ]

    role_counts = Counter(item["role"] for item in conversation)
    assert role_counts["user"] == 2
    assert role_counts["assistant"] == 1

    user_contents = [item["content"] for item in conversation if item["role"] == "user"]
    assistant_contents = [
        item["content"] for item in conversation if item["role"] == "assistant"
    ]
    assert user_contents.count("Hello") == 1
    assert user_contents.count("Explain gravity") == 1
    assert assistant_contents.count("Hi there") == 1
    assert user_contents[-1] == "Explain gravity"
    assert "".join(user_contents).count("Explain gravity") == 1
    # Latest user message appears once across the full provider payload.
    full_blob = "\n".join(item["content"] for item in messages)
    assert full_blob.count("Explain gravity") == 1
    assert full_blob.count("Hello") == 1
    assert full_blob.count("Hi there") == 1


def test_pipeline_passes_system_prompt_and_preserves_input_messages() -> None:
    provider = MagicMock()
    provider.provider_name = "openai"
    provider.model_name = "gpt-test"
    provider.generate.return_value = GenerationResult(
        response_type="conversational",
        message="generated",
        sources=(),
        request_id="req-prompt",
    )
    generation_input = _multi_turn_input()
    service = ConversationService(
        provider=provider,
        telemetry_recorder=InMemoryTelemetryRecorder(),
    )
    result = service.execute(generation_input)
    assert result.message == "generated"

    args, kwargs = provider.generate.call_args
    assert args[0] is generation_input
    assert args[0].messages == generation_input.messages
    prompt = kwargs["prompt"]
    assert "## System Role" in prompt
    assert 'prompt_version = "v2"' in prompt
    assert "## Reasoning Instructions" in prompt
    assert "## Response Requirements" in prompt
    assert "intent:" in prompt
    assert "## Conversation" not in prompt
    for content in ("Hello", "Hi there", "Explain gravity"):
        assert content not in prompt


def test_empty_placeholders_absent_from_prompt_and_grounding() -> None:
    generation_input = _input("Hello")
    assembled = DefaultContextAssembler().assemble(generation_input)
    grounded = DefaultGrounder().ground(
        assembled,
        intent=IntentDetectionResult(intent="general_conversation", confidence=0.5),
    )
    prompt = PromptBuilder().build(generation_input, grounded=grounded).text
    assert grounded.fragments == ()
    assert grounded.grounding_text == ""
    assert "[profile]" not in prompt
    assert "[today]" not in prompt
    assert "[calendar]" not in prompt
    assert "[world]" not in prompt
    assert "[vault]" not in prompt
    assert "## Grounding Context\n(none)" in prompt


# --- Validation ---


def test_response_validation_accepts_valid_result() -> None:
    result = GenerationResult(
        response_type="conversational",
        message="Hello",
        sources=(),
        request_id="req-1",
    )
    assert DefaultResponseValidator().validate(result) is result


def test_response_validation_rejects_empty_message() -> None:
    with pytest.raises(GenerationValidationError):
        DefaultResponseValidator().validate(
            GenerationResult(
                response_type="conversational",
                message="   ",
                sources=(),
                request_id="req-1",
            )
        )


def test_response_validation_rejects_overlong_message() -> None:
    with pytest.raises(GenerationValidationError):
        DefaultResponseValidator(max_message_chars=8).validate(
            GenerationResult(
                response_type="conversational",
                message="0123456789",
                sources=(),
                request_id="req-1",
            )
        )


def test_response_validation_rejects_malformed_decision() -> None:
    with pytest.raises(GenerationValidationError):
        DefaultResponseValidator().validate(
            GenerationResult(
                response_type="decision",
                message="Do it",
                sources=(),
                request_id="req-1",
                reasoning=None,
                uncertainty=None,
            )
        )


def test_pipeline_maps_validation_failure_to_provider_error() -> None:
    provider = MagicMock()
    provider.provider_name = "static"
    provider.model_name = "static"
    provider.generate.return_value = GenerationResult(
        response_type="conversational",
        message="",
        sources=(),
        request_id="req-empty",
    )
    service = ConversationService(
        provider=provider,
        telemetry_recorder=InMemoryTelemetryRecorder(),
    )
    with pytest.raises(GenerationProviderError):
        service.execute(_input("hi", request_id="req-empty"))


# --- Telemetry ---


def test_telemetry_records_provider_model_latency_prompt_version() -> None:
    provider = MagicMock()
    provider.provider_name = "openai"
    provider.model_name = "gpt-test"
    provider.generate.return_value = GenerationResult(
        response_type="conversational",
        message="ok",
        sources=(),
        request_id="req-tel",
    )
    recorder = InMemoryTelemetryRecorder()
    service = ConversationService(provider=provider, telemetry_recorder=recorder)
    service.execute(_input("hi", request_id="req-tel"))

    event = recorder.last_event
    assert event is not None
    assert event.provider == "openai"
    assert event.model == "gpt-test"
    assert event.prompt_version == "v2"
    assert event.request_id == "req-tel"
    assert event.latency_ms >= 0.0


def test_resolve_provider_identity_defaults() -> None:
    identity = resolve_provider_identity(object())
    assert identity.provider == "unknown"
    assert identity.model == "unknown"


# --- API compatibility / static rollback ---


def test_public_api_compatibility_static_message_unchanged() -> None:
    request = ConversationRequest(
        locale="en",
        messages=[ConversationMessage(role="user", content="Hello")],
    )
    response = execute_conversation_boundary(request, request_id="compat-1")
    assert response.message == STATIC_CONVERSATIONAL_PROMPT
    assert response.type == "conversational"
    assert response.sources == []
    assert response.request_id == "compat-1"
    assert not hasattr(response, "prompt_version")
    assert "prompt_version" not in ConversationRequest.model_fields
    dumped = response.model_dump()
    assert set(dumped.keys()) == {
        "type",
        "message",
        "sources",
        "request_id",
        "reasoning",
        "uncertainty",
    }


def test_static_provider_does_not_leak_internal_prompt() -> None:
    internal_prompt = _build_system_prompt(_multi_turn_input())
    assert "## System Role" in internal_prompt
    result = StaticConversationProvider().generate(
        _multi_turn_input(),
        prompt=internal_prompt,
    )
    assert result.message == STATIC_CONVERSATIONAL_PROMPT
    assert result.message != internal_prompt
    assert "## System Role" not in result.message
    assert "prompt_version" not in result.message
