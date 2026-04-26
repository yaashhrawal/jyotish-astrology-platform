"""
Narayana Dasha (Jaimini) — sign-based dasha.
Direction: odd signs go forward, even signs go backward from lagna.
Years = count from sign to its lord (or exaltation lord).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS, SIGN_LORDS
import swisseph as swe
from datetime import datetime, timedelta

router = APIRouter()

EXALT_LORDS = {
    "Aries": "Sun", "Taurus": "Moon", "Cancer": "Jupiter",
    "Virgo": "Mercury", "Libra": "Saturn", "Capricorn": "Mars", "Pisces": "Venus"
}

# Odd signs (1-based index): Aries(0), Gemini(2), Leo(4), Libra(6), Sag(8), Aquarius(10)
ODD_SIGNS = {0, 2, 4, 6, 8, 10}


def sign_distance(from_idx: int, to_idx: int, forward: bool) -> int:
    if forward:
        return (to_idx - from_idx) % 12 or 12
    else:
        return (from_idx - to_idx) % 12 or 12


def get_narayana_years(sign_idx: int, planets: dict) -> int:
    sign = SIGNS[sign_idx]
    lord = SIGN_LORDS[sign]
    lord_sign_idx = planets[lord]["sign_index"]
    forward = sign_idx in ODD_SIGNS
    years = sign_distance(sign_idx, lord_sign_idx, forward)
    return years


def jd_to_dt(jd: float) -> datetime:
    y, m, d, h = swe.revjul(jd)
    return datetime(int(y), int(m), int(d))


class NarayanaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/narayana_dasha")
def compute_narayana(req: NarayanaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]

    asc_sign_idx = asc["sign_index"]
    birth_dt = jd_to_dt(jd)
    now = datetime.utcnow()

    # Lagna sign determines direction of first dasha sequence
    # Forward if lagna sign is odd, backward if even
    lagna_forward = asc_sign_idx in ODD_SIGNS

    dashas = []
    current_dt = birth_dt

    for cycle in range(3):
        for offset in range(12):
            if lagna_forward:
                sign_idx = (asc_sign_idx + offset) % 12
            else:
                sign_idx = (asc_sign_idx - offset) % 12

            sign = SIGNS[sign_idx]
            years = get_narayana_years(sign_idx, planets)
            end_dt = current_dt + timedelta(days=years * 365.25)
            is_active = current_dt <= now <= end_dt

            # Antardashas (sub-periods within this sign's dasha)
            # Direction same as main dasha for this sign
            sub_forward = sign_idx in ODD_SIGNS
            sub_dashas = []
            sub_dt = current_dt
            for sub_off in range(12):
                if sub_forward:
                    sub_sign_idx = (sign_idx + sub_off) % 12
                else:
                    sub_sign_idx = (sign_idx - sub_off) % 12
                sub_sign = SIGNS[sub_sign_idx]
                sub_years_total = years
                sub_years = get_narayana_years(sub_sign_idx, planets) * sub_years_total / 12.0
                sub_end_dt = sub_dt + timedelta(days=sub_years * 365.25)
                sub_active = sub_dt <= now <= sub_end_dt
                sub_dashas.append({
                    "sign": sub_sign,
                    "sign_index": sub_sign_idx,
                    "years": round(sub_years, 4),
                    "start": sub_dt.strftime("%Y-%m-%d"),
                    "end": sub_end_dt.strftime("%Y-%m-%d"),
                    "is_active": sub_active,
                })
                sub_dt = sub_end_dt

            dashas.append({
                "sign": sign,
                "sign_index": sign_idx,
                "years": years,
                "start": current_dt.strftime("%Y-%m-%d"),
                "end": end_dt.strftime("%Y-%m-%d"),
                "is_active": is_active,
                "direction": "forward" if lagna_forward else "backward",
                "antardashas": sub_dashas,
            })
            current_dt = end_dt
            if current_dt.year > req.year + 120:
                break
        if current_dt.year > req.year + 120:
            break

    active_idx = next((i for i, d in enumerate(dashas) if d["is_active"]), -1)

    return {
        "system": "Narayana Dasha (Jaimini)",
        "ascendant": asc,
        "lagna_direction": "forward" if lagna_forward else "backward",
        "dashas": dashas,
        "active_dasha_index": active_idx,
    }
