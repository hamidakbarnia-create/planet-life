"""PR-1 runtime stub package validation for car-interview."""

from __future__ import annotations

from uuid import uuid4

import pytest
from jsonschema import Draft202012Validator, FormatChecker

import json
from pathlib import Path

from packages.decision_engine.evaluate.stub_package import (
    STUB_ENGINE_ID,
    build_car_interview_stub_package,
    build_car_interview_stub_package_dict,
)
from packages.decision_engine.package_models import DecisionEvaluationPackage

_ROOT = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _ROOT / "schemas" / "decision_evaluation_package.v1.json"


def test_stub_package_is_schema_and_model_valid() -> None:
    case_id = uuid4()
    package = build_car_interview_stub_package(
        case_id=case_id,
        case_version=2,
        intake={
            "target_date": "2026-08-10",
            "role": "Frontend Engineer",
            "company": "Metioro",
            "interview_type": "onsite",
        },
    )
    assert isinstance(package, DecisionEvaluationPackage)
    assert package.decision_type_id == "car-interview"
    assert package.family_id == "visibility"
    assert package.mode == "evaluate_date"
    assert package.engine_id == STUB_ENGINE_ID
    assert package.case_version == 2
    assert package.timing.candidates[0].date.isoformat() == "2026-08-10"

    schema = json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(
        package.model_dump(mode="json")
    )


def test_stub_package_dict_round_trips_model() -> None:
    payload = build_car_interview_stub_package_dict(
        case_id=uuid4(),
        case_version=1,
        intake={"target_date": "2026-08-12", "role": "Analyst"},
    )
    model = DecisionEvaluationPackage.model_validate(payload)
    assert model.recommendation.stance == "proceed_with_conditions"


def test_stub_rejects_incomplete_intake() -> None:
    with pytest.raises(ValueError, match="incomplete"):
        build_car_interview_stub_package(
            case_id=uuid4(),
            case_version=1,
            intake={"target_date": "2026-08-10"},
        )


def test_web_demo_fixture_conforms_to_package_v1() -> None:
    """Checked-in Web walking-skeleton fixture must stay schema/model valid."""
    fixture_path = (
        _ROOT.parents[1]
        / "apps"
        / "web"
        / "lib"
        / "decision-case"
        / "fixtures"
        / "car-interview-stub-package.demo.json"
    )
    payload = json.loads(fixture_path.read_text(encoding="utf-8"))
    schema = json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(payload)
    model = DecisionEvaluationPackage.model_validate(payload)
    assert model.engine_id == STUB_ENGINE_ID
    assert model.decision_type_id == "car-interview"
    assert any(p.code == "STUB_ENGINE" for p in model.confidence.penalties)
