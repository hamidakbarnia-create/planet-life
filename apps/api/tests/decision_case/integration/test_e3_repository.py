"""E3 state machine + repository transaction integration."""

from __future__ import annotations

import pytest

from decision_case.repository.postgres import DecisionCaseRepository
from packages.decision_engine.state_machine import (
    ALL_STATES,
    CaseState,
    activation_phase,
    apply_transition,
)

pytestmark = pytest.mark.identity_db


def test_e3_states_match_persisted_vocabulary(repo: DecisionCaseRepository) -> None:
    created = repo.create_case(
        owner_subject_id="s",
        decision_type_id="tim-compare-three",
        family_id="timing",
        title="t",
    )
    assert created.state in {s.value for s in ALL_STATES}
    # Drive to evaluated via E3 + repo
    c = repo.advance_state(
        created.case_id,
        "s",
        to_state="intake",
        trigger="start_intake",
        expected_case_version=1,
        has_decision_type_or_classification_pending=True,
    )
    assert apply_transition(
        "intake",
        "evidence_ready",
        "complete_intake",
        intake_complete_or_soft_gaps_accepted=True,
    ).ok
    c = repo.advance_state(
        created.case_id,
        "s",
        to_state="evidence_ready",
        trigger="complete_intake",
        expected_case_version=c.current_case_version,
        intake_complete_or_soft_gaps_accepted=True,
    )
    repo.append_evaluation(
        created.case_id,
        "s",
        expected_case_version=c.current_case_version,
        package={"recommendation": {"stance": "proceed"}},
        package_contract_version="1.0.0",
        engine_id="die-v1",
        dq_status="pass",
    )
    case = repo.get_case(created.case_id, "s")
    assert case.state == CaseState.EVALUATED.value
    assert activation_phase(case.state) == "evaluated"
    hist = repo.get_history(created.case_id, "s")
    assert hist[0].event == "case_created"
    assert any(h.to_state == "evaluated" for h in hist if h.event == "state_transition")
