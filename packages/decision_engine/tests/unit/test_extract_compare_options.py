import pytest

from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    extract_compare_options_from_framing,
)


def test_extract_preserves_option_identity():
    options = extract_compare_options_from_framing(
        {
            "decision_frame": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": ["2026-09-10", "2026-09-12"],
                "options": [
                    {"id": "a", "label": "Early", "date": "2026-09-10"},
                    {"id": "b", "label": "Late", "date": "2026-09-12"},
                ],
            }
        }
    )
    assert len(options) == 2
    assert options[0].option_id == "a"
    assert options[0].label == "Early"
    assert options[0].date == "2026-09-10"


def test_extract_rejects_duplicate_dates():
    with pytest.raises(RuntimeFramingError, match="unique dates"):
        extract_compare_options_from_framing(
            {
                "decision_frame": {
                    "operation": "compare",
                    "time_scope": "multiple_dates",
                    "dates": ["2026-09-10", "2026-09-10"],
                    "options": [
                        {"id": "a", "label": "A", "date": "2026-09-10"},
                        {"id": "b", "label": "B", "date": "2026-09-10"},
                    ],
                }
            }
        )


def test_extract_rejects_singular_date_collapse():
    with pytest.raises(RuntimeFramingError, match="singular date"):
        extract_compare_options_from_framing(
            {
                "decision_frame": {
                    "operation": "compare",
                    "time_scope": "multiple_dates",
                    "date": "2026-09-10",
                    "dates": ["2026-09-10", "2026-09-12"],
                    "options": [
                        {"id": "a", "label": "A", "date": "2026-09-10"},
                        {"id": "b", "label": "B", "date": "2026-09-12"},
                    ],
                }
            }
        )


def test_extract_requires_two_to_five_options():
    with pytest.raises(RuntimeFramingError, match="between 2 and 5"):
        extract_compare_options_from_framing(
            {
                "decision_frame": {
                    "operation": "compare",
                    "time_scope": "multiple_dates",
                    "dates": ["2026-09-10"],
                    "options": [
                        {"id": "a", "label": "A", "date": "2026-09-10"},
                    ],
                }
            }
        )

    dates = [
        "2026-09-10",
        "2026-09-11",
        "2026-09-12",
        "2026-09-13",
        "2026-09-14",
        "2026-09-15",
    ]
    with pytest.raises(RuntimeFramingError, match="between 2 and 5"):
        extract_compare_options_from_framing(
            {
                "decision_frame": {
                    "operation": "compare",
                    "time_scope": "multiple_dates",
                    "dates": dates,
                    "options": [
                        {"id": f"o{i}", "label": f"L{i}", "date": d}
                        for i, d in enumerate(dates)
                    ],
                }
            }
        )


def test_extract_accepts_five_options():
    dates = [
        "2026-09-10",
        "2026-09-11",
        "2026-09-12",
        "2026-09-13",
        "2026-09-14",
    ]
    options = extract_compare_options_from_framing(
        {
            "decision_frame": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": dates,
                "options": [
                    {"id": f"o{i}", "label": f"L{i}", "date": d}
                    for i, d in enumerate(dates)
                ],
            }
        }
    )
    assert len(options) == 5
