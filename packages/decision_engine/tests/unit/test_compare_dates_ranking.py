from packages.decision_engine.compare_dates import (
    ScoredCompareOption,
    rank_compare_options,
)


def test_deterministic_ranking_score_then_date_then_id():
    options = [
        ScoredCompareOption("b", "B", "2026-09-12", 70.0, "moderate"),
        ScoredCompareOption("a", "A", "2026-09-10", 70.0, "moderate"),
        ScoredCompareOption("c", "C", "2026-09-15", 80.0, "high"),
    ]
    first = rank_compare_options(options)
    second = rank_compare_options(list(reversed(options)))
    assert [item.option_id for item in first.ranked] == ["c", "a", "b"]
    assert [item.option_id for item in second.ranked] == ["c", "a", "b"]
    assert first.unique_winner is True


def test_tie_rejects_unique_winner():
    options = [
        ScoredCompareOption("a", "A", "2026-09-10", 70.0, "moderate"),
        ScoredCompareOption("b", "B", "2026-09-12", 71.0, "moderate"),
    ]
    result = rank_compare_options(options)
    assert result.unique_winner is False
    assert set(result.tied_option_ids) == {"a", "b"}
    # Deterministic rank still assigned.
    assert result.ranked[0].option_id == "b"


def test_deterministic_ordering_unchanged_across_shuffle():
    options = [
        ScoredCompareOption("z", "Z", "2026-09-20", 55.0, "low"),
        ScoredCompareOption("m", "M", "2026-09-11", 88.0, "high"),
        ScoredCompareOption("a", "A", "2026-09-11", 88.0, "high"),
    ]
    shuffled = list(reversed(options))
    assert [i.option_id for i in rank_compare_options(options).ranked] == [
        "a",
        "m",
        "z",
    ]
    assert [i.option_id for i in rank_compare_options(shuffled).ranked] == [
        "a",
        "m",
        "z",
    ]
