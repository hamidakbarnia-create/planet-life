from uuid import UUID

from packages.decision_engine.evaluate.timing_opt_evaluate import evaluate_timing_opt
from packages.decision_engine.evaluate.wedding_date_evaluate import (
    REAL_ENGINE_ID,
    WEDDING_DATE_EVALUATE_RUNTIME,
    WEDDING_DATE_TYPE_CONFIG,
    evaluate_wedding_date,
)
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)


CASE_ID = UUID("22222222-2222-4222-8222-222222222222")
TARGET = "2026-10-10"


def _outcome() -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=68,
            rating="Favorable",
            activity="negotiation",
            summary="Supportive wedding timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.55, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Partnership timing",
                detail="Supportive conditions.",
                score=68.0,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the wedding date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="wedding-date-evaluate-date",
            action_type="wedding_date",
        ),
    )


def test_wedding_runtime_contract_binding():
    assert WEDDING_DATE_EVALUATE_RUNTIME.decision_type_id == "mar-wedding-date"
    assert WEDDING_DATE_EVALUATE_RUNTIME.mode == "evaluate_date"
    assert WEDDING_DATE_EVALUATE_RUNTIME.engine_id == REAL_ENGINE_ID
    assert WEDDING_DATE_TYPE_CONFIG.family_id == "timing_opt"


def test_missing_natal_returns_blocked_package():
    pkg = evaluate_wedding_date(
        case_id=CASE_ID,
        case_version=1,
        intake={
            "target_date": TARGET,
            "ceremony_type": "civil",
            "decision_frame": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
        },
        generate_outcome=lambda _request: (_ for _ in ()).throw(AssertionError()),
    )
    assert pkg.decision_type_id == "mar-wedding-date"
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
        "packages.decision_engine.evaluate.wedding_date_evaluate.evaluate_timing_opt",
        spy,
    )
    pkg = evaluate_wedding_date(
        case_id=CASE_ID,
        case_version=2,
        intake={
            "target_date": TARGET,
            "ceremony_type": "religious",
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
    assert calls == ["mar-wedding-date"]
    assert pkg.family_id == "timing_opt"
    assert pkg.timing.score == 68.0
    assert "wedding" in pkg.recommendation.summary.lower()
