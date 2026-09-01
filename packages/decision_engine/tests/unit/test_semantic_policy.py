"""Phase 3C semantic policy tests — shadow resolver only."""

from __future__ import annotations

from datetime import date

from packages.decision_engine.compare_dates import (
    ScoredCompareOption,
    rank_compare_options,
)
from packages.decision_engine.evaluate.car_interview_compare import compare_car_interview
from packages.decision_engine.find_windows import (
    ScoredFindDay,
    build_find_windows,
    group_contiguous_windows,
)
from packages.decision_engine.semantic_policy import (
    LARGE_SCORE_GAP,
    NEAR_TIE_DELTA,
    POLICY_VERSION,
    assert_no_total_order,
    compare_pair_policy,
    evaluate_policy,
    find_window_kind,
    opportunity_band,
    posture_dominates,
)
from packages.decision_engine.tests.fixtures.semantic_policy_corpus import POLICY_CORPUS
from packages.decision_engine.tests.unit.test_car_interview_compare_runtime import (
    CASE_ID as COMPARE_CASE_ID,
    _compare_intake,
    _outcome as _compare_outcome,
)


def _pair(left: dict, right: dict):
    return compare_pair_policy(
        left,
        right,
        left_id=str(left["id"]),
        right_id=str(right["id"]),
    )


def test_corpus_expected_relations() -> None:
    for case in POLICY_CORPUS:
        result = _pair(case.left, case.right)
        assert result.relation == case.expected_relation, (
            f"{case.case_id}: {result.relation} != {case.expected_relation} "
            f"codes={result.rationale_codes}"
        )
        assert result.policy_version == POLICY_VERSION
        assert result.semantic_status == "experimental_shadow"
        assert "command" not in result.model_dump()


def test_no_total_posture_order() -> None:
    assert_no_total_order()
    assert not posture_dominates("selective", "action")
    assert posture_dominates("action", "selective")
    assert posture_dominates("high_leverage", "action")
    assert not posture_dominates("action", "high_leverage")


def test_selective_does_not_automatically_lose_to_action() -> None:
    result = _pair(
        {"id": "a", "score": 81, "dimension_class": "selective"},
        {"id": "b", "score": 70, "dimension_class": "action"},
    )
    assert result.relation == "material_tradeoff"
    assert result.score_preference == "a"
    assert result.posture_preference == "b"
    assert result.requires_user_tradeoff is True


def test_high_leverage_does_not_beat_much_stronger_score() -> None:
    result = _pair(
        {"id": "hl", "score": 70, "dimension_class": "high_leverage"},
        {"id": "ac", "score": 90, "dimension_class": "action"},
    )
    assert result.relation == "material_tradeoff"
    assert result.score_preference == "ac"
    assert result.posture_preference == "hl"


def test_insufficient_is_not_neutral() -> None:
    result = _pair(
        {"id": "a", "score": 80, "dimension_class": "insufficient"},
        {"id": "b", "score": 70, "dimension_class": "action"},
    )
    assert result.relation == "insufficient_semantics"
    assert result.posture_preference is None
    assert "semantic_insufficient" in result.rationale_codes
    assert result.conflict_level == "unresolved"


def test_policy_deterministic() -> None:
    args = (
        {"id": "a", "score": 81, "dimension_class": "selective"},
        {"id": "b", "score": 70, "dimension_class": "action"},
    )
    first = compare_pair_policy(*args, left_id="a", right_id="b")
    second = compare_pair_policy(*args, left_id="a", right_id="b")
    assert first == second


def test_score_delta_sensitivity_near_tie_adoption() -> None:
    """NEAR_TIE_DELTA=2 matches COMPARE epsilon. Raising it changes 81-vs-70."""
    modest = compare_pair_policy(
        {"id": "a", "score": 81, "dimension_class": "selective"},
        {"id": "b", "score": 70, "dimension_class": "action"},
        left_id="a",
        right_id="b",
        near_tie_delta=2.0,
    )
    assert modest.relation == "material_tradeoff"
    overly_wide = compare_pair_policy(
        {"id": "a", "score": 81, "dimension_class": "selective"},
        {"id": "b", "score": 70, "dimension_class": "action"},
        left_id="a",
        right_id="b",
        near_tie_delta=12.0,
    )
    assert overly_wide.relation == "semantic_quality_advantage"
    assert overly_wide.posture_preference == "b"
    assert NEAR_TIE_DELTA == 2.0
    assert opportunity_band(11) == "modest_score_gap"
    assert opportunity_band(1) == "near_tie"
    assert opportunity_band(25) == "large_score_gap"
    assert LARGE_SCORE_GAP == 15.0


