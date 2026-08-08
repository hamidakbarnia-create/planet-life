"""Unit tests for FIND window generation (no HTTP / scoring provider)."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from packages.astro_engine.scoring import _rating
from packages.decision_engine.evaluate.runtime_common import (
    rating_to_candidate_band,
    score_to_candidate_band,
)
from packages.decision_engine.find_windows import (
    FIND_ELIGIBLE_BAND,
    FIND_MAX_WINDOWS,
    FIND_MIN_RANGE_DAYS,
    FIND_TIE_EPSILON,
    ScoredFindDay,
    build_find_windows,
    group_contiguous_windows,
    inclusive_day_count,
    is_find_eligible_band,
    is_find_eligible_score,
    iter_inclusive_dates,
    rank_find_windows,
    validate_find_range,
)


def _day(day: date, score: float, band: str = "high") -> ScoredFindDay:
    return ScoredFindDay(day=day, score=score, band=band)


def test_range_min_max_and_reversed() -> None:
    start = date(2026, 9, 1)
    validate_find_range(start, start + timedelta(days=FIND_MIN_RANGE_DAYS - 1))
    with pytest.raises(ValueError, match="at least"):
        validate_find_range(start, start + timedelta(days=FIND_MIN_RANGE_DAYS - 2))
    with pytest.raises(ValueError, match="at most"):
        validate_find_range(start, start + timedelta(days=90))
    with pytest.raises(ValueError, match="<="):
        validate_find_range(start + timedelta(days=1), start)


def test_inclusive_boundaries() -> None:
    start = date(2026, 9, 1)
    end = date(2026, 9, 7)
    assert inclusive_day_count(start, end) == 7
    days = list(iter_inclusive_dates(start, end))
    assert days[0] == start
    assert days[-1] == end
    assert len(days) == 7


def test_adjacent_eligible_days_merge() -> None:
    base = date(2026, 9, 1)
    days = [
        _day(base, 70),
        _day(base + timedelta(days=1), 72),
        _day(base + timedelta(days=2), 68),
        _day(base + timedelta(days=3), 40, band="low"),
        _day(base + timedelta(days=4), 75),
    ]
    windows = group_contiguous_windows(days)
    assert len(windows) == 2
    assert windows[0].start_date == base
    assert windows[0].end_date == base + timedelta(days=2)
    assert windows[0].peak_dates == (base + timedelta(days=1),)
    assert windows[0].peak_score == 72
    assert windows[1].start_date == base + timedelta(days=4)


def test_separated_dates_do_not_merge() -> None:
    base = date(2026, 9, 1)
    days = [
        _day(base, 70),
        _day(base + timedelta(days=2), 71),
    ]
    windows = group_contiguous_windows(days)
    assert len(windows) == 2


def test_max_five_windows_and_stable_ordering() -> None:
    base = date(2026, 9, 1)
    days = [
        _day(base + timedelta(days=i * 2), 70 + i) for i in range(7)
    ]
    result = build_find_windows(days)
    assert len(result.windows) == FIND_MAX_WINDOWS
    scores = [w.peak_score for w in result.windows]
    assert scores == sorted(scores, reverse=True)
    # Deterministic ranks
    assert [w.rank for w in result.windows] == list(range(1, FIND_MAX_WINDOWS + 1))


def test_equivalent_windows_no_unique_winner() -> None:
    base = date(2026, 9, 1)
    days = [
        _day(base, 70),
        _day(base + timedelta(days=2), 70 + FIND_TIE_EPSILON),
    ]
    result = build_find_windows(days)
    assert result.unique_dominant is False
    assert len(result.tied_window_ids) == 2


def test_no_qualifying_window_empty() -> None:
    base = date(2026, 9, 1)
    days = [_day(base + timedelta(days=i), 50, band="moderate") for i in range(7)]
    result = build_find_windows(days)
    assert result.windows == ()
    assert result.unique_dominant is False


def test_eligibility_consumes_canonical_favorable_plus_band() -> None:
    """65 is astro_engine Favorable floor; FIND only consumes band=high."""
    assert _rating(65) == "Favorable"
    assert _rating(64).startswith("Mixed")
    assert rating_to_candidate_band("Favorable") == FIND_ELIGIBLE_BAND
    assert rating_to_candidate_band("Highly Favorable") == FIND_ELIGIBLE_BAND
    assert score_to_candidate_band(65) == FIND_ELIGIBLE_BAND
    assert score_to_candidate_band(64.9) == "moderate"
    assert is_find_eligible_score(65) is True
    assert is_find_eligible_score(64.9) is False
    assert is_find_eligible_band("high") is True
    assert is_find_eligible_band("moderate") is False


def test_never_lowers_threshold_to_force_windows() -> None:
    base = date(2026, 9, 1)
    # Best day is Mixed / moderate — must stay empty, not promote to a window.
    days = [
        _day(base + timedelta(days=i), score, band=score_to_candidate_band(score))
        for i, score in enumerate([64, 60, 55, 50, 45, 40, 30])
    ]
    result = build_find_windows(days)
    assert result.windows == ()
    assert max(d.score for d in days) == 64
    assert is_find_eligible_score(64) is False


def test_tiny_within_band_deltas_do_not_claim_unique_winner() -> None:
    a = date(2026, 9, 1)
    b = date(2026, 9, 3)
    # 78 vs 77 — both Favorable+/high; must not invent a unique winner.
    result = build_find_windows([_day(a, 78), _day(b, 77)])
    assert len(result.windows) == 2
    assert result.unique_dominant is False
    assert set(result.tied_window_ids) == {w.window_id for w in result.windows}


def test_rank_tie_break_by_start_date() -> None:
    a = date(2026, 9, 1)
    b = date(2026, 9, 5)
    windows = group_contiguous_windows(
        [_day(a, 80), _day(b, 80)]
    )
    ranked = rank_find_windows(windows)
    assert ranked.windows[0].start_date == a
    assert ranked.unique_dominant is False
