"""Phase 3B — shared DecisionAssessment contract."""

from __future__ import annotations

from datetime import date, timedelta

from packages.astro_engine.scoring import calculate_activity_score
from packages.astro_engine.scoring_context import (
    CONTEXT_ASK_ELECTIONAL,
    CONTEXT_CALENDAR_DAY,
)
from packages.decision_engine.compare_dates import (
    ScoredCompareOption,
    rank_compare_options,
)
from packages.decision_engine.day_intelligence_models import (
    attach_calendar_day_intelligence,
    build_day_intelligence_snapshot,
    day_intelligence_payload,
)
from packages.decision_engine.decision_assessment import (
    ASSESSMENT_SCHEMA_VERSION,
    SEMANTIC_STATUS,
    assessment_from_request,
    build_decision_assessment,
    decision_assessment_payload,
    find_window_semantic_warnings,
    score_class_disagreements,
)
from packages.decision_engine.evaluate.car_interview_compare import (
    compare_car_interview,
)
from packages.decision_engine.evaluate.car_interview_evaluate import (
    evaluate_car_interview,
)
from packages.decision_engine.evaluate.car_interview_find import find_car_interview
from packages.decision_engine.find_windows import (
    ScoredFindDay,
    build_find_windows,
    group_contiguous_windows,
)
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    DecisionRequest,
    Explanation,
    Recommendation,
)
from packages.decision_engine.package_models import DecisionEvaluationPackage
from packages.decision_engine.tests.unit.test_calendar_score_goldens import (
    _context_from_golden,
    _load_goldens,
)
from packages.decision_engine.tests.unit.test_car_interview_compare_runtime import (
    CASE_ID as COMPARE_CASE_ID,
    _compare_intake,
    _outcome as _compare_outcome,
)
from packages.decision_engine.tests.unit.test_car_interview_evaluate_runtime import (
    CASE_ID as EVAL_CASE_ID,
    TARGET,
    _intake as _evaluate_intake,
    _outcome as _evaluate_outcome,
)
from packages.decision_engine.tests.unit.test_car_interview_find_runtime import (
    CASE_ID as FIND_CASE_ID,
    END,
    START,
    _find_intake,
    _outcome as _find_outcome,
)


GOLDEN_ID = "action_type_business_launch"


def _score_golden(golden_id: str = GOLDEN_ID):
    golden = _load_goldens()[golden_id]
    context = _context_from_golden(golden["input"]["scoring_context"])
    result = calculate_activity_score(
        golden["input"]["natal"],
        golden["input"]["transit"],
        golden["input"]["action_type"],
        scoring_context=context,
    )
    return golden, result, context


def test_a_calendar_and_evaluate_share_builder_for_same_date_context() -> None:
    golden, result, context = _score_golden()
    calendar_snapshot = build_day_intelligence_snapshot(
        result,
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        activity_type=golden["input"]["action_type"],
        scoring_context=context,
    )
    calendar = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        module_origin="calendar",
    )
    evaluate = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        module_origin="ask",
        decision_type_id="bus-product-launch",
        family_id="timing_opt",
    )
    assert calendar.snapshot.final_score == calendar_snapshot.final_score
    assert calendar.score == evaluate.score
    assert calendar.phase2a_class == evaluate.phase2a_class
    assert calendar.dimension_class == evaluate.dimension_class
    assert (
        calendar.snapshot.dimension_classification.classifier_version
        == evaluate.snapshot.dimension_classification.classifier_version
    )
    cal_payload = decision_assessment_payload(calendar)
    eval_payload = decision_assessment_payload(evaluate)
    assert cal_payload["day_intelligence"] == eval_payload["day_intelligence"]
    assert cal_payload["dimensions"] == eval_payload["dimensions"]
    assert cal_payload["day_intelligence"] == day_intelligence_payload(calendar_snapshot)


def test_calendar_attach_uses_shared_builder() -> None:
    golden, result, context = _score_golden()
    attached = attach_calendar_day_intelligence(
        result,
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        activity_type=golden["input"]["action_type"],
        scoring_context=context,
        evaluation_date="2026-06-15",
    )
    assessment = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        module_origin="calendar",
    )
    core = decision_assessment_payload(assessment)["day_intelligence"]
    attached_di = dict(attached["day_intelligence"])
    sidecar = {
        "explanation": attached_di.pop("explanation"),
        "policy": attached_di.pop("policy"),
    }
    assert attached_di == core
    assert sidecar["explanation"]["headline_code"].startswith("semantic.")
    assert "command" not in sidecar["explanation"]
    assert sidecar["policy"]["evaluate_interpretation"]
    assert attached["executive"]["score"] == result["executive"]["score"]


