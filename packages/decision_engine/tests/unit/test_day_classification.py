"""Phase 2A: deterministic day classification from score + evidence."""

from __future__ import annotations

from packages.astro_engine.scoring import _rating, calculate_activity_score
from packages.decision_engine.day_classification import (
    MATERIAL_CONTRIBUTION,
    classify_day,
)
from packages.decision_engine.day_intelligence_models import (
    build_day_intelligence_snapshot,
)
from packages.decision_engine.evidence import DecisionEvidence, polarity_from_contribution
from packages.decision_engine.tests.fixtures.calendar_score_cases import (
    case_close_exact_aspect,
    case_mixed_conflicting,
    case_natal_personalization_b,
    case_strongly_adverse,
    case_strongly_supportive,
)


def _evidence(
    *,
    kind: str = "aspect",
    contribution: float,
    factor_key: str,
    **fields,
) -> DecisionEvidence:
    return DecisionEvidence(
        evidence_id=f"ev.{factor_key}",
        factor_key=factor_key,
        kind=kind,  # type: ignore[arg-type]
        polarity=polarity_from_contribution(contribution),
        contribution=contribution,
        source_layer="test",
        **fields,
    )


def test_score_bands_match_existing_rating_thresholds() -> None:
    empty = ()
    # No evidence → insufficient regardless of score.
    assert classify_day(final_score=90, evidence=empty).day_class == "insufficient"

    supportive = (_evidence(contribution=5.0, factor_key="aspect.jupiter.trine.sun"),)
    assert classify_day(final_score=80, evidence=supportive).day_class == "strongly_supportive"
    assert classify_day(final_score=65, evidence=supportive).day_class == "supportive"
    assert classify_day(final_score=45, evidence=supportive).day_class == "mixed"
    assert classify_day(final_score=30, evidence=supportive).day_class == "caution"
    assert classify_day(final_score=29, evidence=supportive).day_class == "adverse"


def test_conflict_overrides_favorable_score_to_mixed() -> None:
    evidence = (
        _evidence(contribution=12.0, factor_key="aspect.jupiter.trine.sun"),
        _evidence(
            contribution=-6.0,
            factor_key="aspect.saturn.square.sun",
            aspect_type="square",
        ),
    )
    result = classify_day(final_score=82, evidence=evidence)
    assert result.score == 82
    assert result.rating == _rating(82)
    assert result.rating == "Highly Favorable"
    assert result.conflict is True
    assert result.day_class == "mixed"
    assert result.material_supportive_count == 1
    assert result.material_caution_count == 1


def test_sub_material_caution_does_not_create_conflict() -> None:
    evidence = (
        _evidence(contribution=12.0, factor_key="aspect.jupiter.trine.sun"),
        _evidence(
            contribution=-(MATERIAL_CONTRIBUTION - 0.1),
            factor_key="aspect.mars.square.mercury",
        ),
    )
    result = classify_day(final_score=72, evidence=evidence)
    assert result.conflict is False
    assert result.day_class == "supportive"


def test_classification_cannot_change_score() -> None:
    evidence = (
        _evidence(contribution=8.0, factor_key="aspect.venus.sextile.sun"),
        _evidence(contribution=-8.0, factor_key="aspect.saturn.square.sun"),
    )
    result = classify_day(final_score=61, evidence=evidence)
    assert result.score == 61
    assert result.day_class == "mixed"


def test_classification_is_deterministic() -> None:
    evidence = (_evidence(contribution=5.0, factor_key="aspect.jupiter.trine.sun"),)
    first = classify_day(final_score=70, evidence=evidence)
    second = classify_day(final_score=70, evidence=evidence)
    assert first == second


def test_classification_has_no_command_field() -> None:
    result = classify_day(
        final_score=70,
        evidence=(_evidence(contribution=5.0, factor_key="aspect.jupiter.trine.sun"),),
    )
    assert "command" not in result.model_dump()


def _snapshot_for(case: dict):
    result = calculate_activity_score(
        case["natal"],
        case["transit"],
        case["action_type"],
        scoring_context=case["scoring_context"],
    )
    return build_day_intelligence_snapshot(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )


def test_golden_strongly_supportive_class() -> None:
    snapshot = _snapshot_for(case_strongly_supportive())
    assert snapshot.final_score >= 80
    assert snapshot.classification.day_class == "strongly_supportive"
    assert snapshot.classification.conflict is False
    assert snapshot.classification.score == snapshot.final_score


def test_golden_strongly_adverse_class() -> None:
    snapshot = _snapshot_for(case_strongly_adverse())
    assert snapshot.final_score <= 20
    assert snapshot.classification.day_class == "adverse"
    assert snapshot.classification.score == snapshot.final_score


def test_golden_mixed_conflict_class() -> None:
    snapshot = _snapshot_for(case_mixed_conflicting())
    assert snapshot.classification.conflict is True
    assert snapshot.classification.day_class == "mixed"
    assert snapshot.classification.material_supportive_count >= 1
    assert snapshot.classification.material_caution_count >= 1


def test_golden_supportive_and_caution_from_score_bands() -> None:
    close = _snapshot_for(case_close_exact_aspect())
    assert close.final_score >= 65
    assert close.classification.day_class == "supportive"
    natal_b = _snapshot_for(case_natal_personalization_b())
    assert 30 <= natal_b.final_score < 45
    assert natal_b.classification.day_class == "caution"
