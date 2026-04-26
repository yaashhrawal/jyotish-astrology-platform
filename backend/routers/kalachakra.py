"""
Kalachakra Dasha — based on navamsha position of Moon.
360-year cycle. Two types: Savya (forward) and Apasavya (backward).
Navamsha groups: Deha (body) and Jeeva (soul) nakshatras.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, NAKSHATRAS
import swisseph as swe
from datetime import datetime, timedelta

router = APIRouter()

# Kalachakra sequence: 9 signs per group, years assigned per sign
# Savya (forward) groups — nakshatras 1-14 and 15-28 alternate
# Each navamsha pada gets a sign and years
# Standard Kalachakra years per sign (traditional)
KALACHAKRA_YEARS = {
    "Aries": 7, "Taurus": 16, "Gemini": 9, "Cancer": 21,
    "Leo": 5, "Virgo": 9, "Libra": 16, "Scorpio": 7, "Sagittarius": 10,
    "Capricorn": 10, "Aquarius": 7, "Pisces": 16,
}

# Savya nakshatras (1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27 → 0-indexed)
SAVYA_NAKS = {0,1,2,3,4,5,6,7,8,18,19,20,21,22,23,24,25,26}
# Apasavya: the rest (9-17)
APASAVYA_NAKS = {9,10,11,12,13,14,15,16,17}

# Savya sequence of signs
SAVYA_SEQUENCE = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]
# Apasavya reverses direction
APASAVYA_SEQUENCE = list(reversed(SAVYA_SEQUENCE))

# Navamsha pada → sign (for each nakshatra, pada 1-9 maps to 9 signs)
# Savya: start from Aries; Apasavya: start from Pisces going backward
def get_navamsha_sign_idx(nak_idx: int, pada: int) -> int:
    """pada is 1-based (1-9 per nakshatra in Kalachakra, 27 naks × 9 = 243 padas = incomplete cycle)."""
    if nak_idx in SAVYA_NAKS:
        # Count from group start
        group_pos = list(sorted(SAVYA_NAKS)).index(nak_idx) if nak_idx in SAVYA_NAKS else 0
        return (group_pos * 9 + (pada - 1)) % 12
    else:
        group_pos = list(sorted(APASAVYA_NAKS)).index(nak_idx) if nak_idx in APASAVYA_NAKS else 0
        return (11 - (group_pos * 9 + (pada - 1)) % 12) % 12


def jd_to_dt(jd: float) -> datetime:
    y, m, d, h = swe.revjul(jd)
    return datetime(int(y), int(m), int(d))


class KalachakraRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/kalachakra")
def compute_kalachakra(req: KalachakraRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    moon_lon = planets["Moon"]["longitude"]

    nak_size = 360 / 27
    pada_size = nak_size / 9

    nak_idx = int(moon_lon / nak_size)
    pos_in_nak = moon_lon % nak_size
    pada = int(pos_in_nak / pada_size)  # 0-8
    fraction_in_pada = (pos_in_nak % pada_size) / pada_size

    savya = nak_idx in SAVYA_NAKS
    sequence = SAVYA_SEQUENCE if savya else APASAVYA_SEQUENCE

    # Starting sign from navamsha position
    nav_sign_idx = get_navamsha_sign_idx(nak_idx, pada + 1)
    from core.engine import SIGNS
    start_sign = SIGNS[nav_sign_idx]

    # Position in sequence
    try:
        start_pos = sequence.index(start_sign)
    except ValueError:
        start_pos = nav_sign_idx % 12

    # Years elapsed in starting dasha
    start_years = KALACHAKRA_YEARS.get(start_sign, 7)
    elapsed = fraction_in_pada * start_years
    remaining = start_years - elapsed

    birth_dt = jd_to_dt(jd)
    now = datetime.utcnow()
    current_dt = birth_dt - timedelta(days=elapsed * 365.25)

    dashas = []
    for cycle in range(6):  # cover ~360 years
        for offset in range(12):
            pos = (start_pos + offset + cycle * 12) % 12
            sign = sequence[pos]
            years = KALACHAKRA_YEARS.get(sign, 7)
            if cycle == 0 and offset == 0:
                years = remaining
            end_dt = current_dt + timedelta(days=years * 365.25)
            is_active = current_dt <= now <= end_dt
            dashas.append({
                "sign": sign,
                "years": round(years, 4),
                "start": current_dt.strftime("%Y-%m-%d"),
                "end": end_dt.strftime("%Y-%m-%d"),
                "is_active": is_active,
                "direction": "savya" if savya else "apasavya",
            })
            current_dt = end_dt
            if current_dt.year > req.year + 130:
                break
        if current_dt.year > req.year + 130:
            break

    active_idx = next((i for i, d in enumerate(dashas) if d["is_active"]), -1)

    return {
        "system": "Kalachakra Dasha (360-year cycle)",
        "moon_nakshatra": NAKSHATRAS[nak_idx],
        "moon_nak_index": nak_idx,
        "moon_pada": pada + 1,
        "navamsha_sign": start_sign,
        "direction": "savya" if savya else "apasavya",
        "dashas": dashas,
        "active_dasha_index": active_idx,
    }
