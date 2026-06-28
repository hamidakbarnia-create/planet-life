"""Non-sensitive calculation error monitoring for production observability."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("planet_life.chart")

# Dedicated handler can be wired in app startup; default uses root logging config.
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s %(message)s")
    )
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def log_chart_error(
    error_type: str,
    message: str,
    *,
    location: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    """Log calculation failures without birth PII beyond city name."""
    payload: dict[str, Any] = {
        "event": "chart_calculation_error",
        "error_type": error_type,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if location:
        payload["location"] = location
    if latitude is not None:
        payload["latitude"] = round(float(latitude), 4)
    if longitude is not None:
        payload["longitude"] = round(float(longitude), 4)
    if extra:
        payload.update(extra)
    logger.warning("chart_error %s", payload)


def log_schema_validation_failure(errors: list[str], location: str | None = None) -> None:
    log_chart_error(
        "schema_validation_failure",
        "; ".join(errors[:5]),
        location=location,
        extra={"error_count": len(errors)},
    )
