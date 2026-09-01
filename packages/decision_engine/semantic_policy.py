"""Phase 3C — semantic decision policy (shadow resolver).

Two independent axes:

* Opportunity / timing strength — executive score 0..100. Relative strength
  under the resolved action/context. Not probability of success.
* Decision posture — v3 ``dimension_class.v3-shadow``. Qualitative execution
  stance. Not a total ranking of classes.

Higher score is not universally a better decision. This module emits
deterministic policy metadata only. It does not change legacy winners,
Find eligibility, Package stance, or user-facing output. Not canonical.
No commands. No outcome predictions (approval, diagnosis, profit, visa).

High-stakes policy codes fire from structured ``risk_level`` /
``outcome_prediction_prohibited`` / ``factual_deadline_priority`` on
assessment context (registry-propagated). Never inferred from type id or
label. Unknown risk is not high risk.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Iterable, Literal, Mapping, Sequence

from pydantic import BaseModel, ConfigDict

POLICY_VERSION = "semantic_policy.v1-shadow"
SEMANTIC_STATUS = "experimental_shadow"

# Existing product "not a unique winner" gap (COMPARE/FIND tie epsilon).
# Adopted as near-tie because it is already the score-axis uniqueness rule.
# Sensitivity: raising this toward the 81-vs-70 gap (~11) would let posture
# silently override a material score advantage — rejected.
NEAR_TIE_DELTA = 2.0

# Rationale-only band. Does not change relation when axes conflict.
# 81-70 = 11 → modest; 90-65 = 25 → large. Sensitivity reported in tests.
LARGE_SCORE_GAP = 15.0

OpportunityBand = Literal["near_tie", "modest_score_gap", "large_score_gap"]
PolicyRelation = Literal[
    "aligned",
    "score_advantage_with_semantic_caution",
    "semantic_quality_advantage",
    "material_tradeoff",
    "insufficient_semantics",
]
ConflictLevel = Literal["none", "caution", "tradeoff", "unresolved"]
EvaluateInterpretation = Literal[
    "strong_and_clean",
    "strong_but_selective",
    "strong_but_restrained",
    "weak_and_defensive",
    "uncertain_semantics",
]
FindWindowKind = Literal[
    "clean_forward_window",
    "mixed_posture_window",
    "restrictive_window",
    "insufficient_semantic_window",
]

# Favorable / Challenging floors from astro_engine.scoring._rating.
FAVORABLE_SCORE = 65
CHALLENGING_SCORE = 45

FORWARD_POSTURES = frozenset({"high_leverage", "action", "build"})
SELECTIVE_POSTURES = frozenset({"selective"})
RESTRAINT_POSTURES = frozenset({"defensive", "recovery"})
UNRESOLVED_POSTURES = frozenset({"mixed", "review"})

# Directed partial order only. Absence of an edge means no global dominance.
# recovery/review/mixed are intentionally omitted as automatic preferrers.
POSTURE_DOMINANCE: frozenset[tuple[str, str]] = frozenset(
    {
        ("high_leverage", "action"),
        ("high_leverage", "build"),
        ("high_leverage", "selective"),
        ("high_leverage", "defensive"),
        ("high_leverage", "recovery"),
        ("action", "selective"),
        ("action", "defensive"),
        ("action", "recovery"),
        ("build", "selective"),
        ("build", "defensive"),
        ("selective", "defensive"),
    }
)

REASON_SCORE_ADVANTAGE = "score_advantage"
REASON_CLEANER_POSTURE = "cleaner_posture"
REASON_VETO_PRESENT = "veto_present"
REASON_SAME_DIMENSION_CONFLICT = "same_dimension_conflict"
REASON_SEMANTIC_INSUFFICIENT = "semantic_insufficient"
REASON_NEAR_SCORE_TIE = "near_score_tie"
REASON_LARGE_SCORE_GAP = "large_score_gap"
REASON_MODEST_SCORE_GAP = "modest_score_gap"
REASON_CONTEXT_SENSITIVE_TRADEOFF = "context_sensitive_tradeoff"
REASON_CONSTRAINED_POSTURE = "constrained_posture"
REASON_UNRESOLVED_CONFLICT = "unresolved_conflict"
REASON_HIGH_STAKES_REVIEW = "high_stakes_review_required"
REASON_NO_OUTCOME_PREDICTION = "no_outcome_prediction"
REASON_FACTUAL_DEADLINE_PRIORITY = "factual_deadline_priority"


class SemanticDecisionPolicyResult(BaseModel):
    """Shadow policy over score vs posture. Not a replacement winner."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    policy_version: Literal["semantic_policy.v1-shadow"] = POLICY_VERSION
    semantic_status: Literal["experimental_shadow"] = SEMANTIC_STATUS
    relation: PolicyRelation
    score_preference: str | None = None
    posture_preference: str | None = None
    conflict_level: ConflictLevel
    rationale_codes: tuple[str, ...] = ()
    requires_user_tradeoff: bool = False
    left_id: str | None = None
    right_id: str | None = None
    score_delta: float | None = None
    opportunity_band: OpportunityBand | None = None
    evaluate_interpretation: EvaluateInterpretation | None = None
    find_window_kind: FindWindowKind | None = None
    risk_level: str | None = None
    risk_domains: tuple[str, ...] = ()
    outcome_prediction_prohibited: bool = False
    factual_deadline_priority: bool = False


