"""Phase 3E — semantic explanation contract (shadow).

Turns assessment + policy + risk metadata into stable message codes and
structured slots. Not UI copy. Not command synthesis. Not canonical.

Copy principles (for later localization, not runtime prose):
- concise, direct, calm
- non-fatalistic, non-mystical
- no guaranteed outcomes
- no "100% good day"
- score is strength, not probability
- posture is execution condition, not destiny

RTL-safe: meaning lives in codes and named ``localization_args``, never in
word order or punctuation. Compatible with EN / FA / AR / RU keys.
"""

from __future__ import annotations

from typing import Any, Literal, Mapping, Sequence

from pydantic import BaseModel, ConfigDict, Field

from packages.decision_engine.dimension_classification import (
    HIGH_THRESHOLD,
    LOW_THRESHOLD,
)
from packages.decision_engine.dimension_mapping import (
    DIMENSION_KEYS,
    INVERTED_DIMENSIONS,
)
from packages.decision_engine.semantic_policy import (
    CHALLENGING_SCORE,
    FAVORABLE_SCORE,
    evaluate_policy,
)

EXPLANATION_SCHEMA_VERSION = "semantic_explanation.v1-shadow"
SEMANTIC_STATUS = "experimental_shadow"

CODE_STRONG_CLEAN = "semantic.strong_clean"
CODE_STRONG_SELECTIVE = "semantic.strong_selective"
CODE_STRONG_RESTRAINED = "semantic.strong_restrained"
CODE_WEAK_DEFENSIVE = "semantic.weak_defensive"
CODE_REVIEW_FOCUS = "semantic.review_focus"
CODE_MIXED_CONFLICT = "semantic.mixed_conflict"
CODE_INSUFFICIENT = "semantic.insufficient"
CODE_UNCERTAIN = "semantic.uncertain"

CODE_OPPORTUNITY_STRONG = "semantic.opportunity_strong"
CODE_OPPORTUNITY_MIXED = "semantic.opportunity_mixed"
CODE_OPPORTUNITY_WEAK = "semantic.opportunity_weak"
CODE_HIGHER_SCORE_OPPORTUNITY = "semantic.higher_score_stronger_opportunity"
CODE_EQUAL_OPPORTUNITY = "semantic.equal_opportunity"
CODE_NEAR_TIE_OPPORTUNITY = "semantic.near_tie_opportunity"

CODE_POSTURE_HIGH_LEVERAGE = "semantic.posture_high_leverage"
CODE_POSTURE_ACTION = "semantic.posture_action"
CODE_POSTURE_BUILD = "semantic.posture_build"
CODE_POSTURE_SELECTIVE = "semantic.posture_selective"
CODE_POSTURE_REVIEW = "semantic.posture_review"
CODE_POSTURE_DEFENSIVE = "semantic.posture_defensive"
CODE_POSTURE_RECOVERY = "semantic.posture_recovery"
CODE_POSTURE_MIXED = "semantic.posture_mixed"
CODE_POSTURE_INSUFFICIENT = "semantic.posture_insufficient"
CODE_CLEANER_POSTURE = "semantic.cleaner_posture"
CODE_LOWER_SCORE_CLEANER = "semantic.lower_score_cleaner_posture"
CODE_SAME_POSTURE = "semantic.same_posture"

CODE_MATERIAL_TRADEOFF = "semantic.material_tradeoff"
CODE_NEAR_TIE_CLEANER = "semantic.near_tie_cleaner_posture"
CODE_COMPARE_ALIGNED = "semantic.compare_aligned"
CODE_SCORE_CAUTION = "semantic.score_advantage_with_caution"
CODE_NO_DEFINITIVE_BETTER = "semantic.no_definitive_better"

