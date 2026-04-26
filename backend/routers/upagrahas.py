"""
Upagrahas — Shadow/sub-planets calculated from Sun's position.
Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu.
Plus: Gulika (Mandi), Maandi, Kaala, Mrityu, Ardhaprahara, Yamaganda.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, get_ayanamsa, SIGNS
import swisseph as swe
import math

router = APIRouter()


def get_sunrise_sunset_jd(year, month, day, lat, lon):
    noon_jd = swe.julday(year, month, day, 12.0)
    rise = swe.rise_trans(noon_jd - 0.5, swe.SUN, swe.CALC_RISE, (lon, lat, 0), 1013.25, 15)
    set_ = swe.rise_trans(noon_jd - 0.5, swe.SUN, swe.CALC_SET,  (lon, lat, 0), 1013.25, 15)
    sunrise_jd = rise[1][0] if rise[0] == 0 else noon_jd - 0.25
    sunset_jd = set_[1][0] if set_[0] == 0 else noon_jd + 0.25
    return sunrise_jd, sunset_jd


def get_sign_degree(lon):
    lon = lon % 360
    sign_idx = int(lon / 30)
    degree = lon % 30
    return SIGNS[sign_idx], round(degree, 4), sign_idx


# Day-of-week lords for Gulika/Kaala/etc.
WEEKDAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

# Hour lords for each weekday (Hora sequence)
# Gulika = 8th hora lord counted from weekday lord
HORA_LORDS = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"]

# Gulika positions: fraction of day (sunrise to sunset split into 8 parts)
# Gulika occupies the start of hora 8 (0-indexed)
GULIKA_HORA_PART = {
    0: 6,  # Sun (Sunday) → Gulika in 7th part
    1: 5,  # Moon (Monday) → 6th
    2: 4,  # Mars (Tuesday) → 5th
    3: 3,  # Mercury (Wednesday) → 4th
    4: 2,  # Jupiter (Thursday) → 3rd
    5: 1,  # Venus (Friday) → 2nd
    6: 0,  # Saturn (Saturday) → 1st
}


class UpagrahaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/upagrahas")
def compute_upagrahas(req: UpagrahaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc["sign_index"]

    sun_lon = planets["Sun"]["longitude"]
    ayan = get_ayanamsa(jd, req.ayanamsa)

    # ── Dhuma = Sun + 133°20' (4s 13°20') ──
    dhuma_lon = (sun_lon + 133 + 20/60) % 360
    dhuma_sign, dhuma_deg, dhuma_idx = get_sign_degree(dhuma_lon)

    # ── Vyatipata = 360 - Dhuma ──
    vyatipata_lon = (360 - dhuma_lon) % 360
    vy_sign, vy_deg, vy_idx = get_sign_degree(vyatipata_lon)

    # ── Parivesha = Vyatipata + 180° ──
    parivesha_lon = (vyatipata_lon + 180) % 360
    pv_sign, pv_deg, pv_idx = get_sign_degree(parivesha_lon)

    # ── Indrachapa = 360 - Parivesha ──
    indrachapa_lon = (360 - parivesha_lon) % 360
    ic_sign, ic_deg, ic_idx = get_sign_degree(indrachapa_lon)

    # ── Upaketu = Sun + 30° ──
    upaketu_lon = (sun_lon + 30) % 360
    uk_sign, uk_deg, uk_idx = get_sign_degree(upaketu_lon)

    # ── Gulika (Mandi) — from sunrise ──
    sunrise_jd, sunset_jd = get_sunrise_sunset_jd(
        req.year, req.month, req.day, req.latitude, req.longitude)
    day_duration = sunset_jd - sunrise_jd  # in JD days
    hora_duration = day_duration / 8.0     # each of 8 parts

    # Weekday of birth (0=Sun, 1=Mon, ... 6=Sat)
    dow = int(jd + 1.5) % 7
    gulika_part = GULIKA_HORA_PART[dow]
    gulika_jd = sunrise_jd + gulika_part * hora_duration

    # Get ascendant longitude at Gulika JD
    _, gulika_ascmc = swe.houses(gulika_jd, req.latitude, req.longitude, b'P')
    gulika_lon = (gulika_ascmc[0] - ayan) % 360
    gu_sign, gu_deg, gu_idx = get_sign_degree(gulika_lon)
    gulika_house = (gu_idx - asc_idx) % 12 + 1

    # ── Yamaganda ──
    yama_parts = {0: 4, 1: 3, 2: 2, 3: 1, 4: 0, 5: 6, 6: 5}
    yama_jd = sunrise_jd + yama_parts.get(dow, 0) * hora_duration
    _, yama_ascmc = swe.houses(yama_jd, req.latitude, req.longitude, b'P')
    yama_lon = (yama_ascmc[0] - ayan) % 360
    yama_sign, yama_deg, yama_idx = get_sign_degree(yama_lon)

    # ── Kaala ──
    kala_parts = {0: 1, 1: 0, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2}
    kala_jd = sunrise_jd + kala_parts.get(dow, 0) * hora_duration
    _, kala_ascmc = swe.houses(kala_jd, req.latitude, req.longitude, b'P')
    kala_lon = (kala_ascmc[0] - ayan) % 360
    kala_sign, kala_deg, kala_idx = get_sign_degree(kala_lon)

    def make(name, abbr, lon, sign, deg, idx, meaning, kind="shadow"):
        house = (idx - asc_idx) % 12 + 1
        return {
            "name": name, "abbr": abbr, "kind": kind,
            "longitude": round(lon, 4), "sign": sign,
            "sign_index": idx, "degree": round(deg, 4),
            "house": house, "meaning": meaning,
        }

    upagrahas = [
        make("Dhuma",     "Dh",  dhuma_lon,     dhuma_sign,    dhuma_deg,    dhuma_idx,    "Inauspicious shadow, smoke, bad fate"),
        make("Vyatipata", "Vy",  vyatipata_lon, vy_sign,       vy_deg,       vy_idx,       "Calamity, sudden misfortune"),
        make("Parivesha", "Pv",  parivesha_lon, pv_sign,       pv_deg,       pv_idx,       "Halo, obstacles, Saturn-like"),
        make("Indrachapa","Ic",  indrachapa_lon,ic_sign,       ic_deg,       ic_idx,       "Bow of Indra, hidden power"),
        make("Upaketu",   "Uk",  upaketu_lon,   uk_sign,       uk_deg,       uk_idx,       "Sub-node, comet-like, Ketu type"),
        {**make("Gulika", "Gu", gulika_lon, gu_sign, gu_deg, gu_idx,
                "Son of Saturn, most malefic Upagraha. House = area of damage.", "gulika"),
         "house": gulika_house},
        make("Yamaganda", "Ym",  yama_lon,      yama_sign,     yama_deg,     yama_idx,     "Region of Yama, death-like inauspiciousness"),
        make("Kaala",     "Ka",  kala_lon,      kala_sign,     kala_deg,     kala_idx,     "Time lord, Saturn associate"),
    ]

    return {
        "ascendant": asc,
        "upagrahas": upagrahas,
        "gulika_house": gulika_house,
        "gulika_sign": gu_sign,
        "weekday": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow],
        "note": "Gulika/Mandi computed from Placidus ascendant at start of its hora segment",
    }
