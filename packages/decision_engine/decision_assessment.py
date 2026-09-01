"""Shared Decision Assessment contract (Phase 3B).

Calendar Day Intelligence and Decision Case Evaluate / Compare / Find all
originate from ``build_decision_assessment``. That builder delegates semantic
construction to ``build_day_intelligence_snapshot`` — one classification
path, not one per surface.

Experimental shadow only. Not canonical. No commands. Does not change
executive.score or astro scoring formulas.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Literal, Mapping, Sequence

from pydantic import BaseModel, ConfigDict

from packages.astro_engine.scoring_context import ScoringContext
from packages.decision_engine.day_intelligence_models import (
    DayIntelligenceSnapshot,
    build_day_intelligence_snapshot,
    day_intelligence_payload,
)
from packages.decision_engine.dimension_classification import (
    dimension_classification_payload,
)
from packages.decision_engine.dimensions import dimensions_payload
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.registry.risk import (
    resolve_risk_context,
    risk_context_payload,
)
from packages.decision_engine.registry.schema import RiskLevel, RiskResolution

ASSESSMENT_SCHEMA_VERSION = "decision_assessment.v1-shadow"
SEMANTIC_STATUS = "experimental_shadow"

# Shadow classes that restrict forward action vs classes that support it.
# Used only for disagreement / window-warning metadata — never for ranking.
FORWARD_DIMENSION_CLASSES = frozenset({"high_leverage", "action", "build"})
RESTRICTIVE_DIMENSION_CLASSES = frozenset(
    {"selective", "review", "defensive", "recovery", "insufficient"}
)

COVERAGE_NOTES = (
    "classification_coverage is coverage metadata, not confidence, "
    "probability, or certainty"
)
EVIDENCE_STRENGTH_NOTES = (
    "dimension evidence_strength is mass/support, not confidence"
)
INSUFFICIENT_NOTES = "insufficient is not neutral"


class AssessmentContext(BaseModel):
    """Resolved scoring / decision context. Never silently defaulted."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    action_type: str
    location_mode: str
    scoring_context: dict[str, Any]
    decision_type_id: str | None = None
    family_id: str | None = None
    module_origin: str | None = None
    high_stakes: dict[str, Any] | None = None
    risk_level: RiskLevel = "standard"
    risk_domains: tuple[str, ...] = ()
    outcome_prediction_prohibited: bool = False
    factual_deadline_priority: bool = False
    risk_resolution: RiskResolution = "unresolved"