def opportunity_band(abs_delta: float) -> OpportunityBand:
    if abs_delta <= NEAR_TIE_DELTA:
        return "near_tie"
    if abs_delta >= LARGE_SCORE_GAP:
        return "large_score_gap"
    return "modest_score_gap"


def posture_dominates(left: str, right: str) -> bool:
    """True only for documented partial edges. Never a total order."""
    return (left, right) in POSTURE_DOMINANCE


def _posture_preference(
    left_class: str, right_class: str, left_id: str, right_id: str
) -> str | None:
    if left_class == right_class:
        return None
    if posture_dominates(left_class, right_class):
        return left_id
    if posture_dominates(right_class, left_class):
        return right_id
    return None


def _classification_blob(assessment: Mapping[str, Any] | None) -> dict[str, Any]:
    if not assessment:
        return {}
    blob = assessment.get("dimension_classification")
    return dict(blob) if isinstance(blob, Mapping) else {}


def _class_of(
    assessment: Mapping[str, Any] | None, fallback: str | None = None
) -> str | None:
    blob = _classification_blob(assessment)
    value = blob.get("day_class")
    if isinstance(value, str):
        return value
    return fallback


def _score_of(row: Mapping[str, Any]) -> float:
    if "score" in row and row["score"] is not None:
        return float(row["score"])
    nested = row.get("assessment") or {}
    return float(nested.get("score") or 0)


def _row_class(row: Mapping[str, Any]) -> str:
    if "assessment" in row:
        found = _class_of(row.get("assessment"), row.get("dimension_class"))
        if found:
            return found
    found = _class_of(row, row.get("dimension_class"))
    if found:
        return found
    return str(row.get("day_class") or "")


def _row_assessment(row: Mapping[str, Any]) -> Mapping[str, Any]:
    if isinstance(row.get("assessment"), Mapping):
        return row["assessment"]  # type: ignore[return-value]
    return row


def _rationale_from_classification(blob: Mapping[str, Any]) -> list[str]:
    codes: list[str] = []
    if blob.get("veto_dimension_ids"):
        codes.append(REASON_VETO_PRESENT)
    if blob.get("same_dimension_conflict") or blob.get("conflicted_dimension_ids"):
        codes.append(REASON_SAME_DIMENSION_CONFLICT)
    return codes


