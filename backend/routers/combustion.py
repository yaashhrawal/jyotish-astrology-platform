"""
Combustion & Planetary War detection.
Combustion: planet within orb of Sun (combust = reduced power).
Planetary War (Graha Yuddha): two planets within 1° of each other.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets

router = APIRouter()

# Combustion orbs (degrees) — traditional values
COMBUST_ORBS = {
    "Moon":    12.0,
    "Mars":     17.0,
    "Mercury":  14.0,  # when retrograde: 12°
    "Jupiter":  11.0,
    "Venus":    10.0,  # when retrograde: 8°
    "Saturn":   15.0,
}

PLANETARY_WAR_ORB = 1.0  # degrees


def angular_diff(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return d if d <= 180 else 360 - d


class CombustRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/combustion")
def compute_combustion(req: CombustRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    sun_lon = planets["Sun"]["longitude"]

    combust_list = []
    for planet, orb in COMBUST_ORBS.items():
        pd = planets[planet]
        diff = angular_diff(pd["longitude"], sun_lon)
        # Adjust orb if retrograde
        actual_orb = orb
        if pd["retrograde"]:
            if planet == "Mercury":
                actual_orb = 12.0
            elif planet == "Venus":
                actual_orb = 8.0
        combust = diff <= actual_orb
        combust_list.append({
            "planet": planet,
            "longitude": pd["longitude"],
            "sun_longitude": sun_lon,
            "angular_distance": round(diff, 4),
            "orb_threshold": actual_orb,
            "combust": combust,
            "retrograde": pd["retrograde"],
            "severity": "deep" if diff <= actual_orb * 0.3 else "moderate" if diff <= actual_orb * 0.6 else "mild" if combust else "none",
        })

    # Planetary War: any two non-luminary, non-node planets within 1°
    graha_list = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    wars = []
    for i in range(len(graha_list)):
        for j in range(i + 1, len(graha_list)):
            p1, p2 = graha_list[i], graha_list[j]
            diff = angular_diff(planets[p1]["longitude"], planets[p2]["longitude"])
            if diff <= PLANETARY_WAR_ORB:
                # Winner: higher latitude (approximated by lower longitude for north-south)
                # Traditional: higher in celestial latitude wins; simplified: north of ecliptic
                winner = p1  # simplified — both suffer, but south planet loses more
                wars.append({
                    "planet1": p1,
                    "planet2": p2,
                    "angular_distance": round(diff, 4),
                    "victor": winner,
                    "defeated": p2,
                    "effect": f"{p2} weakened — {p1} gains strength",
                })

    combust_count = sum(1 for c in combust_list if c["combust"])

    return {
        "sun_longitude": sun_lon,
        "sun_sign": planets["Sun"]["sign"],
        "combust_planets": combust_list,
        "combust_count": combust_count,
        "planetary_wars": wars,
        "war_count": len(wars),
        "summary": {
            "deeply_combust": [c["planet"] for c in combust_list if c["severity"] == "deep"],
            "moderately_combust": [c["planet"] for c in combust_list if c["severity"] == "moderate"],
            "mildly_combust": [c["planet"] for c in combust_list if c["severity"] == "mild"],
        }
    }
