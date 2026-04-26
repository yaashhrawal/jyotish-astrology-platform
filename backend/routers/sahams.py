"""
Sahams — Vedic Arabic Parts (Lots).
Each saham = Asc + Planet A - Planet B (day) or reversed for night charts.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, get_sign_and_degree, SIGNS
import swisseph as swe

router = APIRouter()

# Saham definitions: (name, meaning, day_formula: (base, +planet, -planet), night_swap)
# day: Asc + A - B   night: Asc + B - A  (if night_swap=True)
SAHAMS = [
    ("Punya",          "Fortune & happiness",           "Asc", "Moon", "Sun",      True),
    ("Vidya",          "Education & learning",           "Asc", "Mercury", "Moon",  True),
    ("Yasas",          "Fame & reputation",              "Asc", "Jupiter", "Sun",   True),
    ("Mitra",          "Friends & allies",               "Asc", "Moon", "Mercury",  True),
    ("Mahatmya",       "Courage & honour",               "Asc", "Mars", "Moon",     True),
    ("Paramartha",     "Spiritual liberation",           "Asc", "Saturn", "Mercury",True),
    ("Karma",          "Career & action",                "Asc", "Mars", "Sun",      False),
    ("Kala",           "Time & longevity",               "Asc", "Jupiter", "Moon",  False),
    ("Siddhi",         "Success & achievement",          "Asc", "Jupiter", "Sun",   False),
    ("Sanyasa",        "Renunciation",                   "Asc", "Saturn", "Sun",    False),
    ("Rog",            "Disease & health",               "Asc", "Saturn", "Moon",   True),
    ("Bandhu",         "Relatives & bondage",            "Asc", "Mercury", "Moon",  True),
    ("Mriti",          "Death & transformation",         "Asc", "Mars", "Moon",     False),
    ("Pitra",          "Father",                         "Asc", "Saturn", "Sun",    True),
    ("Mata",           "Mother",                         "Asc", "Moon", "Venus",    True),
    ("Putra",          "Children",                       "Asc", "Jupiter", "Moon",  True),
    ("Dara",           "Spouse & marriage",              "Asc", "Venus", "Sun",     True),
    ("Bhratri",        "Siblings",                       "Asc", "Saturn", "Mercury",False),
    ("Rajya",          "Kingship & status",              "Asc", "Sun", "Saturn",    True),
    ("Bhagya",         "Luck & fortune",                 "Asc", "Jupiter", "Saturn",True),
]


def is_night_chart(planets: dict) -> bool:
    """Night chart if Sun is below horizon (houses 1-6)."""
    return planets.get("Sun", {}).get("house", 7) <= 6


class SahamRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/sahams")
def compute_sahams(req: SahamRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_lon = asc["longitude"]
    asc_idx = asc["sign_index"]

    # Assign house to Sun to determine day/night
    sun_sidx = planets["Sun"]["sign_index"]
    sun_house = (sun_sidx - asc_idx) % 12 + 1
    planets["Sun"]["house"] = sun_house
    night = sun_house <= 6  # Sun in houses 1-6 = below horizon = night

    lons = {name: pd["longitude"] for name, pd in planets.items()}
    lons["Asc"] = asc_lon

    results = []
    for name, meaning, base, add_p, sub_p, night_swap in SAHAMS:
        b = lons.get(base, 0)
        a = lons.get(add_p, 0)
        s = lons.get(sub_p, 0)

        if night and night_swap:
            lon = (b + s - a) % 360
        else:
            lon = (b + a - s) % 360

        sign, deg, sign_idx = get_sign_and_degree(lon)
        house = (sign_idx - asc_idx) % 12 + 1

        # Lord of saham sign
        from core.engine import SIGN_LORDS
        lord = SIGN_LORDS.get(sign, "")

        results.append({
            "name": name, "meaning": meaning,
            "longitude": round(lon, 4), "sign": sign,
            "sign_index": sign_idx, "degree": round(deg, 4),
            "house": house, "lord": lord,
            "formula": f"Asc + {add_p} - {sub_p}" if not (night and night_swap)
                       else f"Asc + {sub_p} - {add_p} (night)",
        })

    return {
        "ascendant": asc,
        "is_night_chart": night,
        "sahams": results,
        "total": len(results),
    }
