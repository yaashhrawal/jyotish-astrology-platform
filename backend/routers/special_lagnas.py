"""
Special Lagnas:
- Sree Lagna (SL): wealth, prosperity
- Indu Lagna (IL): Moon sign based wealth
- Pranapada Lagna (PL): Sun-based vital force
- Bhava Lagna (BL): calculated from sunrise
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS, SIGN_LORDS
import swisseph as swe

router = APIRouter()

PLANET_VALUES = {
    "Sun": 30, "Moon": 16, "Mars": 6, "Mercury": 8,
    "Jupiter": 10, "Venus": 12, "Saturn": 1, "Rahu": 8, "Ketu": 7
}


def get_sunrise_jd(year: int, month: int, day: int, lat: float, lon: float) -> float:
    """Approximate sunrise JD for given date/location."""
    noon_jd = swe.julday(year, month, day, 12.0)
    tret = swe.rise_trans(noon_jd - 0.5, swe.SUN, swe.CALC_RISE, (lon, lat, 0), 1013.25, 15)
    return tret[1][0] if tret[0] == 0 else noon_jd - 0.25


class SpecialLagnaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/special_lagnas")
def compute_special_lagnas(req: SpecialLagnaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]

    from core.engine import get_ayanamsa, tropical_to_sidereal, get_sign_and_degree
    ayan = get_ayanamsa(jd, req.ayanamsa)

    # Sunrise JD
    sunrise_jd = get_sunrise_jd(req.year, req.month, req.day, req.latitude, req.longitude)

    # Hours from sunrise to birth
    birth_hour_from_sunrise = (jd - sunrise_jd) * 24.0

    # 1. Sree Lagna (SL) — Moon's longitude + Jupiter's longitude - Lagna
    # Method: Sum moon + sign-lord value + Jupiter from lagna
    moon_lon = planets["Moon"]["longitude"]
    jup_lon = planets["Jupiter"]["longitude"]
    asc_lon = asc["longitude"]
    sl_lon = (moon_lon + jup_lon - asc_lon) % 360
    sl_sign, sl_deg, sl_idx = get_sign_and_degree(sl_lon)

    # 2. Indu Lagna (IL) — based on 9th lord from Lagna + 9th lord from Moon
    # Simplified: use lord value of 9th from lagna + lord value of 9th from Moon, mod 360
    lagna_9th_sign_idx = (asc["sign_index"] + 8) % 12
    moon_9th_sign_idx = (planets["Moon"]["sign_index"] + 8) % 12
    lagna_9th_lord = SIGN_LORDS[SIGNS[lagna_9th_sign_idx]]
    moon_9th_lord = SIGN_LORDS[SIGNS[moon_9th_sign_idx]]
    il_value = (PLANET_VALUES.get(lagna_9th_lord, 0) + PLANET_VALUES.get(moon_9th_lord, 0))
    il_sign_idx = (planets["Moon"]["sign_index"] + il_value - 1) % 12
    il_sign = SIGNS[il_sign_idx]

    # 3. Pranapada Lagna (PPL) — Sun + Sun's distance from Aries in trimshamsha
    # Simplified: (Sun lon + hours_from_midnight * 30/2) mod 360
    sun_lon = planets["Sun"]["longitude"]
    birth_utc_hour = (jd - swe.julday(req.year, req.month, req.day, 0)) * 24
    ppl_lon = (sun_lon + birth_utc_hour * 15) % 360  # 15° per hour
    ppl_sign, ppl_deg, ppl_idx = get_sign_and_degree(ppl_lon)

    # 4. Bhava Lagna (BL) — Lagna advanced by time from sunrise * 30°/2h
    # Advance by (birth_hour_from_sunrise / 2) signs from Lagna
    if birth_hour_from_sunrise < 0:
        birth_hour_from_sunrise += 24
    bl_sign_advance = birth_hour_from_sunrise / 2.0  # 1 sign per 2 hours
    bl_lon = (asc_lon + bl_sign_advance * 30) % 360
    bl_sign, bl_deg, bl_idx = get_sign_and_degree(bl_lon)

    return {
        "ascendant": asc,
        "sree_lagna": {
            "name": "Sree Lagna", "abbr": "SL",
            "longitude": round(sl_lon, 4), "sign": sl_sign, "sign_index": sl_idx, "degree": round(sl_deg, 4),
            "meaning": "Wealth, prosperity, material abundance",
        },
        "indu_lagna": {
            "name": "Indu Lagna", "abbr": "IL",
            "sign": il_sign, "sign_index": il_sign_idx,
            "lagna_9th_lord": lagna_9th_lord, "moon_9th_lord": moon_9th_lord,
            "meaning": "Financial strength, monetary prosperity",
        },
        "pranapada_lagna": {
            "name": "Pranapada Lagna", "abbr": "PL",
            "longitude": round(ppl_lon, 4), "sign": ppl_sign, "sign_index": ppl_idx, "degree": round(ppl_deg, 4),
            "meaning": "Vital force, life energy, spiritual power",
        },
        "bhava_lagna": {
            "name": "Bhava Lagna", "abbr": "BL",
            "longitude": round(bl_lon, 4), "sign": bl_sign, "sign_index": bl_idx, "degree": round(bl_deg, 4),
            "hours_from_sunrise": round(birth_hour_from_sunrise, 2),
            "meaning": "Soul purpose, life direction (from sunrise)",
        },
    }
