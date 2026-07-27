"""
Yogini Dasha system.
8 Yoginis, each ruled by a planet, periods of 1-8 years.
Based on Moon's nakshatra at birth.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, jd_to_datetime
import swisseph as swe

router = APIRouter()

# Yoginis in order: Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha, Sankata
YOGINIS = [
    {"name": "Mangala",  "lord": "Moon",    "years": 1},
    {"name": "Pingala",  "lord": "Sun",     "years": 2},
    {"name": "Dhanya",   "lord": "Jupiter", "years": 3},
    {"name": "Bhramari", "lord": "Mars",    "years": 4},
    {"name": "Bhadrika", "lord": "Mercury", "years": 5},
    {"name": "Ulka",     "lord": "Saturn",  "years": 6},
    {"name": "Siddha",   "lord": "Venus",   "years": 7},
    {"name": "Sankata",  "lord": "Rahu",    "years": 8},
]
TOTAL_CYCLE = 36  # 1+2+3+4+5+6+7+8

# Nakshatra → Yogini (each yogini rules 27/8 ≈ 3.375 nakshatras, but actually 3 each with some sharing)
# Standard: nakshatra index mod 8 → yogini index
def nak_to_yogini_idx(nak_idx: int) -> int:
    # Classical: (janma nakshatra number + 3) mod 8, remainder 1=Mangala…8/0=Sankata.
    # With 0-based nak_idx this is (nak_idx + 3) % 8 (was nak_idx % 8 — off by 3).
    return (nak_idx + 3) % 8


def get_yogini_dashas(moon_lon: float, birth_jd: float) -> list:
    nak_idx = int(moon_lon / (360 / 27))
    nak_elapsed_frac = (moon_lon % (360 / 27)) / (360 / 27)

    yogini_start_idx = nak_to_yogini_idx(nak_idx)
    yogini = YOGINIS[yogini_start_idx]

    # Elapsed fraction of current yogini
    elapsed_years = yogini["years"] * nak_elapsed_frac
    remaining_years = yogini["years"] - elapsed_years

    dashas = []
    current_jd = birth_jd

    # First partial
    end_jd = current_jd + remaining_years * 365.25
    dashas.append({
        "yogini": yogini["name"], "lord": yogini["lord"],
        "years": round(remaining_years, 4),
        "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd),
        "start_jd": current_jd, "end_jd": end_jd,
    })
    current_jd = end_jd

    # Remaining full cycles (cover 120 years)
    for i in range(1, 50):
        yi = (yogini_start_idx + i) % 8
        yog = YOGINIS[yi]
        end_jd = current_jd + yog["years"] * 365.25
        dashas.append({
            "yogini": yog["name"], "lord": yog["lord"],
            "years": yog["years"],
            "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd),
            "start_jd": current_jd, "end_jd": end_jd,
        })
        current_jd = end_jd
        if current_jd > birth_jd + 120 * 365.25:
            break

    return dashas


def get_antardashas(mahadasha: dict) -> list:
    """Sub-periods within each Yogini Mahadasha."""
    md_years = mahadasha["years"]
    md_start_jd = mahadasha["start_jd"]

    # Find which yogini this maha starts from
    yogini_name = mahadasha["yogini"]
    start_idx = next(i for i, y in enumerate(YOGINIS) if y["name"] == yogini_name)

    antardashas = []
    current_jd = md_start_jd

    total_sub_years = TOTAL_CYCLE
    for i in range(8):
        yi = (start_idx + i) % 8
        yog = YOGINIS[yi]
        sub_years = (yog["years"] / total_sub_years) * md_years
        end_jd = current_jd + sub_years * 365.25
        antardashas.append({
            "yogini": yog["name"], "lord": yog["lord"],
            "years": round(sub_years, 4),
            "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd),
        })
        current_jd = end_jd

    return antardashas


class YoginiRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/yogini_dasha")
def compute_yogini(req: YoginiRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    moon_lon = planets["Moon"]["longitude"]

    dashas = get_yogini_dashas(moon_lon, jd)

    # Add antardashas
    from datetime import datetime
    _now = datetime.utcnow()
    now_jd = swe.julday(_now.year, _now.month, _now.day, _now.hour)

    for d in dashas:
        d["antardashas"] = get_antardashas(d)
        d["is_active"] = d["start_jd"] <= now_jd <= d["end_jd"]

    nak_idx = int(moon_lon / (360 / 27))
    from core.engine import NAKSHATRAS, NAKSHATRA_LORDS
    balance_years = dashas[0]["years"]

    return {
        "dashas": dashas,
        "moon_nakshatra": NAKSHATRAS[nak_idx],
        "starting_yogini": YOGINIS[nak_to_yogini_idx(nak_idx)]["name"],
        "balance_at_birth": round(balance_years, 4),
        "cycle_years": TOTAL_CYCLE,
    }
