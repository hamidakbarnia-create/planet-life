"""car-offer-negotiation intake slots: required pair, enums, no financial data."""

import pytest

from packages.decision_engine.intake.evaluator import (
    evaluate_offer_negotiation_intake,
)
from packages.decision_engine.intake.offer_negotiation import (
    COUNTERPARTY_ROLES,
    NEGOTIATION_GOALS,
    OFFER_NEGOTIATION_DECISION_TYPE_ID,
    OFFER_NEGOTIATION_SLOTS,
    OFFER_STAGES,
    REQUIRED_SLOT_IDS,
    assert_offer_negotiation_registered,
    merge_offer_negotiation_intake,
    required_slot_ids_for_mode,
)

DATE = "2026-09-15"


def test_registry_binding():
    assert OFFER_NEGOTIATION_DECISION_TYPE_ID == "car-offer-negotiation"
    assert_offer_negotiation_registered()


def test_slot_contract_collects_no_financial_data():
    slot_ids = tuple(slot.slot_id for slot in OFFER_NEGOTIATION_SLOTS)
    assert slot_ids == (
        "target_date",
        "negotiation_goal",
        "offer_stage",
        "counterparty_role",
    )
    assert REQUIRED_SLOT_IDS == frozenset({"target_date"})
    joined = " ".join(slot_ids)
    for forbidden in ("salary_amount", "current_pay", "compensation", "equity"):
        assert forbidden not in joined


def test_only_the_evaluated_date_is_required():
    """Context slots are stored but unused, so none of them may be mandatory."""
    optional = {
        slot.slot_id for slot in OFFER_NEGOTIATION_SLOTS if not slot.required
    }
    assert optional == {"negotiation_goal", "offer_stage", "counterparty_role"}

    result = evaluate_offer_negotiation_intake({})
    assert result.is_complete is False
    assert result.missing_required == ("target_date",)
    assert result.answered_required == ()
    assert result.has_first_required_answer is False


def test_target_date_alone_completes_intake():
    result = evaluate_offer_negotiation_intake({"target_date": DATE})
    assert result.is_complete is True
    assert result.missing_required == ()
    assert result.answered_required == ("target_date",)
    assert result.intake.target_date == DATE
    assert result.intake.negotiation_goal is None


def test_accepts_stored_context_without_requiring_it():
    result = evaluate_offer_negotiation_intake(
        {"target_date": DATE, "negotiation_goal": "salary"}
    )
    assert result.is_complete is True
    assert result.missing_required == ()
    assert result.intake.negotiation_goal == "salary"


def test_missing_date_blocks_even_with_all_context_supplied():
    result = evaluate_offer_negotiation_intake(
        {
            "negotiation_goal": "salary",
            "offer_stage": "written_offer",
            "counterparty_role": "hiring_manager",
        }
    )
    assert result.is_complete is False
    assert result.missing_required == ("target_date",)


def test_optional_fields_do_not_block():
    result = evaluate_offer_negotiation_intake(
        {
            "target_date": DATE,
            "negotiation_goal": "complete_package",
            "offer_stage": "written_offer",
            "counterparty_role": "hiring_manager",
        }
    )
    assert result.is_complete is True
    assert result.intake.offer_stage == "written_offer"
    assert result.intake.counterparty_role == "hiring_manager"


@pytest.mark.parametrize("goal", NEGOTIATION_GOALS)
def test_every_authorized_goal_completes_intake(goal: str):
    result = evaluate_offer_negotiation_intake(
        {"target_date": DATE, "negotiation_goal": goal}
    )
    assert result.is_complete is True
    assert result.intake.negotiation_goal == goal


def test_unauthorized_enum_values_are_dropped_not_stored():
    result = evaluate_offer_negotiation_intake(
        {
            "target_date": DATE,
            "negotiation_goal": "equity_refresh",
            "offer_stage": "exploding_offer",
            "counterparty_role": "ceo",
        }
    )
    assert result.intake.negotiation_goal is None
    assert result.intake.offer_stage is None
    assert result.intake.counterparty_role is None
    # Unauthorized context is dropped rather than persisted; the required
    # date is still present, so the Case stays completable.
    assert result.is_complete is True
    assert result.intake.as_dict() == {"target_date": DATE}


def test_blank_answers_clear_a_slot():
    merged = merge_offer_negotiation_intake(
        {"target_date": DATE, "negotiation_goal": "salary"},
        {"negotiation_goal": "   "},
    )
    assert merged.negotiation_goal is None
    assert merged.target_date == DATE


def test_evaluate_is_the_only_mode_and_requirements_never_relax():
    for mode in (None, "evaluate_date", "compare_dates", "find_dates"):
        assert required_slot_ids_for_mode(mode) == frozenset({"target_date"})

    result = evaluate_offer_negotiation_intake(
        {
            "negotiation_goal": "salary",
            "decision_frame": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": [DATE, "2026-09-18"],
            },
        }
    )
    assert result.is_complete is False
    assert "target_date" in result.missing_required


def test_enum_vocabularies_are_stable_english_identifiers():
    assert NEGOTIATION_GOALS == (
        "salary",
        "benefits",
        "role_title",
        "start_date",
        "working_arrangement",
        "complete_package",
        "other",
    )
    assert OFFER_STAGES == ("verbal_offer", "written_offer", "revised_offer")
    assert COUNTERPARTY_ROLES == (
        "recruiter",
        "hiring_manager",
        "founder_executive",
        "hr_representative",
    )
