"""Deterministic SemanticExplanation renderer (Phase 3F1).

Copy infrastructure only. No Calendar / Ask / Compare / Find UI wiring.
No LLM. No network. Does not change scores, class, ranking, or commands.
"""

from __future__ import annotations

import re
from typing import Any, Literal, Mapping

from pydantic import BaseModel, ConfigDict, Field

from packages.decision_engine.i18n.catalog import (
    SUPPORTED_LOCALES,
    required_slots,
    template_for,
    text_direction,
)
from packages.decision_engine.semantic_explanation import SemanticExplanation

RENDER_SCHEMA_VERSION = "semantic_render.v1-shadow"
SEMANTIC_STATUS = "experimental_shadow"

UNAVAILABLE_UNSUPPORTED_LOCALE = "render.unsupported_locale"
UNAVAILABLE_MISSING_ENTRY = "render.missing_catalog_entry"
UNAVAILABLE_MISSING_ARGS = "render.missing_placeholder_args"
UNAVAILABLE_MALFORMED_TEMPLATE = "render.malformed_template"

_SLOT_RE = re.compile(r"\{([a-z][a-z0-9_]*)\}")
_UNSAFE_BRACE_RE = re.compile(r"[{}]")


class SemanticRenderError(ValueError):
    """Deterministic renderer failure (strict mode)."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}: {detail}")
        self.code = code
        self.detail = detail


class SemanticRenderContext(BaseModel):
    """Optional display labels. Never inferred from ranking."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    option_labels: dict[str, str] = Field(default_factory=dict)
    left_label: str | None = None
    right_label: str | None = None


