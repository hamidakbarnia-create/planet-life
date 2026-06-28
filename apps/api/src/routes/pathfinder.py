"""Pathfinder relocation astrology endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.pathfinder import best_times, relocation_reading

router = APIRouter()


class PathfinderRelocationRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    birth_location: str
    target_location: str
    target_label: str | None = None
    lang: str = Field(default="en", pattern=r"^(en|fa|ru|ar)$")
    house_system: str = "placidus"
    zodiac: str = "tropical"


class PathfinderBestTimesRequest(PathfinderRelocationRequest):
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    search_months: int = Field(default=3, ge=1, le=12)
    trip_days: int = Field(default=7, ge=3, le=30)
    purpose: str = "all"


@router.post("/relocation")
async def pathfinder_relocation(body: PathfinderRelocationRequest):
    try:
        return relocation_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            birth_location=body.birth_location,
            target_location=body.target_location,
            target_label=body.target_label,
            house_system=body.house_system,
            zodiac=body.zodiac,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/best-times")
async def pathfinder_best_times(body: PathfinderBestTimesRequest):
    try:
        return best_times(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            birth_location=body.birth_location,
            target_location=body.target_location,
            start_date=body.start_date,
            search_months=body.search_months,
            trip_days=body.trip_days,
            purpose=body.purpose,
            house_system=body.house_system,
            zodiac=body.zodiac,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