CODE_WINDOW_CLEAN = "semantic.window_clean_forward"
CODE_WINDOW_MIXED = "semantic.window_mixed_posture"
CODE_WINDOW_RESTRICTIVE = "semantic.window_restrictive"
CODE_WINDOW_INSUFFICIENT = "semantic.window_insufficient"
CODE_WINDOW_MIXED_SUMMARY = "semantic.window_contains_forward_and_restrictive"

CODE_HIGH_PRESSURE = "semantic.high_pressure"
CODE_LOW_PRESSURE = "semantic.low_pressure"
CODE_HIGH_OPPORTUNITY = "semantic.high_opportunity"
CODE_LOW_OPPORTUNITY = "semantic.low_opportunity"
CODE_HIGH_MOMENTUM = "semantic.high_momentum"
CODE_LOW_MOMENTUM = "semantic.low_momentum"
CODE_HIGH_CLARITY = "semantic.high_clarity"
CODE_LOW_CLARITY = "semantic.low_clarity"
CODE_HIGH_STABILITY = "semantic.high_stability"
CODE_LOW_STABILITY = "semantic.low_stability"
CODE_HIGH_COOPERATION = "semantic.high_cooperation"
CODE_LOW_COOPERATION = "semantic.low_cooperation"
CODE_HIGH_REVERSIBILITY = "semantic.high_reversibility_safety"
CODE_LOW_REVERSIBILITY = "semantic.low_reversibility_safety"
CODE_SAME_DIMENSION_CONFLICT = "semantic.same_dimension_conflict"
CODE_VETO_PRESENT = "semantic.veto_present"

CODE_NO_OUTCOME_PREDICTION = "semantic.no_outcome_prediction"
CODE_HIGH_STAKES_REVIEW = "semantic.high_stakes_review_required"
CODE_DEADLINE_PRIORITY = "semantic.deadline_priority"

POSTURE_CODES = {
    "high_leverage": CODE_POSTURE_HIGH_LEVERAGE,
    "action": CODE_POSTURE_ACTION,
    "build": CODE_POSTURE_BUILD,
    "selective": CODE_POSTURE_SELECTIVE,
    "review": CODE_POSTURE_REVIEW,
    "defensive": CODE_POSTURE_DEFENSIVE,
    "recovery": CODE_POSTURE_RECOVERY,
    "mixed": CODE_POSTURE_MIXED,
    "insufficient": CODE_POSTURE_INSUFFICIENT,
}

DIMENSION_HIGH_CODES = {
    "opportunity": CODE_HIGH_OPPORTUNITY,
    "momentum": CODE_HIGH_MOMENTUM,
    "clarity": CODE_HIGH_CLARITY,
    "stability": CODE_HIGH_STABILITY,
    "cooperation": CODE_HIGH_COOPERATION,
    "pressure": CODE_HIGH_PRESSURE,
    "reversibility_safety": CODE_HIGH_REVERSIBILITY,
}
DIMENSION_LOW_CODES = {
    "opportunity": CODE_LOW_OPPORTUNITY,
    "momentum": CODE_LOW_MOMENTUM,
    "clarity": CODE_LOW_CLARITY,
    "stability": CODE_LOW_STABILITY,
    "cooperation": CODE_LOW_COOPERATION,
    "pressure": CODE_LOW_PRESSURE,
    "reversibility_safety": CODE_LOW_REVERSIBILITY,
}

FORBIDDEN_CODE_SUBSTRINGS = (
    "probab",
    "chance",
    "luck",
    "destin",
    "guarant",
    "percent",
    "100",
    "good_day",
    "bad_day",
    "command",
    "neutral",
    "winner",
    "approval",
    "diagnosis",
    "visa_success",
)

COPY_PRINCIPLES = (
    "concise",
    "direct",
    "calm",
    "non-fatalistic",
    "non-mystical",
    "no_guaranteed_outcomes",
    "no_absolute_good_day",
    "score_is_strength_not_probability",
    "posture_is_execution_not_destiny",
)

