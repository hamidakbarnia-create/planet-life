"""Unit tests for evaluate → target_date carry-forward (no DB)."""

from __future__ import annotations

import pytest
from decision_case.services.decision_frame import (
    FramingValidationError,
    seed_intake_from_framing,
)

D1 = "2026-08-14"
D2 = "2026-08-18"


def test_seeds_evaluate_specific_date_when_empty() -> None:
    framing = {
        "operation": "evaluate",
        "time_scope": "specific_date",
        "date": D2,
    }
    out = seed_intake_from_framing({"decision_frame": framing}, framing)
    assert out["target_date"] == D2
    assert out["decision_frame"]["date"] == D2


def test_never_overwrites_existing_target_date() -> None:
    framing = {
        "operation": "evaluate",
        "time_scope": "specific_date",
        "date": D2,
    }
    out = seed_intake_from_framing(
        {"decision_frame": framing, "target_date": D1},
        framing,
    )
    assert out["target_date"] == D1


def test_compare_does_not_seed() -> None:
    framing = {
        "operation": "compare",
        "time_scope": "multiple_dates",
        "dates": [D1, D2],
    }
    out = seed_intake_from_framing({"decision_frame": framing}, framing)
    assert "target_date" not in out


def test_find_does_not_seed() -> None:
    framing = {
        "operation": "find",
        "time_scope": "date_range",
        "start": "2026-08-01",
        "end": "2026-08-31",
    }
    out = seed_intake_from_framing({"decision_frame": framing}, framing)
    assert "target_date" not in out


def test_evaluate_none_does_not_seed() -> None:
    framing = {"operation": "evaluate", "time_scope": "none"}
    out = seed_intake_from_framing({"decision_frame": framing}, framing)
    assert "target_date" not in out


def test_invalid_iso_raises() -> None:
    framing = {
        "operation": "evaluate",
        "time_scope": "specific_date",
        "date": "2026-13-40",
    }
    with pytest.raises(FramingValidationError):
        seed_intake_from_framing({"decision_frame": framing}, framing)
