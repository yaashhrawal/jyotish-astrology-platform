"""
Miscellaneous Dasha systems: Sthira, Moola, Tara.
Sthira — sign-based, 7 years per sign, start from Lagna.
Moola — Vimshottari-style but keyed to Lagna nakshatra instead of Moon.
Tara — 9-Tara nakshatra cycle, 9 years each lord.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, jd_to_datetime, NAKSHATRAS, NAKSHATRA_LORDS
import swisseph as swe

router = APIRouter()

SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]

VIMSHOTTARI_SEQUENCE = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"]
VIMSHOTTARI_YEARS    = {"Ketu":7,"Venus":20,"Sun":6,"Moon":10,"Mars":7,"Rahu":18,"Jupiter":16,"Saturn":19,"Mercury":17}
VIMSHOTTARI_TOTAL    = 120

# Nakshatra → starting dasha lord (same as Vimshottari)
NAK_TO_LORD = [NAKSHATRA_LORDS[i] for i in range(27)]


# ── Sthira Dasha ─────────────────────────────────────────────────────────────

STHIRA_YEARS = 7  # Classical: all signs 7 years (BPHS)

def get_sthira_dashas(lagna_sign_idx: int, birth_jd: float) -> list:
    dashas = []
    current_jd = birth_jd
    for i in range(12):
        sign_idx = (lagna_sign_idx + i) % 12
        end_jd = current_jd + STHIRA_YEARS * 365.25
        dashas.append({
            "sign": SIGNS[sign_idx],
            "lord": sign_lord(sign_idx),
            "years": STHIRA_YEARS,
            "start": jd_to_datetime(current_jd),
            "end": jd_to_datetime(end_jd),
            "start_jd": current_jd,
            "end_jd": end_jd,
        })
        current_jd = end_jd
    return dashas


SIGN_LORDS = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"]

def sign_lord(idx: int) -> str:
    return SIGN_LORDS[idx % 12]


# ── Moola Dasha (Lagna-based Vimshottari) ────────────────────────────────────

def get_moola_dashas(lagna_lon: float, birth_jd: float) -> list:
    nak_idx = int(lagna_lon / (360 / 27))
    nak_elapsed_frac = (lagna_lon % (360 / 27)) / (360 / 27)

    lord = NAKSHATRA_LORDS[nak_idx]
    start_idx = VIMSHOTTARI_SEQUENCE.index(lord)
    elapsed_years = VIMSHOTTARI_YEARS[lord] * nak_elapsed_frac
    remaining_years = VIMSHOTTARI_YEARS[lord] - elapsed_years

    dashas = []
    current_jd = birth_jd

    end_jd = current_jd + remaining_years * 365.25
    dashas.append({
        "lord": lord, "nakshatra": NAKSHATRAS[nak_idx],
        "years": round(remaining_years, 4),
        "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd),
        "start_jd": current_jd, "end_jd": end_jd,
    })
    current_jd = end_jd

    for i in range(1, 50):
        li = (start_idx + i) % 9
        l = VIMSHOTTARI_SEQUENCE[li]
        y = VIMSHOTTARI_YEARS[l]
        end_jd = current_jd + y * 365.25
        dashas.append({
            "lord": l, "nakshatra": "",
            "years": y,
            "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd),
            "start_jd": current_jd, "end_jd": end_jd,
        })
        current_jd = end_jd
        if current_jd > birth_jd + 120 * 365.25:
            break

    return dashas


# ── Tara Dasha ───────────────────────────────────────────────────────────────
# 9 Taras, each ruled by nakshatra group lord, 9 years each = 81 year cycle.
# Tara sequence repeats Vimshottari lords in different order? No —
# Tara Dasha: each Tara period = nakshatra lord of 1st nak in that tara group × 9 years.
# The 9 nakshatras in Moon's group start cycle, then shift by 9.

TARA_NAMES = ["Janma","Sampat","Vipat","Kshema","Pratyak","Sadhana","Naidhana","Mitra","Parama Mitra"]
TARA_YEARS = 9  # each tara = 9 years

def get_tara_dashas(moon_lon: float, birth_jd: float) -> list:
    nak_idx = int(moon_lon / (360 / 27))
    nak_elapsed_frac = (moon_lon % (360 / 27)) / (360 / 27)

    # Which tara does birth nakshatra fall in?
    tara_idx = nak_idx % 9
    lord = NAKSHATRA_LORDS[nak_idx]

    elapsed_years = TARA_YEARS * nak_elapsed_frac
    remaining_years = TARA_YEARS - elapsed_years

    dashas = []
    current_jd = birth_jd

    end_jd = current_jd + remaining_years * 365.25
    dashas.append({
        "tara": TARA_NAMES[tara_idx],
        "lord": lord,
        "nakshatra": NAKSHATRAS[nak_idx],
        "years": round(remaining_years, 4),
        "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd),
        "start_jd": current_jd, "end_jd": end_jd,
    })
    current_jd = end_jd

    for i in range(1, 50):
        ti = (tara_idx + i) % 9
        nak_i = (nak_idx + i) % 27
        l = NAKSHATRA_LORDS[nak_i]
        end_jd = current_jd + TARA_YEARS * 365.25
        dashas.append({
            "tara": TARA_NAMES[ti],
            "lord": l,
            "nakshatra": NAKSHATRAS[nak_i],
            "years": TARA_YEARS,
            "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd),
            "start_jd": current_jd, "end_jd": end_jd,
        })
        current_jd = end_jd
        if current_jd > birth_jd + 120 * 365.25:
            break

    return dashas


# ── Request / Endpoints ───────────────────────────────────────────────────────

class MiscDashaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


def mark_active(dashas: list, birth_jd: float) -> list:
    from datetime import datetime
    _now = datetime.utcnow()
    now_jd = swe.julday(_now.year, _now.month, _now.day, _now.hour)
    for d in dashas:
        d["is_active"] = d["start_jd"] <= now_jd <= d["end_jd"]
    return dashas


@router.post("/sthira_dasha")
def compute_sthira(req: MiscDashaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    lagna_sign_idx = asc["sign_index"]

    dashas = mark_active(get_sthira_dashas(lagna_sign_idx, jd), jd)
    return {
        "dashas": dashas,
        "lagna_sign": asc["sign"],
        "cycle_years": 84,
        "system": "Sthira (Fixed Sign) Dasha — 7 years per sign from Lagna",
    }


@router.post("/moola_dasha")
def compute_moola(req: MiscDashaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    lagna_lon = asc["longitude"]

    nak_idx = int(lagna_lon / (360 / 27))
    dashas = mark_active(get_moola_dashas(lagna_lon, jd), jd)
    return {
        "dashas": dashas,
        "lagna_nakshatra": NAKSHATRAS[nak_idx],
        "cycle_years": 120,
        "system": "Moola Dasha — Vimshottari keyed to Lagna nakshatra",
    }


@router.post("/tara_dasha")
def compute_tara(req: MiscDashaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    moon_lon = planets["Moon"]["longitude"]

    nak_idx = int(moon_lon / (360 / 27))
    dashas = mark_active(get_tara_dashas(moon_lon, jd), jd)
    return {
        "dashas": dashas,
        "moon_nakshatra": NAKSHATRAS[nak_idx],
        "cycle_years": 81,
        "system": "Tara Dasha — 9 Taras × 9 years from Moon nakshatra",
    }
