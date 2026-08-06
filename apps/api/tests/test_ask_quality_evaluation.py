"""Tests for Ask quality evaluation baseline (P1-T05-02).

No live network calls. Uses fake providers for runner paths.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from evaluations.ask.dataset import (  # noqa: E402
    DatasetValidationError,
    default_dataset_path,
    default_rubric_path,
    load_dataset,
    load_rubric,
)
from evaluations.ask.models import (  # noqa: E402
    HUMAN_REVIEW_FIELDS,
    REQUIRED_RUBRIC_DIMENSIONS,
    EvalMessage,
    EvalScenario,
    ScenarioRunResult,
    StructuralCheckResult,
    StructuralEvaluation,
)
from evaluations.ask.reporting import (  # noqa: E402
    aggregate_report,
    human_review_jsonl_schema,
    write_human_review_template,
    write_report,
)
from evaluations.ask.runner import (  # noqa: E402
    build_arg_parser,
    main,
    run_evaluation,
    run_scenario,
)
from evaluations.ask.structural_evaluator import StructuralEvaluator  # noqa: E402
from services.generation.errors import GenerationProviderError  # noqa: E402
from services.generation.ports import GenerationResult  # noqa: E402
from services.generation.prompt_builder import (  # noqa: E402
    PROMPT_VERSION_V2,
    STATIC_CONVERSATIONAL_PROMPT,
)
from services.generation.service import ConversationService  # noqa: E402
from services.generation.telemetry import InMemoryTelemetryRecorder  # noqa: E402

EVAL_ROOT = Path(__file__).resolve().parents[1] / "evaluations" / "ask"
DATASET_PATH = EVAL_ROOT / "dataset_v1.json"
RUBRIC_PATH = EVAL_ROOT / "rubric_v1.json"


def _scenario(
    *,
    scenario_id: str = "ask-test-001",
    locale: str = "en",
    expected: tuple[str, ...] = ("direct",),
    forbidden: tuple[str, ...] = ("fabricated personal context",),
    forbidden_phrases: tuple[str, ...] = (),
    content: str = "Help me decide between A and B.",
) -> EvalScenario:
    return EvalScenario(
        id=scenario_id,
        category="decision_support",
        locale=locale,  # type: ignore[arg-type]
        messages=(EvalMessage(role="user", content=content),),
        available_context={},
        expected_characteristics=expected,
        forbidden_characteristics=forbidden,
        risk_level="low",
        forbidden_phrases=forbidden_phrases,
    )


def _write_dataset(tmp_path: Path, scenarios: list[dict]) -> Path:
    path = tmp_path / "dataset.json"
    path.write_text(
        json.dumps({"version": "v1-test", "scenarios": scenarios}, ensure_ascii=False),
        encoding="utf-8",
    )
    return path


def _base_scenario_dict(**overrides) -> dict:
    payload = {
        "id": "ask-x-001",
        "category": "decision_support",
        "locale": "en",
        "messages": [{"role": "user", "content": "Hello"}],
        "available_context": {},
        "expected_characteristics": ["direct"],
        "forbidden_characteristics": ["generic motivational filler"],
        "risk_level": "low",
        "forbidden_phrases": [],
    }
    payload.update(overrides)
    return payload


# --- Dataset / rubric schema ---


def test_default_dataset_and_rubric_paths_exist() -> None:
    assert DATASET_PATH.is_file()
    assert RUBRIC_PATH.is_file()
    assert default_dataset_path().is_file()
    assert default_rubric_path().is_file()


def test_dataset_v1_schema_and_counts() -> None:
    dataset = load_dataset(DATASET_PATH)
    assert dataset.version == "v1"
    assert len(dataset.scenarios) >= 60
    locales = {item.locale for item in dataset.scenarios}
    assert locales >= {"en", "fa", "ar", "ru"}
    en = sum(1 for item in dataset.scenarios if item.locale == "en")
    fa = sum(1 for item in dataset.scenarios if item.locale == "fa")
    ar = sum(1 for item in dataset.scenarios if item.locale == "ar")
    ru = sum(1 for item in dataset.scenarios if item.locale == "ru")
    assert en >= 35
    assert fa >= 10
    assert ar >= 8
    assert ru >= 7
    ids = [item.id for item in dataset.scenarios]
    assert len(ids) == len(set(ids))


def test_duplicate_scenario_id_rejected(tmp_path: Path) -> None:
    path = _write_dataset(
        tmp_path,
        [_base_scenario_dict(id="ask-dup"), _base_scenario_dict(id="ask-dup")],
    )
    with pytest.raises(DatasetValidationError, match="duplicate scenario id"):
        load_dataset(path)


def test_invalid_role_rejected(tmp_path: Path) -> None:
    path = _write_dataset(
        tmp_path,
        [
            _base_scenario_dict(
                messages=[{"role": "system", "content": "nope"}],
            )
        ],
    )
    with pytest.raises(DatasetValidationError, match="role is invalid"):
        load_dataset(path)


def test_invalid_locale_rejected(tmp_path: Path) -> None:
    path = _write_dataset(tmp_path, [_base_scenario_dict(locale="de")])
    with pytest.raises(DatasetValidationError, match="locale is invalid"):
        load_dataset(path)


def test_missing_expected_characteristics_rejected(tmp_path: Path) -> None:
    path = _write_dataset(
        tmp_path,
        [_base_scenario_dict(expected_characteristics=[])],
    )
    with pytest.raises(DatasetValidationError, match="expected_characteristics"):
        load_dataset(path)


def test_rubric_v1_schema_validation() -> None:
    rubric = load_rubric(RUBRIC_PATH)
    assert rubric.version == "v1"
    assert rubric.scale_min == 0
    assert rubric.scale_max == 4
    names = [item.dimension for item in rubric.dimensions]
    assert names == list(REQUIRED_RUBRIC_DIMENSIONS)
    for dimension in rubric.dimensions:
        assert [score.score for score in dimension.scores] == [0, 1, 2, 3, 4]
        for score in dimension.scores:
            assert score.criterion.strip()
            assert score.criterion.lower() not in {"good", "better", "ok"}


# --- Structural evaluator ---


def test_structural_evaluator_pass_case() -> None:
    scenario = _scenario(
        expected=("direct",),
        forbidden_phrases=("guaranteed return",),
    )
    response = (
        "Compare runway, learning rate, and stress. "
        "A practical next step is to write both offers as trade-off tables today."
    )
    result = StructuralEvaluator(expected_provider="static").evaluate(scenario, response)
    assert result.passed
    assert all(check.passed for check in result.checks)


def test_structural_evaluator_empty_fails() -> None:
    result = StructuralEvaluator().evaluate(_scenario(), "   ")
    assert not result.passed
    assert any(check.check_id == "non_empty" and not check.passed for check in result.checks)


def test_structural_evaluator_prompt_leakage() -> None:
    leaked = '## System Role\nYou are METIORO\nprompt_version = "v2"'
    result = StructuralEvaluator().evaluate(_scenario(), leaked)
    assert not result.passed
    assert any(
        check.check_id == "no_prompt_leakage" and not check.passed
        for check in result.checks
    )


def test_structural_evaluator_placeholder_leakage() -> None:
    result = StructuralEvaluator().evaluate(
        _scenario(),
        "Based on [vault] and [calendar] you should resign.",
    )
    assert not result.passed
    assert any(
        check.check_id == "no_placeholder_leakage" and not check.passed
        for check in result.checks
    )


def test_structural_evaluator_duplicate_paragraphs() -> None:
    paragraph = "This is a sufficiently long paragraph used to detect duplication issues in responses."
    response = f"{paragraph}\n\n{paragraph}"
    result = StructuralEvaluator().evaluate(_scenario(), response)
    assert not result.passed
    assert any(
        check.check_id == "no_duplicated_paragraphs" and not check.passed
        for check in result.checks
    )


def test_structural_evaluator_static_fallback_for_openai() -> None:
    result = StructuralEvaluator(expected_provider="openai").evaluate(
        _scenario(),
        STATIC_CONVERSATIONAL_PROMPT,
    )
    assert not result.passed
    assert any(
        check.check_id == "no_static_fallback_for_openai" and not check.passed
        for check in result.checks
    )


def test_structural_evaluator_forbidden_phrase() -> None:
    result = StructuralEvaluator().evaluate(
        _scenario(forbidden_phrases=("guaranteed return",)),
        "This is a guaranteed return opportunity.",
    )
    assert not result.passed
    assert any(
        check.check_id == "no_forbidden_phrases" and not check.passed
        for check in result.checks
    )


def test_structural_evaluator_uncertainty_characteristic() -> None:
    scenario = _scenario(expected=("acknowledges uncertainty",))
    missing = StructuralEvaluator().evaluate(scenario, "You must resign tomorrow.")
    present = StructuralEvaluator().evaluate(
        scenario,
        "It depends on missing details; the outcome is uncertain without runway data.",
    )
    assert any(
        check.check_id == "characteristic_uncertainty" and not check.passed
        for check in missing.checks
    )
    assert any(
        check.check_id == "characteristic_uncertainty" and check.passed
        for check in present.checks
    )


# --- Runner / reporting ---


def test_runner_continues_after_one_scenario_fails(tmp_path: Path) -> None:
    dataset_path = _write_dataset(
        tmp_path,
        [
            _base_scenario_dict(id="ask-ok", expected_characteristics=["direct"]),
            _base_scenario_dict(id="ask-fail", expected_characteristics=["direct"]),
        ],
    )
    rubric_path = RUBRIC_PATH
    output = tmp_path / "report.json"

    provider = MagicMock()
    provider.provider_name = "fake"
    provider.model_name = "fake-model"

    def _generate(generation_input, *, prompt: str):
        _ = prompt
        if generation_input.request_id.endswith("ask-fail"):
            raise GenerationProviderError("Conversation generation provider failed")
        return GenerationResult(
            response_type="conversational",
            message=(
                "Here is a direct next step: list constraints, then choose one action."
            ),
            sources=(),
            request_id=generation_input.request_id,
        )

    provider.generate.side_effect = _generate

    written = run_evaluation(
        dataset_path=dataset_path,
        rubric_path=rubric_path,
        provider_key="static",
        output_path=output,
        provider=provider,
        write_review_template=True,
    )
    report = json.loads(written.read_text(encoding="utf-8"))
    assert report["scenario_count"] == 2
    assert report["failure_count"] >= 1
    assert report["success_count"] >= 1
    assert report["provider"] == "fake"
    assert report["model"] == "fake-model"
    assert report["prompt_version"] == PROMPT_VERSION_V2
    assert report["subjective_scores_included"] is False
    ids = {item["scenario_id"] for item in report["scenarios"]}
    assert ids == {"ask-ok", "ask-fail"}
    review_csv = output.with_name("report-human-review.csv")
    assert review_csv.is_file()


def test_static_provider_baseline_execution(tmp_path: Path) -> None:
    dataset_path = _write_dataset(
        tmp_path,
        [_base_scenario_dict(id="ask-static-1")],
    )
    output = tmp_path / "static.json"
    written = run_evaluation(
        dataset_path=dataset_path,
        rubric_path=RUBRIC_PATH,
        provider_key="static",
        output_path=output,
        write_review_template=False,
    )
    report = json.loads(written.read_text(encoding="utf-8"))
    assert report["scenario_count"] == 1
    assert report["provider"] == "static"
    assert report["model"] == "static"
    assert report["prompt_version"] == "v2"
    assert report["scenarios"][0]["response"] == STATIC_CONVERSATIONAL_PROMPT


def test_report_aggregation_and_metadata() -> None:
    results = [
        ScenarioRunResult(
            scenario_id="ask-a",
            category="planning",
            locale="en",
            success=True,
            response="ok",
            provider="static",
            model="static",
            prompt_version="v2",
            latency_ms=10.0,
            validation_ok=True,
            error_type=None,
            error_message=None,
            structural=StructuralEvaluation(
                passed=True,
                checks=(
                    StructuralCheckResult("non_empty", True, "ok"),
                ),
            ),
        ),
        ScenarioRunResult(
            scenario_id="ask-b",
            category="planning",
            locale="fa",
            success=False,
            response=None,
            provider="static",
            model="static",
            prompt_version="v2",
            latency_ms=20.0,
            validation_ok=False,
            error_type="provider",
            error_message="failed",
            structural=StructuralEvaluation(
                passed=False,
                checks=(
                    StructuralCheckResult("provider_success", False, "failed"),
                ),
            ),
        ),
    ]
    report = aggregate_report(
        dataset_version="v1",
        rubric_version="v1",
        provider="static",
        model="static",
        prompt_version="v2",
        execution_timestamp="2026-07-20T00:00:00+00:00",
        results=results,
    )
    assert report.scenario_count == 2
    assert report.success_count == 1
    assert report.failure_count == 1
    assert report.provider_failures == 1
    assert report.validation_failures == 1
    assert report.category_breakdown["planning"]["total"] == 2
    assert report.locale_breakdown["en"]["success"] == 1
    assert report.latency_statistics["mean_ms"] == 15.0
    assert report.subjective_scores_included is False


def test_run_scenario_captures_prompt_version_via_service() -> None:
    provider = MagicMock()
    provider.provider_name = "fake"
    provider.model_name = "fake-model"
    provider.generate.return_value = GenerationResult(
        response_type="conversational",
        message="A concise next step is to clarify constraints before deciding.",
        sources=(),
        request_id="eval-ask-test-001",
    )
    recorder = InMemoryTelemetryRecorder()
    service = ConversationService(provider=provider, telemetry_recorder=recorder)
    result = run_scenario(
        _scenario(),
        service=service,
        structural_evaluator=StructuralEvaluator(expected_provider="static"),
        provider_name="fake",
        model_name="fake-model",
        prompt_version=PROMPT_VERSION_V2,
    )
    assert result.prompt_version == "v2"
    assert recorder.last_event is not None
    assert recorder.last_event.prompt_version == "v2"
    # Ensure provider received a system prompt without conversation duplication markers.
    _, kwargs = provider.generate.call_args
    assert "## System Role" in kwargs["prompt"]
    assert "## Conversation" not in kwargs["prompt"]


def test_human_review_template_fields(tmp_path: Path) -> None:
    path = tmp_path / "review.csv"
    write_human_review_template(
        [
            ScenarioRunResult(
                scenario_id="ask-1",
                category="planning",
                locale="en",
                success=True,
                response="hello",
                provider="static",
                model="static",
                prompt_version="v2",
                latency_ms=1.0,
                validation_ok=True,
                error_type=None,
                error_message=None,
                structural=None,
            )
        ],
        path,
    )
    content = path.read_text(encoding="utf-8")
    header = content.splitlines()[0]
    for field in HUMAN_REVIEW_FIELDS:
        assert field in header
    schema = human_review_jsonl_schema()
    assert schema["fields"] == list(HUMAN_REVIEW_FIELDS)


def test_write_report_roundtrip(tmp_path: Path) -> None:
    report = aggregate_report(
        dataset_version="v1",
        rubric_version="v1",
        provider="static",
        model="static",
        prompt_version="v2",
        execution_timestamp="2026-07-20T00:00:00+00:00",
        results=[],
    )
    path = write_report(report, tmp_path / "empty.json")
    loaded = json.loads(path.read_text(encoding="utf-8"))
    assert loaded["scenario_count"] == 0
    assert loaded["subjective_scores_included"] is False


# --- Selected scenario IDs (P1-T05-03A) ---


def _fake_provider() -> MagicMock:
    provider = MagicMock()
    provider.provider_name = "fake"
    provider.model_name = "fake-model"
    provider.generate.return_value = GenerationResult(
        response_type="conversational",
        message=(
            "Here is a direct next step: list constraints, then choose one action."
        ),
        sources=(),
        request_id="eval",
    )
    return provider


def _multi_scenario_dataset(tmp_path: Path) -> Path:
    return _write_dataset(
        tmp_path,
        [
            _base_scenario_dict(id="ask-001"),
            _base_scenario_dict(id="ask-002"),
            _base_scenario_dict(id="ask-003"),
            _base_scenario_dict(id="ask-025"),
        ],
    )


def test_scenario_ids_preserves_caller_order(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    output = tmp_path / "ordered.json"
    provider = _fake_provider()
    written = run_evaluation(
        dataset_path=dataset_path,
        rubric_path=RUBRIC_PATH,
        provider_key="static",
        output_path=output,
        scenario_ids=["ask-003", "ask-001", "ask-025"],
        provider=provider,
        write_review_template=False,
    )
    report = json.loads(written.read_text(encoding="utf-8"))
    assert [item["scenario_id"] for item in report["scenarios"]] == [
        "ask-003",
        "ask-001",
        "ask-025",
    ]
    assert report["scenario_count"] == 3
    assert provider.generate.call_count == 3


def test_scenario_ids_rejects_duplicates_before_provider(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    provider = _fake_provider()
    with pytest.raises(
        DatasetValidationError,
        match="duplicate scenario id in --scenario-ids",
    ):
        run_evaluation(
            dataset_path=dataset_path,
            rubric_path=RUBRIC_PATH,
            provider_key="static",
            output_path=tmp_path / "dup.json",
            scenario_ids=["ask-001", "ask-003", "ask-001"],
            provider=provider,
            write_review_template=False,
        )
    provider.generate.assert_not_called()


def test_scenario_ids_rejects_unknown_before_provider(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    provider = _fake_provider()
    with pytest.raises(DatasetValidationError, match="scenario not found: ask-999"):
        run_evaluation(
            dataset_path=dataset_path,
            rubric_path=RUBRIC_PATH,
            provider_key="static",
            output_path=tmp_path / "unknown.json",
            scenario_ids=["ask-001", "ask-999"],
            provider=provider,
            write_review_template=False,
        )
    provider.generate.assert_not_called()


def test_scenario_ids_rejects_empty_before_provider(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    provider = _fake_provider()
    with pytest.raises(DatasetValidationError, match="empty scenario id"):
        run_evaluation(
            dataset_path=dataset_path,
            rubric_path=RUBRIC_PATH,
            provider_key="static",
            output_path=tmp_path / "empty-id.json",
            scenario_ids=["ask-001", "", "ask-003"],
            provider=provider,
            write_review_template=False,
        )
    provider.generate.assert_not_called()

    with pytest.raises(DatasetValidationError, match="must not be empty"):
        run_evaluation(
            dataset_path=dataset_path,
            rubric_path=RUBRIC_PATH,
            provider_key="static",
            output_path=tmp_path / "empty-list.json",
            scenario_ids=[],
            provider=provider,
            write_review_template=False,
        )
    provider.generate.assert_not_called()


def test_scenario_id_and_scenario_ids_mutually_exclusive(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    provider = _fake_provider()
    with pytest.raises(
        DatasetValidationError,
        match="mutually exclusive",
    ):
        run_evaluation(
            dataset_path=dataset_path,
            rubric_path=RUBRIC_PATH,
            provider_key="static",
            output_path=tmp_path / "conflict.json",
            scenario_id="ask-001",
            scenario_ids=["ask-003"],
            provider=provider,
            write_review_template=False,
        )
    provider.generate.assert_not_called()


def test_limit_cannot_combine_with_scenario_ids(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    provider = _fake_provider()
    with pytest.raises(
        DatasetValidationError,
        match="--limit cannot be combined with --scenario-ids",
    ):
        run_evaluation(
            dataset_path=dataset_path,
            rubric_path=RUBRIC_PATH,
            provider_key="static",
            output_path=tmp_path / "limit-conflict.json",
            scenario_ids=["ask-001", "ask-003"],
            limit=1,
            provider=provider,
            write_review_template=False,
        )
    provider.generate.assert_not_called()


def test_cli_scenario_id_and_scenario_ids_conflict(tmp_path: Path) -> None:
    parser = build_arg_parser()
    with pytest.raises(SystemExit):
        parser.parse_args(
            [
                "--output",
                str(tmp_path / "out.json"),
                "--scenario-id",
                "ask-001",
                "--scenario-ids",
                "ask-003,ask-025",
            ]
        )


def test_cli_scenario_ids_runs_selected_order(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    output = tmp_path / "cli-pilot.json"
    exit_code = main(
        [
            "--dataset",
            str(dataset_path),
            "--rubric",
            str(RUBRIC_PATH),
            "--provider",
            "static",
            "--scenario-ids",
            "ask-025,ask-001,ask-003",
            "--output",
            str(output),
            "--no-review-template",
        ]
    )
    assert exit_code == 0
    report = json.loads(output.read_text(encoding="utf-8"))
    assert [item["scenario_id"] for item in report["scenarios"]] == [
        "ask-025",
        "ask-001",
        "ask-003",
    ]


def test_cli_limit_with_scenario_ids_rejected(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    exit_code = main(
        [
            "--dataset",
            str(dataset_path),
            "--rubric",
            str(RUBRIC_PATH),
            "--provider",
            "static",
            "--scenario-ids",
            "ask-001,ask-003",
            "--limit",
            "1",
            "--output",
            str(tmp_path / "cli-limit.json"),
            "--no-review-template",
        ]
    )
    assert exit_code == 2


def test_scenario_id_selection_unchanged(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    output = tmp_path / "single.json"
    written = run_evaluation(
        dataset_path=dataset_path,
        rubric_path=RUBRIC_PATH,
        provider_key="static",
        output_path=output,
        scenario_id="ask-002",
        write_review_template=False,
    )
    report = json.loads(written.read_text(encoding="utf-8"))
    assert report["scenario_count"] == 1
    assert report["scenarios"][0]["scenario_id"] == "ask-002"


def test_limit_selection_unchanged(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    output = tmp_path / "limited.json"
    written = run_evaluation(
        dataset_path=dataset_path,
        rubric_path=RUBRIC_PATH,
        provider_key="static",
        output_path=output,
        limit=2,
        write_review_template=False,
    )
    report = json.loads(written.read_text(encoding="utf-8"))
    assert [item["scenario_id"] for item in report["scenarios"]] == [
        "ask-001",
        "ask-002",
    ]


def test_full_dataset_selection_unchanged(tmp_path: Path) -> None:
    dataset_path = _multi_scenario_dataset(tmp_path)
    output = tmp_path / "full.json"
    written = run_evaluation(
        dataset_path=dataset_path,
        rubric_path=RUBRIC_PATH,
        provider_key="static",
        output_path=output,
        write_review_template=False,
    )
    report = json.loads(written.read_text(encoding="utf-8"))
    assert [item["scenario_id"] for item in report["scenarios"]] == [
        "ask-001",
        "ask-002",
        "ask-003",
        "ask-025",
    ]
    assert report["scenario_count"] == 4
