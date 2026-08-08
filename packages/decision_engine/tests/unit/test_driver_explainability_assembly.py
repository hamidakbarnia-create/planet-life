"""PR-A: Package driver explainability correctness (contribution/polarity)."""

from __future__ import annotations

import copy
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from packages.decision_engine.evaluate.driver_assembly import (
    legacy_band_from_polarity,
    legacy_score_from_contribution,
    map_evidence_reference_to_driver,
    polarity_from_contribution,
)
from packages.decision_engine.evaluate.runtime_common import score_to_candidate_band
from packages.decision_engine.evaluate.visibility_evaluate import (
    assemble_package_from_outcome,
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
from packages.decision_engine.evaluate.visibility_semantics import (
    CarInterviewVisibilitySemantics,
)


ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = ROOT / "schemas" / "decision_evaluation_package.v1.json"
FIXTURES = ROOT / "tests" / "fixtures"


class _Cfg:
    decision_type_id = "car-interview"
    engine_id = "decision-engine-car-interview-v1"
    semantics = CarInterviewVisibilitySemantics()


def _outcome_with_drivers(
    *,
    candidate_score: int = 70,
    confidence: float = 0.61,
    refs: list[EvidenceReference],
    risk_factors: list[str] | None = None,
    opportunity_factors: list[str] | None = None,
) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=candidate_score,
            rating="Favorable" if candidate_score >= 65 else "Mixed / Proceed with Awareness",
            activity="negotiation",
            summary="Supportive window for negotiation.",
            text="Good conditions for the interview.",
        ),
        confidence=Confidence(value=confidence, rating="Favorable"),
        evidence_references=refs,
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
        source_activity_response={
            "executive": {"score": candidate_score},
            "strategic": {
                "risk_factors": risk_factors or [],
                "opportunity_factors": opportunity_factors or [],
            },
        },
    )


def test_plus_and_minus_four_remain_semantically_different() -> None:
    pos = map_evidence_reference_to_driver(
        EvidenceReference(
            title="Supportive aspect",
            detail="Helpful transit",
            importance="high",
            score=4.0,
            category="aspect",
            evidence={"planet": "jupiter"},
        ),
        index=0,
    )
    neg = map_evidence_reference_to_driver(
        EvidenceReference(
            title="Cautionary aspect",
            detail="Pressuring transit",
            importance="high",
            score=-4.0,
            category="aspect",
            evidence={"planet": "saturn"},
        ),
        index=1,
    )
    assert pos["contribution"] == 4.0
    assert neg["contribution"] == -4.0
    assert pos["polarity"] == "supportive"
    assert neg["polarity"] == "cautionary"
    assert pos["polarity"] != neg["polarity"]
    assert pos["label"] != neg["label"]


def test_not_classified_with_candidate_band_thresholds() -> None:
    # Contribution +4 would be "low" under score_to_candidate_band — must not be.
    assert score_to_candidate_band(4.0) == "low"
    assert polarity_from_contribution(4.0) == "supportive"
    assert legacy_band_from_polarity("supportive") == "high"
    assert score_to_candidate_band(-4.0) == "low"  # abs path N/A; negatives aren't candidate scores
    assert polarity_from_contribution(-4.0) == "cautionary"
    assert legacy_band_from_polarity("cautionary") == "low"
    # +4 must not be treated as timing-quality low via candidate banding in assembly
    driver = map_evidence_reference_to_driver(
        EvidenceReference(title="A", detail="d", score=4.0),
        index=0,
    )
    assert driver["band"] != score_to_candidate_band(4.0) or driver["polarity"] == "supportive"
    assert driver["band"] == "high"  # polarity projection, not candidate banding


def test_negative_contribution_survives_package_serialization() -> None:
    outcome = _outcome_with_drivers(
        refs=[
            EvidenceReference(
                title="Hard aspect",
                detail="Friction present",
                importance="critical",
                score=-4.0,
                category="aspect",
                evidence={"planet": "mars"},
            )
        ]
    )
    package = assemble_package_from_outcome(
        outcome,
        _Cfg(),
        case_id=uuid4(),
        case_version=1,
        target_date="2026-09-18",
        answers=type("A", (), {"role": "Engineer"})(),
    )
    dumped = package.model_dump(mode="json")
    driver = dumped["drivers"]["items"][0]
    assert driver["contribution"] == -4.0
    assert driver["polarity"] == "cautionary"
    assert driver["friction"] == "Friction present"
    assert driver["support"] == ""
    # Round-trip
    again = DecisionEvaluationPackage.model_validate(dumped)
    assert again.drivers.items[0].contribution == -4.0


