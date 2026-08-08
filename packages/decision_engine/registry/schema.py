"""Strict EPIC-001 Decision Type Registry v1 models.

This module freezes only fields with explicit authority.
Per-type intake slots and completion rules remain unimplemented until
canonical type records are authorized.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


RegistrySchemaVersion = Literal["1.0.0"]
DecisionTypeId = Literal[
    "tim-compare-three",
    "car-interview",
    "mar-wedding-date",
    "bus-investor-meeting",
    "bus-product-launch",
]
FamilyId = Literal["timing_opt", "visibility"]
DecisionMode = Literal["evaluate_date", "compare_dates", "find_dates"]
EntryMode = Literal["structured"]
OutputProfile = Literal["decision_evaluation_package.v1"]


class RegistryModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class DecisionTypeRecord(RegistryModel):
    decision_type_id: DecisionTypeId
    family_id: FamilyId
    label: str = Field(min_length=1)
    create_mode: Literal["none"]
    available_entry_modes: tuple[EntryMode, ...] = Field(min_length=1)
    allowed_modes: tuple[DecisionMode, ...] = Field(min_length=1)
    output_profile: OutputProfile


class DecisionTypeRegistry(RegistryModel):
    schema_version: RegistrySchemaVersion
    decision_types: tuple[DecisionTypeRecord, ...] = Field(
        min_length=5,
        max_length=5,
    )


EXPECTED_TYPE_IDS: frozenset[str] = frozenset(
    {
        "tim-compare-three",
        "car-interview",
        "mar-wedding-date",
        "bus-investor-meeting",
        "bus-product-launch",
    }
)

EXPECTED_RECORDS: dict[str, tuple[str, tuple[str, ...]]] = {
    "tim-compare-three": ("timing_opt", ("compare_dates",)),
    "car-interview": ("visibility", ("evaluate_date",)),
    "mar-wedding-date": (
        "timing_opt",
        ("evaluate_date", "compare_dates"),
    ),
    "bus-investor-meeting": (
        "visibility",
        ("evaluate_date",),
    ),
    "bus-product-launch": (
        "timing_opt",
        ("evaluate_date", "find_dates"),
    ),
}


__all__ = [
    "DecisionMode",
    "DecisionTypeId",
    "DecisionTypeRecord",
    "DecisionTypeRegistry",
    "EXPECTED_RECORDS",
    "EXPECTED_TYPE_IDS",
]