def test_large_vs_modest_band_does_not_change_conflict_relation() -> None:
    moderate = compare_pair_policy(
        {"id": "a", "score": 81, "dimension_class": "selective"},
        {"id": "b", "score": 70, "dimension_class": "action"},
        left_id="a",
        right_id="b",
        large_score_gap=15.0,
    )
    large = compare_pair_policy(
        {"id": "a", "score": 90, "dimension_class": "selective"},
        {"id": "b", "score": 65, "dimension_class": "action"},
        left_id="a",
        right_id="b",
        large_score_gap=15.0,
    )
    assert moderate.relation == large.relation == "material_tradeoff"
    assert moderate.opportunity_band == "modest_score_gap"
    assert large.opportunity_band == "large_score_gap"


def test_evaluate_interpretations() -> None:
    clean = evaluate_policy(score=80, posture="action")
    assert clean.evaluate_interpretation == "strong_and_clean"
    selective = evaluate_policy(score=81, posture="selective")
    assert selective.evaluate_interpretation == "strong_but_selective"
    restrained = evaluate_policy(score=80, posture="defensive")
    assert restrained.evaluate_interpretation == "strong_but_restrained"
    weak = evaluate_policy(score=40, posture="defensive")
    assert weak.evaluate_interpretation == "weak_and_defensive"
    unknown = evaluate_policy(score=70, posture="insufficient")
    assert unknown.evaluate_interpretation == "uncertain_semantics"
    assert "semantic_insufficient" in unknown.rationale_codes
    mixed = evaluate_policy(score=70, posture="mixed")
    assert mixed.evaluate_interpretation == "uncertain_semantics"
    for item in (clean, selective, restrained, weak, unknown, mixed):
        assert "command" not in item.model_dump()


def test_high_stakes_hook_only_when_explicit() -> None:
    bare = evaluate_policy(score=80, posture="action")
    assert "high_stakes_review_required" not in bare.rationale_codes
    flagged = evaluate_policy(
        score=80,
        posture="action",
        assessment={
            "context": {
                "high_stakes": {"domain": "ceremony"},
                "action_type": "wedding_date",
            }
        },
    )
    assert "high_stakes_review_required" in flagged.rationale_codes
    assert "no_outcome_prediction" in flagged.rationale_codes


def test_find_window_kinds_do_not_regroup() -> None:
    days = [
        ScoredFindDay(
            day=date(2026, 9, 1),
            score=72,
            band="high",
            assessment={"dimension_classification": {"day_class": "action"}},
        ),
        ScoredFindDay(
            day=date(2026, 9, 2),
            score=70,
            band="high",
            assessment={"dimension_classification": {"day_class": "selective"}},
        ),
        ScoredFindDay(
            day=date(2026, 9, 3),
            score=40,
            band="low",
            assessment={"dimension_classification": {"day_class": "defensive"}},
        ),
        ScoredFindDay(
            day=date(2026, 9, 4),
            score=75,
            band="high",
            assessment={"dimension_classification": {"day_class": "action"}},
        ),
    ]
    grouped = group_contiguous_windows(days)
    result = build_find_windows(days)
    grouped_ids = {w.window_id for w in grouped}
    ranked_ids = {w.window_id for w in result.windows}
    assert grouped_ids == ranked_ids
    # Legacy ranking still peak-score desc: 75 on 09-04 outranks 72 on 09-01..02.
    assert result.windows[0].start_date == date(2026, 9, 4)
    assert result.windows[0].end_date == date(2026, 9, 4)
    mixed = next(w for w in result.windows if w.start_date == date(2026, 9, 1))
    assert mixed.end_date == date(2026, 9, 2)
    policies = {item["window_id"]: item for item in result.window_policies}
    assert policies[mixed.window_id]["find_window_kind"] == "mixed_posture_window"
    assert policies[mixed.window_id]["legacy_eligibility_conflicts_with_posture"]
    assert policies[result.windows[0].window_id]["find_window_kind"] == (
        "clean_forward_window"
    )
    assert find_window_kind(["action", "action"]) == "clean_forward_window"
    assert find_window_kind(["selective", "defensive"]) == "restrictive_window"
    assert find_window_kind(["insufficient"]) == "insufficient_semantic_window"


