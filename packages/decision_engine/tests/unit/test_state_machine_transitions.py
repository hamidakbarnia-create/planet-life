"""E3 unit tests: canonical states, legal edges, illegal edges, side states."""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from packages.decision_engine.state_machine import (
    ALL_STATES,
    LEGAL_EDGES,
    ActivationPhase,
    CaseState,
    apply_transition,
    complete_case_composite,
)

MAIN_STATES = {
    CaseState.DRAFT,
    CaseState.INTAKE,
    CaseState.EVIDENCE_READY,
    CaseState.EVALUATED,
    CaseState.COMPARED,
    CaseState.FOUND,
    CaseState.PLANNED,
    CaseState.SCHEDULED,
    CaseState.EXECUTING,
    CaseState.COMPLETED,
    CaseState.REFLECTED,
    CaseState.ARCHIVED,
}

SIDE_STATES = {
    CaseState.PAUSED,
    CaseState.SUPERSEDED,
    CaseState.REJECTED,
}

PAUSE_SOURCES = MAIN_STATES - {CaseState.ARCHIVED}
SUPERSEDE_REJECT_SOURCES = PAUSE_SOURCES | {CaseState.PAUSED}

GUARD_BY_EDGE: dict[tuple[CaseState, CaseState, str], dict[str, bool]] = {
    (CaseState.DRAFT, CaseState.INTAKE, "start_intake"): {
        "has_decision_type_or_classification_pending": True
    },
    (CaseState.INTAKE, CaseState.INTAKE, "answer_intake"): {},
    (CaseState.INTAKE, CaseState.EVIDENCE_READY, "complete_intake"): {
        "intake_complete_or_soft_gaps_accepted": True
    },
    (CaseState.EVIDENCE_READY, CaseState.EVALUATED, "create_evaluation"): {
        "evaluation_accepted": True
    },
    (CaseState.EVALUATED, CaseState.EVALUATED, "re_evaluate"): {},
    (CaseState.EVALUATED, CaseState.COMPARED, "save_comparison"): {
        "comparison_saved": True
    },
    (CaseState.COMPARED, CaseState.COMPARED, "re_compare"): {},
    (CaseState.EVIDENCE_READY, CaseState.FOUND, "save_finding"): {
        "finding_saved": True
    },
    (CaseState.FOUND, CaseState.FOUND, "re_find"): {},
    (CaseState.EVALUATED, CaseState.PLANNED, "commit_plan"): {"plan_committed": True},
    (CaseState.COMPARED, CaseState.PLANNED, "commit_plan"): {"plan_committed": True},
    (CaseState.FOUND, CaseState.PLANNED, "commit_plan"): {"plan_committed": True},
    (CaseState.PLANNED, CaseState.SCHEDULED, "schedule"): {"time_bound_set": True},
    (CaseState.PLANNED, CaseState.EXECUTING, "start_execution"): {
        "execution_started": True
    },
    (CaseState.SCHEDULED, CaseState.EXECUTING, "start_execution"): {
        "execution_started": True
    },
    (CaseState.EXECUTING, CaseState.COMPLETED, "declare_completed"): {
        "user_declared_completion": True
    },
    (CaseState.COMPLETED, CaseState.REFLECTED, "reflect"): {
        "reflection_recorded_or_empty_allowed": True
    },
    (CaseState.REFLECTED, CaseState.ARCHIVED, "archive"): {"archive_requested": True},
}


def test_exact_canonical_main_and_side_states() -> None:
    assert MAIN_STATES | SIDE_STATES == ALL_STATES
    assert len(ALL_STATES) == 15
    assert SIDE_STATES <= ALL_STATES
    assert ActivationPhase.DRAFT.value in {s.value for s in CaseState}
    # activation_phase values are not additional Case states
    assert set(ALL_STATES) == set(CaseState)


def test_activation_phase_excluded_from_extra_case_states() -> None:
    phase_only = {p.value for p in ActivationPhase}
    assert phase_only <= {s.value for s in ALL_STATES}
    assert "NO_ACTIVE_PHASE" not in {s.value for s in ALL_STATES}


@pytest.mark.parametrize(
    ("frm", "to", "trigger"),
    sorted(GUARD_BY_EDGE.keys(), key=lambda t: (t[0].value, t[1].value, t[2])),
)
def test_every_main_legal_edge_succeeds(
    frm: CaseState, to: CaseState, trigger: str
) -> None:
    result = apply_transition(frm, to, trigger, **GUARD_BY_EDGE[(frm, to, trigger)])
    assert result.ok is True
    assert result.new_state == to


@pytest.mark.parametrize("source", sorted(PAUSE_SOURCES, key=lambda s: s.value))
def test_pause_from_every_pause_source(source: CaseState) -> None:
    result = apply_transition(
        source, CaseState.PAUSED, "pause", pause_requested=True
    )
    assert result.ok is True
    assert result.new_state == CaseState.PAUSED
    assert result.prior_active_state == source


@pytest.mark.parametrize("source", sorted(PAUSE_SOURCES, key=lambda s: s.value))
def test_resume_to_prior_active(source: CaseState) -> None:
    result = apply_transition(
        CaseState.PAUSED,
        source,
        "resume",
        prior_active_state=source,
    )
    assert result.ok is True
    assert result.new_state == source
    assert result.clear_prior_active_state is True


