"""Deterministic structural evaluator for Ask responses.

These checks are objective and non-LLM. Subjective quality remains in the
human / model-assisted scoring path and is never inferred here.
"""

from __future__ import annotations

import re
from collections import Counter

from evaluations.ask.models import (
    EvalScenario,
    StructuralCheckResult,
    StructuralEvaluation,
)
from services.generation.prompt_builder import STATIC_CONVERSATIONAL_PROMPT
from services.generation.validation import DEFAULT_MAX_RESPONSE_MESSAGE_CHARS

# Internal prompt / instruction leakage markers (Prompt Builder v2 + governance).
_PROMPT_LEAK_MARKERS = (
    "## System Role",
    "## User Context",
    "## Grounding Context",
    "## Reasoning Instructions",
    "## Response Requirements",
    'prompt_version = "v2"',
    "prompt_version =",
    "You are METIORO's conversational assistant",
)

_PLACEHOLDER_MARKERS = (
    "[profile]",
    "[today]",
    "[calendar]",
    "[world]",
    "[vault]",
    "(none)",
    "available_context",
)

_INSTRUCTION_LEAK_PATTERNS = (
    re.compile(r"\bsystem\s*prompt\b", re.IGNORECASE),
    re.compile(r"\bdeveloper\s*message\b", re.IGNORECASE),
    re.compile(r"\bignore\s+(all\s+)?previous\s+instructions\b", re.IGNORECASE),
    re.compile(r"\bas an? ai language model\b", re.IGNORECASE),
)

# Heuristic script ranges for broad locale matching (not full language ID).
_ARABIC_RE = re.compile(r"[\u0600-\u06FF]")
_CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")
_LATIN_RE = re.compile(r"[A-Za-z]")

# Characteristics that can be checked with lightweight heuristics.
_UNCERTAINTY_MARKERS = (
    "uncertain",
    "uncertainty",
    "not certain",
    "may ",
    "might ",
    "could ",
    "possibly",
    "unclear",
    "depends",
    "insufficient",
    "not enough",
    "نمی‌دانم",
    "ممکن",
    "احتمال",
    "غير مؤكد",
    "قد ",
    "возможно",
    "не уверен",
    "недостаточно",
)

_CITATION_RE = re.compile(
    r"\b(according to|source:|cited from|as reported by)\b",
    re.IGNORECASE,
)