def _risk_policy(context: Mapping[str, Any] | None) -> tuple[list[str], dict[str, Any]]:
    """Safety codes from structured risk fields. Does not change winners."""
    if not isinstance(context, Mapping):
        return [], {
            "risk_level": None,
            "risk_domains": (),
            "outcome_prediction_prohibited": False,
            "factual_deadline_priority": False,
        }

    nested = context.get("risk_context")
    nested_map = nested if isinstance(nested, Mapping) else {}
    level = context.get("risk_level") or nested_map.get("level")
    domains_raw = context.get("risk_domains") or nested_map.get("domains") or ()
    domains = tuple(str(item) for item in domains_raw)
    prohibited = bool(
        context.get("outcome_prediction_prohibited")
        or nested_map.get("outcome_prediction_prohibited")
    )
    deadline = bool(
        context.get("factual_deadline_priority")
        or nested_map.get("factual_deadline_priority")
    )
    legacy = context.get("high_stakes")
    high = level == "high_stakes" or bool(legacy)
    if high:
        level = "high_stakes"
        prohibited = True

    codes: list[str] = []
    if high:
        codes.append(REASON_HIGH_STAKES_REVIEW)
        codes.append(REASON_NO_OUTCOME_PREDICTION)
    if prohibited and REASON_NO_OUTCOME_PREDICTION not in codes:
        codes.append(REASON_NO_OUTCOME_PREDICTION)
    if deadline:
        codes.append(REASON_FACTUAL_DEADLINE_PRIORITY)

    return codes, {
        "risk_level": str(level) if level else None,
        "risk_domains": domains,
        "outcome_prediction_prohibited": prohibited,
        "factual_deadline_priority": deadline,
    }


def _unique(codes: Iterable[str]) -> tuple[str, ...]:
    seen: list[str] = []
    for code in codes:
        if code and code not in seen:
            seen.append(code)
    return tuple(seen)


