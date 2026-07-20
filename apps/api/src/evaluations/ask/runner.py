"""CLI runner for Ask quality evaluation baselines (P1-T05-02).

Uses the internal ConversationService / GenerationProvider abstraction.
Does not call the public Conversation HTTP API.
Does not store API keys.
Does not modify production prompts.

Usage (from repository root):

    PYTHONPATH=apps/api/src python -m evaluations.ask.runner \\
      --dataset apps/api/evaluations/ask/dataset_v1.json \\
      --rubric apps/api/evaluations/ask/rubric_v1.json \\
      --provider static \\
      --output apps/api/evaluations/ask/baseline/static-baseline.json
"""

from __future__ import annotations

import argparse
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from evaluations.ask.dataset import (
    DatasetValidationError,
    default_dataset_path,
    default_rubric_path,
    load_dataset,
    load_rubric,
)
from evaluations.ask.models import EvalScenario, ScenarioRunResult
from evaluations.ask.reporting import (
    aggregate_report,
    write_human_review_template,
    write_report,
)
from evaluations.ask.structural_evaluator import StructuralEvaluator
from services.generation.errors import GenerationError, GenerationProviderError
from services.generation.factory import resolve_generation_provider
from services.generation.ports import GenerationInput, GenerationMessage, GenerationProvider
from services.generation.prompt_builder import PROMPT_VERSION_V2
from services.generation.service import ConversationService
from services.generation.telemetry import (
    InMemoryTelemetryRecorder,
    resolve_provider_identity,
)


def _scenario_to_generation_input(scenario: EvalScenario) -> GenerationInput:
    return GenerationInput(
        request_id=f"eval-{scenario.id}",
        locale=scenario.locale,
        messages=tuple(
            GenerationMessage(role=message.role, content=message.content)
            for message in scenario.messages
        ),
    )


def run_scenario(
    scenario: EvalScenario,
    *,
    service: ConversationService,
    structural_evaluator: StructuralEvaluator,
    provider_name: str,
    model_name: str,
    prompt_version: str,
) -> ScenarioRunResult:
    """Execute one scenario; never raises — failures are captured on the result."""
    generation_input = _scenario_to_generation_input(scenario)
    messages_payload = [
        {"role": message.role, "content": message.content}
        for message in scenario.messages
    ]
    started = time.perf_counter()
    try:
        result = service.execute(generation_input)
        latency_ms = (time.perf_counter() - started) * 1000.0
        structural = structural_evaluator.evaluate(scenario, result.message)
        success = structural.passed
        return ScenarioRunResult(
            scenario_id=scenario.id,
            category=scenario.category,
            locale=scenario.locale,
            success=success,
            response=result.message,
            provider=provider_name,
            model=model_name,
            prompt_version=prompt_version,
            latency_ms=latency_ms,
            validation_ok=True,
            error_type=None if success else "structural",
            error_message=(
                None
                if success
                else "; ".join(
                    f"{check.check_id}: {check.detail}"
                    for check in structural.failed_checks
                )
            ),
            structural=structural,
            messages=messages_payload,
        )
    except GenerationProviderError as exc:
        latency_ms = (time.perf_counter() - started) * 1000.0
        message = str(exc)
        # Distinguish validation mapping from raw provider failures by message.
        validation_ok = False if "malformed" in message.lower() or "empty" in message.lower() or "exceeding" in message.lower() else None
        error_type = "validation" if validation_ok is False else "provider"
        structural = structural_evaluator.evaluate(
            scenario,
            None,
            provider_error=message,
        )
        return ScenarioRunResult(
            scenario_id=scenario.id,
            category=scenario.category,
            locale=scenario.locale,
            success=False,
            response=None,
            provider=provider_name,
            model=model_name,
            prompt_version=prompt_version,
            latency_ms=latency_ms,
            validation_ok=False if error_type == "validation" else None,
            error_type=error_type,
            error_message=message,
            structural=structural,
            messages=messages_payload,
        )
    except GenerationError as exc:
        latency_ms = (time.perf_counter() - started) * 1000.0
        structural = structural_evaluator.evaluate(
            scenario,
            None,
            provider_error=str(exc),
        )
        return ScenarioRunResult(
            scenario_id=scenario.id,
            category=scenario.category,
            locale=scenario.locale,
            success=False,
            response=None,
            provider=provider_name,
            model=model_name,
            prompt_version=prompt_version,
            latency_ms=latency_ms,
            validation_ok=None,
            error_type="generation",
            error_message=str(exc),
            structural=structural,
            messages=messages_payload,
        )
    except Exception as exc:  # noqa: BLE001 — evaluation must continue
        latency_ms = (time.perf_counter() - started) * 1000.0
        structural = structural_evaluator.evaluate(
            scenario,
            None,
            provider_error=f"unexpected: {exc}",
        )
        return ScenarioRunResult(
            scenario_id=scenario.id,
            category=scenario.category,
            locale=scenario.locale,
            success=False,
            response=None,
            provider=provider_name,
            model=model_name,
            prompt_version=prompt_version,
            latency_ms=latency_ms,
            validation_ok=None,
            error_type="unexpected",
            error_message=str(exc),
            structural=structural,
            messages=messages_payload,
        )


