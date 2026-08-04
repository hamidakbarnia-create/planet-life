"""Minimal Decision Type Registry loader (E2 activation seam for E5).

Canonical type records live only in ``decision_types.v1.json``.
No HTTP, persistence, intake, classification, or lifecycle logic.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Final

_REGISTRY_PATH: Final[Path] = Path(__file__).resolve().parent / "decision_types.v1.json"
_E4_CREATE_MODES: Final[frozenset[str]] = frozenset(
    {"none", "evaluate_date", "compare_dates"}
)
_RECORD_KEYS: Final[frozenset[str]] = frozenset(
    {"decision_type_id", "family_id", "create_mode", "available_entry_modes"}
)
_ROOT_KEYS: Final[frozenset[str]] = frozenset({"schema_version", "decision_types"})


class UnknownDecisionTypeError(Exception):
    """decision_type_id is not present in the registry."""


class EntryModeUnavailableError(Exception):
    """entry_mode is not available for the resolved decision type."""


class RegistryLoadError(Exception):
    """Registry JSON is missing, malformed, or fails integrity checks."""


@dataclass(frozen=True, slots=True)
class DecisionTypeResolution:
    decision_type_id: str
    family_id: str
    mode: str


@dataclass(frozen=True, slots=True)
class _TypeRecord:
    decision_type_id: str
    family_id: str
    create_mode: str
    available_entry_modes: frozenset[str]


def _require_nonempty_str(value: Any, *, field: str) -> str:
    if not isinstance(value, str):
        raise RegistryLoadError(f"{field} must be a string")
    trimmed = value.strip()
    if not trimmed:
        raise RegistryLoadError(f"{field} must be non-empty")
    return trimmed


def _parse_record(raw: Any, *, index: int) -> _TypeRecord:
    if not isinstance(raw, dict):
        raise RegistryLoadError(f"decision_types[{index}] must be an object")
    keys = frozenset(raw.keys())
    unknown = keys - _RECORD_KEYS
    if unknown:
        raise RegistryLoadError(
            f"decision_types[{index}] has unknown fields: {sorted(unknown)}"
        )
    missing = _RECORD_KEYS - keys
    if missing:
        raise RegistryLoadError(
            f"decision_types[{index}] missing fields: {sorted(missing)}"
        )

    type_id = _require_nonempty_str(raw["decision_type_id"], field="decision_type_id")
    family_id = _require_nonempty_str(raw["family_id"], field="family_id")
    create_mode = _require_nonempty_str(raw["create_mode"], field="create_mode")
    if create_mode not in _E4_CREATE_MODES:
        raise RegistryLoadError(
            f"decision_types[{index}] create_mode invalid: {create_mode!r}"
        )

    modes_raw = raw["available_entry_modes"]
    if not isinstance(modes_raw, list) or not modes_raw:
        raise RegistryLoadError(
            f"decision_types[{index}] available_entry_modes must be a non-empty list"
        )
    entry_modes: list[str] = []
    for mode in modes_raw:
        entry = _require_nonempty_str(mode, field="available_entry_modes[]")
        entry_modes.append(entry)
    if len(entry_modes) != len(set(entry_modes)):
        raise RegistryLoadError(
            f"decision_types[{index}] available_entry_modes contains duplicates"
        )

    return _TypeRecord(
        decision_type_id=type_id,
        family_id=family_id,
        create_mode=create_mode,
        available_entry_modes=frozenset(entry_modes),
    )


def _load_registry(path: Path) -> dict[str, _TypeRecord]:
    if not path.is_file():
        raise RegistryLoadError(f"registry file missing: {path}")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RegistryLoadError(f"registry JSON malformed: {exc}") from exc
    if not isinstance(payload, dict):
        raise RegistryLoadError("registry root must be an object")
    root_unknown = frozenset(payload.keys()) - _ROOT_KEYS
    if root_unknown:
        raise RegistryLoadError(f"registry has unknown fields: {sorted(root_unknown)}")
    if "schema_version" not in payload or "decision_types" not in payload:
        raise RegistryLoadError("registry requires schema_version and decision_types")
    _require_nonempty_str(payload["schema_version"], field="schema_version")
    types_raw = payload["decision_types"]
    if not isinstance(types_raw, list) or not types_raw:
        raise RegistryLoadError("decision_types must be a non-empty list")

    by_id: dict[str, _TypeRecord] = {}
    for index, raw in enumerate(types_raw):
        record = _parse_record(raw, index=index)
        if record.decision_type_id in by_id:
            raise RegistryLoadError(
                f"duplicate decision_type_id: {record.decision_type_id}"
            )
        by_id[record.decision_type_id] = record
    return by_id


@lru_cache(maxsize=1)
def _registry() -> dict[str, _TypeRecord]:
    return _load_registry(_REGISTRY_PATH)


def _reset_registry_cache_for_tests() -> None:
    _registry.cache_clear()


def resolve_decision_type(
    decision_type_id: str,
    entry_mode: str,
) -> DecisionTypeResolution:
    """Resolve create-time type authority from the canonical registry JSON."""
    type_id = (decision_type_id or "").strip()
    mode = (entry_mode or "").strip()
    if not type_id:
        raise UnknownDecisionTypeError("decision_type_id is required")
    if not mode:
        raise EntryModeUnavailableError("entry_mode is required")

    records = _registry()
    record = records.get(type_id)
    if record is None:
        raise UnknownDecisionTypeError(f"unknown decision_type_id: {type_id}")
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
    "resolve_decision_type",
]