def compare_pair_policy(
    left: Mapping[str, Any],
    right: Mapping[str, Any],
    *,
    left_id: str = "left",
    right_id: str = "right",
    near_tie_delta: float = NEAR_TIE_DELTA,
    large_score_gap: float = LARGE_SCORE_GAP,
) -> SemanticDecisionPolicyResult:
    """Policy for one Compare pair. Does not pick a replacement winner."""
    left_score = _score_of(left)
    right_score = _score_of(right)
    left_class = _row_class(left)
    right_class = _row_class(right)

    delta = left_score - right_score
    abs_delta = abs(delta)
    if abs_delta <= near_tie_delta:
        band: OpportunityBand = "near_tie"
    elif abs_delta >= large_score_gap:
        band = "large_score_gap"
    else:
        band = "modest_score_gap"

    codes: list[str] = []
    if band == "near_tie":
        codes.append(REASON_NEAR_SCORE_TIE)
    elif band == "large_score_gap":
        codes.append(REASON_LARGE_SCORE_GAP)
    else:
        codes.append(REASON_MODEST_SCORE_GAP)

    if delta > near_tie_delta:
        score_pref: str | None = left_id
        codes.append(REASON_SCORE_ADVANTAGE)
    elif delta < -near_tie_delta:
        score_pref = right_id
        codes.append(REASON_SCORE_ADVANTAGE)
    else:
        score_pref = None

    left_assess = _row_assessment(left)
    right_assess = _row_assessment(right)
    codes.extend(_rationale_from_classification(_classification_blob(left_assess)))
    codes.extend(_rationale_from_classification(_classification_blob(right_assess)))
    left_risk_codes, left_risk = _risk_policy(
        left_assess.get("context") if isinstance(left_assess, Mapping) else None
    )
    right_risk_codes, right_risk = _risk_policy(
        right_assess.get("context") if isinstance(right_assess, Mapping) else None
    )
    codes.extend(left_risk_codes)
    codes.extend(right_risk_codes)
    risk_fields = {
        "risk_level": (
            "high_stakes"
            if "high_stakes" in (left_risk["risk_level"], right_risk["risk_level"])
            else left_risk["risk_level"] or right_risk["risk_level"]
        ),
        "risk_domains": tuple(
            dict.fromkeys(
                (*left_risk["risk_domains"], *right_risk["risk_domains"])
            )
        ),
        "outcome_prediction_prohibited": bool(
            left_risk["outcome_prediction_prohibited"]
            or right_risk["outcome_prediction_prohibited"]
        ),
        "factual_deadline_priority": bool(
            left_risk["factual_deadline_priority"]
            or right_risk["factual_deadline_priority"]
        ),
    }

    left_insuf = left_class == "insufficient" or not left_class
    right_insuf = right_class == "insufficient" or not right_class
    if left_insuf or right_insuf:
        return SemanticDecisionPolicyResult(
            relation="insufficient_semantics",
            score_preference=score_pref,
            posture_preference=None,
            conflict_level="unresolved",
            rationale_codes=_unique(codes + [REASON_SEMANTIC_INSUFFICIENT]),
            requires_user_tradeoff=False,
            left_id=left_id,
            right_id=right_id,
            score_delta=round(delta, 4),
            opportunity_band=band,
            **risk_fields,
        )

    posture_pref = _posture_preference(left_class, right_class, left_id, right_id)
    if posture_pref:
        codes.append(REASON_CLEANER_POSTURE)

    left_constrained = (
        left_class in SELECTIVE_POSTURES or left_class in RESTRAINT_POSTURES
    )
    right_constrained = (
        right_class in SELECTIVE_POSTURES or right_class in RESTRAINT_POSTURES
    )
    if (score_pref == left_id and left_constrained) or (
        score_pref == right_id and right_constrained
    ):
        codes.append(REASON_CONSTRAINED_POSTURE)

    if left_class in UNRESOLVED_POSTURES or right_class in UNRESOLVED_POSTURES:
        codes.append(REASON_UNRESOLVED_CONFLICT)

    same_class = left_class == right_class
    if same_class:
        relation: PolicyRelation = "aligned"
        conflict: ConflictLevel = "none"
        tradeoff = False
    elif posture_pref and score_pref is None:
        relation = "semantic_quality_advantage"
        conflict = "caution"
        tradeoff = False
    elif posture_pref and score_pref == posture_pref:
        relation = "aligned"
        conflict = "none"
        tradeoff = False
    elif score_pref and posture_pref and score_pref != posture_pref:
        # Axes disagree. Posture never beats a non-tie score gap.
        # Score never claims universal dominance over cleaner posture.
        relation = "material_tradeoff"
        conflict = "tradeoff"
        tradeoff = True
        codes.append(REASON_CONTEXT_SENSITIVE_TRADEOFF)
    elif score_pref and posture_pref is None:
        score_class = left_class if score_pref == left_id else right_class
        other_class = right_class if score_pref == left_id else left_class
        if (
            score_class
            in SELECTIVE_POSTURES | RESTRAINT_POSTURES | UNRESOLVED_POSTURES
            and other_class in FORWARD_POSTURES
        ):
            relation = "score_advantage_with_semantic_caution"
            conflict = "caution"
            tradeoff = True
            codes.append(REASON_CONSTRAINED_POSTURE)
        else:
            relation = "material_tradeoff"
            conflict = "tradeoff"
            tradeoff = True
            codes.append(REASON_CONTEXT_SENSITIVE_TRADEOFF)
    else:
        relation = "material_tradeoff"
        conflict = "tradeoff"
        tradeoff = True
        codes.append(REASON_CONTEXT_SENSITIVE_TRADEOFF)

    return SemanticDecisionPolicyResult(
        relation=relation,
        score_preference=score_pref,
        posture_preference=posture_pref,
        conflict_level=conflict,
        rationale_codes=_unique(codes),
        requires_user_tradeoff=tradeoff,
        left_id=left_id,
        right_id=right_id,
        score_delta=round(delta, 4),
        opportunity_band=band,
        **risk_fields,
    )


def compare_policy_pairs(
    items: Sequence[Mapping[str, Any]],
) -> tuple[dict[str, Any], ...]:
    """All unordered pairs. Ranking identity of items is ignored."""
    rows = list(items)
    pairs: list[dict[str, Any]] = []
    for i, left in enumerate(rows):
        for j, right in enumerate(rows[i + 1 :], start=i + 1):
            result = compare_pair_policy(
                left,
                right,
                left_id=str(left.get("id") or left.get("option_id") or f"i{i}"),
                right_id=str(right.get("id") or right.get("option_id") or f"i{j}"),
            )
            pairs.append(policy_payload(result))
    return tuple(pairs)


