"""Canonical intake slots for `mar-wedding-date`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final, Literal, Mapping

from packages.decision_engine.registry import get_decision_type

WEDDING_DATE_DECISION_TYPE_ID: Final = "mar-wedding-date"

SlotId = Literal[
    "target_date",
    "ceremony_type",
    "partner_name",
    "venue",
]


@dataclass(frozen=True, slots=True)
class IntakeSlot:
    slot_id: SlotId
    required: bool
    label: str


WEDDING_DATE_SLOTS: Final[tuple[IntakeSlot, ...]] = (
    IntakeSlot("target_date", True, "Wedding date"),
    IntakeSlot("ceremony_type", True, "Ceremony type"),
    IntakeSlot("partner_name", False, "Partner name"),
    IntakeSlot("venue", False, "Venue"),
)

REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset(
    slot.slot_id for slot in WEDDING_DATE_SLOTS if slot.required
)

# COMPARE dates live on decision_frame.options — target_date is not required.
COMPARE_REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset({"ceremony_type"})


def required_slot_ids_for_mode(mode: str | None) -> frozenset[str]:
    if mode == "compare_dates":
        return COMPARE_REQUIRED_SLOT_IDS
    return REQUIRED_SLOT_IDS


def intake_mode_from_mapping(intake: Mapping[str, Any] | None) -> str:
    """Infer Case mode from persisted decision_frame when present."""
    if not isinstance(intake, Mapping):
        return "evaluate_date"
    frame = intake.get("decision_frame")
    if isinstance(frame, dict) and frame.get("operation") == "compare":
        return "compare_dates"
    return "evaluate_date"


@dataclass(frozen=True, slots=True)
class WeddingDateIntake:
    target_date: str | None = None
    ceremony_type: str | None = None
    partner_name: str | None = None
    venue: str | None = None

    def as_dict(self) -> dict[str, str]:
        return {
            key: value
            for key, value in {
                "target_date": self.target_date,
                "ceremony_type": self.ceremony_type,
                "partner_name": self.partner_name,
                "venue": self.venue,
            }.items()
            if value
        }


def assert_wedding_date_registered() -> None:
    record = get_decision_type(WEDDING_DATE_DECISION_TYPE_ID)
    if "evaluate_date" not in record.allowed_modes:
        raise RuntimeError("mar-wedding-date must allow evaluate_date")
    if "compare_dates" not in record.allowed_modes:
        raise RuntimeError("mar-wedding-date must allow compare_dates")
    if record.family_id != "timing_opt":
        raise RuntimeError("mar-wedding-date must belong to timing_opt")


def _normalize(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def merge_wedding_date_intake(
    current: Mapping[str, Any] | None,
    answers: Mapping[str, Any],
) -> WeddingDateIntake:
    base = dict(current or {})

    for key in ("target_date", "ceremony_type", "partner_name", "venue"):
        if key in answers:
            value = _normalize(answers[key])
            if value is None:
                base.pop(key, None)
            else:
                base[key] = value

    return WeddingDateIntake(
        target_date=_normalize(base.get("target_date")),
        ceremony_type=_normalize(base.get("ceremony_type")),
        partner_name=_normalize(base.get("partner_name")),
        venue=_normalize(base.get("venue")),
    )
