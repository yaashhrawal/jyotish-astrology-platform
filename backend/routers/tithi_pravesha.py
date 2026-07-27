"""
Tithi Pravesha — Lunar Return chart.
The moment in each year when Moon returns to same tithi (phase angle) as birth.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (birth_to_jd, calculate_planets, calculate_houses,
                         get_ayanamsa, tropical_to_sidereal, get_sign_and_degree, SIGNS)
import swisseph as swe

router = APIRouter()


def get_tithi_angle(jd: float, ayan: float) -> float:
    """Moon - Sun sidereal longitude (0–360), each 12° = 1 tithi."""
    sun_r, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_MOSEPH)
    moon_r, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_MOSEPH)
    sun_sid = (sun_r[0] - ayan) % 360
    moon_sid = (moon_r[0] - ayan) % 360
    return (moon_sid - sun_sid) % 360


def find_tithi_return(target_angle: float, start_jd: float) -> float:
    """Find next JD when Moon-Sun angle equals target_angle."""
    jd = start_jd
    step = 0.5
    for _ in range(100):
        ayan = get_ayanamsa(jd, "lahiri")
        cur = get_tithi_angle(jd, ayan)
        diff = (target_angle - cur + 360) % 360
        if diff < 0.01:
            break
        # Refine: Moon moves ~13°/day, Sun ~1°/day → net ~12°/day
        jd += diff / 12.0
    # Bisect for precision
    lo, hi = jd - 0.1, jd + 0.1
    for _ in range(40):
        mid = (lo + hi) / 2
        ayan_mid = get_ayanamsa(mid, "lahiri")
        cur = get_tithi_angle(mid, ayan_mid)
        diff = (target_angle - cur + 360) % 360
        if diff < 180:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


TITHI_NAMES = [
    "Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya",
]

PAKSHA = ["Shukla", "Krishna"]


def get_tithi_name(angle: float) -> dict:
    tithi_num = int(angle / 12)  # 0-29
    paksha = "Shukla" if tithi_num < 15 else "Krishna"
    tithi_in_paksha = tithi_num % 15
    name = TITHI_NAMES[tithi_in_paksha]
    return {"tithi_num": tithi_num + 1, "name": name, "paksha": paksha, "angle": round(angle, 4)}


class TithiRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    return_year: int = 0  # 0 = current year's return


@router.post("/tithi_pravesha")
def compute_tithi_pravesha(req: TithiRequest):
    birth_jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    ayan_birth = get_ayanamsa(birth_jd, req.ayanamsa)
    natal_angle = get_tithi_angle(birth_jd, ayan_birth)
    natal_tithi = get_tithi_name(natal_angle)

    natal_planets = calculate_planets(birth_jd, req.ayanamsa)
    natal_asc = calculate_houses(birth_jd, req.latitude, req.longitude, req.ayanamsa)["ascendant"]

    # Find return for target year (default: current or next occurrence)
    import datetime
    now = datetime.datetime.utcnow()
    target_year = req.return_year if req.return_year > 0 else now.year

    # Search from Jan 1 of target year
    search_start_jd = swe.julday(target_year, 1, 1, 0)
    search_end_jd = swe.julday(target_year + 1, 1, 1, 0)

    # Find all occurrences in the year (tithi repeats ~every 29.5 days)
    returns = []
    jd = search_start_jd
    while jd < search_end_jd:
        ret_jd = find_tithi_return(natal_angle, jd)
        if ret_jd > search_end_jd:
            break
        returns.append(ret_jd)
        jd = ret_jd + 25  # skip ahead ~25 days to find next

    if not returns:
        return {"error": "No tithi pravesha found in target year"}

    # Use closest to birth anniversary
    birth_anniversary_jd = swe.julday(target_year, req.month, req.day, 12)
    ret_jd = min(returns, key=lambda j: abs(j - birth_anniversary_jd))

    dt = swe.revjul(ret_jd)
    ret_datetime = f"{int(dt[0])}-{int(dt[1]):02d}-{int(dt[2]):02d} {int(dt[3]):02d}:{int((dt[3]%1)*60):02d} UTC"

    ret_planets = calculate_planets(ret_jd, req.ayanamsa)
    ret_houses = calculate_houses(ret_jd, req.latitude, req.longitude, req.ayanamsa)
    ret_asc = ret_houses["ascendant"]
    ret_asc_idx = ret_asc["sign_index"]

    planets_list = []
    for name, pd in ret_planets.items():
        natal_pd = natal_planets.get(name, {})
        house = (pd["sign_index"] - ret_asc_idx) % 12 + 1
        planets_list.append({
            "name": name, "sign": pd["sign"], "degree": round(pd["degree"], 2),
            "house": house, "retrograde": pd.get("retrograde", False),
            "natal_sign": natal_pd.get("sign", ""),
        })

    planet_house_map: dict = {}
    for p in planets_list:
        planet_house_map.setdefault(p["house"], []).append(p["name"])

    return {
        "natal_tithi": natal_tithi,
        "return_datetime": ret_datetime,
        "return_jd": round(ret_jd, 4),
        "target_year": target_year,
        "return_ascendant": ret_asc,
        "natal_ascendant": natal_asc,
        "planets": planets_list,
        "planet_house_map": planet_house_map,
        "all_returns_in_year": len(returns),
    }
