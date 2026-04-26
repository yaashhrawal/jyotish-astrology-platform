"""
Planetary Dignity Summary — all planets across all 16 varga charts.
Checks: exaltation, debilitation, own sign, Moolatrikona, neutral, enemy.
Varga Visesha: Parijata (2 dignities), Uttama (3+), Gopura (4+), etc.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, SIGNS, SIGN_LORDS,
    EXALTATION, DEBILITATION, OWN_SIGN
)
import swisseph as swe

router = APIRouter()

# Moolatrikona signs (primary rulership)
MOOLATRIKONA = {
    "Sun": "Leo", "Moon": "Taurus", "Mars": "Aries", "Mercury": "Virgo",
    "Jupiter": "Sagittarius", "Venus": "Libra", "Saturn": "Aquarius"
}

# Friendly / Neutral / Enemy signs (simplified)
NATURAL_FRIENDS = {
    "Sun":     ["Moon", "Mars", "Jupiter"],
    "Moon":    ["Sun", "Mercury"],
    "Mars":    ["Sun", "Moon", "Jupiter"],
    "Mercury": ["Sun", "Venus"],
    "Jupiter": ["Sun", "Moon", "Mars"],
    "Venus":   ["Mercury", "Saturn"],
    "Saturn":  ["Mercury", "Venus"],
}

VARGA_DIVISORS = {
    "D1": 1, "D2": 2, "D3": 3, "D4": 4, "D7": 7, "D9": 9,
    "D10": 10, "D12": 12, "D16": 16, "D20": 20, "D24": 24,
    "D27": 27, "D30": 30, "D40": 40, "D45": 45, "D60": 60,
}


def get_varga_sign(longitude: float, divisor: int) -> str:
    """Get sign in a varga chart for a given longitude."""
    sign_idx = int(longitude / 30)
    pos_in_sign = longitude % 30
    part = int(pos_in_sign / (30 / divisor))
    if divisor == 9:  # Navamsha
        nav_idx = (sign_idx * 9 + part) % 12
        return SIGNS[nav_idx]
    elif divisor == 2:  # Hora — Sun/Moon
        return "Leo" if sign_idx % 2 == 0 else "Cancer"
    elif divisor == 3:  # Drekkana
        dr_base = (sign_idx // 4) * 4  # element group
        return SIGNS[(sign_idx + part * 4) % 12]
    else:
        # Generic: parts go sequentially from current sign
        return SIGNS[(sign_idx + part) % 12]


def get_dignity(planet: str, sign: str) -> str:
    if sign == EXALTATION.get(planet):
        return "exalted"
    if sign == DEBILITATION.get(planet):
        return "debilitated"
    if sign == MOOLATRIKONA.get(planet):
        return "moolatrikona"
    if sign in OWN_SIGN.get(planet, []):
        return "own"
    lord = SIGN_LORDS.get(sign, "")
    friends = NATURAL_FRIENDS.get(planet, [])
    if lord in friends:
        return "friend"
    return "neutral"


def visesha_label(dignities: list) -> str:
    """Varga Visesha based on count of good dignities."""
    good = sum(1 for d in dignities if d in ("exalted", "moolatrikona", "own", "friend"))
    if good >= 5:
        return "Simhasana (Throne)"
    if good >= 4:
        return "Gopura"
    if good >= 3:
        return "Uttama"
    if good >= 2:
        return "Parijata"
    if good >= 1:
        return "Pushkara"
    return "Neutral"


class DignityRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/dignity")
def compute_dignity(req: DignityRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)

    graha_list = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    varga_names = list(VARGA_DIVISORS.keys())

    result = []
    for planet in graha_list:
        pd = planets[planet]
        lon = pd["longitude"]
        dignities = {}
        dignity_list = []
        for vname, div in VARGA_DIVISORS.items():
            vsign = get_varga_sign(lon, div)
            dign = get_dignity(planet, vsign)
            dignities[vname] = {"sign": vsign, "dignity": dign}
            dignity_list.append(dign)

        result.append({
            "planet": planet,
            "d1_sign": pd["sign"],
            "d1_dignity": get_dignity(planet, pd["sign"]),
            "vargas": dignities,
            "visesha": visesha_label(dignity_list),
            "good_count": sum(1 for d in dignity_list if d in ("exalted", "moolatrikona", "own", "friend")),
        })

    return {
        "planets": result,
        "varga_names": varga_names,
    }
