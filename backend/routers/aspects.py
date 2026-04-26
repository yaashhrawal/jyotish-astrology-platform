"""
Planetary aspects — both Parashari (special aspects) and full aspect grid.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, SIGNS, SIGN_LORDS
)

router = APIRouter()

# Parashari special aspects (house-based, counted from planet's house)
# All planets aspect 7th. Special: Mars=4,8; Jupiter=5,9; Saturn=3,10; Rahu/Ketu=5,9
SPECIAL_ASPECTS = {
    "Sun":     [7],
    "Moon":    [7],
    "Mars":    [4, 7, 8],
    "Mercury": [7],
    "Jupiter": [5, 7, 9],
    "Venus":   [7],
    "Saturn":  [3, 7, 10],
    "Rahu":    [5, 7, 9],
    "Ketu":    [5, 7, 9],
}

# Aspect strength by house distance
ASPECT_STRENGTH = {3: 0.25, 4: 0.5, 5: 0.75, 7: 1.0, 8: 0.5, 9: 0.75, 10: 0.25}

# Western aspects for longitude-based grid
WESTERN_ASPECTS = [
    (0,   "Conjunction",  1.0),
    (30,  "Semi-Sextile", 0.25),
    (60,  "Sextile",      0.5),
    (90,  "Square",       0.75),
    (120, "Trine",        1.0),
    (150, "Quincunx",     0.25),
    (180, "Opposition",   1.0),
]
ORB = 8.0

PLANETS_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]


def get_parashari_aspects(planets: dict, planet_house_map: dict, asc_idx: int) -> list:
    """Parashari aspects: what houses/planets does each planet aspect?"""
    aspects = []

    # Build house -> planets reverse map
    house_planets = {}
    for h, ps in planet_house_map.items():
        for p in ps:
            house_planets[p] = h

    for aspector in PLANETS_ORDER:
        if aspector not in planets:
            continue
        aspector_house = house_planets.get(aspector, 1)
        aspect_houses = SPECIAL_ASPECTS.get(aspector, [7])

        for h_offset in aspect_houses:
            target_house = ((aspector_house - 1 + h_offset - 1) % 12) + 1
            target_sign_idx = (asc_idx + target_house - 1) % 12
            target_sign = SIGNS[target_sign_idx]

            # Find planets in target house
            aspected_planets = planet_house_map.get(target_house, [])
            strength = ASPECT_STRENGTH.get(h_offset, 0.5)

            aspects.append({
                "aspector": aspector,
                "aspector_house": aspector_house,
                "aspect_type": f"{h_offset}th house",
                "target_house": target_house,
                "target_sign": target_sign,
                "aspected_planets": aspected_planets,
                "strength": strength,
                "full_aspect": h_offset == 7,
            })

    return aspects


def get_longitude_aspects(planets: dict) -> list:
    """Western-style longitude-based aspects between planets."""
    aspects = []
    names = [n for n in PLANETS_ORDER if n in planets]

    for i, a in enumerate(names):
        for b in names[i+1:]:
            lon_a = planets[a]["longitude"]
            lon_b = planets[b]["longitude"]
            diff = abs(lon_a - lon_b) % 360
            if diff > 180:
                diff = 360 - diff

            for angle, name, base_strength in WESTERN_ASPECTS:
                orb = abs(diff - angle)
                if orb <= ORB:
                    tightness = 1 - (orb / ORB)
                    aspects.append({
                        "planet1": a, "planet2": b,
                        "aspect": name, "angle": angle,
                        "actual_diff": round(diff, 2),
                        "orb": round(orb, 2),
                        "strength": round(base_strength * tightness, 3),
                        "applying": planets[a].get("speed", 0) > 0 and diff < angle,
                    })

    return aspects


def build_aspect_grid(parashari: list, planets: dict, planet_house_map: dict) -> dict:
    """Grid[aspector][aspected] = aspect info."""
    grid = {p: {} for p in PLANETS_ORDER}

    # Fill parashari aspects
    for asp in parashari:
        aspector = asp["aspector"]
        for target_planet in asp["aspected_planets"]:
            if target_planet in grid.get(aspector, {}):
                continue  # already filled
            grid[aspector][target_planet] = {
                "type": "parashari",
                "aspect": asp["aspect_type"],
                "strength": asp["strength"],
                "full": asp["full_aspect"],
            }

    return grid


class AspectsRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/aspects")
def compute_aspects(req: AspectsRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc["sign_index"]
    planet_house_map = assign_planets_to_houses(planets, asc_idx)

    # Keys from assign_planets_to_houses are already ints
    phm_int = planet_house_map

    parashari = get_parashari_aspects(planets, phm_int, asc_idx)
    lon_aspects = get_longitude_aspects(planets)
    grid = build_aspect_grid(parashari, planets, phm_int)

    # Mutual aspects (both planets aspect each other)
    mutual = []
    for asp in parashari:
        for target in asp["aspected_planets"]:
            # Check if target also aspects aspector
            for rev_asp in parashari:
                if rev_asp["aspector"] == target and asp["aspector"] in rev_asp["aspected_planets"]:
                    mutual.append({"planet1": asp["aspector"], "planet2": target, "strength": "mutual"})

    # Planet-wise aspect summary
    planet_aspects = {}
    for p in PLANETS_ORDER:
        aspected_by = [a["aspector"] for a in parashari if p in a["aspected_planets"]]
        aspects_to = [{"house": a["target_house"], "sign": a["target_sign"], "planets": a["aspected_planets"], "type": a["aspect_type"]}
                      for a in parashari if a["aspector"] == p]
        p_house = next((h for h, ps in phm_int.items() if p in ps), None)
        planet_aspects[p] = {
            "house": p_house,
            "aspected_by": aspected_by,
            "aspects_to": aspects_to,
        }

    return {
        "parashari_aspects": parashari,
        "longitude_aspects": lon_aspects,
        "planet_aspects": planet_aspects,
        "mutual_aspects": mutual,
        "planets_order": PLANETS_ORDER,
    }
