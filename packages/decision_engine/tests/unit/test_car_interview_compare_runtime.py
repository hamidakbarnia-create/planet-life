from uuid import UUID

import pytest

from packages.decision_engine.evaluate.car_interview_compare import (
    REAL_ENGINE_ID,
    CAR_INTERVIEW_COMPARE_RUNTIME,
    CAR_INTERVIEW_COMPARE_TYPE_CONFIG,
    compare_car_interview,
)
from packages.decision_engine.evaluate.compare_contract import CompareRuntimeContract
from packages.decision_engine.evaluate.runtime_common import RuntimeProviderError
from packages.decision_engine.evaluate.visibility_compare import compare_visibility
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)

CASE_ID = UUID("66666666-6666-4666-8666-666666666666")


def _outcome(score: float, rating: str = "Favorable") -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating=rating,
            activity="Job Interview",
            summary="Supportive interview timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Communication timing",
                detail="Supportive conditions.",
                score=score,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the interview date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="car-interview-compare-dates",
            action_type="job_interview",
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
        "role": "Product Manager",
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
    assert CAR_INTERVIEW_COMPARE_RUNTIME.decision_type_id == "car-interview"
    assert CAR_INTERVIEW_COMPARE_RUNTIME.mode == "compare_dates"
    assert CAR_INTERVIEW_COMPARE_RUNTIME.engine_id == REAL_ENGINE_ID
    assert isinstance(CAR_INTERVIEW_COMPARE_RUNTIME, CompareRuntimeContract)
    assert CAR_INTERVIEW_COMPARE_TYPE_CONFIG.family_id == "visibility"
    assert CAR_INTERVIEW_COMPARE_TYPE_CONFIG.action_type == "job_interview"


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
        pkg = compare_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_compare_intake(option_count=count),
            generate_outcome=generate,
        )
        assert pkg.mode == "compare_dates"
        assert pkg.family_id == "visibility"
        assert pkg.decision_type_id == "car-interview"
        assert len(pkg.timing.candidates) == count


def test_compare_rejects_one_and_six_options():
    from packages.decision_engine.evaluate.runtime_common import RuntimeFramingError

    def generate(request):
        return _outcome(70.0)

    with pytest.raises(RuntimeFramingError, match="between 2 and 5"):
        compare_car_interview(
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
        compare_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=intake,
            generate_outcome=generate,
        )


def test_compare_rejects_malformed_date():
    from packages.decision_engine.evaluate.runtime_common import RuntimeFramingError

    intake = _compare_intake()
    intake["decision_frame"]["options"][0]["date"] = "not-a-date"
    intake["decision_frame"]["dates"] = ["not-a-date", "2026-09-18"]
    with pytest.raises((RuntimeFramingError, Exception)):
        compare_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=intake,
            generate_outcome=lambda _r: _outcome(70.0),
        )


def test_deterministic_ranking_unique_winner():
    scores = {"2026-09-10": 62.0, "2026-09-18": 78.0}

    def generate(request):
        return _outcome(scores[request.target_date])

    pkg = compare_car_interview(
        case_id=CASE_ID,
        case_version=2,
        intake=_compare_intake(),
        generate_outcome=generate,
    )
    ranked = sorted(pkg.timing.candidates, key=lambda c: c.rank)
    assert ranked[0].option_id == "opt-2"
    assert ranked[0].label == "Thu"
    assert ranked[0].date.isoformat() == "2026-09-18"
    assert ranked[0].score == 78.0
    assert pkg.recommendation.stance == "proceed_with_conditions"
    assert "Prefer Thu" in pkg.recommendation.summary
    assert "hiring" not in pkg.recommendation.summary.lower()
    assert "offer" not in pkg.recommendation.summary.lower()


def test_tie_yields_no_unique_winner_not_prefer_alternate():
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
    pkg = compare_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=intake,
        generate_outcome=generate,
    )
    assert pkg.recommendation.stance == "no_unique_winner"
    assert pkg.recommendation.stance != "prefer_alternate"
    assert "No unique winner" in pkg.recommendation.summary


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

    compare_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(),
        generate_outcome=generate,
    )
    assert len(seen) == 2
    assert all(item == ("1990-01-01", "12:00", "Paris", "job_interview") for item in seen)


def test_fail_closed_when_one_option_cannot_be_scored():
    def generate(request):
        if request.target_date == "2026-09-18":
            raise RuntimeError("provider down")
        return _outcome(70.0)

    with pytest.raises(RuntimeProviderError) as exc:
        compare_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_compare_intake(),
            generate_outcome=generate,
        )
    assert exc.value.details["option_id"] == "opt-2"


def test_missing_natal_returns_blocked_compare_package():
    pkg = compare_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(with_natal=False),
        generate_outcome=lambda _r: (_ for _ in ()).throw(AssertionError()),
    )
    assert pkg.recommendation.stance == "insufficient_data"
    assert pkg.timing.material is False


def test_uses_visibility_compare_spine(monkeypatch):
    calls: list[str] = []

    def spy(config, **kwargs):
        calls.append(config.decision_type_id)
        return compare_visibility(config, **kwargs)

    monkeypatch.setattr(
        "packages.decision_engine.evaluate.car_interview_compare.compare_visibility",
        spy,
    )
    compare_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(),
        generate_outcome=lambda _r: _outcome(70.0),
    )
    assert calls == ["car-interview"]


def test_safe_limits_forbid_hiring_claims():
    pkg = compare_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_compare_intake(),
        generate_outcome=lambda _r: _outcome(75.0 if _r.target_date == "2026-09-18" else 50.0),
    )
    limits = " ".join(pkg.explainability.limits).lower()
    assert "hiring" in limits
    assert "salary" in limits
    assert "career success" in limits
