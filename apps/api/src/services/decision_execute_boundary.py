"""Deterministic Decision API boundary executor (ADR-0006 Sprint 6A).

Echoes authoritative request fields only. Does not invoke the legacy scoring engine.
"""

from __future__ import annotations

from schemas.decision_execute import (
    DecisionExecuteRequest,
    DecisionExecuteResponse,
    DecisionExecuteResult,
)

DECISION_API_BOUNDARY_SOURCE = "decision_api_boundary"


def execute_decision_boundary(request: DecisionExecuteRequest) -> DecisionExecuteResponse:
    """Return a contract-valid response from authoritative request fields."""
    return DecisionExecuteResponse(
        status="completed",
        result=DecisionExecuteResult(
            requestId=request.request_id,
            actionType=request.action_type,
            guidedQuestionId=request.guided_question_id,
            categoryId=request.category_id,
            needsTime=request.needs_time,
            summary=request.display_text,
            source=DECISION_API_BOUNDARY_SOURCE,
        ),
    )
