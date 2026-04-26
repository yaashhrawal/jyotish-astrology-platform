"""
Chara Dasha (Jaimini) — Sign-based dasha system.
Each rashi gets a period determined by its lord's position.
Uses Sanjay Rath's method (most common).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, SIGNS, jd_to_datetime
)
import swisseph as swe

router = APIRouter()

SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

# KN Rao uses Ketu for Scorpio, Rahu for Aquarius as primary lords
SIGN_LORDS_KN = {**SIGN_LORDS, "Scorpio": "Ketu", "Aquarius": "Rahu"}

# Dual signs (fixed): Taurus, Leo, Scorpio, Aquarius — counted differently
DUAL_SIGNS = {"Gemini", "Virgo", "Sagittarius", "Pisces"}
FIXED_SIGNS = {"Taurus", "Leo", "Scorpio", "Aquarius"}
MOVEABLE_SIGNS = {"Aries", "Cancer", "Libra", "Capricorn"}


def count_signs(from_sign_idx: int, to_sign_idx: int, direction: str = "forward") -> int:
    """Count signs from one to another (inclusive)."""
    if direction == "forward":
        diff = (to_sign_idx - from_sign_idx) % 12
        return diff + 1
    else:
        diff = (from_sign_idx - to_sign_idx) % 12
        return diff + 1


def get_chara_years(sign_idx: int, planets: dict, asc_idx: int) -> int:
    """
    Chara dasha years for a sign:
    1. Find lord of sign
    2. Count signs from lord's position to sign (forward for odd signs, backward for even)
    3. Add 1 if lord is in own sign
    4. Subtract 1 if Rahu is in same sign as lord or aspecting
    Special: if lord in exaltation sign, add/subtract based on sign type
    """
    sign = SIGNS[sign_idx]
    lord_name = SIGN_LORDS[sign]
    lord_data = planets.get(lord_name)

    if not lord_data:
        return 1

    lord_sign_idx = lord_data["sign_index"]

    # Count direction: odd signs (Aries=0,Gemini=2,...) = forward, even = backward
    if sign_idx % 2 == 0:  # Aries, Gemini, Leo, Libra, Sag, Aquarius (0-based even)
        years = count_signs(lord_sign_idx, sign_idx, "forward")
    else:
        years = count_signs(lord_sign_idx, sign_idx, "backward")

    # Adjustment for Aquarius (Saturn's dual lordship with Rahu)
    rahu_data = planets.get("Rahu")
    if rahu_data and rahu_data["sign_index"] == lord_sign_idx:
        years = max(1, years - 1)

    # Cap at 12
    years = years % 12
    if years == 0:
        years = 12

    return years


def get_chara_antardasha(maha_sign_idx: int, maha_years: int, planets: dict, asc_idx: int) -> list:
    """Sub-periods within each Chara Mahadasha — each sign gets a proportional sub-period."""
    antardashas = []
    total_sub = sum(get_chara_years(i, planets, asc_idx) for i in range(12))

    for i in range(12):
        sub_sign_idx = (maha_sign_idx + i) % 12
        sub_years_raw = get_chara_years(sub_sign_idx, planets, asc_idx)
        # Proportional to maha_years
        sub_years = (sub_years_raw / total_sub) * maha_years
        antardashas.append({
            "sign_index": sub_sign_idx,
            "sign": SIGNS[sub_sign_idx],
            "years": round(sub_years, 4),
        })
    return antardashas


class CharaDashaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/chara_dasha")
def compute_chara_dasha(req: CharaDashaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc["sign_index"]
    planet_house_map = assign_planets_to_houses(planets, asc_idx)

    # Get years for each of 12 signs
    sign_years = []
    for i in range(12):
        years = get_chara_years(i, planets, asc_idx)
        sign_years.append((i, years))

    # Build dasha sequence starting from Lagna sign
    dashas = []
    current_jd = jd

    # Sequence starts from Lagna sign
    for cycle in range(3):  # 3 cycles = 36 periods = covers ~100 years
        for i in range(12):
            sign_idx = (asc_idx + i) % 12
            years = get_chara_years(sign_idx, planets, asc_idx)
            end_jd = current_jd + years * 365.25
            antars = get_chara_antardasha(sign_idx, years, planets, asc_idx)

            # Add start/end dates to antardashas
            antar_jd = current_jd
            for ad in antars:
                ad_end_jd = antar_jd + ad["years"] * 365.25
                ad["start"] = jd_to_datetime(antar_jd)
                ad["end"] = jd_to_datetime(ad_end_jd)
                ad["start_jd"] = antar_jd
                ad["end_jd"] = ad_end_jd
                antar_jd = ad_end_jd

            dashas.append({
                "sign_index": sign_idx,
                "sign": SIGNS[sign_idx],
                "lord": SIGN_LORDS[SIGNS[sign_idx]],
                "house": i + 1,
                "years": years,
                "start": jd_to_datetime(current_jd),
                "end": jd_to_datetime(end_jd),
                "start_jd": current_jd,
                "end_jd": end_jd,
                "antardashas": antars,
            })
            current_jd = end_jd
            if current_jd > jd + 120 * 365.25:
                break
        else:
            continue
        break

    # Determine active dasha
    from datetime import datetime
    now = datetime.utcnow()
    now_jd_val = swe.julday(now.year, now.month, now.day, now.hour)

    for d in dashas:
        d["is_active"] = d["start_jd"] <= now_jd_val <= d["end_jd"]
        for ad in d["antardashas"]:
            ad["is_active"] = (ad["start_jd"] <= now_jd_val <= ad["end_jd"]) if "start_jd" in ad else False

    # Planet positions for reference
    planets_list = []
    for name, pd in planets.items():
        h = ((pd["sign_index"] - asc_idx) % 12) + 1
        planets_list.append({
            "name": name, "sign": pd["sign"], "sign_index": pd["sign_index"],
            "degree": round(pd["degree"], 2), "house": h,
        })

    return {
        "ascendant": asc,
        "dashas": dashas,
        "planets": planets_list,
        "sign_years": [{"sign": SIGNS[i], "years": get_chara_years(i, planets, asc_idx)} for i in range(12)],
        "variant": "Sanjay Rath",
    }


def get_chara_years_kn(sign_idx: int, planets: dict, asc_idx: int) -> int:
    """KN Rao variant: Ketu lords Scorpio, Rahu lords Aquarius. Always forward count."""
    sign = SIGNS[sign_idx]
    lord_name = SIGN_LORDS_KN[sign]
    lord_data = planets.get(lord_name)
    if not lord_data:
        return 1
    lord_sign_idx = lord_data["sign_index"]
    years = count_signs(lord_sign_idx, sign_idx, "forward")
    years = years % 12
    if years == 0:
        years = 12
    return years


@router.post("/chara_dasha_kn")
def compute_chara_dasha_kn(req: CharaDashaRequest):
    """KN Rao's Chara Dasha — Ketu/Rahu for Scorpio/Aquarius, always forward count."""
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc["sign_index"]
    assign_planets_to_houses(planets, asc_idx)

    dashas = []
    current_jd = jd

    for cycle in range(3):
        for i in range(12):
            sign_idx = (asc_idx + i) % 12
            years = get_chara_years_kn(sign_idx, planets, asc_idx)
            end_jd = current_jd + years * 365.25
            dashas.append({
                "sign_index": sign_idx,
                "sign": SIGNS[sign_idx],
                "lord": SIGN_LORDS_KN[SIGNS[sign_idx]],
                "house": i + 1,
                "years": years,
                "start": jd_to_datetime(current_jd),
                "end": jd_to_datetime(end_jd),
                "start_jd": current_jd,
                "end_jd": end_jd,
            })
            current_jd = end_jd
            if current_jd > jd + 120 * 365.25:
                break
        else:
            continue
        break

    from datetime import datetime
    now = datetime.utcnow()
    now_jd_val = swe.julday(now.year, now.month, now.day, now.hour)
    for d in dashas:
        d["is_active"] = d["start_jd"] <= now_jd_val <= d["end_jd"]

    planets_list = [{"name": n, "sign": p["sign"], "house": ((p["sign_index"] - asc_idx) % 12) + 1}
                    for n, p in planets.items()]

    return {
        "ascendant": asc,
        "dashas": dashas,
        "planets": planets_list,
        "sign_years": [{"sign": SIGNS[i], "years": get_chara_years_kn(i, planets, asc_idx)} for i in range(12)],
        "variant": "KN Rao",
    }
