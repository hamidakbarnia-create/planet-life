"""Phase 3C semantic-policy validation corpus.

Product expected result may be a tradeoff rather than a winner.
Rows do not retune the v3 classifier. MX04 is not resolved here.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

Relation = Literal[
    "aligned",
    "score_advantage_with_semantic_caution",
    "semantic_quality_advantage",
    "material_tradeoff",
    "insufficient_semantics",
]


class PolicyCorpusCase(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    case_id: str
    family: str
    left: dict[str, Any]
    right: dict[str, Any]
    expected_relation: Relation
    notes: str


def _opt(
    option_id: str,
    score: float,
    day_class: str,
    *,
    action_type: str = "business_launch",
    veto: bool = False,
    conflict: bool = False,
) -> dict[str, Any]:
    classification: dict[str, Any] = {
        "day_class": day_class,
        "classifier_version": "dimension_class.v3-shadow",
        "semantic_status": "experimental_shadow",
        "veto_dimension_ids": ["stability"] if veto else [],
        "same_dimension_conflict": conflict,
        "conflicted_dimension_ids": ["cooperation"] if conflict else [],
    }
    return {
        "id": option_id,
        "option_id": option_id,
        "score": score,
        "dimension_class": day_class,
        "assessment": {
            "score": score,
            "phase2a_class": "mixed",
            "dimension_classification": classification,
            "context": {"action_type": action_type, "high_stakes": None},
        },
    }


POLICY_CORPUS: tuple[PolicyCorpusCase, ...] = (
    PolicyCorpusCase(
        case_id="SP01_81_selective_vs_70_action",
        family="tradeoff",
        left=_opt("a", 81, "selective"),
        right=_opt("b", 70, "action"),
        expected_relation="material_tradeoff",
        notes="Stronger opportunity with constraints vs cleaner posture. No auto-winner.",
    ),
    PolicyCorpusCase(
        case_id="SP02_71_selective_vs_70_action",
        family="near_tie",
        left=_opt("a", 71, "selective"),
        right=_opt("b", 70, "action"),
        expected_relation="semantic_quality_advantage",
        notes="Near-tie lets cleaner action posture speak without overriding a real gap.",
    ),
    PolicyCorpusCase(
        case_id="SP03_90_selective_vs_65_action",
        family="large_gap",
        left=_opt("a", 90, "selective"),
        right=_opt("b", 65, "action"),
        expected_relation="material_tradeoff",
        notes="Large score gap still cannot erase cleaner posture. Tradeoff.",
    ),
    PolicyCorpusCase(
        case_id="SP04_70_high_leverage_vs_72_action",
        family="near_tie",
        left=_opt("a", 70, "high_leverage"),
        right=_opt("b", 72, "action"),
        expected_relation="semantic_quality_advantage",
        notes="Modest/near score difference: high_leverage may be semantically stronger.",
    ),
    PolicyCorpusCase(
        case_id="SP05_equal_action_vs_selective",
        family="near_tie",
        left=_opt("a", 70, "action"),
        right=_opt("b", 70, "selective"),
        expected_relation="semantic_quality_advantage",
        notes="Equal score: action is cleaner; selective does not automatically lose as a rank rule — policy only.",
    ),
    PolicyCorpusCase(
        case_id="SP06_defensive_higher_than_action",
        family="tradeoff",
        left=_opt("a", 80, "defensive"),
        right=_opt("b", 70, "action"),
        expected_relation="material_tradeoff",
        notes="Higher defensive score vs cleaner action. Axes disagree.",
    ),
    PolicyCorpusCase(
        case_id="SP07_mixed_vs_review",
        family="incomparable",
        left=_opt("a", 75, "mixed"),
        right=_opt("b", 70, "review"),
        expected_relation="material_tradeoff",
        notes="mixed must not beat or lose to review by class label alone.",
    ),
    PolicyCorpusCase(
        case_id="SP08_recovery_vs_defensive",
        family="incomparable",
        left=_opt("a", 60, "recovery"),
        right=_opt("b", 55, "defensive"),
        expected_relation="material_tradeoff",
        notes="Context-dependent restraint pair. No global dominance.",
    ),
    PolicyCorpusCase(
        case_id="SP09_insufficient_vs_scored",
        family="unknown",
        left=_opt("a", 80, "insufficient"),
        right=_opt("b", 70, "action"),
        expected_relation="insufficient_semantics",
        notes="insufficient cannot establish semantic preference and is not neutral.",
    ),
    PolicyCorpusCase(
        case_id="SP10_same_class_score_gap",
        family="aligned",
        left=_opt("a", 82, "action"),
        right=_opt("b", 70, "action"),
        expected_relation="aligned",
        notes="Same posture: score advantage is meaningful and aligned.",
    ),
    PolicyCorpusCase(
        case_id="SP11_context_twins_action_type",
        family="context",
        left=_opt("a", 70, "selective", action_type="business_launch"),
        right=_opt("b", 70, "action", action_type="rest_recovery"),
        expected_relation="semantic_quality_advantage",
        notes="Same date/score, different action_type can yield different posture.",
    ),
    PolicyCorpusCase(
        case_id="SP12_aligned_score_and_posture",
        family="aligned",
        left=_opt("a", 80, "action"),
        right=_opt("b", 70, "selective"),
        expected_relation="aligned",
        notes="Score winner is also cleaner posture.",
    ),
    PolicyCorpusCase(
        case_id="SP13_review_score_vs_action",
        family="caution",
        left=_opt("a", 80, "review"),
        right=_opt("b", 70, "action"),
        expected_relation="score_advantage_with_semantic_caution",
        notes="Score winner is unresolved review vs cleaner action; no class dominance.",
    ),
    PolicyCorpusCase(
        case_id="SP14_hl_does_not_beat_much_stronger_score",
        family="large_gap",
        left=_opt("a", 70, "high_leverage"),
        right=_opt("b", 90, "action"),
        expected_relation="material_tradeoff",
        notes="high_leverage must not automatically beat a much stronger score.",
    ),
)


__all__ = ["POLICY_CORPUS", "PolicyCorpusCase"]
