"""METIORO Decision Intelligence Engine facade (Phase 3 implementation)."""

from packages.decision_engine.facade import DecisionEngineFacade
from packages.decision_engine.mapper import map_activity_response_to_decision_outcome
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    DecisionRequest,
    EvidenceReference,
    Explanation,
    ExplanationReason,
    Recommendation,
)
from packages.decision_engine.state_machine import (
    ALL_STATES,
    ActivationPhase,
    CaseState,
    LEGAL_EDGES,
    activation_phase,
    apply_transition,
    archive_case_composite,
    complete_case_composite,
)

__all__ = [
    "ALL_STATES",
    "ActivationPhase",
    "CaseState",
    "Confidence",
    "DecisionEngineFacade",
    "DecisionMetadata",
    "DecisionOutcome",
    "DecisionRequest",
    "EvidenceReference",
    "Explanation",
    "ExplanationReason",
    "LEGAL_EDGES",
    "Recommendation",
    "activation_phase",
    "apply_transition",
    "archive_case_composite",
    "complete_case_composite",
    "map_activity_response_to_decision_outcome",
]