def evaluate_policy(
    *,
    score: float,
    posture: str,
    assessment: Mapping[str, Any] | None = None,
) -> SemanticDecisionPolicyResult:
    """Single-assessment interpretation. Not an ACT/VERIFY/WAIT command."""
    codes: list[str] = []
    blob = _classification_blob(assessment)
    codes.extend(_rationale_from_classification(blob))
    ctx = assessment.get("context") if assessment else None
    risk_codes, risk_fields = _risk_policy(ctx if isinstance(ctx, Mapping) else None)
    codes.extend(risk_codes)
    class_name = posture or _class_of(assessment) or "insufficient"

    if class_name == "insufficient" or not class_name:
        interpretation: EvaluateInterpretation = "uncertain_semantics"
        codes.append(REASON_SEMANTIC_INSUFFICIENT)
        relation: PolicyRelation = "insufficient_semantics"
        conflict: ConflictLevel = "unresolved"
    elif class_name in UNRESOLVED_POSTURES:
        interpretation = "uncertain_semantics"
        codes.append(REASON_UNRESOLVED_CONFLICT)
        relation = "material_tradeoff"
        conflict = "unresolved"
    elif score >= FAVORABLE_SCORE and class_name in FORWARD_POSTURES:
        interpretation = "strong_and_clean"
        codes.append(REASON_CLEANER_POSTURE)
        relation = "aligned"
        conflict = "none"
    elif score >= FAVORABLE_SCORE and class_name == "selective":
        interpretation = "strong_but_selective"
        codes.append(REASON_CONSTRAINED_POSTURE)
        relation = "score_advantage_with_semantic_caution"
        conflict = "caution"
    elif score >= FAVORABLE_SCORE and class_name in RESTRAINT_POSTURES:
        interpretation = "strong_but_restrained"
        codes.append(REASON_CONSTRAINED_POSTURE)
        relation = "score_advantage_with_semantic_caution"
        conflict = "caution"
    elif class_name in RESTRAINT_POSTURES or score < CHALLENGING_SCORE:
        interpretation = "weak_and_defensive"
        codes.append(REASON_CONSTRAINED_POSTURE)
        relation = "aligned"
        conflict = "caution"
    else:
        interpretation = "uncertain_semantics"
        codes.append(REASON_CONTEXT_SENSITIVE_TRADEOFF)
        relation = "material_tradeoff"
        conflict = "unresolved"

    return SemanticDecisionPolicyResult(
        relation=relation,
        score_preference=None,
        posture_preference=None,
        conflict_level=conflict,
        rationale_codes=_unique(codes),
        requires_user_tradeoff=interpretation
        in {
            "strong_but_selective",
            "strong_but_restrained",
            "uncertain_semantics",
        },
        evaluate_interpretation=interpretation,
        **risk_fields,
    )


def find_window_kind(classes: Sequence[str | None]) -> FindWindowKind:
    labels = [item for item in classes if item]
    if not labels or all(item == "insufficient" for item in labels):
        return "insufficient_semantic_window"
    has_forward = any(item in FORWARD_POSTURES for item in labels)
    has_restrictive = any(
        item in SELECTIVE_POSTURES | RESTRAINT_POSTURES | UNRESOLVED_POSTURES
        for item in labels
    )
    has_unknown = any(item == "insufficient" for item in labels)
    if has_forward and not has_restrictive and not has_unknown:
        return "clean_forward_window"
    if has_restrictive and not has_forward:
        return "restrictive_window"
    return "mixed_posture_window"


