"""Core Decision Case repository PostgreSQL tests (E4)."""

from __future__ import annotations

from datetime import date
from uuid import uuid4

import pytest

from decision_case.repository.errors import (
    BrokenReferenceError,
    CaseNotFoundError,
    IllegalTransitionError,
    InvalidEvidenceStateError,
    StaleVersionError,
)
from decision_case.repository.models import ComparisonRank
from decision_case.repository.postgres import DecisionCaseRepository
from identity_domain.harness import IdentityHarnessSession
from packages.decision_engine.state_machine import CaseState

pytestmark = pytest.mark.identity_db

OWNER = "subject-1"


def _create(repo: DecisionCaseRepository, **kwargs):
    return repo.create_case(
        owner_subject_id=OWNER,
        decision_type_id="tim-compare-three",
        family_id="timing",
        title="Case",
        **kwargs,
    )


def test_create_and_load(repo: DecisionCaseRepository) -> None:
    created = _create(repo)
    loaded = repo.get_case(created.case_id, OWNER)
    assert loaded.state == CaseState.DRAFT.value
    assert loaded.current_case_version == 1
    assert loaded.prior_active_state is None
    ver = repo.get_current_version(created.case_id, OWNER)
    assert ver.version == 1
    assert ver.reason == "create"


def test_owner_isolation(repo: DecisionCaseRepository) -> None:
    created = _create(repo)
    with pytest.raises(CaseNotFoundError):
        repo.get_case(created.case_id, "other")


def test_append_version_and_stale(repo: DecisionCaseRepository) -> None:
    created = _create(repo)
    v2 = repo.append_case_version(
        created.case_id,
        OWNER,
        expected_case_version=1,
        intake={"a": 1},
        reason="intake_update",
    )
    assert v2.version == 2
    case = repo.get_case(created.case_id, OWNER)
    assert case.current_case_version == 2
    with pytest.raises(StaleVersionError):
        repo.append_case_version(
            created.case_id,
            OWNER,
            expected_case_version=1,
            intake={"a": 2},
            reason="intake_update",
        )


def test_version_immutability_trigger(
    repo: DecisionCaseRepository, decision_db: IdentityHarnessSession
) -> None:
    created = _create(repo)
    with pytest.raises(Exception, match="UPDATE is forbidden"):
        with decision_db.conn.cursor() as cur:
            cur.execute(
                "UPDATE decision_versions SET reason = 'mode_change' WHERE case_id = %s",
                (created.case_id,),
            )
        decision_db.conn.commit()
    decision_db.conn.rollback()


def test_legal_and_illegal_transitions(repo: DecisionCaseRepository) -> None:
    created = _create(repo)
    case = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="intake",
        trigger="start_intake",
        expected_case_version=1,
        has_decision_type_or_classification_pending=True,
    )
    assert case.state == "intake"
    with pytest.raises(IllegalTransitionError):
        repo.advance_state(
            created.case_id,
            OWNER,
            to_state="completed",
            trigger="declare_completed",
            expected_case_version=case.current_case_version,
            user_declared_completion=True,
        )


