"""Canonical intake slots for `bus-investor-meeting`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final, Literal, Mapping

from packages.decision_engine.registry import get_decision_type

INVESTOR_MEETING_DECISION_TYPE_ID: Final = "bus-investor-meeting"

SlotId = Literal[
    "target_date",
    "meeting_goal",
    "investor_name",
    "meeting_type",
]


@dataclass(frozen=True, slots=True)
class IntakeSlot:
    slot_id: SlotId
    required: bool
    label: str


INVESTOR_MEETING_SLOTS: Final[tuple[IntakeSlot, ...]] = (
    IntakeSlot("target_date", True, "Meeting date"),
    IntakeSlot("meeting_goal", True, "Meeting goal"),
    IntakeSlot("investor_name", False, "Investor"),
    IntakeSlot("meeting_type", False, "Meeting type"),
)

REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset(
    slot.slot_id for slot in INVESTOR_MEETING_SLOTS if slot.required
)

# COMPARE dates live on decision_frame.options — target_date is not required.
COMPARE_REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset({"meeting_goal"})


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
class InvestorMeetingIntake:
    target_date: str | None = None
    meeting_goal: str | None = None
    investor_name: str | None = None
    meeting_type: str | None = None

    def as_dict(self) -> dict[str, str]:
        return {
            key: value
            for key, value in {
                "target_date": self.target_date,
                "meeting_goal": self.meeting_goal,
                "investor_name": self.investor_name,
                "meeting_type": self.meeting_type,
            }.items()
            if value
        }


def assert_investor_meeting_registered() -> None:
    record = get_decision_type(INVESTOR_MEETING_DECISION_TYPE_ID)
    if "evaluate_date" not in record.allowed_modes:
        raise RuntimeError("bus-investor-meeting must allow evaluate_date")
    if "compare_dates" not in record.allowed_modes:
        raise RuntimeError("bus-investor-meeting must allow compare_dates")
    if record.family_id != "visibility":
        raise RuntimeError("bus-investor-meeting must belong to visibility")


def _normalize(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def merge_investor_meeting_intake(
    current: Mapping[str, Any] | None,
    answers: Mapping[str, Any],
) -> InvestorMeetingIntake:
    base = dict(current or {})

    for key in ("target_date", "meeting_goal", "investor_name", "meeting_type"):
        if key in answers:
            value = _normalize(answers[key])
            if value is None:
                base.pop(key, None)
            else:
                base[key] = value

    return InvestorMeetingIntake(
        target_date=_normalize(base.get("target_date")),
        meeting_goal=_normalize(base.get("meeting_goal")),
        investor_name=_normalize(base.get("investor_name")),
        meeting_type=_normalize(base.get("meeting_type")),
    )
