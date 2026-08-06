"""Baseline report aggregation and human-review template helpers."""

from __future__ import annotations

import csv
import json
import statistics
from pathlib import Path
from typing import Any, Iterable

from evaluations.ask.models import (
    HUMAN_REVIEW_FIELDS,
    BaselineReport,
    ScenarioRunResult,
)


def _empty_bucket() -> dict[str, int]:
    return {
        "total": 0,
        "success": 0,
        "failure": 0,
        "structural_pass": 0,
        "structural_fail": 0,
    }


def aggregate_report(
    *,
    dataset_version: str,
    rubric_version: str,
    provider: str,
    model: str,
    prompt_version: str,
    execution_timestamp: str,
    results: Iterable[ScenarioRunResult],
) -> BaselineReport:
    """Aggregate scenario results into a baseline report (no subjective scores)."""
    scenario_results = tuple(results)
    category_breakdown: dict[str, dict[str, int]] = {}
    locale_breakdown: dict[str, dict[str, int]] = {}

    success_count = 0
    failure_count = 0
    validation_failures = 0
    provider_failures = 0
    structural_failures = 0
    structural_evaluated = 0
    structural_passes = 0
    latencies: list[float] = []

    for item in scenario_results:
        cat = category_breakdown.setdefault(item.category, _empty_bucket())
        loc = locale_breakdown.setdefault(item.locale, _empty_bucket())
        for bucket in (cat, loc):
            bucket["total"] += 1

        if item.success:
            success_count += 1
            cat["success"] += 1
            loc["success"] += 1
        else:
            failure_count += 1
            cat["failure"] += 1
            loc["failure"] += 1

        if item.validation_ok is False:
            validation_failures += 1
        if item.error_type == "provider":
            provider_failures += 1

        if item.structural is not None:
            structural_evaluated += 1
            if item.structural.passed:
                structural_passes += 1
                cat["structural_pass"] += 1
                loc["structural_pass"] += 1
            else:
                structural_failures += 1
                cat["structural_fail"] += 1
                loc["structural_fail"] += 1

        if item.latency_ms is not None:
            latencies.append(item.latency_ms)

    structural_pass_rate: float | None
    if structural_evaluated == 0:
        structural_pass_rate = None
    else:
        structural_pass_rate = structural_passes / structural_evaluated

    latency_statistics: dict[str, float | None]
    if latencies:
        latency_statistics = {
            "count": float(len(latencies)),
            "min_ms": min(latencies),
            "max_ms": max(latencies),
            "mean_ms": statistics.fmean(latencies),
            "median_ms": statistics.median(latencies),
        }
    else:
        latency_statistics = {
            "count": 0.0,
            "min_ms": None,
            "max_ms": None,
            "mean_ms": None,
            "median_ms": None,
        }

    return BaselineReport(
        dataset_version=dataset_version,
        rubric_version=rubric_version,
        provider=provider,
        model=model,
        prompt_version=prompt_version,
        execution_timestamp=execution_timestamp,
        scenario_count=len(scenario_results),
        success_count=success_count,
        failure_count=failure_count,
        structural_pass_rate=structural_pass_rate,
        category_breakdown=dict(sorted(category_breakdown.items())),
        locale_breakdown=dict(sorted(locale_breakdown.items())),
        latency_statistics=latency_statistics,
        validation_failures=validation_failures,
        provider_failures=provider_failures,
        structural_failures=structural_failures,
        subjective_scores_included=False,
        scenarios=scenario_results,
    )


def write_report(report: BaselineReport, output_path: str | Path) -> Path:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return path


def write_human_review_template(
    results: Iterable[ScenarioRunResult],
    output_path: str | Path,
) -> Path:
    """Write a CSV template for human rubric scoring (scores left blank)."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(HUMAN_REVIEW_FIELDS))
        writer.writeheader()
        for item in results:
            row: dict[str, Any] = {field: "" for field in HUMAN_REVIEW_FIELDS}
            row["scenario_id"] = item.scenario_id
            row["response"] = item.response or ""
            writer.writerow(row)
    return path


def human_review_jsonl_schema() -> dict[str, Any]:
    """Return a JSON-serializable description of the human review record."""
    return {
        "format": "jsonl",
        "fields": list(HUMAN_REVIEW_FIELDS),
        "score_fields": [
            "relevance_score",
            "specificity_score",
            "actionability_score",
            "reasoning_score",
            "context_use_score",
            "uncertainty_score",
            "safety_score",
            "conciseness_score",
            "differentiation_score",
            "language_score",
        ],
        "score_scale": {"min": 0, "max": 4},
        "notes": (
            "Subjective scores must be filled by a human reviewer or an "
            "explicitly approved evaluator. Structural reports never invent these."
        ),
    }