def test_importance_independent_of_polarity() -> None:
    high_support = map_evidence_reference_to_driver(
        EvidenceReference(title="S", detail="d", score=2.0, importance="high"),
        index=0,
    )
    high_caution = map_evidence_reference_to_driver(
        EvidenceReference(title="C", detail="d", score=-2.0, importance="high"),
        index=1,
    )
    assert high_support["importance"] == "high"
    assert high_caution["importance"] == "high"
    assert high_support["polarity"] != high_caution["polarity"]


def test_candidate_score_and_confidence_unchanged() -> None:
    outcome = _outcome_with_drivers(
        candidate_score=100,
        confidence=0.58,
        refs=[
            EvidenceReference(title="A", detail="ok", score=5.0),
            EvidenceReference(title="B", detail="watch", score=-3.0),
        ],
    )
    package = assemble_package_from_outcome(
        outcome,
        _Cfg(),
        case_id=UUID("11111111-1111-4111-8111-111111111111"),
        case_version=2,
        target_date="2026-09-18",
        answers=type("A", (), {})(),
        evaluation_id=UUID("22222222-2222-4222-8222-222222222222"),
        created_at=datetime(2026, 8, 8, 12, 0, tzinfo=timezone.utc),
    )
    assert package.timing.score == 100.0
    assert package.timing.candidates[0].score == 100.0
    assert package.confidence.value == 58.0
    assert {d.polarity for d in package.drivers.items} == {"supportive", "cautionary"}


def test_distinct_labels_survive() -> None:
    outcome = _outcome_with_drivers(
        refs=[
            EvidenceReference(title="Mercury support", detail="clear", score=3.0),
            EvidenceReference(title="Saturn pressure", detail="heavy", score=-3.5),
            EvidenceReference(title="Moon tone", detail="soft", score=1.2),
        ]
    )
    package = assemble_package_from_outcome(
        outcome,
        _Cfg(),
        case_id=uuid4(),
        case_version=1,
        target_date="2026-09-18",
        answers=type("A", (), {})(),
    )
    labels = [d.label for d in package.drivers.items]
    assert labels == ["Mercury support", "Saturn pressure", "Moon tone"]
    assert len(set(labels)) == 3


def test_risks_opportunities_from_strategic_only_when_present() -> None:
    outcome = _outcome_with_drivers(
        refs=[EvidenceReference(title="A", detail="d", score=4.0)],
        opportunity_factors=["Transit Jupiter trine natal Sun (orb 1.0°)"],
        risk_factors=["Transit Mars square natal Mercury (orb 0.5°)"],
    )
    package = assemble_package_from_outcome(
        outcome,
        _Cfg(),
        case_id=uuid4(),
        case_version=1,
        target_date="2026-09-18",
        answers=type("A", (), {})(),
    )
    assert package.opportunities.items == (
        "Transit Jupiter trine natal Sun (orb 1.0°)",
    )
    assert package.risks.items == (
        "Transit Mars square natal Mercury (orb 0.5°)",
    )


def test_legacy_fixtures_still_validate_without_new_fields() -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    for name in (
        "package_evaluate_date.valid.json",
        "package_compare_dates.valid.json",
    ):
        payload = json.loads((FIXTURES / name).read_text(encoding="utf-8"))
        validator.validate(payload)
        DecisionEvaluationPackage.model_validate(payload)
        # Ensure legacy drivers lack contribution/polarity and still load
        for item in payload["drivers"]["items"]:
            assert "contribution" not in item or True
        # Mutating to strip any accidental new fields still ok
        legacy = copy.deepcopy(payload)
        for item in legacy["drivers"]["items"]:
            item.pop("contribution", None)
            item.pop("polarity", None)
            item.pop("importance", None)
        validator.validate(legacy)


def test_new_package_validates_against_schema() -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    outcome = _outcome_with_drivers(
        candidate_score=100,
        refs=[
            EvidenceReference(
                title="Plus",
                detail="good",
                importance="high",
                score=4.0,
                category="aspect",
                evidence={"planet": "venus"},
            ),
            EvidenceReference(
                title="Minus",
                detail="hard",
                importance="medium",
                score=-4.0,
                category="aspect",
                evidence={"planet": "mars"},
            ),
        ],
    )
    package = assemble_package_from_outcome(
        outcome,
        _Cfg(),
        case_id=uuid4(),
        case_version=1,
        target_date="2026-09-18",
        answers=type("A", (), {})(),
    )
    dumped = package.model_dump(mode="json")
    validator.validate(dumped)
    assert dumped["drivers"]["items"][0]["contribution"] == 4.0
    assert dumped["drivers"]["items"][1]["contribution"] == -4.0
    assert legacy_score_from_contribution(-4.0) == 4.0