LOCALIZATION_SLOTS: dict[str, tuple[str, ...]] = {
    CODE_STRONG_CLEAN: ("score", "posture"),
    CODE_STRONG_SELECTIVE: ("score", "posture"),
    CODE_MATERIAL_TRADEOFF: (
        "left_score",
        "right_score",
        "left_posture",
        "right_posture",
    ),
    CODE_LOWER_SCORE_CLEANER: ("score_preference", "posture_preference"),
    CODE_INSUFFICIENT: (),
    CODE_NO_OUTCOME_PREDICTION: ("risk_level",),
    CODE_DEADLINE_PRIORITY: (),
    CODE_WINDOW_MIXED_SUMMARY: ("window_id", "dimension_classes"),
}


class ExplanationEvidenceRef(BaseModel):
    """Links a support/caution code to dimension evidence ids when present."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    code: str
    role: Literal["support", "caution", "conflict"]
    dimension_id: str | None = None
    evidence_ids: tuple[str, ...] = ()


class SemanticExplanation(BaseModel):
    """Structured explanation slots. Codes only. Not a command. Not UI copy."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal["semantic_explanation.v1-shadow"] = (
        EXPLANATION_SCHEMA_VERSION
    )
    semantic_status: Literal["experimental_shadow"] = SEMANTIC_STATUS
    headline_code: str
    summary_code: str
    opportunity_code: str
    posture_code: str
    tradeoff_code: str | None = None
    caution_codes: tuple[str, ...] = ()
    support_codes: tuple[str, ...] = ()
    safety_codes: tuple[str, ...] = ()
    evidence_refs: tuple[ExplanationEvidenceRef, ...] = ()
    localization_args: dict[str, Any] = Field(default_factory=dict)


def explanation_payload(result: SemanticExplanation) -> dict[str, Any]:
    data = result.model_dump(mode="json")
    data.pop("command", None)
    return data


def _unique(codes: Sequence[str]) -> tuple[str, ...]:
    seen: list[str] = []
    for code in codes:
        if code and code not in seen:
            seen.append(code)
    return tuple(seen)


def _score_of(
    assessment: Mapping[str, Any] | None, fallback: float | None = None
) -> float:
    if assessment and assessment.get("score") is not None:
        return float(assessment["score"])
    if fallback is not None:
        return float(fallback)
    return 0.0


def _posture_of(
    assessment: Mapping[str, Any] | None, fallback: str = "insufficient"
) -> str:
    if not assessment:
        return fallback
    blob = assessment.get("dimension_classification") or {}
    value = blob.get("day_class") if isinstance(blob, Mapping) else None
    if isinstance(value, str) and value:
        return value
    value = assessment.get("dimension_class")
    if isinstance(value, str) and value:
        return value
    return fallback


def _opportunity_code(score: float) -> str:
    if score >= FAVORABLE_SCORE:
        return CODE_OPPORTUNITY_STRONG
    if score < CHALLENGING_SCORE:
        return CODE_OPPORTUNITY_WEAK
    return CODE_OPPORTUNITY_MIXED


def _opportunity_band(score: float) -> str:
    if score >= FAVORABLE_SCORE:
        return "strong"
    if score < CHALLENGING_SCORE:
        return "weak"
    return "mixed"


def _context(assessment: Mapping[str, Any] | None) -> Mapping[str, Any]:
    if not assessment:
        return {}
    ctx = assessment.get("context")
    return ctx if isinstance(ctx, Mapping) else {}


def _classification(assessment: Mapping[str, Any] | None) -> Mapping[str, Any]:
    if not assessment:
        return {}
    blob = assessment.get("dimension_classification")
    return blob if isinstance(blob, Mapping) else {}


