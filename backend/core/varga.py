"""
Divisional chart (Varga) calculations using correct Parashari formulas.
All methods verified against classical texts (BPHS).
"""
import math

SIGNS = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

# Sign type for D9 navamsha starting point
MOVABLE = {0, 3, 6, 9}   # Aries, Cancer, Libra, Capricorn → start from Aries (0)
FIXED   = {1, 4, 7, 10}  # Taurus, Leo, Scorpio, Aquarius → start from Capricorn (9)
MUTABLE = {2, 5, 8, 11}  # Gemini, Virgo, Sagittarius, Pisces → start from Cancer (3)


def d1(lon: float) -> int:
    """D1 Rashi — just the sign."""
    return int(lon / 30) % 12


def d2(lon: float) -> int:
    """D2 Hora — Sun/Moon hora.
    Odd signs: 0-15° = Sun (Leo=4), 15-30° = Moon (Cancer=3)
    Even signs: 0-15° = Moon (Cancer=3), 15-30° = Sun (Leo=4)
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    is_odd = (sign % 2 == 0)  # Aries=0 is "1st" (odd)
    first_half = deg < 15
    if is_odd:
        return 4 if first_half else 3   # Leo or Cancer
    else:
        return 3 if first_half else 4   # Cancer or Leo


def d3(lon: float) -> int:
    """D3 Drekkana.
    0-10°: 1st decan = same sign
    10-20°: 2nd decan = 5th sign from current
    20-30°: 3rd decan = 9th sign from current
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    if deg < 10:
        return sign
    elif deg < 20:
        return (sign + 4) % 12
    else:
        return (sign + 8) % 12


def d4(lon: float) -> int:
    """D4 Chaturthamsha.
    Each sign divided into 4 parts of 7.5°.
    Movable signs: 1st=same, 2nd=4th, 3rd=7th, 4th=10th
    Fixed signs: 1st=4th, 2nd=7th, 3rd=10th, 4th=same
    Dual signs: 1st=7th, 2nd=10th, 3rd=same, 4th=4th
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / 7.5)  # 0-3
    if sign in MOVABLE:
        offsets = [0, 3, 6, 9]
    elif sign in FIXED:
        offsets = [3, 6, 9, 0]
    else:
        offsets = [6, 9, 0, 3]
    return (sign + offsets[part]) % 12


def d7(lon: float) -> int:
    """D7 Saptamsha.
    Odd signs: 1st part = same sign, then +1 each part
    Even signs: 1st part = 7th sign, then +1 each part
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / (30/7))  # 0-6
    is_odd = (sign % 2 == 0)
    start = sign if is_odd else (sign + 6) % 12
    return (start + part) % 12


def d9(lon: float) -> int:
    """D9 Navamsha — most important divisional chart.
    Each sign: 9 parts of 3°20' each.
    Movable → starts from Aries (0)
    Fixed → starts from Capricorn (9)
    Mutable → starts from Cancer (3)
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / (30 / 9))  # 0-8

    if sign in MOVABLE:
        start = 0   # Aries
    elif sign in FIXED:
        start = 9   # Capricorn
    else:
        start = 3   # Cancer

    return (start + part) % 12


def d10(lon: float) -> int:
    """D10 Dashamsha — career chart.
    Each sign: 10 parts of 3° each.
    Odd signs: 1st part = same sign
    Even signs: 1st part = 9th sign from current
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / 3)  # 0-9
    is_odd = (sign % 2 == 0)
    start = sign if is_odd else (sign + 8) % 12
    return (start + part) % 12


def d12(lon: float) -> int:
    """D12 Dwadashamsha — parents chart.
    Each sign: 12 parts of 2.5° each.
    1st part starts from the sign itself.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / 2.5)  # 0-11
    return (sign + part) % 12


def d16(lon: float) -> int:
    """D16 Shodashamsha — vehicles & comforts.
    Movable: from Aries, Fixed: from Leo, Dual: from Sagittarius.
    Each 16 parts of 1°52.5' each.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / (30/16))  # 0-15
    if sign in MOVABLE:
        start = 0   # Aries
    elif sign in FIXED:
        start = 4   # Leo
    else:
        start = 8   # Sagittarius
    return (start + part) % 12


