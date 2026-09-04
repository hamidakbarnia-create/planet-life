"""Canonical intake slots for `car-offer-negotiation`.

EVALUATE only. Compare/Find have no runtime for this type, so no
mode-specific required-slot variants exist here.

Stored slot values stay stable English identifiers; consumer surfaces
localize the visible labels. Compensation amounts are never collected.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final, Literal, Mapping

from packages.decision_engine.registry import get_decision_type

OFFER_NEGOTIATION_DECISION_TYPE_ID: Final = "car-offer-negotiation"

SlotId = Literal[
    "target_date",
    "negotiation_goal",
    "offer_stage",
    "counterparty_role",
]


@dataclass(frozen=True, slots=True)
class IntakeSlot:
    slot_id: SlotId
    required: bool
    label: str


# Only the evaluated date is required. Negotiation goal, offer stage and
# counterparty role are stored context: they do not reach DecisionRequest and
# do not change the score, so requiring them would be decorative.
OFFER_NEGOTIATION_SLOTS: Final[tuple[IntakeSlot, ...]] = (
    IntakeSlot("target_date", True, "Negotiation date"),
    IntakeSlot("negotiation_goal", False, "What you want to negotiate"),
    IntakeSlot("offer_stage", False, "Offer stage"),
    IntakeSlot("counterparty_role", False, "Who you negotiate with"),
)

REQUIRED_SLOT_IDS: Final[frozenset[str]] = frozenset(
    slot.slot_id for slot in OFFER_NEGOTIATION_SLOTS if slot.required
)

# Canonical stored enum values. Visible labels are localized downstream.
NEGOTIATION_GOALS: Final[tuple[str, ...]] = (
    "salary",
    "benefits",
    "role_title",
    "start_date",
    "working_arrangement",
    "complete_package",
    "other",
)

OFFER_STAGES: Final[tuple[str, ...]] = (
    "verbal_offer",
    "written_offer",
    "revised_offer",
)

COUNTERPARTY_ROLES: Final[tuple[str, ...]] = (
    "recruiter",
    "hiring_manager",
    "founder_executive",
    "hr_representative",
)


def required_slot_ids_for_mode(mode: str | None) -> frozenset[str]:
    """EVALUATE is the only supported mode; requirements never relax."""
    return REQUIRED_SLOT_IDS


def intake_mode_from_mapping(intake: Mapping[str, Any] | None) -> str:
    """Always evaluate_date. Compare/Find never activate for this type."""
    return "evaluate_date"


@dataclass(frozen=True, slots=True)
class OfferNegotiationIntake:
    target_date: str | None = None
    negotiation_goal: str | None = None
    offer_stage: str | None = None
    counterparty_role: str | None = None

    def as_dict(self) -> dict[str, str]:
        return {
            key: value
            for key, value in {
                "target_date": self.target_date,
                "negotiation_goal": self.negotiation_goal,
                "offer_stage": self.offer_stage,
                "counterparty_role": self.counterparty_role,
            }.items()
            if value
        }


def assert_offer_negotiation_registered() -> None:
    record = get_decision_type(OFFER_NEGOTIATION_DECISION_TYPE_ID)
    if "evaluate_date" not in record.allowed_modes:
        raise RuntimeError("car-offer-negotiation must allow evaluate_date")
    if record.allowed_modes != ("evaluate_date",):
        raise RuntimeError(
            "car-offer-negotiation must allow evaluate_date only"
        )
    if record.family_id != "visibility":
        raise RuntimeError("car-offer-negotiation must belong to visibility")
    if record.risk_context.level != "elevated":
        raise RuntimeError("car-offer-negotiation must be elevated risk")
    if not record.risk_context.outcome_prediction_prohibited:
        raise RuntimeError(
            "car-offer-negotiation must prohibit outcome prediction"
        )


_ENUM_SLOT_VALUES: Final[dict[str, tuple[str, ...]]] = {
    "negotiation_goal": NEGOTIATION_GOALS,
    "offer_stage": OFFER_STAGES,
    "counterparty_role": COUNTERPARTY_ROLES,
}


def _normalize(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _normalize_slot(slot_id: str, value: Any) -> str | None:
    """Normalize one slot. Unauthorized enum values are dropped, not stored."""
    text = _normalize(value)
    if text is None:
        return None
    allowed = _ENUM_SLOT_VALUES.get(slot_id)
    if allowed is not None and text not in allowed:
        return None
    return text


def merge_offer_negotiation_intake(
    current: Mapping[str, Any] | None,
    answers: Mapping[str, Any],
) -> OfferNegotiationIntake:
    base = dict(current or {})

    for key in (
        "target_date",
        "negotiation_goal",
        "offer_stage",
        "counterparty_role",
    ):
        if key in answers:
            value = _normalize_slot(key, answers[key])
            if value is None:
                base.pop(key, None)
            else:
                base[key] = value

    return OfferNegotiationIntake(
        target_date=_normalize_slot("target_date", base.get("target_date")),
        negotiation_goal=_normalize_slot(
            "negotiation_goal", base.get("negotiation_goal")
        ),
        offer_stage=_normalize_slot("offer_stage", base.get("offer_stage")),
        counterparty_role=_normalize_slot(
            "counterparty_role", base.get("counterparty_role")
        ),
    )
