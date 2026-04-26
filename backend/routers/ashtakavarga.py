from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses

router = APIRouter()


class BirthData(BaseModel):
    year: int
    month: int
    day: int
    hour: int
    minute: int
    tz_offset: float
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"


# Benefic positions for each planet's Ashtakavarga
# Format: planet -> list of houses (1-based) from which it contributes a point
# Source: BPHS Ashtakavarga chapter

AV_BENEFIC_POSITIONS = {
    "Sun": {
        "Sun":     [1, 2, 4, 7, 8, 9, 10, 11],
        "Moon":    [3, 6, 10, 11],
        "Mars":    [1, 2, 4, 7, 8, 9, 10, 11],
        "Mercury": [3, 5, 6, 9, 10, 11, 12],
        "Jupiter": [5, 6, 9, 11],
        "Venus":   [6, 7, 12],
        "Saturn":  [1, 2, 4, 7, 8, 9, 10, 11],
        "Lagna":   [3, 4, 6, 10, 11, 12],
    },
    "Moon": {
        "Sun":     [3, 6, 7, 8, 10, 11],
        "Moon":    [1, 3, 6, 7, 10, 11],
        "Mars":    [2, 3, 5, 6, 9, 10, 11],
        "Mercury": [1, 3, 4, 5, 7, 8, 10, 11],
        "Jupiter": [1, 4, 7, 8, 10, 11, 12],
        "Venus":   [3, 4, 5, 7, 9, 10, 11],
        "Saturn":  [3, 5, 6, 11],
        "Lagna":   [3, 6, 10, 11],
    },
    "Mars": {
        "Sun":     [3, 5, 6, 10, 11],
        "Moon":    [3, 6, 11],
        "Mars":    [1, 2, 4, 7, 8, 10, 11],
        "Mercury": [3, 5, 6, 11],
        "Jupiter": [6, 10, 11, 12],
        "Venus":   [6, 8, 11, 12],
        "Saturn":  [1, 4, 7, 8, 9, 10, 11],
        "Lagna":   [1, 3, 6, 10, 11],
    },
    "Mercury": {
        "Sun":     [5, 6, 9, 11, 12],
        "Moon":    [2, 4, 6, 8, 10, 11],
        "Mars":    [1, 2, 4, 7, 8, 9, 10, 11],
        "Mercury": [1, 3, 5, 6, 9, 10, 11, 12],
        "Jupiter": [6, 8, 11, 12],
        "Venus":   [1, 2, 3, 4, 5, 8, 9, 11],
        "Saturn":  [1, 2, 4, 7, 8, 9, 10, 11],
        "Lagna":   [1, 2, 4, 6, 8, 10, 11],
    },
    "Jupiter": {
        "Sun":     [1, 2, 3, 4, 7, 8, 9, 10, 11],
        "Moon":    [2, 5, 7, 9, 11],
        "Mars":    [1, 2, 4, 7, 8, 10, 11],
        "Mercury": [1, 2, 4, 5, 6, 9, 10, 11],
        "Jupiter": [1, 2, 3, 4, 7, 8, 10, 11],
        "Venus":   [2, 5, 6, 9, 10, 11],
        "Saturn":  [3, 5, 6, 12],
        "Lagna":   [1, 2, 4, 5, 6, 7, 9, 10, 11],
    },
    "Venus": {
        "Sun":     [8, 11, 12],
        "Moon":    [1, 2, 3, 4, 5, 8, 9, 11, 12],
        "Mars":    [3, 4, 6, 9, 11, 12],
        "Mercury": [3, 5, 6, 9, 11],
        "Jupiter": [5, 8, 9, 10, 11],
        "Venus":   [1, 2, 3, 4, 5, 8, 9, 10, 11],
        "Saturn":  [3, 4, 5, 8, 9, 10, 11],
        "Lagna":   [1, 2, 3, 4, 5, 8, 9, 11],
    },
    "Saturn": {
        "Sun":     [1, 2, 4, 7, 8, 10, 11],
        "Moon":    [3, 6, 11],
        "Mars":    [3, 5, 6, 10, 11, 12],
        "Mercury": [6, 8, 9, 10, 11, 12],
        "Jupiter": [5, 6, 11, 12],
        "Venus":   [6, 11, 12],
        "Saturn":  [3, 5, 6, 11],
        "Lagna":   [1, 3, 4, 6, 10, 11],
    },
}


def calculate_bhinnashtakavarga(planet: str, planet_sign_idx: int, contributing_planets: dict, lagna_sign_idx: int) -> list:
    """Calculate the 12-sign Bhinnashtakavarga for a given planet."""
    scores = [0] * 12

    av_rules = AV_BENEFIC_POSITIONS.get(planet, {})

    for contributor, benefic_houses in av_rules.items():
        if contributor == "Lagna":
            source_sign_idx = lagna_sign_idx
        else:
            p_data = contributing_planets.get(contributor)
            if not p_data:
                continue
            source_sign_idx = p_data["sign_index"]

        for house in benefic_houses:
            target_sign_idx = (source_sign_idx + house - 1) % 12
            scores[target_sign_idx] += 1

    return scores


@router.post("/ashtakavarga")
def get_ashtakavarga(data: BirthData):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa)
    from core.engine import calculate_houses
    house_data = calculate_houses(jd, data.latitude, data.longitude, data.ayanamsa)
    lagna_sign_idx = house_data["ascendant"]["sign_index"]

    planet_list = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    bhinnashtaka = {}
    sarva = [0] * 12

    for planet in planet_list:
        p_sign_idx = planets[planet]["sign_index"]
        scores = calculate_bhinnashtakavarga(planet, p_sign_idx, planets, lagna_sign_idx)
        bhinnashtaka[planet] = scores
        sarva = [sarva[i] + scores[i] for i in range(12)]

    from core.engine import SIGNS
    return {
        "bhinnashtakavarga": {
            planet: {SIGNS[i]: bhinnashtaka[planet][i] for i in range(12)}
            for planet in planet_list
        },
        "sarvashtakavarga": {SIGNS[i]: sarva[i] for i in range(12)},
        "planet_positions": {p: planets[p]["sign"] for p in planet_list},
    }
