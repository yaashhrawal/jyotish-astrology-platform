"""
Ayurdaya — Longevity calculation.
Three methods: Pindayu (planet degrees), Amsayu (navamsha), Nisargayu (natural years).
Result = minimum of three (Alpayu/Madhyayu/Poornayu classification).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS
from core.varga import d9

router = APIRouter()

# Natural years (Nisargayu) assigned to each planet
NISARGA_YEARS = {
    "Sun": 20, "Moon": 25, "Mars": 15, "Mercury": 20,
    "Jupiter": 15, "Venus": 21, "Saturn": 20,
}

# Pindayu: each planet contributes its degree in sign
# Then apply reductions for combustion, debilitation, etc.

EXALTATION = {
    "Sun": 0, "Moon": 3, "Mars": 9, "Mercury": 5,
    "Jupiter": 3, "Venus": 11, "Saturn": 6,
}
DEBILITATION = {k: (v + 6) % 12 for k, v in EXALTATION.items()}
OWN_SIGNS = {
    "Sun": [4], "Moon": [3], "Mars": [0, 7], "Mercury": [2, 5],
    "Jupiter": [8, 11], "Venus": [1, 6], "Saturn": [9, 10],
}


def pindayu(planets: dict, asc_lon: float) -> dict:
    """Pindayu = sum of degrees of each of 7 planets in their sign."""
    contributions = []
    total = 0
    for name in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]:
        pd = planets.get(name, {})
        deg = pd.get("degree", 0)
        sign_idx = pd.get("sign_index", 0)

        # Full contribution = degree in sign
        contrib = deg

        # Reductions:
        # Combust: halved (simplified: if within 10° of Sun and not Sun)
        if name != "Sun":
            sun_lon = planets.get("Sun", {}).get("longitude", 0)
            p_lon = pd.get("longitude", 0)
            if abs((p_lon - sun_lon + 360) % 360) < 10:
                contrib *= 0.5

        # Debilitated: halved
        if sign_idx == DEBILITATION.get(name, -1):
            contrib *= 0.5

        # Exalted: doubled
        if sign_idx == EXALTATION.get(name, -1):
            contrib *= 2

        total += contrib
        contributions.append({"planet": name, "degree": round(deg, 2), "contribution": round(contrib, 2)})

    # Pindayu in years = total / 360 * 120 (max 120 years)
    years = (total / 360) * 120
    return {"years": round(years, 2), "contributions": contributions, "total_degrees": round(total, 2)}


def amsayu(planets: dict, asc_lon: float) -> dict:
    """Amsayu = navamsha longitude of each planet * factor."""
    contributions = []
    total = 0

    for name in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]:
        pd = planets.get(name, {})
        lon = pd.get("longitude", 0)
        nav_sign = d9(lon)
        # Navamsha degree = (lon % (30/9)) / (30/9) * 30
        nav_deg = (lon % (30/9)) / (30/9) * 30
        contrib = nav_deg
        total += contrib
        contributions.append({"planet": name, "navamsha_sign": SIGNS[nav_sign],
                               "navamsha_deg": round(nav_deg, 2), "contribution": round(contrib, 2)})

    years = (total / 360) * 120
    return {"years": round(years, 2), "contributions": contributions}


def nisargayu(planets: dict) -> dict:
    """Nisargayu = natural years of each strong planet."""
    contributions = []
    total = 0
    for name, nat_years in NISARGA_YEARS.items():
        pd = planets.get(name, {})
        sign_idx = pd.get("sign_index", 0)

        # Full if exalted/own, half if debilitated
        if sign_idx == EXALTATION.get(name):
            factor = 1.0
        elif sign_idx in OWN_SIGNS.get(name, []):
            factor = 1.0
        elif sign_idx == DEBILITATION.get(name):
            factor = 0.5
        else:
            factor = 0.75

        contrib = nat_years * factor
        total += contrib
        contributions.append({"planet": name, "natural_years": nat_years,
                               "factor": factor, "contribution": round(contrib, 2)})

    return {"years": round(total, 2), "contributions": contributions}


def classify_longevity(years: float) -> str:
    if years < 33:
        return "Alpayu (Short Life — under 33)"
    elif years < 66:
        return "Madhyayu (Medium Life — 33–66)"
    else:
        return "Poornayu (Long Life — 66+)"


class AyurdayaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/ayurdaya")
def compute_ayurdaya(req: AyurdayaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_lon = asc["longitude"]

    pinda = pindayu(planets, asc_lon)
    amsa = amsayu(planets, asc_lon)
    nisarga = nisargayu(planets)

    # Traditional: take minimum of three (conservative estimate)
    min_years = min(pinda["years"], amsa["years"], nisarga["years"])
    avg_years = (pinda["years"] + amsa["years"] + nisarga["years"]) / 3

    return {
        "ascendant": asc,
        "pindayu": pinda,
        "amsayu": amsa,
        "nisargayu": nisarga,
        "minimum_years": round(min_years, 1),
        "average_years": round(avg_years, 1),
        "classification_minimum": classify_longevity(min_years),
        "classification_average": classify_longevity(avg_years),
        "note": "Ayurdaya is indicative only. Minimum of 3 methods = traditional approach. Use with other longevity indicators.",
    }