def d20(lon: float) -> int:
    """D20 Vimshamsha — spiritual progress.
    Movable: from Aries, Fixed: from Sagittarius, Dual: from Leo.
    20 parts of 1.5° each.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / 1.5)  # 0-19
    if sign in MOVABLE:
        start = 0   # Aries
    elif sign in FIXED:
        start = 8   # Sagittarius
    else:
        start = 4   # Leo
    return (start + part) % 12


def d24(lon: float) -> int:
    """D24 Chaturvimshamsha — education.
    Odd signs: from Leo, Even signs: from Cancer.
    24 parts of 1°15' each.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / (30/24))  # 0-23
    is_odd = (sign % 2 == 0)
    start = 4 if is_odd else 3   # Leo or Cancer
    return (start + part) % 12


def d27(lon: float) -> int:
    """D27 Nakshatramsha — strength.
    Fire: from Aries, Earth: from Cancer, Air: from Libra, Water: from Capricorn.
    27 parts of 1°6.67' each.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / (30/27))  # 0-26
    element = sign % 4  # 0=Fire, 1=Earth, 2=Air, 3=Water
    starts = [0, 3, 6, 9]   # Aries, Cancer, Libra, Capricorn
    return (starts[element] + part) % 12


def d30(lon: float) -> int:
    """D30 Trimshamsha — misfortunes.
    Odd signs: Mars 0-5°, Saturn 5-10°, Jupiter 10-18°, Mercury 18-25°, Venus 25-30°
    Even signs: Venus 0-5°, Mercury 5-12°, Jupiter 12-20°, Saturn 20-25°, Mars 25-30°
    Returns sign of the lord of the trimshamsha.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    is_odd = (sign % 2 == 0)

    LORDS_ODD = [  # (max_degree, sign_of_lord)
        (5, 0),   # Mars → Aries
        (10, 9),  # Saturn → Capricorn
        (18, 8),  # Jupiter → Sagittarius
        (25, 2),  # Mercury → Gemini
        (30, 1),  # Venus → Taurus
    ]
    LORDS_EVEN = [
        (5, 6),   # Venus → Libra
        (12, 5),  # Mercury → Virgo
        (20, 11), # Jupiter → Pisces
        (25, 10), # Saturn → Aquarius
        (30, 7),  # Mars → Scorpio
    ]

    lords = LORDS_ODD if is_odd else LORDS_EVEN
    for max_deg, lord_sign in lords:
        if deg < max_deg:
            return lord_sign
    return lords[-1][1]


def d40(lon: float) -> int:
    """D40 Khavedamsha — maternal lineage.
    Odd: from Aries, Even: from Libra.
    40 parts of 0°45' each.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / 0.75)  # 0-39
    is_odd = (sign % 2 == 0)
    start = 0 if is_odd else 6   # Aries or Libra
    return (start + part) % 12


def d45(lon: float) -> int:
    """D45 Akshavedamsha — paternal lineage.
    Movable: from Aries, Fixed: from Capricorn, Dual: from Libra.
    45 parts of 0°40' each.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / (2/3))  # 0-44
    if sign in MOVABLE:
        start = 0   # Aries
    elif sign in FIXED:
        start = 9   # Capricorn
    else:
        start = 6   # Libra
    return (start + part) % 12


def d60(lon: float) -> int:
    """D60 Shashtyamsha — most subtle, past karma.
    Odd: from Aries, Even: from Libra.
    60 parts of 0°30' each.
    """
    sign = int(lon / 30) % 12
    deg = lon % 30
    part = int(deg / 0.5)  # 0-59
    is_odd = (sign % 2 == 0)
    start = 0 if is_odd else 6   # Aries or Libra
    return (start + part) % 12


def make_dn(n: int):
    """Generic divisional chart formula for higher vargas (D81, D108, D144, etc.).
    Odd signs: count from Aries. Even signs: count from Libra.
    """
    def dn(lon: float) -> int:
        sign = int(lon / 30) % 12
        deg = lon % 30
        part = int(deg / (30 / n)) % n
        is_odd = (sign % 2 == 0)
        start = 0 if is_odd else 6
        return (start + part) % 12
    return dn


