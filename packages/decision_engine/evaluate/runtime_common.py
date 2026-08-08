"""Shared helpers for EVALUATE runtimes.

This module contains behavior that is common across Decision Type runtimes.
It does not own decision-type-specific intake, scoring semantics, or package
content beyond shared framing/evidence helpers.
"""

from __future__ import annotations

from typing import Any, Mapping

NATAL_EVIDENCE_INTAKE_KEY = "natal_evidence"
DECISION_FRAME_INTAKE_KEY = "decision_frame"

_RATING_HIGHLY_FAVORABLE = "Highly Favorable"
_RATING_FAVORABLE = "Favorable"
_RATING_MIXED_PREFIX = "Mixed"


class RuntimeFramingError(Exception):
    """Case framing missing or not ready for EVALUATE execution."""

    def __init__(
        self,
        message: str,
        *,
        details: dict[str, Any] | None = None,
    ):
        self.details = details or {}
        super().__init__(message)


class RuntimeUnsupportedOperationError(Exception):
    """Requested Decision operation has no runtime implementation."""

    def __init__(self, operation: str):
        self.operation = operation
        super().__init__(f"operation not implemented: {operation}")


class RuntimeProviderError(Exception):
    """Upstream evidence/scoring provider failed."""

    def __init__(
        self,
        message: str,
        *,
        details: dict[str, Any] | None = None,
    ):
        self.details = details or {}
        super().__init__(message)


def rating_to_candidate_band(rating: str) -> str:
    if rating in {_RATING_HIGHLY_FAVORABLE, _RATING_FAVORABLE}:
        return "high"
    if rating.startswith(_RATING_MIXED_PREFIX):
        return "moderate"
    return "low"


def rating_to_stance(rating: str) -> str:
    if rating == _RATING_HIGHLY_FAVORABLE:
        return "proceed"
    if rating == _RATING_FAVORABLE or rating.startswith(_RATING_MIXED_PREFIX):
        return "proceed_with_conditions"
    return "wait"


def score_to_candidate_band(score: float) -> str:
    if score >= 65:
        return "high"
    if score >= 45:
        return "moderate"
    return "low"


def extract_evaluate_date_from_framing(
    intake: Mapping[str, Any],
) -> str:
    raw = intake.get(DECISION_FRAME_INTAKE_KEY)
    if not isinstance(raw, dict):
        raise RuntimeFramingError(
            "decision_frame required for evaluation",
            details={"missing": [DECISION_FRAME_INTAKE_KEY]},
        )

    operation = raw.get("operation")
    if operation == "compare":
        raise RuntimeUnsupportedOperationError("compare")
    if operation == "find":
        raise RuntimeUnsupportedOperationError("find")
    if operation != "evaluate":
        raise RuntimeFramingError(
            "evaluate operation required",
            details={"operation": operation},
        )

    time_scope = raw.get("time_scope")
    if time_scope == "none":
        raise RuntimeFramingError(
            "evaluate + time_scope=none has no date to evaluate",
            details={"time_scope": time_scope},
        )
    if time_scope != "specific_date":
        raise RuntimeFramingError(
            "evaluate requires time_scope=specific_date",
            details={"time_scope": time_scope},
        )

    date_value = raw.get("date")
    if not isinstance(date_value, str) or not date_value.strip():
        raise RuntimeFramingError(
            "decision_frame.date required",
            details={"missing": ["decision_frame.date"]},
        )

    return date_value.strip()


def extract_natal_evidence(
    intake: Mapping[str, Any],
) -> dict[str, Any] | None:
    raw = intake.get(NATAL_EVIDENCE_INTAKE_KEY)
    if not isinstance(raw, dict):
        return None

    birth_date = str(raw.get("birth_date") or "").strip()
    birth_time = str(raw.get("birth_time") or "").strip()
    location = str(raw.get("location") or "").strip()

    if not birth_date or not birth_time or not location:
        return None

    evidence: dict[str, Any] = {
        "birth_date": birth_date,
        "birth_time": birth_time,
        "location": location,
    }

    for key in (
        "latitude",
        "longitude",
        "evaluation_location",
        "evaluation_latitude",
        "evaluation_longitude",
    ):
        if raw.get(key) is not None:
            evidence[key] = raw[key]

    return evidence


def build_evaluate_base_envelope(
    *,
    case_id,
    case_version: int,
    evaluation_id,
    created_at: str,
    decision_type_id: str,
    engine_id: str,
) -> dict[str, Any]:
    from packages.decision_engine.registry import get_decision_type

    record = get_decision_type(decision_type_id)
    return {
        "case_id": str(case_id),
        "evaluation_id": str(evaluation_id),
        "evaluation_version": 1,
        "case_version": case_version,
        "decision_type_id": record.decision_type_id,
        "family_id": record.family_id,
        "mode": "evaluate_date",
        "precision_level": "L3",
        "engine_id": engine_id,
        "created_at": created_at,
        "schema_version": "1.0.0",
    }