def test_pause_resume_prior_active_state(
    repo: DecisionCaseRepository, decision_db: IdentityHarnessSession
) -> None:
    created = _create(repo)
    paused = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="paused",
        trigger="pause",
        expected_case_version=1,
        pause_requested=True,
    )
    assert paused.state == "paused"
    assert paused.prior_active_state == "draft"
    resumed = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="draft",
        trigger="resume",
        expected_case_version=paused.current_case_version,
        prior_active_state="draft",
    )
    assert resumed.state == "draft"
    assert resumed.prior_active_state is None
    decision_db.conn.rollback()
    with pytest.raises(Exception):
        with decision_db.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE decision_cases
                SET state = 'paused', paused_prior_state = NULL
                WHERE case_id = %s
                """,
                (created.case_id,),
            )
            decision_db.conn.commit()
    decision_db.conn.rollback()


def test_terminal_reject_and_history(repo: DecisionCaseRepository) -> None:
    created = _create(repo)
    rejected = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="rejected",
        trigger="reject",
        expected_case_version=1,
        reject_requested=True,
    )
    assert rejected.state == "rejected"
    with pytest.raises(IllegalTransitionError):
        repo.advance_state(
            created.case_id,
            OWNER,
            to_state="draft",
            trigger="start_intake",
            expected_case_version=rejected.current_case_version,
            has_decision_type_or_classification_pending=True,
        )
    hist = repo.get_history(created.case_id, OWNER)
    assert any(h.event == "state_transition" and h.to_state == "rejected" for h in hist)


def test_evaluation_append_and_immutability(
    repo: DecisionCaseRepository, decision_db: IdentityHarnessSession
) -> None:
    created = _create(repo)
    c = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="intake",
        trigger="start_intake",
        expected_case_version=1,
        has_decision_type_or_classification_pending=True,
    )
    c = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="evidence_ready",
        trigger="complete_intake",
        expected_case_version=c.current_case_version,
        intake_complete_or_soft_gaps_accepted=True,
    )
    package = {"recommendation": {"stance": "proceed"}, "modules": {}}
    ev = repo.append_evaluation(
        created.case_id,
        OWNER,
        expected_case_version=c.current_case_version,
        package=package,
        package_contract_version="1.0.0",
        engine_id="die-v1",
        dq_status="pass",
    )
    assert ev.evaluation_version == 1
    assert ev.case_version == 1
    case = repo.get_case(created.case_id, OWNER)
    assert case.state == "evaluated"
    with pytest.raises(Exception, match="UPDATE is forbidden"):
        with decision_db.conn.cursor() as cur:
            cur.execute(
                "UPDATE decision_evaluations SET engine_id = 'x' WHERE evaluation_id = %s",
                (ev.evaluation_id,),
            )
        decision_db.conn.commit()
    decision_db.conn.rollback()


def test_evidence_eligibility(
    repo: DecisionCaseRepository, decision_db: IdentityHarnessSession
) -> None:
    created = _create(repo)
    ok = repo.append_evidence_binding(
        created.case_id,
        OWNER,
        framework_id="timing",
        eligibility="provisional",
        artifact_ref="ref-1",
    )
    assert ok.eligibility == "provisional"
    with pytest.raises(InvalidEvidenceStateError):
        repo.append_evidence_binding(
            created.case_id,
            OWNER,
            framework_id="timing",
            eligibility="made_up",
            artifact_ref="ref-2",
        )
    with pytest.raises(Exception):
        with decision_db.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO decision_evidence_bindings (
                    evidence_binding_id, case_id, framework_id, eligibility, artifact_ref
                ) VALUES (%s, %s, 'f', 'bogus', 'a')
                """,
                (uuid4(), created.case_id),
            )
        decision_db.conn.commit()
    decision_db.conn.rollback()


def test_participants_candidates_comparisons(repo: DecisionCaseRepository) -> None:
    created = _create(repo, mode="compare_dates")
    c = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="intake",
        trigger="start_intake",
        expected_case_version=1,
        has_decision_type_or_classification_pending=True,
    )
    c = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="evidence_ready",
        trigger="complete_intake",
        expected_case_version=c.current_case_version,
        intake_complete_or_soft_gaps_accepted=True,
    )
    repo.append_participant(
        created.case_id, OWNER, person_ref="p1", role="subject"
    )
    rows = repo.append_candidate_dates(
        created.case_id,
        OWNER,
        expected_case_version=c.current_case_version,
        candidates=[(date(2026, 8, 1), "A"), (date(2026, 8, 2), "B")],
    )
    c = repo.get_case(created.case_id, OWNER)
    ev = repo.append_evaluation(
        created.case_id,
        OWNER,
        expected_case_version=c.current_case_version,
        package={"recommendation": {"stance": "proceed"}},
        package_contract_version="1.0.0",
        engine_id="die-v1",
        dq_status="pass",
    )
    c = repo.get_case(created.case_id, OWNER)
    cmp = repo.save_comparison(
        created.case_id,
        OWNER,
        expected_case_version=c.current_case_version,
        evaluation_id=ev.evaluation_id,
        ranks=[
            ComparisonRank(rows[0]["candidate_date_id"], 1, 0.9, "strong"),
            ComparisonRank(rows[1]["candidate_date_id"], 2, 0.7, "moderate"),
        ],
    )
    assert cmp.case_id == created.case_id
    case = repo.get_case(created.case_id, OWNER)
    assert case.state == "compared"
    with pytest.raises(BrokenReferenceError):
        repo.save_comparison(
            created.case_id,
            OWNER,
            expected_case_version=case.current_case_version,
            evaluation_id=ev.evaluation_id,
            ranks=[
                ComparisonRank(uuid4(), 1, 0.1, "weak"),
                ComparisonRank(rows[1]["candidate_date_id"], 2, 0.2, "weak"),
            ],
        )


