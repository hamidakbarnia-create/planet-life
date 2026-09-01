"""Resolve Decision Type risk_context without name-based heuristics.

Lookup uses ``decision_type_id`` only as a registry key. Id strings and
labels never classify domains or stakes. Unknown is not high risk.
"""

from __future__ import annotations

from typing import Any, Mapping

from packages.decision_engine.registry.loader import (
    UnknownDecisionTypeError,
    get_decision_type,
)
from packages.decision_engine.registry.schema import (
    DEADLINE_PRIORITY_INVARIANT,
    DecisionTypeRecord,
    ResolvedRiskContext,
    RiskContext,
    documented_default_risk_context,
    risk_context_from_mapping,
    risk_context_from_record,
)

SAFETY_CONTRACT = (
    "Astrological and decision-timing semantics may affect timing preference, "
    "preparation, review intensity, verification, and relative opportunity. "
    "They must not establish visa or legal approval, diagnosis or treatment "
    "outcome, guaranteed investment return, factual safety outcome, or legal "
    "entitlement. External facts, evidence, professional advice, and deadlines "
    "take priority. "
    + DEADLINE_PRIORITY_INVARIANT
)


def resolve_risk_context(
    *,
    decision_type_id: str | None = None,
    record: DecisionTypeRecord | Mapping[str, Any] | None = None,
    risk_context: Mapping[str, Any] | RiskContext | None = None,
) -> ResolvedRiskContext:
    """Resolve risk context from explicit structured sources only.

    Priority:
    1. Explicit ``risk_context`` override (tests / caller).
    2. Explicit record or mapping (``risk_context`` field only).
    3. Registry lookup by ``decision_type_id`` as a key, not a classifier.
    4. Documented default / unresolved. Never high_stakes by omission.
    """
    if risk_context is not None:
        parsed = (
            risk_context
            if isinstance(risk_context, RiskContext)
            else RiskContext.model_validate(risk_context)
        )
        return ResolvedRiskContext(
            level=parsed.level,
            domains=parsed.domains,
            outcome_prediction_prohibited=parsed.outcome_prediction_prohibited,
            factual_deadline_priority=parsed.factual_deadline_priority,
            resolution="explicit",
        )

    if isinstance(record, DecisionTypeRecord):
        return risk_context_from_record(record)
    if isinstance(record, Mapping):
        return risk_context_from_mapping(record)

    type_id = (decision_type_id or "").strip()
    if not type_id:
        return documented_default_risk_context(resolution="unresolved")

    try:
        found = get_decision_type(type_id)
    except UnknownDecisionTypeError:
        return documented_default_risk_context(resolution="unresolved")
    return risk_context_from_record(found)


def risk_context_payload(resolved: ResolvedRiskContext) -> dict[str, Any]:
    return {
        "level": resolved.level,
        "domains": list(resolved.domains),
        "outcome_prediction_prohibited": resolved.outcome_prediction_prohibited,
        "factual_deadline_priority": resolved.factual_deadline_priority,
        "resolution": resolved.resolution,
    }


__all__ = [
    "SAFETY_CONTRACT",
    "resolve_risk_context",
    "risk_context_payload",
]
