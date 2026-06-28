"""One-off audit script for Rafsanjan reference case vs Astro-Seek."""
import sys
from datetime import timezone

sys.path.insert(0, r"C:\planet-life\apps\api\src")
sys.path.insert(0, r"C:\planet-life")

import swisseph as swe
from services.chart_data import resolve_coordinates, _timezone_at, _local_datetime

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

ASTRO_SEEK = {
    "sun": (330 + 6 + 8/60, False),
    "moon": (330 + 20 + 59/60, False),
    "mercury": (300 + 9 + 19/60, False),
    "venus": (270 + 27 + 2/60, False),
    "mars": (180 + 19 + 3/60, True),
    "jupiter": (210 + 10 + 19/60, True),
    "saturn": (180 + 21 + 42/60, True),
    "uranus": (240 + 4 + 33/60, False),
    "neptune": (240 + 26 + 44/60, False),
    "pluto": (180 + 26 + 43/60, True),
    "north_node": (90 + 20 + 16/60, False),
    "ascendant": (300 + 24 + 36/60, False),
    "midheaven": (240 + 6 + 43/60, False),
}

def fmt_lon(lon: float) -> str:
    sign = SIGNS[int(lon // 30) % 12]
    d = lon % 30
    deg = int(d)
    minute = int(round((d - deg) * 60))
    if minute == 60:
        deg += 1
        minute = 0
    return f"{deg}°{minute:02d}' {sign} ({lon:.4f}°)"


def main():
    birth_date = "1982-02-25"
    birth_time = "05:47"
    location = "Rafsanjan"

    lat, lon = resolve_coordinates(location)
    tz_name = _timezone_at(lat, lon)
    natal_dt = _local_datetime(birth_date, birth_time, lat, lon)
    dt_utc = natal_dt.astimezone(timezone.utc)
    jd = swe.julday(
        dt_utc.year, dt_utc.month, dt_utc.day,
        dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0,
        swe.GREG_CAL,
    )

    print("=== LOCATION ===")
    print(f"location string: {location!r}")
    print(f"lat: {lat:.6f}  (expected ~30.35)")
    print(f"lon: {lon:.6f}  (expected ~56.00)")
    print(f"timezone: {tz_name}  (expected Asia/Tehran)")
    print(f"local: {natal_dt.isoformat()}")
    print(f"utc:   {dt_utc.isoformat()}  (Astro-Seek: 1982-02-25 02:17 UTC)")
    print(f"utc offset: {natal_dt.strftime('%z')}")
    print(f"JD UT: {jd:.8f}")

    houses_data = swe.houses(jd, lat, lon, b"P")
    cusps = houses_data[0]
    ascmc = houses_data[1]

    cusp_list = [float(cusps[i]) for i in range(len(cusps))]

    print("\n=== HOUSE CUSPS ===")
    print(f"pyswisseph cusps length: {len(cusps)}")
    print(f"H1 cusp[0]: {fmt_lon(cusp_list[0])}")
    print(f"ASC from ascmc: {fmt_lon(float(ascmc[0]))}")
    print(f"Match H1==ASC: {abs(cusp_list[0] - float(ascmc[0])) < 0.001}")

    bodies = [
        (swe.SUN, "sun"), (swe.MOON, "moon"), (swe.MERCURY, "mercury"),
        (swe.VENUS, "venus"), (swe.MARS, "mars"), (swe.JUPITER, "jupiter"),
        (swe.SATURN, "saturn"), (swe.URANUS, "uranus"), (swe.NEPTUNE, "neptune"),
        (swe.PLUTO, "pluto"), (swe.TRUE_NODE, "north_node"),
    ]

    print("\n=== PLANET COMPARISON ===")
    print(f"{'Body':12} {'Planet Life':28} {'Astro-Seek':28} {'Diff(arcmin)':>12} {'PASS'}")
    print("-" * 90)

    computed = {
        "ascendant": float(ascmc[0]),
        "midheaven": float(ascmc[1]),
    }

    for pid, name in bodies:
        r, _ = swe.calc_ut(jd, pid, swe.FLG_MOSEPH | swe.FLG_SPEED)
        lng = float(r[0])
        spd = float(r[3])
        computed[name] = lng
        ref, _ = ASTRO_SEEK[name]
        diff_arcmin = abs(lng - ref) * 60
        ok = diff_arcmin < 2
        print(f"{name:12} {fmt_lon(lng):28} {fmt_lon(ref):28} {diff_arcmin:12.2f} {'PASS' if ok else 'FAIL'}")

    for key in ("ascendant", "midheaven"):
        lng = computed[key]
        ref, _ = ASTRO_SEEK[key]
        diff_arcmin = abs(lng - ref) * 60
        ok = diff_arcmin < 2
        print(f"{key:12} {fmt_lon(lng):28} {fmt_lon(ref):28} {diff_arcmin:12.2f} {'PASS' if ok else 'FAIL'}")

    # Exact coords from Astro-Seek
    print("\n=== WITH EXACT ASTRO-SEEK COORDS 30.35, 56.0 ===")
    lat2, lon2 = 30.35, 56.0
    natal_dt2 = _local_datetime(birth_date, birth_time, lat2, lon2)
    dt_utc2 = natal_dt2.astimezone(timezone.utc)
    jd2 = swe.julday(
        dt_utc2.year, dt_utc2.month, dt_utc2.day,
        dt_utc2.hour + dt_utc2.minute / 60.0,
        swe.GREG_CAL,
    )
    print(f"local: {natal_dt2.isoformat()} utc: {dt_utc2.isoformat()}")
    ascmc2 = swe.houses(jd2, lat2, lon2, b"P")[1]
    print(f"ASC: {fmt_lon(float(ascmc2[0]))}")
    print(f"MC:  {fmt_lon(float(ascmc2[1]))}")


if __name__ == "__main__":
    main()
