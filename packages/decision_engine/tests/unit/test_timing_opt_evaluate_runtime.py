"""Timing Opt Family EVALUATE — allowlist + family fail-closed."""

from __future__ import annotations

import pytest

from packages.decision_engine.evaluate.timing_opt_evaluate import evaluate_timing_opt
from packages.decision_engine.evaluate.timing_opt_semantics import (
    WeddingDateTimingOptSemantics,
)
from packages.decision_engine.evaluate.type_timing_opt_evaluate_config import (
    TimingOptTypeEvaluateConfig,
    get_timing_opt_type_evaluate_config,
    register_timing_opt_type_evaluate_config,
)
from packages.decision_engine.evaluate.product_launch_evaluate import (
    PRODUCT_LAUNCH_TYPE_CONFIG,
)
from packages.decision_engine.evaluate.wedding_date_evaluate import (
    WEDDING_DATE_TYPE_CONFIG,
)
from packages.decision_engine.intake.evaluator import evaluate_wedding_date_intake


def test_wedding_is_registered_as_timing_opt_config() -> None:
    cfg = get_timing_opt_type_evaluate_config("mar-wedding-date")
    assert cfg is WEDDING_DATE_TYPE_CONFIG
    assert cfg.family_id == "timing_opt"


def test_product_launch_is_registered_as_timing_opt_config() -> None:
    cfg = get_timing_opt_type_evaluate_config("bus-product-launch")
    assert cfg is PRODUCT_LAUNCH_TYPE_CONFIG
    assert cfg.family_id == "timing_opt"
    assert cfg.action_type == "business_launch"


def test_visibility_types_are_not_in_timing_opt_allowlist() -> None:
    assert get_timing_opt_type_evaluate_config("car-interview") is None
    assert get_timing_opt_type_evaluate_config("bus-investor-meeting") is None


def test_wrong_family_config_fails_closed() -> None:
    with pytest.raises(ValueError, match="family_id='timing_opt'"):
        TimingOptTypeEvaluateConfig(
            decision_type_id="mar-wedding-date",
            family_id="visibility",  # type: ignore[arg-type]
            engine_id="decision-engine-wedding-date-v1",
            action_type="wedding_date",
            decision_intent="x",
            evaluate_intake=evaluate_wedding_date_intake,
            build_request=lambda n, d: (_ for _ in ()).throw(AssertionError()),
            semantics=WeddingDateTimingOptSemantics(),
            incomplete_error_message="x",
            incomplete_details_key="missing",
        )


def test_register_rejects_non_timing_opt_family() -> None:
    cfg = object.__new__(TimingOptTypeEvaluateConfig)
    object.__setattr__(cfg, "decision_type_id", "ghost-timing-type")
    object.__setattr__(cfg, "family_id", "visibility")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "x")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_wedding_date_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", WeddingDateTimingOptSemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing")

    with pytest.raises(ValueError, match="family_id must be 'timing_opt'"):
        register_timing_opt_type_evaluate_config(cfg)


def test_evaluate_timing_opt_rejects_wrong_family_at_runtime() -> None:
    cfg = object.__new__(TimingOptTypeEvaluateConfig)
    object.__setattr__(cfg, "decision_type_id", "mar-wedding-date")
    object.__setattr__(cfg, "family_id", "visibility")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "wedding_date")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_wedding_date_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", WeddingDateTimingOptSemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing")

    with pytest.raises(ValueError, match="family_id='timing_opt'"):
        evaluate_timing_opt(
            cfg,
            case_id="00000000-0000-0000-0000-000000000099",
            case_version=1,
            intake={
                "target_date": "2026-10-10",
                "ceremony_type": "civil",
                "decision_frame": {
                    "operation": "evaluate",
                    "time_scope": "specific_date",
                    "date": "2026-10-10",
                },
            },
            generate_outcome=lambda _r: (_ for _ in ()).throw(AssertionError()),
        )
