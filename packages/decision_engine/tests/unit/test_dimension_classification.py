"""Phase 2C: dimension-driven shadow classification vs Phase 2A oracle."""

from __future__ import annotations

import copy
import inspect

from packages.astro_engine.scoring import calculate_activity_score
from packages.decision_engine.day_intelligence_models import (
    build_day_intelligence_snapshot,
    day_intelligence_payload,
)
from packages.decision_engine.dimension_classification import (
    CLASSIFIER_VERSION,
    HIGH_THRESHOLD,
    LOW_THRESHOLD,
    classify_from_dimensions,
)
from packages.decision_engine.dimension_mapping import DIMENSION_KEYS
from packages.decision_engine.dimension_classification import _resolve_class
from packages.decision_engine.dimension_classification_proposed import (
    ACTIVE_SHADOW_CLASSIFIER_VERSION,
)
from packages.decision_engine.dimensions import DecisionDimension, DecisionDimensions
from packages.decision_engine.tests.fixtures.calendar_score_cases import (
    CASE_BUILDERS,
    case_action_type_business_launch,
    case_action_type_rest_recovery,
    case_angular_contact,
    case_close_exact_aspect,
    case_evaluation_location_london,
    case_evaluation_location_sydney,
    case_loose_aspect,
    case_mixed_conflicting,
    case_natal_personalization_a,
    case_natal_personalization_b,
    case_retrograde_penalty,
    case_strongly_adverse,
    case_strongly_supportive,
)


def _dim(
    value: int,
    *,
    status: str = "scored",
    conflicted: bool = False,
) -> DecisionDimension:
    if status == "insufficient":
        return DecisionDimension(
            value=50,
            evidence_strength=None,
            status="insufficient",
        )
    supportive = ("ev.support",) if value > 50 or conflicted else ()
    caution = ("ev.caution",) if value < 50 or conflicted else ()
    return DecisionDimension(
        value=value,
        evidence_strength=0.5,
        status="scored",
        conflicted=conflicted,
        supportive_evidence_ids=supportive,
        caution_evidence_ids=caution,
        dominant_evidence_ids=("ev.dominant",),
    )


def _dims(**overrides: DecisionDimension | int | None) -> DecisionDimensions:
    payload: dict[str, DecisionDimension] = {}
    for key in DIMENSION_KEYS:
        spec = overrides.get(key)
        if spec is None:
            payload[key] = _dim(50, status="insufficient")
        elif isinstance(spec, int):
            payload[key] = _dim(spec)
        else:
            payload[key] = spec
    return DecisionDimensions(action_type="test", **payload)


def _classify(dims: DecisionDimensions, *, phase2a: str = "mixed", score: int = 50):
    return classify_from_dimensions(
        dims,
        phase2a_class=phase2a,  # type: ignore[arg-type]
        executive_score=score,
    )


