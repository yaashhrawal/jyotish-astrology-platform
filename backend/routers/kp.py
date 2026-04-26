"""
KP (Krishnamurti Paddhati) System:
- Sub-lords for planets and house cusps
- Significators
- Sub-lord method for prediction
"""
from fastapi import APIRouter
from pydantic import BaseModel
import swisseph as swe
from core.engine import (
    birth_to_jd, get_ayanamsa, tropical_to_sidereal, get_sign_and_degree,
    get_nakshatra, SIGNS, NAKSHATRA_LORDS, calculate_planets, calculate_houses,
    assign_planets_to_houses
)

router = APIRouter()

VIMSHOTTARI_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}
VIMSHOTTARI_SEQ = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
TOTAL_YEARS = 120.0

# KP Sub-division: each nakshatra (13°20') divided into 9 sub-lords proportional to dasha years
# Sub-lord spans within a nakshatra (in degrees, total 13.333...)
NAK_SPAN = 360 / 27  # 13.3333...

def build_sublord_table():
    """Build complete KP sub-lord table for all 249 sub-divisions."""
    table = []
    # 27 nakshatras, each starting at a lord position in the 120-year cycle
    # Starting lords follow the dasha sequence from Ketu
    nak_lords_order = NAKSHATRA_LORDS  # already indexed 0-26

    for nak_idx in range(27):
        nak_lord = nak_lords_order[nak_idx]
        nak_start = nak_idx * NAK_SPAN
        # Find starting position in dasha sequence
        lord_seq_start = VIMSHOTTARI_SEQ.index(nak_lord)

        # Sub-lords: cycle through dasha sequence proportional to years
        sub_start_deg = 0.0
        for sub_offset in range(9):
            sub_lord = VIMSHOTTARI_SEQ[(lord_seq_start + sub_offset) % 9]
            sub_years = VIMSHOTTARI_YEARS[sub_lord]
            sub_span = (sub_years / TOTAL_YEARS) * NAK_SPAN

            # Sub-sub-lords (sub-sub = 81 divisions per nak, 2187 total)
            sub_sub_start = 0.0
            for ss_offset in range(9):
                ss_lord = VIMSHOTTARI_SEQ[(lord_seq_start + sub_offset + ss_offset) % 9]
                ss_years = VIMSHOTTARI_YEARS[ss_lord]
                ss_span = (ss_years / TOTAL_YEARS) * sub_span

                abs_start = nak_start + sub_start_deg + sub_sub_start
                abs_end = abs_start + ss_span

                table.append({
                    "nakshatra": nak_idx,
                    "nak_lord": nak_lord,
                    "sub_lord": sub_lord,
                    "sub_sub_lord": ss_lord,
                    "start_lon": round(abs_start, 6),
                    "end_lon": round(abs_end, 6),
                })
                sub_sub_start += ss_span
            sub_start_deg += sub_span
    return table


_SUBLORD_TABLE = None

def get_sublord_table():
    global _SUBLORD_TABLE
    if _SUBLORD_TABLE is None:
        _SUBLORD_TABLE = build_sublord_table()
    return _SUBLORD_TABLE


def find_sublord(longitude: float) -> dict:
    """Find nakshatra lord, sub-lord, sub-sub-lord for a longitude."""
    lon = longitude % 360
    table = get_sublord_table()
    for row in table:
        if row["start_lon"] <= lon < row["end_lon"]:
            nak_idx = row["nakshatra"]
            from core.engine import NAKSHATRAS
            nak_name = NAKSHATRAS[nak_idx]
            pada = int((lon - nak_idx * NAK_SPAN) / (NAK_SPAN / 4)) + 1
            return {
                "nakshatra": nak_name,
                "nak_lord": row["nak_lord"],
                "sub_lord": row["sub_lord"],
                "sub_sub_lord": row["sub_sub_lord"],
                "longitude": round(lon, 4),
            }
    # Fallback: simple nakshatra
    nak_idx = int(lon / NAK_SPAN)
    from core.engine import NAKSHATRAS
    return {"nakshatra": NAKSHATRAS[nak_idx % 27], "nak_lord": NAKSHATRA_LORDS[nak_idx % 27],
            "sub_lord": "Unknown", "sub_sub_lord": "Unknown", "longitude": round(lon, 4)}


def get_planet_houses_occupied(planet_house_map: dict) -> dict:
    """Map planet -> list of houses it occupies."""
    return {p: [h] for h, planets in planet_house_map.items() for p in planets}


def get_significators(planet_house_map: dict, planets: dict, houses_data: dict, asc_idx: int) -> dict:
    """
    KP Significators for each house:
    1. Planets IN the house
    2. Lord of house sign
    3. Planets in nakshatra of planets in house
    4. Planets in nakshatra of house lord
    """
    from core.engine import SIGN_LORDS

    sigs = {h: set() for h in range(1, 13)}

    # Planet nakshatra map
    planet_nak_lord = {name: pd["nakshatra_lord"] for name, pd in planets.items()}

    for house_num in range(1, 13):
        sign_idx = (asc_idx + house_num - 1) % 12
        sign = SIGNS[sign_idx]
        house_sign_lord = SIGN_LORDS.get(sign, "")

        # Planets in house
        in_house = planet_house_map.get(house_num, [])
        sigs[house_num].update(in_house)

        # House sign lord
        sigs[house_num].add(house_sign_lord)

        # Planets whose nakshatra lord is in house or is house lord
        for pname, pd in planets.items():
            nak_lord = pd["nakshatra_lord"]
            if nak_lord in in_house or nak_lord == house_sign_lord:
                sigs[house_num].add(pname)

    return {h: sorted(list(v)) for h, v in sigs.items()}


class KPRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "kp"  # KP uses Krishnamurti ayanamsa


@router.post("/kp")
def compute_kp(req: KPRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa, "placidus")
    asc = house_data["ascendant"]
    asc_idx = asc["sign_index"]
    planet_house_map = assign_planets_to_houses(planets, asc_idx)

    # Sub-lords for all planets
    planet_sublords = {}
    for name, pd in planets.items():
        sl = find_sublord(pd["longitude"])
        planet_sublords[name] = {
            "sign": pd["sign"],
            "degree": round(pd["degree"], 3),
            "house": pd.get("house", 1),
            "nakshatra": sl["nakshatra"],
            "nak_lord": sl["nak_lord"],
            "sub_lord": sl["sub_lord"],
            "sub_sub_lord": sl["sub_sub_lord"],
            "retrograde": pd.get("retrograde", False),
            "status": pd.get("status", "neutral"),
        }

    # Sub-lords for house cusps (using equal house = sign cusps from ascendant)
    cusp_sublords = {}
    for h in range(1, 13):
        cusp_lon = (asc["longitude"] + (h - 1) * 30) % 360
        sl = find_sublord(cusp_lon)
        cusp_sublords[h] = {
            "sign": SIGNS[int(cusp_lon / 30) % 12],
            "longitude": round(cusp_lon, 3),
            "nak_lord": sl["nak_lord"],
            "sub_lord": sl["sub_lord"],
            "sub_sub_lord": sl["sub_sub_lord"],
        }

    # Significators
    significators = get_significators(planet_house_map, planets, house_data, asc_idx)

    # Ascendant sub-lord
    asc_sl = find_sublord(asc["longitude"])

    return {
        "ascendant": {**asc, "nak_lord": asc_sl["nak_lord"], "sub_lord": asc_sl["sub_lord"]},
        "planets": planet_sublords,
        "cusps": cusp_sublords,
        "significators": significators,
        "planet_house_map": {str(k): v for k, v in planet_house_map.items()},
    }
