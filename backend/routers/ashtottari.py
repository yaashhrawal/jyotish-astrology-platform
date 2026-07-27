"""
Ashtottari Dasha — 108-year cycle.
8 planets: Sun(6), Moon(15), Mars(8), Mercury(17), Saturn(10), Jupiter(19),
           Rahu(12), Venus(21). Total = 108.
Starts from Moon's nakshatra. Applicable when Rahu is in 1/2/3/4/5/7/8/9/10/11/12 (always used in some traditions).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, NAKSHATRAS
import swisseph as swe
from datetime import datetime, timedelta

router = APIRouter()

# Ashtottari sequence and years
ASHTO_SEQUENCE = ["Sun", "Moon", "Mars", "Mercury", "Saturn", "Jupiter", "Rahu", "Venus"]
ASHTO_YEARS = {"Sun": 6, "Moon": 15, "Mars": 8, "Mercury": 17, "Saturn": 10, "Jupiter": 19, "Rahu": 12, "Venus": 21}
ASHTO_TOTAL = 108

# Ashtottari nakshatra→lord allocation (classical). The groups are UNEVEN
# (3 or 4 nakshatras each) and begin at Ardra (nak index 5), NOT a mod-8 cycle.
# Nak indices: Ashwini=0 … Revati=26.
_ASHTO_GROUPS = [
    ("Sun",     [5, 6, 7]),            # Ardra, Punarvasu, Pushya
    ("Moon",    [8, 9, 10, 11]),       # Ashlesha, Magha, P.Phalguni, U.Phalguni
    ("Mars",    [12, 13, 14]),         # Hasta, Chitra, Swati
    ("Mercury", [15, 16, 17, 18]),     # Vishakha, Anuradha, Jyeshtha, Mula
    ("Saturn",  [19, 20, 21]),         # P.Ashadha, U.Ashadha, Shravana
    ("Jupiter", [22, 23, 24, 25]),     # Dhanishta, Shatabhisha, P.Bhadra, U.Bhadra
    ("Rahu",    [26, 0, 1]),           # Revati, Ashwini, Bharani
    ("Venus",   [2, 3, 4]),            # Krittika, Rohini, Mrigashira
]
ASHTO_NAK_LORDS = {}
for _lord, _idxs in _ASHTO_GROUPS:
    for _i in _idxs:
        ASHTO_NAK_LORDS[_i] = _lord


def jd_to_dt(jd: float) -> datetime:
    y, m, d, h = swe.revjul(jd)
    hour = int(h); minute = int((h - hour) * 60)
    return datetime(int(y), int(m), int(d), hour, minute)


def dt_to_iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


class AshtottariRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/ashtottari")
def compute_ashtottari(req: AshtottariRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    moon_lon = planets["Moon"]["longitude"]

    nak_size = 360 / 27
    nak_idx = int(moon_lon / nak_size)
    fraction_elapsed = (moon_lon % nak_size) / nak_size

    # Starting dasha planet
    start_planet = ASHTO_NAK_LORDS[nak_idx]
    start_planet_idx = ASHTO_SEQUENCE.index(start_planet)

    # Time elapsed in current dasha at birth
    start_years = ASHTO_YEARS[start_planet]
    elapsed_years = fraction_elapsed * start_years
    remaining_years = start_years - elapsed_years

    birth_dt = jd_to_dt(jd)
    now = datetime.utcnow()

    dashas = []
    current_dt = birth_dt - timedelta(days=elapsed_years * 365.25)

    for cycle in range(3):  # 3 full cycles = up to 324 years covered
        for offset in range(8):
            idx = (start_planet_idx + offset + cycle * 8) % 8
            planet = ASHTO_SEQUENCE[idx]
            years = ASHTO_YEARS[planet]
            if cycle == 0 and offset == 0:
                years = remaining_years
            end_dt = current_dt + timedelta(days=years * 365.25)
            is_active = current_dt <= now <= end_dt
            dashas.append({
                "planet": planet,
                "years": round(years, 4),
                "start": dt_to_iso(current_dt),
                "end": dt_to_iso(end_dt),
                "is_active": is_active,
            })
            current_dt = end_dt
            if current_dt.year > req.year + 120:
                break
        if current_dt.year > req.year + 120:
            break

    active_idx = next((i for i, d in enumerate(dashas) if d["is_active"]), -1)

    return {
        "system": "Ashtottari (108-year cycle)",
        "moon_nakshatra": NAKSHATRAS[nak_idx],
        "moon_nak_index": nak_idx,
        "starting_dasha": start_planet,
        "elapsed_years_at_birth": round(elapsed_years, 4),
        "dashas": dashas,
        "active_dasha_index": active_idx,
    }
