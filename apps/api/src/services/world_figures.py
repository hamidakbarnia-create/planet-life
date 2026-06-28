"""Per-figure astrology: current transits to a public figure's natal chart.

The World "Sky & Power" search was returning the same global sky for everyone.
This module fixes that by holding a curated birth-data table for well-known
figures and computing the *current transits to that person's natal chart* — so
Trump and Musk get genuinely different, specific readings.

Birth times are public-record where confident (time_known=True) and set to noon
otherwise (time_known=False) — in that case house/angle-sensitive points are
skipped and only transit-to-planet aspects are used, which stay valid.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from services.chart_data import build_chart_payload

# name -> birth data. lat,lon stored directly to avoid geocoding name strings.
# aliases lets "trump", "donald trump", "president trump" all match.
FIGURES: list[dict[str, Any]] = [
    {"key": "trump", "name": "Donald Trump", "aliases": ["trump", "donald trump", "ترامپ", "ترمب", "трамп", "дональд трамп"], "role": "politician",
     "date": "1946-06-14", "time": "10:54", "time_known": True, "loc": "40.70,-73.80"},
    {"key": "musk", "name": "Elon Musk", "aliases": ["musk", "elon", "elon musk", "ماسک", "ايلون ماسك", "إيلون ماسك", "маск", "илон маск"], "role": "founder",
     "date": "1971-06-28", "time": "07:30", "time_known": False, "loc": "-25.75,28.19"},
    {"key": "putin", "name": "Vladimir Putin", "aliases": ["putin", "vladimir putin", "پوتین", "بوتين", "путин", "владимир путин"], "role": "politician",
     "date": "1952-10-07", "time": "09:30", "time_known": False, "loc": "59.93,30.34"},
    {"key": "biden", "name": "Joe Biden", "aliases": ["biden", "joe biden", "بایدن", "بايدن", "байден", "джо байден"], "role": "politician",
     "date": "1942-11-20", "time": "08:30", "time_known": True, "loc": "41.41,-75.66"},
    {"key": "xi", "name": "Xi Jinping", "aliases": ["xi", "xi jinping", "jinping", "شی جین پینگ", "شي جين بينغ", "си цзиньпин"], "role": "politician",
     "date": "1953-06-15", "time": "12:00", "time_known": False, "loc": "39.90,116.40"},
    {"key": "netanyahu", "name": "Benjamin Netanyahu", "aliases": ["netanyahu", "bibi", "benjamin netanyahu", "نتانیاهو", "نتنياهو", "нетаньяху"], "role": "politician",
     "date": "1949-10-21", "time": "12:00", "time_known": False, "loc": "32.07,34.78"},
    {"key": "harris", "name": "Kamala Harris", "aliases": ["harris", "kamala", "kamala harris", "هریس", "کامالا", "هاريس", "харрис"], "role": "politician",
     "date": "1964-10-20", "time": "21:28", "time_known": True, "loc": "37.80,-122.27"},
    {"key": "zelensky", "name": "Volodymyr Zelensky", "aliases": ["zelensky", "zelenskyy", "volodymyr zelensky", "زلنسکی", "زيلينسكي", "зеленский"], "role": "politician",
     "date": "1978-01-25", "time": "12:00", "time_known": False, "loc": "47.91,33.39"},
    {"key": "modi", "name": "Narendra Modi", "aliases": ["modi", "narendra modi", "مودی", "مودي", "моди"], "role": "politician",
     "date": "1950-09-17", "time": "12:00", "time_known": False, "loc": "23.78,72.63"},
    {"key": "erdogan", "name": "Recep Tayyip Erdogan", "aliases": ["erdogan", "erdoğan", "recep erdogan", "اردوغان", "أردوغان", "эрдоган"], "role": "politician",
     "date": "1954-02-26", "time": "12:00", "time_known": False, "loc": "41.01,28.98"},
    {"key": "macron", "name": "Emmanuel Macron", "aliases": ["macron", "emmanuel macron", "مکرون", "ماكرون", "макрон"], "role": "politician",
     "date": "1977-12-21", "time": "10:40", "time_known": False, "loc": "49.89,2.30"},
    {"key": "mbs", "name": "Mohammed bin Salman", "aliases": ["mbs", "bin salman", "mohammed bin salman", "salman", "بن سلمان", "محمد بن سلمان", "бин салман"], "role": "politician",
     "date": "1985-08-31", "time": "12:00", "time_known": False, "loc": "24.71,46.68"},
    {"key": "khamenei", "name": "Ali Khamenei", "aliases": ["khamenei", "ali khamenei", "خامنه‌ای", "خامنه ای", "خامنئي", "хаменеи"], "role": "politician",
     "date": "1939-04-19", "time": "12:00", "time_known": False, "loc": "36.30,59.61"},
    {"key": "bezos", "name": "Jeff Bezos", "aliases": ["bezos", "jeff bezos", "بزوس", "بيزوس", "безос"], "role": "founder",
     "date": "1964-01-12", "time": "12:00", "time_known": False, "loc": "35.08,-106.65"},
    {"key": "zuckerberg", "name": "Mark Zuckerberg", "aliases": ["zuckerberg", "zuck", "mark zuckerberg", "زاکربرگ", "زوكربيرغ", "цукерберг"], "role": "founder",
     "date": "1984-05-14", "time": "14:45", "time_known": False, "loc": "41.03,-73.76"},
    {"key": "ronaldo", "name": "Cristiano Ronaldo", "aliases": ["ronaldo", "cristiano", "cristiano ronaldo", "cr7", "رونالدو", "роналду", "роналдо"], "role": "athlete",
     "date": "1985-02-05", "time": "05:25", "time_known": False, "loc": "32.66,-16.92"},
    {"key": "messi", "name": "Lionel Messi", "aliases": ["messi", "lionel messi", "leo messi", "مسی", "ميسي", "месси"], "role": "athlete",
     "date": "1987-06-24", "time": "12:00", "time_known": False, "loc": "-32.95,-60.66"},
    {"key": "swift", "name": "Taylor Swift", "aliases": ["taylor swift", "taylor", "swift", "تیلور سویفت", "تايلور سويفت", "тейлор свифт"], "role": "star",
     "date": "1989-12-13", "time": "05:17", "time_known": False, "loc": "40.33,-75.93"},
]

# Aspects checked between transiting and natal planets.
ASPECTS = {"conjunction": 0.0, "sextile": 60.0, "square": 90.0, "trine": 120.0, "opposition": 180.0}
HARD = {"conjunction", "square", "opposition"}
SOFT = {"trine", "sextile"}
TRANSIT_ORB = 3.0

# Slow transiting bodies create the meaningful, lasting pressure on a chart.
TRANSIT_BODIES = ("jupiter", "saturn", "uranus", "neptune", "pluto", "mars")
# Natal points that carry personal meaning (Moon/houses skipped if time unknown).
NATAL_BODIES = ("sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn")
TIME_SENSITIVE = {"moon"}

# Each transiting planet contributes a theme keyword (localized on the frontend).
TRANSIT_TOPIC = {
    "saturn": "discipline_tests",
    "jupiter": "growth_luck",
    "pluto": "power_transformation",
    "uranus": "disruption_change",
    "neptune": "vision_or_fog",
    "mars": "drive_conflict",
}
MALEFIC = {"saturn", "mars", "pluto"}
BENEFIC = {"jupiter", "venus"}


def _norm(d: float) -> float:
    return d % 360.0


def _sep(a: float, b: float) -> float:
    diff = abs(_norm(a) - _norm(b))
    return min(diff, 360.0 - diff)


def _match(sep: float) -> tuple[str, float] | None:
    best: tuple[str, float] | None = None
    for name, exact in ASPECTS.items():
        orb = abs(sep - exact)
        if orb <= TRANSIT_ORB and (best is None or orb < best[1]):
            best = (name, orb)
    return best


def find_figure(query: str) -> dict[str, Any] | None:
    q = (query or "").strip().lower()
    if len(q) < 2:
        return None
    # Exact alias / key match first (handles short ones like "xi", "cr7").
    for fig in FIGURES:
        if q == fig["key"] or q in fig["aliases"]:
            return fig
    # Then fuzzy substring, but only for aliases long enough to be safe.
    for fig in FIGURES:
        for alias in fig["aliases"]:
            if len(alias) >= 4 and (alias in q or q in alias):
                return fig
    return None


def _tone(aspect: str, transit_planet: str) -> str:
    if transit_planet in BENEFIC:
        return "supportive" if aspect in SOFT or aspect == "conjunction" else "context"
    if transit_planet in MALEFIC:
        return "tension" if aspect in HARD else "context"
    return "context"  # uranus / neptune — ambivalent


def figure_reading(query: str, *, target_date: str | None = None) -> dict[str, Any]:
    fig = find_figure(query)
    if not fig:
        return {"found": False, "query": query}

    td = target_date or date.today().isoformat()
    natal, transit = build_chart_payload(
        birth_date=fig["date"],
        birth_time=fig["time"],
        location=fig["loc"],
        target_date=td,
    )
    natal_planets = natal.get("planets", {})
    transit_planets = transit.get("planets", {})

    signals: list[dict[str, Any]] = []
    for tp in TRANSIT_BODIES:
        tbody = transit_planets.get(tp)
        if not tbody:
            continue
        for npl in NATAL_BODIES:
            if npl in TIME_SENSITIVE and not fig["time_known"]:
                continue
            nbody = natal_planets.get(npl)
            if not nbody:
                continue
            m = _match(_sep(float(tbody["longitude"]), float(nbody["longitude"])))
            if not m:
                continue
            aspect, orb = m
            signals.append(
                {
                    "kind": "transit",
                    "transit_planet": tp,
                    "natal_planet": npl,
                    "aspect": aspect,
                    "orb": round(orb, 2),
                    "tone": _tone(aspect, tp),
                    "topic": TRANSIT_TOPIC.get(tp, "power_transformation"),
                }
            )

    signals.sort(key=lambda x: x["orb"])
    return {
        "found": True,
        "name": fig["name"],
        "role": fig["role"],
        "time_known": fig["time_known"],
        "signals": signals[:5],
    }
