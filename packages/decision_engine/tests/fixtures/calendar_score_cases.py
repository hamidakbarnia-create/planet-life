"""Synthetic calendar scoring cases used to generate and validate goldens.

Charts are constructed so ``calculate_activity_score`` is the only authority
for expected scores. No hand-written astrology interpretations.
"""

from __future__ import annotations

from typing import Any, Callable

from packages.astro_engine.scoring_context import CONTEXT_CALENDAR_DAY, ScoringContext

LONDON_EVALUATION = {
    "calculated_for": "London, United Kingdom",
    "evaluation_location": "London, United Kingdom",
    "resolved_local_datetime": "2026-06-15T12:00:00+01:00",
    "resolved_utc_datetime": "2026-06-15T11:00:00+00:00",
    "timezone": "Europe/London",
    "target_time": "12:00",
}

SYDNEY_EVALUATION = {
    "calculated_for": "Sydney, Australia",
    "evaluation_location": "Sydney, Australia",
    "resolved_local_datetime": "2026-06-15T12:00:00+10:00",
    "resolved_utc_datetime": "2026-06-15T02:00:00+00:00",
    "timezone": "Australia/Sydney",
    "target_time": "12:00",
}


def _body(
    longitude: float,
    *,
    house: int | None = None,
    retrograde: bool = False,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"longitude": longitude}
    if house is not None:
        payload["house"] = house
    if retrograde:
        payload["retrograde"] = True
    return payload


def _natal(**planets: dict[str, Any]) -> dict[str, Any]:
    return {"planets": planets}


def _transit(
    planets: dict[str, Any],
    *,
    ascendant: float | None = None,
    midheaven: float | None = None,
    evaluation: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"planets": planets}
    if ascendant is not None:
        payload["ascendant"] = ascendant
    if midheaven is not None:
        payload["midheaven"] = midheaven
    if evaluation is not None:
        payload["evaluation"] = dict(evaluation)
    return payload


def calendar_context() -> ScoringContext:
    return CONTEXT_CALENDAR_DAY


def case_strongly_supportive() -> dict[str, Any]:
    natal = _natal(
        sun=_body(0.0, house=10),
        mars=_body(12.0, house=10),
        jupiter=_body(24.0, house=11),
    )
    transit = _transit(
        {
            "jupiter": _body(120.2, house=10),
            "venus": _body(60.3, house=11),
            "sun": _body(119.8, house=10),
        },
        ascendant=30.0,
        midheaven=120.0,
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "strongly_supportive",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_strongly_adverse() -> dict[str, Any]:
    natal = _natal(
        sun=_body(0.0, house=10),
        mercury=_body(18.0, house=10),
        mars=_body(40.0, house=11),
    )
    transit = _transit(
        {
            "saturn": _body(90.2, house=12),
            "mars": _body(90.4, house=8, retrograde=True),
            "pluto": _body(180.3, house=12),
        },
        ascendant=0.0,
        midheaven=90.0,
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "strongly_adverse",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_mixed_conflicting() -> dict[str, Any]:
    natal = _natal(sun=_body(0.0, house=10), mercury=_body(14.0, house=9))
    transit = _transit(
        {
            "jupiter": _body(120.1, house=10),
            "saturn": _body(90.2, house=12),
        },
        ascendant=10.0,
        midheaven=280.0,
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "mixed_conflicting",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_close_exact_aspect() -> dict[str, Any]:
    natal = _natal(sun=_body(0.0, house=5))
    transit = _transit(
        {"jupiter": _body(120.05, house=9)},
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "close_exact_aspect",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_loose_aspect() -> dict[str, Any]:
    natal = _natal(sun=_body(0.0, house=5))
    transit = _transit(
        {"jupiter": _body(125.8, house=9)},
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "loose_aspect",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_angular_contact() -> dict[str, Any]:
    # 135° from natal Sun avoids a named aspect so angular contact can dominate.
    natal = _natal(sun=_body(45.0, house=10))
    transit = _transit(
        {"jupiter": _body(180.0, house=1)},
        ascendant=180.4,
        midheaven=90.0,
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "angular_contact",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_retrograde_penalty() -> dict[str, Any]:
    natal = _natal(sun=_body(0.0, house=10), mars=_body(80.0, house=11))
    transit = _transit(
        {"mars": _body(40.0, house=11, retrograde=True)},
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "retrograde_penalty",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_action_type_business_launch() -> dict[str, Any]:
    shared = case_mixed_conflicting()
    return {
        **shared,
        "id": "action_type_business_launch",
        "action_type": "business_launch",
    }


def case_action_type_rest_recovery() -> dict[str, Any]:
    shared = case_mixed_conflicting()
    return {
        **shared,
        "id": "action_type_rest_recovery",
        "action_type": "rest_recovery",
    }


def case_natal_personalization_a() -> dict[str, Any]:
    natal = _natal(sun=_body(0.0, house=10))
    transit = _transit(
        {"jupiter": _body(120.0, house=10)},
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "natal_personalization_a",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_natal_personalization_b() -> dict[str, Any]:
    natal = _natal(sun=_body(210.0, house=4))
    transit = _transit(
        {"jupiter": _body(120.0, house=10)},
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "natal_personalization_b",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_evaluation_location_london() -> dict[str, Any]:
    natal = _natal(sun=_body(0.0, house=10))
    transit = _transit(
        {"jupiter": _body(120.0, house=10)},
        ascendant=30.0,
        midheaven=120.2,
        evaluation=LONDON_EVALUATION,
    )
    return {
        "id": "evaluation_location_london",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


def case_evaluation_location_sydney() -> dict[str, Any]:
    natal = _natal(sun=_body(0.0, house=10))
    transit = _transit(
        {"jupiter": _body(120.0, house=12)},
        ascendant=0.0,
        midheaven=270.0,
        evaluation=SYDNEY_EVALUATION,
    )
    return {
        "id": "evaluation_location_sydney",
        "action_type": "business_launch",
        "scoring_context": CONTEXT_CALENDAR_DAY,
        "natal": natal,
        "transit": transit,
    }


CASE_BUILDERS: tuple[Callable[[], dict[str, Any]], ...] = (
    case_strongly_supportive,
    case_strongly_adverse,
    case_mixed_conflicting,
    case_close_exact_aspect,
    case_loose_aspect,
    case_angular_contact,
    case_retrograde_penalty,
    case_action_type_business_launch,
    case_action_type_rest_recovery,
    case_natal_personalization_a,
    case_natal_personalization_b,
    case_evaluation_location_london,
    case_evaluation_location_sydney,
)
