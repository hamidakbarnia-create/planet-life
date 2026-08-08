"""PostgreSQL Decision Case Repository (EPIC-001 E4).

Calls E3 state_machine for lifecycle authority. No HTTP / LLM / DIE scoring.
"""

from __future__ import annotations

import json
from datetime import date
from typing import Any, Sequence
from uuid import UUID, uuid4

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from packages.decision_engine.state_machine import (
    CaseState,
    apply_transition,
    archive_case_composite as e3_archive_composite,
    complete_case_composite as e3_complete_composite,
)

from .errors import (
    BrokenReferenceError,
    CaseNotFoundError,
    DuplicateCaseError,
    DuplicateVersionError,
    IllegalTransitionError,
    InvalidEvidenceStateError,
    InvalidStateError,
    MissingRelationError,
    StaleVersionError,
)
from .models import (
    CaseRecord,
    CaseVersionRecord,
    ComparisonRank,
    ComparisonRecord,
    EvaluationRecord,
    EvidenceBindingRecord,
    HistoryEventRecord,
    ParticipantRecord,
    TimelineEntry,
)

_ELIGIBILITY = frozenset(
    {"supported", "partial", "unknown", "unavailable", "provisional", "rejected"}
)
_PARTICIPANT_ROLES = frozenset({"subject", "partner", "counterparty", "other"})
_VERSION_REASONS = frozenset({"create", "intake_update", "mode_change"})
_MODES = frozenset({"none", "evaluate_date", "compare_dates"})
_PRECISION = frozenset({f"L{i}" for i in range(1, 8)})


