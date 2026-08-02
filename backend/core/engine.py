"""
Core Vedic astrology calculation engine using Swiss Ephemeris (pyswisseph).
Prefers the full Swiss Ephemeris (.se1 DE431 files) when present — byte-identical to
astro.com; falls back to the built-in Moshier ephemeris otherwise (still ~1 arcsec).
Use the shared EPHE_FLAG everywhere instead of a hardcoded FLG_MOSEPH/FLG_SWIEPH.
"""
import os
import swisseph as swe
from datetime import datetime, timezone
import math

# Prefer full Swiss Ephemeris files if bundled (backend/ephe/*.se1), else Moshier.
_EPHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ephe")
if os.path.isdir(_EPHE_DIR) and any(f.endswith(".se1") for f in os.listdir(_EPHE_DIR)):
    swe.set_ephe_path(_EPHE_DIR)
    EPHE_FLAG = swe.FLG_SWIEPH
else:
    swe.set_ephe_path(None)
    EPHE_FLAG = swe.FLG_MOSEPH

AYANAMSA_MAP = {
    # Standard / India
    "lahiri":              swe.SIDM_LAHIRI,
    "kp":                  swe.SIDM_KRISHNAMURTI,
    "raman":               swe.SIDM_RAMAN,
    "yukteshwar":          swe.SIDM_YUKTESHWAR,
    "true_chitra":         swe.SIDM_TRUE_CITRA,
    # Western / historical
    "fagan_bradley":       swe.SIDM_FAGAN_BRADLEY,
    "de_luce":             swe.SIDM_DELUCE,
    "usha_shashi":         swe.SIDM_USHASHASHI,
    "sassanian":           swe.SIDM_SASSANIAN,
    "galactic_center":     swe.SIDM_GALCENT_0SAG,
    "j2000":               swe.SIDM_J2000,
    "jn95":                swe.SIDM_JN_BHASIN,
    "babyl_huber":         swe.SIDM_BABYL_HUBER,
    "hipparcos":           swe.SIDM_HIPPARCHOS,
    "aldebaran_15tau":     swe.SIDM_ALDEBARAN_15TAU,
    # Surya Siddhanta variants
    "suryasiddhanta":      swe.SIDM_SS_REVATI,
    "suryasiddhanta_citra": swe.SIDM_SS_CITRA,
    "true_revati":         swe.SIDM_TRUE_REVATI,
    "true_pushya":         swe.SIDM_TRUE_PUSHYA,
    # Classical Indian
    "aryabhata":           swe.SIDM_ARYABHATA,
}

PLANET_IDS = {
    "Sun":     swe.SUN,
    "Moon":    swe.MOON,
    "Mars":    swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus":   swe.VENUS,
    "Saturn":  swe.SATURN,
}

RAHU_KETU = True  # calculated separately as mean nodes

SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
    "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury"
]

EXALTATION = {
    "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn",
    "Mercury": "Virgo", "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra"
}
DEBILITATION = {
    "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer",
    "Mercury": "Pisces", "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries"
}
OWN_SIGN = {
    "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"],
    "Rahu": [], "Ketu": []
}

VIMSHOTTARI_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
VIMSHOTTARI_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}


def birth_to_jd(year: int, month: int, day: int, hour: float, minute: float, tz_offset: float) -> float:
    """Convert birth datetime to Julian Day (UT)."""
    decimal_time = hour + minute / 60.0 - tz_offset
    return swe.julday(year, month, day, decimal_time)


def get_ayanamsa(jd: float, ayanamsa: str = "lahiri") -> float:
    swe.set_sid_mode(AYANAMSA_MAP.get(ayanamsa, swe.SIDM_LAHIRI))
    return swe.get_ayanamsa_ut(jd)


def tropical_to_sidereal(tropical_lon: float, ayanamsa_val: float) -> float:
    return (tropical_lon - ayanamsa_val) % 360


def get_sign_and_degree(sidereal_lon: float):
    sign_index = int(sidereal_lon / 30)
    degree_in_sign = sidereal_lon % 30
    return SIGNS[sign_index], round(degree_in_sign, 4), sign_index


def get_nakshatra(sidereal_lon: float):
    nak_index = int(sidereal_lon / (360 / 27))
    pada = int((sidereal_lon % (360 / 27)) / (360 / 108)) + 1
    return NAKSHATRA_LORDS[nak_index], NAKSHATRAS[nak_index], pada


def get_planet_status(planet: str, sign: str) -> str:
    if sign == EXALTATION.get(planet):
        return "exalted"
    if sign == DEBILITATION.get(planet):
        return "debilitated"
    if sign in OWN_SIGN.get(planet, []):
        return "own_sign"
    return "neutral"


