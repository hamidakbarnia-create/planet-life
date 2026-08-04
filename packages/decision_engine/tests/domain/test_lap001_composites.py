"""E3 domain tests: LAP-001 completion and archive composites."""

from __future__ import annotations

import pytest

from packages.decision_engine.state_machine import (
    LEGAL_EDGES,
    CaseState,
    archive_case_composite,
    complete_case_composite,
)


def test_complete_from_evaluated_path() -> None:
    plan = complete_case_composite(CaseState.EVALUATED)
    assert plan.ok is True
    assert plan.final_state == CaseState.COMPLETED
    assert [ (s.from_state, s.to_state, s.trigger) for s in plan.steps ] == [
        (CaseState.EVALUATED, CaseState.PLANNED, "commit_plan"),
        (CaseState.PLANNED, CaseState.EXECUTING, "start_execution"),
        (CaseState.EXECUTING, CaseState.COMPLETED, "declare_completed"),
    ]
    assert CaseState.SCHEDULED not in {s.to_state for s in plan.steps}
    assert CaseState.SCHEDULED not in {s.from_state for s in plan.steps}


def test_complete_from_compared_path() -> None:
    plan = complete_case_composite(CaseState.COMPARED)
    assert plan.ok is True
    assert plan.final_state == CaseState.COMPLETED
    assert plan.steps[0].from_state == CaseState.COMPARED
    assert plan.steps[0].to_state == CaseState.PLANNED
    assert [s.to_state for s in plan.steps] == [
        CaseState.PLANNED,
        CaseState.EXECUTING,
        CaseState.COMPLETED,
    ]
    assert all(s.to_state != CaseState.SCHEDULED for s in plan.steps)


def test_archive_from_completed() -> None:
    plan = archive_case_composite(CaseState.COMPLETED)
    assert plan.ok is True
    assert plan.final_state == CaseState.ARCHIVED
    assert [ (s.from_state, s.to_state, s.trigger) for s in plan.steps ] == [
        (CaseState.COMPLETED, CaseState.REFLECTED, "reflect"),
        (CaseState.REFLECTED, CaseState.ARCHIVED, "archive"),
    ]


@pytest.mark.parametrize(
    "state",
    [
        CaseState.DRAFT,
        CaseState.INTAKE,
        CaseState.EVIDENCE_READY,
        CaseState.PLANNED,
        CaseState.COMPLETED,
        CaseState.ARCHIVED,
        CaseState.PAUSED,
    ],
)
def test_complete_wrong_start_fails(state: CaseState) -> None:
    plan = complete_case_composite(state)
    assert plan.ok is False
    assert plan.reason == "illegal_composite_start"


@pytest.mark.parametrize(
    "state",
    [
        CaseState.DRAFT,
        CaseState.EVALUATED,
        CaseState.COMPARED,
        CaseState.REFLECTED,
        CaseState.ARCHIVED,
        CaseState.PAUSED,
    ],
)
def test_archive_wrong_start_fails(state: CaseState) -> None:
    plan = archive_case_composite(state)
    assert plan.ok is False
    assert plan.reason == "illegal_composite_start"


def test_composite_unknown_state_fails() -> None:
    assert complete_case_composite("nope").ok is False
    assert archive_case_composite("nope").ok is False


def test_composite_does_not_mutate_legal_edges() -> None:
    snapshot = frozenset(LEGAL_EDGES)
    complete_case_composite(CaseState.EVALUATED)
    archive_case_composite(CaseState.COMPLETED)
    assert LEGAL_EDGES == snapshot
    assert (CaseState.EVALUATED, CaseState.COMPLETED, "declare_completed") not in LEGAL_EDGES
    assert (CaseState.COMPLETED, CaseState.ARCHIVED, "archive") not in LEGAL_EDGES
