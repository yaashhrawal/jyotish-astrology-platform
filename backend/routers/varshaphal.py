"""
Varshaphal — Solar Return chart (annual chart).
Sun returns to exact natal longitude each year.
"""
from fastapi import APIRouter
from pydantic import BaseModel
import swisseph as swe
from core.engine import EPHE_FLAG
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
        result, _ = swe.calc_ut(approx_jd, swe.SUN, EPHE_FLAG | swe.FLG_SPEED)
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


# ── Panchavargeeya Bala → Varshesh (year-lord) selection ──────────────────
# Ranks the 5 classical office-bearers by a transparent 5-varga strength.
from core.engine import EXALTATION, DEBILITATION, OWN_SIGN, VIMSHOTTARI_SEQUENCE, VIMSHOTTARI_YEARS

_SIGN_LORDS = ["Mars","Venus","Mercury","Moon","Sun","Mercury",
               "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"]

# Naisargika (natural) friendships
_FRIENDS = {
    "Sun":     {"f":{"Moon","Mars","Jupiter"}, "e":{"Venus","Saturn"}},
    "Moon":    {"f":{"Sun","Mercury"},          "e":set()},
    "Mars":    {"f":{"Sun","Moon","Jupiter"},   "e":{"Mercury"}},
    "Mercury": {"f":{"Sun","Venus"},            "e":{"Moon"}},
    "Jupiter": {"f":{"Sun","Moon","Mars"},      "e":{"Mercury","Venus"}},
    "Venus":   {"f":{"Mercury","Saturn"},       "e":{"Sun","Moon"}},
    "Saturn":  {"f":{"Mercury","Venus"},        "e":{"Sun","Moon","Mars"}},
}

# Egyptian terms (Hadda) — per sign: list of (lord, upper_degree)
_HADDA = {
    0:[("Jupiter",6),("Venus",12),("Mercury",20),("Mars",25),("Saturn",30)],
    1:[("Venus",8),("Mercury",14),("Jupiter",22),("Saturn",27),("Mars",30)],
    2:[("Mercury",6),("Jupiter",12),("Venus",17),("Mars",24),("Saturn",30)],
    3:[("Mars",7),("Venus",13),("Mercury",19),("Jupiter",26),("Saturn",30)],
    4:[("Jupiter",6),("Venus",11),("Saturn",18),("Mercury",24),("Mars",30)],
    5:[("Mercury",7),("Venus",17),("Jupiter",21),("Mars",28),("Saturn",30)],
    6:[("Saturn",6),("Mercury",14),("Jupiter",21),("Venus",28),("Mars",30)],
    7:[("Mars",7),("Venus",11),("Mercury",19),("Jupiter",24),("Saturn",30)],
    8:[("Jupiter",12),("Venus",17),("Mercury",21),("Saturn",26),("Mars",30)],
    9:[("Mercury",7),("Jupiter",14),("Venus",22),("Saturn",26),("Mars",30)],
    10:[("Mercury",7),("Venus",13),("Jupiter",20),("Mars",25),("Saturn",30)],
    11:[("Venus",12),("Jupiter",16),("Mercury",19),("Mars",28),("Saturn",30)],
}


def _dignity_pts(planet: str, sign_idx: int) -> float:
    """Points 0.5–5 for a planet sitting in a sign (own/exalt/friend tiers)."""
    sign = SIGNS[sign_idx]
    if sign in OWN_SIGN.get(planet, []) or EXALTATION.get(planet) == sign:
        return 5.0
    if DEBILITATION.get(planet) == sign:
        return 0.5
    lord = _SIGN_LORDS[sign_idx]
    if lord == planet:
        return 5.0
    rel = _FRIENDS.get(planet, {"f":set(),"e":set()})
    if lord in rel["f"]:
        return 3.5
    if lord in rel["e"]:
        return 1.0
    return 2.0


def _hadda_lord(sign_idx: int, deg: float) -> str:
    for lord, upper in _HADDA[sign_idx]:
        if deg < upper:
            return lord
    return _HADDA[sign_idx][-1][0]


