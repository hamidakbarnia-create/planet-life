"""Location role helpers — birth vs evaluation (current/target) for chart payloads."""

from __future__ import annotations

from typing import Any

from services.chart_data import _timezone_at, resolve_location


def build_location_context_meta(
    *,
    birth_location: str,
    birth_lat: float,
    birth_lon: float,
    birth_src: str,
    evaluation_location: str,
    eval_lat: float,
    eval_lon: float,
    eval_src: str,
) -> dict[str, Any]:
    """Metadata returned with scored answers so the UI can show where timing was calculated."""
    birth_tz = _timezone_at(birth_lat, birth_lon)
    eval_tz = _timezone_at(eval_lat, eval_lon)
    used_birth = (
        evaluation_location.strip().lower() == birth_location.strip().lower()
        and abs(eval_lat - birth_lat) < 1e-6
        and abs(eval_lon - birth_lon) < 1e-6
    )
    return {
        "birth_location": birth_location,
        "birth_latitude": birth_lat,
        "birth_longitude": birth_lon,
        "birth_timezone": birth_tz,
        "birth_coordinate_source": birth_src,
        "evaluation_location": evaluation_location,
        "evaluation_latitude": eval_lat,
        "evaluation_longitude": eval_lon,
        "evaluation_timezone": eval_tz,
        "evaluation_coordinate_source": eval_src,
        "used_birth_for_evaluation": used_birth,
        "calculated_for": evaluation_location,
    }


def resolve_evaluation_coords(
    birth_location: str,
    *,
    birth_latitude: float | None = None,
    birth_longitude: float | None = None,
    evaluation_location: str | None = None,
    evaluation_latitude: float | None = None,
    evaluation_longitude: float | None = None,
) -> tuple[str, float, float, float, float, str, str]:
    """Return birth + evaluation coordinates for build_chart_payload."""
    birth_lat, birth_lon, birth_src = resolve_location(
        birth_location, birth_latitude, birth_longitude
    )
    eval_label = evaluation_location or birth_location
    if evaluation_location is None and evaluation_latitude is None:
        eval_lat, eval_lon, eval_src = birth_lat, birth_lon, birth_src
    else:
        eval_lat, eval_lon, eval_src = resolve_location(
            eval_label,
            evaluation_latitude,
            evaluation_longitude,
        )
    return (
        birth_lat,
        birth_lon,
        birth_src,
        eval_lat,
        eval_lon,
        eval_src,
        eval_label,
    )
