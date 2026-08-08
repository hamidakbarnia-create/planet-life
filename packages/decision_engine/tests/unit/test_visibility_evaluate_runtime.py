"""Visibility Family EVALUATE — shared spine + TypeEvaluateConfig allowlist."""

from __future__ import annotations

from unittest.mock import patch
from uuid import UUID

import pytest

from packages.decision_engine.evaluate.car_interview_evaluate import (
    CAR_INTERVIEW_TYPE_CONFIG,
    evaluate_car_interview,
)
from packages.decision_engine.evaluate.investor_meeting_evaluate import (
    INVESTOR_MEETING_TYPE_CONFIG,
    evaluate_investor_meeting,
)
from packages.decision_engine.evaluate import product_launch_evaluate as _product_launch  # noqa: F401
from packages.decision_engine.evaluate.type_evaluate_config import (
    TypeEvaluateConfig,
    get_type_evaluate_config,
    register_type_evaluate_config,
)
from packages.decision_engine.evaluate.visibility_evaluate import evaluate_visibility
from packages.decision_engine.evaluate.visibility_semantics import (
    CarInterviewVisibilitySemantics,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)


CASE_ID = UUID("11111111-1111-4111-8111-111111111111")
TARGET = "2026-09-01"


def _outcome(action_type: str) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=70,
            rating="Favorable",
            activity="negotiation",
            summary="Supportive window.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Communication clarity",
                detail="Clear exchange.",
                score=72.0,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the meeting.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent=f"{action_type}-evaluate-date",
            action_type=action_type,
        ),
    )


