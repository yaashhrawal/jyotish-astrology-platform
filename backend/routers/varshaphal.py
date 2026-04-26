"""
Varshaphal — Solar Return chart (annual chart).
Sun returns to exact natal longitude each year.
"""
from fastapi import APIRouter
from pydantic import BaseModel
import swisseph as swe
from core.engine import (
    get_ayanamsa, tropical_to_sidereal, get_sign_and_degree,
    get_nakshatra, get_planet_status, calculate_planets,
    calculate_houses, assign_planets_to_houses, SIGNS, NAKSHATRAS, NAKSHATRA_LORDS,
    PLANET_IDS, jd_to_datetime
)

router = APIRouter()

YEAR_LORDS_SEQ = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]  # day-of-week lords

# Tajika aspect orbs (degrees) — Ptolemaic but tighter in Tajika
TAJIKA_ASPECTS = {
    "Conjunction":  {"degrees": 0,   "orb": 13},
    "Opposition":   {"degrees": 180, "orb": 13},
    "Trine":        {"degrees": 120, "orb": 12},
    "Square":       {"degrees": 90,  "orb": 9},
    "Sextile":      {"degrees": 60,  "orb": 7},
}

def compute_tajika_aspects(planets: dict) -> list:
    """
    Compute Tajika aspects between all planet pairs.
    Determines Ithasala (applying), Ishrafa (separating), Muthasila (transfer of light),
    Yamaya (same degree), Nakta (via third planet).
    """
    planet_list = [
        (name, pd["longitude"] % 360, pd.get("speed_lon", 1.0), pd.get("retrograde", False))
        for name, pd in planets.items()
        if name not in ("Rahu", "Ketu")
    ]

    results = []
    for i in range(len(planet_list)):
        n1, lon1, sp1, r1 = planet_list[i]
        for j in range(i + 1, len(planet_list)):
            n2, lon2, sp2, r2 = planet_list[j]
            raw_diff = (lon2 - lon1 + 360) % 360
            diff = raw_diff if raw_diff <= 180 else 360 - raw_diff

            for asp_name, asp in TAJIKA_ASPECTS.items():
                orb = abs(diff - asp["degrees"])
                if orb > asp["orb"]:
                    continue

                # Ithasala = faster planet applying to slower (approaching exact)
                # Ishrafa = separating
                faster, slower = (n1, sp1, lon1, r1), (n2, sp2, lon2, r2)
                if abs(sp2) > abs(sp1):
                    faster, slower = (n2, sp2, lon2, r2), (n1, sp1, lon1, r1)

                # Applying: faster moves toward exact aspect with slower
                applying = not faster[3]  # not retrograde = applying (simplified)

                tajika_type = "Ithasala" if applying else "Ishrafa"
                if orb < 1.0:
                    tajika_type = "Yamaya"  # within 1° = same degree

                results.append({
                    "planet1": n1,
                    "planet2": n2,
                    "aspect": asp_name,
                    "orb": round(orb, 2),
                    "tajika_type": tajika_type,
                    "applying": applying,
                    "description": f"{n1}–{n2} {asp_name} ({tajika_type}, {round(orb,2)}° orb)",
                })
                break

    results.sort(key=lambda x: x["orb"])
    return results


def find_solar_return_jd(natal_sun_lon: float, birth_jd: float, target_year: int) -> float:
    """Find JD when Sun returns to natal longitude in target solar year."""
    # Approximate: Sun moves ~1°/day, 365.25 days/year
    # Start ~6 months before expected return
    approx_jd = birth_jd + (target_year) * 365.25 - 10
    # Iterate to refine
    for _ in range(50):
        result, _ = swe.calc_ut(approx_jd, swe.SUN, swe.FLG_SWIEPH | swe.FLG_SPEED)
        trop_sun = result[0]
        speed = result[3]
        # target tropical = natal sidereal + ayanamsa at birth (use current ayan for simplicity)
        # Actually just track sidereal position
        ayan = swe.get_ayanamsa_ut(approx_jd)
        sid_sun = (trop_sun - ayan) % 360
        diff = natal_sun_lon - sid_sun
        if diff > 180: diff -= 360
        if diff < -180: diff += 360
        if abs(diff) < 0.0001:
            break
        approx_jd += diff / speed
    return approx_jd


def get_muntha(birth_year: int, return_year: int, birth_asc_sign_idx: int) -> dict:
    """Muntha advances 1 sign per year from birth ascendant sign."""
    years_elapsed = return_year - birth_year
    muntha_sign_idx = (birth_asc_sign_idx + years_elapsed - 1) % 12
    muntha_sign = SIGNS[muntha_sign_idx]
    house = (muntha_sign_idx - birth_asc_sign_idx) % 12 + 1
    return {"sign": muntha_sign, "sign_index": muntha_sign_idx, "house": house}