class DecisionAssessment(BaseModel):
    """Shared semantic assessment. Composes DayIntelligenceSnapshot."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal["decision_assessment.v1-shadow"] = (
        ASSESSMENT_SCHEMA_VERSION
    )
    semantic_status: Literal["experimental_shadow"] = SEMANTIC_STATUS
    evaluation_date: str
    context: AssessmentContext
    snapshot: DayIntelligenceSnapshot

    @property
    def score(self) -> int:
        return self.snapshot.final_score

    @property
    def phase2a_class(self) -> str:
        return self.snapshot.classification.day_class

    @property
    def dimension_class(self) -> str:
        return self.snapshot.dimension_classification.day_class


def scoring_context_fields(context: ScoringContext) -> dict[str, Any]:
    return {
        "location_mode": context.location_mode,
        "include_natal_house_bonus": context.include_natal_house_bonus,
        "include_transit_house_score": context.include_transit_house_score,
        "include_transit_angular_score": context.include_transit_angular_score,
        "default_transit_time": context.default_transit_time,
    }


def _date_from_payload(payload: Mapping[str, Any]) -> str | None:
    strategic = payload.get("strategic") or {}
    breakdown = strategic.get("component_breakdown") or {}
    local_dt = breakdown.get("resolved_local_datetime")
    if isinstance(local_dt, str) and len(local_dt) >= 10:
        return local_dt[:10]
    return None


def build_decision_assessment(
    score_result: Mapping[str, Any],
    *,
    scoring_context: ScoringContext,
    action_type: str,
    evaluation_date: str | None = None,
    natal: Mapping[str, Any] | None = None,
    transit: Mapping[str, Any] | None = None,
    reasoning: Mapping[str, Any] | None = None,
    decision_type_id: str | None = None,
    family_id: str | None = None,
    module_origin: str | None = None,
    high_stakes: Mapping[str, Any] | None = None,
    risk_context: Mapping[str, Any] | None = None,
) -> DecisionAssessment:
    """Build the shared assessment from an existing score payload.

    ``scoring_context`` and ``action_type`` are required. Callers must pass
    the resolved Decision Case context when one exists — do not substitute
    Calendar ``currentLiving`` for an electional case.
    """
    if not isinstance(scoring_context, ScoringContext):
        raise TypeError("scoring_context must be a ScoringContext instance")
    resolved_action = str(action_type or "").strip()
    if not resolved_action:
        raise ValueError("action_type is required for DecisionAssessment")
    resolved_date = evaluation_date or _date_from_payload(score_result)
    if not resolved_date:
        raise ValueError("evaluation_date is required for DecisionAssessment")

    snapshot = build_day_intelligence_snapshot(
        score_result,
        natal=natal,
        transit=transit,
        activity_type=resolved_action,
        reasoning=reasoning,
        scoring_context=scoring_context,
    )
    if risk_context is not None:
        resolved_risk = resolve_risk_context(risk_context=risk_context)
    elif high_stakes:
        resolved_risk = resolve_risk_context(
            risk_context={
                "level": "high_stakes",
                "domains": [],
                "outcome_prediction_prohibited": True,
                "factual_deadline_priority": False,
            }
        )
    else:
        resolved_risk = resolve_risk_context(decision_type_id=decision_type_id)
    stakes = None
    if resolved_risk.level == "high_stakes":
        stakes = risk_context_payload(resolved_risk)
    elif isinstance(high_stakes, Mapping):
        stakes = dict(high_stakes)
    return DecisionAssessment(
        evaluation_date=resolved_date,
        context=AssessmentContext(
            action_type=resolved_action,
            location_mode=scoring_context.location_mode,
            scoring_context=scoring_context_fields(scoring_context),
            decision_type_id=decision_type_id,
            family_id=family_id,
            module_origin=module_origin,
            high_stakes=stakes,
            risk_level=resolved_risk.level,
            risk_domains=resolved_risk.domains,
            outcome_prediction_prohibited=resolved_risk.outcome_prediction_prohibited,
            factual_deadline_priority=resolved_risk.factual_deadline_priority,
            risk_resolution=resolved_risk.resolution,
        ),
        snapshot=snapshot,
    )


def try_assessment_from_outcome(
    outcome: DecisionOutcome,
    *,
    scoring_context: ScoringContext,
    action_type: str,
    evaluation_date: str,
    natal: Mapping[str, Any] | None = None,
    transit: Mapping[str, Any] | None = None,
    decision_type_id: str | None = None,
    family_id: str | None = None,
    module_origin: str | None = None,
    high_stakes: Mapping[str, Any] | None = None,
    risk_context: Mapping[str, Any] | None = None,
) -> DecisionAssessment | None:
    """Build an assessment from a scored outcome, or None if unusable."""
    payload = dict(outcome.source_activity_response or {})
    executive = dict(payload.get("executive") or {})
    if executive.get("score") is None:
        executive["score"] = outcome.recommendation.score
        if outcome.recommendation.rating:
            executive.setdefault("rating", outcome.recommendation.rating)
        payload["executive"] = executive
    if not payload.get("strategic"):
        payload["strategic"] = {
            "component_breakdown": {"final_score": int(outcome.recommendation.score)}
        }
    payload.setdefault("technical", {})
    source_natal = natal if natal is not None else getattr(
        outcome, "source_natal", None
    )
    source_transit = transit if transit is not None else getattr(
        outcome, "source_transit", None
    )
    try:
        return build_decision_assessment(
            payload,
            scoring_context=scoring_context,
            action_type=action_type,
            evaluation_date=evaluation_date,
            natal=source_natal if isinstance(source_natal, Mapping) else None,
            transit=source_transit if isinstance(source_transit, Mapping) else None,
            decision_type_id=decision_type_id,
            family_id=family_id,
            module_origin=module_origin or outcome.metadata.module_origin,
            high_stakes=high_stakes,
            risk_context=risk_context,
        )
    except (TypeError, ValueError):
        return None


def assessment_from_request(
    outcome: DecisionOutcome,
    request: DecisionRequest,
    *,
    evaluation_date: str | None = None,
    natal: Mapping[str, Any] | None = None,
    transit: Mapping[str, Any] | None = None,
    decision_type_id: str | None = None,
    family_id: str | None = None,
    high_stakes: Mapping[str, Any] | None = None,
    risk_context: Mapping[str, Any] | None = None,
) -> DecisionAssessment | None:
    """Assess using the request's resolved action_type and ScoringContext."""
    return try_assessment_from_outcome(
        outcome,
        scoring_context=request.context,
        action_type=request.action_type,
        evaluation_date=evaluation_date or request.target_date,
        natal=natal,
        transit=transit,
        decision_type_id=decision_type_id,
        family_id=family_id,
        module_origin=request.module_origin,
        high_stakes=high_stakes,
        risk_context=risk_context,
    )


