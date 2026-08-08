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


@dataclass(frozen=True, slots=True)
class CompareRankingResult:
    ranked: tuple[RankedCompareOption, ...]
    unique_winner: bool
    tied_option_ids: tuple[str, ...]


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
    return CompareRankingResult(
        ranked=ranked,
        unique_winner=unique_winner,
        tied_option_ids=tuple(tied),
    )


__all__ = [
    "COMPARE_TIE_EPSILON",
    "CompareRankingResult",
    "RankedCompareOption",
    "ScoredCompareOption",
    "rank_compare_options",
]
