"""Canonical intake slots for `bus-product-launch`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final, Literal, Mapping

from packages.decision_engine.registry import get_decision_type

PRODUCT_LAUNCH_DECISION_TYPE_ID: Final = "bus-product-launch"

SlotId = Literal[
    "target_date",
    "launch_object",
    "launch_channel",
    "brand_or_company",
]


@dataclass(frozen=True, slots=True)
class IntakeSlot:
    slot_id: SlotId
    required: bool
    label: str


PRODUCT_LAUNCH_SLOTS: Final[tuple[IntakeSlot, ...]] = (
    IntakeSlot("target_date", True, "Launch date"),
    IntakeSlot("launch_object", True, "What launches"),
    IntakeSlot("launch_channel", False, "Launch channel"),
    IntakeSlot("brand_or_company", False, "Brand or company"),
)

REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset(
    slot.slot_id for slot in PRODUCT_LAUNCH_SLOTS if slot.required
)

# FIND dates live on decision_frame start/end — target_date is not required.
FIND_REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset({"launch_object"})


def required_slot_ids_for_mode(mode: str | None) -> frozenset[str]:
    if mode == "find_dates":
        return FIND_REQUIRED_SLOT_IDS
    return REQUIRED_SLOT_IDS


def intake_mode_from_mapping(intake: Mapping[str, Any] | None) -> str:
    """Infer Case mode from persisted decision_frame when present."""
    if not isinstance(intake, Mapping):
        return "evaluate_date"
    frame = intake.get("decision_frame")
    if isinstance(frame, dict) and frame.get("operation") == "find":
        return "find_dates"
    return "evaluate_date"


@dataclass(frozen=True, slots=True)
class ProductLaunchIntake:
    target_date: str | None = None
    launch_object: str | None = None
    launch_channel: str | None = None
    brand_or_company: str | None = None

    def as_dict(self) -> dict[str, str]:
        return {
            key: value
            for key, value in {
                "target_date": self.target_date,
                "launch_object": self.launch_object,
                "launch_channel": self.launch_channel,
                "brand_or_company": self.brand_or_company,
            }.items()
            if value
        }


def assert_product_launch_registered() -> None:
    record = get_decision_type(PRODUCT_LAUNCH_DECISION_TYPE_ID)
    if "evaluate_date" not in record.allowed_modes:
        raise RuntimeError("bus-product-launch must allow evaluate_date")
    if "find_dates" not in record.allowed_modes:
        raise RuntimeError("bus-product-launch must allow find_dates")
    if record.family_id != "timing_opt":
        raise RuntimeError("bus-product-launch must belong to timing_opt")


def _normalize(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def merge_product_launch_intake(
    current: Mapping[str, Any] | None,
    answers: Mapping[str, Any],
) -> ProductLaunchIntake:
    base = dict(current or {})

    for key in (
        "target_date",
        "launch_object",
        "launch_channel",
        "brand_or_company",
    ):
        if key in answers:
            value = _normalize(answers[key])
            if value is None:
                base.pop(key, None)
            else:
                base[key] = value

    return ProductLaunchIntake(
        target_date=_normalize(base.get("target_date")),
        launch_object=_normalize(base.get("launch_object")),
        launch_channel=_normalize(base.get("launch_channel")),
        brand_or_company=_normalize(base.get("brand_or_company")),
    )
