"""Phase 3E — semantic explanation contract tests."""

from __future__ import annotations

from datetime import date

from packages.decision_engine.compare_dates import (
    ScoredCompareOption,
    rank_compare_options,
)
from packages.decision_engine.decision_assessment import (
    build_decision_assessment,
    decision_assessment_payload,
)
from packages.decision_engine.find_windows import (
    ScoredFindDay,
    build_find_windows,
    group_contiguous_windows,
)
from packages.decision_engine.semantic_explanation import (
    CODE_CLEANER_POSTURE,
    CODE_DEADLINE_PRIORITY,
    CODE_EQUAL_OPPORTUNITY,
    CODE_HIGH_STAKES_REVIEW,
    CODE_HIGHER_SCORE_OPPORTUNITY,
    CODE_INSUFFICIENT,
    CODE_LOW_CLARITY,
    CODE_LOWER_SCORE_CLEANER,
    CODE_MATERIAL_TRADEOFF,
    CODE_MIXED_CONFLICT,
    CODE_NEAR_TIE_CLEANER,
    CODE_NEAR_TIE_OPPORTUNITY,
    CODE_NO_DEFINITIVE_BETTER,
    CODE_NO_OUTCOME_PREDICTION,
    CODE_OPPORTUNITY_STRONG,
    CODE_OPPORTUNITY_WEAK,
    CODE_POSTURE_ACTION,
    CODE_POSTURE_DEFENSIVE,
    CODE_POSTURE_REVIEW,
    CODE_POSTURE_SELECTIVE,
    CODE_REVIEW_FOCUS,
    CODE_SAME_DIMENSION_CONFLICT,
    CODE_STRONG_CLEAN,
    CODE_STRONG_SELECTIVE,
    CODE_WEAK_DEFENSIVE,
    CODE_WINDOW_CLEAN,
    CODE_WINDOW_MIXED,
    CODE_WINDOW_MIXED_SUMMARY,
    CODE_WINDOW_RESTRICTIVE,
    assert_codes_have_no_probability_wording,
    explain_assessment,
    explain_compare_pair,
    explain_find_window,
)
from packages.decision_engine.semantic_policy import (
    compare_pair_policy,
    evaluate_policy,
)
from packages.decision_engine.tests.fixtures.semantic_policy_corpus import POLICY_CORPUS
from packages.decision_engine.tests.unit.test_decision_assessment import _score_golden


def _dim(
    value: int,
    *,
    status: str = "scored",
    evidence: tuple[str, ...] = (),
    strength: float = 0.6,
    conflicted: bool = False,
) -> dict:
    return {
        "value": value,
        "status": status,
        "evidence_strength": strength if status == "scored" else None,
        "dominant_evidence_ids": list(evidence),
        "supportive_evidence_ids": [],
        "caution_evidence_ids": [],
        "conflicted": conflicted,
    }


def _assessment(
    score: float,
    posture: str,
    *,
    dimensions: dict | None = None,
    context: dict | None = None,
    conflicted: list[str] | None = None,
    veto: list[str] | None = None,
) -> dict:
    return {
        "score": score,
        "dimension_class": posture,
        "dimension_classification": {
            "day_class": posture,
            "same_dimension_conflict": bool(conflicted),
            "conflicted_dimension_ids": conflicted or [],
            "veto_dimension_ids": veto or [],
        },
        "context": context or {},
        "dimensions": dimensions or {},
    }


def test_codes_have_no_probability_or_destiny_wording() -> None:
    assert_codes_have_no_probability_wording()


def test_strong_and_clean() -> None:
    result = explain_assessment(_assessment(80, "action"))
    assert result.headline_code == CODE_STRONG_CLEAN
    assert result.opportunity_code == CODE_OPPORTUNITY_STRONG
    assert result.posture_code == CODE_POSTURE_ACTION
    assert "command" not in result.model_dump()
    assert result.safety_codes == ()


def test_strong_but_selective_and_high_score_selective() -> None:
    result = explain_assessment(_assessment(81, "selective"))
    assert result.headline_code == CODE_STRONG_SELECTIVE
    assert result.opportunity_code == CODE_OPPORTUNITY_STRONG
    assert result.posture_code == CODE_POSTURE_SELECTIVE


def test_weak_and_defensive() -> None:
    result = explain_assessment(_assessment(40, "defensive"))
    assert result.headline_code == CODE_WEAK_DEFENSIVE
    assert result.opportunity_code == CODE_OPPORTUNITY_WEAK
    assert result.posture_code == CODE_POSTURE_DEFENSIVE


def test_review_is_not_automatically_negative() -> None:
    result = explain_assessment(_assessment(70, "review"))
    assert result.headline_code == CODE_REVIEW_FOCUS
    assert result.posture_code == CODE_POSTURE_REVIEW
    assert "neutral" not in result.headline_code
    assert "bad" not in result.headline_code


def test_mixed_is_conflict_not_bad_day() -> None:
    result = explain_assessment(_assessment(70, "mixed"))
    assert result.headline_code == CODE_MIXED_CONFLICT
    assert "bad_day" not in result.headline_code


