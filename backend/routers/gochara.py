"""
Gochara (Transit) Analysis — transit planets relative to natal Moon sign.
Classical rules: favorable/unfavorable house positions from Moon.
Vedha (obstruction): specific house pairs that cancel each other.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, SIGNS
import swisseph as swe
from datetime import datetime

router = APIRouter()

# Traditional favorable houses from natal Moon (1-based)
FAVORABLE_HOUSES = {
    "Sun":     [3, 6, 10, 11],
    "Moon":    [1, 3, 6, 7, 10, 11],
    "Mars":    [3, 6, 11],
    "Mercury": [2, 4, 6, 8, 10, 11],
    "Jupiter": [2, 5, 7, 9, 11],
    "Venus":   [1, 2, 3, 4, 5, 8, 9, 11, 12],
    "Saturn":  [3, 6, 11],
    "Rahu":    [3, 6, 11],
    "Ketu":    [3, 6, 11],
}

# Vedha pairs: if favorable planet is in favorable house but another planet is in
# the corresponding vedha house, the benefit is cancelled
VEDHA_PAIRS = {
    3: 12, 6: 9, 10: 4, 11: 5,   # unfavorable vedha for the above
    1: 5, 2: 12, 7: 2,            # additional
}
# Build reverse
for k, v in list(VEDHA_PAIRS.items()):
    VEDHA_PAIRS.setdefault(v, k)

PLANET_NATURE = {
    "Sun": "neutral", "Moon": "benefic", "Mars": "malefic",
    "Mercury": "benefic", "Jupiter": "benefic", "Venus": "benefic",
    "Saturn": "malefic", "Rahu": "malefic", "Ketu": "malefic",
}


class GocharaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/gochara")
def compute_gochara(req: GocharaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    natal = calculate_planets(jd, req.ayanamsa)

    now = datetime.utcnow()
    transit_jd = swe.julday(now.year, now.month, now.day, now.hour)
    transit = calculate_planets(transit_jd, req.ayanamsa)

    natal_moon_sign_idx = natal["Moon"]["sign_index"]
    natal_moon_sign = natal["Moon"]["sign"]

    # Transit house from natal Moon (1-based)
    def house_from_moon(sign_idx: int) -> int:
        return (sign_idx - natal_moon_sign_idx) % 12 + 1

    planet_analysis = []
    for name, pd in transit.items():
        h = house_from_moon(pd["sign_index"])
        favorable_houses = FAVORABLE_HOUSES.get(name, [])
        is_favorable = h in favorable_houses
        vedha_h = VEDHA_PAIRS.get(h)

        # Check if vedha house is occupied by a transit planet
        vedha_occupied = False
        vedha_planet = None
        if vedha_h:
            for other_name, other_pd in transit.items():
                if other_name != name and house_from_moon(other_pd["sign_index"]) == vedha_h:
                    vedha_occupied = True
                    vedha_planet = other_name
                    break

        effect = "favorable" if is_favorable else "unfavorable"
        if is_favorable and vedha_occupied:
            effect = "cancelled (vedha)"

        planet_analysis.append({
            "planet": name,
            "transit_sign": pd["sign"],
            "transit_sign_idx": pd["sign_index"],
            "house_from_moon": h,
            "favorable": is_favorable,
            "favorable_houses": favorable_houses,
            "vedha_house": vedha_h,
            "vedha_occupied": vedha_occupied,
            "vedha_by": vedha_planet,
            "effect": effect,
            "nature": PLANET_NATURE.get(name, "neutral"),
        })

    # Overall score
    favorable_count = sum(1 for p in planet_analysis if p["effect"] == "favorable")
    unfavorable_count = sum(1 for p in planet_analysis if p["effect"] == "unfavorable")

    # Jupiter and Saturn Ashtama check (H8 from Moon = very bad)
    ashtama = [p for p in planet_analysis if p["house_from_moon"] == 8 and p["planet"] in ("Jupiter", "Saturn")]

    return {
        "natal_moon_sign": natal_moon_sign,
        "natal_moon_sign_idx": natal_moon_sign_idx,
        "planets": planet_analysis,
        "favorable_count": favorable_count,
        "unfavorable_count": unfavorable_count,
        "ashtama_planets": [p["planet"] for p in ashtama],
        "overall": "favorable" if favorable_count > unfavorable_count else "mixed" if favorable_count == unfavorable_count else "unfavorable",
        "transit_date": now.strftime("%Y-%m-%d"),
    }


# --- Transit over Natal Houses ---

class TransitNatalRequest(BaseModel):
    # Natal birth data
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    # Optional: transit date override (ISO string YYYY-MM-DD)
    transit_date: str = ""


@router.post("/transit_natal_houses")
def transit_natal_houses(req: TransitNatalRequest):
    from core.engine import calculate_houses
    from datetime import datetime

    # Natal chart
    natal_jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    natal_planets = calculate_planets(natal_jd, req.ayanamsa)
    natal_houses = calculate_houses(natal_jd, req.latitude, req.longitude, req.ayanamsa)

    # Transit time
    if req.transit_date:
        try:
            dt = datetime.strptime(req.transit_date, "%Y-%m-%d")
            transit_jd = birth_to_jd(dt.year, dt.month, dt.day, 12, 0, req.tz_offset)
        except Exception:
            transit_jd = birth_to_jd(*[getattr(datetime.utcnow(), a) for a in ('year','month','day','hour','minute')], 0)
    else:
        now = datetime.utcnow()
        transit_jd = birth_to_jd(now.year, now.month, now.day, now.hour, now.minute, 0)

    transit_planets = calculate_planets(transit_jd, req.ayanamsa)

    PLANET_ORDER = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"]

    # Map each natal house → its sign
    natal_house_sign = {h: natal_houses[h]["sign"] for h in natal_houses}

    # For each transit planet, find which natal house it occupies
    SIGNS_LIST = SIGNS
    def sign_to_house(sign: str) -> int:
        for h, data in natal_houses.items():
            if data["sign"] == sign:
                return h
        return 1

    transit_in_natal = []
    for p in PLANET_ORDER:
        pd = transit_planets.get(p, {})
        t_sign = pd.get("sign", "")
        natal_h = sign_to_house(t_sign)
        natal_h_sign = natal_house_sign.get(natal_h, "")

        # Planets aspecting this natal house via Parashari aspects
        aspects_on_house = []
        for asp_p, asp_d in transit_planets.items():
            if asp_p == p:
                continue
            asp_h = sign_to_house(asp_d.get("sign", ""))
            asp_aspects = {(asp_h + 6) % 12 or 12}
            if asp_p == "Mars":
                asp_aspects |= {(asp_h + 3) % 12 or 12, (asp_h + 7) % 12 or 12}
            elif asp_p == "Jupiter":
                asp_aspects |= {(asp_h + 4) % 12 or 12, (asp_h + 8) % 12 or 12}
            elif asp_p == "Saturn":
                asp_aspects |= {(asp_h + 2) % 12 or 12, (asp_h + 9) % 12 or 12}
            if natal_h in asp_aspects:
                aspects_on_house.append(asp_p)

        # Natal planets in same house
        natal_occupants = [np for np, nd in natal_planets.items() if nd.get("house") == natal_h]

        transit_in_natal.append({
            "planet": p,
            "transit_sign": t_sign,
            "transit_degree": round(pd.get("degree", 0), 2),
            "natal_house": natal_h,
            "natal_house_sign": natal_h_sign,
            "transit_aspects_from": aspects_on_house,
            "natal_occupants": natal_occupants,
            "retrograde": pd.get("retrograde", False),
        })

    # Group by natal house
    houses_summary = {}
    for entry in transit_in_natal:
        h = entry["natal_house"]
        if h not in houses_summary:
            houses_summary[h] = {"house": h, "sign": natal_house_sign.get(h,""), "transit_planets": [], "natal_occupants": []}
        houses_summary[h]["transit_planets"].append(entry["planet"])
        houses_summary[h]["natal_occupants"] = entry["natal_occupants"]

    return {
        "transit_date": req.transit_date or datetime.utcnow().strftime("%Y-%m-%d"),
        "natal_ascendant": natal_houses.get(1, {}).get("sign",""),
        "transit_planets": transit_in_natal,
        "houses_occupied": sorted(houses_summary.values(), key=lambda x: x["house"]),
    }
