"""Phase 2C.1 semantic validation corpus (experimental shadow).

Synthetic DecisionDimensions plus two live action-type twins.
Does not change classifier rules. Product-intent ``expected_class`` may
diverge from the current 2C label; those rows are documented gaps, not
silent expected-value edits.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

from packages.decision_engine.dimension_classification import DimensionDayClass
from packages.decision_engine.dimension_mapping import DIMENSION_KEYS
from packages.decision_engine.dimensions import DecisionDimension, DecisionDimensions

Family = Literal[
    "high_leverage",
    "action",
    "build",
    "selective",
    "review",
    "mixed",
    "defensive",
    "recovery",
    "insufficient",
    "boundary",
    "context",
]


class DimensionSpec(BaseModel):
    """One corpus dimension. Default = insufficient unknown."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    value: int = 50
    status: Literal["scored", "insufficient"] = "insufficient"
    conflicted: bool = False


class CorpusCase(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    case_id: str
    family: Family
    intent: str
    dimensions: dict[str, DimensionSpec]
    expected_class: DimensionDayClass
    expected_split_signal: bool
    expected_same_dimension_conflict: bool
    expected_veto_dimensions: tuple[str, ...] = ()
    rationale: str
    boundary_tags: tuple[str, ...] = ()
    source: Literal["synthetic", "live"] = "synthetic"
    live_builder: str | None = None
    classifier_divergence: str | None = None


def _insuf() -> DimensionSpec:
    return DimensionSpec()


def _scored(value: int, *, conflicted: bool = False) -> DimensionSpec:
    return DimensionSpec(value=value, status="scored", conflicted=conflicted)


def _dims(**scored: int | DimensionSpec) -> dict[str, DimensionSpec]:
    out: dict[str, DimensionSpec] = {key: _insuf() for key in DIMENSION_KEYS}
    for key, spec in scored.items():
        out[key] = spec if isinstance(spec, DimensionSpec) else _scored(spec)
    return out


def materialize_dimensions(
    spec: dict[str, DimensionSpec],
    *,
    action_type: str = "corpus",
) -> DecisionDimensions:
    payload: dict[str, DecisionDimension] = {}
    for key in DIMENSION_KEYS:
        item = spec[key]
        if item.status == "insufficient":
            payload[key] = DecisionDimension(
                value=50,
                evidence_strength=None,
                status="insufficient",
            )
            continue
        supportive = ("ev.support",) if item.value > 50 or item.conflicted else ()
        caution = ("ev.caution",) if item.value < 50 or item.conflicted else ()
        payload[key] = DecisionDimension(
            value=item.value,
            evidence_strength=0.5,
            status="scored",
            conflicted=item.conflicted,
            supportive_evidence_ids=supportive,
            caution_evidence_ids=caution,
            dominant_evidence_ids=("ev.corpus",),
        )
    return DecisionDimensions(action_type=action_type, **payload)


CORPUS: tuple[CorpusCase, ...] = (
    CorpusCase(
        case_id="HL01_covered_strong_drive",
        family="high_leverage",
        intent="Both drive high, two healthy criticals, pressure not high.",
        dimensions=_dims(
            opportunity=82,
            momentum=80,
            clarity=70,
            stability=68,
            cooperation=66,
            pressure=50,
        ),
        expected_class="high_leverage",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Canonical high_leverage: coverage + no veto.",
        boundary_tags=("strong_drive",),
    ),
    CorpusCase(
        case_id="HL02_drive_exactly_65",
        family="high_leverage",
        intent="HIGH floor: both drive dims at 65 with adequate criticals.",
        dimensions=_dims(
            opportunity=65,
            momentum=65,
            clarity=66,
            stability=66,
        ),
        expected_class="high_leverage",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="65 is HIGH; both HIGH is drive_strong even without 80.",
        boundary_tags=("high_65",),
    ),
    CorpusCase(
        case_id="HL03_one_drive_80_other_mid_50",
        family="high_leverage",
        intent="Opportunity 80 with momentum 50 mid still counts as strong drive.",
        dimensions=_dims(
            opportunity=80,
            momentum=50,
            clarity=70,
            stability=70,
        ),
        expected_class="action",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale=(
            "Product: momentum 50 is not high, so this is action not "
            "high_leverage. Current 2C treats any drive >=80 as strong."
        ),
        boundary_tags=("strong_80",),
        classifier_divergence="current_2c_emits_high_leverage_via_single_80",
    ),
    CorpusCase(
        case_id="AC01_drive_without_critical_coverage",
        family="action",
        intent="Strong drive, zero criticals scored — cannot be high_leverage.",
        dimensions=_dims(opportunity=80, momentum=80, cooperation=70),
        expected_class="action",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="action != high_leverage: critical_dimensions_available=0.",
    ),
    CorpusCase(
        case_id="AC02_one_moderate_critical",
        family="action",
        intent="Good drive plus one non-veto critical is still under-covered.",
        dimensions=_dims(
            opportunity=70,
            momentum=66,
            clarity=60,
            cooperation=70,
        ),
        expected_class="action",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="scored=4 but critical_available=1 < 2.",
    ),
    CorpusCase(
        case_id="AC03_lukewarm_criticals_counted_as_coverage",
        family="action",
        intent="Clarity/stability at 46 (non-veto) currently unlock high_leverage.",
        dimensions=_dims(
            opportunity=80,
            momentum=80,
            clarity=46,
            stability=46,
        ),
        expected_class="action",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale=(
            "Product: 46 is barely not-veto, not healthy coverage. "
            "Current 2C only checks critical count, not quality."
        ),
        boundary_tags=("low_46",),
        classifier_divergence="current_2c_emits_high_leverage_on_lukewarm_criticals",
    ),
    CorpusCase(
        case_id="SE01_high_drive_low_clarity",
        family="selective",
        intent="High opportunity/momentum + low clarity.",
        dimensions=_dims(opportunity=80, momentum=80, clarity=38, cooperation=70),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=("clarity",),
        rationale="Cross-dimension split, not same-dimension conflict.",
    ),
    CorpusCase(
        case_id="SE02_high_drive_low_safety",
        family="selective",
        intent="High drive + low reversibility_safety.",
        dimensions=_dims(
            opportunity=80,
            momentum=80,
            reversibility_safety=35,
            cooperation=70,
        ),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=("reversibility_safety",),
        rationale="Safety veto with strong drive → selective.",
    ),
    CorpusCase(
        case_id="SE03_high_drive_high_pressure",
        family="selective",
        intent="High drive + pressure exactly at veto floor.",
        dimensions=_dims(opportunity=80, momentum=80, pressure=65, cooperation=70),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=("pressure",),
        rationale="Pressure >=65 is cautionary, never supportive.",
        boundary_tags=("pressure_65",),
    ),
    CorpusCase(
        case_id="SE04_multi_veto_split",
        family="selective",
        intent="High drive with several critical vetoes.",
        dimensions=_dims(
            opportunity=90,
            momentum=88,
            clarity=38,
            stability=40,
            reversibility_safety=35,
            cooperation=72,
            pressure=68,
        ),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=(
            "clarity",
            "stability",
            "reversibility_safety",
            "pressure",
        ),
        rationale="Still selective (split), not mixed — no conflicted flag.",
    ),
    CorpusCase(
        case_id="SE05_clarity_exactly_45_is_veto",
        family="selective",
        intent="LOW floor: clarity 45 vetoes; 46 would not.",
        dimensions=_dims(opportunity=80, momentum=80, clarity=45, stability=70),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=("clarity",),
        rationale="<=45 is LOW. Cross-dimension split, not mixed.",
        boundary_tags=("low_45",),
    ),
    CorpusCase(
        case_id="RV01_unpolarized_weak_signal",
        family="review",
        intent="Score-band-like mids with no support or veto.",
        dimensions=_dims(opportunity=56, momentum=55, cooperation=52),
        expected_class="review",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="No HIGH, no LOW, scored>=3 → review_indeterminate.",
    ),
    CorpusCase(
        case_id="RV02_uneven_drive",
        family="review",
        intent="One drive HIGH, the other LOW.",
        dimensions=_dims(opportunity=70, momentum=44, cooperation=60),
        expected_class="review",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Uneven drive is review, not action or mixed.",
        boundary_tags=("low_44",),
    ),
    CorpusCase(
        case_id="RV03_split_without_strong_drive",
        family="review",
        intent="Opp 65 / mom 50 + clarity veto: split but not strong drive.",
        dimensions=_dims(opportunity=65, momentum=50, clarity=40),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=("clarity",),
        rationale=(
            "Product: any high-drive+veto split is selective. "
            "Current 2C requires drive_strong for selective, else review."
        ),
        boundary_tags=("high_65",),
        classifier_divergence="current_2c_emits_review_for_weak_split",
    ),
    CorpusCase(
        case_id="RV04_drive_just_below_high",
        family="review",
        intent="Both drive at 64: not HIGH, not LOW, no veto.",
        dimensions=_dims(opportunity=64, momentum=64, cooperation=60),
        expected_class="review",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="64 is below HIGH floor; compare HL02 at 65.",
        boundary_tags=("high_64",),
    ),
    CorpusCase(
        case_id="MX01_drive_conflict_near_50",
        family="mixed",
        intent="Same-dimension conflict on opportunity at numeric 50.",
        dimensions=_dims(
            opportunity=_scored(50, conflicted=True),
            momentum=70,
            cooperation=60,
        ),
        expected_class="mixed",
        expected_split_signal=False,
        expected_same_dimension_conflict=True,
        rationale="conflicted=true is mixed even when value is baseline 50.",
    ),
    CorpusCase(
        case_id="MX02_critical_conflict_preempts_split",
        family="mixed",
        intent="High drive + conflicted clarity: local conflict vs split.",
        dimensions=_dims(
            opportunity=80,
            momentum=80,
            clarity=_scored(40, conflicted=True),
            cooperation=70,
        ),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=True,
        expected_veto_dimensions=("clarity",),
        rationale=(
            "Product: still a split-signal day with local conflict metadata. "
            "Current 2C returns mixed first (conflict before split)."
        ),
        classifier_divergence="current_2c_mixed_preempts_selective_on_conflict",
    ),
    CorpusCase(
        case_id="MX03_cross_dimension_is_not_mixed",
        family="mixed",
        intent="High drive + low stability without conflicted flag.",
        dimensions=_dims(opportunity=80, momentum=80, stability=37, cooperation=70),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=("stability",),
        rationale="Cross-dimension tension must not become mixed.",
    ),
    CorpusCase(
        case_id="MX04_cooperation_conflict_ignored",
        family="mixed",
        intent="Conflict only on cooperation (not a CONFLICT_KEY).",
        dimensions=_dims(
            opportunity=70,
            momentum=70,
            cooperation=_scored(55, conflicted=True),
        ),
        expected_class="mixed",
        expected_split_signal=False,
        expected_same_dimension_conflict=True,
        rationale=(
            "Product: same-dimension conflict should be mixed. "
            "Current 2C ignores cooperation.conflicted."
        ),
        classifier_divergence="current_2c_ignores_cooperation_conflict",
    ),
    CorpusCase(
        case_id="DF01_high_pressure_poor_stability",
        family="defensive",
        intent="Low drive, high pressure, poor stability.",
        dimensions=_dims(
            opportunity=36,
            momentum=38,
            stability=31,
            pressure=80,
            reversibility_safety=33,
        ),
        expected_class="defensive",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=(
            "stability",
            "reversibility_safety",
            "pressure",
        ),
        rationale="No high drive override.",
    ),
    CorpusCase(
        case_id="DF02_low_forward_without_pressure_veto",
        family="defensive",
        intent="Two+ forward LOWs, pressure mid (not relief).",
        dimensions=_dims(
            opportunity=40,
            momentum=39,
            cooperation=44,
            pressure=50,
        ),
        expected_class="defensive",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="defensive_low_drive; pressure 50 is not relief (<=45).",
        boundary_tags=("low_44",),
    ),
    CorpusCase(
        case_id="RC01_low_drive_pressure_relief_stable",
        family="recovery",
        intent="Low forward drive, pressure relief, stability acceptable.",
        dimensions=_dims(
            opportunity=36,
            momentum=38,
            stability=60,
            pressure=40,
            cooperation=44,
        ),
        expected_class="recovery",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Recovery is relief+stability, not merely a low score.",
    ),
    CorpusCase(
        case_id="RC02_low_executive_score_does_not_create_recovery",
        family="recovery",
        intent="High drive / no veto with dummy executive_score=10.",
        dimensions=_dims(opportunity=80, momentum=80, cooperation=70),
        expected_class="action",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Score 10 must not produce recovery; class follows dimensions.",
    ),
    CorpusCase(
        case_id="IN01_zero_scored",
        family="insufficient",
        intent="No scored dimensions.",
        dimensions=_dims(),
        expected_class="insufficient",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Unknown, not neutral 50.",
    ),
    CorpusCase(
        case_id="IN02_opportunity_alone",
        family="insufficient",
        intent="Single scored dimension (opportunity 90).",
        dimensions=_dims(opportunity=90),
        expected_class="insufficient",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Must not classify from opportunity alone.",
    ),
    CorpusCase(
        case_id="IN03_two_unpolarized_mids",
        family="insufficient",
        intent="Two scored baseline-ish mids, no polarity.",
        dimensions=_dims(opportunity=50, momentum=50),
        expected_class="insufficient",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="scored<=2 and unpolarized → insufficient.",
    ),
    CorpusCase(
        case_id="IN04_insufficient_50_not_neutral_veto",
        family="insufficient",
        intent="Criticals left insufficient at display 50 must not veto.",
        dimensions=_dims(opportunity=80, momentum=80, cooperation=70),
        expected_class="action",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Clarity/stability/safety remain unknown, not LOW.",
    ),
    CorpusCase(
        case_id="BD01_clarity_46_not_veto",
        family="boundary",
        intent="Clarity 46 with strong drive and one other critical.",
        dimensions=_dims(
            opportunity=80,
            momentum=80,
            clarity=46,
            stability=70,
        ),
        expected_class="high_leverage",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="46 is not LOW; pair with SE05 (clarity 45 → selective).",
        boundary_tags=("low_46",),
    ),
    CorpusCase(
        case_id="BD02_pressure_64_not_veto",
        family="boundary",
        intent="Pressure 64 is below veto; 65 is veto (SE03).",
        dimensions=_dims(
            opportunity=80,
            momentum=80,
            pressure=64,
            stability=70,
            clarity=70,
        ),
        expected_class="high_leverage",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="Pressure HIGH veto is >=65, so 64 is not cautionary-high.",
        boundary_tags=("pressure_64", "strong_80"),
    ),
    CorpusCase(
        case_id="BD03_drive_80_vs_79_with_mid_momentum",
        family="boundary",
        intent="Opp 79 + mom 50 is not strong; opp 80 + mom 50 is (HL03).",
        dimensions=_dims(
            opportunity=79,
            momentum=50,
            clarity=70,
            stability=70,
        ),
        expected_class="action",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale="79<80 and mom not HIGH → drive_high but not drive_strong.",
        boundary_tags=("strong_79",),
    ),
    CorpusCase(
        case_id="CTX01_business_launch_same_chart",
        family="context",
        intent="Same chart as rest_recovery; business_launch contributions.",
        dimensions=_dims(),
        expected_class="selective",
        expected_split_signal=True,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=(
            "clarity",
            "stability",
            "reversibility_safety",
        ),
        rationale="Existing activity weights, not a new context heuristic.",
        source="live",
        live_builder="case_action_type_business_launch",
    ),
    CorpusCase(
        case_id="CTX02_rest_recovery_same_chart",
        family="context",
        intent="Same raw chart; rest_recovery contributions change class.",
        dimensions=_dims(),
        expected_class="review",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        expected_veto_dimensions=("stability",),
        rationale="House 12 / planet weights already in contribution.",
        source="live",
        live_builder="case_action_type_rest_recovery",
    ),
)


assert 24 <= len(CORPUS) <= 32
assert len({case.case_id for case in CORPUS}) == len(CORPUS)

# Phase 2C.2: dedicated BUILD probes. Kept out of the frozen 32-case corpus.
BUILD_CORPUS: tuple[CorpusCase, ...] = (
    CorpusCase(
        case_id="BUILD01_constructive_drive_covered_support",
        family="build",
        intent="Drive constructive (below HIGH) with covered HIGH support dims.",
        dimensions=_dims(
            opportunity=58,
            momentum=60,
            clarity=68,
            stability=66,
            cooperation=70,
        ),
        expected_class="build",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale=(
            "BUILD: broadly supportive, no veto, drive 46-64, scored>=4, "
            "two criticals, at least one non-drive HIGH. Distinct from ACTION "
            "(drive not HIGH) and REVIEW (not unpolarized)."
        ),
    ),
    CorpusCase(
        case_id="BUILD02_drive_64_just_below_action",
        family="build",
        intent="Both drive at 64 with healthy criticals — below ACTION floor.",
        dimensions=_dims(
            opportunity=64,
            momentum=64,
            clarity=70,
            stability=68,
            pressure=50,
        ),
        expected_class="build",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale=(
            "64 is not HIGH so this is not ACTION. Covered support HIGH makes "
            "BUILD rather than RV04-style unpolarized review."
        ),
        boundary_tags=("high_64",),
    ),
    CorpusCase(
        case_id="BUILD03_sparse_cooperation_high_is_not_build",
        family="build",
        intent="Constructive drive plus one HIGH cooperation is still sparse.",
        dimensions=_dims(opportunity=58, momentum=60, cooperation=70),
        expected_class="review",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale=(
            "Product: BUILD needs adequate coverage, not a single HIGH support. "
            "Current 2C emits build from any supportive HIGH with no veto."
        ),
        classifier_divergence="current_2c_emits_build_on_sparse_support",
    ),
    CorpusCase(
        case_id="BUILD04_covered_mids_without_support_high",
        family="build",
        intent="Constructive drive and two mid criticals, no HIGH support.",
        dimensions=_dims(
            opportunity=58,
            momentum=60,
            clarity=50,
            stability=52,
        ),
        expected_class="review",
        expected_split_signal=False,
        expected_same_dimension_conflict=False,
        rationale=(
            "Coverage alone is not BUILD. Unpolarized mids stay review. "
            "Proves BUILD is not 'any non-action covered day'."
        ),
    ),
)

assert len({case.case_id for case in BUILD_CORPUS}) == len(BUILD_CORPUS)
EXTENDED_CORPUS: tuple[CorpusCase, ...] = CORPUS + BUILD_CORPUS
assert len({case.case_id for case in EXTENDED_CORPUS}) == len(EXTENDED_CORPUS)

LIVE_BUILDERS = {
    "case_action_type_business_launch",
    "case_action_type_rest_recovery",
}


def corpus_by_id() -> dict[str, CorpusCase]:
    return {case.case_id: case for case in CORPUS}


__all__ = [
    "BUILD_CORPUS",
    "CORPUS",
    "EXTENDED_CORPUS",
    "CorpusCase",
    "DimensionSpec",
    "LIVE_BUILDERS",
    "corpus_by_id",
    "materialize_dimensions",
]