def test_both_types_execute_through_same_visibility_runtime() -> None:
    with patch(
        "packages.decision_engine.evaluate.car_interview_evaluate.evaluate_visibility",
        wraps=evaluate_visibility,
    ) as car_spy, patch(
        "packages.decision_engine.evaluate.investor_meeting_evaluate.evaluate_visibility",
        wraps=evaluate_visibility,
    ) as inv_spy:
        evaluate_car_interview(
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
            generate_outcome=lambda req: _outcome(req.action_type),
        )
        evaluate_investor_meeting(
            case_id=CASE_ID,
            case_version=1,
            intake={
                "target_date": TARGET,
                "meeting_goal": "Pitch",
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
            generate_outcome=lambda req: _outcome(req.action_type),
        )
    assert car_spy.call_count == 1
    assert inv_spy.call_count == 1
    assert car_spy.call_args.args[0] is CAR_INTERVIEW_TYPE_CONFIG
    assert inv_spy.call_args.args[0] is INVESTOR_MEETING_TYPE_CONFIG


def test_action_types_and_engine_ids_remain_distinct() -> None:
    assert CAR_INTERVIEW_TYPE_CONFIG.action_type == "job_interview"
    assert INVESTOR_MEETING_TYPE_CONFIG.action_type == "investor_meeting"
    assert CAR_INTERVIEW_TYPE_CONFIG.engine_id == "decision-engine-car-interview-v1"
    assert (
        INVESTOR_MEETING_TYPE_CONFIG.engine_id
        == "decision-engine-investor-meeting-v1"
    )

    seen: list[str] = []

    def gen(req):
        seen.append(req.action_type)
        return _outcome(req.action_type)

    car = evaluate_car_interview(
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
        generate_outcome=gen,
    )
    inv = evaluate_investor_meeting(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "meeting_goal": "Pitch",
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
        generate_outcome=gen,
    )
    assert seen == ["job_interview", "investor_meeting"]
    assert car.engine_id == "decision-engine-car-interview-v1"
    assert inv.engine_id == "decision-engine-investor-meeting-v1"
    assert car.decision_type_id == "car-interview"
    assert inv.decision_type_id == "bus-investor-meeting"
    assert car.family_id == "visibility"
    assert inv.family_id == "visibility"


def test_required_intake_fields_remain_type_specific() -> None:
    car = CAR_INTERVIEW_TYPE_CONFIG.evaluate_intake(
        {"target_date": TARGET, "meeting_goal": "Pitch"}
    )
    assert car.is_complete is False
    assert "role" in car.missing_required

    inv = INVESTOR_MEETING_TYPE_CONFIG.evaluate_intake(
        {"target_date": TARGET, "role": "Engineer"}
    )
    assert inv.is_complete is False
    assert "meeting_goal" in inv.missing_required


def test_unconfigured_visibility_type_cannot_execute() -> None:
    # family_id alone is insufficient — no TypeEvaluateConfig registration.
    assert get_type_evaluate_config("not-a-configured-type") is None


def test_mar_wedding_date_is_not_visibility_config() -> None:
    # Wedding is timing_opt — must not register on the Visibility allowlist.
    assert get_type_evaluate_config("mar-wedding-date") is None
    from packages.decision_engine.evaluate.type_timing_opt_evaluate_config import (
        get_timing_opt_type_evaluate_config,
    )
    from packages.decision_engine.registry import get_decision_type

    wedding = get_decision_type("mar-wedding-date")
    assert wedding.family_id == "timing_opt"
    assert "evaluate_date" in wedding.allowed_modes
    assert get_timing_opt_type_evaluate_config("mar-wedding-date") is not None


def test_bus_product_launch_is_not_visibility_config() -> None:
    assert get_type_evaluate_config("bus-product-launch") is None
    from packages.decision_engine.evaluate.type_timing_opt_evaluate_config import (
        get_timing_opt_type_evaluate_config,
    )
    from packages.decision_engine.registry import get_decision_type

    launch = get_decision_type("bus-product-launch")
    assert launch.family_id == "timing_opt"
    assert "evaluate_date" in launch.allowed_modes
    assert get_timing_opt_type_evaluate_config("bus-product-launch") is not None


def test_wrong_family_config_fails_closed() -> None:
    with pytest.raises(ValueError, match="family_id='visibility'"):
        TypeEvaluateConfig(
            decision_type_id="car-interview",
            family_id="timing_opt",  # type: ignore[arg-type]
            engine_id="decision-engine-car-interview-v1",
            action_type="job_interview",
            decision_intent="x",
            evaluate_intake=evaluate_car_interview_intake,
            build_request=lambda n, d: (_ for _ in ()).throw(AssertionError()),
            semantics=CarInterviewVisibilitySemantics(),
            incomplete_error_message="x",
            incomplete_details_key="missing_required",
        )


def test_evaluate_visibility_rejects_wrong_family_at_runtime() -> None:
    # Bypass __post_init__ by constructing then mutating is impossible (frozen).
    # Simulate by calling evaluate_visibility with a config that somehow
    # has wrong family — use object.__new__ pattern:
    cfg = object.__new__(TypeEvaluateConfig)
    object.__setattr__(cfg, "decision_type_id", "car-interview")
    object.__setattr__(cfg, "family_id", "timing_opt")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "job_interview")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_car_interview_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", CarInterviewVisibilitySemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing_required")

    with pytest.raises(ValueError, match="family_id='visibility'"):
        evaluate_visibility(
            cfg,
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
            generate_outcome=lambda _r: _outcome("job_interview"),
        )


def test_register_rejects_non_visibility_family() -> None:
    # Build via object.__new__ to skip TypeEvaluateConfig.__post_init__,
    # then register_type_evaluate_config must still reject.
    cfg = object.__new__(TypeEvaluateConfig)
    object.__setattr__(cfg, "decision_type_id", "ghost-visibility-type")
    object.__setattr__(cfg, "family_id", "timing_opt")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "x")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_car_interview_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", CarInterviewVisibilitySemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing_required")

    with pytest.raises(ValueError, match="family_id must be 'visibility'"):
        register_type_evaluate_config(cfg)


def test_insufficient_natal_preserves_type_package_identity() -> None:
    car = evaluate_car_interview(
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
        generate_outcome=lambda _r: (_ for _ in ()).throw(AssertionError()),
    )
    inv = evaluate_investor_meeting(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "meeting_goal": "Pitch",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
        },
        generate_outcome=lambda _r: (_ for _ in ()).throw(AssertionError()),
    )
    assert car.recommendation.stance == "insufficient_data"
    assert inv.recommendation.stance == "insufficient_data"
    assert "interview" in car.recommendation.summary.lower()
    assert "investor" in inv.recommendation.summary.lower()
    assert car.engine_id != inv.engine_id
