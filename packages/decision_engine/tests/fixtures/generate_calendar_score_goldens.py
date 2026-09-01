"""Generate golden calendar score fixtures from the live scoring engine."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from packages.astro_engine.reasoning import build_reasoning
from packages.astro_engine.scoring import calculate_activity_score
from packages.decision_engine.evidence import dominant_evaluated_aspects
from packages.decision_engine.tests.fixtures.calendar_score_cases import CASE_BUILDERS

GOLDEN_DIR = Path(__file__).resolve().parent / "calendar_goldens"


def _json_safe_context(context: Any) -> dict[str, Any]:
    return {
        "location_mode": context.location_mode,
        "include_natal_house_bonus": context.include_natal_house_bonus,
        "include_transit_house_score": context.include_transit_house_score,
        "include_transit_angular_score": context.include_transit_angular_score,
        "default_transit_time": context.default_transit_time,
    }


def build_golden(case: dict[str, Any]) -> dict[str, Any]:
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
    breakdown = result["strategic"]["component_breakdown"]
    return {
        "id": case["id"],
        "input": {
            "action_type": case["action_type"],
            "scoring_context": _json_safe_context(context),
            "natal": case["natal"],
            "transit": case["transit"],
        },
        "final_score": result["executive"]["score"],
        "component_breakdown": breakdown,
        "dominant_aspects": list(dominant_evaluated_aspects(result)),
        "reasoning": reasoning,
        "executive": {
            "score": result["executive"]["score"],
            "rating": result["executive"]["rating"],
            "activity": result["executive"]["activity"],
        },
    }


def write_goldens(directory: Path | None = None) -> list[Path]:
    target = directory or GOLDEN_DIR
    target.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for builder in CASE_BUILDERS:
        golden = build_golden(builder())
        path = target / f"{golden['id']}.json"
        path.write_text(json.dumps(golden, indent=2, sort_keys=True) + "\n")
        written.append(path)
    return written


if __name__ == "__main__":
    paths = write_goldens()
    for path in paths:
        print(path)
