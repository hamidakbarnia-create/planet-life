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


def test_extract_requires_two_to_three_options():
    with pytest.raises(RuntimeFramingError, match="between 2 and 3"):
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
