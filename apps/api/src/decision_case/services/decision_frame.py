"""Persist Decision Frame fields onto Decision Case intake (authoritative SoR).

Canonical persisted operation shapes:

EVALUATE
  operation = evaluate
  time_scope = specific_date
  date = YYYY-MM-DD
  (also allowed: time_scope = none, no date — yes/no without timing)

COMPARE
  operation = compare
  time_scope = multiple_dates
  dates = [YYYY-MM-DD, ...]

FIND
  operation = find
  time_scope = date_range
  start = YYYY-MM-DD
  end = YYYY-MM-DD

Frame sessionStorage remains navigation convenience only.
This module does NOT run Decision Runtime, scoring, or FIND evaluation.
"""

from __future__ import annotations

import re
from datetime import date
from typing import Any
from uuid import UUID

from decision_case.repository import DecisionCaseRepository
from decision_case.repository.models import CaseRecord
from packages.decision_engine.find_windows import validate_find_range
from packages.decision_engine.registry import get_decision_type, resolve_decision_type
from packages.decision_engine.state_machine import CaseState

DECISION_FRAME_INTAKE_KEY = "decision_frame"
FRAME_SCHEMA_VERSION = "1.0.0"

_OPERATIONS = frozenset({"evaluate", "compare", "find"})
_TIME_SCOPES = frozenset(
    {"specific_date", "multiple_dates", "date_range", "none"}
)
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class FramingValidationError(Exception):
    def __init__(self, message: str, *, details: dict[str, Any] | None = None):
        self.details = details or {}
        super().__init__(message)


class FramingUnresolvedError(Exception):
    """Frame is not ready to persist onto a Case."""

    def __init__(self, message: str = "framing unresolved"):
        super().__init__(message)


def _parse_iso_date(value: str) -> date:
    if not _ISO_DATE.match(value):
        raise FramingValidationError(
            "invalid date format",
            details={"date": value, "expected": "YYYY-MM-DD"},
        )
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise FramingValidationError(
            "invalid calendar date",
            details={"date": value},
        ) from exc


def case_mode_for_operation(operation: str, time_scope: str) -> str:
    """Map Frame operation → Case date-intelligence mode (not a second operation field)."""
    if operation == "compare":
        return "compare_dates"
    if operation == "find" and time_scope == "date_range":
        return "find_dates"
    if operation == "evaluate" and time_scope == "specific_date":
        return "evaluate_date"
    # EVALUATE+none stays none.
    return "none"


def _collect_dates(raw: dict[str, Any]) -> list[str]:
    """Accept singular `date` or legacy `dates[]` on input; normalize to list.

    If both `date` and non-empty `dates` are supplied:
    - identical (dates == [date]) → accept deterministically as [date]
    - otherwise → reject (no silent pick / merge)
    """
    singular = raw.get("date")
    if singular is not None:
        if not isinstance(singular, str):
            raise FramingValidationError("date must be a string")
        _parse_iso_date(singular)

    dates_raw = raw.get("dates")
    if dates_raw is None:
        dates_raw = []
    if not isinstance(dates_raw, list):
        raise FramingValidationError(
            "dates must be a list",
            details={"dates": dates_raw},
        )
    parsed: list[str] = []
    for item in dates_raw:
        if not isinstance(item, str):
            raise FramingValidationError(
                "date entries must be strings",
                details={"dates": dates_raw},
            )
        _parse_iso_date(item)
        parsed.append(item)

    if singular is not None and parsed:
        if parsed == [singular]:
            return [singular]
        raise FramingValidationError(
            "conflicting date and dates",
            details={"date": singular, "dates": parsed},
        )
    if singular is not None:
        return [singular]
    return sorted(set(parsed))


def _resolve_range_bound(
    raw: dict[str, Any],
    *,
    canonical: str,
    legacy: str,
) -> str | None:
    """Resolve start/end vs range_start/range_end without silent conflict pick."""
    canon_val = raw.get(canonical)
    legacy_val = raw.get(legacy)
    if canon_val is not None and legacy_val is not None:
        if canon_val != legacy_val:
            raise FramingValidationError(
                f"conflicting {canonical} and {legacy}",
                details={canonical: canon_val, legacy: legacy_val},
            )
        if not isinstance(canon_val, str):
            raise FramingValidationError(f"{canonical} must be a string")
        return canon_val
    chosen = canon_val if canon_val is not None else legacy_val
    if chosen is not None and not isinstance(chosen, str):
        raise FramingValidationError(f"{canonical} must be a string")
    return chosen


