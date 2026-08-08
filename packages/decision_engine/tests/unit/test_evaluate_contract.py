import pytest

from packages.decision_engine.evaluate.contract import EvaluateRuntimeContract


def _intake(value):
    return value


def _package(**kwargs):
    return kwargs


def test_contract_accepts_evaluate_runtime_bindings():
    contract = EvaluateRuntimeContract(
        decision_type_id="car-interview",
        mode="evaluate_date",
        engine_id="decision-engine-car-interview-v1",
        evaluate_intake=_intake,
        evaluate_package=_package,
    )

    assert contract.decision_type_id == "car-interview"
    assert contract.mode == "evaluate_date"
    assert contract.engine_id == "decision-engine-car-interview-v1"
    assert contract.evaluate_intake is _intake
    assert contract.evaluate_package is _package


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("decision_type_id", ""),
        ("decision_type_id", "   "),
        ("engine_id", ""),
        ("engine_id", "   "),
    ],
)
def test_contract_rejects_blank_identity_fields(field, value):
    kwargs = {
        "decision_type_id": "car-interview",
        "mode": "evaluate_date",
        "engine_id": "decision-engine-car-interview-v1",
        "evaluate_intake": _intake,
        "evaluate_package": _package,
    }
    kwargs[field] = value

    with pytest.raises(ValueError):
        EvaluateRuntimeContract(**kwargs)


def test_contract_rejects_non_evaluate_mode():
    with pytest.raises(ValueError, match="evaluate_date"):
        EvaluateRuntimeContract(
            decision_type_id="car-interview",
            mode="compare_dates",
            engine_id="decision-engine-car-interview-v1",
            evaluate_intake=_intake,
            evaluate_package=_package,
        )


def test_car_interview_runtime_implements_generic_contract():
    from packages.decision_engine.evaluate.car_interview_evaluate import (
        CAR_INTERVIEW_EVALUATE_RUNTIME,
        REAL_ENGINE_ID,
        evaluate_car_interview,
    )
    from packages.decision_engine.intake.car_interview import (
        CAR_INTERVIEW_DECISION_TYPE_ID,
    )
    from packages.decision_engine.intake.evaluator import (
        evaluate_car_interview_intake,
    )

    runtime = CAR_INTERVIEW_EVALUATE_RUNTIME

    assert runtime.decision_type_id == CAR_INTERVIEW_DECISION_TYPE_ID
    assert runtime.mode == "evaluate_date"
    assert runtime.engine_id == REAL_ENGINE_ID
    assert runtime.evaluate_intake is evaluate_car_interview_intake
    assert runtime.evaluate_package is evaluate_car_interview