def _safety_codes(
    context: Mapping[str, Any], policy: Mapping[str, Any] | None = None
) -> tuple[str, ...]:
    codes: list[str] = []
    level = context.get("risk_level")
    if policy:
        level = policy.get("risk_level") or level
    prohibited = bool(
        context.get("outcome_prediction_prohibited")
        or (policy or {}).get("outcome_prediction_prohibited")
    )
    deadline = bool(
        context.get("factual_deadline_priority")
        or (policy or {}).get("factual_deadline_priority")
    )
    high = level == "high_stakes" or bool(context.get("high_stakes"))
    if high:
        codes.append(CODE_HIGH_STAKES_REVIEW)
        codes.append(CODE_NO_OUTCOME_PREDICTION)
    elif prohibited:
        codes.append(CODE_NO_OUTCOME_PREDICTION)
    if deadline:
        codes.append(CODE_DEADLINE_PRIORITY)
    return _unique(codes)


def _dimension_blob(
    assessment: Mapping[str, Any] | None, key: str
) -> Mapping[str, Any] | None:
    if not assessment:
        return None
    dims = assessment.get("dimensions")
    if not isinstance(dims, Mapping):
        return None
    blob = dims.get(key)
    return blob if isinstance(blob, Mapping) else None


def _support_caution_from_dimensions(
    assessment: Mapping[str, Any] | None,
) -> tuple[tuple[str, ...], tuple[str, ...], tuple[ExplanationEvidenceRef, ...]]:
    support: list[tuple[float, str, str, tuple[str, ...]]] = []
    caution: list[tuple[float, str, str, tuple[str, ...]]] = []
    for key in DIMENSION_KEYS:
        blob = _dimension_blob(assessment, key)
        if not blob or blob.get("status") != "scored":
            continue
        value = int(blob.get("value") or 0)
        strength = float(blob.get("evidence_strength") or 0.0)
        ids = tuple(blob.get("dominant_evidence_ids") or ())
        inverted = key in INVERTED_DIMENSIONS
        high = value >= HIGH_THRESHOLD
        low = value <= LOW_THRESHOLD
        if inverted:
            if high:
                caution.append((value + strength, key, DIMENSION_HIGH_CODES[key], ids))
            elif low:
                support.append(
                    ((100 - value) + strength, key, DIMENSION_LOW_CODES[key], ids)
                )
        else:
            if high:
                support.append((value + strength, key, DIMENSION_HIGH_CODES[key], ids))
            elif low:
                caution.append(
                    ((100 - value) + strength, key, DIMENSION_LOW_CODES[key], ids)
                )

    support.sort(key=lambda row: (-row[0], row[1]))
    caution.sort(key=lambda row: (-row[0], row[1]))
    top_support = support[:2]
    top_caution = caution[:2]
    refs: list[ExplanationEvidenceRef] = []
    for _, key, code, ids in top_support:
        refs.append(
            ExplanationEvidenceRef(
                code=code, role="support", dimension_id=key, evidence_ids=ids
            )
        )
    for _, key, code, ids in top_caution:
        refs.append(
            ExplanationEvidenceRef(
                code=code, role="caution", dimension_id=key, evidence_ids=ids
            )
        )
    return (
        tuple(item[2] for item in top_support),
        tuple(item[2] for item in top_caution),
        tuple(refs),
    )


def _conflict_codes(
    assessment: Mapping[str, Any] | None,
) -> tuple[tuple[str, ...], tuple[ExplanationEvidenceRef, ...]]:
    blob = _classification(assessment)
    codes: list[str] = []
    refs: list[ExplanationEvidenceRef] = []
    if blob.get("same_dimension_conflict") or blob.get("conflicted_dimension_ids"):
        codes.append(CODE_SAME_DIMENSION_CONFLICT)
        for dim_id in blob.get("conflicted_dimension_ids") or ():
            dim = _dimension_blob(assessment, str(dim_id))
            ids = tuple((dim or {}).get("dominant_evidence_ids") or ())
            refs.append(
                ExplanationEvidenceRef(
                    code=CODE_SAME_DIMENSION_CONFLICT,
                    role="conflict",
                    dimension_id=str(dim_id),
                    evidence_ids=ids,
                )
            )
    if blob.get("veto_dimension_ids"):
        codes.append(CODE_VETO_PRESENT)
    return _unique(codes), tuple(refs)


