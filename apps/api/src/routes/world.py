"""World / mundane astrology overlay endpoints.

Returns the current sky as themed signals (markets / geopolitics). Live prices
and headlines are fetched separately on the web side; this endpoint supplies the
astrological cycle layer that gets overlaid on those facts.
"""

from fastapi import APIRouter, HTTPException

from services.world_feed import city_reading, current_sky
from services.world_figures import figure_reading

router = APIRouter()


@router.get("/sky")
async def world_sky():
    try:
        return current_sky()
    except Exception as e:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/figure")
async def world_figure(name: str):
    """Current transits to a known public figure's natal chart (unique per person)."""
    try:
        return figure_reading(name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/city")
async def world_city(lat: float, lon: float):
    """Current sky over a specific city's local angles (unique per city)."""
    try:
        return city_reading(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
