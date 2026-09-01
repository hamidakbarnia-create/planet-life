"""Generate Phase 2C dimension-class comparison snapshots.

v1 goldens are a frozen regression oracle (original experimental shadow).
v3 goldens are the active experimental shadow emitted by snapshots.

Does not overwrite score goldens or Phase 2B dimension goldens.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from packages.astro_engine.reasoning import build_reasoning
from packages.astro_engine.scoring import calculate_activity_score
from packages.decision_engine.day_intelligence_models import (
    build_day_intelligence_snapshot,
)
from packages.decision_engine.dimension_classification import (
    CLASSIFIER_VERSION as V1_CLASSIFIER_VERSION,
    classify_from_dimensions,
)
from packages.decision_engine.dimension_classification_proposed import (
    ACTIVE_SHADOW_CLASSIFIER_VERSION,
)
from packages.decision_engine.tests.fixtures.calendar_score_cases import CASE_BUILDERS

FIXTURES = Path(__file__).resolve().parent
CLASS_GOLDEN_DIR_V1 = FIXTURES / "dimension_class_goldens_v1"
CLASS_GOLDEN_DIR_V3 = FIXTURES / "dimension_class_goldens_v3"
# Active shadow goldens. Historical name kept for imports that still expect it.
CLASS_GOLDEN_DIR = CLASS_GOLDEN_DIR_V3


def _snapshot_for(case: dict[str, Any]):
    context = case["scoring_context"]
    result = calculate_activity_score(
        case["natal"],
        case["transit"],
        case["action_type"],
        scoring_context=context,
    )
    reasoning = build_reasoning(
        result,
        {"natal": case["natal"], "transit": case["transit"]},
        case["action_type"],
        context,
    )
    snapshot = build_day_intelligence_snapshot(
        result,
        natal=case["natal"],
        transit=case["transit"],
        activity_type=case["action_type"],
        reasoning=reasoning,
        scoring_context=context,
    )
    return snapshot


def build_class_golden_v1(case: dict[str, Any]) -> dict[str, Any]:
    snapshot = _snapshot_for(case)
    cmp_ = classify_from_dimensions(
        snapshot.dimensions,
        phase2a_class=snapshot.classification.day_class,
        executive_score=snapshot.final_score,
    )
    return {
        "id": case["id"],
        "classifier_version": V1_CLASSIFIER_VERSION,
        "semantic_status": cmp_.semantic_status,
        "executive_score": snapshot.final_score,
        "phase2a_class": snapshot.classification.day_class,
        "phase2c_class": cmp_.day_class,
        "dimension_classification": cmp_.model_dump(mode="json"),
    }


def build_class_golden(case: dict[str, Any]) -> dict[str, Any]:
    """Active experimental shadow (v3) from the wired snapshot."""
    snapshot = _snapshot_for(case)
    cmp_ = snapshot.dimension_classification
    return {
        "id": case["id"],
        "classifier_version": ACTIVE_SHADOW_CLASSIFIER_VERSION,
        "semantic_status": cmp_.semantic_status,
        "executive_score": snapshot.final_score,
        "phase2a_class": snapshot.classification.day_class,
        "phase2c_class": cmp_.day_class,
        "dimension_classification": cmp_.model_dump(mode="json"),
    }


def write_class_goldens_v1(directory: Path | None = None) -> list[Path]:
    target = directory or CLASS_GOLDEN_DIR_V1
    target.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for builder in CASE_BUILDERS:
        golden = build_class_golden_v1(builder())
        path = target / f"{golden['id']}.json"
        path.write_text(json.dumps(golden, indent=2, sort_keys=True) + "\n")
        written.append(path)
    return written


def write_class_goldens(directory: Path | None = None) -> list[Path]:
    target = directory or CLASS_GOLDEN_DIR_V3
    target.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for builder in CASE_BUILDERS:
        golden = build_class_golden(builder())
        path = target / f"{golden['id']}.json"
        path.write_text(json.dumps(golden, indent=2, sort_keys=True) + "\n")
        written.append(path)
    return written


if __name__ == "__main__":
    print("v1 regression")
    for path in write_class_goldens_v1():
        print(path)
    print("v3 active shadow")
    for path in write_class_goldens():
        print(path)
