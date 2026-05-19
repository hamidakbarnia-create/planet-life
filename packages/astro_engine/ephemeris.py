import swisseph as swe
from datetime import datetime
from timezonefinder import TimezoneFinder
from geopy.geocoders import Nominatim
import pytz

swe.set_ephe_path(None)

PLANETS = {
    "sun":     swe.SUN,
    "moon":    swe.MOON,
    "mercury": swe.MERCURY,
    "venus":   swe.VENUS,
    "mars":    swe.MARS,
    "jupiter": swe.JUPITER,
    "saturn":  swe.SATURN,
    "uranus":  swe.URANUS,
    "neptune": swe.NEPTUNE,
    "pluto":   swe.PLUTO,
}

HOUSE_SYSTEMS = b'P'  # Placidus


def location_to_coords(location: str) -> tuple[float, float]:
    geolocator = Nominatim(user_agent="planet_life")
    loc = geolocator.geocode(location)
    if not loc:
        raise ValueError(f"Location not found: {location}")
    return loc.latitude, loc.longitude


def datetime_to_julian(dt: datetime) -> float:
    return swe.julday(dt.year, dt.month, dt.day,
                      dt.hour + dt.minute / 60.0 + dt.second / 3600.0)


def get_planet_positions(jd: float, lat: float, lon: float) -> dict:
    positions = {}
    cusps, ascmc = swe.houses(jd, lat, lon, HOUSE_SYSTEMS)

    for name, planet_id in PLANETS.items():
        result, _ = swe.calc_ut(jd, planet_id)
        longitude = result[0]
        speed = result[3]
        retrograde = speed < 0

        house = 1
        for i in range(11):
            cusp_start = cusps[i]
            cusp_end = cusps[(i + 1) % 12]
            if cusp_start <= longitude < cusp_end:
                house = i + 1
                break

        positions[name] = {
            "longitude": round(longitude, 4),
            "house": house,
            "retrograde": retrograde,
            "speed": round(speed, 4),
        }

    return positions


def get_chart(date_str: str, time_str: str, location: str) -> dict:
    lat, lon = location_to_coords(location)

    tf = TimezoneFinder()
    tz_name = tf.timezone_at(lat=lat, lng=lon)
    tz = pytz.timezone(tz_name)

    naive_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    local_dt = tz.localize(naive_dt)
    utc_dt = local_dt.astimezone(pytz.utc)

    jd = datetime_to_julian(utc_dt)
    planets = get_planet_positions(jd, lat, lon)

    return {
        "planets": planets,
        "julian_day": jd,
        "location": {"lat": lat, "lon": lon, "timezone": tz_name},
    }