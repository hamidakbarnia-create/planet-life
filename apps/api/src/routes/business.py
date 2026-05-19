from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from packages.astro_engine.scoring import calculate_activity_score

router = APIRouter()

class BusinessAnalysisRequest(BaseModel):
    birth_date: str = Field(..., description="YYYY-MM-DD")
    birth_time: str = Field(..., description="HH:MM")
    location: str = Field(..., description="Lat,Lon or city name")
    action_type: str = Field(..., description="e.g., business_launch")
    target_date: str = Field(..., description="YYYY-MM-DD")

@router.post("/analyze")
async def analyze_business_vibe(payload: BusinessAnalysisRequest):
    try:
        # شبیه‌سازی ساخت پکیج دیتای چارت (به دلیل موک بودن موتور در پایتون 3.14)
        mock_natal = {
            "planets": {
                "sun": {"longitude": 95.0, "house": 10},
                "jupiter": {"longitude": 120.0, "house": 5},
                "mars": {"longitude": 45.0, "house": 1}
            }
        }
        mock_transit = {
            "planets": {
                "jupiter": {"longitude": 118.0, "retrograde": False},
                "saturn": {"longitude": 210.0, "retrograde": True}
            },
            "aspects": [
                {"transit_planet": "jupiter", "natal_planet": "sun", "aspect": "trine", "orb": 1.2}
            ]
        }
        
        # فراخوانی موتور محاسباتی
        result = calculate_activity_score(mock_natal, mock_transit, payload.action_type)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))