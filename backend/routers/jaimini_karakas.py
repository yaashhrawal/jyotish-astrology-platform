"""
Jaimini Chara Karakas — 7 grahas ranked by degree in sign (descending).
AK=Atma, AmK=Amatya, BK=Bhratri, MK=Matri, PiK=Pitri/Putra, GK=Gnati, DK=Dara.
Karakamsha = navamsha sign of Atmakaraka.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter()

KARAKA_NAMES = ["AK", "AmK", "BK", "MK", "PiK", "GK", "DK"]
KARAKA_FULL = {
    "AK":  "Atma Karaka — Soul",
    "AmK": "Amatya Karaka — Career/Minister",
    "BK":  "Bhratri Karaka — Siblings",
    "MK":  "Matri Karaka — Mother",
    "PiK": "Pitri/Putra Karaka",
    "GK":  "Gnati Karaka — Enemies/Disease",
    "DK":  "Dara Karaka — Spouse",
}


def get_navamsha_sign(longitude: float) -> str:
    sign_idx = int(longitude / 30)
    pada = int((longitude % 30) / (30 / 9))
    nav_sign_idx = (sign_idx * 9 + pada) % 12
    return SIGNS[nav_sign_idx]


class KarakaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/jaimini_karakas")
def compute_karakas(req: KarakaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]

    # 7 grahas (exclude Rahu/Ketu for Chara Karakas)
    graha_order = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    ranked = sorted(graha_order, key=lambda g: planets[g]["degree"], reverse=True)

    karakas = []
    for i, name in enumerate(ranked):
        pd = planets[name]
        k = KARAKA_NAMES[i]
        karakas.append({
            "planet": name,
            "karaka": k,
            "karaka_full": KARAKA_FULL[k],
            "degree_in_sign": round(pd["degree"], 4),
            "sign": pd["sign"],
            "longitude": pd["longitude"],
            "navamsha_sign": get_navamsha_sign(pd["longitude"]),
        })

    ak = karakas[0]
    karakamsha_sign = ak["navamsha_sign"]
    karakamsha_idx = SIGNS.index(karakamsha_sign)
    asc_sign_idx = asc["sign_index"]
    karakamsha_house = (karakamsha_idx - asc_sign_idx) % 12 + 1

    planets_in_karakamsha = [
        n for n, pd in planets.items()
        if (pd["sign_index"] - asc_sign_idx) % 12 + 1 == karakamsha_house
    ]

    return {
        "karakas": karakas,
        "atmakaraka": ak["planet"],
        "karakamsha_sign": karakamsha_sign,
        "karakamsha_house": karakamsha_house,
        "swamsha": karakamsha_sign == asc["sign"],
        "planets_in_karakamsha": planets_in_karakamsha,
        "ascendant": asc,
    }
