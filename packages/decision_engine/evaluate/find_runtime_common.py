"""Family-neutral FIND execution and package assembly.

Owns inclusive-range scanning, natal extraction, provider failure wrapping,
window construction, confidence aggregation, and generic FIND package shape.
Wording that differs by Decision Type is supplied by config.semantics.
Does NOT own family_id allowlisting or type activation.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import date, datetime, timezone
from typing import Any, Mapping, Protocol
from uuid import UUID, uuid4

from packages.decision_engine.evaluate.runtime_common import (
    RuntimeFramingError,
    RuntimeProviderError,
    build_find_base_envelope,
    extract_find_range_from_framing,
    extract_natal_evidence,
    rating_to_candidate_band,
    resolve_find_timezone,
    score_to_candidate_band,
)
from packages.decision_engine.find_windows import (
    ScoredFindDay,
    build_find_windows,
    iter_inclusive_dates,
)
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage

GenerateOutcomeFn = Callable[[DecisionRequest], DecisionOutcome]


class FindRuntimeSemantics(Protocol):
    """Type-specific Package wording consumed by the shared FIND executor."""

    def insufficient_summary(
        self, answers: Any, *, range_start: str, range_end: str
    ) -> str: ...

    def insufficient_action(self) -> str: ...

    def insufficient_counter_reason(self) -> str: ...

    def insufficient_limits(self) -> list[str]: ...

    def insufficient_timing_notes(self) -> str: ...

    def insufficient_confidence_message(self) -> str: ...

    def insufficient_why_not(self) -> str: ...

    def scored_summary(
        self,
        answers: Any,
        *,
        unique_dominant: bool,
        window_labels: list[str],
        tied_labels: list[str],
        no_strong_window: bool,
    ) -> str: ...

    def scored_conditions(self, answers: Any) -> list[str]: ...

    def scored_evidence_limits(self) -> list[str]: ...

    def scored_timing_notes(
        self, *, unique_dominant: bool, no_strong_window: bool
    ) -> str: ...

    def scored_action_step(
        self,
        *,
        unique_dominant: bool,
        window_labels: list[str],
        tied_labels: list[str],
        no_strong_window: bool,
    ) -> str: ...

    def scored_assumptions(
        self, *, event_location_supplied: bool, timezone: str
    ) -> list[str]: ...

    def scored_limits(self) -> list[str]: ...

    def scored_improve_accuracy(self) -> list[str]: ...

    def scored_counter_reason(
        self, *, unique_dominant: bool, no_strong_window: bool
    ) -> str: ...

    def scored_confidence_unavailable_message(self) -> str: ...

    def scored_opportunities(self, *, has_windows: bool) -> list[str]: ...

    def relative_explanation(
        self,
        *,
        unique_dominant: bool,
        no_strong_window: bool,
        window_labels: list[str],
        peak_scores: list[float],
        tied_labels: list[str],
    ) -> tuple[str, str]: ...

    def option_strengths(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]: ...

    def option_risks(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]: ...


class FindRuntimeTypeConfig(Protocol):
    """Duck-typed config surface shared by family TypeFindConfig dataclasses."""

    decision_type_id: str
    family_id: str
    engine_id: str
    action_type: str
    evaluate_intake: Callable[..., Any]
    build_request: Callable[..., tuple[DecisionRequest, bool]]
    semantics: FindRuntimeSemantics
    incomplete_error_message: str
    incomplete_details_key: str


def _iso_now() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _window_label(start: date, end: date) -> str:
    if start == end:
        return start.isoformat()
    return f"{start.isoformat()}–{end.isoformat()}"


def _confidence_from_outcomes(
    outcomes: list[DecisionOutcome],
    *,
    unavailable_message: str,
    dense_tie: bool,
) -> tuple[float, list[dict[str, str]]]:
    values: list[float] = []
    for outcome in outcomes:
        if outcome.confidence is not None and outcome.confidence.value is not None:
            values.append(float(outcome.confidence.value) * 100.0)
    penalties: list[dict[str, str]] = []
    if not values:
        penalties.append(
            {
                "code": "CONFIDENCE_UNAVAILABLE",
                "message": unavailable_message,
            }
        )
        base = 0.0
    else:
        base = round(sum(values) / len(values), 2)
    if dense_tie:
        penalties.append(
            {
                "code": "FIND_NEAR_EQUAL_WINDOWS",
                "message": (
                    "Multiple windows share near-equal peak scores; "
                    "no unique dominant window is claimed."
                ),
            }
        )
        base = round(max(0.0, base - 10.0), 2)
    return base, penalties


def build_insufficient_natal_find_package(
    config: FindRuntimeTypeConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    range_start: str,
    range_end: str,
    timezone_label: str,
    answers: Any,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    sem = config.semantics
    payload: dict[str, Any] = {
        **build_find_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
            decision_type_id=config.decision_type_id,
            engine_id=config.engine_id,
        ),
        "recommendation": {
            "stance": "insufficient_data",
            "conditions": [
                "Add birth date, birth time, and birth location evidence"
            ],
            "summary": sem.insufficient_summary(
                answers, range_start=range_start, range_end=range_end
            ),
        },
        "timing": {
            "material": False,
            "band": "na",
            "score": None,
            "candidates": [],
            "notes": sem.insufficient_timing_notes(),
        },
        "find": {
            "range_start": range_start,
            "range_end": range_end,
            "timezone": timezone_label,
            "windows": [],
            "unique_dominant": False,
        },
        "confidence": {
            "value": 0.0,
            "precision_level": "L3",
            "penalties": [
                {
                    "code": "MISSING_NATAL_EVIDENCE",
                    "message": sem.insufficient_confidence_message(),
                }
            ],
        },
        "evidence": {
            "items": [
                {
                    "framework_id": "astro_timing",
                    "eligibility": "unavailable",
                    "artifact_ref": "evidence://unavailable/natal",
                    "limits": ["Natal chart inputs were not present on the Case."],
                }
            ]
        },
        "drivers": {"items": []},
        "tradeoffs": {"items": []},
        "risks": {"items": []},
        "opportunities": {"items": []},
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": sem.insufficient_action(),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "insufficient_data",
            "summary": "",
            "reason": sem.insufficient_counter_reason(),
        },
        "explainability": {
            "why": "FIND did not run because natal evidence is missing.",
            "why_not": sem.insufficient_why_not(),
            "assumptions": [],
            "limits": sem.insufficient_limits(),
        },
        "improve_accuracy": {
            "items": [
                "Add birth date, birth time, and birth place to Case natal_evidence.",
            ]
        },
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }
    return DecisionEvaluationPackage.model_validate(payload)


def assemble_find_package(
    config: FindRuntimeTypeConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    answers: Any,
    range_start: date,
    range_end: date,
    timezone_label: str,
    window_result,
    outcomes: list[DecisionOutcome],
    event_location_supplied: bool,
    scored_days: list | None = None,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    sem = config.semantics
    windows = window_result.windows
    no_strong = len(windows) == 0
    labels = [_window_label(w.start_date, w.end_date) for w in windows]
    tied_labels = [
        _window_label(w.start_date, w.end_date)
        for w in windows
        if w.window_id in window_result.tied_window_ids
    ]
    peak_scores = [float(w.peak_score) for w in windows]
    why, why_not = sem.relative_explanation(
        unique_dominant=window_result.unique_dominant,
        no_strong_window=no_strong,
        window_labels=labels,
        peak_scores=peak_scores,
        tied_labels=tied_labels,
    )
    confidence_value, confidence_penalties = _confidence_from_outcomes(
        outcomes,
        unavailable_message=sem.scored_confidence_unavailable_message(),
        dense_tie=bool(windows) and not window_result.unique_dominant,
    )

    if no_strong:
        stance = "wait"
        timing_band = "na"
        timing_score = None
        material = False
    elif window_result.unique_dominant:
        stance = "proceed_with_conditions"
        timing_band = windows[0].band
        timing_score = float(windows[0].peak_score)
        material = True
    else:
        stance = "no_unique_winner"
        timing_band = "moderate"
        timing_score = float(windows[0].peak_score)
        material = True

    find_windows = [
        {
            "window_id": w.window_id,
            "start_date": w.start_date.isoformat(),
            "end_date": w.end_date.isoformat(),
            "peak_dates": [d.isoformat() for d in w.peak_dates],
            "peak_score": float(w.peak_score),
            "band": w.band,
            "rank": w.rank,
            "strengths": list(w.strengths),
            "risks": list(w.risks),
        }
        for w in windows
    ]
    candidates = [
        {
            "date": w.peak_dates[0].isoformat(),
            "rank": w.rank,
            "score": float(w.peak_score),
            "band": w.band,
            "option_id": w.window_id,
            "label": _window_label(w.start_date, w.end_date),
            "strengths": list(w.strengths),
            "risks": list(w.risks),
        }
        for w in windows
    ]
    drivers = [
        {
            "id": w.window_id,
            "label": _window_label(w.start_date, w.end_date),
            "score": float(w.peak_score),
            "band": w.band,
            "support": " ".join(w.strengths) if w.strengths else "",
            "friction": " ".join(w.risks) if w.risks else "",
        }
        for w in windows
    ]

    payload: dict[str, Any] = {
        **build_find_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
            decision_type_id=config.decision_type_id,
            engine_id=config.engine_id,
        ),
        "recommendation": {
            "stance": stance,
            "conditions": sem.scored_conditions(answers)[:5],
            "summary": sem.scored_summary(
                answers,
                unique_dominant=window_result.unique_dominant,
                window_labels=labels,
                tied_labels=tied_labels,
                no_strong_window=no_strong,
            ),
        },
        "timing": {
            "material": material,
            "band": timing_band,
            "score": timing_score,
            "candidates": candidates,
            "notes": sem.scored_timing_notes(
                unique_dominant=window_result.unique_dominant,
                no_strong_window=no_strong,
            ),
        },
        "find": {
            "range_start": range_start.isoformat(),
            "range_end": range_end.isoformat(),
            "timezone": timezone_label,
            "windows": find_windows,
            "unique_dominant": window_result.unique_dominant,
        },
        "confidence": {
            "value": confidence_value,
            "precision_level": "L3",
            "penalties": confidence_penalties,
        },
        "evidence": {
            "items": [
                {
                    "framework_id": "astro_timing",
                    "eligibility": "registered",
                    "artifact_ref": "evidence://astro_timing/find",
                    "limits": sem.scored_evidence_limits(),
                }
            ]
        },
        "drivers": {"items": drivers},
        "tradeoffs": {
            "items": [
                "A stronger timing window may reduce scheduling flexibility.",
            ]
            if windows
            else []
        },
        "risks": {
            "items": [
                "Non-timing constraints may override window preference.",
            ]
            if windows
            else [
                "No Favorable+ window met eligibility inside this range.",
            ]
        },
        "opportunities": {
            "items": sem.scored_opportunities(has_windows=bool(windows)),
        },
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": sem.scored_action_step(
                        unique_dominant=window_result.unique_dominant,
                        window_labels=labels,
                        tied_labels=tied_labels,
                        no_strong_window=no_strong,
                    ),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": stance if stance != "proceed_with_conditions" else "wait",
            "summary": (
                ""
                if window_result.unique_dominant and not no_strong
                else "Choose among comparable windows using non-timing constraints."
                if windows
                else "No strong timing window was identified in range."
            ),
            "reason": sem.scored_counter_reason(
                unique_dominant=window_result.unique_dominant,
                no_strong_window=no_strong,
            ),
        },
        "explainability": {
            "why": why,
            "why_not": why_not,
            "assumptions": sem.scored_assumptions(
                event_location_supplied=event_location_supplied,
                timezone=timezone_label,
            ),
            "limits": sem.scored_limits(),
        },
        "improve_accuracy": {"items": sem.scored_improve_accuracy()},
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }
    day_payloads = [
        item.assessment
        for item in (scored_days or [])
        if getattr(item, "assessment", None)
    ]
    from packages.decision_engine.decision_assessment import build_semantic_shadow

    shadow = build_semantic_shadow(
        day_payloads,
        find_window_semantic_warnings=getattr(
            window_result, "semantic_warnings", ()
        ),
        window_policies=getattr(window_result, "window_policies", ()),
        window_explanations=getattr(window_result, "window_explanations", ()),
    )
    if shadow:
        payload["semantic_shadow"] = shadow
    return DecisionEvaluationPackage.model_validate(payload)


def execute_find(
    config: FindRuntimeTypeConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, object],
    generate_outcome: GenerateOutcomeFn,
    action_type_config_label: str,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Run FIND scan + package assembly for an already family-guarded config."""
    slot_eval = config.evaluate_intake(intake)
    if not slot_eval.is_complete:
        raise RuntimeFramingError(
            config.incomplete_error_message,
            details={
                config.incomplete_details_key: list(slot_eval.missing_required)
            },
        )

    frame_range = extract_find_range_from_framing(intake)
    range_start = date.fromisoformat(frame_range.start)
    range_end = date.fromisoformat(frame_range.end)
    answers = slot_eval.intake
    natal = extract_natal_evidence(intake)
    timezone_label = resolve_find_timezone(natal)

    if natal is None:
        return build_insufficient_natal_find_package(
            config,
            case_id=case_id,
            case_version=case_version,
            range_start=frame_range.start,
            range_end=frame_range.end,
            timezone_label=timezone_label,
            answers=answers,
            evaluation_id=evaluation_id,
            created_at=created_at,
        )

    scored_days: list[ScoredFindDay] = []
    outcomes: list[DecisionOutcome] = []
    event_location_supplied = False

    for day in iter_inclusive_dates(range_start, range_end):
        day_iso = day.isoformat()
        request, location_supplied = config.build_request(natal, day_iso)
        event_location_supplied = event_location_supplied or location_supplied
        if request.action_type != config.action_type:
            raise ValueError(
                "DecisionRequest.action_type must match "
                f"{action_type_config_label}"
            )
        # Fail closed: any single-day scoring failure aborts the FIND.
        try:
            outcome = generate_outcome(request)
        except Exception as exc:  # noqa: BLE001 — surface as provider failure
            raise RuntimeProviderError(
                "scoring provider failed for find date",
                details={
                    "error_type": type(exc).__name__,
                    "date": day_iso,
                },
            ) from exc

        score = float(outcome.recommendation.score)
        rating = str(outcome.recommendation.rating or "")
        band = (
            rating_to_candidate_band(rating)
            if rating
            else score_to_candidate_band(score)
        )
        outcomes.append(outcome)
        from packages.decision_engine.decision_assessment import (
            assessment_from_request,
            tagged_assessment_payload,
        )

        assessment = assessment_from_request(
            outcome,
            request,
            evaluation_date=day_iso,
            natal=getattr(outcome, "source_natal", None),
            transit=getattr(outcome, "source_transit", None),
            decision_type_id=config.decision_type_id,
            family_id=config.family_id,
        )
        scored_days.append(
            ScoredFindDay(
                day=day,
                score=score,
                band=band,
                strengths=config.semantics.option_strengths(
                    score=score, band=band, rating=rating
                ),
                risks=config.semantics.option_risks(
                    score=score, band=band, rating=rating
                ),
                assessment=(
                    tagged_assessment_payload(
                        assessment,
                        include_day_intelligence=False,
                    )
                    if assessment is not None
                    else None
                ),
            )
        )

    window_result = build_find_windows(scored_days)
    return assemble_find_package(
        config,
        case_id=case_id,
        case_version=case_version,
        answers=answers,
        range_start=range_start,
        range_end=range_end,
        timezone_label=timezone_label,
        window_result=window_result,
        outcomes=outcomes,
        event_location_supplied=event_location_supplied,
        scored_days=scored_days,
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


__all__ = [
    "FindRuntimeSemantics",
    "FindRuntimeTypeConfig",
    "GenerateOutcomeFn",
    "assemble_find_package",
    "build_insufficient_natal_find_package",
    "execute_find",
]
