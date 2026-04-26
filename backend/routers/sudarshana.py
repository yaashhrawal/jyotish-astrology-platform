"""
Sudarshana Chakra — three concentric wheels:
  Outer: from Lagna (Lagna Chakra) — each house = one year from birth
  Middle: from Moon (Chandra Chakra)
  Inner: from Sun (Surya Chakra)
Current year's activated houses shown for transit analysis.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter()


class SudarshanRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


def age_to_house(age_years: float) -> int:
    """Which house (1-12) is active for a given age (repeats every 12y)."""
    return int(age_years) % 12 + 1


@router.post("/sudarshana")
def compute_sudarshana(req: SudarshanRequest):
    from datetime import date
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]

    today = date.today()
    birth_date = date(req.year, req.month, req.day)
    age_days = (today - birth_date).days
    age_years = age_days / 365.25

    lagna_sign_idx = asc["sign_index"]
    moon_sign_idx = planets["Moon"]["sign_index"]
    sun_sign_idx = planets["Sun"]["sign_index"]

    # Current active house in each chakra
    current_year_num = int(age_years)  # 0-based year of life
    lagna_house = current_year_num % 12 + 1
    moon_house = current_year_num % 12 + 1   # same year number, different starting point
    sun_house = current_year_num % 12 + 1

    # For each chakra, map house → sign
    def house_to_sign(start_sign_idx: int, house: int) -> str:
        return SIGNS[(start_sign_idx + house - 1) % 12]

    # Planet placements in each chakra (which house does each planet fall in?)
    def planet_chakra_houses(start_sign_idx: int) -> list:
        result = []
        for name, pd in planets.items():
            house = (pd["sign_index"] - start_sign_idx) % 12 + 1
            result.append({"planet": name, "house": house, "sign": pd["sign"]})
        return result

    # Build 12-house wheel for each chakra with sign labels
    def build_wheel(start_sign_idx: int, current_h: int) -> list:
        wheel = []
        for h in range(1, 13):
            sign = SIGNS[(start_sign_idx + h - 1) % 12]
            planets_here = [
                p["planet"] for p in planet_chakra_houses(start_sign_idx) if p["house"] == h
            ]
            wheel.append({
                "house": h,
                "sign": sign,
                "planets": planets_here,
                "active": h == current_h,
            })
        return wheel

    lagna_wheel = build_wheel(lagna_sign_idx, lagna_house)
    moon_wheel = build_wheel(moon_sign_idx, moon_house)
    sun_wheel = build_wheel(sun_sign_idx, sun_house)

    # Current active signs
    lagna_active_sign = house_to_sign(lagna_sign_idx, lagna_house)
    moon_active_sign = house_to_sign(moon_sign_idx, moon_house)
    sun_active_sign = house_to_sign(sun_sign_idx, sun_house)

    # Triple activation: houses active in all 3 simultaneously?
    triple = lagna_house == moon_house == sun_house

    return {
        "age_years": round(age_years, 2),
        "current_year_of_life": current_year_num + 1,
        "lagna_chakra": {
            "start_sign": SIGNS[lagna_sign_idx],
            "active_house": lagna_house,
            "active_sign": lagna_active_sign,
            "wheel": lagna_wheel,
        },
        "moon_chakra": {
            "start_sign": SIGNS[moon_sign_idx],
            "active_house": moon_house,
            "active_sign": moon_active_sign,
            "wheel": moon_wheel,
        },
        "sun_chakra": {
            "start_sign": SIGNS[sun_sign_idx],
            "active_house": sun_house,
            "active_sign": sun_active_sign,
            "wheel": sun_wheel,
        },
        "triple_activation": triple,
        "ascendant": asc,
    }
