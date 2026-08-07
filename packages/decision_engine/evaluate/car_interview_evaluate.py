"""Real car-interview EVALUATE runtime (Case → Package v1).

Authority:
- Decision Case intake["decision_frame"] for operation/date
- Existing DecisionEngineFacade / scoring pipeline for evidence
- DecisionEvaluationPackage v1 as output contract

Does NOT implement COMPARE or FIND. Does NOT invent today, windows,
alternatives, or stub scores.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import UUID, uuid4

from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from packages.decision_engine.intake.car_interview import (
    CAR_INTERVIEW_DECISION_TYPE_ID,
    CarInterviewIntake,
)
from packages.decision_engine.intake.evaluator import evaluate_car_interview_intake
from packages.decision_engine.models import DecisionOutcome, DecisionRequest
from packages.decision_engine.package_models import DecisionEvaluationPackage
from packages.decision_engine.registry import get_decision_type

REAL_ENGINE_ID = "decision-engine-car-interview-v1"
NATAL_EVIDENCE_INTAKE_KEY = "natal_evidence"
DECISION_FRAME_INTAKE_KEY = "decision_frame"

GenerateOutcomeFn = Callable[[DecisionRequest], DecisionOutcome]


class RuntimeFramingError(Exception):
    """Case framing missing or not ready for EVALUATE execution."""

    def __init__(self, message: str, *, details: dict[str, Any] | None = None):
        self.details = details or {}
        super().__init__(message)


class RuntimeUnsupportedOperationError(Exception):
    """COMPARE / FIND (or other) operation requested — not implemented here."""

    def __init__(self, operation: str):
        self.operation = operation
        super().__init__(f"operation not implemented: {operation}")


class RuntimeProviderError(Exception):
    """Upstream evidence/scoring provider failed."""

    def __init__(self, message: str, *, details: dict[str, Any] | None = None):
        self.details = details or {}
        super().__init__(message)


# Canonical executive rating thresholds from packages.astro_engine.scoring._rating.
# Do not invent a second numeric scale here — map via rating labels.
_RATING_HIGHLY_FAVORABLE = "Highly Favorable"
_RATING_FAVORABLE = "Favorable"
_RATING_MIXED_PREFIX = "Mixed"


def rating_to_candidate_band(rating: str) -> str:
    """Package candidate band from canonical executive rating labels."""
    if rating in {_RATING_HIGHLY_FAVORABLE, _RATING_FAVORABLE}:
        return "high"
    if rating.startswith(_RATING_MIXED_PREFIX):
        return "moderate"
    return "low"


def rating_to_stance(rating: str) -> str:
    """Package stance from canonical executive rating labels."""
    if rating == _RATING_HIGHLY_FAVORABLE:
        return "proceed"
    if rating == _RATING_FAVORABLE or rating.startswith(_RATING_MIXED_PREFIX):
        return "proceed_with_conditions"
    return "wait"


def score_to_candidate_band(score: float) -> str:
    """Fallback band from score using the same thresholds as scoring._rating."""
    if score >= 65:
        return "high"
    if score >= 45:
        return "moderate"
    return "low"


def extract_evaluate_date_from_framing(intake: Mapping[str, Any]) -> str:
    """Read explicit EVALUATE date from authoritative Case framing only."""
    raw = intake.get(DECISION_FRAME_INTAKE_KEY)
    if not isinstance(raw, dict):
        raise RuntimeFramingError(
            "decision_frame required for evaluation",
            details={"missing": [DECISION_FRAME_INTAKE_KEY]},
        )

    operation = raw.get("operation")
    if operation == "compare":
        raise RuntimeUnsupportedOperationError("compare")
    if operation == "find":
        raise RuntimeUnsupportedOperationError("find")
    if operation != "evaluate":
        raise RuntimeFramingError(
            "evaluate operation required",
            details={"operation": operation},
        )

    time_scope = raw.get("time_scope")
    if time_scope == "none":
        raise RuntimeFramingError(
            "evaluate + time_scope=none has no date to evaluate",
            details={"time_scope": time_scope},
        )
    if time_scope != "specific_date":
        raise RuntimeFramingError(
            "evaluate requires time_scope=specific_date",
            details={"time_scope": time_scope},
        )

    date_value = raw.get("date")
    if not isinstance(date_value, str) or not date_value.strip():
        raise RuntimeFramingError(
            "decision_frame.date required",
            details={"missing": ["decision_frame.date"]},
        )
    return date_value.strip()


def extract_natal_evidence(intake: Mapping[str, Any]) -> dict[str, Any] | None:
    """Return Case-persisted natal evidence snapshot when complete; else None.

    `intake.natal_evidence` is an evaluation evidence snapshot copied onto the
    Case for reproducibility. It is NOT a second user-profile system of record;
    profile remains authoritative for identity/onboarding. Runtime reads only
    the Case snapshot (never browser sessionStorage / live profile).
    """
    raw = intake.get(NATAL_EVIDENCE_INTAKE_KEY)
    if not isinstance(raw, dict):
        return None
    birth_date = str(raw.get("birth_date") or "").strip()
    birth_time = str(raw.get("birth_time") or "").strip()
    location = str(raw.get("location") or "").strip()
    if not birth_date or not birth_time or not location:
        return None
    evidence: dict[str, Any] = {
        "birth_date": birth_date,
        "birth_time": birth_time,
        "location": location,
    }
    for key in ("latitude", "longitude", "evaluation_location",
                "evaluation_latitude", "evaluation_longitude"):
        if raw.get(key) is not None:
            evidence[key] = raw[key]
    return evidence


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _base_envelope(
    *,
    case_id: UUID | str,
    case_version: int,
    evaluation_id: UUID | str,
    created_at: str,
) -> dict[str, Any]:
    record = get_decision_type(CAR_INTERVIEW_DECISION_TYPE_ID)
    return {
        "case_id": str(case_id),
        "evaluation_id": str(evaluation_id),
        "evaluation_version": 1,
        "case_version": case_version,
        "decision_type_id": record.decision_type_id,
        "family_id": record.family_id,
        "mode": "evaluate_date",
        "precision_level": "L3",
        "engine_id": REAL_ENGINE_ID,
        "created_at": created_at,
        "schema_version": "1.0.0",
    }


def build_insufficient_natal_package(
    *,
    case_id: UUID | str,
    case_version: int,
    target_date: str,
    intake: CarInterviewIntake,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Honest Package when natal evidence is unavailable — no fake scores."""
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    role = intake.role or "the role"
    # Package v1 still requires exactly one scored candidate in evaluate_date.
    # Candidate score/band are schema placeholders; timing.material=false and
    # stance=insufficient_data are the honest signals. Renderer must treat as Unknown.
    payload: dict[str, Any] = {
        **_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
        ),
        "recommendation": {
            "stance": "insufficient_data",
            "conditions": ["Add birth date, birth time, and birth location evidence"],
            "summary": (
                f"Cannot evaluate the {role} interview date without natal evidence."
            ),
        },
        "timing": {
            "material": False,
            "band": "na",
            "score": None,
            "candidates": [
                {
                    "date": target_date,
                    "rank": 1,
                    # Schema placeholder only — not a favorability claim.
                    "score": 0.0,
                    "band": "low",
                }
            ],
            "notes": (
                "Timing not evaluated: natal evidence unavailable. "
                "Candidate score/band are Package v1 placeholders, not ratings."
            ),
        },
        "confidence": {
            "value": 0.0,
            "precision_level": "L3",
            "penalties": [
                {
                    "code": "MISSING_NATAL_EVIDENCE",
                    "message": (
                        "Birth date/time/location evidence is required for "
                        "timing evaluation."
                    ),
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
                    "action": (
                        "Provide natal evidence (birth date, time, location) "
                        "on the Case, then re-evaluate."
                    ),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "insufficient_data",
            "summary": "",
            "reason": (
                "No alternative date was evaluated. EVALUATE assesses only the "
                "requested date; FIND is not implemented."
            ),
        },
        "explainability": {
            "why": "Evaluation did not run because natal evidence is missing.",
            "why_not": "Without natal inputs, timing quality cannot be computed.",
            "assumptions": [],
            "limits": [
                "Package v1 requires a timing candidate even when timing is non-material.",
                "No clock-time window, avoid window, or alternative search was performed.",
            ],
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


def assemble_package_from_outcome(
    outcome: DecisionOutcome,
    *,
    case_id: UUID | str,
    case_version: int,
    target_date: str,
    intake: CarInterviewIntake,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
    event_location_supplied: bool = False,
) -> DecisionEvaluationPackage:
    """Map a real DecisionOutcome onto Package v1 without inventing fields."""
    eid = evaluation_id or uuid4()
    created = (
        created_at.isoformat().replace("+00:00", "Z")
        if created_at
        else _iso_now()
    )
    score = float(outcome.recommendation.score)
    rating = str(outcome.recommendation.rating or "")
    band = rating_to_candidate_band(rating) if rating else score_to_candidate_band(score)
    stance = rating_to_stance(rating) if rating else "wait"
    # Intake labels for display only — they do not enter the scoring request.
    role_label = intake.role or "interview"
    company = intake.company

    confidence_penalties: list[dict[str, str]] = []
    confidence_value: float
    if outcome.confidence is not None and outcome.confidence.value is not None:
        # Reasoning confidence is 0–1; Package v1 requires a numeric 0–100 field
        # (null/NA not representable). Scale only — do not invent confidence.
        confidence_value = round(float(outcome.confidence.value) * 100.0, 2)
    else:
        # Schema placeholder 0 — NOT a measured zero-confidence claim.
        # Consumers MUST treat CONFIDENCE_UNAVAILABLE as Unknown, never as 0%.
        confidence_value = 0.0
        confidence_penalties.append(
            {
                "code": "CONFIDENCE_UNAVAILABLE",
                "message": (
                    "Upstream scoring did not supply a reasoning confidence value. "
                    "Package confidence.value=0 is a schema placeholder, not a measured score."
                ),
            }
        )

    drivers: list[dict[str, Any]] = []
    for index, ref in enumerate(outcome.evidence_references[:5]):
        label = (ref.title or ref.category or f"Evidence {index + 1}").strip()
        ref_score = float(ref.score) if ref.score is not None else score
        ref_score = max(0.0, min(100.0, ref_score))
        drivers.append(
            {
                "id": f"evidence-{index + 1}",
                "label": label[:80],
                "score": ref_score,
                "band": score_to_candidate_band(ref_score),
                "support": (ref.detail or outcome.recommendation.summary or "")[:240],
                "friction": "",
            }
        )

    why = outcome.explanation.summary or outcome.recommendation.text
    why_not = ""
    if outcome.explanation.reasons:
        harsh = [
            r
            for r in outcome.explanation.reasons
            if (r.importance or "").lower() in {"high", "critical"}
            and (r.score is not None and r.score < 0)
        ]
        if harsh and harsh[0].explanation:
            why_not = harsh[0].explanation

    # Honest claim: timing uses job_interview→negotiation profile, not role/company scoring.
    summary = (
        f"{rating or 'Scored'} negotiation-timing conditions on {target_date} "
        f"for this {role_label}"
        + (f" ({company})" if company else "")
        + "."
    ).strip()

    conditions: list[str] = []
    # Context gaps are listed as conditions; they did not change the score.
    if not company:
        conditions.append(
            "Company was not used in scoring (missing on Case; label-only context)"
        )
    if not intake.interview_type:
        conditions.append(
            "Interview type was not used in scoring (missing on Case; label-only context)"
        )
    conditions = conditions[:5]

    evidence_items = [
        {
            "framework_id": "astro_timing",
            "eligibility": "registered",
            "artifact_ref": f"evidence://astro_timing/{target_date}",
            "limits": [
                "Canonical activity mapping: job_interview → negotiation profile.",
                "Score reflects negotiation/communication timing signals, not employer fit.",
                "role, company, and interview_type did not enter the scoring function.",
                "Astrological timing does not determine interview outcome.",
            ],
        }
    ]

    payload: dict[str, Any] = {
        **_base_envelope(
            case_id=case_id,
            case_version=case_version,
            evaluation_id=eid,
            created_at=created,
        ),
        "recommendation": {
            "stance": stance,
            "conditions": conditions,
            "summary": summary or outcome.recommendation.summary or "Timing evaluated.",
        },
        "timing": {
            "material": True,
            "band": band,
            "score": score,
            "candidates": [
                {
                    "date": target_date,
                    "rank": 1,
                    "score": score,
                    "band": band,
                }
            ],
            "notes": (
                f"Date-level score from decision-engine facade "
                f"(action=job_interview → negotiation profile, rating={rating}). "
                "No clock-time window was computed. "
                "role/company/interview_type are Case labels only."
            ),
        },
        "confidence": {
            "value": confidence_value,
            "precision_level": "L3",
            "penalties": confidence_penalties,
        },
        "evidence": {"items": evidence_items},
        "drivers": {"items": drivers},
        "tradeoffs": {"items": []},
        "risks": {"items": []},
        "opportunities": {"items": []},
        "action_plan": {
            "steps": [
                {
                    "order": 1,
                    "action": (
                        f"Decide whether to keep the interview on {target_date} "
                        "given the negotiation-timing evidence above."
                    ),
                    "condition": None,
                }
            ]
        },
        "counter_recommendation": {
            "stance": "wait",
            "summary": "",
            "reason": (
                "No alternative date was evaluated. EVALUATE assesses only the "
                "requested date; FIND is not implemented."
            ),
        },
        "explainability": {
            "why": why,
            "why_not": why_not
            or "Negative timing factors were not isolated as a single driver.",
            "assumptions": [
                "Evaluation used Case-persisted interview date from decision_frame.date.",
                "Transit timing used noon local default when no interview clock time was supplied.",
                "Canonical pre-existing alias job_interview→negotiation was used for scoring.",
                (
                    "Interview/event location was supplied separately from birth place."
                    if event_location_supplied
                    else (
                        "Interview/event location was not supplied on the Case; "
                        "scoring pipeline may default transit location to birth place."
                    )
                ),
            ],
            "limits": [
                "This is negotiation/communication timing evidence, not full interview intelligence.",
                "role, company, and interview_type did not affect the numeric score.",
                "Birth location and interview/event location are distinct; birth was not treated as interview city in Case evidence.",
                "Best clock-time window was not computed (date-level evidence only).",
                "Avoid windows were not computed.",
                "Alternative dates were not searched.",
            ],
        },
        "improve_accuracy": {
            "items": [
                "Provide interview clock time to enable hourly window analysis (future).",
            ]
        },
        "next_decisions": {"items": []},
        "related_decisions": {"items": []},
    }
    return DecisionEvaluationPackage.model_validate(payload)


def evaluate_car_interview(
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, Any],
    generate_outcome: GenerateOutcomeFn,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Execute car-interview EVALUATE against Case-persisted framing + evidence."""
    slot_eval = evaluate_car_interview_intake(intake)
    if not slot_eval.is_complete:
        raise RuntimeFramingError(
            "car-interview intake incomplete",
            details={"missing_required": list(slot_eval.missing_required)},
        )

    target_date = extract_evaluate_date_from_framing(intake)
    answers = slot_eval.intake
    natal = extract_natal_evidence(intake)
    if natal is None:
        return build_insufficient_natal_package(
            case_id=case_id,
            case_version=case_version,
            target_date=target_date,
            intake=answers,
            evaluation_id=evaluation_id,
            created_at=created_at,
        )

    # Birth location ≠ interview/event location. Only pass evaluation_* when the
    # Case snapshot explicitly has distinct event-location fields. Never substitute
    # birth place as if it were the interview city. When omitted, the scoring
    # pipeline may fall back to birth for transit (existing engine default).
    event_location = natal.get("evaluation_location")
    if isinstance(event_location, str):
        event_location = event_location.strip() or None
    else:
        event_location = None
    # Reject accidental copy of birth label into event fields.
    if event_location and event_location == natal["location"]:
        if natal.get("evaluation_latitude") in (None, natal.get("latitude")) and natal.get(
            "evaluation_longitude"
        ) in (None, natal.get("longitude")):
            event_location = None

    request = DecisionRequest(
        module_origin="ask",
        decision_intent="car-interview-evaluate-date",
        birth_date=natal["birth_date"],
        birth_time=natal["birth_time"],
        location=natal["location"],
        target_date=target_date,
        action_type="job_interview",
        context=CONTEXT_ASK_ELECTIONAL,
        latitude=natal.get("latitude"),
        longitude=natal.get("longitude"),
        evaluation_location=event_location,
        evaluation_latitude=natal.get("evaluation_latitude") if event_location else None,
        evaluation_longitude=natal.get("evaluation_longitude") if event_location else None,
    )
    try:
        outcome = generate_outcome(request)
    except Exception as exc:  # noqa: BLE001 — surface as provider failure
        raise RuntimeProviderError(
            "scoring provider failed",
            details={"error_type": type(exc).__name__},
        ) from exc

    return assemble_package_from_outcome(
        outcome,
        case_id=case_id,
        case_version=case_version,
        target_date=target_date,
        intake=answers,
        evaluation_id=evaluation_id,
        created_at=created_at,
        event_location_supplied=event_location is not None,
    )


def evaluate_car_interview_dict(**kwargs: Any) -> dict[str, Any]:
    package = evaluate_car_interview(**kwargs)
    return package.model_dump(mode="json")
