import pytest

from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeUnsupportedOperationError,
    extract_evaluate_date_from_framing,
    extract_natal_evidence,
    rating_to_candidate_band,
    rating_to_stance,
    score_to_candidate_band,
)


def test_extract_evaluate_date_from_specific_date_frame():
    intake = {
        "decision_frame": {
            "operation": "evaluate",
            "time_scope": "specific_date",
            "date": "2026-08-18",
        }
    }

    assert extract_evaluate_date_from_framing(intake) == "2026-08-18"


@pytest.mark.parametrize("operation", ["compare", "find"])
def test_non_evaluate_operations_are_rejected(operation):
    intake = {
        "decision_frame": {
            "operation": operation,
            "time_scope": "specific_date",
            "date": "2026-08-18",
        }
    }

    with pytest.raises(RuntimeUnsupportedOperationError):
        extract_evaluate_date_from_framing(intake)


def test_missing_frame_is_rejected():
    with pytest.raises(RuntimeFramingError):
        extract_evaluate_date_from_framing({})


def test_extract_complete_natal_evidence():
    intake = {
        "natal_evidence": {
            "birth_date": "1990-01-01",
            "birth_time": "10:30",
            "location": "London",
            "latitude": 51.5074,
            "longitude": -0.1278,
        }
    }

    evidence = extract_natal_evidence(intake)

    assert evidence is not None
    assert evidence["birth_date"] == "1990-01-01"
    assert evidence["birth_time"] == "10:30"
    assert evidence["location"] == "London"
    assert evidence["latitude"] == 51.5074
    assert evidence["longitude"] == -0.1278


def test_incomplete_natal_evidence_returns_none():
    assert extract_natal_evidence(
        {
            "natal_evidence": {
                "birth_date": "1990-01-01",
                "birth_time": "",
                "location": "London",
            }
        }
    ) is None


@pytest.mark.parametrize(
    ("rating", "expected"),
    [
        ("Highly Favorable", "high"),
        ("Favorable", "high"),
        ("Mixed", "moderate"),
        ("Mixed — conditional", "moderate"),
        ("Unfavorable", "low"),
    ],
)
def test_rating_to_candidate_band(rating, expected):
    assert rating_to_candidate_band(rating) == expected


@pytest.mark.parametrize(
    ("rating", "expected"),
    [
        ("Highly Favorable", "proceed"),
        ("Favorable", "proceed_with_conditions"),
        ("Mixed", "proceed_with_conditions"),
        ("Unfavorable", "wait"),
    ],
)
def test_rating_to_stance(rating, expected):
    assert rating_to_stance(rating) == expected


@pytest.mark.parametrize(
    ("score", "expected"),
    [
        (65, "high"),
        (64.9, "moderate"),
        (45, "moderate"),
        (44.9, "low"),
    ],
)
def test_score_to_candidate_band(score, expected):
    assert score_to_candidate_band(score) == expected