def _case_from_row(row: dict[str, Any]) -> CaseRecord:
    return CaseRecord(
        case_id=row["case_id"],
        owner_subject_id=row["owner_subject_id"],
        decision_type_id=row["decision_type_id"],
        family_id=row["family_id"],
        title=row["title"],
        state=row["state"],
        mode=row["mode"],
        precision_level=row["precision_level"],
        schema_version=row["schema_version"],
        current_case_version=row["current_case_version"],
        prior_active_state=row["paused_prior_state"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _version_from_row(row: dict[str, Any]) -> CaseVersionRecord:
    intake = row["intake"]
    constraints = row["constraints"]
    if isinstance(intake, str):
        intake = json.loads(intake)
    if isinstance(constraints, str):
        constraints = json.loads(constraints)
    return CaseVersionRecord(
        case_id=row["case_id"],
        version=row["version"],
        intake=intake,
        constraints=constraints,
        mode=row["mode"],
        reason=row["reason"],
        created_at=row["created_at"],
    )


class DecisionCaseRepository:
    """Sole System of Record writer/reader for Decision Case aggregates."""

    def __init__(self, conn: Connection) -> None:
        self._conn = conn

    # ------------------------------------------------------------------ reads

    def get_case(self, case_id: UUID, owner_subject_id: str) -> CaseRecord:
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM decision_cases
                WHERE case_id = %s AND owner_subject_id = %s
                """,
                (case_id, owner_subject_id),
            )
            row = cur.fetchone()
        if row is None:
            raise CaseNotFoundError(f"case not found: {case_id}")
        return _case_from_row(row)

    def get_current_version(
        self, case_id: UUID, owner_subject_id: str
    ) -> CaseVersionRecord:
        case = self.get_case(case_id, owner_subject_id)
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM decision_versions
                WHERE case_id = %s
                ORDER BY version DESC
                LIMIT 1
                """,
                (case_id,),
            )
            row = cur.fetchone()
        if row is None:
            raise MissingRelationError(f"no versions for case {case_id}")
        _ = case
        return _version_from_row(row)

    def list_cases(
        self, owner_subject_id: str, state_filter: str | None = None
    ) -> list[CaseRecord]:
        with self._conn.cursor(row_factory=dict_row) as cur:
            if state_filter is None:
                cur.execute(
                    """
                    SELECT * FROM decision_cases
                    WHERE owner_subject_id = %s
                    ORDER BY updated_at DESC
                    """,
                    (owner_subject_id,),
                )
            else:
                cur.execute(
                    """
                    SELECT * FROM decision_cases
                    WHERE owner_subject_id = %s AND state = %s
                    ORDER BY updated_at DESC
                    """,
                    (owner_subject_id, state_filter),
                )
            return [_case_from_row(r) for r in cur.fetchall()]

    def get_evaluation(
        self, case_id: UUID, evaluation_id: UUID, owner_subject_id: str
    ) -> EvaluationRecord:
        self.get_case(case_id, owner_subject_id)
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM decision_evaluations
                WHERE case_id = %s AND evaluation_id = %s
                """,
                (case_id, evaluation_id),
            )
            row = cur.fetchone()
        if row is None:
            raise MissingRelationError(f"evaluation not found: {evaluation_id}")
        return self._evaluation_from_row(row)

    def list_evaluations(
        self, case_id: UUID, owner_subject_id: str
    ) -> list[EvaluationRecord]:
        self.get_case(case_id, owner_subject_id)
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM decision_evaluations
                WHERE case_id = %s
                ORDER BY evaluation_version DESC
                """,
                (case_id,),
            )
            return [self._evaluation_from_row(r) for r in cur.fetchall()]

    def get_history(
        self, case_id: UUID, owner_subject_id: str
    ) -> list[HistoryEventRecord]:
        self.get_case(case_id, owner_subject_id)
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM decision_history_events
                WHERE case_id = %s
                ORDER BY at ASC, history_id ASC
                """,
                (case_id,),
            )
            return [self._history_from_row(r) for r in cur.fetchall()]

    def get_timeline(
        self, case_id: UUID, owner_subject_id: str
    ) -> list[TimelineEntry]:
        history = self.get_history(case_id, owner_subject_id)
        entries: list[TimelineEntry] = [
            TimelineEntry(
                kind=h.event,
                at=h.at,
                detail={
                    "from_state": h.from_state,
                    "to_state": h.to_state,
                    "case_version": h.case_version,
                    "payload": h.payload,
                },
            )
            for h in history
        ]
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT candidate_date_id, candidate_date, created_at, case_version
                FROM decision_candidate_dates
                WHERE case_id = %s
                ORDER BY created_at ASC
                """,
                (case_id,),
            )
            for row in cur.fetchall():
                entries.append(
                    TimelineEntry(
                        kind="candidate_date",
                        at=row["created_at"],
                        detail={
                            "candidate_date_id": str(row["candidate_date_id"]),
                            "candidate_date": row["candidate_date"].isoformat(),
                            "case_version": row["case_version"],
                        },
                    )
                )
            cur.execute(
                """
                SELECT evaluation_id, evaluation_version, created_at, case_version
                FROM decision_evaluations
                WHERE case_id = %s
                ORDER BY created_at ASC
                """,
                (case_id,),
            )
            for row in cur.fetchall():
                entries.append(
                    TimelineEntry(
                        kind="evaluation",
                        at=row["created_at"],
                        detail={
                            "evaluation_id": str(row["evaluation_id"]),
                            "evaluation_version": row["evaluation_version"],
                            "case_version": row["case_version"],
                        },
                    )
                )
        entries.sort(key=lambda e: e.at)
        return entries

    # ----------------------------------------------------------------- writes

    def create_case(
        self,
        *,
        owner_subject_id: str,
        decision_type_id: str,
        family_id: str,
        title: str,
        mode: str = "none",
        precision_level: str = "L1",
        intake: dict[str, Any] | None = None,
        constraints: dict[str, Any] | None = None,
        actor: str = "system",
        case_id: UUID | None = None,
    ) -> CaseRecord:
        if mode not in _MODES:
            raise InvalidStateError(f"invalid mode: {mode}")
        if precision_level not in _PRECISION:
            raise InvalidStateError(f"invalid precision: {precision_level}")
        new_id = case_id or uuid4()
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    INSERT INTO decision_cases (
                        case_id, owner_subject_id, decision_type_id, family_id,
                        title, state, mode, precision_level, schema_version,
                        current_case_version, paused_prior_state
                    ) VALUES (
                        %s, %s, %s, %s, %s, 'draft', %s, %s, '1.0.0', 1, NULL
                    )
                    RETURNING *
                    """,
                    (
                        new_id,
                        owner_subject_id,
                        decision_type_id,
                        family_id,
                        title,
                        mode,
                        precision_level,
                    ),
                )
                case_row = cur.fetchone()
                assert case_row is not None
                cur.execute(
                    """
                    INSERT INTO decision_versions (
                        case_id, version, intake, constraints, mode, reason
                    ) VALUES (%s, 1, %s, %s, %s, 'create')
                    """,
                    (
                        new_id,
                        Jsonb(intake or {}),
                        Jsonb(constraints or {}),
                        mode,
                    ),
                )
                self._insert_history(
                    cur,
                    case_id=new_id,
                    actor=actor,
                    event="case_created",
                    payload={"state": "draft"},
                    case_version=1,
                )
            self._conn.commit()
        except Exception as exc:
            self._conn.rollback()
            if "decision_cases_pkey" in str(exc) or "unique" in str(exc).lower():
                raise DuplicateCaseError(str(new_id)) from exc
            raise
        return _case_from_row(case_row)

    def append_case_version(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        expected_case_version: int,
        intake: dict[str, Any],
        constraints: dict[str, Any] | None = None,
        mode: str | None = None,
        reason: str = "intake_update",
        actor: str = "system",
    ) -> CaseVersionRecord:
        if reason not in _VERSION_REASONS or reason == "create":
            raise InvalidStateError(f"invalid version reason: {reason}")
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                case = self._lock_case(cur, case_id, owner_subject_id)
                new_token = self._cas(
                    cur,
                    case_id,
                    expected_case_version,
                    state=case.state,
                    mode=mode or case.mode,
                    paused_prior_state=case.prior_active_state,
                )
                cur.execute(
                    """
                    INSERT INTO decision_versions (
                        case_id, version, intake, constraints, mode, reason
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        case_id,
                        new_token,
                        Jsonb(intake),
                        Jsonb(constraints or {}),
                        mode or case.mode,
                        reason,
                    ),
                )
                row = cur.fetchone()
                assert row is not None
                self._insert_history(
                    cur,
                    case_id=case_id,
                    actor=actor,
                    event="intake_updated",
                    payload={"reason": reason},
                    case_version=new_token,
                )
            self._conn.commit()
        except StaleVersionError:
            self._conn.rollback()
            raise
        except Exception as exc:
            self._conn.rollback()
            if "decision_versions_pkey" in str(exc):
                raise DuplicateVersionError(str(exc)) from exc
            raise
        return _version_from_row(row)

    def advance_state(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        to_state: str,
        trigger: str,
        expected_case_version: int,
        prior_active_state: str | None = None,
        actor: str = "system",
        **guards: bool,
    ) -> CaseRecord:
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                case = self._lock_case(cur, case_id, owner_subject_id)
                result = apply_transition(
                    case.state,
                    to_state,
                    trigger,
                    prior_active_state=prior_active_state
                    if prior_active_state is not None
                    else case.prior_active_state,
                    **guards,
                )
                if not result.ok or result.new_state is None:
                    raise IllegalTransitionError(
                        result.reason or "illegal_transition"
                    )
                new_prior: str | None
                if result.clear_prior_active_state:
                    new_prior = None
                elif result.prior_active_state is not None:
                    new_prior = (
                        result.prior_active_state.value
                        if isinstance(result.prior_active_state, CaseState)
                        else str(result.prior_active_state)
                    )
                else:
                    new_prior = case.prior_active_state
                new_state = (
                    result.new_state.value
                    if isinstance(result.new_state, CaseState)
                    else str(result.new_state)
                )
                new_token = self._cas(
                    cur,
                    case_id,
                    expected_case_version,
                    state=new_state,
                    mode=case.mode,
                    paused_prior_state=new_prior,
                )
                self._insert_history(
                    cur,
                    case_id=case_id,
                    actor=actor,
                    event="state_transition",
                    payload={"trigger": trigger},
                    from_state=case.state,
                    to_state=new_state,
                    case_version=new_token,
                )
                cur.execute(
                    "SELECT * FROM decision_cases WHERE case_id = %s",
                    (case_id,),
                )
                row = cur.fetchone()
                assert row is not None
            self._conn.commit()
        except (StaleVersionError, IllegalTransitionError, CaseNotFoundError):
            self._conn.rollback()
            raise
        except Exception:
            self._conn.rollback()
            raise
        return _case_from_row(row)

    def complete_case_composite(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        expected_case_version: int,
        actor: str = "system",
    ) -> CaseRecord:
        return self._run_composite(
            case_id,
            owner_subject_id,
            expected_case_version=expected_case_version,
            actor=actor,
            plan_factory=e3_complete_composite,
            terminal_event="case_completed",
            step_guards={
                "commit_plan": {"plan_committed": True},
                "start_execution": {"execution_started": True},
                "declare_completed": {"user_declared_completion": True},
            },
        )

    def archive_case_composite(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        expected_case_version: int,
        actor: str = "system",
    ) -> CaseRecord:
        return self._run_composite(
            case_id,
            owner_subject_id,
            expected_case_version=expected_case_version,
            actor=actor,
            plan_factory=e3_archive_composite,
            terminal_event="case_archived",
            step_guards={
                "reflect": {"reflection_recorded_or_empty_allowed": True},
                "archive": {"archive_requested": True},
            },
        )

    def append_evaluation(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        expected_case_version: int,
        package: dict[str, Any],
        package_contract_version: str,
        engine_id: str,
        dq_status: str,
        case_version: int | None = None,
        actor: str = "system",
        evaluation_id: UUID | None = None,
    ) -> EvaluationRecord:
        if dq_status not in {"pass", "blocked"}:
            raise InvalidStateError(f"invalid dq_status: {dq_status}")
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                case = self._lock_case(cur, case_id, owner_subject_id)
                eval_case_version = case_version
                if eval_case_version is None:
                    cur.execute(
                        """
                        SELECT MAX(version) AS v FROM decision_versions
                        WHERE case_id = %s
                        """,
                        (case_id,),
                    )
                    eval_case_version = int(cur.fetchone()["v"])
                cur.execute(
                    """
                    SELECT 1 FROM decision_versions
                    WHERE case_id = %s AND version = %s
                    """,
                    (case_id, eval_case_version),
                )
                if cur.fetchone() is None:
                    raise MissingRelationError(
                        f"case_version {eval_case_version} missing"
                    )
                package_mode = (
                    package.get("mode") if isinstance(package, dict) else None
                )
                # COMPARE re-run: persist a new package while remaining compared.
                # Final compared identity is established by save_comparison.
                if (
                    case.state == CaseState.COMPARED.value
                    and package_mode == "compare_dates"
                ):
                    new_token = self._cas(
                        cur,
                        case_id,
                        expected_case_version,
                        state=CaseState.COMPARED.value,
                        mode="compare_dates",
                        paused_prior_state=None,
                    )
                    next_state = CaseState.COMPARED.value
                    emit_eval_transition = False
                elif case.state == CaseState.EVIDENCE_READY.value:
                    tr = apply_transition(
                        case.state,
                        CaseState.EVALUATED.value,
                        "create_evaluation",
                        evaluation_accepted=True,
                    )
                    if not tr.ok:
                        raise IllegalTransitionError(
                            tr.reason or "illegal_transition"
                        )
                    new_token = self._cas(
                        cur,
                        case_id,
                        expected_case_version,
                        state=CaseState.EVALUATED.value,
                        mode=case.mode,
                        paused_prior_state=None,
                    )
                    next_state = CaseState.EVALUATED.value
                    emit_eval_transition = True
                elif case.state == CaseState.EVALUATED.value:
                    tr = apply_transition(
                        case.state,
                        CaseState.EVALUATED.value,
                        "re_evaluate",
                    )
                    if not tr.ok:
                        raise IllegalTransitionError(
                            tr.reason or "illegal_transition"
                        )
                    new_token = self._cas(
                        cur,
                        case_id,
                        expected_case_version,
                        state=CaseState.EVALUATED.value,
                        mode=case.mode,
                        paused_prior_state=None,
                    )
                    next_state = CaseState.EVALUATED.value
                    emit_eval_transition = False
                else:
                    raise IllegalTransitionError(
                        f"cannot evaluate from state {case.state}"
                    )
                cur.execute(
                    """
                    SELECT COALESCE(MAX(evaluation_version), 0) + 1 AS next
                    FROM decision_evaluations WHERE case_id = %s
                    """,
                    (case_id,),
                )
                next_eval = int(cur.fetchone()["next"])
                eid = evaluation_id or uuid4()
                cur.execute(
                    """
                    INSERT INTO decision_evaluations (
                        evaluation_id, case_id, case_version, evaluation_version,
                        package_contract_version, package, engine_id, dq_status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        eid,
                        case_id,
                        eval_case_version,
                        next_eval,
                        package_contract_version,
                        Jsonb(package),
                        engine_id,
                        dq_status,
                    ),
                )
                row = cur.fetchone()
                assert row is not None
                if emit_eval_transition and case.state != next_state:
                    self._insert_history(
                        cur,
                        case_id=case_id,
                        actor=actor,
                        event="state_transition",
                        payload={"trigger": "create_evaluation"},
                        from_state=case.state,
                        to_state=next_state,
                        case_version=new_token,
                    )
                recommendation = package.get("recommendation")
                stance = (
                    recommendation.get("stance")
                    if isinstance(recommendation, dict)
                    else None
                )
                self._insert_history(
                    cur,
                    case_id=case_id,
                    actor=actor,
                    event="evaluation_created",
                    payload={
                        "evaluation_id": str(eid),
                        "evaluation_version": next_eval,
                        "dq_status": dq_status,
                        "stance": stance,
                        "engine_id": engine_id,
                        "package_mode": package_mode,
                    },
                    case_version=new_token,
                )
            self._conn.commit()
        except (
            StaleVersionError,
            IllegalTransitionError,
            CaseNotFoundError,
            MissingRelationError,
        ):
            self._conn.rollback()
            raise
        except Exception as exc:
            self._conn.rollback()
            if "decision_evaluations_case_eval_version_key" in str(exc):
                raise DuplicateVersionError(str(exc)) from exc
            raise
        return self._evaluation_from_row(row)

    def append_evidence_binding(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        framework_id: str,
        eligibility: str,
        artifact_ref: str,
        limits: list[Any] | None = None,
        evaluation_id: UUID | None = None,
        actor: str = "system",
        evidence_binding_id: UUID | None = None,
    ) -> EvidenceBindingRecord:
        if eligibility not in _ELIGIBILITY:
            raise InvalidEvidenceStateError(eligibility)
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                self._lock_case(cur, case_id, owner_subject_id)
                eid = evidence_binding_id or uuid4()
                cur.execute(
                    """
                    INSERT INTO decision_evidence_bindings (
                        evidence_binding_id, case_id, framework_id, eligibility,
                        artifact_ref, limits, evaluation_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        eid,
                        case_id,
                        framework_id,
                        eligibility,
                        artifact_ref,
                        Jsonb(limits or []),
                        evaluation_id,
                    ),
                )
                row = cur.fetchone()
                assert row is not None
                self._insert_history(
                    cur,
                    case_id=case_id,
                    actor=actor,
                    event="evidence_bound",
                    payload={
                        "evidence_binding_id": str(eid),
                        "eligibility": eligibility,
                    },
                )
            self._conn.commit()
        except CaseNotFoundError:
            self._conn.rollback()
            raise
        except Exception as exc:
            self._conn.rollback()
            if "eligibility" in str(exc):
                raise InvalidEvidenceStateError(eligibility) from exc
            raise
        return self._evidence_from_row(row)

    def append_participant(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        person_ref: str,
        role: str,
        participant_id: UUID | None = None,
    ) -> ParticipantRecord:
        if role not in _PARTICIPANT_ROLES:
            raise InvalidStateError(f"invalid role: {role}")
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                self._lock_case(cur, case_id, owner_subject_id)
                pid = participant_id or uuid4()
                cur.execute(
                    """
                    INSERT INTO decision_participants (
                        participant_id, case_id, person_ref, role
                    ) VALUES (%s, %s, %s, %s)
                    RETURNING *
                    """,
                    (pid, case_id, person_ref, role),
                )
                row = cur.fetchone()
                assert row is not None
            self._conn.commit()
        except CaseNotFoundError:
            self._conn.rollback()
            raise
        except Exception:
            self._conn.rollback()
            raise
        return ParticipantRecord(
            participant_id=row["participant_id"],
            case_id=row["case_id"],
            person_ref=row["person_ref"],
            role=row["role"],
            created_at=row["created_at"],
        )

    def append_candidate_dates(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        expected_case_version: int,
        candidates: Sequence[tuple[date, str | None]],
        case_version: int | None = None,
        actor: str = "system",
    ) -> list[Any]:
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                case = self._lock_case(cur, case_id, owner_subject_id)
                ver = case_version
                if ver is None:
                    cur.execute(
                        """
                        SELECT MAX(version) AS v FROM decision_versions
                        WHERE case_id = %s
                        """,
                        (case_id,),
                    )
                    ver = int(cur.fetchone()["v"])
                # CAS bump (material child append associated with concurrency)
                self._cas(
                    cur,
                    case_id,
                    expected_case_version,
                    state=case.state,
                    mode=case.mode,
                    paused_prior_state=case.prior_active_state,
                )
                out = []
                for cand_date, label in candidates:
                    cid = uuid4()
                    cur.execute(
                        """
                        INSERT INTO decision_candidate_dates (
                            candidate_date_id, case_id, case_version,
                            candidate_date, label
                        ) VALUES (%s, %s, %s, %s, %s)
                        RETURNING *
                        """,
                        (cid, case_id, ver, cand_date, label),
                    )
                    row = cur.fetchone()
                    assert row is not None
                    out.append(row)
                self._insert_history(
                    cur,
                    case_id=case_id,
                    actor=actor,
                    event="intake_updated",
                    payload={"candidates_added": len(out)},
                    case_version=ver,
                )
            self._conn.commit()
        except (StaleVersionError, CaseNotFoundError):
            self._conn.rollback()
            raise
        except Exception as exc:
            self._conn.rollback()
            if "decision_candidate_dates_case_version_fkey" in str(exc):
                raise MissingRelationError(str(exc)) from exc
            raise
        return out

    def save_comparison(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        expected_case_version: int,
        evaluation_id: UUID,
        ranks: Sequence[ComparisonRank],
        actor: str = "system",
        comparison_id: UUID | None = None,
    ) -> ComparisonRecord:
        if len(ranks) < 2:
            raise BrokenReferenceError("compare_dates requires >= 2 ranks")
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                case = self._lock_case(cur, case_id, owner_subject_id)
                cur.execute(
                    """
                    SELECT case_version FROM decision_evaluations
                    WHERE case_id = %s AND evaluation_id = %s
                    """,
                    (case_id, evaluation_id),
                )
                eval_row = cur.fetchone()
                if eval_row is None:
                    raise MissingRelationError(f"evaluation {evaluation_id}")
                case_version = int(eval_row["case_version"])
                for rank in ranks:
                    cur.execute(
                        """
                        SELECT 1 FROM decision_candidate_dates
                        WHERE case_id = %s AND candidate_date_id = %s
                        """,
                        (case_id, rank.candidate_date_id),
                    )
                    if cur.fetchone() is None:
                        raise BrokenReferenceError(
                            f"candidate {rank.candidate_date_id}"
                        )
                if case.state == CaseState.EVALUATED.value:
                    tr = apply_transition(
                        case.state,
                        CaseState.COMPARED.value,
                        "save_comparison",
                        comparison_saved=True,
                    )
                elif case.state == CaseState.COMPARED.value:
                    tr = apply_transition(
                        case.state,
                        CaseState.COMPARED.value,
                        "re_compare",
                    )
                else:
                    raise IllegalTransitionError(
                        f"cannot compare from state {case.state}"
                    )
                if not tr.ok:
                    raise IllegalTransitionError(tr.reason or "illegal_transition")
                new_token = self._cas(
                    cur,
                    case_id,
                    expected_case_version,
                    state=CaseState.COMPARED.value,
                    mode="compare_dates",
                    paused_prior_state=None,
                )
                cid = comparison_id or uuid4()
                ranking_json = [
                    {
                        "candidate_date_id": str(r.candidate_date_id),
                        "rank": r.rank,
                        "score": r.score,
                        "band": r.band,
                    }
                    for r in ranks
                ]
                cur.execute(
                    """
                    INSERT INTO decision_comparisons (
                        comparison_id, case_id, case_version, evaluation_id, ranking
                    ) VALUES (%s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        cid,
                        case_id,
                        case_version,
                        evaluation_id,
                        Jsonb(ranking_json),
                    ),
                )
                crow = cur.fetchone()
                assert crow is not None
                for r in ranks:
                    cur.execute(
                        """
                        INSERT INTO decision_comparison_ranks (
                            comparison_id, candidate_date_id, rank, score, band
                        ) VALUES (%s, %s, %s, %s, %s)
                        """,
                        (cid, r.candidate_date_id, r.rank, r.score, r.band),
                    )
                if case.state != CaseState.COMPARED.value:
                    self._insert_history(
                        cur,
                        case_id=case_id,
                        actor=actor,
                        event="state_transition",
                        payload={"trigger": "save_comparison"},
                        from_state=case.state,
                        to_state=CaseState.COMPARED.value,
                        case_version=new_token,
                    )
                self._insert_history(
                    cur,
                    case_id=case_id,
                    actor=actor,
                    event="comparison_saved",
                    payload={"comparison_id": str(cid)},
                    case_version=new_token,
                )
            self._conn.commit()
        except (
            StaleVersionError,
            IllegalTransitionError,
            CaseNotFoundError,
            MissingRelationError,
            BrokenReferenceError,
        ):
            self._conn.rollback()
            raise
        except Exception as exc:
            self._conn.rollback()
            if "decision_comparison_ranks_candidate_date_id_fkey" in str(exc):
                raise BrokenReferenceError(str(exc)) from exc
            raise
        return ComparisonRecord(
            comparison_id=crow["comparison_id"],
            case_id=crow["case_id"],
            case_version=crow["case_version"],
            evaluation_id=crow["evaluation_id"],
            ranking=ranking_json,
            ranks=tuple(ranks),
            created_at=crow["created_at"],
        )

    def list_comparisons(
        self, case_id: UUID, owner_subject_id: str
    ) -> list[ComparisonRecord]:
        self.get_case(case_id, owner_subject_id)
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM decision_comparisons
                WHERE case_id = %s
                ORDER BY created_at DESC, comparison_id DESC
                """,
                (case_id,),
            )
            return [self._comparison_from_row(r) for r in cur.fetchall()]

    def get_comparison(
        self,
        case_id: UUID,
        comparison_id: UUID,
        owner_subject_id: str,
    ) -> ComparisonRecord:
        self.get_case(case_id, owner_subject_id)
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM decision_comparisons
                WHERE case_id = %s AND comparison_id = %s
                """,
                (case_id, comparison_id),
            )
            row = cur.fetchone()
        if row is None:
            raise MissingRelationError(f"comparison not found: {comparison_id}")
        return self._comparison_from_row(row)

    # --------------------------------------------------------------- helpers

    def _run_composite(
        self,
        case_id: UUID,
        owner_subject_id: str,
        *,
        expected_case_version: int,
        actor: str,
        plan_factory: Any,
        terminal_event: str,
        step_guards: dict[str, dict[str, bool]],
    ) -> CaseRecord:
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                case = self._lock_case(cur, case_id, owner_subject_id)
                plan = plan_factory(case.state)
                if not plan.ok or plan.final_state is None:
                    raise IllegalTransitionError(
                        plan.reason or "illegal_composite_start"
                    )
                current = case.state
                for step in plan.steps:
                    guards = step_guards.get(step.trigger, {})
                    tr = apply_transition(
                        current, step.to_state, step.trigger, **guards
                    )
                    if not tr.ok:
                        raise IllegalTransitionError(
                            tr.reason or "illegal_transition"
                        )
                    self._insert_history(
                        cur,
                        case_id=case_id,
                        actor=actor,
                        event="state_transition",
                        payload={"trigger": step.trigger, "composite": True},
                        from_state=str(step.from_state.value)
                        if isinstance(step.from_state, CaseState)
                        else str(step.from_state),
                        to_state=str(step.to_state.value)
                        if isinstance(step.to_state, CaseState)
                        else str(step.to_state),
                    )
                    current = (
                        step.to_state.value
                        if isinstance(step.to_state, CaseState)
                        else str(step.to_state)
                    )
                final = (
                    plan.final_state.value
                    if isinstance(plan.final_state, CaseState)
                    else str(plan.final_state)
                )
                new_token = self._cas(
                    cur,
                    case_id,
                    expected_case_version,
                    state=final,
                    mode=case.mode,
                    paused_prior_state=None,
                )
                self._insert_history(
                    cur,
                    case_id=case_id,
                    actor=actor,
                    event=terminal_event,
                    payload={"final_state": final},
                    case_version=new_token,
                )
                cur.execute(
                    "SELECT * FROM decision_cases WHERE case_id = %s",
                    (case_id,),
                )
                row = cur.fetchone()
                assert row is not None
            self._conn.commit()
        except (StaleVersionError, IllegalTransitionError, CaseNotFoundError):
            self._conn.rollback()
            raise
        except Exception:
            self._conn.rollback()
            raise
        return _case_from_row(row)

    def _lock_case(
        self, cur: Any, case_id: UUID, owner_subject_id: str
    ) -> CaseRecord:
        cur.execute(
            """
            SELECT * FROM decision_cases
            WHERE case_id = %s AND owner_subject_id = %s
            FOR UPDATE
            """,
            (case_id, owner_subject_id),
        )
        row = cur.fetchone()
        if row is None:
            raise CaseNotFoundError(f"case not found: {case_id}")
        return _case_from_row(row)

    def _cas(
        self,
        cur: Any,
        case_id: UUID,
        expected_case_version: int,
        *,
        state: str,
        mode: str,
        paused_prior_state: str | None,
    ) -> int:
        new_token = expected_case_version + 1
        cur.execute(
            """
            UPDATE decision_cases
            SET state = %s,
                mode = %s,
                paused_prior_state = %s,
                current_case_version = %s,
                updated_at = now()
            WHERE case_id = %s AND current_case_version = %s
            """,
            (
                state,
                mode,
                paused_prior_state,
                new_token,
                case_id,
                expected_case_version,
            ),
        )
        if cur.rowcount != 1:
            raise StaleVersionError(
                f"expected_case_version={expected_case_version}"
            )
        return new_token

    def _insert_history(
        self,
        cur: Any,
        *,
        case_id: UUID,
        actor: str,
        event: str,
        payload: dict[str, Any],
        from_state: str | None = None,
        to_state: str | None = None,
        case_version: int | None = None,
    ) -> None:
        cur.execute(
            """
            INSERT INTO decision_history_events (
                history_id, case_id, actor, event, payload,
                from_state, to_state, case_version
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                uuid4(),
                case_id,
                actor,
                event,
                Jsonb(payload),
                from_state,
                to_state,
                case_version,
            ),
        )

    @staticmethod
    def _evaluation_from_row(row: dict[str, Any]) -> EvaluationRecord:
        package = row["package"]
        if isinstance(package, str):
            package = json.loads(package)
        return EvaluationRecord(
            evaluation_id=row["evaluation_id"],
            case_id=row["case_id"],
            case_version=row["case_version"],
            evaluation_version=row["evaluation_version"],
            package_contract_version=row["package_contract_version"],
            package=package,
            engine_id=row["engine_id"],
            dq_status=row["dq_status"],
            created_at=row["created_at"],
        )

    @staticmethod
    def _comparison_from_row(row: dict[str, Any]) -> ComparisonRecord:
        ranking = row["ranking"]
        if isinstance(ranking, str):
            ranking = json.loads(ranking)
        ranking_list = list(ranking or [])
        ranks = tuple(
            ComparisonRank(
                candidate_date_id=UUID(str(item["candidate_date_id"])),
                rank=int(item["rank"]),
                score=float(item["score"]),
                band=str(item["band"]),
            )
            for item in ranking_list
        )
        return ComparisonRecord(
            comparison_id=row["comparison_id"],
            case_id=row["case_id"],
            case_version=row["case_version"],
            evaluation_id=row["evaluation_id"],
            ranking=ranking_list,
            ranks=ranks,
            created_at=row["created_at"],
        )

    @staticmethod
    def _evidence_from_row(row: dict[str, Any]) -> EvidenceBindingRecord:
        limits = row["limits"]
        if isinstance(limits, str):
            limits = json.loads(limits)
        return EvidenceBindingRecord(
            evidence_binding_id=row["evidence_binding_id"],
            case_id=row["case_id"],
            framework_id=row["framework_id"],
            eligibility=row["eligibility"],
            artifact_ref=row["artifact_ref"],
            limits=list(limits),
            bound_at=row["bound_at"],
            evaluation_id=row["evaluation_id"],
        )

    @staticmethod
    def _history_from_row(row: dict[str, Any]) -> HistoryEventRecord:
        payload = row["payload"]
        if isinstance(payload, str):
            payload = json.loads(payload)
        return HistoryEventRecord(
            history_id=row["history_id"],
            case_id=row["case_id"],
            at=row["at"],
            actor=row["actor"],
            event=row["event"],
            payload=payload,
            from_state=row["from_state"],
            to_state=row["to_state"],
            case_version=row["case_version"],
        )