def test_legacy_compare_ranking_unchanged_with_policy() -> None:
    ranked = rank_compare_options(
        [
            ScoredCompareOption(
                "a",
                "A",
                "2026-09-10",
                81.0,
                "high",
                assessment={"dimension_classification": {"day_class": "selective"}},
            ),
            ScoredCompareOption(
                "b",
                "B",
                "2026-09-12",
                70.0,
                "high",
                assessment={"dimension_classification": {"day_class": "action"}},
            ),
        ]
    )
    assert ranked.ranked[0].option_id == "a"
    assert ranked.ranked[0].score == 81.0
    assert ranked.unique_winner is True
    assert ranked.policy_pairs
    assert ranked.policy_pairs[0]["relation"] == "material_tradeoff"
    assert ranked.policy_pairs[0]["score_preference"] == "a"
    assert ranked.policy_pairs[0]["posture_preference"] == "b"


def test_compare_runtime_user_facing_ranking_unchanged() -> None:
    scores = {"2026-09-10": 55.0, "2026-09-18": 80.0}

    def generate(request):
        return _compare_outcome(scores[request.target_date])

    pkg = compare_car_interview(
        case_id=COMPARE_CASE_ID,
        case_version=1,
        intake=_compare_intake(option_count=2),
        generate_outcome=generate,
    )
    assert pkg.timing.candidates[0].score == 80.0
    assert pkg.timing.candidates[0].rank == 1
    assert pkg.semantic_shadow is not None
    assert pkg.semantic_shadow.policy_pairs


def test_registry_has_no_high_stakes_boolean_field() -> None:
    from packages.decision_engine.registry.schema import DecisionTypeRecord

    assert "high_stakes" not in DecisionTypeRecord.model_fields
    assert "risk_context" in DecisionTypeRecord.model_fields


def test_evaluate_runtime_policy_is_metadata_only() -> None:
    from packages.decision_engine.evaluate.car_interview_evaluate import (
        evaluate_car_interview,
    )
    from packages.decision_engine.tests.unit.test_car_interview_evaluate_runtime import (
        CASE_ID as EVAL_CASE_ID,
        _intake as _evaluate_intake,
        _outcome as _evaluate_outcome,
    )

    pkg = evaluate_car_interview(
        case_id=EVAL_CASE_ID,
        case_version=1,
        intake=_evaluate_intake(
            natal_evidence={
                "birth_date": "1982-02-25",
                "birth_time": "05:47",
                "location": "Tehran",
            }
        ),
        generate_outcome=lambda _req: _evaluate_outcome(81),
    )
    assert pkg.timing.score == 81.0
    assert pkg.semantic_shadow is not None
    assert pkg.semantic_shadow.policy is not None
    assert "command" not in pkg.semantic_shadow.policy
    assert pkg.semantic_shadow.policy.get("evaluate_interpretation")
    assert pkg.recommendation.stance in {
        "proceed",
        "proceed_with_conditions",
        "wait",
        "prefer_alternate",
        "no_unique_winner",
        "insufficient_data",
    }


def test_v3_class_not_rewritten_by_policy() -> None:
    assessment = {
        "score": 81,
        "dimension_classification": {
            "day_class": "selective",
            "classifier_version": "dimension_class.v3-shadow",
        },
    }
    result = evaluate_policy(score=81, posture="selective", assessment=assessment)
    assert assessment["dimension_classification"]["day_class"] == "selective"
    assert result.evaluate_interpretation == "strong_but_selective"
