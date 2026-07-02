import asyncio
from concurrent.futures import ThreadPoolExecutor

from repo_path import ensure_repo_on_path

ensure_repo_on_path()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from routes.business import router as business_router
from routes.finance import router as finance_router
from routes.real_estate import router as real_estate_router
from routes.vault import router as vault_router
from routes.pathfinder import router as pathfinder_router
from routes.world import router as world_router
from packages.astro_engine.scoring_context import CONTEXT_CALENDAR_DAY, CONTEXT_CALENDAR_HOURLY
from schemas.score_breakdown import build_scoring_response, validate_component_breakdown
from services.scoring_pipeline import score_with_context
from services.chart_data import build_chart_payload

# Shared threadpool for parallelizing chart computations.
# Swisseph + ephemeris math is CPU-bound but mostly releases the GIL,
# so threads give us real parallelism on multi-core machines.
_BATCH_EXECUTOR = ThreadPoolExecutor(max_workers=8, thread_name_prefix="batch")

app = FastAPI(title="Planet Life API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(business_router, prefix="/api/business", tags=["business"])
app.include_router(finance_router, prefix="/api/finance", tags=["finance"])
app.include_router(real_estate_router, prefix="/api/real-estate", tags=["real-estate"])
app.include_router(vault_router, prefix="/api/vault", tags=["vault"])
app.include_router(pathfinder_router, prefix="/api/pathfinder", tags=["pathfinder"])
app.include_router(world_router, prefix="/api/world", tags=["world"])


@app.get("/")
def health_check():
    return {"status": "healthy", "platform": "Planet Life"}


# ── Batch endpoint ────────────────────────────────────────────────────────────

class BatchDayRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    action_type: str
    domain: str = "business"          # "business" | "finance" | "real_estate"
    dates: list[str]                  # ["2025-06-01", "2025-06-02", ...]
    house_system: str = "placidus"
    zodiac: str = "tropical"
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None


def _score_one(
    birth_date,
    birth_time,
    location,
    action,
    target_date,
    target_time,
    house_system,
    zodiac,
    evaluation_location=None,
    evaluation_latitude=None,
    evaluation_longitude=None,
):
    """Synchronous worker run inside a thread."""
    try:
        result, natal, transit = score_with_context(
            birth_date=birth_date,
            birth_time=birth_time,
            location=location,
            target_date=target_date,
            target_time=target_time,
            action_type=action,
            context=CONTEXT_CALENDAR_HOURLY if target_time else CONTEXT_CALENDAR_DAY,
            evaluation_location=evaluation_location,
            evaluation_latitude=evaluation_latitude,
            evaluation_longitude=evaluation_longitude,
            house_system=house_system,
            zodiac=zodiac,
        )
        score = result
        scoring_context = CONTEXT_CALENDAR_HOURLY if target_time else CONTEXT_CALENDAR_DAY
        payload = build_scoring_response(
            score,
            natal=natal if not target_time else None,
            transit=transit if not target_time else None,
            activity_type=action if not target_time else None,
            context=scoring_context if not target_time else None,
        )
        return {
            **payload,
            "transit": transit.get("planets", {}),
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/batch")
async def batch_score(request: BatchDayRequest):
    """
    Score multiple target dates in one call, in parallel.
    Returns: { "scores": { "2025-06-01": { executive, strategic, technical }, ... } }
    """
    action = request.action_type.lower().strip()
    loop = asyncio.get_event_loop()

    # Prime the geocoding cache once (synchronous, but happens only once
    # per unique location instead of once per date).
    try:
        from services.chart_data import resolve_coordinates
        eval_loc = request.evaluation_location or request.location
        resolve_coordinates(eval_loc)
    except Exception:
        pass

    tasks = [
        loop.run_in_executor(
            _BATCH_EXECUTOR,
            _score_one,
            request.birth_date,
            request.birth_time,
            request.location,
            action,
            target_date,
            None,
            request.house_system,
            request.zodiac,
            request.evaluation_location,
            request.evaluation_latitude,
            request.evaluation_longitude,
        )
        for target_date in request.dates
    ]
    payloads = await asyncio.gather(*tasks)
    results = {
        target_date: {
            k: v for k, v in payload.items() if k != "transit"
        }
        for target_date, payload in zip(request.dates, payloads)
    }
    return {"scores": results}


# ── Hourly batch endpoint ─────────────────────────────────────────────────────

class HourlyBatchRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    action_type: str
    target_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    hours: Optional[list[int]] = None  # default: 0..23
    house_system: str = "placidus"
    zodiac: str = "tropical"
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None


@app.post("/api/batch-hourly")
async def batch_hourly(request: HourlyBatchRequest):
    """
    Score all 24 hours of a single date in one call, in parallel.
    Returns: { "hours": { 0: {score}, 1: {score}, ... } }
    """
    action = request.action_type.lower().strip()
    hours = request.hours if request.hours is not None else list(range(24))
    loop = asyncio.get_event_loop()

    try:
        from services.chart_data import resolve_coordinates
        eval_loc = request.evaluation_location or request.location
        resolve_coordinates(eval_loc)
    except Exception:
        pass

    tasks = [
        loop.run_in_executor(
            _BATCH_EXECUTOR,
            _score_one,
            request.birth_date,
            request.birth_time,
            request.location,
            action,
            request.target_date,
            f"{h:02d}:00",
            request.house_system,
            request.zodiac,
            request.evaluation_location,
            request.evaluation_latitude,
            request.evaluation_longitude,
        )
        for h in hours
    ]
    payloads = await asyncio.gather(*tasks)
    results = {}
    for h, payload in zip(hours, payloads):
        if "error" in payload:
            results[h] = {"error": payload["error"]}
        else:
            breakdown = payload["strategic"]["component_breakdown"]
            validate_component_breakdown(breakdown)
            results[h] = {
                "score": payload["executive"].get("score"),
                "component_breakdown": breakdown,
            }
    return {"hours": results}


# ── Transit snapshot endpoint ────────────────────────────────────────────────

class TransitSnapshotRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    target_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    target_time: Optional[str] = None
    house_system: str = "placidus"
    zodiac: str = "tropical"
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None


@app.post("/api/transit")
async def transit_snapshot(request: TransitSnapshotRequest):
    """Return the planetary positions for a given date (lightweight, cached)."""
    loop = asyncio.get_event_loop()

    def _compute():
        natal, transit = build_chart_payload(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            target_date=request.target_date,
            target_time=request.target_time,
            house_system=request.house_system,
            zodiac=request.zodiac,
            evaluation_location=request.evaluation_location,
            evaluation_latitude=request.evaluation_latitude,
            evaluation_longitude=request.evaluation_longitude,
        )
        return {
            "natal": natal.get("planets", {}),
            "transit": transit.get("planets", {}),
            "location_context": transit.get("evaluation", {}),
        }

    try:
        return await loop.run_in_executor(_BATCH_EXECUTOR, _compute)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))