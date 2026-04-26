"""
Sarvatobhadra Chakra (SBC) — a 9x9 grid used in Vedic astrology
to find vedha (obstruction) and auspicious transits.
Grid: 9x9 = 81 cells. Center = Brahma.
Nakshatras arranged in 4 directions (28 cells for 28 nakshatras incl Abhijit).
Signs arranged in corners/sides.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, SIGNS, NAKSHATRAS, NAKSHATRA_LORDS
)
import swisseph as swe

router = APIRouter()

# SBC layout — nakshatras in 4 sides of the 9x9 grid (standard layout)
# North side (top row, left to right): nakshatras 1-7 (Ashwini to Punarvasu)
# East side (right col, top to bottom): nakshatras 8-14 (Pushya to Swati)
# South side (bottom row, right to left): nakshatras 15-21 (Vishakha to Shravana)
# West side (left col, bottom to top): nakshatras 22-28 (Dhanishta to Revati) + Abhijit

# Simplified: just map nakshatra index to SBC position
SBC_NORTH = [0, 1, 2, 3, 4, 5, 6]      # Ashwini through Punarvasu
SBC_EAST  = [7, 8, 9, 10, 11, 12, 13]  # Pushya through Swati
SBC_SOUTH = [14, 15, 16, 17, 18, 19, 20] # Vishakha through Shravana
SBC_WEST  = [21, 22, 23, 24, 25, 26]   # Dhanishta through Revati (+ Abhijit=27)

# Vedha: nakshatras that obstruct each other (opposite pairs across SBC)
# If a transiting planet is in vedha nakshatra of natal planet's nakshatra, it's obstructed
VEDHA_PAIRS = {
    0: 14, 1: 15, 2: 16, 3: 17, 4: 18, 5: 19, 6: 20,
    7: 21, 8: 22, 9: 23, 10: 24, 11: 25, 12: 26,
    13: 0,  # wraps
}
# Reverse
for k, v in list(VEDHA_PAIRS.items()):
    VEDHA_PAIRS[v] = k

# Tara (benefic) relationships: nakshatra relationships in SBC
# Janma=1, Sampat=2, Vipat=3, Kshema=4, Pratyak=5, Sadhana=6, Naidhana=7, Mitra=8, Ati-Mitra=9
TARA_NAMES = ["Janma","Sampat","Vipat","Kshema","Pratyak","Sadhana","Naidhana","Mitra","Ati-Mitra"]
TARA_NATURE = {
    "Janma": "mixed", "Sampat": "good", "Vipat": "bad", "Kshema": "good",
    "Pratyak": "bad", "Sadhana": "good", "Naidhana": "bad", "Mitra": "good", "Ati-Mitra": "good"
}


def get_tara(natal_nak: int, transit_nak: int) -> dict:
    """Tara of transit nakshatra from natal nakshatra."""
    diff = (transit_nak - natal_nak) % 27
    tara_idx = diff % 9  # 0-8; 0 means 9th = Ati-Mitra when diff>0
    if diff > 0 and tara_idx == 0:
        tara_idx = 8  # 9th position = Ati-Mitra (index 8)
    name = TARA_NAMES[tara_idx]
    return {"tara": name, "nature": TARA_NATURE[name], "count": diff + 1}


def sbc_cell_for_nakshatra(nak_idx: int) -> tuple[int, int]:
    """Return (row, col) in 9x9 grid (0-indexed) for nakshatra index."""
    # North row (row 0): cols 1-7 for naks 0-6
    if nak_idx in SBC_NORTH:
        return (0, SBC_NORTH.index(nak_idx) + 1)
    # East col (col 8): rows 1-7 for naks 7-13
    elif nak_idx in SBC_EAST:
        return (SBC_EAST.index(nak_idx) + 1, 8)
    # South row (row 8): cols 7-1 for naks 14-20
    elif nak_idx in SBC_SOUTH:
        return (8, 7 - SBC_SOUTH.index(nak_idx))
    # West col (col 0): rows 7-1 for naks 21-26
    elif nak_idx in SBC_WEST:
        return (7 - SBC_WEST.index(nak_idx), 0)
    # Abhijit (27) = row 0, col 0 corner
    return (0, 0)


class SBCRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/sarvatobhadra")
def compute_sbc(req: SBCRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    natal_planets = calculate_planets(jd, req.ayanamsa)

    # Current transit planets
    from datetime import datetime
    now = datetime.utcnow()
    transit_jd = swe.julday(now.year, now.month, now.day, now.hour)
    transit_planets = calculate_planets(transit_jd, req.ayanamsa)

    # Moon nakshatra (most important for SBC)
    moon_lon = natal_planets["Moon"]["longitude"]
    moon_nak_idx = int(moon_lon / (360 / 27))

    # Build planet data with nakshatra info
    def build_planet_info(planets_dict: dict, label: str) -> list:
        result = []
        for name, pd in planets_dict.items():
            nak_idx = int(pd["longitude"] / (360 / 27))
            row, col = sbc_cell_for_nakshatra(nak_idx)
            result.append({
                "planet": name,
                "sign": pd["sign"],
                "nakshatra": pd["nakshatra"],
                "nak_index": nak_idx,
                "sbc_row": row,
                "sbc_col": col,
                "type": label,
            })
        return result

    natal_info = build_planet_info(natal_planets, "natal")
    transit_info = build_planet_info(transit_planets, "transit")

    # Vedha analysis: for each natal planet, find transiting planets in vedha
    vedha_analysis = []
    for nat in natal_info:
        nat_nak = nat["nak_index"]
        vedha_nak = VEDHA_PAIRS.get(nat_nak, -1)
        for tr in transit_info:
            if tr["nak_index"] == vedha_nak:
                vedha_analysis.append({
                    "natal_planet": nat["planet"],
                    "natal_nakshatra": nat["nakshatra"],
                    "transit_planet": tr["planet"],
                    "transit_nakshatra": tr["nakshatra"],
                    "type": "vedha",
                    "effect": "obstruction",
                })

    # Tara analysis for Moon
    moon_taras = []
    for tr in transit_info:
        tara = get_tara(moon_nak_idx, tr["nak_index"])
        moon_taras.append({
            "planet": tr["planet"],
            "nakshatra": tr["nakshatra"],
            **tara,
        })

    # SBC grid — mark which cells have natal/transit planets
    grid = [[{"natal": [], "transit": [], "sign": None, "type": "empty"} for _ in range(9)] for _ in range(9)]

    # Mark center
    grid[4][4]["type"] = "brahma"

    for p in natal_info:
        grid[p["sbc_row"]][p["sbc_col"]]["natal"].append(p["planet"])
        grid[p["sbc_row"]][p["sbc_col"]]["type"] = "nakshatra"

    for p in transit_info:
        grid[p["sbc_row"]][p["sbc_col"]]["transit"].append(p["planet"])

    # Flatten grid for JSON
    grid_flat = []
    for r in range(9):
        for c in range(9):
            cell = grid[r][c]
            grid_flat.append({
                "row": r, "col": c,
                "natal_planets": cell["natal"],
                "transit_planets": cell["transit"],
                "type": cell["type"],
            })

    return {
        "natal_planets": natal_info,
        "transit_planets": transit_info,
        "moon_nakshatra": NAKSHATRAS[moon_nak_idx],
        "moon_nak_index": moon_nak_idx,
        "vedha": vedha_analysis,
        "moon_taras": moon_taras,
        "grid": grid_flat,
    }
