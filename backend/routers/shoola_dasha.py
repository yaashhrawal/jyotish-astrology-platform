"""
Shoola Dasha (Niryana Shoola Dasha) — Jaimini longevity dasha.
Based on 8th house sign. Direction: odd signs = forward, even = backward.
Years = sign count to 8th lord's sign.
Niryana Shoola = same logic but from lagna without longevity reduction.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS, SIGN_LORDS
import swisseph as swe
from datetime import datetime, timedelta

router = APIRouter()

ODD_SIGNS = {0, 2, 4, 6, 8, 10}  # Aries(0), Gemini(2), Leo(4), Libra(6), Sag(8), Aqua(10)


def sign_count(from_idx: int, to_idx: int, forward: bool) -> int:
    if forward:
        return (to_idx - from_idx) % 12 or 12
    else:
        return (from_idx - to_idx) % 12 or 12


def jd_to_dt(jd: float) -> datetime:
    y, m, d, h = swe.revjul(jd)
    return datetime(int(y), int(m), int(d))


class ShoolaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


def build_dashas(start_sign_idx: int, planets: dict, birth_dt: datetime, now: datetime, max_year: int):
    dashas = []
    current_dt = birth_dt
    forward = start_sign_idx in ODD_SIGNS

    for cycle in range(4):
        for offset in range(12):
            if forward:
                sign_idx = (start_sign_idx + offset) % 12
            else:
                sign_idx = (start_sign_idx - offset) % 12

            sign = SIGNS[sign_idx]
            lord = SIGN_LORDS[sign]
            lord_idx = planets[lord]["sign_index"]
            years = sign_count(sign_idx, lord_idx, sign_idx in ODD_SIGNS)

            end_dt = current_dt + timedelta(days=years * 365.25)
            is_active = current_dt <= now <= end_dt

            dashas.append({
                "sign": sign,
                "sign_index": sign_idx,
                "lord": lord,
                "years": years,
                "start": current_dt.strftime("%Y-%m-%d"),
                "end": end_dt.strftime("%Y-%m-%d"),
                "is_active": is_active,
            })
            current_dt = end_dt
            if current_dt.year > max_year:
                break
        if current_dt.year > max_year:
            break

    return dashas


@router.post("/shoola_dasha")
def compute_shoola(req: ShoolaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]

    asc_idx = asc["sign_index"]
    # 8th house sign = asc + 7
    eighth_sign_idx = (asc_idx + 7) % 12
    eighth_sign = SIGNS[eighth_sign_idx]

    birth_dt = jd_to_dt(jd)
    now = datetime.utcnow()
    max_year = req.year + 120

    # Shoola Dasha: starts from 8th house sign
    shoola_dashas = build_dashas(eighth_sign_idx, planets, birth_dt, now, max_year)

    # Niryana Shoola: starts from lagna sign
    niryana_dashas = build_dashas(asc_idx, planets, birth_dt, now, max_year)

    shoola_active = next((i for i, d in enumerate(shoola_dashas) if d["is_active"]), -1)
    niryana_active = next((i for i, d in enumerate(niryana_dashas) if d["is_active"]), -1)

    return {
        "ascendant": asc,
        "eighth_sign": eighth_sign,
        "shoola_dasha": {
            "system": "Shoola Dasha (from 8th house)",
            "start_sign": eighth_sign,
            "dashas": shoola_dashas,
            "active_index": shoola_active,
        },
        "niryana_shoola_dasha": {
            "system": "Niryana Shoola Dasha (from Lagna)",
            "start_sign": SIGNS[asc_idx],
            "dashas": niryana_dashas,
            "active_index": niryana_active,
        },
    }
