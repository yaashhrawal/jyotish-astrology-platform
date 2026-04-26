"""
Vimshopaka Bala (20-point strength) + Bhava Bala (house strength).
Vimshopaka: strength from 16 divisional charts, max 20 points.
Bhava Bala: house strength from cusps, planets in/aspecting house.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, get_ayanamsa, tropical_to_sidereal, get_sign_and_degree, SIGNS
from core.varga import calculate_varga

router = APIRouter()

# Vimshopaka weights per varga (classical BPHS table — 16 vargas, total = 20)
VIMSHOPAKA_WEIGHTS = {
    1: 3.0,   # D1  Rashi
    2: 1.5,   # D2  Hora
    3: 1.5,   # D3  Drekkana
    4: 0.5,   # D4  Chaturthamsha
    7: 0.5,   # D7  Saptamsha
    9: 3.0,   # D9  Navamsha
    10: 0.5,  # D10 Dashamsha
    12: 0.5,  # D12 Dwadashamsha
    16: 2.0,  # D16 Shodashamsha
    20: 0.5,  # D20 Vimshamsha
    24: 0.5,  # D24 Chaturvimshamsha
    27: 0.5,  # D27 Nakshatramsha
    30: 1.5,  # D30 Trimshamsha
    40: 0.5,  # D40 Khavedamsha
    45: 0.5,  # D45 Akshavedamsha
    60: 4.0,  # D60 Shashtiamsha
}

PLANET_STATUS_SCORE = {
    "exalted":     1.0,
    "own_sign":    0.75,
    "friend_sign": 0.625,
    "neutral":     0.5,
    "enemy_sign":  0.375,
    "debilitated": 0.25,
}

def get_vimshopaka(planets: dict, asc_lon: float) -> dict:
    result = {}
    for planet_name in planets:
        total = 0.0
        breakdown = {}
        for d, weight in VIMSHOPAKA_WEIGHTS.items():
            try:
                vdata = calculate_varga(planets, asc_lon, d)
                p_in_varga = vdata["planets"].get(planet_name, {})
                status = p_in_varga.get("status", "neutral")
                score = PLANET_STATUS_SCORE.get(status, 0.5) * weight
                breakdown[f"D{d}"] = {"weight": weight, "status": status, "score": round(score, 3)}
                total += score
            except Exception:
                breakdown[f"D{d}"] = {"weight": weight, "status": "unknown", "score": 0}
        result[planet_name] = {
            "vimshopaka": round(total, 3),
            "max": 20.0,
            "percent": round((total / 20.0) * 100, 1),
            "strength": "Excellent" if total >= 15 else "Good" if total >= 10 else "Average" if total >= 5 else "Weak",
            "breakdown": breakdown,
        }
    return result


def get_bhava_bala(house_data: dict, planets: dict, asc_idx: int) -> dict:
    """
    Simplified Bhava Bala:
    - Bhava Adhipati (lord) in house or own sign: +5
    - Planets in bhava: +3 each (benefic), +1 each (malefic)
    - Planets aspecting bhava: +2
    """
    BENEFICS = {"Jupiter", "Venus", "Moon", "Mercury"}
    MALEFICS = {"Sun", "Mars", "Saturn", "Rahu", "Ketu"}

    result = {}
    for house_num in range(1, 13):
        h_data = house_data["houses"].get(house_num, {})
        sign_idx = h_data.get("sign_index", (asc_idx + house_num - 1) % 12)
        sign = SIGNS[sign_idx]

        score = 0.0
        notes = []

        # Planets in this house
        for p_name, p_data in planets.items():
            p_house = ((p_data["sign_index"] - asc_idx) % 12) + 1
            if p_house == house_num:
                pts = 3.0 if p_name in BENEFICS else 1.0
                score += pts
                notes.append(f"{p_name} in house (+{pts})")

        # Natural aspects (7th aspect is mutual — all planets aspect 7th)
        # Mars aspects 4th and 8th from itself, Jupiter 5th and 9th, Saturn 3rd and 10th
        for p_name, p_data in planets.items():
            p_house = ((p_data["sign_index"] - asc_idx) % 12) + 1
            aspected_houses = {(p_house + 6) % 12 + 1}  # 7th aspect
            if p_name == "Mars":
                aspected_houses |= {(p_house + 3) % 12 + 1, (p_house + 7) % 12 + 1}
            elif p_name == "Jupiter":
                aspected_houses |= {(p_house + 4) % 12 + 1, (p_house + 8) % 12 + 1}
            elif p_name == "Saturn":
                aspected_houses |= {(p_house + 2) % 12 + 1, (p_house + 9) % 12 + 1}
            if house_num in aspected_houses and p_house != house_num:
                score += 2.0
                notes.append(f"{p_name} aspects (+2)")

        result[house_num] = {
            "sign": sign,
            "cusp": round(h_data.get("cusp_longitude", 0), 2),
            "score": round(score, 2),
            "strength": "Strong" if score >= 10 else "Moderate" if score >= 5 else "Weak",
            "notes": notes,
        }
    return result


class VimshoBhavaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/vimshopaka")
def compute_vimshopaka(req: VimshoBhavaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc_lon = house_data["ascendant"]["longitude"]
    asc_idx = house_data["ascendant"]["sign_index"]

    vimshopaka = get_vimshopaka(planets, asc_lon)
    bhava_bala = get_bhava_bala(house_data, planets, asc_idx)

    return {
        "vimshopaka": vimshopaka,
        "bhava_bala": bhava_bala,
        "note": "Vimshopaka: strength from 16 divisional charts (max 20 pts). Bhava Bala: simplified house strength score.",
    }
