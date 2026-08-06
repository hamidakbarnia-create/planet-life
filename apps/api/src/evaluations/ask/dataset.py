"""Load and validate versioned Ask evaluation datasets and rubrics."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from evaluations.ask.models import (
    ALLOWED_LOCALES,
    ALLOWED_RISK_LEVELS,
    ALLOWED_ROLES,
    REQUIRED_RUBRIC_DIMENSIONS,
    SCORE_SCALE,
    EvalDataset,
    EvalMessage,
    EvalRubric,
    EvalScenario,
    RubricDimension,
    RubricScoreDefinition,
)


class DatasetValidationError(ValueError):
    """Raised when an evaluation dataset or rubric fails schema validation."""


def _require_dict(value: Any, *, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise DatasetValidationError(f"{label} must be an object")
    return value


def _require_str(value: Any, *, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise DatasetValidationError(f"{label} must be a non-empty string")
    return value


def _require_list(value: Any, *, label: str) -> list[Any]:
    if not isinstance(value, list):
        raise DatasetValidationError(f"{label} must be an array")
    return value


def _parse_message(raw: Any, *, scenario_id: str, index: int) -> EvalMessage:
    data = _require_dict(raw, label=f"{scenario_id}.messages[{index}]")
    role = _require_str(data.get("role"), label=f"{scenario_id}.messages[{index}].role")
    if role not in ALLOWED_ROLES:
        raise DatasetValidationError(
            f"{scenario_id}.messages[{index}].role is invalid: {role!r}"
        )
    content = _require_str(
        data.get("content"),
        label=f"{scenario_id}.messages[{index}].content",
    )
    return EvalMessage(role=role, content=content)  # type: ignore[arg-type]


def _parse_scenario(raw: Any) -> EvalScenario:
    data = _require_dict(raw, label="scenario")
    scenario_id = _require_str(data.get("id"), label="scenario.id")
    category = _require_str(data.get("category"), label=f"{scenario_id}.category")
    locale = _require_str(data.get("locale"), label=f"{scenario_id}.locale")
    if locale not in ALLOWED_LOCALES:
        raise DatasetValidationError(
            f"{scenario_id}.locale is invalid: {locale!r}"
        )
    risk_level = _require_str(
        data.get("risk_level"),
        label=f"{scenario_id}.risk_level",
    )
    if risk_level not in ALLOWED_RISK_LEVELS:
        raise DatasetValidationError(
            f"{scenario_id}.risk_level is invalid: {risk_level!r}"
        )

    messages_raw = _require_list(data.get("messages"), label=f"{scenario_id}.messages")
    if not messages_raw:
        raise DatasetValidationError(f"{scenario_id}.messages must not be empty")
    messages = tuple(
        _parse_message(item, scenario_id=scenario_id, index=index)
        for index, item in enumerate(messages_raw)
    )
    if messages[-1].role != "user":
        raise DatasetValidationError(
            f"{scenario_id}.messages must end with a user turn"
        )

    expected = _require_list(
        data.get("expected_characteristics"),
        label=f"{scenario_id}.expected_characteristics",
    )
    if not expected:
        raise DatasetValidationError(
            f"{scenario_id}.expected_characteristics must not be empty"
        )
    for index, item in enumerate(expected):
        _require_str(item, label=f"{scenario_id}.expected_characteristics[{index}]")

    forbidden = _require_list(
        data.get("forbidden_characteristics"),
        label=f"{scenario_id}.forbidden_characteristics",
    )
    for index, item in enumerate(forbidden):
        _require_str(item, label=f"{scenario_id}.forbidden_characteristics[{index}]")

    available_context = data.get("available_context", {})
    if available_context is None:
        available_context = {}
    if not isinstance(available_context, dict):
        raise DatasetValidationError(
            f"{scenario_id}.available_context must be an object"
        )

    forbidden_phrases_raw = data.get("forbidden_phrases", [])
    if forbidden_phrases_raw is None:
        forbidden_phrases_raw = []
    forbidden_phrases_list = _require_list(
        forbidden_phrases_raw,
        label=f"{scenario_id}.forbidden_phrases",
    )
    forbidden_phrases = tuple(
        _require_str(item, label=f"{scenario_id}.forbidden_phrases[{index}]")
        for index, item in enumerate(forbidden_phrases_list)
    )

    return EvalScenario(
        id=scenario_id,
        category=category,
        locale=locale,  # type: ignore[arg-type]
        messages=messages,
        available_context=dict(available_context),
        expected_characteristics=tuple(str(item) for item in expected),
        forbidden_characteristics=tuple(str(item) for item in forbidden),
        risk_level=risk_level,  # type: ignore[arg-type]
        forbidden_phrases=forbidden_phrases,
    )


def load_dataset(path: str | Path) -> EvalDataset:
    """Load and validate a versioned Ask evaluation dataset."""
    dataset_path = Path(path)
    try:
        raw = json.loads(dataset_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise DatasetValidationError(f"dataset not found: {dataset_path}") from exc
    except json.JSONDecodeError as exc:
        raise DatasetValidationError(f"dataset is not valid JSON: {exc}") from exc

    data = _require_dict(raw, label="dataset")
    version = _require_str(data.get("version"), label="dataset.version")
    scenarios_raw = _require_list(data.get("scenarios"), label="dataset.scenarios")
    if not scenarios_raw:
        raise DatasetValidationError("dataset.scenarios must not be empty")

    scenarios: list[EvalScenario] = []
    seen_ids: set[str] = set()
    for raw_scenario in scenarios_raw:
        scenario = _parse_scenario(raw_scenario)
        if scenario.id in seen_ids:
            raise DatasetValidationError(f"duplicate scenario id: {scenario.id}")
        seen_ids.add(scenario.id)
        scenarios.append(scenario)

    return EvalDataset(version=version, scenarios=tuple(scenarios))


def load_rubric(path: str | Path) -> EvalRubric:
    """Load and validate a versioned Ask quality rubric."""
    rubric_path = Path(path)
    try:
        raw = json.loads(rubric_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise DatasetValidationError(f"rubric not found: {rubric_path}") from exc
    except json.JSONDecodeError as exc:
        raise DatasetValidationError(f"rubric is not valid JSON: {exc}") from exc

    data = _require_dict(raw, label="rubric")
    version = _require_str(data.get("version"), label="rubric.version")
    scale_min = data.get("scale_min", 0)
    scale_max = data.get("scale_max", 4)
    if not isinstance(scale_min, int) or not isinstance(scale_max, int):
        raise DatasetValidationError("rubric.scale_min/scale_max must be integers")
    if (scale_min, scale_max) != (min(SCORE_SCALE), max(SCORE_SCALE)):
        raise DatasetValidationError(
            f"rubric scale must be {min(SCORE_SCALE)}..{max(SCORE_SCALE)}"
        )

    dimensions_raw = _require_list(data.get("dimensions"), label="rubric.dimensions")
    dimensions: list[RubricDimension] = []
    seen: set[str] = set()
    for raw_dimension in dimensions_raw:
        item = _require_dict(raw_dimension, label="rubric.dimension")
        name = _require_str(item.get("dimension"), label="rubric.dimension.name")
        if name in seen:
            raise DatasetValidationError(f"duplicate rubric dimension: {name}")
        seen.add(name)
        scores_raw = item.get("scores")
        if not isinstance(scores_raw, dict):
            raise DatasetValidationError(
                f"rubric dimension {name}.scores must be an object"
            )
        parsed_scores: list[RubricScoreDefinition] = []
        for score in SCORE_SCALE:
            key = str(score)
            if key not in scores_raw:
                raise DatasetValidationError(
                    f"rubric dimension {name} missing score {key}"
                )
            criterion = _require_str(
                scores_raw[key],
                label=f"rubric.{name}.scores[{key}]",
            )
            parsed_scores.append(RubricScoreDefinition(score=score, criterion=criterion))
        dimensions.append(
            RubricDimension(dimension=name, scores=tuple(parsed_scores))
        )

    missing = [name for name in REQUIRED_RUBRIC_DIMENSIONS if name not in seen]
    if missing:
        raise DatasetValidationError(
            f"rubric missing required dimensions: {', '.join(missing)}"
        )
    extra = sorted(seen - set(REQUIRED_RUBRIC_DIMENSIONS))
    if extra:
        raise DatasetValidationError(
            f"rubric has unexpected dimensions: {', '.join(extra)}"
        )

    return EvalRubric(
        version=version,
        scale_min=scale_min,
        scale_max=scale_max,
        dimensions=tuple(dimensions),
    )


def default_dataset_path() -> Path:
    return (
        Path(__file__).resolve().parents[3]
        / "evaluations"
        / "ask"
        / "dataset_v1.json"
    )


def default_rubric_path() -> Path:
    return (
        Path(__file__).resolve().parents[3]
        / "evaluations"
        / "ask"
        / "rubric_v1.json"
    )
