from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, get_vimshottari_dasha, jd_to_datetime,
    VIMSHOTTARI_SEQUENCE, VIMSHOTTARI_YEARS
)
import swisseph as swe

router = APIRouter()


class BirthData(BaseModel):
    year: int
    month: int
    day: int
    hour: int
    minute: int
    tz_offset: float
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"


def get_antardashas(maha_lord: str, maha_start_jd: float, maha_years: float):
    """Calculate antardasha (sub-periods) within a mahadasha."""
    total_days = maha_years * 365.25
    antardashas = []
    start_idx = VIMSHOTTARI_SEQUENCE.index(maha_lord)
    current_jd = maha_start_jd

    for i in range(9):
        antar_lord = VIMSHOTTARI_SEQUENCE[(start_idx + i) % 9]
        antar_years = (VIMSHOTTARI_YEARS[antar_lord] / 120) * maha_years
        antar_days = antar_years * 365.25
        end_jd = current_jd + antar_days
        antardashas.append({
            "lord": antar_lord,
            "start": jd_to_datetime(current_jd),
            "end": jd_to_datetime(end_jd),
            "years": round(antar_years, 3),
        })
        current_jd = end_jd

    return antardashas


def get_pratyantardashas(maha_lord: str, antar_lord: str, antar_start_jd: float, antar_years: float):
    """Calculate pratyantardasha (3rd level) within an antardasha."""
    pratyantardashas = []
    start_idx = VIMSHOTTARI_SEQUENCE.index(antar_lord)
    current_jd = antar_start_jd
    for i in range(9):
        pratya_lord = VIMSHOTTARI_SEQUENCE[(start_idx + i) % 9]
        pratya_years = (VIMSHOTTARI_YEARS[pratya_lord] / 120) * antar_years
        end_jd = current_jd + pratya_years * 365.25
        pratyantardashas.append({
            "lord": pratya_lord,
            "start": jd_to_datetime(current_jd),
            "end": jd_to_datetime(end_jd),
            "years": round(pratya_years, 4),
        })
        current_jd = end_jd
    return pratyantardashas


def get_sookshma_dashas(pratya_lord: str, pratya_start_jd: float, pratya_years: float):
    """Calculate Sookshma dasha (4th level) within a pratyantardasha."""
    result = []
    start_idx = VIMSHOTTARI_SEQUENCE.index(pratya_lord)
    current_jd = pratya_start_jd
    for i in range(9):
        lord = VIMSHOTTARI_SEQUENCE[(start_idx + i) % 9]
        years = (VIMSHOTTARI_YEARS[lord] / 120) * pratya_years
        end_jd = current_jd + years * 365.25
        result.append({
            "lord": lord,
            "start": jd_to_datetime(current_jd),
            "end": jd_to_datetime(end_jd),
            "days": round(years * 365.25, 2),
        })
        current_jd = end_jd
    return result


def parse_jd(dt_str: str) -> float:
    parts = dt_str[:10].split('-')
    h = int(dt_str[11:13]) if len(dt_str) > 10 else 12
    m = int(dt_str[14:16]) if len(dt_str) > 15 else 0
    return swe.julday(int(parts[0]), int(parts[1]), int(parts[2]), h + m / 60)


class SookshmaRequest(BaseModel):
    maha_lord: str
    antar_lord: str
    pratya_lord: str
    pratya_start: str   # ISO datetime string
    pratya_years: float


@router.post("/dasha/sookshma")
def get_sookshma(req: SookshmaRequest):
    pratya_start_jd = parse_jd(req.pratya_start)
    sookshmas = get_sookshma_dashas(req.pratya_lord, pratya_start_jd, req.pratya_years)
    return {
        "maha": req.maha_lord,
        "antar": req.antar_lord,
        "pratya": req.pratya_lord,
        "sookshma_dashas": sookshmas,
    }


@router.post("/dasha")
def get_dasha(data: BirthData):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa)
    moon_lon = planets["Moon"]["longitude"]
    dashas = get_vimshottari_dasha(moon_lon, jd)

    result = []
    moon_nakshatra_idx = int(moon_lon / (360 / 27))
    from core.engine import NAKSHATRA_LORDS, NAKSHATRAS
    elapsed_fraction = (moon_lon % (360 / 27)) / (360 / 27)
    first_lord = NAKSHATRA_LORDS[moon_nakshatra_idx]
    from core.engine import VIMSHOTTARI_YEARS as VY
    dasha_balance_years = round(VY[first_lord] * (1 - elapsed_fraction), 3)
    dasha_balance_days = round(dasha_balance_years * 365.25)

    for d in dashas[:9]:  # one full 120yr cycle
        antardashas = get_antardashas(d["lord"], d["start_jd"], d["years"])
        for ad in antardashas:
            try:
                ad_start_jd = parse_jd(ad["start"])
            except Exception:
                continue
            ad["pratyantardashas"] = get_pratyantardashas(d["lord"], ad["lord"], ad_start_jd, ad["years"])

        result.append({
            "lord": d["lord"],
            "start": jd_to_datetime(d["start_jd"]),
            "end": jd_to_datetime(d["end_jd"]),
            "years": round(d["years"], 3),
            "antardashas": antardashas,
        })

    return {
        "dashas": result,
        "dasha_balance": {
            "lord": first_lord,
            "years": dasha_balance_years,
            "days": dasha_balance_days,
            "nakshatra": NAKSHATRAS[moon_nakshatra_idx],
        }
    }
