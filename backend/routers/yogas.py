from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, assign_planets_to_houses, SIGN_LORDS
from core.varga import get_varga_chart

router = APIRouter()


class BirthData(BaseModel):
    year: int
    month: int
    day: int
    hour: int
    minute: int
    tz_offset: float
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"


SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
         "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]

# Lagna → [H1lord, H2lord, ... H12lord]
def house_lords(asc_sign: str) -> dict:
    """Return {house_num: lord} for given ascendant sign."""
    asc_idx = SIGNS.index(asc_sign)
    return {((i - asc_idx) % 12) + 1: SIGN_LORDS[SIGNS[i]] for i in range(12)}


def is_kendra(h: int) -> bool:
    return h in [1, 4, 7, 10]


def is_trikona(h: int) -> bool:
    return h in [1, 5, 9]


def is_dusthana(h: int) -> bool:
    return h in [6, 8, 12]


def houses_apart(h1: int, h2: int) -> int:
    """How many houses is h2 from h1 (1-12)."""
    return ((h2 - h1) % 12) + 1


def in_kendra_from(ref: int, target: int) -> bool:
    diff = (target - ref) % 12
    return diff in [0, 3, 6, 9]


def detect_yogas(planets: dict, house_map: dict, asc: dict, jd: float = None, ayanamsa: str = "lahiri") -> list:
    yogas = []
    asc_sign = asc["sign"]
    asc_idx = SIGNS.index(asc_sign)
    hlords = house_lords(asc_sign)  # {1: "Mars", 2: "Jupiter", ...}
    # Reverse: lord → houses it rules
    lord_houses: dict[str, list[int]] = {}
    for h, lord in hlords.items():
        lord_houses.setdefault(lord, []).append(h)

    def house_of(p): return planets.get(p, {}).get("house")
    def sign_of(p):  return planets.get(p, {}).get("sign")
    def status_of(p): return planets.get(p, {}).get("status")
    def retro(p):    return planets.get(p, {}).get("retrograde", False)

    # ── 1. PANCHA MAHAPURUSHA ─────────────────────────────────────────────────
    mahapurusha = {
        "Mars":    ("Ruchaka",  ["Aries","Scorpio","Capricorn"]),
        "Mercury": ("Bhadra",   ["Gemini","Virgo"]),
        "Jupiter": ("Hamsa",    ["Sagittarius","Pisces","Cancer"]),
        "Venus":   ("Malavya",  ["Taurus","Libra","Pisces"]),
        "Saturn":  ("Shasha",   ["Capricorn","Aquarius","Libra"]),
    }
    for planet, (name, signs) in mahapurusha.items():
        if sign_of(planet) in signs and is_kendra(house_of(planet) or 0):
            yogas.append({"name": name, "type": "Pancha Mahapurusha",
                "description": f"{planet} in {sign_of(planet)} in kendra H{house_of(planet)} — Mahapurusha Yoga",
                "strength": "strong"})

    # ── 2. GAJAKESARI ─────────────────────────────────────────────────────────
    jh, mh = house_of("Jupiter"), house_of("Moon")
    if jh and mh and in_kendra_from(mh, jh):
        yogas.append({"name": "Gajakesari Yoga", "type": "Raj Yoga",
            "description": f"Jupiter H{jh} in kendra from Moon H{mh} — power, fame, wisdom",
            "strength": "strong"})

    # ── 3. BUDHADITYA ─────────────────────────────────────────────────────────
    if sign_of("Sun") == sign_of("Mercury"):
        yogas.append({"name": "Budhaditya Yoga", "type": "Intelligence Yoga",
            "description": f"Sun+Mercury in {sign_of('Sun')} — sharp intellect, administrative skill",
            "strength": "moderate"})

    # ── 4. CHANDRA MANGALA ────────────────────────────────────────────────────
    if sign_of("Moon") == sign_of("Mars"):
        yogas.append({"name": "Chandra Mangala Yoga", "type": "Wealth Yoga",
            "description": f"Moon+Mars in {sign_of('Moon')} — wealth through enterprise",
            "strength": "moderate"})

    # ── 5. RAJ YOGA (kendra + trikona lord combination) ───────────────────────
    kendra_lords = {hlords[h] for h in [1,4,7,10]}
    trikona_lords = {hlords[h] for h in [1,5,9]}
    # Conjunction or mutual aspect (7th house aspect)
    for kl in kendra_lords:
        for tl in trikona_lords:
            if kl == tl:
                # Same planet rules both — strong Raj Yoga
                h = house_of(kl)
                if h and is_kendra(h):
                    yogas.append({"name": "Raj Yoga", "type": "Raj Yoga",
                        "description": f"{kl} rules both kendra and trikona — powerful Raj Yoga in H{h}",
                        "strength": "strong"})
                continue
            # Conjunction
            if sign_of(kl) == sign_of(tl) and kl in planets and tl in planets:
                yogas.append({"name": "Raj Yoga", "type": "Raj Yoga",
                    "description": f"{kl}+{tl} (kendra+trikona lords) conjunct in {sign_of(kl)}",
                    "strength": "strong"})
            # Mutual aspect (7th house)
            hkl, htl = house_of(kl), house_of(tl)
            if hkl and htl and abs(hkl - htl) in [6]:  # opposite = 7th aspect
                yogas.append({"name": "Raj Yoga", "type": "Raj Yoga",
                    "description": f"{kl} (H{hkl}) and {tl} (H{htl}) mutually aspecting — Raj Yoga",
                    "strength": "moderate"})

    # ── 6. DHANA YOGA (wealth) ────────────────────────────────────────────────
    dhana_lords = {hlords.get(1), hlords.get(2), hlords.get(5), hlords.get(9), hlords.get(11)}
    dhana_lords.discard(None)
    # Any two dhana lords conjunct
    dhana_list = [p for p in dhana_lords if p in planets]
    for i in range(len(dhana_list)):
        for j in range(i+1, len(dhana_list)):
            p1, p2 = dhana_list[i], dhana_list[j]
            if sign_of(p1) == sign_of(p2):
                yogas.append({"name": "Dhana Yoga", "type": "Wealth Yoga",
                    "description": f"{p1}+{p2} (lords of wealth houses) conjunct in {sign_of(p1)}",
                    "strength": "moderate"})

    # ── 7. VIPARITA RAJ YOGA ─────────────────────────────────────────────────
    # Lord of 6 in 8 or 12; lord of 8 in 6 or 12; lord of 12 in 6 or 8
    dusthana_set = {6, 8, 12}
    for h in [6, 8, 12]:
        lord = hlords.get(h)
        if lord and lord in planets:
            lh = house_of(lord)
            other_dusthanas = dusthana_set - {h}
            if lh in other_dusthanas:
                yogas.append({"name": "Viparita Raj Yoga", "type": "Raj Yoga",
                    "description": f"Lord of H{h} ({lord}) in H{lh} — obstacles become opportunities",
                    "strength": "moderate"})

    # ── 8. NEECHA BHANGA RAJ YOGA ────────────────────────────────────────────
    DEBIL_SIGN = {"Sun":"Libra","Moon":"Scorpio","Mars":"Cancer","Mercury":"Pisces",
                  "Jupiter":"Capricorn","Venus":"Virgo","Saturn":"Aries"}
    DEBIL_LORD = {"Sun":"Venus","Moon":"Mars","Mars":"Moon","Mercury":"Jupiter",
                  "Jupiter":"Saturn","Venus":"Mercury","Saturn":"Mars"}
    EXALT_LORD = {"Sun":"Mars","Moon":"Venus","Mars":"Saturn","Mercury":"Mercury",
                  "Jupiter":"Moon","Venus":"Jupiter","Saturn":"Venus"}
    for planet, debil_sign in DEBIL_SIGN.items():
        if sign_of(planet) == debil_sign:
            cancelled = False
            # Rule 1: Lord of debilitation sign in kendra from lagna or Moon
            disp = SIGN_LORDS[debil_sign]
            if house_of(disp) and (is_kendra(house_of(disp)) or in_kendra_from(house_of("Moon") or 0, house_of(disp))):
                cancelled = True
            # Rule 2: Planet that is exalted in debil sign is in kendra
            exalt_p = EXALT_LORD.get(planet)
            if exalt_p and house_of(exalt_p) and is_kendra(house_of(exalt_p)):
                cancelled = True
            # Rule 3: Debilitated planet conjunct or aspected by its exaltation lord
            if exalt_p and sign_of(exalt_p) == sign_of(planet):
                cancelled = True
            if cancelled:
                yogas.append({"name": "Neecha Bhanga Raj Yoga", "type": "Raj Yoga",
                    "description": f"{planet} debilitated in {debil_sign} but debilitation cancelled — rise after struggle",
                    "strength": "strong"})

    # ── 9. AMALA YOGA ────────────────────────────────────────────────────────
    # Natural benefic (Jupiter, Venus, unafflicted Mercury, waxing Moon) in H10 from lagna or Moon
    benefics = ["Jupiter", "Venus"]
    for b in benefics:
        if house_of(b) == 10:
            yogas.append({"name": "Amala Yoga", "type": "Character Yoga",
                "description": f"{b} in H10 — spotless reputation, virtuous career",
                "strength": "moderate"})

    # ── 10. VESI / VOSI / UBHAYACHARI ────────────────────────────────────────
    sun_h = house_of("Sun")
    if sun_h:
        planets_2nd_from_sun = [p for p, d in planets.items()
                                  if d.get("house") == (sun_h % 12) + 1
                                  and p not in ("Sun","Rahu","Ketu","Moon")]
        planets_12th_from_sun = [p for p, d in planets.items()
                                   if d.get("house") == ((sun_h - 2) % 12) + 1
                                   and p not in ("Sun","Rahu","Ketu","Moon")]
        if planets_2nd_from_sun and planets_12th_from_sun:
            yogas.append({"name": "Ubhayachari Yoga", "type": "Solar Yoga",
                "description": f"Planets on both sides of Sun — well-rounded personality",
                "strength": "moderate"})
        elif planets_2nd_from_sun:
            yogas.append({"name": "Vesi Yoga", "type": "Solar Yoga",
                "description": f"{', '.join(planets_2nd_from_sun)} in 2nd from Sun — skilled, fortunate",
                "strength": "moderate"})
        elif planets_12th_from_sun:
            yogas.append({"name": "Vosi Yoga", "type": "Solar Yoga",
                "description": f"{', '.join(planets_12th_from_sun)} in 12th from Sun — learned",
                "strength": "moderate"})

    # ── 11. KEMADRUMA YOGA ───────────────────────────────────────────────────
    mh = house_of("Moon")
    if mh:
        prev_h = ((mh - 2) % 12) + 1
        next_h = (mh % 12) + 1
        adj = [p for p, d in planets.items()
               if d.get("house") in [prev_h, next_h] and p not in ("Moon","Rahu","Ketu")]
        if not adj:
            yogas.append({"name": "Kemadruma Yoga", "type": "Challenging Yoga",
                "description": "No planets adjacent to Moon — emotional isolation, struggles",
                "strength": "challenging"})

    # ── 12. VASUMATI YOGA ────────────────────────────────────────────────────
    # Benefics (Jup, Ven, Mer) all in upachaya (3,6,10,11) from lagna or Moon
    upachaya = [3, 6, 10, 11]
    benefic_planets = [p for p in ["Jupiter","Venus","Mercury"] if house_of(p) in upachaya]
    if len(benefic_planets) >= 2:
        yogas.append({"name": "Vasumati Yoga", "type": "Wealth Yoga",
            "description": f"Benefics in upachaya houses — wealth accumulation over time",
            "strength": "moderate"})

    # ── 13. VARGOTTAMA ───────────────────────────────────────────────────────
    if jd:
        try:
            d9_planets = get_varga_chart(jd, ayanamsa, 9)
            for name, pdata in planets.items():
                d1_sign = pdata.get("sign")
                d9_sign = d9_planets.get(name, {}).get("sign")
                if d1_sign and d9_sign and d1_sign == d9_sign:
                    yogas.append({"name": f"{name} Vargottama", "type": "Strength Indicator",
                        "description": f"{name} in {d1_sign} in both D1 and D9 — greatly strengthened",
                        "strength": "strong"})
        except Exception:
            pass

    # ── 14. SHUBHA KARTARI ───────────────────────────────────────────────────
    # Benefics flanking lagna (H12 and H2 from lagna both have benefics)
    lagna_h12 = [p for p, d in planets.items() if d.get("house") == 12 and p in ["Jupiter","Venus","Mercury","Moon"]]
    lagna_h2  = [p for p, d in planets.items() if d.get("house") == 2  and p in ["Jupiter","Venus","Mercury","Moon"]]
    if lagna_h12 and lagna_h2:
        yogas.append({"name": "Shubha Kartari Yoga", "type": "Protective Yoga",
            "description": "Benefics flank the lagna — protection, grace, good fortune",
            "strength": "moderate"})

    # ── 15. PAAP KARTARI ─────────────────────────────────────────────────────
    malefics = ["Sun","Mars","Saturn","Rahu","Ketu"]
    mal_h12 = [p for p, d in planets.items() if d.get("house") == 12 and p in malefics]
    mal_h2  = [p for p, d in planets.items() if d.get("house") == 2  and p in malefics]
    if mal_h12 and mal_h2:
        yogas.append({"name": "Paap Kartari Yoga", "type": "Challenging Yoga",
            "description": "Malefics flank the lagna — obstacles, blocked expression",
            "strength": "challenging"})

    # Deduplicate by name (keep first occurrence)
    seen = set()
    unique = []
    for y in yogas:
        key = y["name"]
        if key not in seen:
            seen.add(key)
            unique.append(y)
    return unique


detect_yogas_internal = detect_yogas


@router.post("/yogas")
def get_yogas(data: BirthData):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa)
    house_data = calculate_houses(jd, data.latitude, data.longitude, data.ayanamsa)
    asc = house_data["ascendant"]
    assign_planets_to_houses(planets, asc["sign_index"])
    yogas = detect_yogas(planets, {}, asc, jd, data.ayanamsa)

    return {
        "ascendant": asc["sign"],
        "total_yogas": len(yogas),
        "yogas": yogas,
    }