def calculate_planets(jd: float, ayanamsa: str = "lahiri", node_type: str = "true") -> dict:
    ayan = get_ayanamsa(jd, ayanamsa)
    planets = {}

    for name, pid in PLANET_IDS.items():
        result, _ = swe.calc_ut(jd, pid, EPHE_FLAG | swe.FLG_SPEED)
        trop_lon = result[0]
        speed = result[3]
        sid_lon = tropical_to_sidereal(trop_lon, ayan)
        sign, deg, sign_idx = get_sign_and_degree(sid_lon)
        nak_lord, nak_name, pada = get_nakshatra(sid_lon)
        is_retrograde = speed < 0

        planets[name] = {
            "longitude": round(sid_lon, 4),
            "sign": sign,
            "sign_index": sign_idx,
            "degree": deg,
            "nakshatra": nak_name,
            "nakshatra_lord": nak_lord,
            "pada": pada,
            "retrograde": is_retrograde,
            "speed": round(speed, 6),
            "status": get_planet_status(name, sign),
        }

    # Rahu / Ketu — True Node or Mean Node
    node_id = swe.TRUE_NODE if node_type == "true" else swe.MEAN_NODE
    node_result, _ = swe.calc_ut(jd, node_id, EPHE_FLAG)
    rahu_trop = node_result[0]
    rahu_sid = tropical_to_sidereal(rahu_trop, ayan)
    ketu_sid = (rahu_sid + 180) % 360

    for name, sid_lon in [("Rahu", rahu_sid), ("Ketu", ketu_sid)]:
        sign, deg, sign_idx = get_sign_and_degree(sid_lon)
        nak_lord, nak_name, pada = get_nakshatra(sid_lon)
        planets[name] = {
            "longitude": round(sid_lon, 4),
            "sign": sign,
            "sign_index": sign_idx,
            "degree": deg,
            "nakshatra": nak_name,
            "nakshatra_lord": nak_lord,
            "pada": pada,
            "retrograde": True,  # nodes always retrograde
            "speed": 0,
            "status": "neutral",
        }

    return planets


HOUSE_SYSTEM_MAP = {
    "placidus":       b"P",
    "koch":           b"K",
    "regiomontanus":  b"R",
    "campanus":       b"C",
    "equal":          b"E",
    "whole_sign":     b"W",
    "sripathi":       b"S",
    "alcabitius":     b"B",
    "morinus":        b"M",
    "porphyry":       b"O",
}


def calculate_houses(jd: float, lat: float, lon: float, ayanamsa: str = "lahiri", house_system: str = "placidus") -> dict:
    """Calculate all 12 house cusps using the specified house system."""
    ayan = get_ayanamsa(jd, ayanamsa)
    hsys = HOUSE_SYSTEM_MAP.get(house_system, b"P")
    cusps, ascmc = swe.houses(jd, lat, lon, hsys)

    houses = {}
    # pyswisseph 2.x returns 12-element tuple (house 1 first); older returned 13 with index 0 unused.
    cusp_iter = cusps[1:] if len(cusps) >= 13 else cusps
    for i, cusp in enumerate(cusp_iter, 1):
        sid_cusp = tropical_to_sidereal(cusp, ayan)
        sign, deg, sign_idx = get_sign_and_degree(sid_cusp)
        houses[i] = {
            "cusp_longitude": round(sid_cusp, 4),
            "sign": sign,
            "sign_index": sign_idx,
            "degree": deg,
        }

    # Ascendant
    asc_trop = ascmc[0]
    asc_sid = tropical_to_sidereal(asc_trop, ayan)
    asc_sign, asc_deg, asc_sign_idx = get_sign_and_degree(asc_sid)

    return {
        "houses": houses,
        "ascendant": {
            "longitude": round(asc_sid, 4),
            "sign": asc_sign,
            "sign_index": asc_sign_idx,
            "degree": asc_deg,
        }
    }


def assign_planets_to_houses(planets: dict, ascendant_sign_index: int) -> dict:
    """Assign each planet to its Bhava (house) based on sign from ascendant."""
    house_map = {}
    for planet, data in planets.items():
        planet_sign_idx = data["sign_index"]
        house_num = ((planet_sign_idx - ascendant_sign_index) % 12) + 1
        data["house"] = house_num
        house_map.setdefault(house_num, []).append(planet)
    return house_map


def calculate_atmakaraka(planets: dict) -> str:
    """Planet with highest degree (ignoring Rahu/Ketu) = Atmakaraka."""
    candidates = {k: v["degree"] for k, v in planets.items() if k not in ("Rahu", "Ketu")}
    return max(candidates, key=candidates.get)


def get_vimshottari_dasha(moon_longitude: float, birth_jd: float):
    """Calculate Vimshottari dasha periods from birth."""
    nak_index = int(moon_longitude / (360 / 27))
    nak_lord = NAKSHATRA_LORDS[nak_index]
    elapsed_fraction = (moon_longitude % (360 / 27)) / (360 / 27)

    # Find starting dasha lord
    start_lord_idx = VIMSHOTTARI_SEQUENCE.index(nak_lord)
    elapsed_years = VIMSHOTTARI_YEARS[nak_lord] * elapsed_fraction
    remaining_years = VIMSHOTTARI_YEARS[nak_lord] - elapsed_years

    dashas = []
    current_jd = birth_jd
    # First partial dasha
    seq_idx = start_lord_idx
    lord = VIMSHOTTARI_SEQUENCE[seq_idx]
    years = remaining_years
    end_jd = current_jd + years * 365.25
    dashas.append({"lord": lord, "start_jd": current_jd, "end_jd": end_jd, "years": round(years, 4)})
    current_jd = end_jd

    # Remaining full dashas (at least 3 full cycles = 360 years)
    for _ in range(40):
        seq_idx = (seq_idx + 1) % 9
        lord = VIMSHOTTARI_SEQUENCE[seq_idx]
        years = VIMSHOTTARI_YEARS[lord]
        end_jd = current_jd + years * 365.25
        dashas.append({"lord": lord, "start_jd": current_jd, "end_jd": end_jd, "years": years})
        current_jd = end_jd

    return dashas


def jd_to_datetime(jd: float) -> str:
    y, m, d, h = swe.revjul(jd)
    hour = int(h)
    minute = int((h - hour) * 60)
    return f"{y:04d}-{m:02d}-{d:02d} {hour:02d}:{minute:02d}"