def _snapshot_for(case: dict):
    result = calculate_activity_score(
        case["natal"],
        case["transit"],
        case["action_type"],
        scoring_context=case["scoring_context"],
    )
    snapshot = build_day_intelligence_snapshot(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    return result, snapshot


def test_insufficient_all_unknown() -> None:
    result = _classify(_dims(), phase2a="insufficient", score=90)
    assert result.day_class == "insufficient"
    assert result.scored_dimension_count == 0
    assert result.insufficient_dimension_count == 7
    assert result.classification_coverage == 0.0
    assert result.dimensions_used == ()
    assert result.executive_score == 90
    assert result.day_class != "high_leverage"


def test_unknown_baseline_50_is_not_neutral() -> None:
    result = _classify(
        _dims(opportunity=80, momentum=80),
        phase2a="strongly_supportive",
        score=100,
    )
    assert "clarity" not in result.dimensions_used
    assert "clarity" not in result.high_dimension_ids
    assert "clarity" not in result.low_dimension_ids
    assert "clarity" not in result.veto_dimension_ids
    assert result.critical_dimensions_available == 0
    assert result.day_class != "high_leverage"


def test_opportunity_alone_is_not_action_or_high_leverage() -> None:
    result = _classify(_dims(opportunity=90), phase2a="strongly_supportive", score=90)
    assert result.day_class == "insufficient"
    assert result.day_class != "action"
    assert result.day_class != "high_leverage"


def test_high_score_cannot_create_high_leverage_without_coverage() -> None:
    dims = _dims(opportunity=100, momentum=90, cooperation=70)
    high = _classify(dims, phase2a="strongly_supportive", score=100)
    low = _classify(dims, phase2a="strongly_supportive", score=20)
    assert high.day_class == low.day_class == "action"
    assert high.critical_dimensions_available == 0
    assert "inadequate_coverage_for_high_leverage" in high.disagreement_reason


def test_high_leverage_requires_coverage_and_no_veto() -> None:
    covered = _dims(
        opportunity=82,
        momentum=80,
        clarity=70,
        stability=68,
        cooperation=66,
    )
    result = _classify(covered, phase2a="strongly_supportive", score=40)
    assert result.day_class == "high_leverage"
    assert result.executive_score == 40
    assert result.critical_dimensions_available >= 2
    vetoed = _dims(
        opportunity=82,
        momentum=80,
        clarity=30,
        stability=68,
        cooperation=66,
    )
    assert _classify(vetoed, phase2a="mixed", score=85).day_class == "selective"


def test_split_signal_high_drive_low_safety() -> None:
    dims = _dims(
        opportunity=90,
        momentum=88,
        clarity=38,
        stability=40,
        reversibility_safety=35,
        cooperation=72,
        pressure=68,
    )
    result = _classify(dims, phase2a="strongly_supportive", score=88)
    assert result.split_signal is True
    assert result.same_dimension_conflict is False
    assert result.day_class == "selective"
    assert "clarity" in result.veto_dimension_ids
    assert "pressure" in result.veto_dimension_ids
    assert result.day_class != "mixed"


def test_same_dimension_conflict_near_50_is_mixed_not_split() -> None:
    dims = _dims(
        opportunity=_dim(50, conflicted=True),
        momentum=70,
        cooperation=60,
    )
    result = _classify(dims, phase2a="supportive", score=70)
    assert result.same_dimension_conflict is True
    assert result.split_signal is False
    assert result.day_class == "mixed"
    assert "opportunity" in result.conflicted_dimension_ids
    assert dims.opportunity.value == 50
    assert dims.opportunity.status == "scored"


def test_pressure_high_is_cautionary_not_supportive() -> None:
    dims = _dims(opportunity=40, momentum=38, pressure=80, stability=40)
    result = _classify(dims, phase2a="adverse", score=20)
    assert "pressure" not in result.high_dimension_ids
    assert "pressure" in result.low_dimension_ids
    assert "pressure" in result.veto_dimension_ids
    assert result.day_class == "defensive"


def test_recovery_low_drive_without_crush() -> None:
    dims = _dims(
        opportunity=36,
        momentum=38,
        stability=60,
        pressure=40,
        cooperation=44,
    )
    result = _classify(dims, phase2a="caution", score=36)
    assert result.day_class == "recovery"
    assert result.split_signal is False


def test_executive_score_does_not_change_class() -> None:
    dims = _dims(opportunity=70, momentum=66, cooperation=58)
    first = _classify(dims, phase2a="supportive", score=100)
    second = _classify(dims, phase2a="supportive", score=1)
    assert first.day_class == second.day_class
    assert "executive_score" not in inspect.getsource(_resolve_class)


def test_no_command_field() -> None:
    result = _classify(_dims(opportunity=70, momentum=66), phase2a="supportive")
    dumped = result.model_dump()
    assert "command" not in dumped
    assert dumped["semantic_status"] == "experimental_shadow"
    assert dumped["classifier_version"] == CLASSIFIER_VERSION
    assert "confidence" not in dumped
    assert "classification_strength" not in dumped
    assert "classification_coverage" in dumped


def test_thresholds_match_existing_rating_floors() -> None:
    assert HIGH_THRESHOLD == 65
    assert LOW_THRESHOLD == 45


def test_golden_strongly_supportive_is_action_not_high_leverage() -> None:
    result, snapshot = _snapshot_for(case_strongly_supportive())
    cmp_ = snapshot.dimension_classification
    assert snapshot.final_score == result["executive"]["score"]
    assert snapshot.classification.day_class == "strongly_supportive"
    assert cmp_.day_class == "action"
    assert cmp_.split_signal is False
    assert cmp_.critical_dimensions_available == 0
    assert cmp_.disagreement is True
    assert "inadequate_coverage_for_high_leverage" in cmp_.disagreement_reason


def test_golden_strongly_adverse_is_defensive() -> None:
    _, snapshot = _snapshot_for(case_strongly_adverse())
    cmp_ = snapshot.dimension_classification
    assert snapshot.classification.day_class == "adverse"
    assert cmp_.day_class == "defensive"
    assert "pressure" in cmp_.veto_dimension_ids
    assert cmp_.split_signal is False


def test_golden_mixed_conflicting_is_selective_split() -> None:
    _, snapshot = _snapshot_for(case_mixed_conflicting())
    cmp_ = snapshot.dimension_classification
    assert snapshot.classification.day_class == "mixed"
    assert snapshot.classification.conflict is True
    assert cmp_.same_dimension_conflict is False
    assert cmp_.split_signal is True
    assert cmp_.day_class == "selective"
    assert "split_signal" in cmp_.disagreement_reason
    assert "stability" in cmp_.veto_dimension_ids


def test_golden_rest_recovery_is_review_not_generic_mixed() -> None:
    _, snapshot = _snapshot_for(case_action_type_rest_recovery())
    cmp_ = snapshot.dimension_classification
    assert snapshot.classification.day_class == "mixed"
    assert snapshot.classification.conflict is False
    assert cmp_.day_class == "review"
    assert cmp_.split_signal is False
    assert "phase2a_score_band_mixed_without_conflict" in cmp_.disagreement_reason


def test_golden_business_launch_matches_mixed_chart() -> None:
    _, mixed = _snapshot_for(case_mixed_conflicting())
    _, launch = _snapshot_for(case_action_type_business_launch())
    assert (
        launch.dimension_classification.day_class
        == mixed.dimension_classification.day_class
    )


def test_golden_locations_and_personalization() -> None:
    _, london = _snapshot_for(case_evaluation_location_london())
    _, sydney = _snapshot_for(case_evaluation_location_sydney())
    _, natal_a = _snapshot_for(case_natal_personalization_a())
    _, natal_b = _snapshot_for(case_natal_personalization_b())
    assert london.dimension_classification.day_class == "action"
    assert sydney.dimension_classification.day_class == "action"
    assert natal_a.dimension_classification.day_class == "action"
    assert natal_b.dimension_classification.day_class == "defensive"
    assert london.final_score != sydney.final_score
    assert natal_a.final_score != natal_b.final_score


def test_golden_weak_signal_cases_are_review() -> None:
    for case in (
        case_angular_contact(),
        case_loose_aspect(),
        case_retrograde_penalty(),
    ):
        _, snapshot = _snapshot_for(case)
        assert snapshot.classification.day_class == "mixed"
        assert snapshot.dimension_classification.day_class == "review"
        assert snapshot.dimension_classification.split_signal is False
        assert (
            "phase2a_score_band_mixed_without_conflict"
            in snapshot.dimension_classification.disagreement_reason
        )


def test_golden_close_exact_is_action() -> None:
    _, snapshot = _snapshot_for(case_close_exact_aspect())
    assert snapshot.classification.day_class == "supportive"
    assert snapshot.dimension_classification.day_class == "action"
    assert snapshot.dimension_classification.critical_dimensions_available == 0


def test_payload_keeps_phase2a_and_adds_shadow_comparison() -> None:
    _, snapshot = _snapshot_for(case_mixed_conflicting())
    payload = day_intelligence_payload(snapshot)
    assert payload["day_class"] == snapshot.classification.day_class
    assert "dimension_classification" in payload
    shadow = payload["dimension_classification"]
    assert shadow["day_class"] == "selective"
    assert shadow["phase2a_class"] == payload["day_class"]
    assert shadow["executive_score"] == payload["final_score"]
    assert "command" not in shadow
    assert "confidence" not in shadow
    assert "classification_strength" not in shadow
    assert "classification_coverage" in shadow
    assert shadow["semantic_status"] == "experimental_shadow"
    assert shadow["classifier_version"] == ACTIVE_SHADOW_CLASSIFIER_VERSION


def test_snapshot_does_not_mutate_score() -> None:
    case = case_strongly_supportive()
    result = calculate_activity_score(
        case["natal"],
        case["transit"],
        case["action_type"],
        scoring_context=case["scoring_context"],
    )
    original = copy.deepcopy(result)
    snapshot = build_day_intelligence_snapshot(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    assert result == original
    assert snapshot.final_score == original["executive"]["score"]


def test_all_case_builders_produce_shadow_comparison() -> None:
    for builder in CASE_BUILDERS:
        _, snapshot = _snapshot_for(builder())
        cmp_ = snapshot.dimension_classification
        assert cmp_.classifier_version == ACTIVE_SHADOW_CLASSIFIER_VERSION
        assert cmp_.executive_score == snapshot.final_score
        assert cmp_.phase2a_class == snapshot.classification.day_class
        assert "command" not in cmp_.model_dump()