def decision_assessment_payload(
    assessment: DecisionAssessment,
    *,
    include_day_intelligence: bool = True,
) -> dict[str, Any]:
    """Serialize the shared contract. Never emits ``command``."""
    snapshot = assessment.snapshot
    classification = snapshot.dimension_classification
    payload: dict[str, Any] = {
        "schema_version": assessment.schema_version,
        "semantic_status": assessment.semantic_status,
        "date": assessment.evaluation_date,
        "context": assessment.context.model_dump(),
        "score": snapshot.final_score,
        "phase2a_class": snapshot.classification.day_class,
        "dimensions": dimensions_payload(snapshot.dimensions),
        "dimension_classification": dimension_classification_payload(classification),
        "evidence_references": [
            {
                "evidence_id": item.evidence_id,
                "kind": item.kind,
                "polarity": item.polarity,
            }
            for item in snapshot.evidence
        ],
        "coverage": {
            "classification_coverage": classification.classification_coverage,
            "scored_dimension_count": classification.scored_dimension_count,
            "insufficient_dimension_count": classification.insufficient_dimension_count,
            "classification_coverage_is_not_confidence": True,
            "evidence_strength_is_not_confidence": True,
            "insufficient_is_not_neutral": True,
            "notes": [
                COVERAGE_NOTES,
                EVIDENCE_STRENGTH_NOTES,
                INSUFFICIENT_NOTES,
            ],
        },
    }
    if include_day_intelligence:
        payload["day_intelligence"] = day_intelligence_payload(snapshot)
    return payload


def tagged_assessment_payload(
    assessment: DecisionAssessment,
    *,
    option_id: str | None = None,
    include_day_intelligence: bool = True,
) -> dict[str, Any]:
    payload = decision_assessment_payload(
        assessment, include_day_intelligence=include_day_intelligence
    )
    if option_id:
        payload["option_id"] = option_id
    return payload


def shadow_dimension_class(assessment_payload: Mapping[str, Any] | None) -> str | None:
    if not assessment_payload:
        return None
    blob = assessment_payload.get("dimension_classification") or {}
    value = blob.get("day_class")
    return value if isinstance(value, str) else None


def score_class_disagreements(
    items: Sequence[Mapping[str, Any]],
) -> tuple[dict[str, Any], ...]:
    """Score ranking vs v3 class — metadata only. Does not pick a winner.

    Each item: ``{id, score, dimension_class}``.
    """
    ordered = sorted(items, key=lambda row: (-float(row["score"]), str(row["id"])))
    disagreements: list[dict[str, Any]] = []
    for index, higher in enumerate(ordered):
        higher_class = str(higher.get("dimension_class") or "")
        if higher_class not in RESTRICTIVE_DIMENSION_CLASSES:
            continue
        for lower in ordered[index + 1 :]:
            if float(higher["score"]) <= float(lower["score"]):
                continue
            lower_class = str(lower.get("dimension_class") or "")
            if lower_class in FORWARD_DIMENSION_CLASSES:
                disagreements.append(
                    {
                        "kind": "score_vs_class",
                        "higher_score_id": higher["id"],
                        "higher_score": higher["score"],
                        "higher_class": higher_class,
                        "lower_score_id": lower["id"],
                        "lower_score": lower["score"],
                        "lower_class": lower_class,
                    }
                )
    return tuple(disagreements)