def _headline_for_assessment(
    score: float, posture: str, interpretation: str | None
) -> tuple[str, str]:
    if posture == "insufficient" or interpretation == "insufficient_semantics":
        return CODE_INSUFFICIENT, CODE_INSUFFICIENT
    if posture == "review":
        return CODE_REVIEW_FOCUS, CODE_REVIEW_FOCUS
    if posture == "mixed":
        return CODE_MIXED_CONFLICT, CODE_MIXED_CONFLICT
    if interpretation == "strong_and_clean":
        return CODE_STRONG_CLEAN, CODE_STRONG_CLEAN
    if interpretation == "strong_but_selective":
        return CODE_STRONG_SELECTIVE, CODE_STRONG_SELECTIVE
    if interpretation == "strong_but_restrained":
        return CODE_STRONG_RESTRAINED, CODE_STRONG_RESTRAINED
    if interpretation == "weak_and_defensive":
        return CODE_WEAK_DEFENSIVE, CODE_WEAK_DEFENSIVE
    if score >= FAVORABLE_SCORE and posture == "selective":
        return CODE_STRONG_SELECTIVE, CODE_STRONG_SELECTIVE
    if score < CHALLENGING_SCORE:
        return CODE_WEAK_DEFENSIVE, CODE_WEAK_DEFENSIVE
    return CODE_UNCERTAIN, CODE_UNCERTAIN


def _unique_refs(
    refs: Sequence[ExplanationEvidenceRef],
) -> tuple[ExplanationEvidenceRef, ...]:
    seen: list[ExplanationEvidenceRef] = []
    keys: set[tuple[str, str, str | None]] = set()
    for ref in refs:
        key = (ref.code, ref.role, ref.dimension_id)
        if key in keys:
            continue
        keys.add(key)
        seen.append(ref)
    return tuple(seen)


def explain_assessment(
    assessment: Mapping[str, Any] | None,
    *,
    score: float | None = None,
    posture: str | None = None,
    policy: Mapping[str, Any] | None = None,
) -> SemanticExplanation:
    """Single-assessment explanation. Does not emit commands or prose."""
    resolved_score = _score_of(assessment, score)
    resolved_posture = posture or _posture_of(assessment)
    if policy is None:
        policy_model = evaluate_policy(
            score=resolved_score,
            posture=resolved_posture,
            assessment=assessment,
        )
        policy = policy_model.model_dump(mode="json")
    interpretation = (policy or {}).get("evaluate_interpretation")
    headline, summary = _headline_for_assessment(
        resolved_score, resolved_posture, interpretation
    )
    support, caution, dim_refs = _support_caution_from_dimensions(assessment)
    conflict, conflict_refs = _conflict_codes(assessment)
    caution = _unique((*caution, *conflict))
    ctx = _context(assessment)
    safety = _safety_codes(ctx, policy)
    args = {
        "score": resolved_score,
        "posture": resolved_posture,
        "opportunity_band": _opportunity_band(resolved_score),
        "risk_level": ctx.get("risk_level") or (policy or {}).get("risk_level"),
        "risk_domains": list(ctx.get("risk_domains") or ()),
        "support_dimension_ids": [
            ref.dimension_id
            for ref in dim_refs
            if ref.role == "support" and ref.dimension_id
        ],
        "caution_dimension_ids": [
            ref.dimension_id
            for ref in dim_refs
            if ref.role == "caution" and ref.dimension_id
        ],
        "copy_principles": list(COPY_PRINCIPLES),
        "locales": ["en", "fa", "ar", "ru"],
    }
    return SemanticExplanation(
        headline_code=headline,
        summary_code=summary,
        opportunity_code=_opportunity_code(resolved_score),
        posture_code=POSTURE_CODES.get(resolved_posture, CODE_POSTURE_INSUFFICIENT),
        tradeoff_code=None,
        caution_codes=caution,
        support_codes=support,
        safety_codes=safety,
        evidence_refs=_unique_refs((*dim_refs, *conflict_refs)),
        localization_args=args,
    )


