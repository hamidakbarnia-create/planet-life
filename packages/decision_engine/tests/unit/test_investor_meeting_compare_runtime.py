from uuid import UUID

import pytest

from packages.decision_engine.evaluate.compare_contract import CompareRuntimeContract
from packages.decision_engine.evaluate.investor_meeting_compare import (
    REAL_ENGINE_ID,
    INVESTOR_MEETING_COMPARE_RUNTIME,
    INVESTOR_MEETING_COMPARE_TYPE_CONFIG,
    compare_investor_meeting,
)
from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeProviderError,
)
from packages.decision_engine.evaluate.type_visibility_compare_config import (
    get_visibility_type_compare_config,
)
from packages.decision_engine.evaluate.visibility_compare import compare_visibility
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)

CASE_ID = UUID("77777777-7777-4777-8777-777777777777")


def _outcome(score: float, rating: str = "Favorable") -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating=rating,
            activity="Investor Meeting",
            summary="Supportive meeting timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Negotiation timing",
                detail="Supportive conditions.",
                score=score,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the investor meeting date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="investor-meeting-compare-dates",
            action_type="investor_meeting",
        ),
    )


def _compare_intake(*, with_natal: bool = True, option_count: int = 2) -> dict:
    dates = [
        "2026-09-10",
        "2026-09-18",
        "2026-09-22",
        "2026-09-25",
        "2026-09-28",
    ][:option_count]
    labels = ["Mon", "Thu", "Fri", "Sat", "Sun"][:option_count]
    intake = {
        "meeting_goal": "Raise seed",
        "decision_frame": {
            "operation": "compare",
            "time_scope": "multiple_dates",
            "dates": dates,
            "options": [
                {"id": f"opt-{i + 1}", "label": labels[i], "date": dates[i]}
                for i in range(option_count)
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
    assert INVESTOR_MEETING_COMPARE_RUNTIME.decision_type_id == "bus-investor-meeting"
    assert INVESTOR_MEETING_COMPARE_RUNTIME.mode == "compare_dates"
    assert INVESTOR_MEETING_COMPARE_RUNTIME.engine_id == REAL_ENGINE_ID
    assert isinstance(INVESTOR_MEETING_COMPARE_RUNTIME, CompareRuntimeContract)
    assert INVESTOR_MEETING_COMPARE_TYPE_CONFIG.family_id == "visibility"
    assert INVESTOR_MEETING_COMPARE_TYPE_CONFIG.action_type == "investor_meeting"
    assert get_visibility_type_compare_config("bus-investor-meeting") is not None


def test_unsupported_visibility_type_does_not_auto_activate():
    assert get_visibility_type_compare_config("tim-compare-three") is None
    assert get_visibility_type_compare_config("not-a-type") is None


def test_compare_accepts_two_and_five_options():
    scores = {
        "2026-09-10": 55.0,
        "2026-09-18": 80.0,
        "2026-09-22": 60.0,
        "2026-09-25": 62.0,
        "2026-09-28": 58.0,
    }

    def generate(request):
        return _outcome(scores[request.target_date])

    for count in (2, 5):
        pkg = compare_investor_meeting(
            case_id=CASE_ID,
            case_version=1,
            intake=_compare_intake(option_count=count),
            generate_outcome=generate,
        )
        assert pkg.mode == "compare_dates"
        assert pkg.family_id == "visibility"
        assert pkg.decision_type_id == "bus-investor-meeting"
        assert len(pkg.timing.candidates) == count


def test_deterministic_ranking_unique_winner():
    scores = {"2026-09-10": 62.0, "2026-09-18": 78.0}

    def generate(request):
        return _outcome(scores[request.target_date])

    pkg = compare_investor_meeting(
        case_id=CASE_ID,
        case_version=2,
        intake=_compare_intake(),
        generate_outcome=generate,
    )
    ranked = sorted(pkg.timing.candidates, key=lambda c: c.rank)
    assert ranked[0].option_id == "opt-2"
    assert ranked[0].date.isoformat() == "2026-09-18"
    assert pkg.recommendation.stance == "proceed_with_conditions"
    assert "Prefer Thu" in pkg.recommendation.summary
    summary = pkg.recommendation.summary.lower()
    # Recommendation must not claim investment success.
    assert "funding" not in summary
    assert "investment success" not in summary
    assert "term sheet" not in summary
    limits = " ".join(pkg.explainability.limits).lower()
    assert "investment outcome" in limits
    assert "funding success" in limits


def test_tie_yields_no_unique_winner():
    scores = {
        "2026-09-10": 70.0,
        "2026-09-12": 71.0,
        "2026-09-15": 50.0,
    }

    def generate(request):
        return _outcome(scores[request.target_date])

    intake = _compare_intake(option_count=3)
    intake["decision_frame"]["dates"] = ["2026-09-10", "2026-09-12", "2026-09-15"]
    intake["decision_frame"]["options"] = [
        {"id": "a", "label": "A", "date": "2026-09-10"},
        {"id": "b", "label": "B", "date": "2026-09-12"},
        {"id": "c", "label": "C", "date": "2026-09-15"},
    ]
    pkg = compare_investor_meeting(
        case_id=CASE_ID,
        case_version=1,
        intake=intake,
        generate_outcome=generate,
    )
    assert pkg.recommendation.stance == "no_unique_winner"
    assert pkg.recommendation.stance != "prefer_alternate"


def test_same_natal_and_profile_for_every_option():
    seen: list[tuple[str, str, str, str]] = []

    def generate(request):
        seen.append(
            (
                request.birth_date,
                request.birth_time,
                request.location,
                request.action_type,
            )
        )
        return _outcome(60.0 + len(seen))

    compare_investor_meeting(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(),
        generate_outcome=generate,
    )
    assert len(seen) == 2
    assert all(
        item == ("1990-01-01", "12:00", "Paris", "investor_meeting") for item in seen
    )


def test_fail_closed_when_one_option_cannot_be_scored():
    def generate(request):
        if request.target_date == "2026-09-18":
            raise RuntimeError("provider down")
        return _outcome(70.0)

    with pytest.raises(RuntimeProviderError):
        compare_investor_meeting(
            case_id=CASE_ID,
            case_version=1,
            intake=_compare_intake(),
            generate_outcome=generate,
        )


def test_uses_visibility_compare_spine(monkeypatch):
    calls: list[str] = []

    def spy(config, **kwargs):
        calls.append(config.decision_type_id)
        return compare_visibility(config, **kwargs)

    monkeypatch.setattr(
        "packages.decision_engine.evaluate.investor_meeting_compare.compare_visibility",
        spy,
    )
    compare_investor_meeting(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(),
        generate_outcome=lambda _r: _outcome(70.0),
    )
    assert calls == ["bus-investor-meeting"]


def test_rejects_one_and_six_options():
    def generate(request):
        return _outcome(70.0)

    with pytest.raises(RuntimeFramingError, match="between 2 and 5"):
        compare_investor_meeting(
            case_id=CASE_ID,
            case_version=1,
            intake=_compare_intake(option_count=1),
            generate_outcome=generate,
        )

    intake = _compare_intake(option_count=5)
    intake["decision_frame"]["dates"].append("2026-09-30")
    intake["decision_frame"]["options"].append(
        {"id": "opt-6", "label": "Extra", "date": "2026-09-30"}
    )
    with pytest.raises(RuntimeFramingError, match="between 2 and 5"):
        compare_investor_meeting(
            case_id=CASE_ID,
            case_version=1,
            intake=intake,
            generate_outcome=generate,
        )
