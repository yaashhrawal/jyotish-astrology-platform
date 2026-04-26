"""
Argala & Virodha Argala — Jaimini Sutras 1.4.1–29.
Argala = intervention/obstruction on a house from specific relative positions.
Virodha (counter-argala) cancels argala when stronger.
Primary argalas: 2H, 4H, 11H, 5H (secondary).
Virodha (counter): 12H counters 2H; 10H counters 4H; 3H counters 11H; 9H counters 5H.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter(tags=["argala"])

# Argala positions relative to a house/lagna (1-based offset)
ARGALA_POSITIONS = {
    "primary_2":   {"offset": 2,  "type": "primary",   "nature": "wealth",  "desc": "2H argala — sustaining, wealth-giving intervention"},
    "primary_4":   {"offset": 4,  "type": "primary",   "nature": "comfort", "desc": "4H argala — comfort, home, happiness intervention"},
    "primary_11":  {"offset": 11, "type": "primary",   "nature": "gains",   "desc": "11H argala — gains, fulfillment of desires"},
    "secondary_5": {"offset": 5,  "type": "secondary", "nature": "merit",   "desc": "5H argala — past-life merit, children, intellect (weaker)"},
}

VIRODHA_POSITIONS = {
    "primary_2":   12,   # 12H counters 2H argala
    "primary_4":   10,   # 10H counters 4H argala
    "primary_11":  3,    # 3H counters 11H argala
    "secondary_5": 9,    # 9H counters 5H argala
}

MALEFICS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}
BENEFICS = {"Jupiter", "Venus", "Moon", "Mercury"}

def planet_count_quality(planets: list) -> dict:
    mal = [p for p in planets if p in MALEFICS]
    ben = [p for p in planets if p in BENEFICS]
    return {"planets": planets, "malefics": mal, "benefics": ben, "total": len(planets)}


def is_virodha_effective(argala_info: dict, virodha_info: dict) -> tuple[bool, str]:
    """
    Virodha cancels argala when:
    - More planets in virodha position than argala position, OR
    - Equal planets but virodha has more malefics (stronger opposition)
    """
    a_total = argala_info["total"]
    v_total = virodha_info["total"]

    if v_total == 0:
        return False, "No planets in virodha position — argala stands"
    if a_total == 0:
        return False, "No argala planets — nothing to counter"

    if v_total > a_total:
        return True, f"Virodha ({v_total} planets) outnumbers argala ({a_total}) — cancelled"
    elif v_total == a_total:
        if len(virodha_info["malefics"]) > len(argala_info["malefics"]):
            return True, "Equal count but virodha has more malefics — cancelled"
        else:
            return False, "Equal count, argala has equal/more malefics — argala stands"
    else:
        return False, f"Argala ({a_total} planets) stronger than virodha ({v_total}) — argala stands"


def get_argala_nature(argala_info: dict, argala_key: str) -> str:
    if not argala_info["planets"]:
        return "none"
    mal_count = len(argala_info["malefics"])
    ben_count = len(argala_info["benefics"])
    if ben_count > mal_count:
        return "benefic"
    elif mal_count > ben_count:
        return "malefic"
    else:
        return "mixed"


def compute_argala_for_house(house_idx: int, house_planet_map: dict, total_signs: int = 12) -> dict:
    result = {}

    for key, argala_def in ARGALA_POSITIONS.items():
        offset = argala_def["offset"]
        argala_sign_idx = (house_idx + offset - 1) % 12
        virodha_sign_idx = (house_idx + VIRODHA_POSITIONS[key] - 1) % 12

        argala_planets = house_planet_map.get(argala_sign_idx, [])
        virodha_planets = house_planet_map.get(virodha_sign_idx, [])

        argala_info = planet_count_quality(argala_planets)
        virodha_info = planet_count_quality(virodha_planets)

        cancelled, cancel_reason = is_virodha_effective(argala_info, virodha_info)
        nature = get_argala_nature(argala_info, key)

        result[key] = {
            "argala_house": offset,
            "argala_sign": SIGNS[argala_sign_idx],
            "argala_planets": argala_planets,
            "argala_nature": nature,
            "virodha_house": VIRODHA_POSITIONS[key],
            "virodha_sign": SIGNS[virodha_sign_idx],
            "virodha_planets": virodha_planets,
            "is_cancelled": cancelled,
            "effective": len(argala_planets) > 0 and not cancelled,
            "cancel_reason": cancel_reason,
            "type": argala_def["type"],
            "nature_of_house": argala_def["nature"],
            "description": argala_def["desc"],
        }

    return result


def overall_argala_verdict(argalas: dict) -> dict:
    effective = [k for k, v in argalas.items() if v["effective"]]
    benefic_argalas = [k for k in effective if argalas[k]["argala_nature"] == "benefic"]
    malefic_argalas = [k for k in effective if argalas[k]["argala_nature"] == "malefic"]
    cancelled = [k for k, v in argalas.items() if v["is_cancelled"]]

    if not effective:
        verdict = "No effective argala — house operates independently"
        strength = "weak"
    elif len(benefic_argalas) >= len(malefic_argalas):
        verdict = f"Net benefic argala ({len(benefic_argalas)} auspicious) — house significations flourish"
        strength = "strong"
    else:
        verdict = f"Net malefic argala ({len(malefic_argalas)} inauspicious) — house significations obstructed"
        strength = "afflicted"

    return {
        "effective_argalas": effective,
        "benefic_argalas": benefic_argalas,
        "malefic_argalas": malefic_argalas,
        "cancelled_argalas": cancelled,
        "verdict": verdict,
        "strength": strength,
    }


HOUSE_SIGNIFICATIONS = [
    "Self, personality, dharma lagna",
    "Wealth, speech, family, accumulated assets",
    "Siblings, courage, efforts, short journeys",
    "Mother, home, education, happiness",
    "Children, intellect, purva punya, creativity",
    "Enemies, disease, service, debts",
    "Spouse, partnerships, foreign travel",
    "Longevity, occult, inheritance, transformation",
    "Father, dharma, higher wisdom, guru, luck",
    "Career, authority, status, dharmic action",
    "Gains, elder siblings, aspirations, income",
    "Moksha, losses, spirituality, foreign lands",
]


class ArgalaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    target_houses: list[int] = list(range(1, 13))  # Default: all 12 houses


@router.post("/argala")
def get_argala(req: ArgalaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_sign_idx = asc.get("sign_index", SIGNS.index(asc["sign"]))

    # Map sign index → list of planets
    sign_planet_map: dict[int, list] = {}
    planet_house_map: dict[str, int] = {}
    for name, pd in planets.items():
        si = pd.get("sign_index", SIGNS.index(pd["sign"]) if pd["sign"] in SIGNS else 0)
        sign_planet_map.setdefault(si, []).append(name)
        house = (si - asc_sign_idx) % 12 + 1
        planet_house_map[name] = house

    # Also build 0-indexed house planet map (house 1 = asc_sign_idx)
    house_to_sign_idx = {h: (asc_sign_idx + h - 1) % 12 for h in range(1, 13)}

    houses_result = {}
    for h in req.target_houses:
        house_sign_idx = house_to_sign_idx[h]
        argalas = compute_argala_for_house(house_sign_idx, sign_planet_map)
        verdict = overall_argala_verdict(argalas)
        houses_result[h] = {
            "house": h,
            "sign": SIGNS[house_sign_idx],
            "signification": HOUSE_SIGNIFICATIONS[h - 1],
            "planets_in_house": sign_planet_map.get(house_sign_idx, []),
            "argala_analysis": argalas,
            "verdict": verdict,
        }

    return {
        "houses": houses_result,
        "ascendant": asc,
        "planet_house_map": planet_house_map,
        "summary": {
            "strongly_supported": [h for h, v in houses_result.items() if v["verdict"]["strength"] == "strong"],
            "afflicted": [h for h, v in houses_result.items() if v["verdict"]["strength"] == "afflicted"],
            "independent": [h for h, v in houses_result.items() if v["verdict"]["strength"] == "weak"],
        }
    }