def explain_compare_pair(
    left: Mapping[str, Any],
    right: Mapping[str, Any],
    policy: Mapping[str, Any],
) -> SemanticExplanation:
    """Pair explanation. Never names a replacement winner."""
    left_score = _score_of(left, left.get("score"))
    right_score = _score_of(right, right.get("score"))
    left_posture = _posture_of(
        left, str(left.get("dimension_class") or "insufficient")
    )
    right_posture = _posture_of(
        right, str(right.get("dimension_class") or "insufficient")
    )
    relation = str(policy.get("relation") or "")
    band = str(policy.get("opportunity_band") or "")
    score_pref = policy.get("score_preference")
    posture_pref = policy.get("posture_preference")

    if relation == "insufficient_semantics":
        headline = CODE_INSUFFICIENT
    elif relation == "material_tradeoff":
        headline = CODE_MATERIAL_TRADEOFF
    elif relation == "semantic_quality_advantage":
        headline = (
            CODE_NEAR_TIE_CLEANER if band == "near_tie" else CODE_LOWER_SCORE_CLEANER
        )
    elif relation == "score_advantage_with_semantic_caution":
        headline = CODE_SCORE_CAUTION
    else:
        headline = CODE_COMPARE_ALIGNED

    if band == "near_tie":
        opportunity = CODE_NEAR_TIE_OPPORTUNITY
    elif score_pref:
        opportunity = CODE_HIGHER_SCORE_OPPORTUNITY
    else:
        opportunity = CODE_EQUAL_OPPORTUNITY

    if posture_pref and score_pref and posture_pref != score_pref:
        posture_code = CODE_LOWER_SCORE_CLEANER
    elif posture_pref:
        posture_code = CODE_CLEANER_POSTURE
    elif left_posture == right_posture:
        posture_code = CODE_SAME_POSTURE
    else:
        posture_code = POSTURE_CODES.get(left_posture, CODE_POSTURE_INSUFFICIENT)

    tradeoff = None
    if relation == "material_tradeoff" or policy.get("requires_user_tradeoff"):
        tradeoff = CODE_NO_DEFINITIVE_BETTER

    left_assess = (
        left.get("assessment")
        if isinstance(left.get("assessment"), Mapping)
        else left
    )
    right_assess = (
        right.get("assessment")
        if isinstance(right.get("assessment"), Mapping)
        else right
    )
    l_support, l_caution, l_refs = _support_caution_from_dimensions(left_assess)
    r_support, r_caution, r_refs = _support_caution_from_dimensions(right_assess)
    l_conflict, l_crefs = _conflict_codes(left_assess)
    r_conflict, r_crefs = _conflict_codes(right_assess)
    ctx = _context(left_assess if isinstance(left_assess, Mapping) else None)
    rctx = _context(right_assess if isinstance(right_assess, Mapping) else None)
    safety = _safety_codes(ctx, policy) or _safety_codes(rctx, policy)

    args = {
        "left_id": policy.get("left_id"),
        "right_id": policy.get("right_id"),
        "left_score": left_score,
        "right_score": right_score,
        "left_posture": left_posture,
        "right_posture": right_posture,
        "relation": relation,
        "opportunity_band": band,
        "score_preference": score_pref,
        "posture_preference": posture_pref,
        "requires_user_tradeoff": bool(policy.get("requires_user_tradeoff")),
        "locales": ["en", "fa", "ar", "ru"],
        "copy_principles": list(COPY_PRINCIPLES),
    }
    return SemanticExplanation(
        headline_code=headline,
        summary_code=headline,
        opportunity_code=opportunity,
        posture_code=posture_code,
        tradeoff_code=tradeoff,
        caution_codes=_unique((*l_caution, *r_caution, *l_conflict, *r_conflict)),
        support_codes=_unique((*l_support, *r_support)),
        safety_codes=safety,
        evidence_refs=_unique_refs((*l_refs, *r_refs, *l_crefs, *r_crefs)),
        localization_args=args,
    )


