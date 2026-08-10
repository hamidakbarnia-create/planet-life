"""Product Launch Timing Opt FIND — allowlist + family fail-closed."""

from __future__ import annotations

import pytest

from packages.decision_engine.evaluate.product_launch_find import (
    PRODUCT_LAUNCH_FIND_TYPE_CONFIG,
    REAL_ENGINE_ID,
)
from packages.decision_engine.evaluate.timing_opt_find import find_timing_opt
from packages.decision_engine.evaluate.timing_opt_semantics import (
    ProductLaunchTimingOptFindSemantics,
)
from packages.decision_engine.evaluate.type_timing_opt_find_config import (
    TimingOptTypeFindConfig,
    get_timing_opt_type_find_config,
    register_timing_opt_type_find_config,
)
from packages.decision_engine.intake.evaluator import evaluate_product_launch_intake


def test_product_launch_is_registered_as_timing_opt_find_config() -> None:
    cfg = get_timing_opt_type_find_config("bus-product-launch")
    assert cfg is PRODUCT_LAUNCH_FIND_TYPE_CONFIG
    assert cfg.family_id == "timing_opt"
    assert cfg.action_type == "business_launch"
    assert cfg.engine_id == REAL_ENGINE_ID


def test_visibility_types_are_not_in_timing_opt_find_allowlist() -> None:
    assert get_timing_opt_type_find_config("car-interview") is None
    assert get_timing_opt_type_find_config("bus-investor-meeting") is None


def test_wrong_family_config_fails_closed() -> None:
    with pytest.raises(ValueError, match="family_id='timing_opt'"):
        TimingOptTypeFindConfig(
            decision_type_id="bus-product-launch",
            family_id="visibility",  # type: ignore[arg-type]
            engine_id=REAL_ENGINE_ID,
            action_type="business_launch",
            decision_intent="x",
            evaluate_intake=evaluate_product_launch_intake,
            build_request=lambda n, d: (_ for _ in ()).throw(AssertionError()),
            semantics=ProductLaunchTimingOptFindSemantics(),
            incomplete_error_message="x",
            incomplete_details_key="missing",
        )


def test_register_rejects_non_timing_opt_family() -> None:
    cfg = object.__new__(TimingOptTypeFindConfig)
    object.__setattr__(cfg, "decision_type_id", "ghost-timing-find")
    object.__setattr__(cfg, "family_id", "visibility")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "business_launch")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_product_launch_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", ProductLaunchTimingOptFindSemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing")

    with pytest.raises(ValueError, match="family_id must be 'timing_opt'"):
        register_timing_opt_type_find_config(cfg)


def test_find_timing_opt_rejects_wrong_family_at_runtime() -> None:
    cfg = object.__new__(TimingOptTypeFindConfig)
    object.__setattr__(cfg, "decision_type_id", "bus-product-launch")
    object.__setattr__(cfg, "family_id", "visibility")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "business_launch")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_product_launch_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", ProductLaunchTimingOptFindSemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing")

    with pytest.raises(ValueError, match="family_id='timing_opt'"):
        find_timing_opt(
            cfg,
            case_id="00000000-0000-0000-0000-000000000099",
            case_version=1,
            intake={
                "launch_object": "app",
                "decision_frame": {
                    "operation": "find",
                    "time_scope": "date_range",
                    "start": "2026-09-01",
                    "end": "2026-09-14",
                },
            },
            generate_outcome=lambda _r: (_ for _ in ()).throw(AssertionError()),
        )
