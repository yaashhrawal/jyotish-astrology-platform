"""
Tithi Pravesha — Lunar Return chart.
The moment in each year when Moon returns to same tithi (phase angle) as birth.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (birth_to_jd, calculate_planets, calculate_houses,
                         get_ayanamsa, tropical_to_sidereal, get_sign_and_degree, SIGNS)
import swisseph as swe
from core.engine import EPHE_FLAG

router = APIRouter()


def get_tithi_angle(jd: float, ayan: float) -> float:
    """Moon - Sun sidereal longitude (0–360), each 12° = 1 tithi."""
    sun_r, _ = swe.calc_ut(jd, swe.SUN, EPHE_FLAG)
    moon_r, _ = swe.calc_ut(jd, swe.MOON, EPHE_FLAG)
    sun_sid = (sun_r[0] - ayan) % 360
    moon_sid = (moon_r[0] - ayan) % 360
    return (moon_sid - sun_sid) % 360


def _signed_diff(target_angle: float, jd: float) -> float:
    """Signed distance (deg, -180..180) from current Moon-Sun angle to target."""
    ayan = get_ayanamsa(jd, "lahiri")
    cur = get_tithi_angle(jd, ayan)
    return ((target_angle - cur + 180) % 360) - 180


def find_tithi_return(target_angle: float, start_jd: float) -> float:
    """Next JD where Moon-Sun angle equals target_angle.
    Robust scan (0.25d) for a sign change of the signed diff, then bisection.
    Bounded to ~33 days — one lunar cycle always contains a return."""
    step = 0.25
    prev = start_jd
    prev_d = _signed_diff(target_angle, prev)
    jd = start_jd + step
    end = start_jd + 33          # a synodic cycle guarantees one crossing
    while jd <= end:
        d = _signed_diff(target_angle, jd)
        # crossing from - to + (angle catching up to target) = the return
        if prev_d <= 0 <= d and (d - prev_d) < 180:
            lo, hi = prev, jd
            for _ in range(50):
                mid = (lo + hi) / 2
                if _signed_diff(target_angle, mid) < 0:
                    lo = mid
                else:
                    hi = mid
            return (lo + hi) / 2
        prev, prev_d = jd, d
        jd += step
    return end + 1               # not found in window → caller skips


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
