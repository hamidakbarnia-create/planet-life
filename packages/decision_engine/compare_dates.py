"""Deterministic multi-date ranking for COMPARE (EPIC-001 T09).

Ranks scored options without assembling N independent evaluation packages.
Sort keys: score desc → date asc → option_id asc.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

# Absolute score gap below which rank-1 is not a unique preferred winner.
COMPARE_TIE_EPSILON = 2.0


@dataclass(frozen=True, slots=True)
class ScoredCompareOption:
    option_id: str
    label: str
    date: str
    score: float
    band: str
    strengths: tuple[str, ...] = ()
    risks: tuple[str, ...] = ()
    assessment: dict | None = None


@dataclass(frozen=True, slots=True)
class RankedCompareOption:
    option_id: str
    label: str
    date: str
    score: float
    band: str
    rank: int
    strengths: tuple[str, ...] = ()
    risks: tuple[str, ...] = ()
    assessment: dict | None = None


@dataclass(frozen=True, slots=True)
class CompareRankingResult:
    ranked: tuple[RankedCompareOption, ...]
    unique_winner: bool
    tied_option_ids: tuple[str, ...]
    score_vs_class_disagreements: tuple[dict, ...] = ()
    policy_pairs: tuple[dict, ...] = ()
    explanations: tuple[dict, ...] = ()


def rank_compare_options(
    options: Sequence[ScoredCompareOption],
    *,
    tie_epsilon: float = COMPARE_TIE_EPSILON,
) -> CompareRankingResult:
    """Deterministically rank scored options and detect effective ties."""
    if len(options) < 2:
        raise ValueError("compare ranking requires at least two options")

    ordered = sorted(
        options,
        key=lambda item: (-float(item.score), item.date, item.option_id),
    )
    ranked = tuple(
        RankedCompareOption(
            option_id=item.option_id,
            label=item.label,
            date=item.date,
            score=float(item.score),
            band=item.band,
            rank=index + 1,
            strengths=item.strengths,
            risks=item.risks,
            assessment=item.assessment,
        )
        for index, item in enumerate(ordered)
    )

    top = ranked[0]
    tied = [
        item.option_id
        for item in ranked
        if abs(item.score - top.score) <= tie_epsilon
    ]
    unique_winner = len(tied) == 1
    from packages.decision_engine.decision_assessment import (
        score_class_disagreements,
        shadow_dimension_class,
    )

    disagreements = score_class_disagreements(
        [
            {
                "id": item.option_id,
                "score": item.score,
                "dimension_class": shadow_dimension_class(item.assessment),
            }
            for item in ranked
            if item.assessment
        ]
    )
    from packages.decision_engine.semantic_policy import compare_policy_pairs
    from packages.decision_engine.semantic_explanation import explain_compare_pairs

    rows = [
        {
            "id": item.option_id,
            "option_id": item.option_id,
            "score": item.score,
            "assessment": item.assessment or {},
            "dimension_class": shadow_dimension_class(item.assessment),
        }
        for item in ranked
    ]
    pairs = compare_policy_pairs(rows)
    explanations = explain_compare_pairs(rows, pairs)
    return CompareRankingResult(
        ranked=ranked,
        unique_winner=unique_winner,
        tied_option_ids=tuple(tied),
        score_vs_class_disagreements=disagreements,
        policy_pairs=pairs,
        explanations=explanations,
    )


__all__ = [
    "COMPARE_TIE_EPSILON",
    "CompareRankingResult",
    "RankedCompareOption",
    "ScoredCompareOption",
    "rank_compare_options",
]
