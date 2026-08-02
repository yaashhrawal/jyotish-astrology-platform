from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, assign_planets_to_houses, SIGNS
import swisseph as swe_module
from core.engine import EPHE_FLAG

router = APIRouter()

class BirthData(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


# ── Mangal Dosha ──────────────────────────────────────────────────────────────
# Mars in 1,2,4,7,8,12 from Lagna OR Moon OR Venus → Mangal dosha
MANGAL_HOUSES = {1, 2, 4, 7, 8, 12}

MANGAL_CANCELLATIONS = [
    "Mars in Aries or Scorpio (own sign) cancels dosha",
    "Mars in Cancer or Capricorn (exaltation/debilitation) — check context",
    "Mars aspected by Jupiter — mitigated",
    "Both partners have Mangal dosha — cancelled",
    "Mars in 2nd for Gemini/Virgo lagna — not dosha",
    "Mars in 12th for Taurus/Libra lagna — not dosha",
]

def check_mangal_dosha(planets: dict, asc_sign_idx: int) -> dict:
    mars = planets.get("Mars")
    moon = planets.get("Moon")
    venus = planets.get("Venus")
    if not mars:
        return {"has_dosha": False}

    mars_idx = mars["sign_index"]

    def house_from(ref_sign_idx: int) -> int:
        return ((mars_idx - ref_sign_idx) % 12) + 1

    from_lagna = house_from(asc_sign_idx)
    from_moon  = house_from(moon["sign_index"]) if moon else None
    from_venus = house_from(venus["sign_index"]) if venus else None

    triggers = []
    if from_lagna in MANGAL_HOUSES:
        triggers.append(f"Mars in H{from_lagna} from Lagna")
    if from_moon and from_moon in MANGAL_HOUSES:
        triggers.append(f"Mars in H{from_moon} from Moon")
    if from_venus and from_venus in MANGAL_HOUSES:
        triggers.append(f"Mars in H{from_venus} from Venus")

    has_dosha = len(triggers) > 0
    severity = "High" if len(triggers) >= 2 else "Moderate" if len(triggers) == 1 else "None"

    # Check own sign / exaltation cancellation
    cancellations = []
    if mars["sign"] in ["Aries", "Scorpio"]:
        cancellations.append("Mars in own sign — dosha mitigated")
    if mars["sign"] == "Capricorn":
        cancellations.append("Mars exalted — dosha significantly reduced")

    return {
        "has_dosha": has_dosha,
        "severity": severity,
        "triggers": triggers,
        "mars_sign": mars["sign"],
        "mars_house_from_lagna": from_lagna,
        "mars_house_from_moon": from_moon,
        "mars_house_from_venus": from_venus,
        "cancellations": cancellations,
        "remedies": [
            "Marry after age 28 (Mars matures at 28)",
            "Marry someone with Mangal dosha (dosha cancels)",
            "Hanuman Chalisa recitation on Tuesdays",
            "Kumbh Vivah (symbolic marriage) ritual before actual marriage",
            "Wearing red coral (Moonga) after consultation",
        ] if has_dosha else [],
    }


# ── Kalsarpa Dosha ───────────────────────────────────────────────────────────
# All 7 planets hemmed between Rahu and Ketu (same side of the Rahu-Ketu axis)

KALSARPA_TYPES = [
    "Ananta", "Kulika", "Vasuki", "Shankhapala", "Padma",
    "Mahapadma", "Takshaka", "Karkotak", "Shankhanaad", "Patak",
    "Vishakata", "Sheshnag"
]

def check_kalsarpa_dosha(planets: dict) -> dict:
    rahu = planets.get("Rahu")
    ketu = planets.get("Ketu")
    if not rahu or not ketu:
        return {"has_dosha": False}

    rahu_lon = rahu["longitude"]
    ketu_lon = ketu["longitude"]

    planet_lons = {
        k: v["longitude"] for k, v in planets.items()
        if k not in ("Rahu", "Ketu")
    }

    # Check if all planets are between Rahu and Ketu going clockwise
    def between_clockwise(lon: float, start: float, end: float) -> bool:
        if start <= end:
            return start <= lon <= end
        return lon >= start or lon <= end

    rahu_to_ketu = between_clockwise  # Rahu → Ketu arc (clockwise)

    # Arc 1: Rahu → Ketu clockwise
    arc1 = [(rahu_lon + d) % 360 for d in range(1, 180)]
    # Check if all planets fall in arc Rahu→Ketu (hemmed by Rahu)
    def in_arc(lon: float, from_lon: float, span: float = 180) -> bool:
        diff = (lon - from_lon) % 360
        return 0 < diff < span

    all_in_rahu_ketu = all(in_arc(lon, rahu_lon) for lon in planet_lons.values())
    all_in_ketu_rahu = all(in_arc(lon, ketu_lon) for lon in planet_lons.values())

    has_dosha = all_in_rahu_ketu or all_in_ketu_rahu
    is_partial = False

    if not has_dosha:
        # Partial if 5 or 6 planets hemmed
        count_rahu_side = sum(1 for lon in planet_lons.values() if in_arc(lon, rahu_lon))
        is_partial = count_rahu_side >= 5

    # Determine type based on Rahu's house
    rahu_sign_idx = rahu["sign_index"]
    kalsarpa_type = KALSARPA_TYPES[rahu_sign_idx]

    # Exception: planet conjunct Rahu or Ketu breaks the dosha
    rahu_conjunct = any(abs((lon - rahu_lon + 360) % 360) < 8 for lon in planet_lons.values())
    ketu_conjunct = any(abs((lon - ketu_lon + 360) % 360) < 8 for lon in planet_lons.values())
    exception = rahu_conjunct or ketu_conjunct

    return {
        "has_dosha": has_dosha and not exception,
        "is_partial": is_partial,
        "type": kalsarpa_type if has_dosha else None,
        "direction": "Rahu→Ketu (serpent faces forward)" if all_in_rahu_ketu else "Ketu→Rahu (serpent faces backward)" if all_in_ketu_rahu else None,
        "exception_breaks_dosha": exception,
        "rahu_sign": rahu["sign"],
        "ketu_sign": ketu["sign"],
        "effects": [
            f"{kalsarpa_type} Kalsarpa causes obstacles in matters of H{rahu_sign_idx + 1}",
            "Delays in achieving goals despite hard work",
            "Recurring setbacks until Rahu-Ketu axis planets mature",
            "Strong after age 42 when Rahu matures",
        ] if has_dosha and not exception else [],
        "remedies": [
            "Kalsarpa Shanti Puja at Trimbakeshwar / Ujjain",
            "Nag Panchami fasting and prayers",
            "Chanting 'Om Namah Shivaya' 108 times daily",
            "Wearing Gomed (Hessonite) for Rahu after consultation",
        ] if has_dosha and not exception else [],
    }


# ── Sadesati ─────────────────────────────────────────────────────────────────
# Saturn transits natal Moon sign ± 1 sign = 7.5 years
# Three phases: Rising (sign before), Peak (Moon sign), Setting (sign after)

from datetime import datetime, timezone, timedelta

def check_sadesati(natal_moon_sign_idx: int, birth_jd: float, ayanamsa_str: str) -> dict:
    from core.engine import get_ayanamsa, tropical_to_sidereal, get_sign_and_degree

    now = datetime.now(timezone.utc)
    now_jd = swe_module.julday(now.year, now.month, now.day, now.hour + now.minute/60.0)

    ayan = get_ayanamsa(now_jd, ayanamsa_str)
    saturn_r, _ = swe_module.calc_ut(now_jd, swe_module.SATURN, EPHE_FLAG)
    saturn_sid = tropical_to_sidereal(saturn_r[0], ayan)
    _, _, saturn_sign_idx = get_sign_and_degree(saturn_sid)

    moon_sign = SIGNS[natal_moon_sign_idx]
    before_sign_idx = (natal_moon_sign_idx - 1) % 12
    after_sign_idx  = (natal_moon_sign_idx + 1) % 12

    phase = None
    in_sadesati = False
    if saturn_sign_idx == before_sign_idx:
        phase = "Rising Phase (Dhaiya 1) — financial/family stress"
        in_sadesati = True
    elif saturn_sign_idx == natal_moon_sign_idx:
        phase = "Peak Phase — maximum intensity, transformation"
        in_sadesati = True
    elif saturn_sign_idx == after_sign_idx:
        phase = "Setting Phase (Dhaiya 3) — gradual relief"
        in_sadesati = True

    # Estimate past/next sadesati (Saturn ~29.5yr cycle, each sign ~2.5yr)
    # Look back/forward from birth
    past_occurrences = []
    future_start = None

    # Count from birth year — simple approximation
    birth_year = int(str(birth_jd)[:4]) if False else now.year  # approximate
    saturn_period_years = 29.5
    for offset in [-2, -1, 0, 1, 2]:
        approx_year = now.year + offset * int(saturn_period_years)
        if approx_year < now.year - 1:
            past_occurrences.append(f"~{approx_year}–{approx_year + 8}")
        elif approx_year > now.year:
            if future_start is None:
                future_start = approx_year

    return {
        "in_sadesati": in_sadesati,
        "current_phase": phase,
        "moon_sign": moon_sign,
        "saturn_current_sign": SIGNS[saturn_sign_idx],
        "sadesati_signs": [SIGNS[before_sign_idx], moon_sign, SIGNS[after_sign_idx]],
        "duration_years": 7.5,
        "effects": [
            "Period of karmic cleansing and lessons",
            "Delays and obstacles test patience",
            "Health concerns for self or parents",
            "Career restructuring — not permanent setback",
            "Spiritual growth and inner strength",
        ] if in_sadesati else [],
        "remedies": [
            "Shani Stotra / Hanuman Chalisa on Saturdays",
            "Donate black sesame, mustard oil on Saturdays",
            "Wear iron ring on right middle finger",
            "Avoid major life decisions in peak phase",
            "Blue Sapphire (Neelam) only after detailed horoscope check",
        ] if in_sadesati else [],
        "note": "Next Sadesati expected ~" + str(future_start) if future_start else "",
    }


# ── Upagrahas ────────────────────────────────────────────────────────────────
# Gulika (son of Saturn), Mandi — important shadow planets

def calculate_upagrahas(jd: float, lat: float, lon: float, tz_offset: float, ayanamsa_str: str) -> dict:
    from core.engine import get_ayanamsa, tropical_to_sidereal, get_sign_and_degree, calculate_houses

    ayan = get_ayanamsa(jd, ayanamsa_str)
    from core.engine import birth_to_jd as b2jd
    import math

    # Sunrise approximation for the birth day
    # Gulika = Saturn's portion of the day
    # Day divided into 8 parts; Saturn rules a specific part based on weekday
    y, m, d, h = swe_module.revjul(jd)
    sunrise_jd = swe_module.julday(int(y), int(m), int(d), 6.0 - tz_offset / 24)  # approx 6 AM local

    # Day duration ~12 hours = 0.5 JD
    day_duration = 0.5
    part_duration = day_duration / 8  # each part

    # Weekday (0=Sun)
    day_of_week = int(jd + 1.5) % 7
    # Gulika part index by weekday (BPHS)
    GULIKA_PART = [6, 5, 4, 3, 2, 1, 0]  # Sun=6, Mon=5 ... Sat=0
    gulika_part = GULIKA_PART[day_of_week]
    gulika_jd = sunrise_jd + gulika_part * part_duration + part_duration / 2

    # Gulika/Mandi = the LAGNA (ascendant) RISING at that moment — NOT Saturn's
    # own longitude. Compute the rising sidereal longitude via house cusps.
    def _rising_sid(t: float) -> float:
        _cusps, ascmc = swe_module.houses(t, lat, lon, b'P')
        return tropical_to_sidereal(ascmc[0], ayan)

    gulika_sid = _rising_sid(gulika_jd)
    g_sign, g_deg, g_sign_idx = get_sign_and_degree(gulika_sid)

    # Mandi — different day-portion, same rising-lagna method
    MANDI_PART = [7, 6, 5, 4, 3, 2, 1]
    mandi_part = MANDI_PART[day_of_week]
    mandi_jd = sunrise_jd + mandi_part * part_duration + part_duration / 2
    mandi_sid = _rising_sid(mandi_jd)
    m_sign, m_deg, m_sign_idx = get_sign_and_degree(mandi_sid)

    house_data = calculate_houses(jd, lat, lon, ayanamsa_str)
    asc_idx = house_data["ascendant"]["sign_index"]
    gulika_house = ((g_sign_idx - asc_idx) % 12) + 1
    mandi_house  = ((m_sign_idx - asc_idx) % 12) + 1

    return {
        "gulika": {
            "sign": g_sign, "degree": round(g_deg, 2),
            "sign_index": g_sign_idx, "house": gulika_house,
            "significance": "Son of Saturn — malefic point, poisons the house it occupies"
        },
        "mandi": {
            "sign": m_sign, "degree": round(m_deg, 2),
            "sign_index": m_sign_idx, "house": mandi_house,
            "significance": "Another form of Gulika — indicates obstacles and delays"
        },
    }


# ── Main endpoint ─────────────────────────────────────────────────────────────

@router.post("/doshas")
def get_doshas(data: BirthData):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa)
    house_data = calculate_houses(jd, data.latitude, data.longitude, data.ayanamsa)
    asc_sign_idx = house_data["ascendant"]["sign_index"]
    assign_planets_to_houses(planets, asc_sign_idx)

    mangal = check_mangal_dosha(planets, asc_sign_idx)
    kalsarpa = check_kalsarpa_dosha(planets)
    sadesati = check_sadesati((planets.get("Moon") or {}).get("sign_index", 0), jd, data.ayanamsa)
    upagrahas = calculate_upagrahas(jd, data.latitude, data.longitude, data.tz_offset, data.ayanamsa)

    return {
        "mangal_dosha": mangal,
        "kalsarpa_dosha": kalsarpa,
        "sadesati": sadesati,
        "upagrahas": upagrahas,
        "summary": {
            "mangal": mangal["has_dosha"],
            "kalsarpa": kalsarpa["has_dosha"],
            "sadesati": sadesati["in_sadesati"],
        }
    }
