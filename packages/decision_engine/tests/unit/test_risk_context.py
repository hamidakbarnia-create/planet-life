"""Phase 3D — decision risk context and high-stakes registry contract."""

from __future__ import annotations

import inspect
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
from packages.decision_engine.registry.loader import _load_registry
from packages.decision_engine.registry.risk import resolve_risk_context
from packages.decision_engine.registry.schema import (
    DecisionTypeRecord,
    RiskContext,
    documented_default_risk_context,
    risk_context_from_mapping,
    risk_context_from_record,
)
from packages.decision_engine.semantic_policy import (
    compare_pair_policy,
    evaluate_policy,
)
from packages.decision_engine.tests.unit.test_decision_assessment import (
    _score_golden,
)
from packages.decision_engine.tests.unit.test_registry_validation import (
    _canonical_payload,
    _write,
)

OUTCOME_PREDICTION_KEYS = frozenset(
    {
        "outcome_prediction",
        "predicted_outcome",
        "visa_success",
        "approval",
        "diagnosis",
        "profit",
        "legal_entitlement",
    }
)


def _base_record_payload(**overrides):
    payload = {
        "decision_type_id": "car-interview",
        "family_id": "visibility",
        "label": "Attend job interview",
        "create_mode": "none",
        "available_entry_modes": ["structured"],
        "allowed_modes": ["evaluate_date", "compare_dates", "find_dates"],
        "output_profile": "decision_evaluation_package.v1",
    }
    payload.update(overrides)
    return payload


def test_a_explicit_standard_risk_context() -> None:
    resolved = resolve_risk_context(
        risk_context={
            "level": "standard",
            "domains": [],
            "outcome_prediction_prohibited": False,
            "factual_deadline_priority": False,
        }
    )
    assert resolved.level == "standard"
    assert resolved.domains == ()
    assert resolved.resolution == "explicit"
    policy = evaluate_policy(
        score=80,
        posture="action",
        assessment={
            "context": {
                "risk_level": "standard",
                "outcome_prediction_prohibited": False,
            }
        },
    )
    assert "high_stakes_review_required" not in policy.rationale_codes
    assert policy.evaluate_interpretation == "strong_and_clean"


def test_b_explicit_elevated_risk_context() -> None:
    resolved = resolve_risk_context(
        risk_context={
            "level": "elevated",
            "domains": ["employment"],
            "outcome_prediction_prohibited": False,
            "factual_deadline_priority": False,
        }
    )
    assert resolved.level == "elevated"
    assert resolved.domains == ("employment",)
    policy = evaluate_policy(
        score=80,
        posture="action",
        assessment={
            "context": {
                "risk_level": "elevated",
                "risk_domains": ["employment"],
            }
        },
    )
    assert policy.risk_level == "elevated"
    assert "high_stakes_review_required" not in policy.rationale_codes
    assert policy.evaluate_interpretation == "strong_and_clean"


def test_c_explicit_high_stakes_risk_context() -> None:
    parsed = RiskContext.model_validate(
        {
            "level": "high_stakes",
            "domains": ["legal"],
            "outcome_prediction_prohibited": False,
            "factual_deadline_priority": True,
        }
    )
    assert parsed.outcome_prediction_prohibited is True
    policy = evaluate_policy(
        score=80,
        posture="selective",
        assessment={
            "context": {
                "risk_level": "high_stakes",
                "risk_domains": ["legal"],
                "outcome_prediction_prohibited": True,
                "factual_deadline_priority": True,
            }
        },
    )
    assert policy.evaluate_interpretation == "strong_but_selective"
    assert "high_stakes_review_required" in policy.rationale_codes
    assert "no_outcome_prediction" in policy.rationale_codes
    assert "factual_deadline_priority" in policy.rationale_codes
    assert policy.outcome_prediction_prohibited is True
    assert policy.factual_deadline_priority is True


def test_d_legacy_registry_entry_without_field_gets_default(tmp_path) -> None:
    payload = _canonical_payload()
    for row in payload["decision_types"]:
        row.pop("risk_context", None)
    records = _load_registry(_write(tmp_path, payload))
    interview = records["car-interview"]
    assert "risk_context" not in interview.model_fields_set
    resolved = risk_context_from_record(interview)
    default = documented_default_risk_context()
    assert resolved.level == default.level == "standard"
    assert resolved.domains == ()
    assert resolved.outcome_prediction_prohibited is False
    assert resolved.factual_deadline_priority is False
    assert resolved.resolution == "documented_default"


