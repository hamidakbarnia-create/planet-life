"""Vault interpretation endpoints — rules engine + templates."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.vault_readings import mars_reading

router = APIRouter()


class VaultMarsRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    lang: str = Field(default="en", pattern=r"^(en|fa|ru|ar)$")
    house_system: str = "placidus"
    zodiac: str = "tropical"


@router.post("/mars")
async def vault_mars(body: VaultMarsRequest):
    """
    My Mars — full structured reading from natal chart.
    Pipeline: Swiss Ephemeris → dignity/aspects → localized templates.
    """
    try:
        return mars_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
