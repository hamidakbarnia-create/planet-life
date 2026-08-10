"""Strict integrity tests for EPIC-001 Decision Type Registry v1."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from packages.decision_engine.registry.loader import (
    RegistryLoadError,
    _load_registry,
    get_decision_type,
    list_decision_types,
    registry_by_id,
)
from packages.decision_engine.registry.schema import EXPECTED_TYPE_IDS


CANONICAL = (
    Path(__file__).resolve().parents[2]
    / "registry"
    / "decision_types.v1.json"
)


def _canonical_payload() -> dict[str, Any]:
    return json.loads(CANONICAL.read_text(encoding="utf-8"))


def _write(tmp_path: Path, payload: Any) -> Path:
    path = tmp_path / "decision_types.v1.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def test_canonical_registry_contains_exactly_five_authorized_types() -> None:
    records = list_decision_types()

    assert len(records) == 5
    assert {record.decision_type_id for record in records} == EXPECTED_TYPE_IDS


def test_canonical_type_metadata_is_available() -> None:
    interview = get_decision_type("car-interview")

    assert interview.label == "Attend job interview"
    assert interview.family_id == "visibility"
    assert interview.allowed_modes == ("evaluate_date", "compare_dates")
    assert interview.output_profile == "decision_evaluation_package.v1"


def test_registry_records_are_immutable() -> None:
    interview = get_decision_type("car-interview")

    with pytest.raises(ValidationError, match="frozen"):
        interview.family_id = "timing_opt"  # type: ignore[misc]


def test_registry_mapping_is_read_only() -> None:
    records = registry_by_id()

    with pytest.raises(TypeError):
        records["new-type"] = get_decision_type("car-interview")  # type: ignore[index]


def test_extra_type_is_rejected(tmp_path: Path) -> None:
    payload = _canonical_payload()
    extra = copy.deepcopy(payload["decision_types"][0])
    extra["decision_type_id"] = "tim-extra"
    payload["decision_types"].append(extra)

    with pytest.raises(RegistryLoadError, match="validation failed|exactly 5"):
        _load_registry(_write(tmp_path, payload))


def test_missing_authorized_type_is_rejected(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["decision_types"] = payload["decision_types"][:2]

    with pytest.raises(RegistryLoadError, match="validation failed|exactly 5"):
        _load_registry(_write(tmp_path, payload))


def test_wrong_family_is_rejected(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["decision_types"][1]["family_id"] = "timing_opt"

    with pytest.raises(RegistryLoadError, match="family_id must be"):
        _load_registry(_write(tmp_path, payload))


def test_wrong_allowed_modes_are_rejected(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["decision_types"][0]["allowed_modes"] = ["evaluate_date"]

    with pytest.raises(RegistryLoadError, match="allowed_modes must be"):
        _load_registry(_write(tmp_path, payload))


def test_unknown_field_is_rejected(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["decision_types"][0]["private_engine"] = "forbidden"

    with pytest.raises(RegistryLoadError, match="validation failed"):
        _load_registry(_write(tmp_path, payload))


def test_unknown_schema_version_is_rejected(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["schema_version"] = "1.1.0"

    with pytest.raises(RegistryLoadError, match="validation failed"):
        _load_registry(_write(tmp_path, payload))


def test_duplicate_type_id_is_rejected_explicitly(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["decision_types"][1]["decision_type_id"] = (
        payload["decision_types"][0]["decision_type_id"]
    )

    with pytest.raises(RegistryLoadError, match="duplicate decision_type_id"):
        _load_registry(_write(tmp_path, payload))


def test_unavailable_entry_mode_is_rejected_by_schema(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["decision_types"][0]["available_entry_modes"] = [
        "structured",
        "natural_language",
    ]

    with pytest.raises(RegistryLoadError, match="validation failed"):
        _load_registry(_write(tmp_path, payload))