def test_e_high_stakes_propagates_into_decision_assessment() -> None:
    golden, result, context = _score_golden()
    original = result["executive"]["score"]
    assessment = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        decision_type_id="car-interview",
        risk_context={
            "level": "high_stakes",
            "domains": ["immigration"],
            "outcome_prediction_prohibited": True,
            "factual_deadline_priority": True,
        },
    )
    assert assessment.context.risk_level == "high_stakes"
    assert assessment.context.risk_domains == ("immigration",)
    assert assessment.context.outcome_prediction_prohibited is True
    assert assessment.context.factual_deadline_priority is True
    assert assessment.context.risk_resolution == "explicit"
    assert assessment.score == original
    payload = decision_assessment_payload(assessment)
    assert payload["context"]["risk_level"] == "high_stakes"
    assert payload["score"] == original


def test_f_high_stakes_policy_reason_codes() -> None:
    result = evaluate_policy(
        score=70,
        posture="action",
        assessment={
            "context": {
                "risk_level": "high_stakes",
                "outcome_prediction_prohibited": True,
            }
        },
    )
    assert "high_stakes_review_required" in result.rationale_codes
    assert "no_outcome_prediction" in result.rationale_codes


def test_g_h_score_and_v3_class_unchanged() -> None:
    golden, result, context = _score_golden()
    original_score = result["executive"]["score"]
    plain = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
    )
    flagged = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        risk_context={
            "level": "high_stakes",
            "domains": ["legal"],
            "outcome_prediction_prohibited": True,
            "factual_deadline_priority": False,
        },
    )
    assert plain.score == flagged.score == original_score
    assert plain.dimension_class == flagged.dimension_class
    assert (
        flagged.snapshot.dimension_classification.classifier_version
        == "dimension_class.v3-shadow"
    )


def test_i_compare_legacy_winner_unchanged() -> None:
    high_stakes_ctx = {
        "dimension_classification": {"day_class": "selective"},
        "context": {"risk_level": "high_stakes", "outcome_prediction_prohibited": True},
    }
    ranked = rank_compare_options(
        [
            ScoredCompareOption(
                "a", "A", "2026-09-10", 81.0, "high", assessment=high_stakes_ctx
            ),
            ScoredCompareOption(
                "b",
                "B",
                "2026-09-12",
                70.0,
                "high",
                assessment={
                    "dimension_classification": {"day_class": "action"},
                    "context": {"risk_level": "high_stakes"},
                },
            ),
        ]
    )
    assert ranked.ranked[0].option_id == "a"
    assert ranked.ranked[0].score == 81.0
    assert ranked.policy_pairs[0]["relation"] == "material_tradeoff"
    assert "high_stakes_review_required" in ranked.policy_pairs[0]["rationale_codes"]


def test_j_find_membership_and_ranking_unchanged() -> None:
    days = [
        ScoredFindDay(
            day=date(2026, 9, 1),
            score=72,
            band="high",
            assessment={
                "dimension_classification": {"day_class": "action"},
                "context": {"risk_level": "high_stakes"},
            },
        ),
        ScoredFindDay(
            day=date(2026, 9, 2),
            score=70,
            band="high",
            assessment={
                "dimension_classification": {"day_class": "selective"},
                "context": {"risk_level": "high_stakes"},
            },
        ),
        ScoredFindDay(
            day=date(2026, 9, 4),
            score=75,
            band="high",
            assessment={
                "dimension_classification": {"day_class": "action"},
                "context": {"risk_level": "high_stakes"},
            },
        ),
    ]
    grouped = group_contiguous_windows(days)
    result = build_find_windows(days)
    assert {w.window_id for w in grouped} == {w.window_id for w in result.windows}
    assert result.windows[0].start_date == date(2026, 9, 4)
    assert result.windows[0].peak_score == 75


def test_k_no_outcome_prediction_field() -> None:
    result = evaluate_policy(
        score=80,
        posture="action",
        assessment={
            "context": {
                "risk_level": "high_stakes",
                "outcome_prediction_prohibited": True,
            }
        },
    )
    dumped = result.model_dump()
    assert "command" not in dumped
    assert OUTCOME_PREDICTION_KEYS.isdisjoint(dumped)
    assert dumped["outcome_prediction_prohibited"] is True


