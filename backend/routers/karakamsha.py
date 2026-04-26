"""
Karakamsha Chart — Atmakaraka in Navamsa lagna (BPHS Ch. 34-36, Jaimini Sutras).
Karakamsha Lagna (KL) = sign occupied by Atmakaraka in D9.
Full analysis: AK sign phal, planetary dignities from KL, karakamsha yogas.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter(tags=["karakamsha"])

# ── AK sign interpretations (Jaimini Sutras 1.2.71–100 + BPHS) ──────────────
AK_SIGN_PHAL = {
    "Aries":       {"soul_purpose": "Leadership, pioneering, courage", "career": "Military, sports, engineering, surgery", "spirituality": "Karttikeya/Durga worship, active sadhana", "traits": "Independent soul, karmically meant to lead and initiate"},
    "Taurus":      {"soul_purpose": "Wealth, stability, arts", "career": "Finance, music, agriculture, luxury goods", "spirituality": "Lakshmi worship, mantra sadhana", "traits": "Soul seeks material and aesthetic mastery, sensory wisdom"},
    "Gemini":      {"soul_purpose": "Communication, intellect, trade", "career": "Writing, teaching, commerce, diplomacy", "spirituality": "Vishnu/Saraswati worship, study of shastras", "traits": "Dual nature soul, seeks knowledge synthesis and connection"},
    "Cancer":      {"soul_purpose": "Nurturing, home, emotional depth", "career": "Medicine, hospitality, real estate, psychology", "spirituality": "Shiva/Shakti worship, devotional path", "traits": "Soul karmically tied to family lineage and emotional healing"},
    "Leo":         {"soul_purpose": "Authority, recognition, dharma", "career": "Government, politics, management, entertainment", "spirituality": "Surya/Shiva worship, raja yoga paths", "traits": "Royal soul, meant to govern and uphold dharmic order"},
    "Virgo":       {"soul_purpose": "Service, precision, healing", "career": "Medicine, accounting, analytics, craftsmanship", "spirituality": "Vishnu worship, karma yoga, detailed rituals", "traits": "Perfectionist soul, finds moksha through selfless service"},
    "Libra":       {"soul_purpose": "Balance, justice, relationships", "career": "Law, diplomacy, design, counseling", "spirituality": "Saraswati/Shukra worship, aesthetic spirituality", "traits": "Soul seeks cosmic balance; relationships are the primary karma"},
    "Scorpio":     {"soul_purpose": "Transformation, occult, depth", "career": "Research, occult sciences, surgery, mining", "spirituality": "Kali/Shiva worship, tantra, deep meditation", "traits": "Soul undergoes radical transformation; past-life intensity surfaces"},
    "Sagittarius": {"soul_purpose": "Wisdom, dharma, higher truth", "career": "Philosophy, law, religion, teaching, travel", "spirituality": "Guru worship, Vedic study, pilgrimage", "traits": "Philosopher soul, seeks universal truth across lifetimes"},
    "Capricorn":   {"soul_purpose": "Discipline, karma, structured achievement", "career": "Politics, administration, engineering, geology", "spirituality": "Shani/Saturn worship, karma yoga, asceticism", "traits": "Old soul with heavy karmic debts; patience and endurance are the path"},
    "Aquarius":    {"soul_purpose": "Humanity, innovation, collective good", "career": "Science, technology, social work, research", "spirituality": "Vishnu worship, humanitarian paths, satsang", "traits": "Universal soul, karma lies in serving humanity at scale"},
    "Pisces":      {"soul_purpose": "Moksha, surrender, divine love", "career": "Spiritual teaching, healing arts, film, charity", "spirituality": "Vishnu/Narayana worship, bhakti, renunciation", "traits": "Liberation-seeking soul; otherworldly wisdom, prone to moksha in this life"},
}

# ── Planet in Karakamsha Lagna results (Jaimini Sutras 1.2.71+) ───────────────
PLANET_IN_KL = {
    "Sun":     {"result": "Political power, royal patronage, government position", "career": "Administration, politics, medicine", "effect": "positive"},
    "Moon":    {"result": "Scholarly, artistic, beloved; prosperous comfortable life", "career": "Poetry, arts, teaching, counseling", "effect": "positive"},
    "Mars":    {"result": "Skill with weapons, surgery, fire; courage and conflict", "career": "Military, surgery, metallurgy, sports", "effect": "mixed"},
    "Mercury": {"result": "Trade mastery, eloquence, intellectual brilliance", "career": "Business, writing, mathematics, astrology", "effect": "positive"},
    "Jupiter": {"result": "Vedic scholarship, spiritual wisdom, teaching; wealthy and respected", "career": "Teaching, law, religion, philosophy", "effect": "positive"},
    "Venus":   {"result": "Artistic genius, luxury, beautiful spouse, sensory excellence", "career": "Arts, entertainment, diplomacy, fashion", "effect": "positive"},
    "Saturn":  {"result": "Mechanical skills, labor, service; delays but ultimate success", "career": "Engineering, mining, agriculture, service sectors", "effect": "mixed"},
    "Rahu":    {"result": "Foreign elements, unorthodox path, technical innovation; unconventional career", "career": "Technology, chemicals, foreign trade, film", "effect": "mixed"},
    "Ketu":    {"result": "Moksha orientation, past-life wisdom, spiritual depth; detachment from material", "career": "Spirituality, healing, research, occult", "effect": "spiritual"},
}

# ── Houses from KL — what each house signifies in Karakamsha ─────────────────
KL_HOUSE_SIGNIFICATIONS = {
    1:  "Soul's purpose, bodily constitution, primary karma of this life",
    2:  "Family wealth, speech, food habits, accumulated karma",
    3:  "Siblings, courage, short journeys, communication skills",
    4:  "Mother, education, real estate, emotional foundation, vehicles",
    5:  "Children, intellect, past-life merit (purva punya), mantras, creativity",
    6:  "Enemies, disease, debts, service, litigation",
    7:  "Spouse, partnerships, foreign travel, public dealings",
    8:  "Longevity, occult, hidden matters, inheritance, transformation",
    9:  "Father, dharma, higher education, guru, luck, religion",
    10: "Career, status, authority, dharmic action in the world",
    11: "Gains, elder siblings, aspirations, networks, income",
    12: "Moksha, losses, foreign lands, spirituality, bed pleasures",
}

# ── Karakamsha Yogas (key combinations from classical texts) ──────────────────
def analyze_karakamsha_yogas(kl_house_map: dict, ak_sign: str) -> list:
    yogas = []

    def planets_in(house: int) -> list:
        return kl_house_map.get(house, [])

    def has_planet(house: int, planet: str) -> bool:
        return planet in planets_in(house)

    # Moksha yogas
    if has_planet(12, "Ketu") or has_planet(12, "Jupiter"):
        yogas.append({
            "name": "Moksha Yoga",
            "desc": "Ketu or Jupiter in 12H from KL — soul oriented toward liberation",
            "source": "Jaimini Sutras 1.2.94",
            "effect": "positive",
            "category": "Spiritual"
        })

    # Rajya Yoga from KL
    if has_planet(1, "Sun") or has_planet(10, "Sun"):
        yogas.append({
            "name": "Raja Karakamsha Yoga",
            "desc": "Sun in KL or 10H from KL — political authority, leadership role",
            "source": "BPHS Ch. 34.12",
            "effect": "positive",
            "category": "Career"
        })

    # Pushkala Yoga
    if has_planet(1, "Jupiter") and has_planet(9, "Moon"):
        yogas.append({
            "name": "Pushkala Yoga",
            "desc": "Jupiter in KL with Moon in 9H — exceptional wealth and fame",
            "source": "Jaimini Sutras",
            "effect": "positive",
            "category": "Wealth"
        })

    # Scholarly yoga
    if has_planet(1, "Mercury") or has_planet(1, "Jupiter"):
        yogas.append({
            "name": "Vidya Yoga",
            "desc": "Mercury or Jupiter in KL — deep scholarship and intellectual mastery",
            "source": "BPHS Ch. 34",
            "effect": "positive",
            "category": "Education"
        })

    # Weapons/Mars yogas
    if has_planet(1, "Mars") or has_planet(3, "Mars"):
        yogas.append({
            "name": "Shastrajivi Yoga",
            "desc": "Mars in KL or 3H — skilled with weapons, military or surgical career",
            "source": "Jaimini Sutras 1.2.73",
            "effect": "mixed",
            "category": "Career"
        })

    # Venus in KL — arts / luxury
    if has_planet(1, "Venus"):
        yogas.append({
            "name": "Kala Yoga",
            "desc": "Venus in KL — artistic genius, sensory excellence, beautiful partner",
            "source": "BPHS Ch. 34.16",
            "effect": "positive",
            "category": "Arts"
        })

    # Rahu in KL — foreign/technical
    if has_planet(1, "Rahu"):
        yogas.append({
            "name": "Ajeevika from Foreign Lands",
            "desc": "Rahu in KL — career through foreign lands, chemicals, or unorthodox fields",
            "source": "Jaimini Sutras 1.2.80",
            "effect": "mixed",
            "category": "Career"
        })

    # Ketu in 12H — Moksha
    if has_planet(12, "Ketu"):
        yogas.append({
            "name": "Jivanmukta Yoga",
            "desc": "Ketu in 12H from KL — soul approaching liberation, strong detachment",
            "source": "Jaimini Sutras 1.2.94",
            "effect": "positive",
            "category": "Spiritual"
        })

    # Saturn in KL — labor/service
    if has_planet(1, "Saturn"):
        yogas.append({
            "name": "Shilpajivi Yoga",
            "desc": "Saturn in KL — artisan or laborer by karma; mechanical/engineering skills",
            "source": "Jaimini Sutras 1.2.78",
            "effect": "mixed",
            "category": "Career"
        })

    if ak_sign == "Pisces":
        yogas.append({
            "name": "Moksha Lagna",
            "desc": "AK in Pisces in D9 — Karakamsha itself is the moksha sign; liberation is the primary soul agenda",
            "source": "Jaimini tradition",
            "effect": "positive",
            "category": "Spiritual"
        })

    return yogas


def get_navamsha_sign(longitude: float) -> str:
    sign_idx = int(longitude / 30)
    pada = int((longitude % 30) / (30 / 9))
    nav_sign_idx = (sign_idx * 9 + pada) % 12
    return SIGNS[nav_sign_idx]


def get_navamsha_longitude(longitude: float) -> float:
    sign_idx = int(longitude / 30)
    pada = int((longitude % 30) / (30 / 9))
    nav_sign_idx = (sign_idx * 9 + pada) % 12
    deg_in_sign = (longitude % 30) % (30 / 9) * 9
    return nav_sign_idx * 30 + deg_in_sign


class KarakamshaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/karakamsha")
def get_karakamsha(req: KarakamshaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]

    # ── Step 1: Chara Karakas (7-planet, by degree descending) ───────────────
    graha_order = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    KARAKA_NAMES = ["AK", "AmK", "BK", "MK", "PiK", "GK", "DK"]
    ranked = sorted(graha_order, key=lambda g: planets[g]["degree"], reverse=True)
    karakas = []
    for i, name in enumerate(ranked):
        pd = planets[name]
        k = KARAKA_NAMES[i]
        nav_sign = get_navamsha_sign(pd["longitude"])
        karakas.append({
            "planet": name,
            "karaka": k,
            "degree_in_sign": round(pd["degree"], 3),
            "sign": pd["sign"],
            "navamsha_sign": nav_sign,
        })

    ak = karakas[0]
    ak_planet = ak["planet"]
    karakamsha_sign = ak["navamsha_sign"]
    kl_idx = SIGNS.index(karakamsha_sign)

    # ── Step 2: Place all planets in D9 ──────────────────────────────────────
    d9_planets = {}
    for name, pd in planets.items():
        nav_sign = get_navamsha_sign(pd["longitude"])
        nav_long = get_navamsha_longitude(pd["longitude"])
        d9_planets[name] = {
            "sign": nav_sign,
            "sign_index": SIGNS.index(nav_sign),
            "longitude": round(nav_long, 3),
            "status": pd.get("status", "neutral"),
        }

    # ── Step 3: Houses from KL ────────────────────────────────────────────────
    kl_house_map: dict[int, list] = {}
    planet_kl_house: dict[str, int] = {}
    for name, d9 in d9_planets.items():
        house = (d9["sign_index"] - kl_idx) % 12 + 1
        planet_kl_house[name] = house
        kl_house_map.setdefault(house, []).append(name)

    # ── Step 4: AK sign interpretation ───────────────────────────────────────
    ak_sign_info = AK_SIGN_PHAL.get(karakamsha_sign, {})

    # ── Step 5: Planets in KL (1H from KL) ───────────────────────────────────
    planets_in_kl = kl_house_map.get(1, [])
    kl_planet_readings = [
        {"planet": p, **PLANET_IN_KL.get(p, {"result": "General influence", "career": "Varied", "effect": "neutral"})}
        for p in planets_in_kl
    ]

    # ── Step 6: Full house breakdown from KL ─────────────────────────────────
    house_breakdown = []
    for h in range(1, 13):
        house_breakdown.append({
            "house": h,
            "sign": SIGNS[(kl_idx + h - 1) % 12],
            "signification": KL_HOUSE_SIGNIFICATIONS[h],
            "planets": kl_house_map.get(h, []),
        })

    # ── Step 7: Yogas ────────────────────────────────────────────────────────
    yogas = analyze_karakamsha_yogas(kl_house_map, karakamsha_sign)

    # ── Step 8: D1 ascendant for swamsha check ───────────────────────────────
    swamsha = karakamsha_sign == asc["sign"]

    return {
        "atmakaraka": ak_planet,
        "karakamsha_sign": karakamsha_sign,
        "karakamsha_house_in_d1": (kl_idx - asc.get("sign_index", 0)) % 12 + 1,
        "swamsha": swamsha,
        "karakas": karakas,
        "ak_sign_interpretation": ak_sign_info,
        "planets_in_kl": kl_planet_readings,
        "kl_house_map": kl_house_map,
        "house_breakdown": house_breakdown,
        "karakamsha_yogas": yogas,
        "d9_planets": d9_planets,
        "ascendant_d1": asc,
    }
