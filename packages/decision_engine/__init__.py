"""METIORO Decision Intelligence Engine facade (Phase 3 implementation)."""

from packages.decision_engine.day_classification import (
    DayClassification,
    classify_day,
)
from packages.decision_engine.day_intelligence_models import (
    DayIntelligenceSnapshot,
    attach_calendar_day_intelligence,
    build_day_intelligence_snapshot,
    day_intelligence_payload,
)
from packages.decision_engine.decision_assessment import (
    ASSESSMENT_SCHEMA_VERSION,
    DecisionAssessment,
    build_decision_assessment,
    decision_assessment_payload,
)
from packages.decision_engine.semantic_policy import (
    SemanticDecisionPolicyResult,
    compare_pair_policy,
    evaluate_policy,
)
from packages.decision_engine.semantic_explanation import (
    SemanticExplanation,
    explain_assessment,
)
from packages.decision_engine.semantic_render import (
    RenderedSemanticExplanation,
    render_semantic_explanation,
)
from packages.decision_engine.registry.schema import RiskContext
from packages.decision_engine.registry.risk import resolve_risk_context
from packages.decision_engine.dimension_classification import (
    DimensionDayClassification,
    classify_from_dimensions,
)
from packages.decision_engine.dimensions import (
    DecisionDimension,
    DecisionDimensions,
    compute_decision_dimensions,
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
    "DayClassification",
    "DayIntelligenceSnapshot",
    "DecisionAssessment",
    "SemanticDecisionPolicyResult",
    "SemanticExplanation",
    "RenderedSemanticExplanation",
    "RiskContext",
    "DimensionDayClassification",
    "DecisionDimension",
    "DecisionDimensions",
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
    "attach_calendar_day_intelligence",
    "build_day_intelligence_snapshot",
    "build_decision_assessment",
    "compare_pair_policy",
    "evaluate_policy",
    "explain_assessment",
    "render_semantic_explanation",
    "resolve_risk_context",
    "classify_day",
    "classify_from_dimensions",
    "compute_decision_dimensions",
    "day_intelligence_payload",
    "decision_assessment_payload",
    "complete_case_composite",
    "dominant_evaluated_aspects",
    "map_activity_response_to_decision_outcome",
    "normalize_score_evidence",
    "polarity_from_contribution",
]
