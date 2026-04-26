"""
Shadbala — 6-source planetary strength system (Parashari).
Returns rupas (units) for each planet. Min required: Sun/Moon/Mars 5, Mercury 7, Jupiter/Venus 6.5, Saturn 5.
"""
from core.engine import SIGNS, SIGN_LORDS, EXALTATION, DEBILITATION, OWN_SIGN

# ── Sthana Bala (positional strength) ────────────────────────────────────────

MOOLATRIKONA = {
    "Sun": "Leo", "Moon": "Taurus", "Mars": "Aries",
    "Mercury": "Virgo", "Jupiter": "Sagittarius",
    "Venus": "Libra", "Saturn": "Aquarius"
}

MOOLATRIKONA_DEGREES = {  # planet is in moolatrikona only up to this degree
    "Sun": 20, "Moon": 27, "Mars": 12, "Mercury": 20,
    "Jupiter": 10, "Venus": 15, "Saturn": 20
}

EXALTATION_DEGREE = {
    "Sun": 10, "Moon": 33, "Mars": 298, "Mercury": 165,
    "Jupiter": 95, "Venus": 357, "Saturn": 200
}  # sidereal longitude of exact exaltation


def sthana_bala(planet: str, sign: str, degree_in_sign: float, sidereal_lon: float) -> float:
    """Returns Sthana Bala in rupas (0–60 scale)."""
    score = 0.0

    # Exaltation/debilitation: interpolate distance from exact exalt point
    if planet in EXALTATION_DEGREE:
        exact = EXALTATION_DEGREE[planet]
        dist = min(abs(sidereal_lon - exact), 360 - abs(sidereal_lon - exact))
        # Max 60 rupas at exact exalt, 0 at exact debil (180° away)
        exalt_score = max(0.0, 60.0 - (dist / 180.0) * 60.0)
        score += exalt_score

    # Moolatrikona
    if planet in MOOLATRIKONA and sign == MOOLATRIKONA[planet]:
        if degree_in_sign <= MOOLATRIKONA_DEGREES.get(planet, 30):
            score += 45.0

    # Own sign
    if planet in OWN_SIGN and sign in OWN_SIGN[planet]:
        if not (planet in MOOLATRIKONA and sign == MOOLATRIKONA[planet]):
            score += 30.0

    # Friendly/neutral/enemy (simplified — use lord relationships)
    friend_score = _friendship_score(planet, sign)
    score += friend_score

    return round(score, 2)


PLANET_FRIENDS = {
    "Sun":     {"friends": ["Moon","Mars","Jupiter"], "enemies": ["Venus","Saturn"], "neutral": ["Mercury"]},
    "Moon":    {"friends": ["Sun","Mercury"], "enemies": [], "neutral": ["Mars","Jupiter","Venus","Saturn"]},
    "Mars":    {"friends": ["Sun","Moon","Jupiter"], "enemies": ["Mercury"], "neutral": ["Venus","Saturn"]},
    "Mercury": {"friends": ["Sun","Venus"], "enemies": ["Moon"], "neutral": ["Mars","Jupiter","Saturn"]},
    "Jupiter": {"friends": ["Sun","Moon","Mars"], "enemies": ["Mercury","Venus"], "neutral": ["Saturn"]},
    "Venus":   {"friends": ["Mercury","Saturn"], "enemies": ["Sun","Moon"], "neutral": ["Mars","Jupiter"]},
    "Saturn":  {"friends": ["Mercury","Venus"], "enemies": ["Sun","Moon","Mars"], "neutral": ["Jupiter"]},
}


def _friendship_score(planet: str, sign: str) -> float:
    lord = SIGN_LORDS.get(sign)
    if planet == lord or planet not in PLANET_FRIENDS:
        return 0.0
    rels = PLANET_FRIENDS[planet]
    if lord in rels["friends"]:
        return 15.0
    if lord in rels["enemies"]:
        return 5.0
    return 10.0  # neutral


# ── Dig Bala (directional strength) ──────────────────────────────────────────
# Each planet has strongest house (full 60r) and weakest (0r)

DIG_BALA_STRONG = {"Sun": 10, "Mars": 10, "Jupiter": 1, "Mercury": 1, "Moon": 4, "Venus": 4, "Saturn": 7}
DIG_BALA_WEAK   = {"Sun": 4,  "Mars": 4,  "Jupiter": 7, "Mercury": 7, "Moon": 10, "Venus": 10, "Saturn": 1}


def dig_bala(planet: str, house: int) -> float:
    if planet not in DIG_BALA_STRONG:
        return 0.0
    strong = DIG_BALA_STRONG[planet]
    weak = DIG_BALA_WEAK[planet]
    # Distance from strong house (max=6 houses away)
    dist = min(abs(house - strong), 12 - abs(house - strong))
    score = 60.0 * (1.0 - dist / 6.0)
    return round(score, 2)


# ── Kala Bala (temporal strength, simplified) ─────────────────────────────────

DAY_PLANETS  = ["Sun", "Jupiter", "Saturn"]
NIGHT_PLANETS = ["Moon", "Venus", "Mars"]