def normalize_persisted_framing(raw: dict[str, Any]) -> dict[str, Any]:
    """Validate and normalize framing for Case intake persistence.

    Output uses the canonical operation-specific field names.
    Does not invent today or repair missing fields.
    """
    operation = raw.get("operation")
    if operation not in _OPERATIONS:
        if operation == "unresolved" or operation is None:
            raise FramingUnresolvedError("operation unresolved")
        raise FramingValidationError(
            "invalid operation",
            details={"operation": operation},
        )

    time_scope = raw.get("time_scope")
    if time_scope not in _TIME_SCOPES:
        raise FramingValidationError(
            "invalid time_scope",
            details={"time_scope": time_scope},
        )

    dates = _collect_dates(raw)

    # Accept start/end (canonical) or legacy range_start/range_end on input.
    # Conflicting pairs are rejected; identical pairs accept canonical.
    start = _resolve_range_bound(raw, canonical="start", legacy="range_start")
    end = _resolve_range_bound(raw, canonical="end", legacy="range_end")

    options_in = raw.get("options") or []
    if options_in is None:
        options_in = []
    if not isinstance(options_in, list):
        raise FramingValidationError("options must be a list")
    options: list[dict[str, Any]] = []
    for opt in options_in:
        if not isinstance(opt, dict):
            raise FramingValidationError("option entries must be objects")
        label = str(opt.get("label") or "").strip()
        oid = str(opt.get("id") or "").strip() or f"opt-{len(options) + 1}"
        if not label:
            raise FramingValidationError("option.label is required")
        entry: dict[str, Any] = {"id": oid, "label": label}
        if opt.get("date"):
            d = str(opt["date"])
            _parse_iso_date(d)
            entry["date"] = d
        options.append(entry)

    objective = raw.get("objective")
    if objective is not None:
        objective = str(objective).strip() or None

    raw_intent = raw.get("raw_intent")
    if raw_intent is not None:
        raw_intent = str(raw_intent).strip() or None

    normalized: dict[str, Any] = {
        "schema_version": FRAME_SCHEMA_VERSION,
        "operation": operation,
        "time_scope": time_scope,
        # Explicit marker: FIND framing is persisted only — no runtime executed.
        "runtime_executed": False,
    }

    if operation == "evaluate":
        if time_scope == "specific_date":
            if len(dates) != 1:
                raise FramingValidationError(
                    "evaluate + specific_date requires exactly one date",
                    details={"dates": dates},
                )
            normalized["date"] = dates[0]
        elif time_scope == "none":
            if dates:
                raise FramingValidationError(
                    "evaluate + none must not include a date",
                    details={"dates": dates},
                )
        else:
            raise FramingValidationError(
                "evaluate requires time_scope specific_date or none",
                details={"time_scope": time_scope},
            )

    elif operation == "compare":
        if time_scope != "multiple_dates":
            raise FramingValidationError(
                "compare requires time_scope multiple_dates",
                details={"time_scope": time_scope},
            )
        # Prefer option dates when options carry temporal identity.
        option_dates = [
            str(opt["date"])
            for opt in options
            if isinstance(opt, dict) and opt.get("date")
        ]
        if option_dates:
            if len(option_dates) != len(set(option_dates)):
                raise FramingValidationError(
                    "compare options must have unique dates",
                    details={"option_dates": option_dates},
                )
            if dates and sorted(set(dates)) != sorted(set(option_dates)):
                raise FramingValidationError(
                    "compare dates and options disagree",
                    details={"dates": dates, "option_dates": option_dates},
                )
            dates = sorted(set(option_dates))
        if len(dates) < 2:
            raise FramingValidationError(
                "compare requires at least two dates",
                details={"dates": dates},
            )
        if len(dates) > 5:
            raise FramingValidationError(
                "compare allows at most five dates",
                details={"dates": dates},
            )
        if "date" in raw and raw.get("date") is not None:
            raise FramingValidationError(
                "compare framing must not include singular date",
                details={"date": raw.get("date")},
            )
        normalized["dates"] = dates

    elif operation == "find":
        if time_scope != "date_range":
            raise FramingValidationError(
                "find requires time_scope date_range",
                details={"time_scope": time_scope},
            )
        if not start or not end:
            raise FramingValidationError(
                "find requires start and end",
                details={"start": start, "end": end},
            )
        start_d = _parse_iso_date(start)
        end_d = _parse_iso_date(end)
        try:
            validate_find_range(start_d, end_d)
        except ValueError as exc:
            raise FramingValidationError(
                str(exc),
                details={"start": start, "end": end},
            ) from exc
        normalized["start"] = start
        normalized["end"] = end
        normalized["find_runtime"] = "timing_opt_find"

    if options:
        normalized["options"] = options
    if objective:
        normalized["objective"] = objective
    if raw_intent:
        normalized["raw_intent"] = raw_intent

    return normalized


