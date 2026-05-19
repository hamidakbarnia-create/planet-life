import sys, os
sys.path.insert(0, r"C:\planet-life")

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from packages.astro_engine.scoring import calculate_activity_score
from services.chart_data import build_chart_payload

router = APIRouter()

FINANCE_ACTIONS = {
    "investment", "finance_transaction", "negotiation",
    "contract_signing", "invest", "contract"
}

class FinanceAnalysisRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    action_type: str
    target_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")

@router.post("/analyze")
async def analyze_finance(request: FinanceAnalysisRequest):
    action = request.action_type.lower().strip()
    if action not in FINANCE_ACTIONS:
        raise HTTPException(status_code=422, detail=f"Unknown finance action '{action}'.")
    try:
        natal, transit = build_chart_payload(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            target_date=request.target_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
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