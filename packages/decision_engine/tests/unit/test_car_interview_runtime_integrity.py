"""Runtime-integrity tests: mapping provenance, thresholds, unused inputs."""

from __future__ import annotations

from uuid import UUID

import pytest

from packages.astro_engine.scoring import _rating, _resolve_profile
from packages.decision_engine.evaluate.car_interview_evaluate import (
    assemble_package_from_outcome,
    evaluate_car_interview,
    extract_evaluate_date_from_framing,
    rating_to_candidate_band,
    rating_to_stance,
)
from packages.decision_engine.intake.car_interview import CarInterviewIntake
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    DecisionRequest,
    Explanation,
    Recommendation,
)

CASE_ID = UUID("11111111-1111-4111-8111-111111111111")
TARGET = "2026-08-18"


def test_job_interview_alias_is_preexisting_canonical_mapping() -> None:
    """Provenance: scoring.py aliases job_interview → negotiation (pre-PR)."""
    profile = _resolve_profile("job_interview")
    assert profile.label == "Negotiation"
    assert profile.primary_planets == ("mercury", "venus", "jupiter")
    assert "communication" in profile.executive_focus


def test_rating_thresholds_match_scoring_engine() -> None:
    assert _rating(80) == "Highly Favorable"
    assert _rating(79) == "Favorable"
    assert _rating(65) == "Favorable"
    assert _rating(64).startswith("Mixed")
    assert _rating(45).startswith("Mixed")
    assert _rating(44) == "Challenging"
    assert _rating(30) == "Challenging"
    assert _rating(29) == "Unfavorable"


@pytest.mark.parametrize(
    ("rating", "band", "stance"),
    [
        ("Highly Favorable", "high", "proceed"),
        ("Favorable", "high", "proceed_with_conditions"),
        ("Mixed / Proceed with Awareness", "moderate", "proceed_with_conditions"),
        ("Challenging", "low", "wait"),
        ("Unfavorable", "low", "wait"),
    ],
)
def test_band_and_stance_from_canonical_rating(
    rating: str, band: str, stance: str
) -> None:
    assert rating_to_candidate_band(rating) == band
    assert rating_to_stance(rating) == stance


def test_score_boundaries_do_not_upgrade_certainty() -> None:
    """Boundary scores keep the weaker side of each canonical threshold."""
    assert _rating(79) == "Favorable"
    assert _rating(80) == "Highly Favorable"
    assert _rating(64).startswith("Mixed")
    assert _rating(65) == "Favorable"
    assert rating_to_stance("Favorable") == "proceed_with_conditions"
    assert rating_to_stance("Highly Favorable") == "proceed"
    assert rating_to_candidate_band("Favorable") == "high"
    assert rating_to_candidate_band("Mixed / Proceed with Awareness") == "moderate"


def _outcome(score: int, rating: str) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating=rating,
            activity="Negotiation",
            summary="Supportive window.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.55, rating=rating),
        evidence_references=[],
        explanation=Explanation(
            summary="Timing supports clear exchange.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="car-interview-evaluate-date",
            action_type="job_interview",
        ),
    )


def test_unused_intake_fields_do_not_claim_score_influence() -> None:
    seen: list[DecisionRequest] = []

    def generate(req: DecisionRequest) -> DecisionOutcome:
        seen.append(req)
        return _outcome(70, "Favorable")

    package = evaluate_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "role": "Staff Engineer",
            "company": "Acme Corp",
            "interview_type": "onsite panel",
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
        generate_outcome=generate,
    )
    req = seen[0]
    # Scoring request ignores role/company/interview_type/objective.
    dumped = req.model_dump()
    assert "role" not in dumped
    assert "company" not in dumped
    assert "interview_type" not in dumped
    assert req.target_date == TARGET
    assert req.action_type == "job_interview"
    blob = package.model_dump(mode="json")
    assert "did not enter the scoring function" in str(blob["evidence"])
    assert "did not affect the numeric score" in str(blob["explainability"]["limits"])
    assert "negotiation" in package.timing.notes.lower()
    # Labels may appear, but must not claim they drove the score.
    assert "Staff Engineer" in package.recommendation.summary
    assert "influenced" not in package.recommendation.summary.lower()


def test_evaluation_date_only_from_decision_frame() -> None:
    intake = {
        "target_date": "2026-01-01",
        "decision_frame": {
            "operation": "evaluate",
            "time_scope": "specific_date",
            "date": TARGET,
        },
    }
    assert extract_evaluate_date_from_framing(intake) == TARGET
    package = assemble_package_from_outcome(
        _outcome(50, "Mixed / Proceed with Awareness"),
        case_id=CASE_ID,
        case_version=1,
        target_date=TARGET,
        intake=CarInterviewIntake(target_date="2026-01-01", role="PM"),
    )
    assert package.timing.candidates[0].date.isoformat() == TARGET


def test_confidence_unavailable_is_placeholder_zero_with_penalty() -> None:
    outcome = _outcome(70, "Favorable")
    outcome = outcome.model_copy(
        update={"confidence": Confidence(value=None, rating="Favorable")}
    )
    package = assemble_package_from_outcome(
        outcome,
        case_id=CASE_ID,
        case_version=1,
        target_date=TARGET,
        intake=CarInterviewIntake(target_date=TARGET, role="PM"),
    )
    assert package.confidence.value == 0.0
    assert any(p.code == "CONFIDENCE_UNAVAILABLE" for p in package.confidence.penalties)
    assert "placeholder" in package.confidence.penalties[0].message.lower()


def test_birth_location_is_not_copied_as_interview_event_location() -> None:
    seen: list[DecisionRequest] = []

    def generate(req: DecisionRequest) -> DecisionOutcome:
        seen.append(req)
        return _outcome(70, "Favorable")

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
                "latitude": 35.6,
                "longitude": 51.4,
                # Accidental copy of birth into evaluation_* must be ignored.
                "evaluation_location": "Tehran",
                "evaluation_latitude": 35.6,
                "evaluation_longitude": 51.4,
            },
        },
        generate_outcome=generate,
    )
    req = seen[0]
    assert req.location == "Tehran"
    assert req.evaluation_location is None
    assert req.evaluation_latitude is None
    assert req.evaluation_longitude is None


def test_distinct_event_location_is_passed_when_present() -> None:
    seen: list[DecisionRequest] = []

    def generate(req: DecisionRequest) -> DecisionOutcome:
        seen.append(req)
        return _outcome(70, "Favorable")

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
                "latitude": 35.6,
                "longitude": 51.4,
                "evaluation_location": "London",
                "evaluation_latitude": 51.5,
                "evaluation_longitude": -0.12,
            },
        },
        generate_outcome=generate,
    )
    req = seen[0]
    assert req.location == "Tehran"
    assert req.evaluation_location == "London"
    assert "supplied separately from birth place" in " ".join(
        package.explainability.assumptions
    )


def test_neutral_score_cannot_become_proceed() -> None:
    package = assemble_package_from_outcome(
        _outcome(50, "Mixed / Proceed with Awareness"),
        case_id=CASE_ID,
        case_version=1,
        target_date=TARGET,
        intake=CarInterviewIntake(target_date=TARGET, role="PM"),
    )
    assert package.recommendation.stance == "proceed_with_conditions"
    assert package.timing.band == "moderate"
    assert package.timing.score == 50.0
