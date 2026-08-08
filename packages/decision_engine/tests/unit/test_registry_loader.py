"""Unit tests for minimal E2 Decision Type Registry seam."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from packages.decision_engine.registry.loader import (
    DecisionTypeResolution,
    EntryModeUnavailableError,
    RegistryLoadError,
    UnknownDecisionTypeError,
    _load_registry,
    _registry,
    _reset_registry_cache_for_tests,
    resolve_decision_type,
)

CANONICAL = Path(__file__).resolve().parents[2] / "registry" / "decision_types.v1.json"


@pytest.fixture(autouse=True)
def _clear_registry_cache() -> None:
    _reset_registry_cache_for_tests()
    yield
    _reset_registry_cache_for_tests()


@pytest.mark.parametrize(
    ("type_id", "family_id"),
    [
        ("tim-compare-three", "timing_opt"),
        ("car-interview", "visibility"),
        ("mar-wedding-date", "timing_opt"),
    ],
)
def test_known_types_resolve_structured(type_id: str, family_id: str) -> None:
    resolved = resolve_decision_type(type_id, "structured")
    assert resolved == DecisionTypeResolution(
        decision_type_id=type_id,
        family_id=family_id,
        mode="none",
    )


def test_structured_entry_mode_succeeds() -> None:
    assert resolve_decision_type("car-interview", "structured").mode == "none"


def test_natural_language_raises_entry_mode_unavailable() -> None:
    with pytest.raises(EntryModeUnavailableError):
        resolve_decision_type("tim-compare-three", "natural_language")


def test_unknown_type_raises() -> None:
    with pytest.raises(UnknownDecisionTypeError):
        resolve_decision_type("not-a-real-type", "structured")


def test_trim_inputs() -> None:
    resolved = resolve_decision_type("  car-interview  ", "  structured  ")
    assert resolved.decision_type_id == "car-interview"


def test_malformed_registry_fails_loudly(tmp_path: Path) -> None:
    bad = tmp_path / "decision_types.v1.json"
    bad.write_text("{not-json", encoding="utf-8")
    with pytest.raises(RegistryLoadError, match="malformed"):
        _load_registry(bad)


def test_duplicate_decision_type_id_fails(tmp_path: Path) -> None:
    payload = {
        "schema_version": "1.0.0",
        "decision_types": [
            {
                "decision_type_id": "tim-compare-three",
                "family_id": "timing_opt",
                "create_mode": "none",
                "available_entry_modes": ["structured"],
            },
            {
                "decision_type_id": "tim-compare-three",
                "family_id": "timing_opt",
                "create_mode": "none",
                "available_entry_modes": ["structured"],
            },
        ],
    }
    path = tmp_path / "decision_types.v1.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(RegistryLoadError, match="duplicate"):
        _load_registry(path)


def test_invalid_mode_fails(tmp_path: Path) -> None:
    payload = json.loads(CANONICAL.read_text(encoding="utf-8"))
    payload["decision_types"][0]["create_mode"] = "not-a-mode"

    path = tmp_path / "decision_types.v1.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(RegistryLoadError, match="validation failed"):
        _load_registry(path)


def test_empty_entry_mode_set_fails(tmp_path: Path) -> None:
    payload = json.loads(CANONICAL.read_text(encoding="utf-8"))
    payload["decision_types"][0]["available_entry_modes"] = []

    path = tmp_path / "decision_types.v1.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(RegistryLoadError, match="validation failed"):
        _load_registry(path)


def test_unknown_json_fields_fail(tmp_path: Path) -> None:
    payload = json.loads(CANONICAL.read_text(encoding="utf-8"))
    payload["decision_types"][0]["extra"] = True

    path = tmp_path / "decision_types.v1.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(RegistryLoadError, match="validation failed"):
        _load_registry(path)


def test_json_is_only_canonical_record_source() -> None:
    assert CANONICAL.is_file()
    data = json.loads(CANONICAL.read_text(encoding="utf-8"))
    ids = {row["decision_type_id"] for row in data["decision_types"]}
    assert ids == {
        "tim-compare-three",
        "car-interview",
        "mar-wedding-date",
        "bus-investor-meeting",
        "bus-product-launch",
    }
    loaded = _registry()
    assert set(loaded) == ids
    # Loader module must not embed a parallel decision-type allowlist table.
    source = Path(__file__).resolve().parents[2] / "registry" / "loader.py"
    text = source.read_text(encoding="utf-8")
    assert "tim-compare-three" not in text
    assert "car-interview" not in text
    assert "mar-wedding-date" not in text