def test_b_c_compare_candidates_carry_assessments_ranking_unchanged() -> None:
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
    assert pkg.timing.candidates[1].score == 55.0
    assert pkg.semantic_shadow is not None
    assert len(pkg.semantic_shadow.assessments) == 2
    ids = {item.get("option_id") for item in pkg.semantic_shadow.assessments}
    assert ids == {"opt-1", "opt-2"}
    dumped = pkg.model_dump(mode="json")
    DecisionEvaluationPackage.model_validate(dumped)


def test_compare_score_vs_class_disagreement_is_not_hidden() -> None:
    high_score_selective = {
        "dimension_classification": {"day_class": "selective"}
    }
    lower_score_action = {
        "dimension_classification": {"day_class": "action"}
    }
    ranked = rank_compare_options(
        [
            ScoredCompareOption(
                "a", "A", "2026-09-10", 81.0, "high", assessment=high_score_selective
            ),
            ScoredCompareOption(
                "b", "B", "2026-09-12", 70.0, "high", assessment=lower_score_action
            ),
        ]
    )
    assert ranked.ranked[0].option_id == "a"
    assert ranked.unique_winner is True
    assert ranked.score_vs_class_disagreements
    assert ranked.score_vs_class_disagreements[0]["higher_class"] == "selective"
    assert ranked.score_vs_class_disagreements[0]["lower_class"] == "action"


def test_d_e_find_days_carry_assessments_eligibility_unchanged() -> None:
    scores = {
        (START + timedelta(days=offset)).isoformat(): (
            80.0 if offset in {3, 4} else 40.0
        )
        for offset in range((END - START).days + 1)
    }

    def generate(request):
        score = scores[request.target_date]
        rating = "Favorable" if score >= 65 else "Challenging"
        return _find_outcome(score, rating=rating)

    pkg = find_car_interview(
        case_id=FIND_CASE_ID,
        case_version=1,
        intake=_find_intake(),
        generate_outcome=generate,
    )
    assert pkg.find is not None
    assert pkg.find.unique_dominant is True
    assert pkg.find.windows[0].peak_score == 80.0
    assert pkg.semantic_shadow is not None
    assert len(pkg.semantic_shadow.assessments) == (END - START).days + 1
    for item in pkg.semantic_shadow.assessments:
        assert item["schema_version"] == ASSESSMENT_SCHEMA_VERSION
        assert "day_intelligence" not in item


def test_find_window_warning_for_eligible_restrictive_class() -> None:
    days = [
        ScoredFindDay(
            day=date(2026, 9, 1),
            score=72,
            band="high",
            assessment={"dimension_classification": {"day_class": "selective"}},
        ),
        ScoredFindDay(
            day=date(2026, 9, 2),
            score=40,
            band="low",
            assessment={"dimension_classification": {"day_class": "defensive"}},
        ),
        ScoredFindDay(
            day=date(2026, 9, 3),
            score=70,
            band="high",
            assessment={"dimension_classification": {"day_class": "action"}},
        ),
    ]
    windows = group_contiguous_windows(days)
    warnings = find_window_semantic_warnings(days, windows)
    kinds = {item["kind"] for item in warnings}
    assert "eligible_score_restrictive_class" in kinds
    assert windows[0].start_date == date(2026, 9, 1)


def test_f_action_type_changes_assessment() -> None:
    launch = _score_golden("action_type_business_launch")
    rest = _score_golden("action_type_rest_recovery")
    a = build_decision_assessment(
        launch[1],
        scoring_context=launch[2],
        action_type="business_launch",
        evaluation_date="2026-06-15",
        natal=launch[0]["input"]["natal"],
        transit=launch[0]["input"]["transit"],
    )
    b = build_decision_assessment(
        rest[1],
        scoring_context=rest[2],
        action_type="rest_recovery",
        evaluation_date="2026-06-15",
        natal=rest[0]["input"]["natal"],
        transit=rest[0]["input"]["transit"],
    )
    assert a.context.action_type != b.context.action_type
    assert (a.score, a.dimension_class, a.phase2a_class) != (
        b.score,
        b.dimension_class,
        b.phase2a_class,
    ) or a.snapshot.dimensions != b.snapshot.dimensions


