from packages.decision_engine.evaluate.investor_meeting_evaluate import (
    INVESTOR_MEETING_EVALUATE_RUNTIME,
    REAL_ENGINE_ID,
    evaluate_investor_meeting,
)


def test_investor_runtime_contract_binding():
    assert INVESTOR_MEETING_EVALUATE_RUNTIME.decision_type_id == "bus-investor-meeting"
    assert INVESTOR_MEETING_EVALUATE_RUNTIME.mode == "evaluate_date"
    assert INVESTOR_MEETING_EVALUATE_RUNTIME.engine_id == REAL_ENGINE_ID
    assert INVESTOR_MEETING_EVALUATE_RUNTIME.evaluate_package is evaluate_investor_meeting


def test_missing_natal_returns_blocked_package():
    pkg = evaluate_investor_meeting(
        case_id="00000000-0000-0000-0000-000000000001",
        case_version=1,
        intake={
            "target_date": "2026-09-01",
            "meeting_goal": "Pitch seed round",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": "2026-09-01",
            },
        },
        generate_outcome=lambda request: None,
    )

    assert pkg.decision_type_id == "bus-investor-meeting"
    assert pkg.engine_id == REAL_ENGINE_ID
    assert pkg.recommendation.stance == "insufficient_data"
    assert pkg.timing.material is False
