import sys, os
sys.path.insert(0, r"C:\planet-life")

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from packages.astro_engine.scoring import calculate_activity_score
from services.chart_data import build_chart_payload

router = APIRouter()

class BusinessAnalysisRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    action_type: str
    target_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")

@router.post("/analyze")
async def analyze_business(request: BusinessAnalysisRequest):
    action = request.action_type.lower().strip()
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
def _get_house(longitude: float, cusps: list) -> int:
    lon = longitude % 360.0
    for i in range(12):
        start = cusps[i] % 360.0
        end = cusps[(i + 1) % 12] % 360.0
        if start <= end:
            if start <= lon < end:
                return i + 1
        else:
            if lon >= start or lon < end:
                return i + 1
    return 1

@router.post("/chart")
async def get_birth_chart(request: BusinessAnalysisRequest):
    try:
        import swisseph as swe
        swe.set_ephe_path('')
        from services.chart_data import resolve_coordinates, _local_datetime
        from datetime import timezone
        lat, lon = resolve_coordinates(request.location)
        natal_dt = _local_datetime(request.birth_date, request.birth_time, lat, lon)
        dt_utc = natal_dt.astimezone(timezone.utc)
        jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day,
            dt_utc.hour + dt_utc.minute/60.0 + dt_utc.second/3600.0, swe.GREG_CAL)
        houses_data = swe.houses(jd, lat, lon, b"P")
        cusps = houses_data[0]
        ascmc = houses_data[1]
        cusp_list = [float(cusps[i]) for i in range(0, 12)]
        bodies = [
            (swe.SUN,'sun'),(swe.MOON,'moon'),(swe.MERCURY,'mercury'),
            (swe.VENUS,'venus'),(swe.MARS,'mars'),(swe.JUPITER,'jupiter'),
            (swe.SATURN,'saturn'),(swe.URANUS,'uranus'),(swe.NEPTUNE,'neptune'),
            (swe.PLUTO,'pluto'),(swe.TRUE_NODE,'north_node'),
        ]
        planets = {}
        for pid, name in bodies:
            result, _ = swe.calc_ut(jd, pid, swe.FLG_MOSEPH)
            lng = float(result[0])
            spd = float(result[3]) if len(result) > 3 else 0.0
            planets[name] = {
                "longitude": round(lng, 4),
                "retrograde": spd < 0,
                "house": _get_house(lng, cusp_list),
                "sign": int(lng // 30) + 1,
                "degree": round(lng % 30, 2),
            }
        return {
            "planets": planets,
            "ascendant": round(float(ascmc[0]), 4),
            "midheaven": round(float(ascmc[1]), 4),
            "houses": cusp_list,
            "latitude": lat,
            "longitude": lon,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))