def _select_scenarios_by_ids(
    scenarios: list[EvalScenario],
    scenario_ids: list[str],
) -> list[EvalScenario]:
    """Select scenarios by explicit IDs, preserving caller order.

    Validates before any provider execution: rejects empty IDs, duplicates,
    and unknown IDs.
    """
    if not scenario_ids:
        raise DatasetValidationError("--scenario-ids must not be empty")

    by_id = {item.id: item for item in scenarios}
    seen: set[str] = set()
    selected: list[EvalScenario] = []
    for raw_id in scenario_ids:
        scenario_id = raw_id.strip() if isinstance(raw_id, str) else ""
        if not scenario_id:
            raise DatasetValidationError("empty scenario id in --scenario-ids")
        if scenario_id in seen:
            raise DatasetValidationError(
                f"duplicate scenario id in --scenario-ids: {scenario_id}"
            )
        seen.add(scenario_id)
        match = by_id.get(scenario_id)
        if match is None:
            raise DatasetValidationError(f"scenario not found: {scenario_id}")
        selected.append(match)
    return selected


def _parse_scenario_ids_arg(value: str) -> list[str]:
    """Parse comma-separated --scenario-ids, preserving caller order."""
    return [part.strip() for part in value.split(",")]


def run_evaluation(
    *,
    dataset_path: str | Path,
    rubric_path: str | Path,
    provider_key: str,
    output_path: str | Path,
    limit: int | None = None,
    scenario_id: str | None = None,
    scenario_ids: list[str] | None = None,
    provider: GenerationProvider | None = None,
    write_review_template: bool = True,
) -> Path:
    """Run the evaluation suite and write the baseline report.

    Scenario selection priority:
    1. scenario_id (single)
    2. scenario_ids (explicit list, caller order preserved)
    3. full dataset (+ optional limit)
    """
    dataset = load_dataset(dataset_path)
    rubric = load_rubric(rubric_path)

    if scenario_id is not None and scenario_ids is not None:
        raise DatasetValidationError(
            "--scenario-id and --scenario-ids are mutually exclusive"
        )
    if scenario_ids is not None and limit is not None:
        raise DatasetValidationError(
            "--limit cannot be combined with --scenario-ids"
        )

    scenarios = list(dataset.scenarios)
    if scenario_id is not None:
        scenarios = [item for item in scenarios if item.id == scenario_id]
        if not scenarios:
            raise DatasetValidationError(f"scenario not found: {scenario_id}")
    elif scenario_ids is not None:
        scenarios = _select_scenarios_by_ids(scenarios, scenario_ids)

    if limit is not None:
        if limit < 0:
            raise DatasetValidationError("--limit must be >= 0")
        scenarios = scenarios[:limit]

    resolved_provider = provider or resolve_generation_provider(provider_key)
    identity = resolve_provider_identity(resolved_provider)
    provider_name = identity.provider
    model_name = identity.model
    prompt_version = PROMPT_VERSION_V2

    telemetry = InMemoryTelemetryRecorder()
    service = ConversationService(
        provider=resolved_provider,
        telemetry_recorder=telemetry,
    )
    structural_evaluator = StructuralEvaluator(expected_provider=provider_key)

    results: list[ScenarioRunResult] = []
    for scenario in scenarios:
        result = run_scenario(
            scenario,
            service=service,
            structural_evaluator=structural_evaluator,
            provider_name=provider_name,
            model_name=model_name,
            prompt_version=prompt_version,
        )
        # Prefer telemetry prompt version when present.
        if telemetry.last_event is not None:
            result.prompt_version = telemetry.last_event.prompt_version
            result.provider = telemetry.last_event.provider
            result.model = telemetry.last_event.model
            if result.latency_ms is None:
                result.latency_ms = telemetry.last_event.latency_ms
        results.append(result)

    report = aggregate_report(
        dataset_version=dataset.version,
        rubric_version=rubric.version,
        provider=provider_name,
        model=model_name,
        prompt_version=prompt_version,
        execution_timestamp=datetime.now(timezone.utc).isoformat(),
        results=results,
    )
    written = write_report(report, output_path)
    if write_review_template:
        review_path = Path(output_path).with_name(
            Path(output_path).stem + "-human-review.csv"
        )
        write_human_review_template(results, review_path)
    return written


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Ask quality evaluation baseline runner (P1-T05-02)",
    )
    parser.add_argument(
        "--dataset",
        default=str(default_dataset_path()),
        help="Path to versioned dataset JSON",
    )
    parser.add_argument(
        "--rubric",
        default=str(default_rubric_path()),
        help="Path to versioned rubric JSON",
    )
    parser.add_argument(
        "--provider",
        choices=("static", "openai"),
        default="static",
        help="Generation provider key (uses existing factory/runtime config)",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output path for baseline JSON report",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional max number of scenarios to run",
    )
    scenario_select = parser.add_mutually_exclusive_group()
    scenario_select.add_argument(
        "--scenario-id",
        default=None,
        help="Optional single scenario id to run",
    )
    scenario_select.add_argument(
        "--scenario-ids",
        default=None,
        help="Optional comma-separated scenario ids to run (caller order preserved)",
    )
    parser.add_argument(
        "--no-review-template",
        action="store_true",
        help="Skip writing the companion human-review CSV template",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    scenario_ids = (
        _parse_scenario_ids_arg(args.scenario_ids)
        if args.scenario_ids is not None
        else None
    )
    try:
        output = run_evaluation(
            dataset_path=args.dataset,
            rubric_path=args.rubric,
            provider_key=args.provider,
            output_path=args.output,
            limit=args.limit,
            scenario_id=args.scenario_id,
            scenario_ids=scenario_ids,
            write_review_template=not args.no_review_template,
        )
    except DatasetValidationError as exc:
        print(f"evaluation configuration error: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:  # noqa: BLE001
        print(f"evaluation failed: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote baseline report: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
