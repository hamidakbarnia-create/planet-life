import sys, os
sys.path.insert(0, r"C:\planet-life")

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from schemas.score_breakdown import ActivityScoreResponse, build_scoring_response
from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from services.scoring_pipeline import score_with_context
from services.chart_data import (
    ChartComputationError,
    PlacidusLatitudeError,
    compute_birth_chart,
    preview_birth_location,
)
from services.chart_monitor import log_chart_error

logger = logging.getLogger(__name__)
router = APIRouter()

class LocationPreviewRequest(BaseModel):
    location: str
    latitude: float | None = None
    longitude: float | None = None


@router.post("/location-preview")
async def location_preview(request: LocationPreviewRequest):
    try:
        return preview_birth_location(
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BusinessAnalysisRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    action_type: str
    target_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    target_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    house_system: str = "placidus"
    zodiac: str = "tropical"
    latitude: float | None = None
    longitude: float | None = None
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None
    country: str | None = None
    node_type: str = "mean"  # mean | true — Astro-Seek default reference uses Mean Node

@router.post("/analyze", response_model=ActivityScoreResponse)
async def analyze_business(request: BusinessAnalysisRequest):
    action = request.action_type.lower().strip()
    try:
        result, _, transit = score_with_context(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            target_date=request.target_date,
            target_time=request.target_time,
            action_type=action,
            context=CONTEXT_ASK_ELECTIONAL,
            latitude=request.latitude,
            longitude=request.longitude,
            evaluation_location=request.evaluation_location,
            evaluation_latitude=request.evaluation_latitude,
            evaluation_longitude=request.evaluation_longitude,
            house_system=request.house_system,
            zodiac=request.zodiac,
        )
    except ValueError as e:
        log_chart_error("geocode_or_validation", str(e), location=request.location)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        log_chart_error("computation", str(e), location=request.location)
        raise HTTPException(status_code=503, detail=f"Chart computation failed: {e}")
    return build_scoring_response(result, location_context=transit.get("evaluation", {}))

@router.post("/chart")
async def get_birth_chart(request: BusinessAnalysisRequest):
    try:
        return compute_birth_chart(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            house_system=request.house_system,
            zodiac=request.zodiac,
            node_type=request.node_type,
            country=request.country,
        )
    except PlacidusLatitudeError as e:
        log_chart_error(
            "placidus_high_latitude",
            str(e),
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
        )
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        msg = str(e)
        if "Could not resolve location" in msg:
            log_chart_error("geocode_failed", msg, location=request.location)
        elif "No timezone found" in msg:
            log_chart_error("missing_timezone", msg, location=request.location)
        else:
            log_chart_error("validation", msg, location=request.location)
        raise HTTPException(status_code=422, detail=msg)
    except ChartComputationError as e:
        log_chart_error("computation", str(e), location=request.location)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        log_chart_error("computation", str(e), location=request.location)
        raise HTTPException(status_code=500, detail=str(e))
