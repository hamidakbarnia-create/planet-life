from repo_path import ensure_repo_on_path

ensure_repo_on_path()

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from schemas.score_breakdown import ActivityScoreResponse, build_scoring_response
from packages.astro_engine.scoring_context import CONTEXT_ASK_ELECTIONAL
from services.scoring_pipeline import score_with_context

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
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None

@router.post("/analyze", response_model=ActivityScoreResponse)
async def analyze_finance(request: FinanceAnalysisRequest):
    action = request.action_type.lower().strip()
    if action not in FINANCE_ACTIONS:
        raise HTTPException(status_code=422, detail=f"Unknown finance action '{action}'.")
    try:
        result, natal, transit = score_with_context(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            target_date=request.target_date,
            target_time=None,
            action_type=action,
            context=CONTEXT_ASK_ELECTIONAL,
            evaluation_location=request.evaluation_location,
            evaluation_latitude=request.evaluation_latitude,
            evaluation_longitude=request.evaluation_longitude,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Chart computation failed: {e}")
    return build_scoring_response(
        result,
        natal=natal,
        transit=transit,
        activity_type=action,
        context=CONTEXT_ASK_ELECTIONAL,
    )