def explain_compare_pairs(
    items: Sequence[Mapping[str, Any]],
    policy_pairs: Sequence[Mapping[str, Any]],
) -> tuple[dict[str, Any], ...]:
    by_id = {
        str(item.get("id") or item.get("option_id") or index): item
        for index, item in enumerate(items)
    }
    out: list[dict[str, Any]] = []
    for pair in policy_pairs:
        left = by_id.get(str(pair.get("left_id") or ""))
        right = by_id.get(str(pair.get("right_id") or ""))
        if left is None or right is None:
            continue
        out.append(explanation_payload(explain_compare_pair(left, right, pair)))
    return tuple(out)


def explain_find_window(window_policy: Mapping[str, Any]) -> SemanticExplanation:
    kind = str(window_policy.get("find_window_kind") or "insufficient_semantic_window")
    headline = {
        "clean_forward_window": CODE_WINDOW_CLEAN,
        "mixed_posture_window": CODE_WINDOW_MIXED,
        "restrictive_window": CODE_WINDOW_RESTRICTIVE,
        "insufficient_semantic_window": CODE_WINDOW_INSUFFICIENT,
    }.get(kind, CODE_WINDOW_INSUFFICIENT)
    summary = CODE_WINDOW_MIXED_SUMMARY if kind == "mixed_posture_window" else headline
    args = {
        "window_id": window_policy.get("window_id") or window_policy.get("left_id"),
        "find_window_kind": kind,
        "dimension_classes": list(window_policy.get("dimension_classes") or ()),
        "legacy_eligibility_conflicts_with_posture": bool(
            window_policy.get("legacy_eligibility_conflicts_with_posture")
        ),
        "locales": ["en", "fa", "ar", "ru"],
        "copy_principles": list(COPY_PRINCIPLES),
    }
    return SemanticExplanation(
        headline_code=headline,
        summary_code=summary,
        opportunity_code=(
            CODE_OPPORTUNITY_STRONG
            if window_policy.get("legacy_eligible_high_band")
            else CODE_OPPORTUNITY_MIXED
        ),
        posture_code=headline,
        tradeoff_code=CODE_WINDOW_MIXED_SUMMARY
        if kind == "mixed_posture_window"
        else None,
        caution_codes=(CODE_WINDOW_MIXED_SUMMARY,)
        if kind == "mixed_posture_window"
        else (),
        localization_args=args,
    )


def explain_find_windows(
    window_policies: Sequence[Mapping[str, Any]],
) -> tuple[dict[str, Any], ...]:
    return tuple(
        explanation_payload(explain_find_window(item)) for item in window_policies
    )


def assert_codes_have_no_probability_wording() -> None:
    catalog = [
        value
        for name, value in globals().items()
        if name.startswith("CODE_") and isinstance(value, str)
    ]
    for code in catalog:
        lowered = code.lower()
        for needle in FORBIDDEN_CODE_SUBSTRINGS:
            if needle in lowered:
                raise AssertionError(f"forbidden wording {needle!r} in {code}")


__all__ = [
    "COPY_PRINCIPLES",
    "EXPLANATION_SCHEMA_VERSION",
    "ExplanationEvidenceRef",
    "LOCALIZATION_SLOTS",
    "SEMANTIC_STATUS",
    "SemanticExplanation",
    "assert_codes_have_no_probability_wording",
    "explain_assessment",
    "explain_compare_pair",
    "explain_compare_pairs",
    "explain_find_window",
    "explain_find_windows",
    "explanation_payload",
]
