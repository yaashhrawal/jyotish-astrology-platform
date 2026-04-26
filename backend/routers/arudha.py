"""
Arudha Lagnas (A1-A12) + Upapada Lagna (UL) + Special Lagnas.
Jaimini system: Arudha = mirror of house lord from the house.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, SIGNS
)

router = APIRouter()

SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

HOUSE_NAMES = {
    1: "Arudha Lagna (AL)", 2: "Dhana Pada (A2)", 3: "Vikrama Pada (A3)",
    4: "Matri Pada (A4)", 5: "Putra Pada (A5)", 6: "Shatru Pada (A6)",
    7: "Dara Pada (A7)", 8: "Mrityu Pada (A8)", 9: "Pitri Pada (A9)",
    10: "Rajya Pada (A10)", 11: "Labha Pada (A11)", 12: "Vyaya Pada (A12)",
}

ARUDHA_CODES = {1:"AL", 2:"A2", 3:"A3", 4:"A4", 5:"A5", 6:"A6",
                7:"A7", 8:"A8", 9:"A9", 10:"A10", 11:"A11", 12:"A12"}


def compute_arudha(house_num: int, asc_sign_idx: int, planets: dict) -> dict:
    """
    Arudha of house H:
    1. Find sign of house H (= asc + H - 1 mod 12)
    2. Find lord of that sign
    3. Count how many signs lord is from house H
    4. Count same number from lord's position → Arudha
    Special rule: if Arudha falls in same house or 7th from it, move 10 signs forward.
    """
    house_sign_idx = (asc_sign_idx + house_num - 1) % 12
    house_sign = SIGNS[house_sign_idx]
    lord_name = SIGN_LORDS[house_sign]

    # Lord's sign index
    lord_data = planets.get(lord_name)
    if not lord_data:
        return {"sign": house_sign, "sign_index": house_sign_idx, "house": house_num, "lord": lord_name}

    lord_sign_idx = lord_data["sign_index"]

    # Count signs from house to lord
    signs_from_house = (lord_sign_idx - house_sign_idx) % 12
    if signs_from_house == 0:
        signs_from_house = 12

    # Arudha = same count from lord
    arudha_sign_idx = (lord_sign_idx + signs_from_house - 1) % 12

    # Special rule: if Arudha = house sign or 7th from house sign
    if arudha_sign_idx == house_sign_idx or arudha_sign_idx == (house_sign_idx + 6) % 12:
        arudha_sign_idx = (arudha_sign_idx + 9) % 12  # move 10 signs (=+9 mod 12)

    arudha_sign = SIGNS[arudha_sign_idx]
    arudha_house = (arudha_sign_idx - asc_sign_idx) % 12 + 1

    # Planets in arudha sign
    planets_here = [name for name, pd in planets.items() if pd["sign_index"] == arudha_sign_idx]

    return {
        "house": house_num,
        "code": ARUDHA_CODES[house_num],
        "name": HOUSE_NAMES[house_num],
        "sign": arudha_sign,
        "sign_index": arudha_sign_idx,
        "bhava": arudha_house,
        "lord": lord_name,
        "lord_sign": lord_data["sign"],
        "planets_here": planets_here,
    }


def compute_special_lagnas(jd: float, lat: float, lon: float, ayanamsa: str, planets: dict, asc_sign_idx: int) -> dict:
    """
    Hora Lagna, Ghati Lagna, Brahma Lagna, Varnada Lagna.
    """
    import swisseph as swe

    # Hora Lagna: advances 1 sign per hour from sunrise
    # Simplified: calculate sunrise JD
    # Use SWE rise/set
    try:
        r = swe.rise_trans(jd - 0.5, swe.SUN, swe.CALC_RISE, (lon, lat, 0), 1013.25, 15)
        sunrise_jd = r[1][0] if r[0] == 0 else jd - 0.25
    except:
        sunrise_jd = jd - 0.25

    hours_from_sunrise = (jd - sunrise_jd) * 24
    hora_lagna_idx = (asc_sign_idx + int(hours_from_sunrise)) % 12
    hora_lagna = SIGNS[hora_lagna_idx]

    # Ghati Lagna: advances 1 sign per 5 ghatis (2h) from sunrise
    ghati_lagna_idx = (asc_sign_idx + int(hours_from_sunrise / 2)) % 12
    ghati_lagna = SIGNS[ghati_lagna_idx]

    # Varnada Lagna: derived from Hora Lagna and Lagna
    # Count from Lagna to Hora Lagna, apply same from Hora Lagna
    count = (hora_lagna_idx - asc_sign_idx) % 12
    varnada_idx = (hora_lagna_idx + count) % 12
    varnada = SIGNS[varnada_idx]

    return {
        "hora_lagna": {"sign": hora_lagna, "sign_index": hora_lagna_idx},
        "ghati_lagna": {"sign": ghati_lagna, "sign_index": ghati_lagna_idx},
        "varnada_lagna": {"sign": varnada, "sign_index": varnada_idx},
    }


class ArudhaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/arudha")
def compute_arudhas(req: ArudhaRequest):
    import swisseph as swe
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc["sign_index"]
    planet_house_map = assign_planets_to_houses(planets, asc_idx)

    # Compute all 12 Arudha Lagnas
    arudhas = []
    for h in range(1, 13):
        arudhas.append(compute_arudha(h, asc_idx, planets))

    # Upapada Lagna = A12 (Arudha of 12th house) — special significance for marriage
    upapada = compute_arudha(12, asc_idx, planets)
    upapada["name"] = "Upapada Lagna (UL)"

    # Special lagnas
    special = compute_special_lagnas(jd, req.latitude, req.longitude, req.ayanamsa, planets, asc_idx)

    # Planet positions with house
    planets_list = []
    for name, pd in planets.items():
        h = pd.get("house", ((pd["sign_index"] - asc_idx) % 12) + 1)
        planets_list.append({
            "name": name, "sign": pd["sign"], "sign_index": pd["sign_index"],
            "degree": round(pd["degree"], 2), "house": h,
        })

    return {
        "ascendant": asc,
        "arudhas": arudhas,
        "upapada": upapada,
        "special_lagnas": special,
        "planets": planets_list,
    }
