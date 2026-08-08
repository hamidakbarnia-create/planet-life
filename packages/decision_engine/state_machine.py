"""Decision Case state machine (EPIC-001 E3).

Pure, deterministic lifecycle transitions per ACR-0001 §B4, LAP-001,
and DEC-0019 / GOV-ISSUE-002. No persistence, HTTP, or evaluation logic.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Final

# ---------------------------------------------------------------------------
# Public types
# ---------------------------------------------------------------------------


class CaseState(StrEnum):
    """Canonical Decision Case SoR states (ACR-0001 §B4.2)."""

    DRAFT = "draft"
    INTAKE = "intake"
    EVIDENCE_READY = "evidence_ready"
    EVALUATED = "evaluated"
    COMPARED = "compared"
    FOUND = "found"
    PLANNED = "planned"
    SCHEDULED = "scheduled"
    EXECUTING = "executing"
    COMPLETED = "completed"
    REFLECTED = "reflected"
    ARCHIVED = "archived"
    PAUSED = "paused"
    SUPERSEDED = "superseded"
    REJECTED = "rejected"


class ActivationPhase(StrEnum):
    """LAP-001 §2.7 activation-phase vocabulary (derived only; not SoR)."""

    DRAFT = "draft"
    INTAKE = "intake"
    EVIDENCE_READY = "evidence_ready"
    EVALUATED = "evaluated"
    COMPARED = "compared"
    FOUND = "found"
    COMPLETED = "completed"
    ARCHIVED = "archived"


NO_ACTIVE_PHASE: Final = "NO_ACTIVE_PHASE"

ALL_STATES: Final[frozenset[CaseState]] = frozenset(CaseState)

_PAUSE_SOURCES: Final[frozenset[CaseState]] = frozenset(
    {
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
    }
)

_SUPERSEDE_REJECT_SOURCES: Final[frozenset[CaseState]] = _PAUSE_SOURCES | {
    CaseState.PAUSED
}

_TERMINAL: Final[frozenset[CaseState]] = frozenset(
    {
        CaseState.ARCHIVED,
        CaseState.SUPERSEDED,
        CaseState.REJECTED,
    }
)

# Trigger tokens (internal edge keys; not an extra public product API surface).
_START_INTAKE = "start_intake"
_ANSWER_INTAKE = "answer_intake"
_COMPLETE_INTAKE = "complete_intake"
_CREATE_EVALUATION = "create_evaluation"
_RE_EVALUATE = "re_evaluate"
_SAVE_COMPARISON = "save_comparison"
_RE_COMPARE = "re_compare"
_SAVE_FINDING = "save_finding"
_RE_FIND = "re_find"
_COMMIT_PLAN = "commit_plan"
_SCHEDULE = "schedule"
_START_EXECUTION = "start_execution"
_DECLARE_COMPLETED = "declare_completed"
_REFLECT = "reflect"
_ARCHIVE = "archive"
_PAUSE = "pause"
_RESUME = "resume"
_SUPERSEDE = "supersede"
_REJECT = "reject"

_ALL_TRIGGERS: Final[frozenset[str]] = frozenset(
    {
        _START_INTAKE,
        _ANSWER_INTAKE,
        _COMPLETE_INTAKE,
        _CREATE_EVALUATION,
        _RE_EVALUATE,
        _SAVE_COMPARISON,
        _RE_COMPARE,
        _SAVE_FINDING,
        _RE_FIND,
        _COMMIT_PLAN,
        _SCHEDULE,
        _START_EXECUTION,
        _DECLARE_COMPLETED,
        _REFLECT,
        _ARCHIVE,
        _PAUSE,
        _RESUME,
        _SUPERSEDE,
        _REJECT,
    }
)

# (from, to, trigger) -> required guard flag name (None = no boolean guard)
_MAIN_EDGES: Final[dict[tuple[CaseState, CaseState, str], str | None]] = {
    (CaseState.DRAFT, CaseState.INTAKE, _START_INTAKE): (
        "has_decision_type_or_classification_pending"
    ),
    (CaseState.INTAKE, CaseState.INTAKE, _ANSWER_INTAKE): None,
    (CaseState.INTAKE, CaseState.EVIDENCE_READY, _COMPLETE_INTAKE): (
        "intake_complete_or_soft_gaps_accepted"
    ),
    (CaseState.EVIDENCE_READY, CaseState.EVALUATED, _CREATE_EVALUATION): (
        "evaluation_accepted"
    ),
    (CaseState.EVALUATED, CaseState.EVALUATED, _RE_EVALUATE): None,
    (CaseState.EVALUATED, CaseState.COMPARED, _SAVE_COMPARISON): "comparison_saved",
    (CaseState.COMPARED, CaseState.COMPARED, _RE_COMPARE): None,
    (CaseState.EVIDENCE_READY, CaseState.FOUND, _SAVE_FINDING): "finding_saved",
    (CaseState.FOUND, CaseState.FOUND, _RE_FIND): None,
    (CaseState.EVALUATED, CaseState.PLANNED, _COMMIT_PLAN): "plan_committed",
    (CaseState.COMPARED, CaseState.PLANNED, _COMMIT_PLAN): "plan_committed",
    (CaseState.FOUND, CaseState.PLANNED, _COMMIT_PLAN): "plan_committed",
    (CaseState.PLANNED, CaseState.SCHEDULED, _SCHEDULE): "time_bound_set",
    (CaseState.PLANNED, CaseState.EXECUTING, _START_EXECUTION): "execution_started",
    (CaseState.SCHEDULED, CaseState.EXECUTING, _START_EXECUTION): "execution_started",
    (CaseState.EXECUTING, CaseState.COMPLETED, _DECLARE_COMPLETED): (
        "user_declared_completion"
    ),
    (CaseState.COMPLETED, CaseState.REFLECTED, _REFLECT): (
        "reflection_recorded_or_empty_allowed"
    ),
    (CaseState.REFLECTED, CaseState.ARCHIVED, _ARCHIVE): "archive_requested",
}


def _build_legal_edges() -> frozenset[tuple[CaseState, CaseState, str]]:
    edges: set[tuple[CaseState, CaseState, str]] = set(_MAIN_EDGES.keys())
    for source in _PAUSE_SOURCES:
        edges.add((source, CaseState.PAUSED, _PAUSE))
    for source in _SUPERSEDE_REJECT_SOURCES:
        edges.add((source, CaseState.SUPERSEDED, _SUPERSEDE))
        edges.add((source, CaseState.REJECTED, _REJECT))
    for target in _PAUSE_SOURCES:
        edges.add((CaseState.PAUSED, target, _RESUME))
    return frozenset(edges)


LEGAL_EDGES: Final[frozenset[tuple[CaseState, CaseState, str]]] = _build_legal_edges()


@dataclass(frozen=True, slots=True)
class TransitionSuccess:
    ok: bool = True
    new_state: CaseState | None = None
    prior_active_state: CaseState | None = None
    clear_prior_active_state: bool = False
    reason: str | None = None


@dataclass(frozen=True, slots=True)
class TransitionRejection:
    ok: bool = False
    new_state: CaseState | None = None
    prior_active_state: CaseState | None = None
    clear_prior_active_state: bool = False
    reason: str = "rejected"


TransitionResult = TransitionSuccess | TransitionRejection


@dataclass(frozen=True, slots=True)
class HistoryStep:
    from_state: CaseState
    to_state: CaseState
    trigger: str


@dataclass(frozen=True, slots=True)
class CompositePlan:
    ok: bool
    steps: tuple[HistoryStep, ...]
    final_state: CaseState | None
    reason: str | None = None


def _parse_state(value: object) -> CaseState | None:
    if isinstance(value, CaseState):
        return value
    if isinstance(value, str):
        try:
            return CaseState(value)
        except ValueError:
            return None
    return None


def _reject(reason: str) -> TransitionRejection:
    return TransitionRejection(reason=reason)


def apply_transition(
    state: CaseState | str,
    to: CaseState | str,
    trigger: str,
    *,
    prior_active_state: CaseState | str | None = None,
    **guards: bool,
) -> TransitionResult:
    """Apply a single canonical lifecycle edge. Rejects unknown/illegal edges."""
    from_state = _parse_state(state)
    to_state = _parse_state(to)
    if from_state is None:
        return _reject("unknown_state")
    if to_state is None:
        return _reject("unknown_target_state")
    if trigger not in _ALL_TRIGGERS:
        return _reject("unknown_trigger")

    edge = (from_state, to_state, trigger)
    if edge not in LEGAL_EDGES:
        return _reject("illegal_transition")

    if trigger == _PAUSE:
        if not guards.get("pause_requested", False):
            return _reject("guard_failed")
        # prior_active_state recorded as the source (from_state ∈ PAUSE_SOURCES)
        return TransitionSuccess(
            new_state=CaseState.PAUSED,
            prior_active_state=from_state,
        )

    if trigger == _RESUME:
        prior = _parse_state(prior_active_state) if prior_active_state is not None else None
        if prior is None or prior not in _PAUSE_SOURCES:
            return _reject("invalid_prior_active_state")
        if to_state != prior:
            return _reject("resume_target_mismatch")
        return TransitionSuccess(
            new_state=prior,
            prior_active_state=None,
            clear_prior_active_state=True,
        )

    if trigger == _SUPERSEDE:
        if not guards.get("supersede_requested", False):
            return _reject("guard_failed")
        return TransitionSuccess(new_state=CaseState.SUPERSEDED)

    if trigger == _REJECT:
        if not guards.get("reject_requested", False):
            return _reject("guard_failed")
        return TransitionSuccess(new_state=CaseState.REJECTED)

    required_guard = _MAIN_EDGES.get(edge)
    if required_guard is not None and not guards.get(required_guard, False):
        return _reject("guard_failed")

    return TransitionSuccess(new_state=to_state)


def complete_case_composite(state: CaseState | str) -> CompositePlan:
    """LAP-001 §2.4 completion composite plan (does not mutate SoR)."""
    current = _parse_state(state)
    if current is None:
        return CompositePlan(
            ok=False,
            steps=(),
            final_state=None,
            reason="unknown_state",
        )
    if current not in {
        CaseState.EVALUATED,
        CaseState.COMPARED,
        CaseState.FOUND,
    }:
        return CompositePlan(
            ok=False,
            steps=(),
            final_state=None,
            reason="illegal_composite_start",
        )
    steps = (
        HistoryStep(current, CaseState.PLANNED, _COMMIT_PLAN),
        HistoryStep(CaseState.PLANNED, CaseState.EXECUTING, _START_EXECUTION),
        HistoryStep(CaseState.EXECUTING, CaseState.COMPLETED, _DECLARE_COMPLETED),
    )
    # Composites expand ACR edges; they do not add illegal single edges to LEGAL_EDGES.
    return CompositePlan(ok=True, steps=steps, final_state=CaseState.COMPLETED)


def archive_case_composite(state: CaseState | str) -> CompositePlan:
    """LAP-001 §2.5 archive composite plan (does not mutate SoR)."""
    current = _parse_state(state)
    if current is None:
        return CompositePlan(
            ok=False,
            steps=(),
            final_state=None,
            reason="unknown_state",
        )
    if current != CaseState.COMPLETED:
        return CompositePlan(
            ok=False,
            steps=(),
            final_state=None,
            reason="illegal_composite_start",
        )
    steps = (
        HistoryStep(CaseState.COMPLETED, CaseState.REFLECTED, _REFLECT),
        HistoryStep(CaseState.REFLECTED, CaseState.ARCHIVED, _ARCHIVE),
    )
    return CompositePlan(ok=True, steps=steps, final_state=CaseState.ARCHIVED)


def activation_phase(
    state: CaseState | str,
    *,
    mode: str = "none",
    prior_active_state: CaseState | str | None = None,
) -> ActivationPhase | str:
    """Derive LAP-001 activation_phase (Option A / DEC-0019). Never validates SoR."""
    current = _parse_state(state)
    if current is None:
        return NO_ACTIVE_PHASE

    if current in {
        CaseState.DRAFT,
        CaseState.INTAKE,
        CaseState.EVIDENCE_READY,
        CaseState.EVALUATED,
        CaseState.COMPARED,
        CaseState.FOUND,
    }:
        return ActivationPhase(current.value)

    if current in {
        CaseState.PLANNED,
        CaseState.SCHEDULED,
        CaseState.EXECUTING,
    }:
        if mode == "compare_dates":
            return ActivationPhase.COMPARED
        if mode == "find_dates":
            return ActivationPhase.FOUND
        return ActivationPhase.EVALUATED

    if current in {CaseState.COMPLETED, CaseState.REFLECTED}:
        return ActivationPhase.COMPLETED

    if current == CaseState.ARCHIVED:
        return ActivationPhase.ARCHIVED

    if current == CaseState.PAUSED:
        prior = (
            _parse_state(prior_active_state)
            if prior_active_state is not None
            else None
        )
        if prior is None or prior not in _PAUSE_SOURCES:
            return NO_ACTIVE_PHASE
        return activation_phase(prior, mode=mode)

    if current in {CaseState.SUPERSEDED, CaseState.REJECTED}:
        return NO_ACTIVE_PHASE

    return NO_ACTIVE_PHASE


__all__ = [
    "ALL_STATES",
    "ActivationPhase",
    "CaseState",
    "LEGAL_EDGES",
    "NO_ACTIVE_PHASE",
    "activation_phase",
    "apply_transition",
    "archive_case_composite",
    "complete_case_composite",
]
