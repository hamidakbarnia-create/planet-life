"""Vault reading service — chart → rules → templates."""

from __future__ import annotations

from datetime import date

from services.chart_data import build_chart_payload, _import_swisseph, _local_datetime, resolve_coordinates
from packages.astro_engine.vault_rules import build_mars_verdict, verdict_to_dict
from packages.astro_engine.vault_templates import render_mars_reading


def _lilith_longitude(birth_date: str, birth_time: str, location: str) -> float:
    """Mean Black Moon Lilith longitude at birth."""
    swe = _import_swisseph()
    lat, lon = resolve_coordinates(location)
    dt = _local_datetime(birth_date, birth_time, lat, lon)
    jd = swe.julday(
        dt.year, dt.month, dt.day,
        dt.hour + dt.minute / 60.0,
        swe.GREG_CAL,
    )
    result, _ = swe.calc_ut(jd, swe.MEAN_APOG, swe.FLG_MOSEPH)
    return float(result[0])


def mars_reading(
    *,
    birth_date: str,
    birth_time: str,
    location: str,
    lang: str = "en",
    house_system: str = "placidus",
    zodiac: str = "tropical",
) -> dict:
    """Full Mars reading for Vault Sensuality card."""
    today = date.today().isoformat()
    natal, _transit = build_chart_payload(
        birth_date=birth_date,
        birth_time=birth_time,
        location=location,
        target_date=today,
        target_time=birth_time,
        house_system=house_system,
        zodiac=zodiac,
    )
    lilith_lon = _lilith_longitude(birth_date, birth_time, location)
    verdict = build_mars_verdict(natal.get("planets", {}), lilith_lon=lilith_lon)
    vdict = verdict_to_dict(verdict)
    text = render_mars_reading(vdict, lang=lang)
    return {
        "planet": "mars",
        "lang": lang,
        "verdict": vdict,
        "reading": text,
    }
