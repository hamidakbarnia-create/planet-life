"""car-offer-negotiation EVALUATE runtime: contract, honesty, claim boundary.

EVALUATE is the only shipped mode. These tests pin that COMPARE and FIND
stay fail-closed and that no Package prose predicts the employer's decision.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import pytest

from packages.decision_engine.evaluate.offer_negotiation_evaluate import (
    OFFER_NEGOTIATION_ACTION_TYPE,
    OFFER_NEGOTIATION_EVALUATE_RUNTIME,
    OFFER_NEGOTIATION_TYPE_CONFIG,
    REAL_ENGINE_ID,
    evaluate_offer_negotiation,
)
from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeProviderError,
    RuntimeUnsupportedOperationError,
)
from packages.decision_engine.evaluate.stub_package import STUB_ENGINE_ID
from packages.decision_engine.intake.offer_negotiation import NEGOTIATION_GOALS
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
CREATED = datetime(2026, 9, 1, 12, 0, tzinfo=timezone.utc)
TARGET = "2026-09-15"

NATAL = {
    "birth_date": "1982-02-25",
    "birth_time": "05:47",
    "location": "Tehran",
}

# Affirmative outcome claims this Decision Type may never make.
FORBIDDEN_CLAIMS = (
    "probab",
    "chance",
    "guarant",
    "certain",
    "100%",
    "will accept",
    "will decide",
    "accepts the",
    "expected salary",
    "predicted compensation",
    "career success",
    "legally valid",
)

# Allowed only inside an explicit refusal.
NEGATED_ONLY = ("will agree",)


def _intake(**extra):
    body = {
        "target_date": TARGET,
        "negotiation_goal": "salary",
        "decision_frame": {
            "operation": "evaluate",
            "time_scope": "specific_date",
            "date": TARGET,
        },
    }
    body.update(extra)
    return body


def _outcome(score: int = 71, confidence: float | None = 0.62) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating="Favorable",
            activity="negotiation",
            summary="Supportive window for negotiation.",
            text="Communication conditions cooperate.",
        ),
        confidence=Confidence(value=confidence, rating="Favorable")
        if confidence is not None
        else Confidence(value=None, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Transit Mercury trine natal Venus",
                detail="Cooperative exchange of terms.",
                importance="high",
                score=3.5,
                category="aspect",
                evidence={
                    "transit_planet": "mercury",
                    "natal_planet": "venus",
                    "aspect": "trine",
                    "orb": 0.9,
                },
            )
        ],
        explanation=Explanation(
            summary="Timing supports presenting terms clearly.",
            recommendation_text="Communication conditions cooperate.",
            reasons=[],
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="offer-negotiation-evaluate-date",
            action_type=OFFER_NEGOTIATION_ACTION_TYPE,
        ),
        source_activity_response={"executive": {"score": score}},
    )


def _consumer_prose(package: DecisionEvaluationPackage) -> str:
    parts = [
        package.recommendation.summary,
        *package.recommendation.conditions,
        package.timing.notes,
        package.explainability.why,
        package.explainability.why_not,
        *package.explainability.assumptions,
        *package.explainability.limits,
        *[step.action for step in package.action_plan.steps],
        package.counter_recommendation.summary,
        package.counter_recommendation.reason,
        *package.improve_accuracy.items,
        *[item.label for item in package.drivers.items],
        *[
            limit
            for item in package.evidence.items
            for limit in item.limits
        ],
        *[p.message for p in package.confidence.penalties],
    ]
    return " ".join(part for part in parts if part).lower()


def _assert_claim_boundary(package: DecisionEvaluationPackage) -> None:
    prose = _consumer_prose(package)
    for needle in FORBIDDEN_CLAIMS:
        assert needle not in prose, needle
    for needle in NEGATED_ONLY:
        if needle in prose:
            assert "never indicates whether" in prose, needle


# --- binding ---------------------------------------------------------------


def test_runtime_contract_binding() -> None:
    runtime = OFFER_NEGOTIATION_EVALUATE_RUNTIME
    assert runtime.decision_type_id == "car-offer-negotiation"
    assert runtime.mode == "evaluate_date"
    assert runtime.engine_id == REAL_ENGINE_ID
    assert runtime.evaluate_package is evaluate_offer_negotiation


def test_config_uses_visibility_family_and_explicit_action_type() -> None:
    config = OFFER_NEGOTIATION_TYPE_CONFIG
    assert config.family_id == "visibility"
    assert config.action_type == "offer_negotiation"
    assert config.decision_intent == "offer-negotiation-evaluate-date"
    assert config.engine_id == "decision-engine-offer-negotiation-v1"


# --- required inputs -------------------------------------------------------


def test_incomplete_intake_is_rejected() -> None:
    with pytest.raises(RuntimeFramingError) as err:
        evaluate_offer_negotiation(
            case_id=CASE_ID,
            case_version=1,
            intake={
                "negotiation_goal": "salary",
                "decision_frame": {
                    "operation": "evaluate",
                    "time_scope": "specific_date",
                    "date": TARGET,
                },
            },
            generate_outcome=lambda _req: _outcome(),
        )
    assert err.value.details == {"missing": ["target_date"]}


def test_unauthorized_goal_is_dropped_without_blocking_evaluate() -> None:
    """Bad enum is not persisted, but it is optional context, not a gate."""
    package = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=1,
        intake=_intake(
            negotiation_goal="equity_refresh",
            natal_evidence=dict(NATAL),
        ),
        generate_outcome=lambda _req: _outcome(),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    assert package.timing.material is True
    assert "Negotiation goal was not used in scoring." in (
        package.recommendation.conditions
    )


def test_missing_framing_does_not_infer_today() -> None:
    with pytest.raises(RuntimeFramingError):
        evaluate_offer_negotiation(
            case_id=CASE_ID,
            case_version=1,
            intake={"target_date": TARGET, "negotiation_goal": "salary"},
            generate_outcome=lambda _req: _outcome(),
        )


def test_invalid_date_is_rejected() -> None:
    with pytest.raises((RuntimeFramingError, ValueError)):
        evaluate_offer_negotiation(
            case_id=CASE_ID,
            case_version=1,
            intake=_intake(
                decision_frame={
                    "operation": "evaluate",
                    "time_scope": "specific_date",
                    "date": "2026-13-45",
                }
            ),
            generate_outcome=lambda _req: _outcome(),
        )


@pytest.mark.parametrize(
    "frame",
    [
        {
            "operation": "compare",
            "time_scope": "multiple_dates",
            "dates": [TARGET, "2026-09-18"],
        },
        {
            "operation": "find",
            "time_scope": "date_range",
            "start": "2026-09-01",
            "end": "2026-09-30",
        },
    ],
)
def test_compare_and_find_operations_stay_fail_closed(frame) -> None:
    with pytest.raises(RuntimeUnsupportedOperationError) as err:
        evaluate_offer_negotiation(
            case_id=CASE_ID,
            case_version=1,
            intake=_intake(decision_frame=frame),
            generate_outcome=lambda _req: _outcome(),
        )
    assert err.value.operation == frame["operation"]


def test_wrong_decision_type_cannot_reach_this_runtime() -> None:
    from packages.decision_engine.evaluate.type_evaluate_config import (
        get_type_evaluate_config,
    )

    assert (
        get_type_evaluate_config("car-offer-negotiation")
        is OFFER_NEGOTIATION_TYPE_CONFIG
    )
    assert get_type_evaluate_config("car-interview") is not (
        OFFER_NEGOTIATION_TYPE_CONFIG
    )


# --- natal honesty ---------------------------------------------------------


def test_missing_natal_returns_insufficient_not_favorable() -> None:
    package = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=1,
        intake=_intake(),
        generate_outcome=lambda _req: (_ for _ in ()).throw(
            AssertionError("must not score")
        ),
    )
    assert package.decision_type_id == "car-offer-negotiation"
    assert package.engine_id == REAL_ENGINE_ID
    assert package.engine_id != STUB_ENGINE_ID
    assert package.recommendation.stance == "insufficient_data"
    assert package.timing.material is False
    assert package.timing.band == "na"
    assert package.timing.score is None
    assert any(
        p.code == "MISSING_NATAL_EVIDENCE" for p in package.confidence.penalties
    )
    assert package.counter_recommendation.summary == ""
    _assert_claim_boundary(package)


def test_provider_failure_does_not_become_success() -> None:
    def boom(_req):
        raise RuntimeError("ephemeris down")

    with pytest.raises(RuntimeProviderError):
        evaluate_offer_negotiation(
            case_id=CASE_ID,
            case_version=1,
            intake=_intake(natal_evidence=dict(NATAL)),
            generate_outcome=boom,
        )


# --- happy path ------------------------------------------------------------


def _scored_package(score: int = 71) -> DecisionEvaluationPackage:
    return evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=2,
        intake=_intake(natal_evidence=dict(NATAL)),
        generate_outcome=lambda _req: _outcome(score),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )


def _baseline_request_and_package() -> tuple[dict, dict]:
    captured: list = []

    def generate(request):
        captured.append(request)
        return _outcome(71)

    package = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=2,
        intake=_intake(
            negotiation_goal=NEGOTIATION_GOALS[0],
            natal_evidence=dict(NATAL),
        ),
        generate_outcome=generate,
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    return captured[0].model_dump(mode="json"), package.model_dump(mode="json")


_BASELINE_REQUEST, _BASELINE_PACKAGE = _baseline_request_and_package()


def test_happy_path_maps_outcome_without_inventing_fields() -> None:
    requests: list = []

    def generate(request):
        requests.append(request)
        return _outcome(71)

    package = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=2,
        intake=_intake(natal_evidence=dict(NATAL)),
        generate_outcome=generate,
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )

    assert len(requests) == 1
    request = requests[0]
    assert request.action_type == "offer_negotiation"
    assert request.decision_intent == "offer-negotiation-evaluate-date"
    assert request.target_date == TARGET
    assert request.birth_date == NATAL["birth_date"]

    assert package.decision_type_id == "car-offer-negotiation"
    assert package.engine_id == REAL_ENGINE_ID
    assert package.timing.material is True
    assert package.timing.score == 71.0
    assert package.confidence.value == 62.0
    # One requested date only: no Compare candidates, no Find window.
    assert len(package.timing.candidates) == 1
    assert package.timing.candidates[0].date.isoformat() == TARGET
    assert package.counter_recommendation.summary == ""
    assert "FIND is not implemented" in package.counter_recommendation.reason
    assert "10:30" not in package.timing.notes
    DecisionEvaluationPackage.model_validate(package.model_dump(mode="json"))


def test_evidence_provenance_and_factor_keys_preserved() -> None:
    package = _scored_package()
    evidence = package.evidence.items[0]
    assert evidence.framework_id == "astro_timing"
    assert evidence.eligibility == "registered"
    assert evidence.artifact_ref == f"evidence://astro_timing/{TARGET}"
    assert [d.factor_key for d in package.drivers.items] == [
        "aspect.mercury.trine.venus"
    ]
    assert [d.contribution for d in package.drivers.items] == [3.5]


def test_scoring_mapping_is_stated_not_defaulted() -> None:
    package = _scored_package()
    notes = package.timing.notes.lower()
    assert "offer_negotiation" in notes
    assert "negotiation profile" in notes
    assert "default" not in notes


def test_output_is_deterministic() -> None:
    first = _scored_package().model_dump(mode="json")
    second = _scored_package().model_dump(mode="json")
    assert first == second


def test_optional_slots_are_disclosed_as_unused() -> None:
    """Every omitted context slot is named as not affecting the score."""
    bare = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=2,
        intake={
            "target_date": TARGET,
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
            "natal_evidence": dict(NATAL),
        },
        generate_outcome=lambda _req: _outcome(71),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    assert bare.recommendation.conditions == (
        "Negotiation goal was not used in scoring.",
        "Offer stage was not used in scoring.",
        "Counterparty role was not used in scoring.",
    )

    with_optional = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=2,
        intake=_intake(
            natal_evidence=dict(NATAL),
            offer_stage="written_offer",
            counterparty_role="hiring_manager",
        ),
        generate_outcome=lambda _req: _outcome(71),
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )
    assert with_optional.recommendation.conditions == ()
    # Optional context never moves the number.
    assert with_optional.timing.score == bare.timing.score


@pytest.mark.parametrize("goal", NEGOTIATION_GOALS)
def test_negotiation_goal_never_changes_the_package(goal: str) -> None:
    """Audit guard: the goal is stored context only.

    If a future change makes the goal shape the request or the Package, this
    test fails and the slot must be re-justified rather than silently
    becoming load-bearing.
    """
    requests: list = []

    def generate(request):
        requests.append(request)
        return _outcome(71)

    package = evaluate_offer_negotiation(
        case_id=CASE_ID,
        case_version=2,
        intake=_intake(negotiation_goal=goal, natal_evidence=dict(NATAL)),
        generate_outcome=generate,
        evaluation_id=EVAL_ID,
        created_at=CREATED,
    )

    assert requests[0].model_dump(mode="json") == _BASELINE_REQUEST
    assert package.model_dump(mode="json") == _BASELINE_PACKAGE


# --- claim boundary --------------------------------------------------------


@pytest.mark.parametrize("score", [12, 44, 71, 96])
def test_no_outcome_claim_at_any_score(score: int) -> None:
    _assert_claim_boundary(_scored_package(score))


def test_limits_name_the_refused_claims() -> None:
    limits = " ".join(_scored_package().explainability.limits)
    assert "not a prediction of the employer's decision" in limits
    assert "No salary, benefit, or compensation outcome is predicted." in limits
    assert "Contract terms were not reviewed for legal validity." in limits


def test_action_plan_asks_the_user_to_decide() -> None:
    steps = _scored_package().action_plan.steps
    assert len(steps) == 1
    action = steps[0].action
    assert TARGET in action
    assert action.lower().startswith("decide whether")


def test_improve_accuracy_directs_verification_to_the_employer() -> None:
    items = " ".join(_scored_package().improve_accuracy.items).lower()
    assert "verify salary, benefits, and contractual details" in items
    assert "directly with the employer" in items
