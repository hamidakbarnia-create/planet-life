"""E3 domain tests: LAP-001 / DEC-0019 activation_phase derivation (Option A)."""

from __future__ import annotations

import pytest

from packages.decision_engine.state_machine import (
    NO_ACTIVE_PHASE,
    ActivationPhase,
    CaseState,
    activation_phase,
    apply_transition,
)


@pytest.mark.parametrize(
    ("state", "expected"),
    [
        (CaseState.DRAFT, ActivationPhase.DRAFT),
        (CaseState.INTAKE, ActivationPhase.INTAKE),
        (CaseState.EVIDENCE_READY, ActivationPhase.EVIDENCE_READY),
        (CaseState.EVALUATED, ActivationPhase.EVALUATED),
        (CaseState.COMPARED, ActivationPhase.COMPARED),
        (CaseState.FOUND, ActivationPhase.FOUND),
        (CaseState.COMPLETED, ActivationPhase.COMPLETED),
        (CaseState.REFLECTED, ActivationPhase.COMPLETED),
        (CaseState.ARCHIVED, ActivationPhase.ARCHIVED),
        (CaseState.SUPERSEDED, NO_ACTIVE_PHASE),
        (CaseState.REJECTED, NO_ACTIVE_PHASE),
    ],
)
def test_direct_and_terminal_mapping(
    state: CaseState, expected: ActivationPhase | str
) -> None:
    assert activation_phase(state) == expected


@pytest.mark.parametrize(
    "state",
    [CaseState.PLANNED, CaseState.SCHEDULED, CaseState.EXECUTING],
)
def test_plan_region_uses_mode(state: CaseState) -> None:
    assert activation_phase(state, mode="none") == ActivationPhase.EVALUATED
    assert activation_phase(state, mode="evaluate_date") == ActivationPhase.EVALUATED
    assert activation_phase(state, mode="compare_dates") == ActivationPhase.COMPARED
    assert activation_phase(state, mode="find_dates") == ActivationPhase.FOUND


def test_paused_derives_from_prior_active_state() -> None:
    assert (
        activation_phase(
            CaseState.PAUSED,
            prior_active_state=CaseState.COMPARED,
            mode="compare_dates",
        )
        == ActivationPhase.COMPARED
    )
    assert (
        activation_phase(
            CaseState.PAUSED,
            prior_active_state=CaseState.PLANNED,
            mode="evaluate_date",
        )
        == ActivationPhase.EVALUATED
    )


def test_paused_invalid_prior_returns_no_active_phase_option_a() -> None:
    assert activation_phase(CaseState.PAUSED) == NO_ACTIVE_PHASE
    assert (
        activation_phase(CaseState.PAUSED, prior_active_state=CaseState.ARCHIVED)
        == NO_ACTIVE_PHASE
    )
    assert (
        activation_phase(CaseState.PAUSED, prior_active_state="bogus")
        == NO_ACTIVE_PHASE
    )


def test_activation_phase_not_accepted_by_apply_transition() -> None:
    # ActivationPhase strings that are also CaseStates may transition as states;
    # non-state projection token must fail.
    result = apply_transition(
        CaseState.DRAFT,
        "NO_ACTIVE_PHASE",
        "start_intake",
        has_decision_type_or_classification_pending=True,
    )
    assert result.ok is False
    assert result.reason == "unknown_target_state"


def test_unknown_state_derives_no_active_phase() -> None:
    assert activation_phase("not_a_state") == NO_ACTIVE_PHASE
