"""Strict Decision Type Registry loader for EPIC-001 E2.

Canonical records live only in ``decision_types.v1.json``.

This module owns registry loading, integrity validation, read-only lookup, and
the existing E5 create-authority compatibility seam. It does not implement
intake execution, classification, HTTP, persistence, or lifecycle behavior.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from types import MappingProxyType
from typing import Any, Final, Mapping

from pydantic import ValidationError

from packages.decision_engine.registry.schema import (
    DecisionTypeRecord,
    DecisionTypeRegistry,
    EXPECTED_RECORDS,
    EXPECTED_TYPE_IDS,
)

_REGISTRY_PATH: Final[Path] = (
    Path(__file__).resolve().parent / "decision_types.v1.json"
)


class UnknownDecisionTypeError(Exception):
    """decision_type_id is not present in the registry."""


class EntryModeUnavailableError(Exception):
    """entry_mode is not available for the resolved decision type."""


class RegistryLoadError(Exception):
    """Registry JSON is missing, malformed, or fails integrity checks."""


@dataclass(frozen=True, slots=True)
class DecisionTypeResolution:
    """Compatibility result consumed by the E5 Decision Case create route."""

    decision_type_id: str
    family_id: str
    mode: str


def _read_payload(path: Path) -> Any:
    if not path.is_file():
        raise RegistryLoadError(f"registry file missing: {path}")

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RegistryLoadError(f"registry JSON malformed: {exc}") from exc
    except OSError as exc:
        raise RegistryLoadError(f"registry file unreadable: {path}") from exc


def _reject_duplicate_ids(payload: Any) -> None:
    """Give a deterministic duplicate error before Pydantic validation."""

    if not isinstance(payload, dict):
        return

    rows = payload.get("decision_types")
    if not isinstance(rows, list):
        return

    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict):
            continue
        type_id = row.get("decision_type_id")
        if not isinstance(type_id, str):
            continue
        if type_id in seen:
            raise RegistryLoadError(f"duplicate decision_type_id: {type_id}")
        seen.add(type_id)


def _validate_authority(registry: DecisionTypeRegistry) -> None:
    records = registry.decision_types
    ids = {record.decision_type_id for record in records}

    if len(records) != 3:
        raise RegistryLoadError(
            f"EPIC-001 registry requires exactly 3 decision types; got {len(records)}"
        )

    if ids != EXPECTED_TYPE_IDS:
        missing = sorted(EXPECTED_TYPE_IDS - ids)
        unexpected = sorted(ids - EXPECTED_TYPE_IDS)
        raise RegistryLoadError(
            "registry decision type set does not match EPIC-001 authority: "
            f"missing={missing}, unexpected={unexpected}"
        )

    for record in records:
        expected_family, expected_modes = EXPECTED_RECORDS[
            record.decision_type_id
        ]

        if record.family_id != expected_family:
            raise RegistryLoadError(
                f"{record.decision_type_id} family_id must be "
                f"{expected_family!r}; got {record.family_id!r}"
            )

        if tuple(record.allowed_modes) != expected_modes:
            raise RegistryLoadError(
                f"{record.decision_type_id} allowed_modes must be "
                f"{expected_modes!r}; got {tuple(record.allowed_modes)!r}"
            )

        if tuple(record.available_entry_modes) != ("structured",):
            raise RegistryLoadError(
                f"{record.decision_type_id} available_entry_modes must be "
                "('structured',)"
            )


def _load_registry(path: Path) -> dict[str, DecisionTypeRecord]:
    payload = _read_payload(path)
    _reject_duplicate_ids(payload)

    try:
        registry = DecisionTypeRegistry.model_validate(payload)
    except ValidationError as exc:
        raise RegistryLoadError(f"registry validation failed: {exc}") from exc

    _validate_authority(registry)

    return {
        record.decision_type_id: record
        for record in registry.decision_types
    }


@lru_cache(maxsize=1)
def _registry() -> dict[str, DecisionTypeRecord]:
    return _load_registry(_REGISTRY_PATH)


def _reset_registry_cache_for_tests() -> None:
    _registry.cache_clear()


def list_decision_types() -> tuple[DecisionTypeRecord, ...]:
    """Return the immutable canonical records in registry order."""

    return tuple(_registry().values())


def get_decision_type(decision_type_id: str) -> DecisionTypeRecord:
    """Return one canonical record or fail with a domain-specific error."""

    type_id = (decision_type_id or "").strip()
    if not type_id:
        raise UnknownDecisionTypeError("decision_type_id is required")

    record = _registry().get(type_id)
    if record is None:
        raise UnknownDecisionTypeError(f"unknown decision_type_id: {type_id}")

    return record


def registry_by_id() -> Mapping[str, DecisionTypeRecord]:
    """Expose a read-only map without leaking the mutable cache dictionary."""

    return MappingProxyType(_registry())


def resolve_decision_type(
    decision_type_id: str,
    entry_mode: str,
) -> DecisionTypeResolution:
    """Resolve E5 create-time authority from the canonical Registry."""

    mode = (entry_mode or "").strip()
    if not mode:
        raise EntryModeUnavailableError("entry_mode is required")

    record = get_decision_type(decision_type_id)

    if mode not in record.available_entry_modes:
        raise EntryModeUnavailableError(
            f"entry_mode unavailable for {record.decision_type_id}: {mode}"
        )

    return DecisionTypeResolution(
        decision_type_id=record.decision_type_id,
        family_id=record.family_id,
        mode=record.create_mode,
    )


__all__ = [
    "DecisionTypeResolution",
    "EntryModeUnavailableError",
    "RegistryLoadError",
    "UnknownDecisionTypeError",
    "get_decision_type",
    "list_decision_types",
    "registry_by_id",
    "resolve_decision_type",
]
