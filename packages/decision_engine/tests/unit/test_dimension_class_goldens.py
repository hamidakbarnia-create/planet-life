"""Golden regression for Phase 2C dimension-driven shadow classification.

Does not overwrite score goldens or Phase 2B dimension goldens.
"""

from __future__ import annotations

import json
from pathlib import Path

from packages.decision_engine.dimension_classification import CLASSIFIER_VERSION
from packages.decision_engine.tests.fixtures.calendar_score_cases import CASE_BUILDERS
from packages.decision_engine.tests.fixtures.generate_dimension_class_goldens import (
    CLASS_GOLDEN_DIR,
    build_class_golden,
)
from packages.decision_engine.tests.fixtures.generate_dimension_goldens import (
    DIMENSION_GOLDEN_DIR,
)
from packages.decision_engine.tests.unit.test_calendar_score_goldens import GOLDEN_DIR


def _load() -> dict[str, dict]:
    goldens = {}
    for path in CLASS_GOLDEN_DIR.glob("*.json"):
        payload = json.loads(path.read_text())
        goldens[payload["id"]] = payload
    return goldens


def test_class_goldens_are_present_for_all_cases() -> None:
    assert set(_load()) == {builder()["id"] for builder in CASE_BUILDERS}


def test_class_goldens_match_live_computation() -> None:
    builders = {builder()["id"]: builder for builder in CASE_BUILDERS}
    for case_id, golden in _load().items():
        live = build_class_golden(builders[case_id]())
        assert live["executive_score"] == golden["executive_score"]
        assert live["phase2a_class"] == golden["phase2a_class"]
        assert live["phase2c_class"] == golden["phase2c_class"]
        assert live["dimension_classification"] == golden["dimension_classification"]
        assert golden["classifier_version"] == CLASSIFIER_VERSION


def test_class_goldens_do_not_overwrite_other_goldens() -> None:
    assert CLASS_GOLDEN_DIR.resolve() != GOLDEN_DIR.resolve()
    assert CLASS_GOLDEN_DIR.resolve() != DIMENSION_GOLDEN_DIR.resolve()
    for path in CLASS_GOLDEN_DIR.glob("*.json"):
        payload = json.loads(path.read_text())
        score = json.loads((Path(GOLDEN_DIR) / path.name).read_text())
        assert payload["executive_score"] == score["final_score"]
        assert "dimension_classification" not in score
        dim = json.loads((DIMENSION_GOLDEN_DIR / path.name).read_text())
        assert dim["final_score"] == payload["executive_score"]
        assert dim["day_class"] == payload["phase2a_class"]


def test_class_goldens_are_shadow_not_commands() -> None:
    for golden in _load().values():
        cmp_ = golden["dimension_classification"]
        assert cmp_["semantic_status"] == "experimental_shadow"
        assert "command" not in cmp_
        assert "confidence" not in cmp_
        assert "classification_strength" not in cmp_
        assert "classification_coverage" in cmp_
        assert cmp_["phase2a_class"] == golden["phase2a_class"]
        assert cmp_["day_class"] == golden["phase2c_class"]
