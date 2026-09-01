"""Generate Phase 2B dimension snapshots from existing Phase 0/1 score cases.

Does not overwrite ``calendar_goldens`` (score goldens). Dimensions are
derived from normalized evidence of the live engine, never from executive.score.
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
from packages.decision_engine.dimension_mapping import MAPPING_VERSION
from packages.decision_engine.tests.fixtures.calendar_score_cases import CASE_BUILDERS

DIMENSION_GOLDEN_DIR = Path(__file__).resolve().parent / "dimension_goldens"

# Representative Phase 0/1 cases required by the Phase 2B spec.
REPRESENTATIVE_IDS = (
    "strongly_supportive",
    "strongly_adverse",
    "mixed_conflicting",
    "close_exact_aspect",
    "retrograde_penalty",
    "angular_contact",
    "action_type_business_launch",
    "action_type_rest_recovery",
)


def build_dimension_golden(case: dict[str, Any]) -> dict[str, Any]:
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
    return {
        "id": case["id"],
        "mapping_version": MAPPING_VERSION,
        "action_type": snapshot.action_type,
        "final_score": snapshot.final_score,
        "day_class": snapshot.classification.day_class,
        "classification_conflict": snapshot.classification.conflict,
        "dimensions": snapshot.dimensions.model_dump(mode="json"),
    }


def write_dimension_goldens(directory: Path | None = None) -> list[Path]:
    target = directory or DIMENSION_GOLDEN_DIR
    target.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for builder in CASE_BUILDERS:
        golden = build_dimension_golden(builder())
        path = target / f"{golden['id']}.json"
        path.write_text(json.dumps(golden, indent=2, sort_keys=True) + "\n")
        written.append(path)
    return written


if __name__ == "__main__":
    paths = write_dimension_goldens()
    for path in paths:
        print(path)