def test_g_h_i_j_score_phase2a_v3_status_no_command() -> None:
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
    assert assessment.score == original
    assert result["executive"]["score"] == original
    assert payload["phase2a_class"] == assessment.snapshot.classification.day_class
    assert (
        payload["dimension_classification"]["classifier_version"]
        == "dimension_class.v3-shadow"
    )
    assert payload["semantic_status"] == SEMANTIC_STATUS
    assert payload["dimension_classification"]["semantic_status"] == (
        "experimental_shadow"
    )
    assert "command" not in payload
    assert "command" not in payload["day_intelligence"]
    assert "command" not in payload["dimensions"]
    assert "command" not in payload["dimension_classification"]


def test_k_l_insufficient_not_neutral_coverage_not_confidence() -> None:
    golden, result, context = _score_golden("loose_aspect")
    assessment = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
    )
    payload = decision_assessment_payload(assessment)
    coverage = payload["coverage"]
    assert coverage["classification_coverage_is_not_confidence"] is True
    assert coverage["evidence_strength_is_not_confidence"] is True
    assert coverage["insufficient_is_not_neutral"] is True
    assert 0.0 <= coverage["classification_coverage"] <= 1.0
    for key, dim in payload["dimensions"].items():
        if key in {"mapping_version", "semantic_status"}:
            continue
        if isinstance(dim, dict) and dim.get("status") == "insufficient":
            assert dim.get("status") != "neutral"


def test_evaluate_runtime_attaches_shadow_without_replacing_timing() -> None:
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
        generate_outcome=lambda _req: _evaluate_outcome(70),
    )
    assert pkg.timing.score == 70.0
    assert pkg.semantic_shadow is not None
    item = pkg.semantic_shadow.assessments[0]
    assert item["score"] == 70
    assert item["semantic_status"] == "experimental_shadow"
    assert item["dimension_classification"]["classifier_version"] == (
        "dimension_class.v3-shadow"
    )
    assert pkg.recommendation.stance != "insufficient_data"
    assert pkg.semantic_shadow.policy is not None
    assert "command" not in pkg.semantic_shadow.policy
    assert pkg.semantic_shadow.policy.get("evaluate_interpretation")


def test_context_must_be_explicit() -> None:
    golden, result, _context = _score_golden()
    try:
        build_decision_assessment(
            result,
            scoring_context=None,  # type: ignore[arg-type]
            action_type="business_launch",
            evaluation_date="2026-06-15",
        )
        raised = False
    except TypeError:
        raised = True
    assert raised


def test_assessment_from_request_uses_case_context_not_calendar() -> None:
    golden, result, _calendar_context = _score_golden()
    request = DecisionRequest(
        module_origin="ask",
        decision_intent="product-launch",
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan",
        target_date="2026-06-15",
        action_type="business_launch",
        context=CONTEXT_ASK_ELECTIONAL,
    )
    outcome = DecisionOutcome(
        recommendation=Recommendation(
            score=int(result["executive"]["score"]),
            rating=str(result["executive"].get("rating") or "Mixed"),
            activity="Business Launch",
            summary="x",
            text="x",
        ),
        explanation=Explanation(summary="x", recommendation_text="x"),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="product-launch",
            action_type="business_launch",
        ),
        source_activity_response=result,
        source_natal=golden["input"]["natal"],
        source_transit=golden["input"]["transit"],
        confidence=Confidence(value=0.5, rating="Mixed"),
    )
    assessment = assessment_from_request(outcome, request)
    assert assessment is not None
    assert assessment.context.location_mode == CONTEXT_ASK_ELECTIONAL.location_mode
    assert assessment.context.location_mode != CONTEXT_CALENDAR_DAY.location_mode
    assert assessment.context.action_type == "business_launch"


def test_score_class_disagreements_helper() -> None:
    found = score_class_disagreements(
        [
            {"id": "a", "score": 88, "dimension_class": "selective"},
            {"id": "b", "score": 70, "dimension_class": "high_leverage"},
        ]
    )
    assert found[0]["kind"] == "score_vs_class"
    empty = score_class_disagreements(
        [
            {"id": "a", "score": 88, "dimension_class": "action"},
            {"id": "b", "score": 70, "dimension_class": "review"},
        ]
    )
    assert empty == ()
