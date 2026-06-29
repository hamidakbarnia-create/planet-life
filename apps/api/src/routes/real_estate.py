import sys, os
sys.path.insert(0, r"C:\planet-life")

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from packages.astro_engine.scoring_context import CONTEXT_PROPERTY
from services.scoring_pipeline import score_with_context

router = APIRouter()

REAL_ESTATE_ACTIONS = {
    "real_estate", "contract_signing", "investment",
    "negotiation", "contract", "invest"
}

class RealEstateAnalysisRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    action_type: str
    target_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None

@router.post("/analyze")
async def analyze_real_estate(request: RealEstateAnalysisRequest):
    action = request.action_type.lower().strip()
    if action not in REAL_ESTATE_ACTIONS:
        raise HTTPException(status_code=422, detail=f"Unknown real estate action '{action}'.")
    try:
        result, _, _ = score_with_context(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            target_date=request.target_date,
            target_time=None,
            action_type=action,
            context=CONTEXT_PROPERTY,
            evaluation_location=request.evaluation_location,
            evaluation_latitude=request.evaluation_latitude,
            evaluation_longitude=request.evaluation_longitude,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Chart computation failed: {e}")
    return {
        "executive": result["executive"],
        "strategic": result["strategic"],
        "technical": result["technical"],
    }