def find_window_semantic_warnings(
    days: Sequence[Any],
    windows: Sequence[Any],
) -> tuple[dict[str, Any], ...]:
    """Report score-eligible days whose v3 class is restrictive, and mixed windows.

    Does not change eligibility or grouping.
    """
    warnings: list[dict[str, Any]] = []
    by_day = {item.day: item for item in days}
    for item in days:
        payload = getattr(item, "assessment", None)
        cls = shadow_dimension_class(payload)
        if item.band == "high" and cls in RESTRICTIVE_DIMENSION_CLASSES:
            warnings.append(
                {
                    "kind": "eligible_score_restrictive_class",
                    "date": item.day.isoformat(),
                    "score": item.score,
                    "dimension_class": cls,
                    "eligible_by_score_band": True,
                }
            )
    for window in windows:
        classes: list[str] = []
        current = window.start_date
        while current <= window.end_date:
            day = by_day.get(current)
            cls = shadow_dimension_class(getattr(day, "assessment", None) if day else None)
            if cls:
                classes.append(cls)
            current += timedelta(days=1)
        if any(cls in FORWARD_DIMENSION_CLASSES for cls in classes) and any(
            cls in RESTRICTIVE_DIMENSION_CLASSES for cls in classes
        ):
            warnings.append(
                {
                    "kind": "contiguous_window_mixed_semantics",
                    "window_id": window.window_id,
                    "start_date": window.start_date.isoformat(),
                    "end_date": window.end_date.isoformat(),
                    "dimension_classes": classes,
                }
            )
    return tuple(warnings)


def build_semantic_shadow(
    assessments: Sequence[Mapping[str, Any]],
    *,
    score_vs_class_disagreements: Sequence[Mapping[str, Any]] = (),
    find_window_semantic_warnings: Sequence[Mapping[str, Any]] = (),
    policy: Mapping[str, Any] | None = None,
    policy_pairs: Sequence[Mapping[str, Any]] = (),
    window_policies: Sequence[Mapping[str, Any]] = (),
    explanation: Mapping[str, Any] | None = None,
    explanations: Sequence[Mapping[str, Any]] = (),
    window_explanations: Sequence[Mapping[str, Any]] = (),
) -> dict[str, Any] | None:
    if not assessments:
        return None
    payload: dict[str, Any] = {
        "schema_version": ASSESSMENT_SCHEMA_VERSION,
        "semantic_status": SEMANTIC_STATUS,
        "assessments": [dict(item) for item in assessments],
        "score_vs_class_disagreements": [
            dict(item) for item in score_vs_class_disagreements
        ],
        "find_window_semantic_warnings": [
            dict(item) for item in find_window_semantic_warnings
        ],
        "policy_pairs": [dict(item) for item in policy_pairs],
        "window_policies": [dict(item) for item in window_policies],
        "explanations": [dict(item) for item in explanations],
        "window_explanations": [dict(item) for item in window_explanations],
    }
    if policy:
        payload["policy"] = dict(policy)
    if explanation:
        payload["explanation"] = dict(explanation)
    return payload


__all__ = [
    "ASSESSMENT_SCHEMA_VERSION",
    "AssessmentContext",
    "COVERAGE_NOTES",
    "DecisionAssessment",
    "FORWARD_DIMENSION_CLASSES",
    "RESTRICTIVE_DIMENSION_CLASSES",
    "SEMANTIC_STATUS",
    "assessment_from_request",
    "build_decision_assessment",
    "build_semantic_shadow",
    "decision_assessment_payload",
    "find_window_semantic_warnings",
    "score_class_disagreements",
    "scoring_context_fields",
    "shadow_dimension_class",
    "tagged_assessment_payload",
    "try_assessment_from_outcome",
]