def test_insufficient_is_not_neutral() -> None:
    result = explain_assessment(_assessment(70, "insufficient"))
    assert result.headline_code == CODE_INSUFFICIENT
    dumped = " ".join(str(value) for value in result.model_dump().values())
    assert "neutral" not in dumped
    assert result.posture_code == "semantic.posture_insufficient"


def test_low_score_action() -> None:
    result = explain_assessment(_assessment(40, "action"))
    assert result.opportunity_code == CODE_OPPORTUNITY_WEAK
    assert result.posture_code == CODE_POSTURE_ACTION


def test_same_dimension_conflict_code() -> None:
    result = explain_assessment(
        _assessment(
            70,
            "mixed",
            conflicted=["cooperation"],
            dimensions={
                "cooperation": _dim(50, evidence=("e-coop",), conflicted=True)
            },
        )
    )
    assert CODE_SAME_DIMENSION_CONFLICT in result.caution_codes
    refs = [item for item in result.evidence_refs if item.role == "conflict"]
    assert refs[0].evidence_ids == ("e-coop",)


def test_dimension_support_and_caution_capped_and_scored_only() -> None:
    result = explain_assessment(
        _assessment(
            80,
            "action",
            dimensions={
                "opportunity": _dim(90, evidence=("e-opp",), strength=0.9),
                "clarity": _dim(85, evidence=("e-clear",), strength=0.8),
                "momentum": _dim(70, evidence=("e-mom",), strength=0.4),
                "stability": _dim(30, evidence=("e-stab",)),
                "reversibility_safety": _dim(20, evidence=("e-rev",)),
                "cooperation": _dim(50, status="insufficient"),
                "pressure": _dim(80, evidence=("e-press",)),
            },
        )
    )
    assert len(result.support_codes) == 2
    assert result.support_codes[0] == "semantic.high_opportunity"
    assert result.support_codes[1] == "semantic.high_clarity"
    assert len(result.caution_codes) == 2
    assert "semantic.high_pressure" in result.caution_codes
    assert "semantic.low_reversibility_safety" in result.caution_codes
    assert "semantic.high_cooperation" not in result.support_codes
    assert "semantic.low_cooperation" not in result.caution_codes
    by_code = {item.code: item for item in result.evidence_refs}
    assert by_code["semantic.high_opportunity"].evidence_ids == ("e-opp",)
    assert by_code["semantic.high_pressure"].evidence_ids == ("e-press",)


def test_missing_evidence_refs_do_not_invent_factors() -> None:
    result = explain_assessment(
        _assessment(
            70,
            "selective",
            dimensions={"clarity": _dim(20, evidence=())},
        )
    )
    assert CODE_LOW_CLARITY in result.caution_codes
    clarity = next(
        item for item in result.evidence_refs if item.code == CODE_LOW_CLARITY
    )
    assert clarity.evidence_ids == ()


def test_partial_dimensions_skip_insufficient() -> None:
    result = explain_assessment(
        _assessment(
            80,
            "action",
            dimensions={
                "opportunity": _dim(88, evidence=("e1",)),
                "stability": _dim(50, status="insufficient"),
            },
        )
    )
    assert result.support_codes == ("semantic.high_opportunity",)
    assert all(item.dimension_id != "stability" for item in result.evidence_refs)


def test_elevated_has_no_high_stakes_safety_codes() -> None:
    result = explain_assessment(
        _assessment(
            80,
            "action",
            context={"risk_level": "elevated", "risk_domains": ["employment"]},
        )
    )
    assert result.localization_args["risk_level"] == "elevated"
    assert CODE_HIGH_STAKES_REVIEW not in result.safety_codes
    assert CODE_NO_OUTCOME_PREDICTION not in result.safety_codes


def test_explicit_high_stakes_safety_codes() -> None:
    result = explain_assessment(
        _assessment(
            81,
            "selective",
            context={
                "risk_level": "high_stakes",
                "outcome_prediction_prohibited": True,
            },
        )
    )
    assert result.headline_code == CODE_STRONG_SELECTIVE
    assert CODE_HIGH_STAKES_REVIEW in result.safety_codes
    assert CODE_NO_OUTCOME_PREDICTION in result.safety_codes


def test_deadline_priority_code() -> None:
    result = explain_assessment(
        _assessment(
            70,
            "action",
            context={
                "risk_level": "high_stakes",
                "factual_deadline_priority": True,
                "outcome_prediction_prohibited": True,
            },
        )
    )
    assert CODE_DEADLINE_PRIORITY in result.safety_codes
    assert CODE_NO_OUTCOME_PREDICTION in result.safety_codes


def test_high_stakes_codes_only_from_explicit_metadata() -> None:
    bare = explain_assessment(_assessment(80, "action"))
    assert bare.safety_codes == ()
    named = explain_assessment(
        _assessment(
            80,
            "action",
            context={"decision_type_id": "legal-visa-immigration"},
        )
    )
    assert named.safety_codes == ()


