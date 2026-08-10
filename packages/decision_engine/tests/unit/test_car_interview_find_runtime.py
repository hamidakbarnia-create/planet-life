"""Unit tests for car-interview Visibility FIND runtime."""

from __future__ import annotations

from datetime import date, timedelta
from uuid import UUID

import pytest

from packages.decision_engine.evaluate.car_interview_find import (
    CAR_INTERVIEW_FIND_RUNTIME,
    CAR_INTERVIEW_FIND_TYPE_CONFIG,
    REAL_ENGINE_ID,
    find_car_interview,
)
from packages.decision_engine.evaluate.find_contract import FindRuntimeContract
from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeProviderError,
)
from packages.decision_engine.evaluate.type_visibility_find_config import (
    VisibilityTypeFindConfig,
    get_visibility_type_find_config,
    register_visibility_type_find_config,
)
from packages.decision_engine.evaluate.visibility_find import find_visibility
from packages.decision_engine.evaluate.visibility_semantics import (
    CarInterviewVisibilityFindSemantics,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.find_windows import FIND_MAX_WINDOWS
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)

CASE_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
START = date(2026, 9, 1)
END = date(2026, 9, 14)  # 14 inclusive days


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
            summary="Timing supports the interview window.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="car-interview-find-dates",
            action_type="job_interview",
        ),
    )


def _find_intake(
    *,
    with_natal: bool = True,
    start: str | None = None,
    end: str | None = None,
    extra_frame: dict | None = None,
) -> dict:
    frame = {
        "operation": "find",
        "time_scope": "date_range",
        "start": start or START.isoformat(),
        "end": end or END.isoformat(),
    }
    if extra_frame:
        frame.update(extra_frame)
    intake: dict = {
        "role": "Product Manager",
        "decision_frame": frame,
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


def test_find_runtime_resolves_and_contracts():
    assert CAR_INTERVIEW_FIND_RUNTIME.decision_type_id == "car-interview"
    assert CAR_INTERVIEW_FIND_RUNTIME.mode == "find_dates"
    assert CAR_INTERVIEW_FIND_RUNTIME.engine_id == REAL_ENGINE_ID
    assert isinstance(CAR_INTERVIEW_FIND_RUNTIME, FindRuntimeContract)
    assert CAR_INTERVIEW_FIND_TYPE_CONFIG.family_id == "visibility"
    assert CAR_INTERVIEW_FIND_TYPE_CONFIG.action_type == "job_interview"
    assert get_visibility_type_find_config("car-interview") is not None
    assert get_visibility_type_find_config("bus-product-launch") is None
    assert get_visibility_type_find_config("mar-wedding-date") is None


def test_wrong_family_config_fails_closed():
    with pytest.raises(ValueError, match="family_id='visibility'"):
        VisibilityTypeFindConfig(
            decision_type_id="car-interview",
            family_id="timing_opt",  # type: ignore[arg-type]
            engine_id=REAL_ENGINE_ID,
            action_type="job_interview",
            decision_intent="x",
            evaluate_intake=evaluate_car_interview_intake,
            build_request=lambda n, d: (_ for _ in ()).throw(AssertionError()),
            semantics=CarInterviewVisibilityFindSemantics(),
            incomplete_error_message="x",
            incomplete_details_key="missing_required",
        )


def test_register_rejects_non_visibility_family():
    cfg = object.__new__(VisibilityTypeFindConfig)
    object.__setattr__(cfg, "decision_type_id", "ghost-visibility-find")
    object.__setattr__(cfg, "family_id", "timing_opt")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "job_interview")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_car_interview_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", CarInterviewVisibilityFindSemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing_required")

    with pytest.raises(ValueError, match="family_id must be 'visibility'"):
        register_visibility_type_find_config(cfg)