@pytest.mark.parametrize(
    "source", sorted(SUPERSEDE_REJECT_SOURCES, key=lambda s: s.value)
)
def test_supersede_and_reject_from_allowed_sources(source: CaseState) -> None:
    s = apply_transition(
        source, CaseState.SUPERSEDED, "supersede", supersede_requested=True
    )
    r = apply_transition(source, CaseState.REJECTED, "reject", reject_requested=True)
    assert s.ok and s.new_state == CaseState.SUPERSEDED
    assert r.ok and r.new_state == CaseState.REJECTED


@pytest.mark.parametrize(
    ("frm", "to", "trigger"),
    [
        (CaseState.EVALUATED, CaseState.COMPLETED, "declare_completed"),
        (CaseState.COMPARED, CaseState.COMPLETED, "declare_completed"),
        (CaseState.COMPLETED, CaseState.ARCHIVED, "archive"),
        (CaseState.DRAFT, CaseState.EVALUATED, "create_evaluation"),
        (CaseState.INTAKE, CaseState.EVALUATED, "create_evaluation"),
        (CaseState.EVIDENCE_READY, CaseState.COMPLETED, "declare_completed"),
        (CaseState.DRAFT, CaseState.ARCHIVED, "archive"),
        (CaseState.PLANNED, CaseState.COMPLETED, "declare_completed"),
        (CaseState.SCHEDULED, CaseState.COMPLETED, "declare_completed"),
        (CaseState.ARCHIVED, CaseState.PAUSED, "pause"),
        (CaseState.ARCHIVED, CaseState.DRAFT, "start_intake"),
        (CaseState.SUPERSEDED, CaseState.PAUSED, "pause"),
        (CaseState.REJECTED, CaseState.DRAFT, "start_intake"),
        (CaseState.PAUSED, CaseState.PAUSED, "pause"),
        (CaseState.SUPERSEDED, CaseState.REJECTED, "reject"),
        (CaseState.REJECTED, CaseState.SUPERSEDED, "supersede"),
    ],
)
def test_forbidden_edges_fail(frm: CaseState, to: CaseState, trigger: str) -> None:
    result = apply_transition(
        frm,
        to,
        trigger,
        pause_requested=True,
        supersede_requested=True,
        reject_requested=True,
        archive_requested=True,
        user_declared_completion=True,
        evaluation_accepted=True,
        plan_committed=True,
        has_decision_type_or_classification_pending=True,
    )
    assert result.ok is False


def test_unknown_state_and_trigger_fail() -> None:
    assert apply_transition("not_a_state", CaseState.INTAKE, "start_intake").ok is False
    assert (
        apply_transition(
            CaseState.DRAFT,
            CaseState.INTAKE,
            "not_a_trigger",
            has_decision_type_or_classification_pending=True,
        ).ok
        is False
    )


def test_resume_fails_loudly_without_valid_prior() -> None:
    missing = apply_transition(CaseState.PAUSED, CaseState.DRAFT, "resume")
    assert missing.ok is False
    assert missing.reason == "invalid_prior_active_state"

    bad = apply_transition(
        CaseState.PAUSED,
        CaseState.DRAFT,
        "resume",
        prior_active_state=CaseState.ARCHIVED,
    )
    assert bad.ok is False

    mismatch = apply_transition(
        CaseState.PAUSED,
        CaseState.DRAFT,
        "resume",
        prior_active_state=CaseState.INTAKE,
    )
    assert mismatch.ok is False
    assert mismatch.reason == "resume_target_mismatch"


def test_legal_edges_contains_no_direct_completion_shortcuts() -> None:
    assert (CaseState.EVALUATED, CaseState.COMPLETED, "declare_completed") not in LEGAL_EDGES
    assert (CaseState.COMPARED, CaseState.COMPLETED, "declare_completed") not in LEGAL_EDGES
    assert (CaseState.COMPLETED, CaseState.ARCHIVED, "archive") not in LEGAL_EDGES


def test_composite_does_not_add_illegal_single_edges_to_legal_edges() -> None:
    before = set(LEGAL_EDGES)
    complete_case_composite(CaseState.EVALUATED)
    assert set(LEGAL_EDGES) == before


def test_determinism() -> None:
    kwargs = {"has_decision_type_or_classification_pending": True}
    results = [
        apply_transition(CaseState.DRAFT, CaseState.INTAKE, "start_intake", **kwargs)
        for _ in range(10)
    ]
    assert all(r.ok and r.new_state == CaseState.INTAKE for r in results)


def test_state_machine_has_no_forbidden_imports() -> None:
    path = Path(__file__).resolve().parents[2] / "state_machine.py"
    tree = ast.parse(path.read_text(encoding="utf-8"))
    forbidden_prefixes = (
        "fastapi",
        "httpx",
        "sqlalchemy",
        "psycopg",
        "apps.api",
        "openai",
        "django",
        "flask",
    )
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                assert not alias.name.startswith(forbidden_prefixes)
        if isinstance(node, ast.ImportFrom) and node.module:
            assert not node.module.startswith(forbidden_prefixes)
