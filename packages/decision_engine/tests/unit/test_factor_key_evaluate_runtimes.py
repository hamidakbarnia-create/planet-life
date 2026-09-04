"""Every evaluate runtime preserves factor_key without score drift.

One test per shipped evaluate runtime. New runtimes add a case here; the file
is not structured around a fixed runtime count.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from packages.decision_engine.evaluate.car_interview_evaluate import (
    REAL_ENGINE_ID as CAR_ENGINE,
    evaluate_car_interview,
)
from packages.decision_engine.evaluate.investor_meeting_evaluate import (
    REAL_ENGINE_ID as INV_ENGINE,
    evaluate_investor_meeting,
)
from packages.decision_engine.evaluate.offer_negotiation_evaluate import (
    REAL_ENGINE_ID as OFFER_ENGINE,
    evaluate_offer_negotiation,
)
from packages.decision_engine.evaluate.product_launch_evaluate import (
    REAL_ENGINE_ID as LAUNCH_ENGINE,
    evaluate_product_launch,
)
from packages.decision_engine.evaluate.wedding_date_evaluate import (
    REAL_ENGINE_ID as WEDDING_ENGINE,
    evaluate_wedding_date,
)
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)
from packages.decision_engine.package_models import DecisionEvaluationPackage


CASE_ID = UUID("11111111-1111-4111-8111-111111111111")
EVAL_ID = UUID("22222222-2222-4222-8222-222222222222")
CREATED = datetime(2026, 8, 10, 12, 0, tzinfo=timezone.utc)
TARGET = "2026-08-18"

STRUCTURED_REFS = [
    EvidenceReference(
        title="Transit Mercury square natal Saturn",
        detail="Communication pressure.",
        importance="high",
        score=-3.5,
        category="aspect",
        evidence={
            "transit_planet": "mercury",
            "natal_planet": "saturn",
            "aspect": "square",
            "orb": 1.1,
        },
    ),
    EvidenceReference(
        title="Natal Mercury in 10th house",
        detail="Career house support.",
        importance="medium",
        score=1.5,
        category="house",
        evidence={"scope": "natal", "planet": "mercury", "house": 10},
    ),
    EvidenceReference(
        title="Jupiter near MC",
        detail="Visibility highlight.",
        importance="high",
        score=3.5,
        category="angular",
        evidence={"planet": "jupiter", "angle": "mc", "orb_band": "tight"},
    ),
]


def _outcome(
    *,
    score: int,
    activity: str,
    decision_intent: str,
    action_type: str,
) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating="Favorable",
            activity=activity,
            summary="Supportive timing window.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.61, rating="Favorable"),
        evidence_references=list(STRUCTURED_REFS),
        explanation=Explanation(
            summary="Timing supports the selected date.",
            recommendation_text="Good conditions.",
            reasons=[],
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent=decision_intent,
            action_type=action_type,
        ),
        source_activity_response={"executive": {"score": score}},
    )


def _assert_factor_key_package(
    package: DecisionEvaluationPackage,
    *,
    decision_type_id: str,
    engine_id: str,
    score: float,
) -> None:
    assert package.decision_type_id == decision_type_id
    assert package.engine_id == engine_id
    assert package.timing.score == score
    assert package.timing.candidates[0].score == score
    assert package.recommendation.stance != "insufficient_data"
    contributions = [d.contribution for d in package.drivers.items]
    assert contributions == [-3.5, 1.5, 3.5]
    keys = [d.factor_key for d in package.drivers.items]
    assert keys == [
        "aspect.mercury.square.saturn",
        "house.natal.mercury.10",
        "angular.jupiter.mc",
    ]
    dumped = package.model_dump(mode="json")
    again = DecisionEvaluationPackage.model_validate(dumped)
    assert [d.factor_key for d in again.drivers.items] == keys
    assert again.timing.score == score


def test_car_interview_factor_keys() -> None:
    package = evaluate_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "role": "Engineer",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
            "natal_evidence": {
                "birth_date": "1982-02-25",
                "birth_time": "05:47",
                "location": "Tehran",
            },
        },
        generate_outcome=lambda _req: _outcome(
            score=70,
            activity="negotiation",
            decision_intent="car-interview-evaluate-date",
            action_type="job_interview",
        ),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    _assert_factor_key_package(
        package,
        decision_type_id="car-interview",
        engine_id=CAR_ENGINE,
        score=70.0,
    )


def test_investor_meeting_factor_keys() -> None:
    package = evaluate_investor_meeting(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "meeting_goal": "Pitch seed round",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
            "natal_evidence": {
                "birth_date": "1982-02-25",
                "birth_time": "05:47",
                "location": "Tehran",
            },
        },
        generate_outcome=lambda _req: _outcome(
            score=74,
            activity="investor_meeting",
            decision_intent="investor-meeting-evaluate-date",
            action_type="investor_meeting",
        ),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    _assert_factor_key_package(
        package,
        decision_type_id="bus-investor-meeting",
        engine_id=INV_ENGINE,
        score=74.0,
    )


def test_product_launch_factor_keys() -> None:
    package = evaluate_product_launch(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "launch_object": "SaaS launch",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
            "natal_evidence": {
                "birth_date": "1990-01-01",
                "birth_time": "12:00",
                "location": "Paris",
                "latitude": 48.8566,
                "longitude": 2.3522,
            },
        },
        generate_outcome=lambda _req: _outcome(
            score=72,
            activity="Business Launch",
            decision_intent="product-launch-evaluate-date",
            action_type="business_launch",
        ),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    _assert_factor_key_package(
        package,
        decision_type_id="bus-product-launch",
        engine_id=LAUNCH_ENGINE,
        score=72.0,
    )


def test_wedding_date_factor_keys() -> None:
    package = evaluate_wedding_date(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "ceremony_type": "civil",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
            "natal_evidence": {
                "birth_date": "1990-01-01",
                "birth_time": "12:00",
                "location": "Paris",
                "latitude": 48.8566,
                "longitude": 2.3522,
            },
        },
        generate_outcome=lambda _req: _outcome(
            score=68,
            activity="Wedding Date",
            decision_intent="wedding-date-evaluate-date",
            action_type="wedding_date",
        ),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    _assert_factor_key_package(
        package,
        decision_type_id="mar-wedding-date",
        engine_id=WEDDING_ENGINE,
        score=68.0,
    )


def test_offer_negotiation_factor_keys() -> None:
    package = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "negotiation_goal": "salary",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
            "natal_evidence": {
                "birth_date": "1982-02-25",
                "birth_time": "05:47",
                "location": "Tehran",
            },
        },
        generate_outcome=lambda _req: _outcome(
            score=66,
            activity="negotiation",
            decision_intent="offer-negotiation-evaluate-date",
            action_type="offer_negotiation",
        ),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    _assert_factor_key_package(
        package,
        decision_type_id="car-offer-negotiation",
        engine_id=OFFER_ENGINE,
        score=66.0,
    )


def test_insufficient_data_does_not_gain_fake_factors() -> None:
    package = evaluate_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "role": "Engineer",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
        },
        generate_outcome=lambda _req: (_ for _ in ()).throw(AssertionError("no score")),
    )
    assert package.recommendation.stance == "insufficient_data"
    assert package.timing.material is False
    assert package.drivers.items == () or all(
        d.factor_key is None for d in package.drivers.items
    )
