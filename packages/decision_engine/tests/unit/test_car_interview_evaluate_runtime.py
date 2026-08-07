"""Focused tests for car-interview EVALUATE real runtime."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import pytest

from packages.decision_engine.evaluate.car_interview_evaluate import (
    REAL_ENGINE_ID,
    RuntimeFramingError,
    RuntimeProviderError,
    RuntimeUnsupportedOperationError,
    assemble_package_from_outcome,
    evaluate_car_interview,
    extract_evaluate_date_from_framing,
    rating_to_stance,
)
from packages.decision_engine.evaluate.stub_package import STUB_ENGINE_ID
from packages.decision_engine.intake.car_interview import CarInterviewIntake
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
TARGET = "2026-08-18"


def _intake(**extra):
    body = {
        "target_date": TARGET,
        "role": "Engineer",
        "company": "Metioro",
        "decision_frame": {
            "operation": "evaluate",
            "time_scope": "specific_date",
            "date": TARGET,
            "runtime_executed": False,
        },
    }
    body.update(extra)
    return body


def _outcome(score: int = 70, confidence: float | None = 0.61) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating="Favorable",
            activity="negotiation",
            summary="Supportive window for negotiation.",
            text="Good conditions for the interview.",
        ),
        confidence=Confidence(value=confidence, rating="Favorable")
        if confidence is not None
        else Confidence(value=None, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                category="mercury",
                title="Communication clarity",
                detail="Mercury supports clear exchange.",
                importance="high",
                score=72.0,
                evidence={"source": "reasoning"},
            )
        ],
        explanation=Explanation(
            summary="Timing supports clear professional presentation.",
            recommendation_text="Good conditions for the interview.",
            reasons=[],
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="car-interview-evaluate-date",
            action_type="job_interview",
        ),
        source_activity_response={"executive": {"score": score}},
    )


def test_reads_date_from_persisted_framing_not_target_date_slot() -> None:
    intake = _intake(
        target_date="2026-01-01",
        decision_frame={
            "operation": "evaluate",
            "time_scope": "specific_date",
            "date": TARGET,
        },
    )
    assert extract_evaluate_date_from_framing(intake) == TARGET


def test_missing_framing_does_not_infer_today() -> None:
    with pytest.raises(RuntimeFramingError):
        extract_evaluate_date_from_framing({"target_date": TARGET, "role": "X"})


def test_compare_and_find_not_implemented() -> None:
    with pytest.raises(RuntimeUnsupportedOperationError) as cmp:
        extract_evaluate_date_from_framing(
            {
                "decision_frame": {
                    "operation": "compare",
                    "time_scope": "multiple_dates",
                    "dates": [TARGET, "2026-08-20"],
                }
            }
        )
    assert cmp.value.operation == "compare"

    with pytest.raises(RuntimeUnsupportedOperationError) as find:
        extract_evaluate_date_from_framing(
            {
                "decision_frame": {
                    "operation": "find",
                    "time_scope": "date_range",
                    "start": "2026-08-01",
                    "end": "2026-08-31",
                }
            }
        )
    assert find.value.operation == "find"


def test_missing_natal_returns_insufficient_not_favorable() -> None:
    package = evaluate_car_interview(
        case_id=CASE_ID,
        case_version=3,
        intake=_intake(),
        generate_outcome=lambda _req: (_ for _ in ()).throw(AssertionError("no score")),
    )
    assert package.engine_id == REAL_ENGINE_ID
    assert package.engine_id != STUB_ENGINE_ID
    assert package.recommendation.stance == "insufficient_data"
    assert package.timing.material is False
    assert package.timing.band == "na"
    assert package.timing.score is None
    assert package.counter_recommendation.summary == ""
    assert any(
        p.code == "MISSING_NATAL_EVIDENCE" for p in package.confidence.penalties
    )
    # No invented clock window / alternative language.
    assert "10:30" not in package.timing.notes
    assert package.timing.candidates[0].date.isoformat() == TARGET


def test_real_outcome_maps_deterministically_to_package() -> None:
    calls: list[str] = []

    def generate(req):
        calls.append(req.target_date)
        assert req.action_type == "job_interview"
        assert req.target_date == TARGET
        assert req.birth_date == "1982-02-25"
        return _outcome(score=70, confidence=0.61)

    package = evaluate_car_interview(
        case_id=CASE_ID,
        case_version=4,
        intake=_intake(
            natal_evidence={
                "birth_date": "1982-02-25",
                "birth_time": "05:47",
                "location": "Tehran",
            }
        ),
        generate_outcome=generate,
        evaluation_id=UUID("22222222-2222-4222-8222-222222222222"),
        created_at=datetime(2026, 8, 7, 12, 0, tzinfo=timezone.utc),
    )
    assert calls == [TARGET]
    assert package.engine_id == REAL_ENGINE_ID
    assert package.timing.material is True
    assert package.timing.score == 70.0
    assert package.timing.candidates[0].date.isoformat() == TARGET
    assert package.timing.candidates[0].score == 70.0
    assert package.timing.band == "high"
    assert package.recommendation.stance == rating_to_stance("Favorable")
    assert package.confidence.value == 61.0
    assert package.drivers.items[0].label == "Communication clarity"
    assert package.counter_recommendation.summary == ""
    assert "No alternative date was evaluated" in package.counter_recommendation.reason
    assert "negotiation" in package.timing.notes.lower()
    assert "did not affect the numeric score" in " ".join(
        package.explainability.limits
    )
    DecisionEvaluationPackage.model_validate(package.model_dump(mode="json"))


def test_no_fake_confidence_when_upstream_omits_it() -> None:
    outcome = _outcome(score=55, confidence=None)
    outcome = outcome.model_copy(
        update={
            "recommendation": outcome.recommendation.model_copy(
                update={
                    "score": 55,
                    "rating": "Mixed / Proceed with Awareness",
                }
            )
        }
    )
    package = assemble_package_from_outcome(
        outcome,
        case_id=CASE_ID,
        case_version=1,
        target_date=TARGET,
        intake=CarInterviewIntake(target_date=TARGET, role="Engineer"),
    )
    assert package.confidence.value == 0.0
    assert any(p.code == "CONFIDENCE_UNAVAILABLE" for p in package.confidence.penalties)
    assert "placeholder" in package.confidence.penalties[0].message.lower()
    assert package.timing.band == "moderate"
    assert package.recommendation.stance == "proceed_with_conditions"


def test_provider_failure_does_not_become_success() -> None:
    def boom(_req):
        raise RuntimeError("ephemeris down")

    with pytest.raises(RuntimeProviderError):
        evaluate_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_intake(
                natal_evidence={
                    "birth_date": "1982-02-25",
                    "birth_time": "05:47",
                    "location": "Tehran",
                }
            ),
            generate_outcome=boom,
        )


def test_stub_builder_not_invoked_by_runtime_path() -> None:
    """Guard: real runtime engine id never equals stub."""
    package = evaluate_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_intake(
            natal_evidence={
                "birth_date": "1982-02-25",
                "birth_time": "05:47",
                "location": "Tehran",
            }
        ),
        generate_outcome=lambda _r: _outcome(66),
    )
    assert package.engine_id != STUB_ENGINE_ID
    assert "81" not in str(package.timing.score)
    assert package.timing.score == 66.0
