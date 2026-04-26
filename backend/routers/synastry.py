from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses

router = APIRouter()

PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"]
SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]

ASPECTS = [
    (0,   "Conjunction", "strong"),
    (60,  "Sextile",     "mild"),
    (90,  "Square",      "tense"),
    (120, "Trine",       "strong"),
    (150, "Quincunx",    "mild"),
    (180, "Opposition",  "tense"),
]
ORB = 8.0


def planet_positions(jd: float, lat: float, lon: float, ayanamsa: str) -> dict:
    planets = calculate_planets(jd, ayanamsa)
    asc = calculate_houses(jd, lat, lon, ayanamsa)["ascendant"]
    result = {}
    for p in planets:
        result[p["name"]] = {"lon": p["longitude"], "sign": p["sign"], "sign_index": p["sign_index"], "degree": p["degree"]}
    result["Ascendant"] = {"lon": asc["longitude"], "sign": asc["sign"], "sign_index": asc["sign_index"], "degree": asc["degree"]}
    return result


def angular_diff(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return d if d <= 180 else 360 - d


def find_aspect(diff: float):
    for angle, name, nature in ASPECTS:
        if abs(diff - angle) <= ORB:
            orb = abs(diff - angle)
            return {"aspect": name, "angle": angle, "orb": round(orb, 2), "nature": nature}
    return None


def house_from_asc(planet_lon: float, asc_lon: float) -> int:
    diff = (planet_lon - asc_lon) % 360
    return int(diff / 30) + 1


class SynastryRequest(BaseModel):
    p1_year: int; p1_month: int; p1_day: int
    p1_hour: int; p1_minute: int; p1_tz_offset: float
    p1_lat: float; p1_lon: float; p1_name: str = "Person 1"
    p2_year: int; p2_month: int; p2_day: int
    p2_hour: int; p2_minute: int; p2_tz_offset: float
    p2_lat: float; p2_lon: float; p2_name: str = "Person 2"
    ayanamsa: str = "lahiri"


@router.post("/synastry")
def compute_synastry(req: SynastryRequest):
    jd1 = birth_to_jd(req.p1_year, req.p1_month, req.p1_day, req.p1_hour, req.p1_minute, req.p1_tz_offset)
    jd2 = birth_to_jd(req.p2_year, req.p2_month, req.p2_day, req.p2_hour, req.p2_minute, req.p2_tz_offset)

    pos1 = planet_positions(jd1, req.p1_lat, req.p1_lon, req.ayanamsa)
    pos2 = planet_positions(jd2, req.p2_lat, req.p2_lon, req.ayanamsa)

    asc1_lon = pos1["Ascendant"]["lon"]
    asc2_lon = pos2["Ascendant"]["lon"]

    # Build planet lists with house info
    p1_list = []
    for name, d in pos1.items():
        if name == "Ascendant":
            continue
        p1_list.append({
            "name": name, "sign": d["sign"], "sign_index": d["sign_index"],
            "degree": round(d["degree"], 2),
            "house": house_from_asc(d["lon"], asc1_lon),
            "lon": d["lon"]
        })

    p2_list = []
    for name, d in pos2.items():
        if name == "Ascendant":
            continue
        p2_list.append({
            "name": name, "sign": d["sign"], "sign_index": d["sign_index"],
            "degree": round(d["degree"], 2),
            "house": house_from_asc(d["lon"], asc2_lon),
            "lon": d["lon"]
        })

    # Cross aspects: p2 planets aspecting p1 planets
    aspects = []
    for a in p1_list:
        for b in p2_list:
            diff = angular_diff(a["lon"], b["lon"])
            asp = find_aspect(diff)
            if asp:
                aspects.append({
                    "p1_planet": a["name"], "p1_sign": a["sign"], "p1_house": a["house"],
                    "p2_planet": b["name"], "p2_sign": b["sign"], "p2_house": b["house"],
                    "degree_diff": round(diff, 2),
                    **asp
                })

    # House overlays: where p2 planets fall in p1's houses and vice versa
    p2_in_p1_houses = []
    for p in p2_list:
        house = house_from_asc(p["lon"], asc1_lon)
        p2_in_p1_houses.append({"planet": p["name"], "sign": p["sign"], "house": house})

    p1_in_p2_houses = []
    for p in p1_list:
        house = house_from_asc(p["lon"], asc2_lon)
        p1_in_p2_houses.append({"planet": p["name"], "sign": p["sign"], "house": house})

    # Compatibility summary
    strong = [a for a in aspects if a["nature"] == "strong"]
    tense = [a for a in aspects if a["nature"] == "tense"]
    harmony_score = min(100, len(strong) * 12 - len(tense) * 5 + 50)

    return {
        "p1": {"name": req.p1_name, "planets": p1_list, "ascendant": pos1["Ascendant"]},
        "p2": {"name": req.p2_name, "planets": p2_list, "ascendant": pos2["Ascendant"]},
        "aspects": aspects,
        "p2_in_p1_houses": p2_in_p1_houses,
        "p1_in_p2_houses": p1_in_p2_houses,
        "summary": {
            "total_aspects": len(aspects),
            "strong_aspects": len(strong),
            "tense_aspects": len(tense),
            "harmony_score": harmony_score,
        }
    }


# ── Composite Chart (Midpoint) ────────────────────────────────────────────────

class CompositeRequest(BaseModel):
    p1_year: int; p1_month: int; p1_day: int
    p1_hour: float; p1_minute: float; p1_tz: float
    p1_lat: float; p1_lon: float
    p2_year: int; p2_month: int; p2_day: int
    p2_hour: float; p2_minute: float; p2_tz: float
    p2_lat: float; p2_lon: float
    ayanamsa: str = "lahiri"
    p1_name: str = "Person 1"
    p2_name: str = "Person 2"


def midpoint(lon1: float, lon2: float) -> float:
    """Nearest midpoint between two longitudes."""
    diff = (lon2 - lon1) % 360
    if diff > 180:
        diff -= 360
    return (lon1 + diff / 2) % 360


def get_sign_info(lon: float):
    signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
             "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
    idx = int(lon / 30) % 12
    deg = lon % 30
    return signs[idx], round(deg, 2), idx


@router.post("/composite")
def composite_chart(req: CompositeRequest):
    jd1 = birth_to_jd(req.p1_year, req.p1_month, req.p1_day, req.p1_hour, req.p1_minute, req.p1_tz)
    jd2 = birth_to_jd(req.p2_year, req.p2_month, req.p2_day, req.p2_hour, req.p2_minute, req.p2_tz)

    pl1 = calculate_planets(jd1, req.ayanamsa)
    pl2 = calculate_planets(jd2, req.ayanamsa)

    h1 = calculate_houses(jd1, req.p1_lat, req.p1_lon, req.ayanamsa)
    h2 = calculate_houses(jd2, req.p2_lat, req.p2_lon, req.ayanamsa)

    # Composite planets = midpoints
    composite = {}
    planets_list = list(pl1.keys())
    for p in planets_list:
        if p not in pl2:
            continue
        mp = midpoint(pl1[p]["longitude"], pl2[p]["longitude"])
        sign, deg, sign_idx = get_sign_info(mp)
        composite[p] = {
            "longitude": round(mp, 4),
            "sign": sign, "sign_index": sign_idx, "degree": deg,
            "p1_lon": round(pl1[p]["longitude"], 4),
            "p2_lon": round(pl2[p]["longitude"], 4),
        }

    # Composite Ascendant
    asc_mp = midpoint(h1["ascendant"]["longitude"], h2["ascendant"]["longitude"])
    asc_sign, asc_deg, asc_idx = get_sign_info(asc_mp)
    composite_asc = {"longitude": round(asc_mp, 4), "sign": asc_sign, "degree": asc_deg, "sign_index": asc_idx}

    # House placement in composite chart
    for p in composite:
        comp_house = ((composite[p]["sign_index"] - asc_idx) % 12) + 1
        composite[p]["house"] = comp_house

    planet_house_map: dict = {}
    for p, d in composite.items():
        h = d["house"]
        planet_house_map.setdefault(h, []).append(p)

    return {
        "composite_ascendant": composite_asc,
        "composite_planets": composite,
        "planet_house_map": planet_house_map,
        "p1_name": req.p1_name,
        "p2_name": req.p2_name,
        "note": "Composite midpoint chart shows relationship energy, not individual charts.",
    }