def test_compare_score_vs_posture_tradeoff() -> None:
    left = {"id": "a", "score": 81, "dimension_class": "selective"}
    right = {"id": "b", "score": 70, "dimension_class": "action"}
    policy = compare_pair_policy(left, right, left_id="a", right_id="b")
    expl = explain_compare_pair(left, right, policy.model_dump(mode="json"))
    assert expl.headline_code == CODE_MATERIAL_TRADEOFF
    assert expl.opportunity_code == CODE_HIGHER_SCORE_OPPORTUNITY
    assert expl.posture_code == CODE_LOWER_SCORE_CLEANER
    assert expl.tradeoff_code == CODE_NO_DEFINITIVE_BETTER
    assert expl.localization_args["requires_user_tradeoff"] is True


def test_compare_near_tie_cleaner_posture() -> None:
    left = {"id": "a", "score": 71, "dimension_class": "selective"}
    right = {"id": "b", "score": 70, "dimension_class": "action"}
    policy = compare_pair_policy(left, right, left_id="a", right_id="b")
    expl = explain_compare_pair(left, right, policy.model_dump(mode="json"))
    assert expl.headline_code == CODE_NEAR_TIE_CLEANER
    assert expl.opportunity_code == CODE_NEAR_TIE_OPPORTUNITY
    assert expl.posture_code == CODE_CLEANER_POSTURE
    assert expl.tradeoff_code is None


def test_compare_equal_score_posture_differs() -> None:
    left = {"id": "a", "score": 70, "dimension_class": "action"}
    right = {"id": "b", "score": 70, "dimension_class": "selective"}
    policy = compare_pair_policy(left, right, left_id="a", right_id="b")
    expl = explain_compare_pair(left, right, policy.model_dump(mode="json"))
    assert expl.opportunity_code in {CODE_EQUAL_OPPORTUNITY, CODE_NEAR_TIE_OPPORTUNITY}
    assert expl.posture_code == CODE_CLEANER_POSTURE
    assert "winner" not in expl.headline_code


def test_compare_legacy_winner_unchanged() -> None:
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
    assert ranked.explanations
    assert ranked.explanations[0]["headline_code"] == CODE_MATERIAL_TRADEOFF


def test_find_window_explanations_do_not_regroup() -> None:
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
            day=date(2026, 9, 4),
            score=75,
            band="high",
            assessment={"dimension_classification": {"day_class": "action"}},
        ),
    ]
    grouped = group_contiguous_windows(days)
    result = build_find_windows(days)
    assert {w.window_id for w in grouped} == {w.window_id for w in result.windows}
    kinds = {
        item["localization_args"]["find_window_kind"]
        for item in result.window_explanations
    }
    assert "mixed_posture_window" in kinds
    mixed = next(
        item
        for item in result.window_explanations
        if item["headline_code"] == CODE_WINDOW_MIXED
    )
    assert mixed["summary_code"] == CODE_WINDOW_MIXED_SUMMARY
    assert (
        explain_find_window({"find_window_kind": "clean_forward_window"}).headline_code
        == CODE_WINDOW_CLEAN
    )
    assert (
        explain_find_window({"find_window_kind": "restrictive_window"}).headline_code
        == CODE_WINDOW_RESTRICTIVE
    )


def test_deterministic() -> None:
    payload = _assessment(81, "selective")
    assert explain_assessment(payload) == explain_assessment(payload)


def test_policy_corpus_explanations_are_deterministic() -> None:
    for case in POLICY_CORPUS:
        policy = compare_pair_policy(
            case.left, case.right, left_id=case.left["id"], right_id=case.right["id"]
        )
        first = explain_compare_pair(case.left, case.right, policy.model_dump())
        second = explain_compare_pair(case.left, case.right, policy.model_dump())
        assert first == second
        assert "command" not in first.model_dump()
        if case.expected_relation == "material_tradeoff":
            assert first.headline_code == CODE_MATERIAL_TRADEOFF
            assert first.tradeoff_code == CODE_NO_DEFINITIVE_BETTER


def test_score_and_class_unchanged_when_explaining_real_assessment() -> None:
    golden, result, context = _score_golden()
    original = result["executive"]["score"]
    assessment = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
    )
    payload = decision_assessment_payload(assessment)
    expl = explain_assessment(payload)
    assert assessment.score == original
    assert payload["dimension_classification"]["day_class"] == (
        assessment.dimension_class
    )
    assert expl.schema_version == "semantic_explanation.v1-shadow"
    assert "command" not in expl.model_dump()
    assert expl.localization_args["locales"] == ["en", "fa", "ar", "ru"]


def test_evaluate_policy_interpretation_feeds_headline() -> None:
    policy = evaluate_policy(score=80, posture="action")
    expl = explain_assessment(
        _assessment(80, "action"),
        policy=policy.model_dump(mode="json"),
    )
    assert policy.evaluate_interpretation == "strong_and_clean"
    assert expl.headline_code == CODE_STRONG_CLEAN