class StructuralEvaluator:
    """Run deterministic structural checks against one Ask response."""

    def __init__(
        self,
        *,
        max_response_chars: int = DEFAULT_MAX_RESPONSE_MESSAGE_CHARS,
        expected_provider: str | None = None,
    ) -> None:
        self._max_response_chars = max_response_chars
        self._expected_provider = expected_provider

    def evaluate(
        self,
        scenario: EvalScenario,
        response: str | None,
        *,
        provider_error: str | None = None,
    ) -> StructuralEvaluation:
        checks: list[StructuralCheckResult] = []

        if provider_error is not None:
            checks.append(
                StructuralCheckResult(
                    check_id="provider_success",
                    passed=False,
                    detail=provider_error,
                )
            )
            return StructuralEvaluation(passed=False, checks=tuple(checks))

        text = response if isinstance(response, str) else ""

        checks.append(self._check_non_empty(text))
        checks.append(self._check_max_length(text))
        checks.append(self._check_locale(scenario.locale, text))
        checks.append(self._check_prompt_leakage(text))
        checks.append(self._check_placeholder_leakage(text))
        checks.append(self._check_instruction_leakage(text))
        checks.append(self._check_duplicate_paragraphs(text))
        checks.append(self._check_static_fallback(text))
        checks.append(self._check_unsupported_citations(text))
        checks.append(self._check_malformed(text))
        checks.append(self._check_forbidden_phrases(scenario, text))
        checks.extend(self._check_detectable_characteristics(scenario, text))

        passed = all(check.passed for check in checks)
        return StructuralEvaluation(passed=passed, checks=tuple(checks))

    def _check_non_empty(self, text: str) -> StructuralCheckResult:
        ok = bool(text.strip())
        return StructuralCheckResult(
            check_id="non_empty",
            passed=ok,
            detail="response has content" if ok else "response is empty",
        )

    def _check_max_length(self, text: str) -> StructuralCheckResult:
        ok = len(text) <= self._max_response_chars
        return StructuralCheckResult(
            check_id="max_length",
            passed=ok,
            detail=(
                f"length={len(text)} <= {self._max_response_chars}"
                if ok
                else f"length={len(text)} exceeds {self._max_response_chars}"
            ),
        )

    def _check_locale(self, locale: str, text: str) -> StructuralCheckResult:
        if not text.strip():
            return StructuralCheckResult(
                check_id="locale_match",
                passed=False,
                detail="cannot assess locale on empty response",
            )
        # Locale is input data; matching uses script heuristics only.
        if locale == "fa" or locale == "ar":
            ok = bool(_ARABIC_RE.search(text))
            detail = (
                "Arabic-script characters present"
                if ok
                else "expected Arabic-script characters for locale"
            )
        elif locale == "ru":
            ok = bool(_CYRILLIC_RE.search(text))
            detail = (
                "Cyrillic characters present"
                if ok
                else "expected Cyrillic characters for locale=ru"
            )
        else:
            # English and other Latin locales: require Latin letters; reject if
            # the response is overwhelmingly non-Latin with no Latin content.
            has_latin = bool(_LATIN_RE.search(text))
            mostly_other = bool(_ARABIC_RE.search(text) or _CYRILLIC_RE.search(text))
            ok = has_latin and not (mostly_other and not has_latin)
            detail = (
                "Latin characters present for locale=en"
                if ok
                else "expected Latin characters for locale=en"
            )
        return StructuralCheckResult(check_id="locale_match", passed=ok, detail=detail)

    def _check_prompt_leakage(self, text: str) -> StructuralCheckResult:
        hits = [marker for marker in _PROMPT_LEAK_MARKERS if marker in text]
        ok = not hits
        return StructuralCheckResult(
            check_id="no_prompt_leakage",
            passed=ok,
            detail="no prompt markers" if ok else f"leaked markers: {hits[:3]}",
        )

    def _check_placeholder_leakage(self, text: str) -> StructuralCheckResult:
        lower = text.lower()
        hits = [marker for marker in _PLACEHOLDER_MARKERS if marker.lower() in lower]
        ok = not hits
        return StructuralCheckResult(
            check_id="no_placeholder_leakage",
            passed=ok,
            detail="no placeholders" if ok else f"placeholder markers: {hits[:3]}",
        )

    def _check_instruction_leakage(self, text: str) -> StructuralCheckResult:
        hits = [
            pattern.pattern
            for pattern in _INSTRUCTION_LEAK_PATTERNS
            if pattern.search(text)
        ]
        ok = not hits
        return StructuralCheckResult(
            check_id="no_instruction_leakage",
            passed=ok,
            detail="no instruction leakage" if ok else f"patterns: {hits[:2]}",
        )

    def _check_duplicate_paragraphs(self, text: str) -> StructuralCheckResult:
        paragraphs = [
            part.strip()
            for part in re.split(r"\n\s*\n", text)
            if part.strip() and len(part.strip()) >= 40
        ]
        counts = Counter(paragraphs)
        duplicates = [para for para, count in counts.items() if count > 1]
        ok = not duplicates
        return StructuralCheckResult(
            check_id="no_duplicated_paragraphs",
            passed=ok,
            detail=(
                "no duplicated paragraphs"
                if ok
                else f"duplicated paragraphs: {len(duplicates)}"
            ),
        )

    def _check_static_fallback(self, text: str) -> StructuralCheckResult:
        if self._expected_provider != "openai":
            return StructuralCheckResult(
                check_id="no_static_fallback_for_openai",
                passed=True,
                detail="check skipped (provider is not openai)",
            )
        ok = text.strip() != STATIC_CONVERSATIONAL_PROMPT.strip()
        return StructuralCheckResult(
            check_id="no_static_fallback_for_openai",
            passed=ok,
            detail=(
                "response is not static fallback"
                if ok
                else "static-provider fallback text returned during openai evaluation"
            ),
        )

    def _check_unsupported_citations(self, text: str) -> StructuralCheckResult:
        # P1 sources remain empty; assertive external citations are structural fails.
        hit = _CITATION_RE.search(text)
        ok = hit is None
        return StructuralCheckResult(
            check_id="no_unsupported_citations",
            passed=ok,
            detail=(
                "no unsupported citation phrasing"
                if ok
                else f"citation-like phrasing: {hit.group(0)!r}"
            ),
        )

    def _check_malformed(self, text: str) -> StructuralCheckResult:
        if not text.strip():
            return StructuralCheckResult(
                check_id="not_malformed",
                passed=False,
                detail="empty response is malformed for evaluation",
            )
        # Unbalanced code fences or null-byte contamination.
        if "\x00" in text:
            return StructuralCheckResult(
                check_id="not_malformed",
                passed=False,
                detail="response contains null bytes",
            )
        fence_count = text.count("```")
        if fence_count % 2 != 0:
            return StructuralCheckResult(
                check_id="not_malformed",
                passed=False,
                detail="unbalanced markdown code fences",
            )
        return StructuralCheckResult(
            check_id="not_malformed",
            passed=True,
            detail="no structural malformation detected",
        )

    def _check_forbidden_phrases(
        self,
        scenario: EvalScenario,
        text: str,
    ) -> StructuralCheckResult:
        lower = text.lower()
        hits = [
            phrase
            for phrase in scenario.forbidden_phrases
            if phrase.lower() in lower
        ]
        # Also treat forbidden_characteristics strings as phrase checks when short.
        for item in scenario.forbidden_characteristics:
            if len(item) <= 48 and item.lower() in lower:
                hits.append(item)
        ok = not hits
        return StructuralCheckResult(
            check_id="no_forbidden_phrases",
            passed=ok,
            detail="no forbidden phrases" if ok else f"forbidden hits: {hits[:3]}",
        )

    def _check_detectable_characteristics(
        self,
        scenario: EvalScenario,
        text: str,
    ) -> list[StructuralCheckResult]:
        """Only score characteristics that are objectively detectable."""
        results: list[StructuralCheckResult] = []
        lower = text.lower()
        for characteristic in scenario.expected_characteristics:
            key = characteristic.strip().lower()
            if key in {
                "acknowledges uncertainty",
                "uncertainty aware",
                "acknowledges_uncertainty",
            }:
                ok = any(marker in lower for marker in _UNCERTAINTY_MARKERS)
                results.append(
                    StructuralCheckResult(
                        check_id="characteristic_uncertainty",
                        passed=ok,
                        detail=(
                            "uncertainty language present"
                            if ok
                            else "expected uncertainty acknowledgment not detected"
                        ),
                    )
                )
            elif key in {"non_empty", "direct"}:
                # Covered by non_empty / left to human scoring for "direct".
                continue
            # Other characteristics remain human-scored only.
        return results
