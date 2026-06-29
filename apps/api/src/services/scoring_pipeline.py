"""Build charts + score with explicit ScoringContext routing."""

from __future__ import annotations

from typing import Any

from packages.astro_engine.scoring import calculate_activity_score
from packages.astro_engine.scoring_context import (
    ScoringContext,
    resolve_transit_time,
)
from services.chart_data import build_chart_payload


def score_with_context(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    target_date: str,
    target_time: str | None,
    action_type: str,
    context: ScoringContext,
    latitude: float | None = None,
    longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
    house_system: str = "placidus",
    zodiac: str = "tropical",
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    """Return (score_result, natal_chart, transit_chart)."""
    resolved_time = resolve_transit_time(context, target_time)

    eval_location = evaluation_location
    eval_lat = evaluation_latitude
    eval_lon = evaluation_longitude
    if context.location_mode == "birthOnly":
        eval_location = None
        eval_lat = None
        eval_lon = None

    natal, transit = build_chart_payload(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=target_date,
        target_time=resolved_time,
        house_system=house_system,
        zodiac=zodiac,
        latitude=latitude,
        longitude=longitude,
        evaluation_location=eval_location,
        evaluation_latitude=eval_lat,
        evaluation_longitude=eval_lon,
    )
    if transit.get("evaluation") is not None:
        transit["evaluation"]["scoring_context"] = {
            "location_mode": context.location_mode,
            "transit_time_resolved": resolved_time,
        }
    result = calculate_activity_score(
        natal, transit, action_type, scoring_context=context
    )
    return result, natal, transit
