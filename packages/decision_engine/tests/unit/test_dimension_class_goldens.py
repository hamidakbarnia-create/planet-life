"""Golden regression for Phase 2C dimension-driven shadow classification.

v1 fixtures are a frozen oracle. v3 fixtures are the active experimental
shadow. Does not overwrite score goldens or Phase 2B dimension goldens.
"""

from __future__ import annotations

import json
from pathlib import Path

from packages.decision_engine.dimension_classification import (
    CLASSIFIER_VERSION as V1_CLASSIFIER_VERSION,
)
from packages.decision_engine.dimension_classification_proposed import (
    ACTIVE_SHADOW_CLASSIFIER_VERSION,
)
from packages.decision_engine.tests.fixtures.calendar_score_cases import CASE_BUILDERS
from packages.decision_engine.tests.fixtures.generate_dimension_class_goldens import (
    CLASS_GOLDEN_DIR_V1,
    CLASS_GOLDEN_DIR_V3,
    build_class_golden,
    build_class_golden_v1,
)
from packages.decision_engine.tests.fixtures.generate_dimension_goldens import (
    DIMENSION_GOLDEN_DIR,
)
from packages.decision_engine.tests.unit.test_calendar_score_goldens import GOLDEN_DIR


def _load(directory: Path) -> dict[str, dict]:
    goldens = {}
    for path in directory.glob("*.json"):
        payload = json.loads(path.read_text())
        goldens[payload["id"]] = payload
    return goldens


def test_v1_and_v3_golden_ids_are_present() -> None:
    expected = {builder()["id"] for builder in CASE_BUILDERS}
    assert set(_load(CLASS_GOLDEN_DIR_V1)) == expected
    assert set(_load(CLASS_GOLDEN_DIR_V3)) == expected


def test_v1_goldens_match_v1_oracle() -> None:
    builders = {builder()["id"]: builder for builder in CASE_BUILDERS}
    for case_id, golden in _load(CLASS_GOLDEN_DIR_V1).items():
        live = build_class_golden_v1(builders[case_id]())
        assert live["executive_score"] == golden["executive_score"]
        assert live["phase2a_class"] == golden["phase2a_class"]
        assert live["phase2c_class"] == golden["phase2c_class"]
        assert live["dimension_classification"] == golden["dimension_classification"]
        assert golden["classifier_version"] == V1_CLASSIFIER_VERSION


def test_v3_goldens_match_wired_snapshot() -> None:
    builders = {builder()["id"]: builder for builder in CASE_BUILDERS}
    for case_id, golden in _load(CLASS_GOLDEN_DIR_V3).items():
        live = build_class_golden(builders[case_id]())
        assert live["executive_score"] == golden["executive_score"]
        assert live["phase2a_class"] == golden["phase2a_class"]
        assert live["phase2c_class"] == golden["phase2c_class"]
        assert live["dimension_classification"] == golden["dimension_classification"]
        assert golden["classifier_version"] == ACTIVE_SHADOW_CLASSIFIER_VERSION
        assert golden["semantic_status"] == "experimental_shadow"


def test_class_goldens_do_not_overwrite_other_goldens() -> None:
    assert CLASS_GOLDEN_DIR_V1.resolve() != GOLDEN_DIR.resolve()
    assert CLASS_GOLDEN_DIR_V3.resolve() != GOLDEN_DIR.resolve()
    assert CLASS_GOLDEN_DIR_V1.resolve() != DIMENSION_GOLDEN_DIR.resolve()
    assert CLASS_GOLDEN_DIR_V3.resolve() != DIMENSION_GOLDEN_DIR.resolve()
    assert CLASS_GOLDEN_DIR_V1.resolve() != CLASS_GOLDEN_DIR_V3.resolve()
    for directory in (CLASS_GOLDEN_DIR_V1, CLASS_GOLDEN_DIR_V3):
        for path in directory.glob("*.json"):
            payload = json.loads(path.read_text())
            score = json.loads((Path(GOLDEN_DIR) / path.name).read_text())
            assert payload["executive_score"] == score["final_score"]
            assert "dimension_classification" not in score
            dim = json.loads((DIMENSION_GOLDEN_DIR / path.name).read_text())
            assert dim["final_score"] == payload["executive_score"]
            assert dim["day_class"] == payload["phase2a_class"]


def test_v1_and_v3_goldens_share_scores_and_phase2a() -> None:
    v1 = _load(CLASS_GOLDEN_DIR_V1)
    v3 = _load(CLASS_GOLDEN_DIR_V3)
    assert set(v1) == set(v3)
    for case_id in v1:
        assert v1[case_id]["executive_score"] == v3[case_id]["executive_score"]
        assert v1[case_id]["phase2a_class"] == v3[case_id]["phase2a_class"]
        assert v1[case_id]["classifier_version"] == V1_CLASSIFIER_VERSION
        assert v3[case_id]["classifier_version"] == ACTIVE_SHADOW_CLASSIFIER_VERSION


def test_class_goldens_are_shadow_not_commands() -> None:
    for golden in _load(CLASS_GOLDEN_DIR_V3).values():
        cmp_ = golden["dimension_classification"]
        assert cmp_["semantic_status"] == "experimental_shadow"
        assert cmp_["classifier_version"] == ACTIVE_SHADOW_CLASSIFIER_VERSION
        assert "command" not in cmp_
        assert "confidence" not in cmp_
        assert "classification_strength" not in cmp_
        assert "classification_coverage" in cmp_
        assert cmp_["phase2a_class"] == golden["phase2a_class"]
        assert cmp_["day_class"] == golden["phase2c_class"]
        assert "canonical" not in cmp_["semantic_status"]
