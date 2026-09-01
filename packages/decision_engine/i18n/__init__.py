"""Semantic localization catalogs (Phase 3F1). Copy infrastructure only."""

from packages.decision_engine.i18n.catalog import (
    REQUIRED_SLOTS,
    SUPPORTED_LOCALES,
    catalog_messages,
    emitted_semantic_codes,
    load_catalog,
    posture_term,
    text_direction,
)

__all__ = [
    "REQUIRED_SLOTS",
    "SUPPORTED_LOCALES",
    "catalog_messages",
    "emitted_semantic_codes",
    "load_catalog",
    "posture_term",
    "text_direction",
]