def panchavargeeya_bala(planet: str, longitude: float) -> dict:
    """5-varga strength (Kshetra, Uchcha, Hadda, Drekkana, Navamsa). Higher = stronger.
    Transparent scheme for ranking Varshesh candidates."""
    lon = longitude % 360
    sign_idx = int(lon // 30)
    deg = lon % 30

    # 1. Kshetra (rasi)
    kshetra = _dignity_pts(planet, sign_idx)
    # 2. Uchcha (exaltation proximity) 0–5
    ex_sign = EXALTATION.get(planet)
    if ex_sign:
        ex_lon = SIGNS.index(ex_sign) * 30 + 0  # deg of exact exaltation ≈ sign start (simplified)
        dist = abs(((lon - ex_lon + 180) % 360) - 180)
        uchcha = round((180 - dist) / 180 * 5, 2)
    else:
        uchcha = 2.5
    # 3. Hadda (Egyptian term)
    hl = _hadda_lord(sign_idx, deg)
    if hl == planet:
        hadda = 5.0
    else:
        rel = _FRIENDS.get(planet, {"f":set(),"e":set()})
        hadda = 3.5 if hl in rel["f"] else 1.0 if hl in rel["e"] else 2.0
    # 4. Drekkana (decanate) — sign of the drekkana lord
    drek = int(deg // 10)  # 0,1,2
    drek_sign_idx = (sign_idx + drek * 4) % 12
    drekkana = _dignity_pts(planet, drek_sign_idx)
    # 5. Navamsa — start sign by element: fire→Aries, earth→Cap, air→Libra, water→Cancer
    nav = int((lon % 30) // (30 / 9))
    start = [0, 9, 6, 3][sign_idx % 4]
    nav_sign_idx = (start + nav) % 12
    navamsa = _dignity_pts(planet, nav_sign_idx)

    total = round(kshetra + uchcha + hadda + drekkana + navamsa, 2)
    return {"kshetra":round(kshetra,2),"uchcha":uchcha,"hadda":round(hadda,2),
            "drekkana":round(drekkana,2),"navamsa":round(navamsa,2),"total":total}


def select_varshesh(return_planets: dict, natal_asc_idx: int, return_asc_idx: int,
                    muntha: dict, is_day: bool) -> dict:
    """Rank the 5 classical office-bearers by Panchavargeeya bala; strongest = Varshesh."""
    # Tri-rashi lords (day: for movable/fixed/dual differ) — classical dina-tri-rashi:
    # day birth → lord of trine group of the sign; use simplified: lagna sign lord.
    natal_lagna_lord  = _SIGN_LORDS[natal_asc_idx]
    varsha_lagna_lord = _SIGN_LORDS[return_asc_idx]
    muntha_lord       = _SIGN_LORDS[muntha["sign_index"]]
    # Tri-rashi pati (day/night lords of the return-lagna triplicity)
    trirashi = _trirashi_lord(return_asc_idx, is_day)
    # Dina-ratri pati: day → Sun; night → Moon (classical: lord of the day/night)
    dina_ratri = "Sun" if is_day else "Moon"

    candidates = {
        "Janma Lagnesh (natal)":  natal_lagna_lord,
        "Varsha Lagnesh":         varsha_lagna_lord,
        "Muntha lord":            muntha_lord,
        "Tri-rashi pati":         trirashi,
        "Dina-ratri pati":        dina_ratri,
    }
    scored = []
    for office, planet in candidates.items():
        pd = return_planets.get(planet)
        if not pd:
            continue
        pv = panchavargeeya_bala(planet, pd["longitude"])
        scored.append({"office": office, "planet": planet, "bala": pv})
    scored.sort(key=lambda x: x["bala"]["total"], reverse=True)
    winner = scored[0] if scored else None
    return {"varshesh": winner["planet"] if winner else None,
            "varshesh_office": winner["office"] if winner else None,
            "candidates": scored}


def _trirashi_lord(sign_idx: int, is_day: bool) -> str:
    """Triplicity (tri-rashi) lord — Tajika day/night rulers of the element."""
    element = sign_idx % 4  # 0 fire,1 earth,2 air,3 water
    day_night = {
        0: ("Sun","Jupiter"),    # fire
        1: ("Venus","Moon"),     # earth
        2: ("Saturn","Mercury"), # air
        3: ("Venus","Mars"),     # water
    }
    d, n = day_night[element]
    return d if is_day else n


def compute_mudda_dasha(return_jd: float, moon_lon: float, today_jd: float) -> list:
    """Mudda (Varsha-Vimshottari) dasha: 120y compressed to one solar year (365.25d).
    Balance from return-chart Moon's nakshatra. Marks the currently-running period."""
    YEAR = 365.25
    nak_len = 360.0 / 27
    moon = moon_lon % 360
    nak_idx = int(moon // nak_len)
    frac_elapsed = (moon % nak_len) / nak_len
    first_lord = NAKSHATRA_LORDS[nak_idx]
    start_pos = VIMSHOTTARI_SEQUENCE.index(first_lord)

    periods = []
    cur = return_jd
    # 9 periods (balance of first + 8 full) + a closing slice of the first lord
    # so the timeline fills return → next return exactly (total = 365.25d).
    for i in range(10):
        lord = VIMSHOTTARI_SEQUENCE[(start_pos + i) % 9]
        full_days = VIMSHOTTARI_YEARS[lord] / 120.0 * YEAR
        if i == 0:
            days = full_days * (1 - frac_elapsed)   # balance of first lord
        elif i == 9:
            days = full_days * frac_elapsed          # closing slice of first lord
        else:
            days = full_days
        if days <= 0:
            continue
        end = cur + days
        # antardashas (proportional)
        antars = []
        ac = cur
        a_pos = VIMSHOTTARI_SEQUENCE.index(lord)
        for j in range(9):
            al = VIMSHOTTARI_SEQUENCE[(a_pos + j) % 9]
            adays = (VIMSHOTTARI_YEARS[al] / 120.0) * days
            aend = ac + adays
            antars.append({
                "lord": al,
                "start": jd_to_datetime(ac)[:10],
                "end": jd_to_datetime(aend)[:10],
                "days": round(adays, 1),
                "running": ac <= today_jd < aend,
            })
            ac = aend
        periods.append({
            "lord": lord,
            "start": jd_to_datetime(cur)[:10],
            "end": jd_to_datetime(end)[:10],
            "days": round(days, 1),
            "running": cur <= today_jd < end,
            "antardashas": antars,
        })
        cur = end
    return periods


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

    # Day/night birth (Sun above horizon = houses 7–12 of return chart)
    sun_house = ((return_planets["Sun"]["sign_index"] - return_asc_idx) % 12) + 1
    is_day = sun_house in (7, 8, 9, 10, 11, 12)

    # Varshesh (year lord) via Panchavargeeya bala of the 5 office-bearers
    varshesh_data = select_varshesh(return_planets, natal_asc_idx, return_asc_idx, muntha, is_day)

    # Mudda (Varsha-Vimshottari) dasha — annual timeline
    from datetime import datetime, timezone
    _now = datetime.now(timezone.utc)
    today_jd = swe.julday(_now.year, _now.month, _now.day, _now.hour + _now.minute / 60.0)
    mudda_dasha = compute_mudda_dasha(return_jd, return_planets["Moon"]["longitude"], today_jd)

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
        "is_day_birth": is_day,
        "varshesh": varshesh_data["varshesh"],
        "varshesh_office": varshesh_data["varshesh_office"],
        "varshesh_candidates": varshesh_data["candidates"],
        "mudda_dasha": mudda_dasha,
        "tri_pataki": tri_pataki,
        "kendra_planets": kendra_planets,
        "trikona_planets": trikona_planets,
        "natal_ascendant": natal_asc_data["ascendant"],
        "tajika_aspects": tajika_aspects,
    }
