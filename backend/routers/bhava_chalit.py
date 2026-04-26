"""
Bhava Chalit Chart — planets placed in houses based on cusp boundaries,
not sign-based equal house. A planet may shift house compared to Rashi chart.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter()


class BhavaChaliRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


def planet_in_chalit_house(planet_lon: float, cusps: list) -> int:
    """Find which house (1-12) a planet falls in, using cusp boundaries."""
    for i in range(12):
        cusp_start = cusps[i]
        cusp_end = cusps[(i + 1) % 12]
        # Handle wrap-around (e.g. cusp 12 → cusp 1 wraps 360→0)
        if cusp_start <= cusp_end:
            if cusp_start <= planet_lon < cusp_end:
                return i + 1
        else:  # wrap
            if planet_lon >= cusp_start or planet_lon < cusp_end:
                return i + 1
    return 1


@router.post("/bhava_chalit")
def compute_bhava_chalit(req: BhavaChaliRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)

    houses = house_data["houses"]
    asc = house_data["ascendant"]

    # Cusp longitudes in order H1..H12
    cusp_lons = [houses[i]["cusp_longitude"] for i in range(1, 13)]

    # Rashi house = equal-house sign-based (asc sign = H1)
    asc_sign_idx = asc["sign_index"]

    planet_list = []
    for name, pd in planets.items():
        lon = pd["longitude"]
        rashi_house = ((pd["sign_index"] - asc_sign_idx) % 12) + 1
        chalit_house = planet_in_chalit_house(lon, cusp_lons)
        shifted = rashi_house != chalit_house
        planet_list.append({
            "planet": name,
            "longitude": lon,
            "sign": pd["sign"],
            "degree": pd["degree"],
            "rashi_house": rashi_house,
            "chalit_house": chalit_house,
            "shifted": shifted,
            "retrograde": pd["retrograde"],
        })

    # House cusp details
    cusp_list = []
    for i in range(1, 13):
        h = houses[i]
        cusp_list.append({
            "house": i,
            "cusp_longitude": h["cusp_longitude"],
            "sign": h["sign"],
            "sign_index": h["sign_index"],
            "degree": h["degree"],
        })

    # Which planets shifted?
    shifted_planets = [p for p in planet_list if p["shifted"]]

    return {
        "ascendant": asc,
        "cusps": cusp_list,
        "planets": planet_list,
        "shifted_planets": shifted_planets,
        "shift_count": len(shifted_planets),
    }
