"""Canonical intake slots for decision type `car-interview` (PR-1).

Slots are type-local — not a generic rules engine and not a new registry.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final, Literal, Mapping

from packages.decision_engine.registry import get_decision_type

CAR_INTERVIEW_DECISION_TYPE_ID: Final = "car-interview"

SlotId = Literal["target_date", "role", "company", "interview_type"]


@dataclass(frozen=True, slots=True)
class IntakeSlot:
    slot_id: SlotId
    required: bool
    label: str


CAR_INTERVIEW_SLOTS: Final[tuple[IntakeSlot, ...]] = (
    IntakeSlot("target_date", True, "Interview date"),
    IntakeSlot("role", True, "Role"),
    IntakeSlot("company", False, "Company"),
    IntakeSlot("interview_type", False, "Interview type"),
)

REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset(
    slot.slot_id for slot in CAR_INTERVIEW_SLOTS if slot.required
)


@dataclass(frozen=True, slots=True)
class CarInterviewIntake:
    """Normalized intake answers for car-interview."""

    target_date: str | None = None
    role: str | None = None
    company: str | None = None
    interview_type: str | None = None

    def as_dict(self) -> dict[str, str]:
        out: dict[str, str] = {}
        if self.target_date:
            out["target_date"] = self.target_date
        if self.role:
            out["role"] = self.role
        if self.company:
            out["company"] = self.company
        if self.interview_type:
            out["interview_type"] = self.interview_type
        return out


def assert_car_interview_registered() -> None:
    """Fail fast if registry authority drifts from this type-local module."""
    record = get_decision_type(CAR_INTERVIEW_DECISION_TYPE_ID)
    if record.decision_type_id != CAR_INTERVIEW_DECISION_TYPE_ID:
        raise RuntimeError("car-interview registry mismatch")
    if "evaluate_date" not in record.allowed_modes:
        raise RuntimeError("car-interview must allow evaluate_date")


def normalize_answer(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def merge_intake(
    current: Mapping[str, Any] | None,
    answers: Mapping[str, Any],
) -> CarInterviewIntake:
    """Merge partial answers into a normalized car-interview intake."""
    base = dict(current or {})
    for key in ("target_date", "role", "company", "interview_type"):
        if key in answers:
            normalized = normalize_answer(answers[key])
            if normalized is None:
                base.pop(key, None)
            else:
                base[key] = normalized
    return CarInterviewIntake(
        target_date=normalize_answer(base.get("target_date")),
        role=normalize_answer(base.get("role")),
        company=normalize_answer(base.get("company")),
        interview_type=normalize_answer(base.get("interview_type")),
    )
