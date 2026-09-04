"""Strict integrity tests for EPIC-001 Decision Type Registry v1."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, get_args

import pytest
from pydantic import ValidationError

from packages.decision_engine.registry.loader import (
    RegistryLoadError,
    _load_registry,
    get_decision_type,
    list_decision_types,
    registry_by_id,
)
from packages.decision_engine.registry.schema import (
    DecisionTypeId,
    DecisionTypeRegistry,
    EXPECTED_RECORDS,
    EXPECTED_REGISTRY_SIZE,
    EXPECTED_TYPE_IDS,
)


CANONICAL = (
    Path(__file__).resolve().parents[2]
    / "registry"
    / "decision_types.v1.json"
)

WRONG_SIZE_ERROR = rf"validation failed|exactly {EXPECTED_REGISTRY_SIZE}"


def _canonical_payload() -> dict[str, Any]:
    return json.loads(CANONICAL.read_text(encoding="utf-8"))


def _write(tmp_path: Path, payload: Any) -> Path:
    path = tmp_path / "decision_types.v1.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def test_canonical_registry_contains_exactly_the_authorized_types() -> None:
    records = list_decision_types()

    assert len(records) == EXPECTED_REGISTRY_SIZE
    assert {record.decision_type_id for record in records} == EXPECTED_TYPE_IDS


def test_authorized_ids_derive_from_the_decision_type_id_literal() -> None:
    assert EXPECTED_TYPE_IDS == frozenset(get_args(DecisionTypeId))
    assert frozenset(EXPECTED_RECORDS) == EXPECTED_TYPE_IDS
    assert EXPECTED_REGISTRY_SIZE == len(EXPECTED_TYPE_IDS)


def test_registry_size_bounds_derive_from_authority() -> None:
    """Registry capacity tracks the authorized set instead of a fixed count."""

    metadata = DecisionTypeRegistry.model_fields["decision_types"].metadata
    declared = {
        bound
        for constraint in metadata
        for bound in (
            getattr(constraint, "min_length", None),
            getattr(constraint, "max_length", None),
        )
        if bound is not None
    }

    assert declared == {EXPECTED_REGISTRY_SIZE}


def test_canonical_type_metadata_is_available() -> None:
    interview = get_decision_type("car-interview")

    assert interview.label == "Attend job interview"
    assert interview.family_id == "visibility"
    assert interview.allowed_modes == (
        "evaluate_date",
        "compare_dates",
        "find_dates",
    )
    assert interview.output_profile == "decision_evaluation_package.v1"
    assert interview.risk_context.level == "elevated"
    assert interview.risk_context.domains == ("employment",)
    assert interview.risk_context.outcome_prediction_prohibited is False


def test_offer_negotiation_is_authorized_as_evaluate_only() -> None:
    """Sixth canonical type: EVALUATE only, elevated employment risk."""

    offer = get_decision_type("car-offer-negotiation")

    assert offer.label == "Negotiate a job offer"
    assert offer.family_id == "visibility"
    assert offer.allowed_modes == ("evaluate_date",)
    assert "compare_dates" not in offer.allowed_modes
    assert "find_dates" not in offer.allowed_modes
    assert offer.create_mode == "none"
    assert offer.available_entry_modes == ("structured",)
    assert offer.output_profile == "decision_evaluation_package.v1"
    assert offer.risk_context.level == "elevated"
    assert offer.risk_context.domains == ("employment",)
    assert offer.risk_context.outcome_prediction_prohibited is True
    assert offer.risk_context.factual_deadline_priority is False


def test_offer_negotiation_matches_the_expected_record_contract() -> None:
    assert EXPECTED_RECORDS["car-offer-negotiation"] == (
        "visibility",
        ("evaluate_date",),
    )
    assert "car-offer-negotiation" in EXPECTED_TYPE_IDS


def test_registry_size_grew_with_the_new_authorized_type() -> None:
    """Capacity is derived, so authorizing a sixth type needs no count edit."""

    assert EXPECTED_REGISTRY_SIZE == 6
    assert len(list_decision_types()) == EXPECTED_REGISTRY_SIZE


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

    with pytest.raises(RegistryLoadError, match=WRONG_SIZE_ERROR):
        _load_registry(_write(tmp_path, payload))


def test_missing_authorized_type_is_rejected(tmp_path: Path) -> None:
    payload = _canonical_payload()
    payload["decision_types"] = payload["decision_types"][:2]

    with pytest.raises(RegistryLoadError, match=WRONG_SIZE_ERROR):
        _load_registry(_write(tmp_path, payload))


def test_unauthorized_type_id_is_rejected_at_unchanged_size(
    tmp_path: Path,
) -> None:
    """Capacity derives from authority; the authorized id set stays closed."""

    payload = _canonical_payload()
    payload["decision_types"][0]["decision_type_id"] = "tim-unauthorized"

    with pytest.raises(RegistryLoadError, match="validation failed"):
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
