"""Golden regression for Phase 2B DecisionDimensions.

Score goldens in ``calendar_goldens`` remain the authority for executive.score.
These fixtures snapshot dimensions only.
"""

from __future__ import annotations

import json
from pathlib import Path

from packages.decision_engine.dimension_mapping import MAPPING_VERSION
from packages.decision_engine.tests.fixtures.generate_dimension_goldens import (
    DIMENSION_GOLDEN_DIR,
    REPRESENTATIVE_IDS,
    build_dimension_golden,
)
from packages.decision_engine.tests.fixtures.calendar_score_cases import CASE_BUILDERS
from packages.decision_engine.tests.unit.test_calendar_score_goldens import (
    GOLDEN_DIR,
    _load_goldens as _load_score_goldens,
)


def _load_dimension_goldens() -> dict[str, dict]:
    goldens = {}
    for path in DIMENSION_GOLDEN_DIR.glob("*.json"):
        payload = json.loads(path.read_text())
        goldens[payload["id"]] = payload
    return goldens


def test_representative_dimension_goldens_are_present() -> None:
    goldens = _load_dimension_goldens()
    assert set(REPRESENTATIVE_IDS) <= set(goldens)


def test_dimension_goldens_match_live_computation() -> None:
    goldens = _load_dimension_goldens()
    builders = {builder()["id"]: builder for builder in CASE_BUILDERS}
    for case_id, golden in goldens.items():
        live = build_dimension_golden(builders[case_id]())
        assert live["final_score"] == golden["final_score"]
        assert live["dimensions"] == golden["dimensions"]
        assert live["mapping_version"] == MAPPING_VERSION
        assert golden["mapping_version"] == MAPPING_VERSION


def test_dimension_goldens_do_not_overwrite_score_goldens() -> None:
    score_goldens = _load_score_goldens()
    dim_goldens = _load_dimension_goldens()
    assert GOLDEN_DIR.resolve() != DIMENSION_GOLDEN_DIR.resolve()
    for case_id, dim in dim_goldens.items():
        assert dim["final_score"] == score_goldens[case_id]["final_score"]
        score_path = Path(GOLDEN_DIR) / f"{case_id}.json"
        dim_path = DIMENSION_GOLDEN_DIR / f"{case_id}.json"
        assert score_path.read_text() != dim_path.read_text()
        score_payload = json.loads(score_path.read_text())
        assert "dimensions" not in score_payload


def test_dimension_values_are_not_copies_of_score() -> None:
    for golden in _load_dimension_goldens().values():
        values = [
            golden["dimensions"][key]["value"]
            for key in (
                "opportunity",
                "momentum",
                "clarity",
                "stability",
                "cooperation",
                "pressure",
                "reversibility_safety",
            )
        ]
        assert any(value != golden["final_score"] for value in values)
