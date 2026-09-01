"""METIORO Decision Intelligence Engine facade (Phase 3 implementation)."""

from packages.decision_engine.day_intelligence_models import (
    DayIntelligenceSnapshot,
    build_day_intelligence_snapshot,
)
from packages.decision_engine.evidence import (
    DecisionEvidence,
    dominant_evaluated_aspects,
    normalize_score_evidence,
    polarity_from_contribution,
)
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
    "DayIntelligenceSnapshot",
    "DecisionEvidence",
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
    "build_day_intelligence_snapshot",
    "complete_case_composite",
    "dominant_evaluated_aspects",
    "map_activity_response_to_decision_outcome",
    "normalize_score_evidence",
    "polarity_from_contribution",
]