def merge_intake_with_framing(
    current_intake: dict[str, Any],
    framing: dict[str, Any],
) -> dict[str, Any]:
    """Merge framing into intake without dropping sibling slot keys."""
    next_intake = dict(current_intake or {})
    next_intake[DECISION_FRAME_INTAKE_KEY] = framing
    return next_intake


def extract_framing_from_intake(intake: dict[str, Any] | None) -> dict[str, Any] | None:
    if not intake:
        return None
    frame = intake.get(DECISION_FRAME_INTAKE_KEY)
    return dict(frame) if isinstance(frame, dict) else None


def create_case_with_framing(
    repo: DecisionCaseRepository,
    *,
    owner_subject_id: str,
    decision_type_id: str,
    title: str,
    framing_raw: dict[str, Any],
) -> tuple[CaseRecord, dict[str, Any]]:
    framing = normalize_persisted_framing(framing_raw)
    resolution = resolve_decision_type(decision_type_id, "structured")
    record = get_decision_type(resolution.decision_type_id)
    mode = case_mode_for_operation(framing["operation"], framing["time_scope"])
    # Only set Case mode when allowed for this type; otherwise keep create_mode.
    if mode != "none" and mode not in record.allowed_modes:
        mode = resolution.mode

    intake = {DECISION_FRAME_INTAKE_KEY: framing}
    case = repo.create_case(
        owner_subject_id=owner_subject_id,
        decision_type_id=resolution.decision_type_id,
        family_id=resolution.family_id,
        title=title,
        mode=mode,
        intake=intake,
        actor="user",
    )
    # Advance draft → intake so framing-backed Cases are not abandoned drafts.
    if case.state == CaseState.DRAFT.value:
        case = repo.advance_state(
            case.case_id,
            owner_subject_id,
            to_state=CaseState.INTAKE.value,
            trigger="start_intake",
            expected_case_version=case.current_case_version,
            has_decision_type_or_classification_pending=True,
            actor="user",
        )
    return case, intake


def update_case_framing(
    repo: DecisionCaseRepository,
    *,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
    framing_raw: dict[str, Any],
) -> tuple[CaseRecord, dict[str, Any]]:
    framing = normalize_persisted_framing(framing_raw)
    case = repo.get_case(case_id, owner_subject_id)
    current = repo.get_current_version(case_id, owner_subject_id)
    next_intake = merge_intake_with_framing(dict(current.intake or {}), framing)
    mode = case_mode_for_operation(framing["operation"], framing["time_scope"])
    record = get_decision_type(case.decision_type_id)
    if mode != "none" and mode not in record.allowed_modes:
        mode = case.mode

    version = repo.append_case_version(
        case_id,
        owner_subject_id,
        expected_case_version=expected_case_version,
        intake=next_intake,
        mode=mode,
        reason="intake_update",
        actor="user",
    )
    case = repo.get_case(case_id, owner_subject_id)
    if case.state == CaseState.DRAFT.value:
        case = repo.advance_state(
            case_id,
            owner_subject_id,
            to_state=CaseState.INTAKE.value,
            trigger="start_intake",
            expected_case_version=version.version,
            has_decision_type_or_classification_pending=True,
            actor="user",
        )
    return case, next_intake
