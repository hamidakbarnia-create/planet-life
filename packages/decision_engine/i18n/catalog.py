"""Load semantic explanation catalogs. No English fallback across locales."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from packages.decision_engine import semantic_explanation as explanation_mod

SUPPORTED_LOCALES = ("en", "fa", "ar", "ru")
CATALOG_DIR = Path(__file__).resolve().parent / "catalogs"

# Named slots that must be present before interpolating a template.
# Locales share the same slot names so RTL copy does not encode meaning in order.
REQUIRED_SLOTS: dict[str, tuple[str, ...]] = {
    explanation_mod.CODE_HIGHER_SCORE_OPPORTUNITY: ("higher_score_option",),
    explanation_mod.CODE_CLEANER_POSTURE: ("option",),
    explanation_mod.CODE_LOWER_SCORE_CLEANER: ("cleaner_posture_option",),
    explanation_mod.CODE_MATERIAL_TRADEOFF: (
        "higher_score_option",
        "cleaner_posture_option",
    ),
    explanation_mod.CODE_NEAR_TIE_CLEANER: ("option",),
    explanation_mod.CODE_SCORE_CAUTION: ("higher_score_option",),
}

TEXT_DIRECTION = {
    "en": "ltr",
    "fa": "rtl",
    "ar": "rtl",
    "ru": "ltr",
}


def emitted_semantic_codes() -> tuple[str, ...]:
    codes = [
        value
        for name, value in vars(explanation_mod).items()
        if name.startswith("CODE_") and isinstance(value, str)
    ]
    return tuple(sorted(set(codes)))


def text_direction(locale: str) -> str:
    return TEXT_DIRECTION.get(locale, "ltr")


def _required_slots_for(code: str) -> tuple[str, ...]:
    return REQUIRED_SLOTS.get(code, ())


@lru_cache(maxsize=8)
def load_catalog(locale: str) -> dict[str, Any]:
    if locale not in SUPPORTED_LOCALES:
        raise KeyError(f"unsupported locale {locale!r}")
    path = CATALOG_DIR / f"{locale}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("locale") != locale:
        raise ValueError(f"catalog locale mismatch in {path.name}")
    messages = data.get("messages")
    if not isinstance(messages, dict) or not messages:
        raise ValueError(f"catalog {path.name} missing messages")
    return data


def catalog_messages(locale: str) -> dict[str, str]:
    messages = load_catalog(locale)["messages"]
    return {str(key): str(value) for key, value in messages.items()}


def posture_term(locale: str, posture_id: str) -> str:
    terms = load_catalog(locale).get("posture_terms") or {}
    term = terms.get(posture_id)
    if not isinstance(term, str) or not term.strip():
        raise KeyError(f"missing posture term {posture_id!r} for locale {locale}")
    return term


def template_for(locale: str, code: str) -> str:
    messages = catalog_messages(locale)
    template = messages.get(code)
    if not isinstance(template, str) or not template.strip():
        raise KeyError(f"missing catalog entry {code!r} for locale {locale}")
    return template


def required_slots(code: str) -> tuple[str, ...]:
    return _required_slots_for(code)


def assert_catalog_covers_emitted_codes() -> None:
    codes = emitted_semantic_codes()
    for locale in SUPPORTED_LOCALES:
        messages = catalog_messages(locale)
        missing = [code for code in codes if code not in messages]
        if missing:
            raise AssertionError(
                f"locale {locale} missing codes: {missing}"
            )


__all__ = [
    "REQUIRED_SLOTS",
    "SUPPORTED_LOCALES",
    "assert_catalog_covers_emitted_codes",
    "catalog_messages",
    "emitted_semantic_codes",
    "load_catalog",
    "posture_term",
    "required_slots",
    "template_for",
    "text_direction",
]
