"""Deterministic FIND window generation for date-range scans.

Eligibility consumes the existing package candidate band ``high``, which is
already the canonical mapping for Favorable / Highly Favorable ratings from
``astro_engine.scoring._rating`` (≥65 Favorable, ≥80 Highly Favorable) via
``score_to_candidate_band`` / ``rating_to_candidate_band``.

FIND does not invent a numeric cutoff. Contiguous eligible days become
windows. Strength is the window peak score — not an average. Ordering and
ties are explicit. Empty results are honest when no Favorable+ days exist.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Sequence

from packages.decision_engine.evaluate.runtime_common import (
    score_to_candidate_band,
)

# Same absolute score gap philosophy as COMPARE: tiny deltas are not winners.
FIND_TIE_EPSILON = 2.0
FIND_MIN_RANGE_DAYS = 7
FIND_MAX_RANGE_DAYS = 90
FIND_MAX_WINDOWS = 5
# Canonical package band for Favorable / Highly Favorable (pre-FIND).
FIND_ELIGIBLE_BAND = "high"


@dataclass(frozen=True, slots=True)
class ScoredFindDay:
    day: date
    score: float
    band: str
    strengths: tuple[str, ...] = ()
    risks: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class FindWindow:
    window_id: str
    start_date: date
    end_date: date
    peak_dates: tuple[date, ...]
    peak_score: float
    band: str
    rank: int
    strengths: tuple[str, ...] = ()
    risks: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class FindWindowResult:
    windows: tuple[FindWindow, ...]
    unique_dominant: bool
    tied_window_ids: tuple[str, ...]


def inclusive_day_count(range_start: date, range_end: date) -> int:
    return (range_end - range_start).days + 1


def validate_find_range(range_start: date, range_end: date) -> None:
    if range_start > range_end:
        raise ValueError("range_start must be <= range_end")
    days = inclusive_day_count(range_start, range_end)
    if days < FIND_MIN_RANGE_DAYS:
        raise ValueError(
            f"find range requires at least {FIND_MIN_RANGE_DAYS} inclusive days"
        )
    if days > FIND_MAX_RANGE_DAYS:
        raise ValueError(
            f"find range allows at most {FIND_MAX_RANGE_DAYS} inclusive days"
        )


def iter_inclusive_dates(range_start: date, range_end: date):
    validate_find_range(range_start, range_end)
    current = range_start
    while current <= range_end:
        yield current
        current += timedelta(days=1)


def is_find_eligible_band(band: str) -> bool:
    """True only for the canonical Favorable+ package band."""
    return band == FIND_ELIGIBLE_BAND


def is_find_eligible_score(score: float) -> bool:
    """Eligibility via existing ``score_to_candidate_band`` — not a FIND cutoff."""
    return score_to_candidate_band(score) == FIND_ELIGIBLE_BAND


def _is_eligible(day: ScoredFindDay) -> bool:
    return is_find_eligible_band(day.band)


def _window_id(start: date, end: date) -> str:
    return f"w-{start.isoformat()}-{end.isoformat()}"


def _build_window(
    days: Sequence[ScoredFindDay],
    *,
    rank: int,
) -> FindWindow:
    peak_score = max(float(item.score) for item in days)
    # Exact peak membership — not epsilon — so peak_dates are the true max days.
    peak_dates = tuple(
        sorted(item.day for item in days if float(item.score) == peak_score)
    )
    peak_day = next(item for item in days if item.day == peak_dates[0])
    return FindWindow(
        window_id=_window_id(days[0].day, days[-1].day),
        start_date=days[0].day,
        end_date=days[-1].day,
        peak_dates=peak_dates,
        peak_score=round(peak_score),  # integer presentation; no fake decimals
        band=peak_day.band,
        rank=rank,
        strengths=peak_day.strengths[:3],
        risks=peak_day.risks[:3],
    )


def group_contiguous_windows(
    days: Sequence[ScoredFindDay],
) -> tuple[FindWindow, ...]:
    """Merge adjacent eligible days; ignore non-eligible gaps."""
    eligible = [item for item in sorted(days, key=lambda d: d.day) if _is_eligible(item)]
    if not eligible:
        return ()

    clusters: list[list[ScoredFindDay]] = []
    current: list[ScoredFindDay] = [eligible[0]]
    for item in eligible[1:]:
        if item.day == current[-1].day + timedelta(days=1):
            current.append(item)
        else:
            clusters.append(current)
            current = [item]
    clusters.append(current)

    # Provisional ranks; final ranking reassigns.
    return tuple(
        _build_window(cluster, rank=index + 1)
        for index, cluster in enumerate(clusters)
    )


def rank_find_windows(
    windows: Sequence[FindWindow],
    *,
    tie_epsilon: float = FIND_TIE_EPSILON,
    max_windows: int = FIND_MAX_WINDOWS,
) -> FindWindowResult:
    """Order windows and detect effective dominance ties.

    Sort keys (deterministic):
    1. peak_score descending
    2. start_date ascending
    3. end_date ascending
    4. window_id ascending
    """
    ordered = sorted(
        windows,
        key=lambda item: (
            -float(item.peak_score),
            item.start_date,
            item.end_date,
            item.window_id,
        ),
    )[:max_windows]

    ranked = tuple(
        FindWindow(
            window_id=item.window_id,
            start_date=item.start_date,
            end_date=item.end_date,
            peak_dates=item.peak_dates,
            peak_score=item.peak_score,
            band=item.band,
            rank=index + 1,
            strengths=item.strengths,
            risks=item.risks,
        )
        for index, item in enumerate(ordered)
    )

    if not ranked:
        return FindWindowResult(windows=(), unique_dominant=False, tied_window_ids=())

    top = ranked[0]
    tied = tuple(
        item.window_id
        for item in ranked
        if abs(float(item.peak_score) - float(top.peak_score)) <= tie_epsilon
    )
    return FindWindowResult(
        windows=ranked,
        unique_dominant=len(tied) == 1,
        tied_window_ids=tied,
    )


def build_find_windows(
    days: Sequence[ScoredFindDay],
    *,
    tie_epsilon: float = FIND_TIE_EPSILON,
    max_windows: int = FIND_MAX_WINDOWS,
) -> FindWindowResult:
    return rank_find_windows(
        group_contiguous_windows(days),
        tie_epsilon=tie_epsilon,
        max_windows=max_windows,
    )


__all__ = [
    "FIND_ELIGIBLE_BAND",
    "FIND_MAX_RANGE_DAYS",
    "FIND_MAX_WINDOWS",
    "FIND_MIN_RANGE_DAYS",
    "FIND_TIE_EPSILON",
    "FindWindow",
    "FindWindowResult",
    "ScoredFindDay",
    "build_find_windows",
    "group_contiguous_windows",
    "inclusive_day_count",
    "is_find_eligible_band",
    "is_find_eligible_score",
    "iter_inclusive_dates",
    "rank_find_windows",
    "validate_find_range",
]
