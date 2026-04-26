"""
Transit Hit List — exact dates when transiting planets cross natal planet/lagna degrees.
Shows ingress dates for current + next N months.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, get_ayanamsa, SIGNS
import swisseph as swe
from datetime import datetime, timedelta

router = APIRouter()

PLANET_IDS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mars": swe.MARS,
    "Mercury": swe.MERCURY, "Jupiter": swe.JUPITER, "Venus": swe.VENUS,
    "Saturn": swe.SATURN, "Rahu": swe.MEAN_NODE,
}

PLANET_SPEEDS = {  # avg degrees/day for initial step
    "Sun": 1.0, "Moon": 13.0, "Mars": 0.5, "Mercury": 1.2,
    "Jupiter": 0.08, "Venus": 1.0, "Saturn": 0.03, "Rahu": -0.053,
}


def get_transit_lon(planet_id: int, jd: float, ayan: float, is_rahu: bool = False) -> float:
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    result, _ = swe.calc_ut(jd, planet_id, flags)
    trop = result[0]
    if is_rahu:
        trop = (trop + 180) % 360  # Ketu from Rahu
    return (trop - ayan) % 360


def find_exact_hit(planet_name: str, target_lon: float, start_jd: float,
                   ayan_birth: float, months: int = 18) -> list:
    """Find all dates when planet crosses target_lon within next `months` months."""
    hits = []
    pid = PLANET_IDS.get(planet_name)
    if pid is None:
        return hits

    end_jd = start_jd + months * 30.44
    step = max(0.5, 30.44 / abs(PLANET_SPEEDS.get(planet_name, 1.0)) / 60)
    step = min(step, 1.0)

    jd = start_jd
    prev_lon = None
    prev_jd = jd

    while jd < end_jd:
        ayan = get_ayanamsa(jd, "lahiri")
        cur_lon = get_transit_lon(pid, jd, ayan)

        if prev_lon is not None:
            # Check if we crossed target
            diff_prev = (target_lon - prev_lon + 360) % 360
            diff_cur = (target_lon - cur_lon + 360) % 360

            # Crossed if diff went from small positive to near 360 (or vice versa)
            if diff_prev < 5 and diff_cur > 355:
                # Refine with bisection
                lo, hi = prev_jd, jd
                for _ in range(30):
                    mid = (lo + hi) / 2
                    ayan_mid = get_ayanamsa(mid, "lahiri")
                    mid_lon = get_transit_lon(pid, mid, ayan_mid)
                    d = (target_lon - mid_lon + 360) % 360
                    if d < 180:
                        hi = mid
                    else:
                        lo = mid
                exact_jd = (lo + hi) / 2
                dt = swe.revjul(exact_jd)
                hits.append({
                    "date": f"{int(dt[0])}-{int(dt[1]):02d}-{int(dt[2]):02d}",
                    "jd": round(exact_jd, 4),
                    "direction": "direct",
                })
            elif diff_prev > 355 and diff_cur < 5:
                lo, hi = prev_jd, jd
                for _ in range(30):
                    mid = (lo + hi) / 2
                    ayan_mid = get_ayanamsa(mid, "lahiri")
                    mid_lon = get_transit_lon(pid, mid, ayan_mid)
                    d = (target_lon - mid_lon + 360) % 360
                    if d > 180:
                        hi = mid
                    else:
                        lo = mid
                exact_jd = (lo + hi) / 2
                dt = swe.revjul(exact_jd)
                hits.append({
                    "date": f"{int(dt[0])}-{int(dt[1]):02d}-{int(dt[2]):02d}",
                    "jd": round(exact_jd, 4),
                    "direction": "retrograde",
                })

        prev_lon = cur_lon
        prev_jd = jd
        jd += step

    return hits[:6]  # cap at 6 hits per combo


class TransitHitRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    months_ahead: int = 12
    transit_planets: list[str] = ["Jupiter", "Saturn", "Rahu"]


@router.post("/transit_hits")
def compute_transit_hits(req: TransitHitRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    natal = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]

    # Build natal targets: all planets + ascendant
    targets = {}
    for name, pd in natal.items():
        targets[name] = pd["longitude"]
    targets["Ascendant"] = asc["longitude"]

    now = datetime.utcnow()
    now_jd = swe.julday(now.year, now.month, now.day, now.hour + now.minute/60)

    results = []
    transit_planets = [p for p in req.transit_planets if p in PLANET_IDS]

    for t_planet in transit_planets:
        for natal_point, natal_lon in targets.items():
            hits = find_exact_hit(t_planet, natal_lon, now_jd,
                                  get_ayanamsa(jd, req.ayanamsa),
                                  req.months_ahead)
            if hits:
                for h in hits:
                    results.append({
                        "transit_planet": t_planet,
                        "natal_point": natal_point,
                        "natal_sign": natal[natal_point]["sign"] if natal_point in natal else asc["sign"],
                        "natal_degree": round(natal_lon % 30, 2),
                        "natal_longitude": round(natal_lon, 4),
                        "date": h["date"],
                        "direction": h["direction"],
                        "jd": h["jd"],
                    })

    # Sort by date
    results.sort(key=lambda x: x["jd"])

    # Group by date
    by_date: dict = {}
    for r in results:
        by_date.setdefault(r["date"], []).append(r)

    return {
        "natal_ascendant": asc,
        "transit_planets": transit_planets,
        "hits": results,
        "hits_by_date": [{"date": d, "events": evts} for d, evts in sorted(by_date.items())],
        "total": len(results),
        "months_ahead": req.months_ahead,
    }