def test_find_visibility_rejects_wrong_family_at_runtime():
    cfg = object.__new__(VisibilityTypeFindConfig)
    object.__setattr__(cfg, "decision_type_id", "car-interview")
    object.__setattr__(cfg, "family_id", "timing_opt")
    object.__setattr__(cfg, "engine_id", "x")
    object.__setattr__(cfg, "action_type", "job_interview")
    object.__setattr__(cfg, "decision_intent", "x")
    object.__setattr__(cfg, "evaluate_intake", evaluate_car_interview_intake)
    object.__setattr__(
        cfg, "build_request", lambda n, d: (_ for _ in ()).throw(AssertionError())
    )
    object.__setattr__(cfg, "semantics", CarInterviewVisibilityFindSemantics())
    object.__setattr__(cfg, "incomplete_error_message", "x")
    object.__setattr__(cfg, "incomplete_details_key", "missing_required")

    with pytest.raises(ValueError, match="family_id='visibility'"):
        find_visibility(
            cfg,
            case_id=CASE_ID,
            case_version=1,
            intake=_find_intake(),
            generate_outcome=lambda _r: (_ for _ in ()).throw(AssertionError()),
        )


def test_find_happy_path_unique_dominant():
    day_count = (END - START).days + 1
    scores = [40.0] * day_count
    # Contiguous high cluster days 2-4; isolated day 10 weaker → unique dominant.
    scores[2] = 78.0
    scores[3] = 80.0
    scores[4] = 76.0
    scores[10] = 66.0
    outcomes = iter(
        _outcome(s, "Favorable" if s >= 65 else "Challenging") for s in scores
    )
    seen_natal: list[tuple] = []

    def generate(request):
        seen_natal.append(
            (
                request.birth_date,
                request.birth_time,
                request.location,
                request.action_type,
                request.decision_intent,
            )
        )
        return next(outcomes)

    pkg = find_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_find_intake(),
        generate_outcome=generate,
    )
    assert pkg.mode == "find_dates"
    assert pkg.family_id == "visibility"
    assert pkg.decision_type_id == "car-interview"
    assert pkg.find is not None
    assert pkg.find.unique_dominant is True
    assert pkg.recommendation.stance == "proceed_with_conditions"
    assert len(pkg.find.windows) >= 1
    assert len(pkg.find.windows) <= FIND_MAX_WINDOWS
    assert all(t[3] == "job_interview" for t in seen_natal)
    assert all(t[4] == "car-interview-find-dates" for t in seen_natal)
    assert len(set(seen_natal)) == 1


def test_find_effective_tie_no_unique_winner():
    day_count = (END - START).days + 1
    scores = [40.0] * day_count
    scores[2] = 72.0
    scores[3] = 71.0
    scores[8] = 71.0
    scores[9] = 70.0
    outcomes = iter(
        _outcome(s, "Favorable" if s >= 65 else "Challenging") for s in scores
    )
    pkg = find_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_find_intake(),
        generate_outcome=lambda req: next(outcomes),
    )
    assert pkg.find.unique_dominant is False
    assert pkg.recommendation.stance == "no_unique_winner"
    assert len(pkg.find.windows) >= 2


def test_find_no_strong_window_wait():
    outcomes = iter(_outcome(50.0, "Mixed / Proceed with Awareness") for _ in range(14))
    pkg = find_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_find_intake(),
        generate_outcome=lambda req: next(outcomes),
    )
    assert list(pkg.find.windows) == []
    assert pkg.recommendation.stance == "wait"
    assert pkg.timing.material is False


def test_find_missing_natal_insufficient_data():
    pkg = find_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_find_intake(with_natal=False),
        generate_outcome=lambda req: _outcome(70.0),
    )
    assert pkg.recommendation.stance == "insufficient_data"
    assert list(pkg.find.windows) == []