class RenderedSemanticExplanation(BaseModel):
    """Localized copy slots. Not a command. Not a ranking."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal["semantic_render.v1-shadow"] = RENDER_SCHEMA_VERSION
    semantic_status: Literal["experimental_shadow"] = SEMANTIC_STATUS
    locale: str
    text_direction: Literal["ltr", "rtl"]
    status: Literal["ok", "unavailable"]
    unavailable_code: str | None = None
    headline: str | None = None
    summary: str | None = None
    opportunity: str | None = None
    posture: str | None = None
    tradeoff: str | None = None
    supports: tuple[str, ...] = ()
    cautions: tuple[str, ...] = ()
    safety: tuple[str, ...] = ()


def _sanitize_slot_value(value: Any) -> str:
    text = str(value).strip()
    return _UNSAFE_BRACE_RE.sub("", text)


def _as_explanation(
    explanation: SemanticExplanation | Mapping[str, Any],
) -> SemanticExplanation:
    if isinstance(explanation, SemanticExplanation):
        return explanation
    return SemanticExplanation.model_validate(dict(explanation))


def _as_context(
    display_context: SemanticRenderContext | Mapping[str, Any] | None,
) -> SemanticRenderContext:
    if display_context is None:
        return SemanticRenderContext()
    if isinstance(display_context, SemanticRenderContext):
        return display_context
    return SemanticRenderContext.model_validate(dict(display_context))


def _label_for(
    option_id: str | None,
    labels: Mapping[str, str],
) -> str | None:
    if not option_id:
        return None
    if option_id in labels and labels[option_id]:
        return _sanitize_slot_value(labels[option_id])
    return _sanitize_slot_value(option_id)


def build_named_slots(
    explanation: SemanticExplanation,
    display_context: SemanticRenderContext | None = None,
) -> dict[str, str]:
    """Named interpolation slots. Meaning is never positional."""
    ctx = display_context or SemanticRenderContext()
    args = explanation.localization_args or {}
    labels = dict(ctx.option_labels)
    left_id = args.get("left_id")
    right_id = args.get("right_id")
    if ctx.left_label and left_id:
        labels.setdefault(str(left_id), ctx.left_label)
    if ctx.right_label and right_id:
        labels.setdefault(str(right_id), ctx.right_label)

    left_id_s = str(left_id) if left_id else None
    right_id_s = str(right_id) if right_id else None
    left_label = _label_for(left_id_s, labels)
    right_label = _label_for(right_id_s, labels)

    def resolve(option_id: Any) -> str | None:
        if option_id is None or option_id == "":
            return None
        key = str(option_id)
        if key == left_id_s:
            return left_label
        if key == right_id_s:
            return right_label
        return _label_for(key, labels)

    slots: dict[str, str] = {}
    if left_label:
        slots["left_label"] = left_label
    if right_label:
        slots["right_label"] = right_label
    higher = resolve(args.get("score_preference"))
    cleaner = resolve(args.get("posture_preference"))
    if higher:
        slots["higher_score_option"] = higher
    if cleaner:
        slots["cleaner_posture_option"] = cleaner
        slots["option"] = cleaner
    return slots


def interpolate(template: str, slots: Mapping[str, str]) -> str:
    missing: list[str] = []

    def replace(match: re.Match[str]) -> str:
        name = match.group(1)
        if name not in slots or slots[name] == "":
            missing.append(name)
            return match.group(0)
        return slots[name]

    rendered = _SLOT_RE.sub(replace, template)
    if missing:
        raise SemanticRenderError(
            UNAVAILABLE_MISSING_ARGS,
            "missing named slots: " + ", ".join(sorted(set(missing))),
        )
    leftover = _SLOT_RE.findall(rendered)
    if leftover or "{" in rendered or "}" in rendered:
        raise SemanticRenderError(
            UNAVAILABLE_MALFORMED_TEMPLATE,
            f"unresolved placeholders in {template!r}",
        )
    return rendered


def _render_code(code: str | None, locale: str, slots: Mapping[str, str]) -> str | None:
    if not code:
        return None
    needed = required_slots(code)
    missing = [name for name in needed if not slots.get(name)]
    if missing:
        raise SemanticRenderError(
            UNAVAILABLE_MISSING_ARGS,
            f"{code} missing {missing}",
        )
    try:
        template = template_for(locale, code)
    except KeyError as exc:
        raise SemanticRenderError(UNAVAILABLE_MISSING_ENTRY, str(exc)) from exc
    return interpolate(template, slots)


def _unavailable(
    locale: str,
    code: str,
    *,
    strict: bool,
    detail: str,
) -> RenderedSemanticExplanation:
    if strict:
        raise SemanticRenderError(code, detail)
    direction: Literal["ltr", "rtl"]
    direction = "rtl" if text_direction(locale) == "rtl" else "ltr"
    return RenderedSemanticExplanation(
        locale=locale,
        text_direction=direction,
        status="unavailable",
        unavailable_code=code,
    )


def render_semantic_explanation(
    explanation: SemanticExplanation | Mapping[str, Any],
    locale: str,
    display_context: SemanticRenderContext | Mapping[str, Any] | None = None,
    *,
    strict: bool = True,
) -> RenderedSemanticExplanation:
    """Render codes to localized copy. Pure. Does not mutate explanation."""
    if locale not in SUPPORTED_LOCALES:
        return _unavailable(
            locale,
            UNAVAILABLE_UNSUPPORTED_LOCALE,
            strict=strict,
            detail=f"unsupported locale {locale!r}",
        )
    try:
        model = _as_explanation(explanation)
        context = _as_context(display_context)
        slots = build_named_slots(model, context)
        headline = _render_code(model.headline_code, locale, slots)
        summary = _render_code(model.summary_code, locale, slots)
        opportunity = _render_code(model.opportunity_code, locale, slots)
        posture = _render_code(model.posture_code, locale, slots)
        tradeoff = _render_code(model.tradeoff_code, locale, slots)
        supports = tuple(
            _render_code(code, locale, slots) or "" for code in model.support_codes
        )
        cautions = tuple(
            _render_code(code, locale, slots) or "" for code in model.caution_codes
        )
        safety = tuple(
            _render_code(code, locale, slots) or "" for code in model.safety_codes
        )
    except SemanticRenderError as exc:
        return _unavailable(locale, exc.code, strict=strict, detail=exc.detail)

    direction: Literal["ltr", "rtl"]
    direction = "rtl" if text_direction(locale) == "rtl" else "ltr"
    return RenderedSemanticExplanation(
        locale=locale,
        text_direction=direction,
        status="ok",
        headline=headline,
        summary=summary,
        opportunity=opportunity,
        posture=posture,
        tradeoff=tradeoff,
        supports=supports,
        cautions=cautions,
        safety=safety,
    )


__all__ = [
    "RENDER_SCHEMA_VERSION",
    "RenderedSemanticExplanation",
    "SEMANTIC_STATUS",
    "SemanticRenderContext",
    "SemanticRenderError",
    "build_named_slots",
    "interpolate",
    "render_semantic_explanation",
]
