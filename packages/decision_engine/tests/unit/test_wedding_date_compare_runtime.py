from uuid import UUID

import pytest

from packages.decision_engine.evaluate.compare_contract import CompareRuntimeContract
from packages.decision_engine.evaluate.runtime_common import RuntimeProviderError
from packages.decision_engine.evaluate.timing_opt_compare import compare_timing_opt
from packages.decision_engine.evaluate.wedding_date_compare import (
    REAL_ENGINE_ID,
    WEDDING_DATE_COMPARE_RUNTIME,
    WEDDING_DATE_COMPARE_TYPE_CONFIG,
    compare_wedding_date,
)
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)

CASE_ID = UUID("55555555-5555-4555-8555-555555555555")


def _outcome(score: float, rating: str = "Favorable") -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating=rating,
            activity="Wedding Date",
            summary="Supportive wedding timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Partnership timing",
                detail="Supportive conditions.",
                score=score,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the wedding date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="wedding-date-compare-dates",
            action_type="wedding_date",
        ),
    )


def _compare_intake(*, with_natal: bool = True) -> dict:
    intake = {
        "ceremony_type": "civil",
        "decision_frame": {
            "operation": "compare",
            "time_scope": "multiple_dates",
            "dates": ["2026-09-10", "2026-09-18"],
            "options": [
                {"id": "early", "label": "Early weekend", "date": "2026-09-10"},
                {"id": "late", "label": "Late weekend", "date": "2026-09-18"},
            ],
        },
    }
    if with_natal:
        intake["natal_evidence"] = {
            "birth_date": "1990-01-01",
            "birth_time": "12:00",
            "location": "Paris",
            "latitude": 48.8566,
            "longitude": 2.3522,
        }
    return intake


def test_compare_runtime_contract_binding():
    assert WEDDING_DATE_COMPARE_RUNTIME.decision_type_id == "mar-wedding-date"
    assert WEDDING_DATE_COMPARE_RUNTIME.mode == "compare_dates"
    assert WEDDING_DATE_COMPARE_RUNTIME.engine_id == REAL_ENGINE_ID
    assert isinstance(WEDDING_DATE_COMPARE_RUNTIME, CompareRuntimeContract)
    with pytest.raises(ValueError, match="compare_dates"):
        CompareRuntimeContract(
            decision_type_id="mar-wedding-date",
            mode="evaluate_date",
            engine_id=REAL_ENGINE_ID,
            evaluate_intake=lambda _i: None,
            compare_package=lambda **_k: None,
        )


def test_compare_package_ranks_options_with_identity():
    scores = {"2026-09-10": 62.0, "2026-09-18": 78.0}

    def generate(request):
        return _outcome(scores[request.target_date])

    pkg = compare_wedding_date(
        case_id=CASE_ID,
        case_version=2,
        intake=_compare_intake(),
        generate_outcome=generate,
    )
    assert pkg.mode == "compare_dates"
    assert pkg.family_id == "timing_opt"
    assert pkg.decision_type_id == "mar-wedding-date"
    assert len(pkg.timing.candidates) == 2
    ranked = sorted(pkg.timing.candidates, key=lambda c: c.rank)
    assert ranked[0].option_id == "late"
    assert ranked[0].label == "Late weekend"
    assert ranked[0].date.isoformat() == "2026-09-18"
    assert ranked[0].score == 78.0
    assert ranked[1].option_id == "early"
    assert "Prefer Late weekend" in pkg.recommendation.summary
    assert pkg.recommendation.stance == "proceed_with_conditions"


def test_compare_three_options_and_tie_behavior():
    scores = {
        "2026-09-10": 70.0,
        "2026-09-12": 71.0,
        "2026-09-15": 50.0,
    }

    def generate(request):
        return _outcome(scores[request.target_date])

    intake = _compare_intake()
    intake["decision_frame"]["dates"] = ["2026-09-10", "2026-09-12", "2026-09-15"]
    intake["decision_frame"]["options"] = [
        {"id": "a", "label": "A", "date": "2026-09-10"},
        {"id": "b", "label": "B", "date": "2026-09-12"},
        {"id": "c", "label": "C", "date": "2026-09-15"},
    ]
    pkg = compare_wedding_date(
        case_id=CASE_ID,
        case_version=1,
        intake=intake,
        generate_outcome=generate,
    )
    assert len(pkg.timing.candidates) == 3
    assert pkg.recommendation.stance == "prefer_alternate"
    assert "No unique winner" in pkg.recommendation.summary
    assert "tied" in pkg.explainability.why.lower() or "threshold" in pkg.explainability.why.lower()


def test_same_natal_used_for_every_option():
    seen: list[tuple[str, str, str]] = []

    def generate(request):
        seen.append((request.birth_date, request.birth_time, request.location))
        return _outcome(60.0 + len(seen))

    compare_wedding_date(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(),
        generate_outcome=generate,
    )
    assert len(seen) == 2
    assert seen[0] == seen[1] == ("1990-01-01", "12:00", "Paris")


def test_fail_closed_when_one_option_cannot_be_scored():
    def generate(request):
        if request.target_date == "2026-09-18":
            raise RuntimeError("provider down")
        return _outcome(70.0)

    with pytest.raises(RuntimeProviderError) as exc:
        compare_wedding_date(
            case_id=CASE_ID,
            case_version=1,
            intake=_compare_intake(),
            generate_outcome=generate,
        )
    assert exc.value.details["option_id"] == "late"


def test_missing_natal_returns_blocked_compare_package_no_partial_winner():
    pkg = compare_wedding_date(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(with_natal=False),
        generate_outcome=lambda _r: (_ for _ in ()).throw(AssertionError()),
    )
    assert pkg.recommendation.stance == "insufficient_data"
    assert pkg.timing.material is False
    assert len(pkg.timing.candidates) == 2
    assert all(c.score == 0.0 for c in pkg.timing.candidates)


def test_uses_timing_opt_compare_spine(monkeypatch):
    calls: list[str] = []

    def spy(config, **kwargs):
        calls.append(config.decision_type_id)
        return compare_timing_opt(config, **kwargs)

    monkeypatch.setattr(
        "packages.decision_engine.evaluate.wedding_date_compare.compare_timing_opt",
        spy,
    )
    compare_wedding_date(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(),
        generate_outcome=lambda request: _outcome(
            80.0 if request.target_date == "2026-09-18" else 60.0
        ),
    )
    assert calls == ["mar-wedding-date"]
    assert WEDDING_DATE_COMPARE_TYPE_CONFIG.action_type == "wedding_date"
