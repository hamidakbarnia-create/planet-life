import sys, os
sys.path.insert(0, r"C:\planet-life")

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from packages.astro_engine.scoring import calculate_activity_score
from services.chart_data import (
    ChartComputationError,
    PlacidusLatitudeError,
    build_chart_payload,
    compute_birth_chart,
)
from services.chart_monitor import log_chart_error

logger = logging.getLogger(__name__)
router = APIRouter()

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
    country: str | None = None
    node_type: str = "mean"  # mean | true — Astro-Seek default reference uses Mean Node

@router.post("/analyze")
async def analyze_business(request: BusinessAnalysisRequest):
    action = request.action_type.lower().strip()
    try:
        natal, transit = build_chart_payload(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            target_date=request.target_date,
            target_time=request.target_time,
            house_system=request.house_system,
            zodiac=request.zodiac,
        )
    except ValueError as e:
        log_chart_error("geocode_or_validation", str(e), location=request.location)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        log_chart_error("computation", str(e), location=request.location)
        raise HTTPException(status_code=503, detail=f"Chart computation failed: {e}")
    try:
        result = calculate_activity_score(natal, transit, action)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")
    return {
        "executive": result["executive"],
        "strategic": result["strategic"],
        "technical": result["technical"],
    }

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