def test_l_visa_in_id_is_not_automatically_high_stakes() -> None:
    unknown = resolve_risk_context(
        decision_type_id="legal-visa-immigration-medical-investment"
    )
    assert unknown.level == "standard"
    assert unknown.resolution == "unresolved"
    assert unknown.outcome_prediction_prohibited is False

    named = risk_context_from_mapping(
        {
            "decision_type_id": "legal-visa-immigration-medical",
            "label": "Visa medical investment legal",
        }
    )
    assert named.level == "standard"
    assert named.resolution == "documented_default"

    record = DecisionTypeRecord.model_validate(_base_record_payload())
    resolved = risk_context_from_record(record)
    assert resolved.level == "standard"
    assert resolved.resolution == "documented_default"


def test_l_resolver_source_has_no_name_heuristic() -> None:
    for fn in (
        risk_context_from_mapping,
        risk_context_from_record,
        resolve_risk_context,
    ):
        src = inspect.getsource(fn).lower()
        for needle in ("visa", "immigration", "medical", "investment"):
            assert needle not in src, f"{fn.__name__} must not inspect {needle}"


def test_canonical_types_use_explicit_reviewed_risk_context() -> None:
    car = resolve_risk_context(decision_type_id="car-interview")
    assert car.level == "elevated"
    assert car.domains == ("employment",)
    assert car.resolution == "registry"

    wedding = resolve_risk_context(decision_type_id="mar-wedding-date")
    assert wedding.level == "elevated"
    assert wedding.domains == ("relationship",)

    compare = resolve_risk_context(decision_type_id="tim-compare-three")
    assert compare.level == "standard"
    assert compare.domains == ()

    launch = resolve_risk_context(decision_type_id="bus-product-launch")
    assert launch.level == "standard"

    investor = resolve_risk_context(decision_type_id="bus-investor-meeting")
    assert investor.level == "elevated"
    assert investor.domains == ("employment",)
    assert "financial" not in investor.domains


def test_calendar_unresolved_is_not_high_stakes() -> None:
    golden, result, context = _score_golden()
    assessment = build_decision_assessment(
        result,
        scoring_context=context,
        action_type=golden["input"]["action_type"],
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        module_origin="calendar",
    )
    assert assessment.context.decision_type_id is None
    assert assessment.context.risk_level == "standard"
    assert assessment.context.risk_resolution == "unresolved"
    assert assessment.context.outcome_prediction_prohibited is False
    policy = evaluate_policy(
        score=assessment.score,
        posture=assessment.dimension_class,
        assessment=decision_assessment_payload(assessment),
    )
    assert "high_stakes_review_required" not in policy.rationale_codes


def test_car_interview_runtime_propagates_registry_risk() -> None:
    golden, result, context = _score_golden()
    assessment = build_decision_assessment(
        result,
        scoring_context=context,
        action_type="job_interview",
        evaluation_date="2026-06-15",
        natal=golden["input"]["natal"],
        transit=golden["input"]["transit"],
        decision_type_id="car-interview",
        family_id="visibility",
    )
    assert assessment.context.risk_level == "elevated"
    assert assessment.context.risk_domains == ("employment",)
    assert assessment.context.risk_resolution == "registry"
    policy = evaluate_policy(
        score=assessment.score,
        posture=assessment.dimension_class,
        assessment=decision_assessment_payload(assessment),
    )
    assert policy.risk_level == "elevated"
    assert "high_stakes_review_required" not in policy.rationale_codes


def test_compare_pair_does_not_change_winner_for_high_stakes() -> None:
    result = compare_pair_policy(
        {
            "id": "a",
            "score": 81,
            "dimension_class": "selective",
            "assessment": {
                "context": {"risk_level": "high_stakes"},
                "dimension_classification": {"day_class": "selective"},
            },
        },
        {
            "id": "b",
            "score": 70,
            "dimension_class": "action",
            "assessment": {
                "context": {"risk_level": "high_stakes"},
                "dimension_classification": {"day_class": "action"},
            },
        },
        left_id="a",
        right_id="b",
    )
    assert result.relation == "material_tradeoff"
    assert result.score_preference == "a"
    assert result.posture_preference == "b"
    assert "high_stakes_review_required" in result.rationale_codes
