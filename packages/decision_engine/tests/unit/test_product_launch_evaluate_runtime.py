from uuid import UUID

from packages.astro_engine.scoring import ACTIVITY_PROFILES, _resolve_profile
from packages.decision_engine.evaluate.product_launch_evaluate import (
    REAL_ENGINE_ID,
    PRODUCT_LAUNCH_EVALUATE_RUNTIME,
    PRODUCT_LAUNCH_TYPE_CONFIG,
    evaluate_product_launch,
)
from packages.decision_engine.evaluate.timing_opt_evaluate import evaluate_timing_opt
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)


CASE_ID = UUID("33333333-3333-4333-8333-333333333333")
TARGET = "2026-11-05"


def _outcome() -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=72,
            rating="Favorable",
            activity="Business Launch",
            summary="Supportive launch timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.58, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Launch timing",
                detail="Supportive conditions.",
                score=72.0,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the launch date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="product-launch-evaluate-date",
            action_type="business_launch",
        ),
    )


def test_product_launch_runtime_contract_binding():
    assert PRODUCT_LAUNCH_EVALUATE_RUNTIME.decision_type_id == "bus-product-launch"
    assert PRODUCT_LAUNCH_EVALUATE_RUNTIME.mode == "evaluate_date"
    assert PRODUCT_LAUNCH_EVALUATE_RUNTIME.engine_id == REAL_ENGINE_ID
    assert PRODUCT_LAUNCH_TYPE_CONFIG.family_id == "timing_opt"
    assert PRODUCT_LAUNCH_TYPE_CONFIG.action_type == "business_launch"


def test_business_launch_is_first_class_profile_not_alias():
    profile = _resolve_profile(PRODUCT_LAUNCH_TYPE_CONFIG.action_type)
    assert profile is ACTIVITY_PROFILES["business_launch"]
    assert profile.label == "Business Launch"


def test_missing_natal_returns_blocked_package():
    pkg = evaluate_product_launch(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "launch_object": "SaaS launch",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
        },
        generate_outcome=lambda _request: (_ for _ in ()).throw(AssertionError()),
    )
    assert pkg.decision_type_id == "bus-product-launch"
    assert pkg.family_id == "timing_opt"
    assert pkg.engine_id == REAL_ENGINE_ID
    assert pkg.recommendation.stance == "insufficient_data"
    assert pkg.timing.material is False


def test_scored_package_uses_timing_opt_spine(monkeypatch):
    calls: list[str] = []

    def spy(config, **kwargs):
        calls.append(config.decision_type_id)
        return evaluate_timing_opt(config, **kwargs)

    monkeypatch.setattr(
        "packages.decision_engine.evaluate.product_launch_evaluate.evaluate_timing_opt",
        spy,
    )
    pkg = evaluate_product_launch(
        case_id=CASE_ID,
        case_version=2,
        intake={
            "target_date": TARGET,
            "launch_object": "SaaS launch",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
            "natal_evidence": {
                "birth_date": "1990-01-01",
                "birth_time": "12:00",
                "location": "Paris",
                "latitude": 48.8566,
                "longitude": 2.3522,
            },
        },
        generate_outcome=lambda _request: _outcome(),
    )
    assert calls == ["bus-product-launch"]
    assert pkg.family_id == "timing_opt"
    assert pkg.timing.score == 72.0
    assert "launch" in pkg.recommendation.summary.lower()
    assert "market fit" not in pkg.recommendation.summary.lower()
    limits_blob = " ".join(pkg.explainability.limits).lower()
    assert "market fit" in limits_blob
    assert "revenue" in limits_blob
    assert "viability" in limits_blob
