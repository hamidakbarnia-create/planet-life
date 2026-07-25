"""Vault interpretation endpoints — rules engine + templates."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.vault_readings import (
    best_countries_reading,
    business_geography_reading,
    date_outfit_reading,
    ghost_days_reading,
    hot_attraction_days_reading,
    live_reel_time_reading,
    mars_reading,
    money_ask_days_reading,
    cheating_radar_reading,
    compatibility_reading,
    partner_profile_reading,
    todays_color_reading,
    todays_perfume_reading,
    communication_risk_reading,
    trust_patterns_reading,
    yes_day_reading,
)

router = APIRouter()


class VaultMarsRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    lang: str = Field(default="en", pattern=r"^(en|fa|ru|ar)$")
    house_system: str = "placidus"
    zodiac: str = "tropical"


class VaultGhostDaysRequest(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str
    lang: str = Field(default="en", pattern=r"^(en|fa|ru|ar)$")
    house_system: str = "placidus"
    zodiac: str = "tropical"
    latitude: float | None = None
    longitude: float | None = None
    evaluation_location: str | None = None
    evaluation_latitude: float | None = None
    evaluation_longitude: float | None = None
    evaluation_timezone: str | None = None


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


@router.post("/ghost-days")
async def vault_ghost_days(body: VaultGhostDaysRequest):
    """
    Power Calendar — Ghost Days (strategic distance windows).
    Reuses calendar-day scoring with action rest_recovery.
    """
    try:
        return ghost_days_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/money-ask-days")
async def vault_money_ask_days(body: VaultGhostDaysRequest):
    """
    Power Calendar — Money-Ask Days (Venus money windows).
    Same window pipeline as Ghost Days; action finance_transaction.
    """
    try:
        return money_ask_days_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/yes-day")
async def vault_yes_day(body: VaultGhostDaysRequest):
    """
    Power Calendar — Yes Day (ask / commit / sign windows).
    Calendar-day pipeline; negotiation + contract_signing.
    """
    try:
        return yes_day_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/hot-attraction-days")
async def vault_hot_attraction_days(body: VaultGhostDaysRequest):
    """
    Power Calendar — Hot Attraction Days (Venus/Mars heat windows).
    Calendar-day scoring with action hot_attraction.
    """
    try:
        return hot_attraction_days_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/todays-color")
async def vault_todays_color(body: VaultGhostDaysRequest):
    """
    Style Timing — Today's Color (Moon dress code).
    Reuses transit Moon from chart_data for today.
    """
    try:
        return todays_color_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/todays-perfume")
async def vault_todays_perfume(body: VaultGhostDaysRequest):
    """
    Style Timing — Today's Perfume.
    Natal Venus + Natal Moon + Ascendant + Transit Moon for the local day.
    """
    try:
        return todays_perfume_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/live-reel-time")
async def vault_live_reel_time(body: VaultGhostDaysRequest):
    """
    Style Timing — Live / Reel Time.
    Hourly scoring for posting, filming, and live-stream windows.
    """
    try:
        return live_reel_time_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/date-outfit")
async def vault_date_outfit(body: VaultGhostDaysRequest):
    """
    Style Timing — Date Outfit.
    Venus/Asc look + Moon colors/perfume tables + hot_attraction meeting hour.
    """
    try:
        return date_outfit_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            evaluation_location=body.evaluation_location,
            evaluation_latitude=body.evaluation_latitude,
            evaluation_longitude=body.evaluation_longitude,
            evaluation_timezone=body.evaluation_timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class VaultBestCountriesRequest(VaultGhostDaysRequest):
    goal: str = Field(default="wealth", pattern=r"^(wealth|career|relationship|visibility|stability)$")
    locations: list[str] = Field(default_factory=list)
    current_location: str | None = None


@router.post("/best-countries")
async def vault_best_countries(body: VaultBestCountriesRequest):
    """
    Provider — Best Countries.
    Pathfinder relocation shortlist ranking (angles + significator houses).
    """
    try:
        return best_countries_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            goal=body.goal,
            locations=body.locations,
            current_location=body.current_location,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class VaultBusinessGeographyRequest(VaultGhostDaysRequest):
    goal: str = Field(
        default="expansion",
        pattern=r"^(sales|networking|credibility|expansion|investment)$",
    )
    locations: list[str] = Field(default_factory=list)
    current_location: str | None = None


@router.post("/business-geography")
async def vault_business_geography(body: VaultBusinessGeographyRequest):
    """
    Provider — Business Geography.
    Pathfinder relocation blend (wealth/career/community) for business goals.
    """
    try:
        return business_geography_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            goal=body.goal,
            locations=body.locations,
            current_location=body.current_location,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class VaultPartnerProfileRequest(VaultGhostDaysRequest):
    goal: str = Field(
        default="romantic",
        pattern=r"^(romantic|marriage|business|financial_support|long_term_stability)$",
    )
    partner_birth_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    partner_birth_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    partner_location: str | None = None
    partner_latitude: float | None = None
    partner_longitude: float | None = None
    partner_relationship: str | None = None


@router.post("/partner-profile")
async def vault_partner_profile(body: VaultPartnerProfileRequest):
    """
    Provider — Partner Profile.
    Natal ideal-partner sketch; optional synastry when second-person data exists.
    """
    try:
        return partner_profile_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            goal=body.goal,
            partner_birth_date=body.partner_birth_date,
            partner_birth_time=body.partner_birth_time,
            partner_location=body.partner_location,
            partner_latitude=body.partner_latitude,
            partner_longitude=body.partner_longitude,
            partner_relationship=body.partner_relationship,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class VaultCompatibilityRequest(VaultGhostDaysRequest):
    relationship_type: str = Field(
        default="romantic",
        pattern=r"^(romantic|marriage|business|friendship)$",
    )
    partner_birth_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    partner_birth_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    partner_location: str | None = None
    partner_latitude: float | None = None
    partner_longitude: float | None = None
    concern: str | None = None
    user_birth_time_known: bool = True
    partner_birth_time_known: bool = True


@router.post("/compatibility")
async def vault_compatibility(body: VaultCompatibilityRequest):
    """
    Provider — Compatibility.
    Synastry dimensions weighted by relationship_profile for the relationship type.
    """
    try:
        return compatibility_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            relationship_type=body.relationship_type,
            partner_birth_date=body.partner_birth_date,
            partner_birth_time=body.partner_birth_time,
            partner_location=body.partner_location,
            partner_latitude=body.partner_latitude,
            partner_longitude=body.partner_longitude,
            concern=body.concern,
            user_birth_time_known=body.user_birth_time_known,
            partner_birth_time_known=body.partner_birth_time_known,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class VaultCheatingRadarRequest(VaultCompatibilityRequest):
    pass


@router.post("/cheating-radar")
async def vault_cheating_radar(body: VaultCheatingRadarRequest):
    """
    Shadow Room — Cheating Radar.
    Synastry trust-pressure signals only — never a cheating verdict.
    """
    try:
        return cheating_radar_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            relationship_type=body.relationship_type,
            partner_birth_date=body.partner_birth_date,
            partner_birth_time=body.partner_birth_time,
            partner_location=body.partner_location,
            partner_latitude=body.partner_latitude,
            partner_longitude=body.partner_longitude,
            concern=body.concern,
            user_birth_time_known=body.user_birth_time_known,
            partner_birth_time_known=body.partner_birth_time_known,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class VaultTrustPatternsRequest(VaultCompatibilityRequest):
    pass


@router.post("/trust-patterns")
async def vault_trust_patterns(body: VaultTrustPatternsRequest):
    """
    Shadow Room — Trust Patterns.
    Moon/Mercury/Venus/Jupiter/Saturn synastry patterns — never loyalty verdicts.
    """
    try:
        return trust_patterns_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            relationship_type=body.relationship_type,
            partner_birth_date=body.partner_birth_date,
            partner_birth_time=body.partner_birth_time,
            partner_location=body.partner_location,
            partner_latitude=body.partner_latitude,
            partner_longitude=body.partner_longitude,
            concern=body.concern,
            user_birth_time_known=body.user_birth_time_known,
            partner_birth_time_known=body.partner_birth_time_known,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class VaultCommunicationRiskRequest(VaultCompatibilityRequest):
    pass


@router.post("/communication-risk")
async def vault_communication_risk(body: VaultCommunicationRiskRequest):
    """
    Shadow Room — Communication Risk.
    Mercury/Moon/Mars/Saturn/Jupiter/Venus risk bands — never lying/abuse verdicts.
    """
    try:
        return communication_risk_reading(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            location=body.location,
            lang=body.lang,
            house_system=body.house_system,
            zodiac=body.zodiac,
            latitude=body.latitude,
            longitude=body.longitude,
            relationship_type=body.relationship_type,
            partner_birth_date=body.partner_birth_date,
            partner_birth_time=body.partner_birth_time,
            partner_location=body.partner_location,
            partner_latitude=body.partner_latitude,
            partner_longitude=body.partner_longitude,
            concern=body.concern,
            user_birth_time_known=body.user_birth_time_known,
            partner_birth_time_known=body.partner_birth_time_known,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
