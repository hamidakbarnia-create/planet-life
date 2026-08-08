"""AC-07 contract tests for DecisionEvaluationPackage v1."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import ValidationError
from pydantic import ValidationError as PydanticValidationError

from packages.decision_engine.package_models import DecisionEvaluationPackage


ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = ROOT / "schemas" / "decision_evaluation_package.v1.json"
FIXTURES = ROOT / "tests" / "fixtures"

CANONICAL_MODULES = {
    "recommendation",
    "timing",
    "confidence",
    "evidence",
    "drivers",
    "tradeoffs",
    "risks",
    "opportunities",
    "action_plan",
    "counter_recommendation",
    "explainability",
    "improve_accuracy",
    "next_decisions",
    "related_decisions",
}


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def schema() -> dict[str, Any]:
    loaded = _load_json(SCHEMA_PATH)
    Draft202012Validator.check_schema(loaded)
    return loaded


@pytest.fixture(scope="module")
def validator(schema: dict[str, Any]) -> Draft202012Validator:
    return Draft202012Validator(schema, format_checker=FormatChecker())


@pytest.mark.parametrize(
    "fixture_name",
    [
        "package_evaluate_date.valid.json",
        "package_compare_dates.valid.json",
    ],
)
def test_golden_fixtures_validate_against_json_schema(
    validator: Draft202012Validator,
    fixture_name: str,
) -> None:
    validator.validate(_load_json(FIXTURES / fixture_name))


@pytest.mark.parametrize(
    "fixture_name",
    [
        "package_evaluate_date.valid.json",
        "package_compare_dates.valid.json",
    ],
)
def test_golden_fixtures_validate_against_python_models(
    fixture_name: str,
) -> None:
    payload = _load_json(FIXTURES / fixture_name)
    model = DecisionEvaluationPackage.model_validate(payload)
    assert model.schema_version == "1.0.0"


def test_schema_requires_exact_canonical_module_set(
    schema: dict[str, Any],
) -> None:
    required = set(schema["required"])
    assert CANONICAL_MODULES <= required

    retired_aliases = {
        "answer",
        "reasoning",
        "uncertainty",
        "sources",
        "summary",
        "decision_outcome",
    }
    assert retired_aliases.isdisjoint(schema["properties"])


def test_unknown_root_module_is_rejected(
    validator: Draft202012Validator,
) -> None:
    payload = _load_json(FIXTURES / "package_evaluate_date.valid.json")
    payload["unknown_module"] = {"value": True}

    with pytest.raises(ValidationError):
        validator.validate(payload)

    with pytest.raises(PydanticValidationError):
        DecisionEvaluationPackage.model_validate(payload)


def test_missing_canonical_module_is_rejected(
    validator: Draft202012Validator,
) -> None:
    payload = _load_json(FIXTURES / "package_evaluate_date.valid.json")
    del payload["evidence"]

    with pytest.raises(ValidationError):
        validator.validate(payload)


def test_evaluate_date_requires_exactly_one_candidate(
    validator: Draft202012Validator,
) -> None:
    payload = _load_json(FIXTURES / "package_evaluate_date.valid.json")
    payload["timing"]["candidates"].append(
        copy.deepcopy(payload["timing"]["candidates"][0])
    )

    with pytest.raises(ValidationError):
        validator.validate(payload)

    with pytest.raises(PydanticValidationError):
        DecisionEvaluationPackage.model_validate(payload)


def test_compare_dates_requires_at_least_two_candidates(
    validator: Draft202012Validator,
) -> None:
    payload = _load_json(FIXTURES / "package_compare_dates.valid.json")
    payload["timing"]["candidates"] = payload["timing"]["candidates"][:1]

    with pytest.raises(ValidationError):
        validator.validate(payload)


def test_schema_version_is_frozen(
    validator: Draft202012Validator,
) -> None:
    payload = _load_json(FIXTURES / "package_evaluate_date.valid.json")
    payload["schema_version"] = "1.1.0"

    with pytest.raises(ValidationError):
        validator.validate(payload)


def test_package_models_are_immutable() -> None:
    payload = _load_json(FIXTURES / "package_evaluate_date.valid.json")
    model = DecisionEvaluationPackage.model_validate(payload)

    with pytest.raises(PydanticValidationError):
        model.schema_version = "1.1.0"  # type: ignore[misc]


def test_envelope_and_confidence_precision_must_match() -> None:
    payload = _load_json(FIXTURES / "package_evaluate_date.valid.json")
    payload["confidence"]["precision_level"] = "L4"

    with pytest.raises(PydanticValidationError):
        DecisionEvaluationPackage.model_validate(payload)


def test_no_unique_winner_stance_is_valid_and_prefer_alternate_remains(
    validator: Draft202012Validator,
) -> None:
    """Minimal stance extension for honest COMPARE ties; prefer_alternate stays."""
    payload = _load_json(FIXTURES / "package_compare_dates.valid.json")
    assert payload["recommendation"]["stance"] == "prefer_alternate"
    validator.validate(payload)
    DecisionEvaluationPackage.model_validate(payload)

    tied = copy.deepcopy(payload)
    tied["recommendation"]["stance"] = "no_unique_winner"
    tied["recommendation"]["summary"] = "No unique winner among the compared dates."
    validator.validate(tied)
    model = DecisionEvaluationPackage.model_validate(tied)
    assert model.recommendation.stance == "no_unique_winner"