def get_year_lord(return_jd: float) -> str:
    """Varshesh (year lord) = weekday lord of solar return day."""
    # JD 0 = Monday? Actually JD 0.5 = noon Jan 1, 4713 BC = Monday
    # Day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    weekday_lords = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]
    # JD day of week
    dow = int(return_jd + 1.5) % 7
    return weekday_lords[dow]


def get_tri_pataki(return_planets: dict, natal_planets: dict, return_asc_idx: int) -> list:
    """Tri-Pataki Chakra: planets in 1/5/9 from return lagna = strong."""
    strong_houses = [1, 5, 9]
    result = []
    for name, pd in return_planets.items():
        h = ((pd["sign_index"] - return_asc_idx) % 12) + 1
        if h in strong_houses:
            result.append({"planet": name, "house": h, "sign": pd["sign"]})
    return result


class VarshaphalRequest(BaseModel):
    name: str = ""
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    return_year: int  # which year's solar return to compute


@router.post("/varshaphal")
def compute_varshaphal(req: VarshaphalRequest):
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    # Natal chart
    from core.engine import birth_to_jd
    natal_jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    natal_planets_raw = calculate_planets(natal_jd, req.ayanamsa)
    natal_asc_data = calculate_houses(natal_jd, req.latitude, req.longitude, req.ayanamsa)
    natal_sun_lon = natal_planets_raw["Sun"]["longitude"]
    natal_asc_idx = natal_asc_data["ascendant"]["sign_index"]

    # Solar return JD
    years_elapsed = req.return_year - req.year
    return_jd = find_solar_return_jd(natal_sun_lon, natal_jd, years_elapsed)

    # Solar return chart — use natal coordinates (person's current location ideally, but birth for now)
    return_planets = calculate_planets(return_jd, req.ayanamsa)
    return_house_data = calculate_houses(return_jd, req.latitude, req.longitude, req.ayanamsa)
    return_asc = return_house_data["ascendant"]
    return_asc_idx = return_asc["sign_index"]
    planet_house_map = assign_planets_to_houses(return_planets, return_asc_idx)

    # Muntha
    muntha = get_muntha(req.year, req.return_year, natal_asc_idx)

    # Year lord (Varshesh)
    year_lord = get_year_lord(return_jd)

    # Tri-Pataki (kendras from return lagna)
    tri_pataki = get_tri_pataki(return_planets, natal_planets_raw, return_asc_idx)

    # Pancha Vargiya Bala — simplified: count of planets in kendra/trikona of return chart
    kendra_planets = []
    trikona_planets = []
    for name, pd in return_planets.items():
        h = ((pd["sign_index"] - return_asc_idx) % 12) + 1
        if h in [1, 4, 7, 10]:
            kendra_planets.append(name)
        if h in [1, 5, 9]:
            trikona_planets.append(name)

    # Format planets with house
    planets_list = []
    for name, pd in return_planets.items():
        h = ((pd["sign_index"] - return_asc_idx) % 12) + 1
        natal_pd = natal_planets_raw.get(name, {})
        planets_list.append({
            "name": name,
            "sign": pd["sign"],
            "sign_index": pd["sign_index"],
            "degree": round(pd["degree"], 2),
            "house": h,
            "nakshatra": pd["nakshatra"],
            "retrograde": pd.get("retrograde", False),
            "status": pd.get("status", "neutral"),
            "natal_sign": natal_pd.get("sign", ""),
            "natal_house": ((natal_pd["sign_index"] - natal_asc_idx) % 12) + 1 if natal_pd.get("sign_index") is not None else 0,
        })

    # Tajika aspects (Ithasala, Muthasila, Ishrafa, Nakta, Yamaya)
    tajika_aspects = compute_tajika_aspects(return_planets)

    return_dt = jd_to_datetime(return_jd)

    return {
        "name": req.name,
        "return_year": req.return_year,
        "return_datetime": return_dt,
        "age": req.return_year - req.year,
        "ascendant": return_asc,
        "planets": planets_list,
        "planet_house_map": {str(k): v for k, v in planet_house_map.items()},
        "muntha": muntha,
        "year_lord": year_lord,
        "tri_pataki": tri_pataki,
        "kendra_planets": kendra_planets,
        "trikona_planets": trikona_planets,
        "natal_ascendant": natal_asc_data["ascendant"],
        "tajika_aspects": tajika_aspects,
    }
