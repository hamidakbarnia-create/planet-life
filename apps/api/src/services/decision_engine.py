"""Internal Decision Intelligence Engine entry point.

This module is the first Phase 3 integration path. Existing HTTP routes continue
to call score_with_context and build_scoring_response directly; new internal
callers should use generate_decision_outcome() as the single facade entry point.
"""

from __future__ import annotations

from packages.decision_engine import DecisionEngineFacade, DecisionOutcome, DecisionRequest

_facade = DecisionEngineFacade.for_api()


def generate_decision_outcome(request: DecisionRequest) -> DecisionOutcome:
    """Generate a DecisionOutcome via the engine facade."""
    return _facade.generate(request)