def test_composites_and_timeline(repo: DecisionCaseRepository) -> None:
    created = _create(repo)
    c = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="intake",
        trigger="start_intake",
        expected_case_version=1,
        has_decision_type_or_classification_pending=True,
    )
    c = repo.advance_state(
        created.case_id,
        OWNER,
        to_state="evidence_ready",
        trigger="complete_intake",
        expected_case_version=c.current_case_version,
        intake_complete_or_soft_gaps_accepted=True,
    )
    repo.append_evaluation(
        created.case_id,
        OWNER,
        expected_case_version=c.current_case_version,
        package={"recommendation": {"stance": "proceed"}},
        package_contract_version="1.0.0",
        engine_id="die-v1",
        dq_status="pass",
    )
    c = repo.get_case(created.case_id, OWNER)
    completed = repo.complete_case_composite(
        created.case_id,
        OWNER,
        expected_case_version=c.current_case_version,
    )
    assert completed.state == "completed"
    hist = repo.get_history(created.case_id, OWNER)
    transitions = [h for h in hist if h.event == "state_transition"]
    assert any(h.to_state == "planned" for h in transitions)
    assert any(h.to_state == "executing" for h in transitions)
    assert any(h.to_state == "completed" for h in transitions)
    assert not any(h.to_state == "scheduled" for h in transitions)
    archived = repo.archive_case_composite(
        created.case_id,
        OWNER,
        expected_case_version=completed.current_case_version,
    )
    assert archived.state == "archived"
    timeline = repo.get_timeline(created.case_id, OWNER)
    assert any(e.kind == "case_archived" for e in timeline)


def test_transaction_rollback_on_partial_failure(
    repo: DecisionCaseRepository, decision_db: IdentityHarnessSession
) -> None:
    created = _create(repo)
    before = repo.get_case(created.case_id, OWNER).current_case_version
    with pytest.raises(IllegalTransitionError):
        repo.advance_state(
            created.case_id,
            OWNER,
            to_state="archived",
            trigger="archive",
            expected_case_version=before,
            archive_requested=True,
        )
    after = repo.get_case(created.case_id, OWNER)
    assert after.state == "draft"
    assert after.current_case_version == before


def test_concurrent_stale_write(
    decision_db: IdentityHarnessSession, identity_database_url: str
) -> None:
    import psycopg

    conn1 = decision_db.conn
    repo1 = DecisionCaseRepository(conn1)
    created = _create(repo1)
    conn2 = psycopg.connect(identity_database_url)
    conn2.autocommit = False
    try:
        repo2 = DecisionCaseRepository(conn2)
        repo1.append_case_version(
            created.case_id,
            OWNER,
            expected_case_version=1,
            intake={"writer": 1},
            reason="intake_update",
        )
        with pytest.raises(StaleVersionError):
            repo2.append_case_version(
                created.case_id,
                OWNER,
                expected_case_version=1,
                intake={"writer": 2},
                reason="intake_update",
            )
    finally:
        conn2.rollback()
        conn2.close()


def test_no_activation_phase_column(decision_db: IdentityHarnessSession) -> None:
    with decision_db.conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'decision_cases'
            """
        )
        cols = {r[0] for r in cur.fetchall()}
    assert "activation_phase" not in cols
    assert "paused_prior_state" in cols