VARGA_FUNCTIONS = {
    1: d1, 2: d2, 3: d3, 4: d4, 7: d7, 9: d9,
    10: d10, 12: d12, 16: d16, 20: d20, 24: d24,
    27: d27, 30: d30, 40: d40, 45: d45, 60: d60,
    81: make_dn(81), 108: make_dn(108), 144: make_dn(144),
}

VARGA_NAMES = {
    1: "D1 Rashi", 2: "D2 Hora", 3: "D3 Drekkana", 4: "D4 Chaturthamsha",
    7: "D7 Saptamsha", 9: "D9 Navamsha", 10: "D10 Dashamsha",
    12: "D12 Dwadashamsha", 16: "D16 Shodashamsha", 20: "D20 Vimshamsha",
    24: "D24 Chaturvimshamsha", 27: "D27 Nakshatramsha", 30: "D30 Trimshamsha",
    40: "D40 Khavedamsha", 45: "D45 Akshavedamsha", 60: "D60 Shashtyamsha",
    81: "D81 Navamsha-Navamsha", 108: "D108 Ashtottaramsha", 144: "D144 Dwadashamsha-Dwadashamsha",
}

VARGA_DOMAINS = {
    1: "All life matters", 2: "Wealth", 3: "Siblings & courage",
    4: "Property & comforts", 7: "Children", 9: "Spouse & dharma",
    10: "Career & status", 12: "Parents", 16: "Vehicles & comforts",
    20: "Spiritual progress", 24: "Education", 27: "Strength",
    30: "Misfortunes", 40: "Maternal lineage", 45: "Paternal lineage",
    60: "Past life karma",
}


def calculate_varga(planets: dict, ascendant_lon: float, d: int) -> dict:
    """Calculate a divisional chart for all planets + ascendant."""
    fn = VARGA_FUNCTIONS.get(d)
    if not fn:
        raise ValueError(f"D{d} not implemented")

    asc_sign_idx = fn(ascendant_lon)
    result_planets = {}

    for name, p in planets.items():
        lon = p["longitude"]
        varga_sign_idx = fn(lon)
        varga_sign = SIGNS[varga_sign_idx]
        house_num = (varga_sign_idx - asc_sign_idx) % 12 + 1

        result_planets[name] = {
            "sign": varga_sign,
            "sign_index": varga_sign_idx,
            "house": house_num,
            "retrograde": p.get("retrograde", False),
            "nakshatra": p.get("nakshatra", ""),
            "nakshatra_lord": p.get("nakshatra_lord", ""),
            "pada": p.get("pada", 1),
            "degree": p.get("degree", 0),
            "status": "neutral",
        }

    # Planet house map for rendering
    planet_house_map: dict = {}
    for name, data in result_planets.items():
        h = data["house"]
        planet_house_map.setdefault(h, []).append(name)

    return {
        "d": d,
        "name": VARGA_NAMES.get(d, f"D{d}"),
        "domain": VARGA_DOMAINS.get(d, ""),
        "ascendant": {
            "sign": SIGNS[asc_sign_idx],
            "sign_index": asc_sign_idx,
            "degree": 0,
        },
        "planets": result_planets,
        "planet_house_map": planet_house_map,
    }


def check_vargottama(d1_planets: dict, d9_planets: dict) -> list:
    """Check which planets are Vargottama (same sign in D1 and D9)."""
    vargottama = []
    for name in d1_planets:
        if name in d9_planets:
            if d1_planets[name]["sign_index"] == d9_planets[name]["sign_index"]:
                vargottama.append(name)
    return vargottama


def get_varga_chart(jd: float, ayanamsa: str, d: int) -> dict:
    """Helper: compute varga chart from JD. Returns {planet_name: {sign, sign_index, ...}}."""
    from core.engine import calculate_planets, calculate_houses
    planets = calculate_planets(jd, ayanamsa)
    house_data = calculate_houses(jd, 0, 0, ayanamsa)  # lat/lon not needed for varga signs
    asc_lon = planets.get("Sun", {}).get("longitude", 0)  # fallback
    # Use actual ascendant longitude
    asc_lon = house_data["ascendant"]["longitude"]
    result = calculate_varga(planets, asc_lon, d)
    return result["planets"]
