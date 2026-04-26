"""
Lagnesh Analysis — Ascendant lord position, strength, and classical interpretation.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, get_ayanamsa, SIGNS

router = APIRouter()

SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

EXALTATION = {
    "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
    "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra"
}
DEBILITATION = {p: SIGNS[(SIGNS.index(s) + 6) % 12] for p, s in EXALTATION.items()}

OWN_SIGNS = {
    "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"]
}

FRIENDLY = {
    "Sun":     ["Moon", "Mars", "Jupiter"],
    "Moon":    ["Sun", "Mercury"],
    "Mars":    ["Sun", "Moon", "Jupiter"],
    "Mercury": ["Sun", "Venus"],
    "Jupiter": ["Sun", "Moon", "Mars"],
    "Venus":   ["Mercury", "Saturn"],
    "Saturn":  ["Mercury", "Venus"],
}

HOUSE_INTERPRETATIONS = {
    1: "Lagnesh in own house — strongest placement. Self-driven, excellent health, strong identity.",
    2: "Lagnesh in 2nd — wealth, speech, family matters prominent. Financial stability through own effort.",
    3: "Lagnesh in 3rd — courage, siblings, self-effort. Media, writing, travel prominent.",
    4: "Lagnesh in 4th — home, mother, property happiness. Domestic peace important.",
    5: "Lagnesh in 5th — intelligence, children, creativity. Past-life merit supports the native.",
    6: "Lagnesh in 6th — service, health focus, overcoming enemies. Success through hard work.",
    7: "Lagnesh in 7th — partnerships central to life. Marriage and business contracts significant.",
    8: "Lagnesh in 8th — transformation, occult, longevity through adversity. Research ability.",
    9: "Lagnesh in 9th — fortune, dharma, father, higher education. Very auspicious.",
    10: "Lagnesh in 10th — career success, status, public life. Strong rajayoga potential.",
    11: "Lagnesh in 11th — gains, elder siblings, networks. Financial gains and social connections.",
    12: "Lagnesh in 12th — spirituality, losses, foreign lands. Moksha orientation or expenses."
}

STRENGTH_MAP = {
    "exalted": 5, "own": 4, "friendly": 3, "neutral": 2, "enemy": 1, "debilitated": 0
}


def get_dignity(planet: str, sign: str) -> str:
    if EXALTATION.get(planet) == sign:
        return "exalted"
    if DEBILITATION.get(planet) == sign:
        return "debilitated"
    if sign in OWN_SIGNS.get(planet, []):
        return "own"
    sign_lord = SIGN_LORDS.get(sign, "")
    if sign_lord in FRIENDLY.get(planet, []):
        return "friendly"
    return "neutral"


def get_aspects_to_planet(planet_name: str, all_planets: dict) -> list:
    """Parashari full aspects: all planets aspect 7th. Mars+4th/8th, Jupiter+5th/9th, Saturn+3rd/10th."""
    p_data = all_planets.get(planet_name)
    if not p_data:
        return []
    p_house = p_data.get("house", 1)
    aspecting = []
    for name, data in all_planets.items():
        if name == planet_name:
            continue
        h = data.get("house", 1)
        aspects = {(h + 6) % 12 or 12}
        if name == "Mars":
            aspects |= {(h + 3) % 12 or 12, (h + 7) % 12 or 12}
        elif name == "Jupiter":
            aspects |= {(h + 4) % 12 or 12, (h + 8) % 12 or 12}
        elif name == "Saturn":
            aspects |= {(h + 2) % 12 or 12, (h + 9) % 12 or 12}
        if p_house in aspects:
            aspecting.append({"planet": name, "from_house": h})
    return aspecting


class LagneshRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/lagnesh_analysis")
def lagnesh_analysis(req: LagneshRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    houses = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)

    asc_sign = houses.get(1, {}).get("sign", "Aries")
    lagnesh = SIGN_LORDS[asc_sign]

    lagnesh_data = planets.get(lagnesh, {})
    lagnesh_sign = lagnesh_data.get("sign", "")
    lagnesh_house = lagnesh_data.get("house", 1)
    lagnesh_degree = lagnesh_data.get("degree", 0)
    lagnesh_lon = lagnesh_data.get("longitude", 0)
    lagnesh_retro = lagnesh_data.get("retrograde", False)
    lagnesh_nak = lagnesh_data.get("nakshatra", "")
    lagnesh_pada = lagnesh_data.get("pada", 1)

    dignity = get_dignity(lagnesh, lagnesh_sign)
    strength_score = STRENGTH_MAP[dignity]

    # Aspects received by lagnesh
    all_planets = {k: v for k, v in planets.items()}
    aspects_received = get_aspects_to_planet(lagnesh, all_planets)

    # Co-tenants in same house
    co_tenants = [p for p, d in planets.items() if d.get("house") == lagnesh_house and p != lagnesh]

    # House interpretation
    house_interp = HOUSE_INTERPRETATIONS.get(lagnesh_house, "")

    # Strength summary
    strength_label = {5: "Excellent", 4: "Strong", 3: "Moderate", 2: "Neutral", 1: "Weak", 0: "Debilitated"}[strength_score]

    # Retrograde note
    retro_note = "Retrograde — introspective, delayed but deep results. Past-life karma theme strong." if lagnesh_retro else ""

    # Aspect interpretation
    aspect_notes = []
    for asp in aspects_received:
        p = asp["planet"]
        if p in FRIENDLY.get(lagnesh, []):
            aspect_notes.append(f"{p} (friend) aspects lagnesh — supportive, beneficial influence.")
        else:
            aspect_notes.append(f"{p} aspects lagnesh — mixed results depending on {p}'s condition.")

    return {
        "ascendant_sign": asc_sign,
        "lagnesh": lagnesh,
        "lagnesh_sign": lagnesh_sign,
        "lagnesh_house": lagnesh_house,
        "lagnesh_degree": round(lagnesh_degree, 2),
        "lagnesh_longitude": round(lagnesh_lon, 4),
        "lagnesh_retrograde": lagnesh_retro,
        "lagnesh_nakshatra": lagnesh_nak,
        "lagnesh_pada": lagnesh_pada,
        "dignity": dignity,
        "strength_score": strength_score,
        "strength_label": strength_label,
        "house_interpretation": house_interp,
        "retrograde_note": retro_note,
        "aspects_received": aspects_received,
        "aspect_notes": aspect_notes,
        "co_tenants": co_tenants,
        "summary": f"{lagnesh} (Lagnesh of {asc_sign} ascendant) in {lagnesh_sign} in H{lagnesh_house} — {dignity}. {strength_label} placement. {house_interp}"
    }
