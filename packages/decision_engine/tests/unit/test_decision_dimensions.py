"""Phase 2B: DecisionDimensions from DecisionEvidence (not executive.score)."""

from __future__ import annotations

import copy
import inspect

from packages.astro_engine.scoring import calculate_activity_score
from packages.decision_engine.day_classification import classify_day
from packages.decision_engine.day_intelligence_models import (
    build_day_intelligence_snapshot,
)
from packages.decision_engine.dimension_mapping import (
    BODY_DIMENSION_WEIGHTS,
    DIMENSION_BASELINE,
    DIMENSION_KEYS,
    IGNORED_TEMPORAL_FIELDS,
    MAPPING_VERSION,
    NATAL_TARGET_DIMENSION_WEIGHTS,
    SEMANTIC_STATUS,
)
from packages.decision_engine.dimensions import (
    compute_decision_dimensions,
)
from packages.decision_engine.evidence import DecisionEvidence, polarity_from_contribution
from packages.decision_engine.tests.fixtures.calendar_score_cases import (
    case_action_type_business_launch,
    case_action_type_rest_recovery,
    case_angular_contact,
    case_close_exact_aspect,
    case_mixed_conflicting,
    case_retrograde_penalty,
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


def _snapshot_for(case: dict):
    result = calculate_activity_score(
        case["natal"],
        case["transit"],
        case["action_type"],
        scoring_context=case["scoring_context"],
    )
    return result, build_day_intelligence_snapshot(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )


def test_a_strong_support_raises_opportunity_and_momentum() -> None:
    evidence = (
        _evidence(
            contribution=12.0,
            factor_key="aspect.jupiter.trine.sun",
            transit_body="jupiter",
            natal_target="sun",
            aspect_type="trine",
        ),
        _evidence(
            contribution=8.0,
            factor_key="aspect.mars.sextile.sun",
            transit_body="mars",
            natal_target="sun",
            aspect_type="sextile",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    assert dims.opportunity.value > DIMENSION_BASELINE
    assert dims.momentum.value > DIMENSION_BASELINE
    assert dims.opportunity.status == "scored"
    assert dims.momentum.status == "scored"


def test_b_caution_can_cut_clarity_while_opportunity_stays_high() -> None:
    evidence = (
        _evidence(
            contribution=18.0,
            factor_key="aspect.jupiter.trine.sun",
            transit_body="jupiter",
            natal_target="sun",
            aspect_type="trine",
        ),
        _evidence(
            contribution=12.0,
            factor_key="aspect.mars.sextile.sun",
            transit_body="mars",
            natal_target="sun",
            aspect_type="sextile",
        ),
        _evidence(
            contribution=-10.0,
            factor_key="aspect.neptune.square.mercury",
            transit_body="neptune",
            natal_target="mercury",
            aspect_type="square",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    assert dims.opportunity.value > 70
    assert dims.momentum.value > DIMENSION_BASELINE
    assert dims.clarity.value < DIMENSION_BASELINE
    assert dims.reversibility_safety.value < DIMENSION_BASELINE
    assert dims.opportunity.value > dims.clarity.value
    assert dims.clarity.caution_evidence_ids
    assert dims.reversibility_safety.caution_evidence_ids
    assert not dims.opportunity.caution_evidence_ids


def test_c_mixed_evidence_survives_as_conflict() -> None:
    """Conflict is per-dimension: both polarities must map to the same key."""
    evidence = (
        _evidence(
            contribution=12.0,
            factor_key="aspect.jupiter.trine.sun",
            transit_body="jupiter",
            natal_target="sun",
        ),
        _evidence(
            contribution=-8.0,
            factor_key="aspect.mars.square.sun",
            transit_body="mars",
            natal_target="sun",
            aspect_type="square",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    assert dims.opportunity.conflicted is True
    assert dims.momentum.conflicted is True
    assert dims.opportunity.supportive_evidence_ids
    assert dims.opportunity.caution_evidence_ids
    assert dims.opportunity.value != DIMENSION_BASELINE or dims.opportunity.conflicted
    # Numeric value may sit near 50; provenance and conflict remain.
    assert "ev.aspect.jupiter.trine.sun" in dims.opportunity.supportive_evidence_ids
    assert "ev.aspect.mars.square.sun" in dims.opportunity.caution_evidence_ids


def test_d_one_executive_score_does_not_force_identical_dimensions() -> None:
    evidence = (
        _evidence(
            contribution=12.0,
            factor_key="aspect.jupiter.trine.sun",
            transit_body="jupiter",
            natal_target="sun",
        ),
        _evidence(
            contribution=-10.0,
            factor_key="aspect.neptune.conjunction.mercury",
            transit_body="neptune",
            natal_target="mercury",
            aspect_type="conjunction",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    values = list(dims.as_value_map().values())
    assert len(set(values)) > 1
    assert dims.opportunity.value != dims.clarity.value


def test_e_identical_evidence_produces_identical_dimensions() -> None:
    evidence = (
        _evidence(
            contribution=6.0,
            factor_key="aspect.venus.sextile.moon",
            transit_body="venus",
            natal_target="moon",
        ),
    )
    first = compute_decision_dimensions(evidence)
    second = compute_decision_dimensions(evidence)
    assert first == second


def test_f_evidence_ordering_does_not_change_results() -> None:
    a = _evidence(
        contribution=9.0,
        factor_key="aspect.jupiter.trine.sun",
        transit_body="jupiter",
        natal_target="sun",
    )
    b = _evidence(
        contribution=-5.0,
        factor_key="aspect.neptune.square.mercury",
        transit_body="neptune",
        natal_target="mercury",
    )
    c = _evidence(
        contribution=4.5,
        factor_key="retrograde.mercury",
        kind="retrograde",
        transit_body="mercury",
        retrograde=True,
    )
    forward = compute_decision_dimensions((a, b, c))
    reversed_order = compute_decision_dimensions((c, b, a))
    assert forward == reversed_order


def test_g_missing_evidence_is_insufficient_not_invented_strength() -> None:
    dims = compute_decision_dimensions(())
    assert dims.semantic_status == SEMANTIC_STATUS
    assert dims.mapping_version == MAPPING_VERSION
    for key in DIMENSION_KEYS:
        dim = getattr(dims, key)
        assert dim.value == DIMENSION_BASELINE
        assert dim.evidence_strength is None
        assert dim.status == "insufficient"
        assert dim.supportive_evidence_ids == ()
        assert dim.caution_evidence_ids == ()
        assert dim.conflicted is False
        dumped = dim.model_dump()
        assert "confidence" not in dumped
        # Baseline 50 is numeric compatibility, not neutral evidence.
        assert dim.status == "insufficient"


def test_h_executive_score_remains_unchanged() -> None:
    result, snapshot = _snapshot_for(case_mixed_conflicting())
    assert snapshot.final_score == result["executive"]["score"]
    assert snapshot.classification.score == snapshot.final_score
    assert snapshot.dimensions.mapping_version == MAPPING_VERSION
    assert snapshot.dimensions.semantic_status == SEMANTIC_STATUS
    dumped = snapshot.dimensions.model_dump()
    assert "command" not in dumped
    assert dumped["semantic_status"] == "experimental_shadow"
    assert "confidence" not in dumped["opportunity"]
    assert "evidence_strength" in dumped["opportunity"]
    assert snapshot.final_score == result["strategic"]["component_breakdown"]["final_score"]


def test_i_non_neutral_changes_trace_to_evidence_ids() -> None:
    evidence = (
        _evidence(
            contribution=11.0,
            factor_key="aspect.mars.trine.jupiter",
            transit_body="mars",
            natal_target="jupiter",
        ),
        _evidence(
            contribution=-7.0,
            factor_key="aspect.neptune.square.mercury",
            transit_body="neptune",
            natal_target="mercury",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    known_ids = {item.evidence_id for item in evidence}
    for key in DIMENSION_KEYS:
        dim = getattr(dims, key)
        if dim.value == DIMENSION_BASELINE and dim.status == "insufficient":
            continue
        if dim.value != DIMENSION_BASELINE:
            traced = set(dim.supportive_evidence_ids) | set(dim.caution_evidence_ids)
            assert traced, f"{key} moved off baseline without evidence ids"
            assert traced <= known_ids


def test_j_unsupported_temporal_fields_do_not_affect_dimensions() -> None:
    base = _evidence(
        contribution=8.0,
        factor_key="aspect.jupiter.trine.sun",
        transit_body="jupiter",
        natal_target="sun",
    )
    mutated = base.model_copy(
        update={
            "applying_or_separating": "applying",
            "station_state": "direct",
            "speed_class": "fast",
            "duration_class": "brief",
            "orb_strength": 0.99,
        }
    )
    assert compute_decision_dimensions((base,)) == compute_decision_dimensions(
        (mutated,)
    )
    source = inspect.getsource(compute_decision_dimensions)
    for field in IGNORED_TEMPORAL_FIELDS:
        assert field not in source


def test_pressure_inverts_polarity_but_keeps_polarity_provenance() -> None:
    caution = (
        _evidence(
            contribution=-8.0,
            factor_key="aspect.saturn.square.sun",
            transit_body="saturn",
            natal_target="sun",
        ),
    )
    dims = compute_decision_dimensions(caution)
    assert dims.pressure.value > DIMENSION_BASELINE
    assert dims.pressure.caution_evidence_ids
    assert not dims.pressure.supportive_evidence_ids
    assert dims.stability.value < DIMENSION_BASELINE


def test_compute_signature_has_no_score_parameter() -> None:
    params = inspect.signature(compute_decision_dimensions).parameters
    assert "final_score" not in params
    assert "score" not in params
    assert "executive" not in params


def test_golden_strongly_supportive_dimensions() -> None:
    result, snapshot = _snapshot_for(case_strongly_supportive())
    assert snapshot.final_score == result["executive"]["score"]
    assert snapshot.dimensions.opportunity.value > DIMENSION_BASELINE
    assert snapshot.dimensions.momentum.value > DIMENSION_BASELINE
    values = snapshot.dimensions.as_value_map()
    assert len(set(values.values())) >= 1


def test_golden_strongly_adverse_dimensions() -> None:
    result, snapshot = _snapshot_for(case_strongly_adverse())
    assert snapshot.final_score == result["executive"]["score"]
    assert snapshot.dimensions.opportunity.value < DIMENSION_BASELINE
    assert snapshot.dimensions.pressure.value > DIMENSION_BASELINE


def test_golden_mixed_conflict_dimensions() -> None:
    """Jupiter support and Saturn caution coexist on different dimensions.

    After natal-target hardening they no longer falsely conflict on
    opportunity via natal Sun. 2A global conflict remains.
    """
    _, snapshot = _snapshot_for(case_mixed_conflicting())
    assert snapshot.classification.conflict is True
    assert snapshot.classification.day_class == "mixed"
    assert snapshot.dimensions.opportunity.status == "scored"
    assert any(
        "jupiter" in eid
        for eid in snapshot.dimensions.opportunity.supportive_evidence_ids
    )
    assert not any(
        "saturn" in eid for eid in snapshot.dimensions.opportunity.caution_evidence_ids
    )
    assert snapshot.dimensions.opportunity.conflicted is False
    assert snapshot.dimensions.stability.caution_evidence_ids
    assert snapshot.dimensions.pressure.value > DIMENSION_BASELINE
    assert snapshot.dimensions.stability.value < DIMENSION_BASELINE


def test_natal_sun_target_does_not_inherit_sun_opportunity_mapping() -> None:
    """Saturn square natal Sun uses Saturn routing only — not Sun opportunity."""
    evidence = (
        _evidence(
            contribution=-8.0,
            factor_key="aspect.saturn.square.sun",
            transit_body="saturn",
            natal_target="sun",
            aspect_type="square",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    saturn_id = "ev.aspect.saturn.square.sun"
    assert dims.stability.value < DIMENSION_BASELINE
    assert dims.pressure.value > DIMENSION_BASELINE
    assert dims.reversibility_safety.value < DIMENSION_BASELINE
    assert dims.clarity.value < DIMENSION_BASELINE
    assert saturn_id in dims.stability.caution_evidence_ids
    assert dims.opportunity.status == "insufficient"
    assert dims.opportunity.value == DIMENSION_BASELINE
    assert dims.opportunity.evidence_strength is None
    assert dims.opportunity.caution_evidence_ids == ()
    assert dims.momentum.status == "insufficient"
    assert dims.momentum.value == DIMENSION_BASELINE
    assert dims.momentum.evidence_strength is None
    assert dims.cooperation.status == "insufficient"


def test_natal_mercury_does_not_upgrade_saturn_clarity_weight() -> None:
    """Natal Mercury must not replace Saturn's 0.4 clarity weight with 1.0."""
    evidence = (
        _evidence(
            contribution=-10.0,
            factor_key="aspect.saturn.square.mercury",
            transit_body="saturn",
            natal_target="mercury",
            aspect_type="square",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    assert dims.clarity.value == round(DIMENSION_BASELINE + (-10.0 * 0.4))
    assert dims.reversibility_safety.value == round(DIMENSION_BASELINE + (-10.0 * 0.5))
    # Mercury generic mapping would have been clarity 1.0 / safety 0.5.
    assert dims.clarity.value != round(DIMENSION_BASELINE - 10.0)


def test_natal_target_table_is_explicit_and_does_not_copy_generic_bodies() -> None:
    assert NATAL_TARGET_DIMENSION_WEIGHTS == {}
    for body, rows in NATAL_TARGET_DIMENSION_WEIGHTS.items():
        assert rows != BODY_DIMENSION_WEIGHTS[body]


def test_natal_house_without_transit_body_is_insufficient() -> None:
    evidence = (
        _evidence(
            kind="house",
            contribution=4.0,
            factor_key="house.natal.sun.10",
            natal_target="sun",
            house=10,
            house_scope="natal",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    assert dims.opportunity.status == "insufficient"
    assert dims.opportunity.evidence_strength is None
    assert dims.momentum.status == "insufficient"


def test_kind_overlay_still_applies_without_natal_target_body_map() -> None:
    evidence = (
        _evidence(
            kind="retrograde",
            contribution=-2.5,
            factor_key="retrograde.mars",
            transit_body="mars",
            natal_target=None,
            retrograde=True,
        ),
    )
    dims = compute_decision_dimensions(evidence)
    assert dims.reversibility_safety.status == "scored"
    assert dims.clarity.status == "scored"
    # Mars transit still maps momentum/opportunity/pressure; kind adds safety.
    assert dims.momentum.status == "scored"


def test_conflict_near_baseline_keeps_provenance() -> None:
    evidence = (
        _evidence(
            contribution=8.0,
            factor_key="aspect.jupiter.trine.sun",
            transit_body="jupiter",
            natal_target="sun",
        ),
        _evidence(
            contribution=-16.0,
            factor_key="aspect.mars.square.sun",
            transit_body="mars",
            natal_target="sun",
            aspect_type="square",
        ),
    )
    dims = compute_decision_dimensions(evidence)
    assert dims.opportunity.value == DIMENSION_BASELINE
    assert dims.opportunity.conflicted is True
    assert dims.opportunity.supportive_evidence_ids
    assert dims.opportunity.caution_evidence_ids
    assert dims.opportunity.status == "scored"
    assert dims.opportunity.evidence_strength is not None


def test_shadow_metadata_is_explicit() -> None:
    dims = compute_decision_dimensions(())
    assert dims.mapping_version == "dimensions.v1-shadow"
    assert dims.semantic_status == "experimental_shadow"
    payload = dims.model_dump()
    assert payload["semantic_status"] == "experimental_shadow"
    assert "command" not in payload
    assert "day_class" not in payload


def test_golden_action_type_changes_dimensions_via_existing_contribution() -> None:
    _, launch = _snapshot_for(case_action_type_business_launch())
    _, rest = _snapshot_for(case_action_type_rest_recovery())
    assert launch.action_type != rest.action_type
    assert launch.dimensions.as_value_map() != rest.dimensions.as_value_map()
    assert launch.final_score != rest.final_score


def test_golden_retrograde_and_angular_use_kind_overlays() -> None:
    _, retro = _snapshot_for(case_retrograde_penalty())
    _, angular = _snapshot_for(case_angular_contact())
    assert retro.dimensions.reversibility_safety.status == "scored"
    assert any(item.kind == "retrograde" for item in retro.evidence)
    assert angular.dimensions.momentum.status == "scored"
    assert any(item.kind == "angular" for item in angular.evidence)


def test_no_commands_on_dimensions_or_payload() -> None:
    _, snapshot = _snapshot_for(case_close_exact_aspect())
    payload = snapshot.dimensions.model_dump()
    for banned in (
        "command",
        "ACT",
        "VERIFY",
        "REVIEW",
        "WAIT",
        "NEGOTIATE",
        "PROTECT",
        "COMMIT_WITH_CAUTION",
    ):
        assert banned not in payload
    assert payload["semantic_status"] == "experimental_shadow"
    assert "confidence" not in payload["opportunity"]
    assert snapshot.classification.score == snapshot.final_score


def test_provisional_class_can_disagree_with_dimension_spread() -> None:
    """2A score-band class is shadow; dimensions may diverge. Not a failure."""
    _, mixed = _snapshot_for(case_mixed_conflicting())
    values = list(mixed.dimensions.as_value_map().values())
    assert len(set(values)) > 1
    class_from_score = classify_day(
        final_score=mixed.final_score,
        evidence=mixed.evidence,
    )
    assert class_from_score.day_class == mixed.classification.day_class
    # Score-band collapse vs type-sensitive dimensions is the 2C question.
    assert mixed.dimensions.opportunity.value != mixed.dimensions.clarity.value or (
        mixed.dimensions.opportunity.conflicted
        or mixed.dimensions.clarity.conflicted
    )


def test_snapshot_does_not_mutate_engine_result() -> None:
    case = case_strongly_supportive()
    result = calculate_activity_score(
        case["natal"],
        case["transit"],
        case["action_type"],
        scoring_context=case["scoring_context"],
    )
    original = copy.deepcopy(result)
    build_day_intelligence_snapshot(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        scoring_context=case["scoring_context"],
    )
    assert result == original