def test_find_requires_role_not_target_date():
    with pytest.raises(RuntimeFramingError) as exc:
        find_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake={
                "decision_frame": {
                    "operation": "find",
                    "time_scope": "date_range",
                    "start": START.isoformat(),
                    "end": END.isoformat(),
                },
                "natal_evidence": {
                    "birth_date": "1990-01-01",
                    "birth_time": "12:00",
                    "location": "Paris",
                },
            },
            generate_outcome=lambda req: _outcome(70.0),
        )
    assert "role" in str(exc.value.details.get("missing_required", []))


def test_find_range_min_max():
    short_end = (START + timedelta(days=5)).isoformat()
    with pytest.raises(RuntimeFramingError):
        find_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_find_intake(end=short_end),
            generate_outcome=lambda req: _outcome(70.0),
        )

    long_end = (START + timedelta(days=90)).isoformat()
    with pytest.raises(RuntimeFramingError):
        find_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_find_intake(end=long_end),
            generate_outcome=lambda req: _outcome(70.0),
        )


def test_find_rejects_compare_style_framing_fields():
    with pytest.raises(RuntimeFramingError, match="singular date"):
        find_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_find_intake(extra_frame={"date": "2026-09-10"}),
            generate_outcome=lambda req: _outcome(70.0),
        )
    with pytest.raises(RuntimeFramingError, match="dates"):
        find_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_find_intake(extra_frame={"dates": ["2026-09-10"]}),
            generate_outcome=lambda req: _outcome(70.0),
        )
    with pytest.raises(RuntimeFramingError, match="options"):
        find_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_find_intake(
                extra_frame={
                    "options": [{"id": "a", "label": "A", "date": "2026-09-10"}]
                }
            ),
            generate_outcome=lambda req: _outcome(70.0),
        )


def test_find_provider_failure_fails_closed():
    def boom(_req):
        raise RuntimeError("provider down")

    with pytest.raises(RuntimeProviderError):
        find_car_interview(
            case_id=CASE_ID,
            case_version=1,
            intake=_find_intake(),
            generate_outcome=boom,
        )


def test_find_forbidden_claims_absent():
    day_count = (END - START).days + 1
    scores = [40.0] * day_count
    scores[2] = 78.0
    scores[3] = 80.0
    scores[4] = 76.0
    outcomes = iter(
        _outcome(s, "Favorable" if s >= 65 else "Challenging") for s in scores
    )
    pkg = find_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_find_intake(),
        generate_outcome=lambda req: next(outcomes),
    )
    # Positive recommendation / action surface must not predict outcomes.
    claim_surface = " ".join(
        [
            pkg.recommendation.summary,
            pkg.action_plan.steps[0].action if pkg.action_plan.steps else "",
        ]
    ).lower()
    for phrase in (
        "job offer",
        "hiring probability",
        "guaranteed interview",
        "salary outcome",
        "career success",
        "most likely to get you hired",
        "employer decision",
    ):
        assert phrase not in claim_surface
    assert "interview" in claim_surface
    # Limits may name forbidden outcomes as exclusions, but must not leak schema IDs.
    for limit in pkg.explainability.limits:
        assert "interview_type" not in limit
        assert "job_interview" not in limit
        assert "find_dates" not in limit
        assert "natal_evidence" not in limit
        assert "decision_frame" not in limit


def test_find_deterministic_ranking():
    day_count = (END - START).days + 1
    scores = [40.0] * day_count
    scores[1] = 70.0
    scores[2] = 72.0
    scores[8] = 68.0

    def gen_factory():
        outcomes = iter(
            _outcome(s, "Favorable" if s >= 65 else "Challenging") for s in scores
        )
        return lambda req: next(outcomes)

    a = find_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_find_intake(),
        generate_outcome=gen_factory(),
    )
    b = find_car_interview(
        case_id=CASE_ID,
        case_version=1,
        intake=_find_intake(),
        generate_outcome=gen_factory(),
    )
    assert [w.window_id for w in a.find.windows] == [
        w.window_id for w in b.find.windows
    ]
    assert [w.peak_score for w in a.find.windows] == [
        w.peak_score for w in b.find.windows
    ]