def kala_bala_day_night(planet: str, is_day_birth: bool) -> float:
    if planet in DAY_PLANETS:
        return 60.0 if is_day_birth else 30.0
    if planet in NIGHT_PLANETS:
        return 60.0 if not is_day_birth else 30.0
    return 45.0  # Mercury is equal


def kala_bala_paksha(planet: str, moon_phase: float) -> float:
    """Moon phase 0-360. Waxing (0-180) = Shukla paksha."""
    is_shukla = moon_phase < 180
    if planet == "Moon":
        return (moon_phase / 180.0) * 60.0 if is_shukla else ((360 - moon_phase) / 180.0) * 60.0
    if planet in ["Jupiter", "Venus", "Mercury"]:
        return 60.0 if is_shukla else 30.0
    if planet in ["Sun", "Mars", "Saturn"]:
        return 30.0 if is_shukla else 60.0
    return 30.0


# ── Naisargika Bala (natural strength — fixed) ────────────────────────────────

NAISARGIKA = {
    "Saturn": 1.0, "Mars": 2.0, "Mercury": 3.0,
    "Jupiter": 4.0, "Venus": 5.0, "Moon": 6.0, "Sun": 7.0
}  # rupas (normalized to 0-60 scale × 8.57)

NAISARGIKA_RUPAS = {k: round(v * 8.571, 2) for k, v in NAISARGIKA.items()}


# ── Drik Bala (aspectual strength, simplified) ────────────────────────────────
# Full calculation requires all planet aspects — approximated here

ASPECT_STRENGTH = {
    "full":    1.0,
    "three_quarter": 0.75,
    "half":    0.5,
    "quarter": 0.25,
}

# Planet special aspects (beyond 7th house full aspect)
SPECIAL_ASPECTS = {
    "Mars":    [4, 8],      # 4th and 8th
    "Jupiter": [5, 9],      # 5th and 9th
    "Saturn":  [3, 10],     # 3rd and 10th
    "Rahu":    [5, 9],
    "Ketu":    [5, 9],
}


def compute_drik_bala(planet: str, house: int, all_planets: dict) -> float:
    """Simplified Drik Bala: sum aspect strengths from benefics (positive) and malefics (negative)."""
    BENEFICS = {"Jupiter", "Venus", "Moon", "Mercury"}
    MALEFICS = {"Sun", "Mars", "Saturn", "Rahu", "Ketu"}
    score = 0.0
    for other, info in all_planets.items():
        if other == planet:
            continue
        other_house = info.get("house", 1)
        strength = _aspect_strength(other, other_house, house)
        if strength > 0:
            delta = strength * 15.0
            score += delta if other in BENEFICS else -delta
    return round(max(0.0, score + 30.0), 2)  # normalize around 30


def _aspect_strength(aspecting: str, from_house: int, to_house: int) -> float:
    diff = (to_house - from_house) % 12
    if diff == 6:  # 7th house aspect
        return 1.0
    # Special aspects
    specials = SPECIAL_ASPECTS.get(aspecting, [])
    for s in specials:
        if diff + 1 == s:
            return 0.75
    return 0.0


# ── Master: compute full Shadbala ────────────────────────────────────────────

def compute_shadbala(planets: dict, ascendant: dict, is_day_birth: bool, moon_phase: float = 90.0) -> dict:
    """
    planets: dict from engine.py chart response
    ascendant: {"sign": str, "degree": float}
    is_day_birth: bool
    moon_phase: degrees from Sun to Moon (0-360)
    Returns: {planet_name: {sthana, dig, kala, naisargika, drik, total, required, sufficient}}
    """
    REQUIRED = {
        "Sun": 5.0, "Moon": 5.0, "Mars": 5.0,
        "Mercury": 7.0, "Jupiter": 6.5, "Venus": 6.5, "Saturn": 5.0
    }

    result = {}
    planets_simple = {k: {"house": v.get("house", 1)} for k, v in planets.items()}

    for name, p in planets.items():
        if name in ("Rahu", "Ketu"):
            continue
        sign = p.get("sign", "Aries")
        deg_in_sign = p.get("degree", 0.0)
        house = p.get("house", 1)
        sidereal_lon = (SIGNS.index(sign) * 30 + deg_in_sign) if sign in SIGNS else 0.0

        sb = sthana_bala(name, sign, deg_in_sign, sidereal_lon)
        db = dig_bala(name, house)
        kb = (kala_bala_day_night(name, is_day_birth) + kala_bala_paksha(name, moon_phase)) / 2
        nb = NAISARGIKA_RUPAS.get(name, 0.0)
        drk = compute_drik_bala(name, house, planets_simple)

        total_rupas = round((sb + db + kb + nb + drk) / 60.0, 3)  # convert to rupas
        req = REQUIRED.get(name, 5.0)

        result[name] = {
            "sthana_bala": sb,
            "dig_bala": db,
            "kala_bala": round(kb, 2),
            "naisargika_bala": nb,
            "drik_bala": drk,
            "total_rupas": total_rupas,
            "required_rupas": req,
            "sufficient": total_rupas >= req,
        }

    return result