def find_window_policies(
    days: Sequence[Any],
    windows: Sequence[Any],
) -> tuple[dict[str, Any], ...]:
    """Label existing windows. Does not regroup or change eligibility."""
    by_day = {item.day: item for item in days}
    policies: list[dict[str, Any]] = []
    for window in windows:
        classes: list[str | None] = []
        current = window.start_date
        while current <= window.end_date:
            day = by_day.get(current)
            assessment = getattr(day, "assessment", None) if day else None
            classes.append(_class_of(assessment))
            current = current + timedelta(days=1)
        kind = find_window_kind(classes)
        eligible_conflict = window.band == "high" and kind in {
            "mixed_posture_window",
            "restrictive_window",
            "insufficient_semantic_window",
        }
        if kind == "clean_forward_window":
            relation: PolicyRelation = "aligned"
            conflict: ConflictLevel = "none"
            codes = [REASON_CLEANER_POSTURE]
        elif kind == "restrictive_window":
            relation = "score_advantage_with_semantic_caution"
            conflict = "caution"
            codes = [REASON_CONSTRAINED_POSTURE]
        elif kind == "insufficient_semantic_window":
            relation = "insufficient_semantics"
            conflict = "unresolved"
            codes = [REASON_SEMANTIC_INSUFFICIENT]
        else:
            relation = "material_tradeoff"
            conflict = "tradeoff"
            codes = [
                REASON_CONSTRAINED_POSTURE,
                REASON_CONTEXT_SENSITIVE_TRADEOFF,
            ]
        payload = policy_payload(
            SemanticDecisionPolicyResult(
                relation=relation,
                conflict_level=conflict,
                rationale_codes=_unique(codes),
                requires_user_tradeoff=kind == "mixed_posture_window",
                find_window_kind=kind,
                left_id=window.window_id,
            )
        )
        payload["window_id"] = window.window_id
        payload["legacy_eligible_high_band"] = window.band == "high"
        payload["legacy_eligibility_conflicts_with_posture"] = eligible_conflict
        payload["dimension_classes"] = [item for item in classes if item]
        policies.append(payload)
    return tuple(policies)


def policy_payload(result: SemanticDecisionPolicyResult) -> dict[str, Any]:
    data = result.model_dump(mode="json")
    data.pop("command", None)
    return data


def assert_no_total_order() -> None:
    """Guard: posture graph must remain a strict partial order, not a chain."""
    classes = (
        "high_leverage",
        "action",
        "build",
        "selective",
        "review",
        "defensive",
        "recovery",
        "mixed",
        "insufficient",
    )
    comparable = 0
    for left in classes:
        for right in classes:
            if left == right:
                continue
            if posture_dominates(left, right) or posture_dominates(right, left):
                comparable += 1
    total_directed = len(classes) * (len(classes) - 1)
    if comparable == total_directed:
        raise AssertionError("posture dominance became a total order")
    if posture_dominates("action", "build") or posture_dominates("build", "action"):
        raise AssertionError("action vs build must stay incomparable")
    if posture_dominates("mixed", "review") or posture_dominates("review", "mixed"):
        raise AssertionError("mixed vs review must stay incomparable")
    if posture_dominates("recovery", "defensive") or posture_dominates(
        "defensive", "recovery"
    ):
        raise AssertionError("recovery vs defensive must stay incomparable")
    if posture_dominates("recovery", "review") or posture_dominates(
        "review", "recovery"
    ):
        raise AssertionError("recovery vs review must stay incomparable")
    if posture_dominates("selective", "action"):
        raise AssertionError("selective must not dominate action")


__all__ = [
    "CHALLENGING_SCORE",
    "FAVORABLE_SCORE",
    "LARGE_SCORE_GAP",
    "NEAR_TIE_DELTA",
    "POLICY_VERSION",
    "POSTURE_DOMINANCE",
    "SEMANTIC_STATUS",
    "SemanticDecisionPolicyResult",
    "assert_no_total_order",
    "compare_pair_policy",
    "compare_policy_pairs",
    "evaluate_policy",
    "find_window_kind",
    "find_window_policies",
    "opportunity_band",
    "policy_payload",
    "posture_dominates",
]
