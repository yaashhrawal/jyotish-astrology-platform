"""
Jaimini Rashi Aspects — sign-to-sign aspects (not degree-based like Parashari).
Movable signs aspect Fixed signs (except adjacent).
Fixed signs aspect Movable signs (except adjacent).
Dual signs aspect each other.
All signs aspect the 7th from them (like Parashari opposition).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter()

MOVABLE = [0, 3, 6, 9]    # Aries, Cancer, Libra, Capricorn
FIXED   = [1, 4, 7, 10]   # Taurus, Leo, Scorpio, Aquarius
DUAL    = [2, 5, 8, 11]   # Gemini, Virgo, Sagittarius, Pisces


def get_sign_type(idx: int) -> str:
    if idx in MOVABLE: return "movable"
    if idx in FIXED:   return "fixed"
    return "dual"


def jaimini_aspects_from(sign_idx: int) -> list[int]:
    """Returns list of sign indices aspected by sign_idx."""
    stype = get_sign_type(sign_idx)
    aspected = []

    if stype == "movable":
        # Aspects all fixed signs except adjacent
        for f in FIXED:
            diff = abs(f - sign_idx)
            if diff != 1 and diff != 11:  # not adjacent
                aspected.append(f)
    elif stype == "fixed":
        # Aspects all movable signs except adjacent
        for m in MOVABLE:
            diff = abs(m - sign_idx)
            if diff != 1 and diff != 11:
                aspected.append(m)
    else:  # dual
        # Aspects all other dual signs
        for d in DUAL:
            if d != sign_idx:
                aspected.append(d)

    # All signs aspect 7th
    seventh = (sign_idx + 6) % 12
    if seventh not in aspected:
        aspected.append(seventh)

    return aspected


class JaiminiAspectRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/jaimini_aspects")
def compute_jaimini_aspects(req: JaiminiAspectRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc["sign_index"]

    # Planet sign indices
    planet_signs: dict[str, int] = {name: pd["sign_index"] for name, pd in planets.items()}
    planet_signs["Ascendant"] = asc_idx

    # For each planet/asc, find what signs/planets it aspects
    aspect_matrix = []
    for source, src_idx in planet_signs.items():
        aspected_signs = jaimini_aspects_from(src_idx)
        aspected_planets = []
        for target, tgt_idx in planet_signs.items():
            if target != source and tgt_idx in aspected_signs:
                aspected_planets.append(target)

        aspect_matrix.append({
            "from": source,
            "from_sign": SIGNS[src_idx],
            "from_type": get_sign_type(src_idx),
            "from_house": (src_idx - asc_idx) % 12 + 1,
            "aspects_signs": [SIGNS[i] for i in aspected_signs],
            "aspects_planets": aspected_planets,
        })

    # Mutual aspects
    mutual = []
    names = list(planet_signs.keys())
    for i in range(len(names)):
        for j in range(i+1, len(names)):
            a, b = names[i], names[j]
            a_aspects = jaimini_aspects_from(planet_signs[a])
            b_aspects = jaimini_aspects_from(planet_signs[b])
            if planet_signs[b] in a_aspects and planet_signs[a] in b_aspects:
                mutual.append({
                    "planet1": a, "sign1": SIGNS[planet_signs[a]],
                    "planet2": b, "sign2": SIGNS[planet_signs[b]],
                    "type": "mutual",
                })

    # Sign-by-sign aspect grid (12x12)
    grid = []
    for i in range(12):
        row = {"sign": SIGNS[i], "sign_index": i, "aspects": []}
        aspected = jaimini_aspects_from(i)
        for j in range(12):
            row["aspects"].append(j in aspected)
        grid.append(row)

    return {
        "ascendant": asc,
        "aspect_matrix": aspect_matrix,
        "mutual_aspects": mutual,
        "sign_grid": grid,
        "note": "Jaimini aspects are sign-to-sign. Movable↔Fixed (non-adjacent), Dual↔Dual, All↔7th.",
    }
