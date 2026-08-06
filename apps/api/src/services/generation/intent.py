"""Intent detection stage for the Ask generation pipeline.

Rule-based classifier for P1. Isolated behind ``IntentDetector``.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal, Protocol, runtime_checkable

from services.generation.ports import GenerationInput

ConversationIntent = Literal[
    "advice",
    "planning",
    "explanation",
    "comparison",
    "brainstorming",
    "decision_support",
    "follow_up",
    "general_conversation",
]

_INTENT_VALUES: frozenset[str] = frozenset(
    {
        "advice",
        "planning",
        "explanation",
        "comparison",
        "brainstorming",
        "decision_support",
        "follow_up",
        "general_conversation",
    }
)


@dataclass(frozen=True)
class IntentDetectionResult:
    intent: ConversationIntent
    confidence: float


@runtime_checkable
class IntentDetector(Protocol):
    """Classify the user turn into a conversational intent."""

    def detect(self, generation_input: GenerationInput) -> IntentDetectionResult:
        """Return the detected intent for the current generation input."""


_COMPARISON_RE = re.compile(
    r"\b(compare|comparison|versus|vs\.?|difference between|better than)\b",
    re.IGNORECASE,
)
_PLANNING_RE = re.compile(
    r"\b(plan|planning|schedule|timeline|roadmap|organise|organize|steps to)\b",
    re.IGNORECASE,
)
_DECISION_RE = re.compile(
    r"\b(should i|which should|help me decide|decide between|recommend which)\b",
    re.IGNORECASE,
)
_ADVICE_RE = re.compile(
    r"\b(advice|advise me|suggest|recommendation|what should i|how should i)\b",
    re.IGNORECASE,
)
_BRAINSTORM_RE = re.compile(
    r"\b(brainstorm|ideas for|options for|come up with|possibilities)\b",
    re.IGNORECASE,
)
_EXPLANATION_RE = re.compile(
    r"\b(explain|what is|what are|how does|how do|why (is|are|do|does)|meaning of)\b",
    re.IGNORECASE,
)
_FOLLOW_UP_RE = re.compile(
    r"\b(also|and also|what about|how about|furthermore|additionally|"
    r"tell me more|go on|continue|and\?)\b",
    re.IGNORECASE,
)
_GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|thanks|thank you|ok|okay|yes|no|good morning|"
    r"good evening)\b[\s!.?]*$",
    re.IGNORECASE,
)


def _latest_user_content(generation_input: GenerationInput) -> str:
    for message in reversed(generation_input.messages):
        if message.role == "user":
            return message.content.strip()
    return ""


def _has_prior_assistant(generation_input: GenerationInput) -> bool:
    return any(message.role == "assistant" for message in generation_input.messages)


class RuleBasedIntentDetector:
    """Keyword/heuristic intent classifier sufficient for P1 infrastructure."""

    def detect(self, generation_input: GenerationInput) -> IntentDetectionResult:
        text = _latest_user_content(generation_input)
        if not text:
            return IntentDetectionResult(
                intent="general_conversation",
                confidence=0.4,
            )

        if _GREETING_RE.match(text):
            return IntentDetectionResult(intent="general_conversation", confidence=0.9)

        if _COMPARISON_RE.search(text):
            return IntentDetectionResult(intent="comparison", confidence=0.85)

        # Advice patterns (including "what/how should I") before bare "should I"
        # decision support, so general advice is not over-classified as decision.
        if _ADVICE_RE.search(text):
            return IntentDetectionResult(intent="advice", confidence=0.8)

        if _DECISION_RE.search(text):
            return IntentDetectionResult(intent="decision_support", confidence=0.85)

        if _PLANNING_RE.search(text):
            return IntentDetectionResult(intent="planning", confidence=0.8)

        if _BRAINSTORM_RE.search(text):
            return IntentDetectionResult(intent="brainstorming", confidence=0.8)

        if _EXPLANATION_RE.search(text):
            return IntentDetectionResult(intent="explanation", confidence=0.8)

        if _has_prior_assistant(generation_input) and (
            len(text) < 48 or _FOLLOW_UP_RE.search(text)
        ):
            return IntentDetectionResult(intent="follow_up", confidence=0.7)

        return IntentDetectionResult(intent="general_conversation", confidence=0.55)


def is_known_intent(value: str) -> bool:
    return value in _INTENT_VALUES
