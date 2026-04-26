"""
Remedies router — classical Jyotish remedies per planet based on dignity and strength.
Sources: BPHS, Lal Kitab, classical gem-therapy traditions.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["remedies"])

# ── Classical remedy tables ───────────────────────────────────────────────────

GEMS = {
    "Sun":     {"primary": "Ruby (Manik)",        "alt": ["Red Garnet", "Red Spinel"],          "metal": "Gold",   "finger": "Ring finger"},
    "Moon":    {"primary": "Pearl (Moti)",         "alt": ["Moonstone", "White Coral"],          "metal": "Silver", "finger": "Little finger"},
    "Mars":    {"primary": "Red Coral (Moonga)",   "alt": ["Carnelian", "Red Jasper"],           "metal": "Gold/Copper", "finger": "Ring finger"},
    "Mercury": {"primary": "Emerald (Panna)",      "alt": ["Green Tourmaline", "Peridot"],       "metal": "Gold",   "finger": "Little finger"},
    "Jupiter": {"primary": "Yellow Sapphire (Pukhraj)", "alt": ["Yellow Topaz", "Citrine"],     "metal": "Gold",   "finger": "Index finger"},
    "Venus":   {"primary": "Diamond (Heera)",      "alt": ["White Sapphire", "Zircon", "Opal"], "metal": "Silver/Platinum", "finger": "Middle finger"},
    "Saturn":  {"primary": "Blue Sapphire (Neelam)", "alt": ["Amethyst", "Blue Spinel", "Iolite"], "metal": "Silver/Iron", "finger": "Middle finger"},
    "Rahu":    {"primary": "Hessonite (Gomed)",    "alt": ["Orange Zircon", "Spessartite"],      "metal": "Silver/Ashtadhatu", "finger": "Middle finger"},
    "Ketu":    {"primary": "Cat's Eye (Lehsunia)", "alt": ["Tiger's Eye", "Chrysoberyl"],        "metal": "Silver", "finger": "Ring finger"},
}

RUDRAKSHA = {
    "Sun":     {"mukhi": 1, "name": "Ek Mukhi",     "deity": "Shiva", "benefit": "Leadership, confidence, father"},
    "Moon":    {"mukhi": 2, "name": "Do Mukhi",      "deity": "Ardhanarishvara", "benefit": "Mind, emotions, mother"},
    "Mars":    {"mukhi": 3, "name": "Teen Mukhi",    "deity": "Agni", "benefit": "Courage, energy, siblings"},
    "Mercury": {"mukhi": 4, "name": "Char Mukhi",    "deity": "Brahma", "benefit": "Intelligence, speech, education"},
    "Jupiter": {"mukhi": 5, "name": "Panch Mukhi",   "deity": "Kalagni Rudra", "benefit": "Wisdom, wealth, children"},
    "Venus":   {"mukhi": 6, "name": "Chhah Mukhi",   "deity": "Kartikeya", "benefit": "Love, beauty, relationships"},
    "Saturn":  {"mukhi": 7, "name": "Saat Mukhi",    "deity": "Mahalaxmi", "benefit": "Career, longevity, obstacles"},
    "Rahu":    {"mukhi": 8, "name": "Aath Mukhi",    "deity": "Ganesha", "benefit": "Remove obstacles, Rahu effects"},
    "Ketu":    {"mukhi": 9, "name": "Nau Mukhi",     "deity": "Durga", "benefit": "Spiritual growth, Ketu effects"},
}

MANTRAS = {
    "Sun":     {"beej": "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",     "vedic": "ॐ आकृष्णेन रजसा...", "count": 7000,  "day": "Sunday",  "color": "Red/Orange"},
    "Moon":    {"beej": "ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः",    "vedic": "ॐ इमं देवा असपत्नम्...", "count": 11000, "day": "Monday",  "color": "White"},
    "Mars":    {"beej": "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",       "vedic": "ॐ अग्निर्मूर्धा दिवः...", "count": 10000, "day": "Tuesday", "color": "Red"},
    "Mercury": {"beej": "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",       "vedic": "ॐ उद्बुध्यस्वाग्ने...", "count": 9000,  "day": "Wednesday","color": "Green"},
    "Jupiter": {"beej": "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",       "vedic": "ॐ बृहस्पते अतियदर्यो...", "count": 19000, "day": "Thursday","color": "Yellow"},
    "Venus":   {"beej": "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",     "vedic": "ॐ हिरण्यगर्भः समवर्तताग्रे...", "count": 16000, "day": "Friday",  "color": "White/Pink"},
    "Saturn":  {"beej": "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",   "vedic": "ॐ शन्नो देवीरभिष्टय...", "count": 23000, "day": "Saturday","color": "Blue/Black"},
    "Rahu":    {"beej": "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",       "vedic": "ॐ कयानश्चित्र आभुवत्...", "count": 18000, "day": "Saturday","color": "Blue/Black"},
    "Ketu":    {"beej": "ॐ स्त्रां स्त्रीं स्त्रौं सः केतवे नमः", "vedic": "ॐ केतुं कृण्वन्नकेतवे...", "count": 17000, "day": "Tuesday", "color": "Grey/Brown"},
}

FASTING = {
    "Sun":     "Sunday — fast from sunrise to sunset, eat once at sunset",
    "Moon":    "Monday — Somvar vrat, milk/white foods only",
    "Mars":    "Tuesday — Mangalvar vrat, red foods avoided",
    "Mercury": "Wednesday — Budhvar vrat, green foods, no meat",
    "Jupiter": "Thursday — Brihaspativar vrat, yellow foods, banana",
    "Venus":   "Friday — Shukravar vrat, white foods, kheer",
    "Saturn":  "Saturday — Shanivar vrat, black sesame, urad dal",
    "Rahu":    "Saturday — same as Saturn, Rahu shares Saturday",
    "Ketu":    "Tuesday — same as Mars, Ketu shares Tuesday",
}

CHARITY = {
    "Sun":     "Donate wheat, jaggery, copper, red cloth on Sunday",
    "Moon":    "Donate rice, milk, white cloth, silver on Monday",
    "Mars":    "Donate red lentils, red cloth, copper, ghee on Tuesday",
    "Mercury": "Donate green moong, green cloth, books on Wednesday",
    "Jupiter": "Donate yellow lentils, turmeric, gold, books on Thursday",
    "Venus":   "Donate white cloth, rice, sugar, cow on Friday",
    "Saturn":  "Donate black sesame, iron, mustard oil, blanket on Saturday",
    "Rahu":    "Donate blue/black cloth, coal, coconut on Saturday",
    "Ketu":    "Donate grey/brown cloth, blanket, banana on Tuesday",
}

DEITY = {
    "Sun":     "Lord Surya · Aditya Hridayam",
    "Moon":    "Lord Shiva · Chandra · Annapurna",
    "Mars":    "Lord Hanuman · Kartikeya · Mangal Chandipath",
    "Mercury": "Lord Vishnu · Ganesha",
    "Jupiter": "Lord Brahma · Vishnu · Dakshinamurthy",
    "Venus":   "Goddess Lakshmi · Parvati · Santoshi Mata",
    "Saturn":  "Lord Shani · Hanuman (for Shani relief)",
    "Rahu":    "Goddess Durga · Bhairav · Saraswati",
    "Ketu":    "Lord Ganesha · Bhairav",
}

YANTRA = {
    "Sun":     {"name": "Surya Yantra",     "color": "#D97706", "description": "9×9 magic square of 15. Engrave on copper, place facing East on Sunday morning during Shukla Paksha."},
    "Moon":    {"name": "Chandra Yantra",    "color": "#0891B2", "description": "Engrave on silver, place facing North on Monday. Wash with milk and water before installation."},
    "Mars":    {"name": "Mangal Yantra",     "color": "#DC2626", "description": "Engrave on copper or gold, place facing South on Tuesday. Recite Mangal mantra 10,000 times to activate."},
    "Mercury": {"name": "Budha Yantra",      "color": "#16A34A", "description": "Engrave on bronze or gold, place facing North on Wednesday. Best for intellect, speech, and business."},
    "Jupiter": {"name": "Guru Yantra",       "color": "#B45309", "description": "Engrave on gold, place facing North-East on Thursday. Ideal for wisdom, children, and spiritual growth."},
    "Venus":   {"name": "Shukra Yantra",     "color": "#7C3AED", "description": "Engrave on silver, place facing South-East on Friday. Activates love, beauty, and material abundance."},
    "Saturn":  {"name": "Shani Yantra",      "color": "#2563EB", "description": "Engrave on iron or lead, place facing West on Saturday. Use Shani yantra cautiously — only after expert guidance."},
    "Rahu":    {"name": "Rahu Yantra",       "color": "#57534E", "description": "Engrave on Ashtadhatu (8-metal alloy), place facing South-West on Saturday. Recite Rahu mantra 18,000 times."},
    "Ketu":    {"name": "Ketu Yantra",       "color": "#A8A29E", "description": "Engrave on Ashtadhatu, place facing North-West on Tuesday. Supports spirituality and past-life resolution."},
}

LAL_KITAB = {
    "Sun":     ["Throw copper coins in flowing water on Sunday", "Feed jaggery and wheat to crows", "Respect your father daily", "Avoid accepting gifts of gold", "Keep water in copper vessel in bedroom"],
    "Moon":    ["Feed white things (rice, milk, curd) to poor on Monday", "Respect your mother and women elders", "Keep silver square piece in your wallet", "Wear white clothes on Monday", "Pour milk in well or flowing water"],
    "Mars":    ["Donate red lentils on Tuesday", "Avoid cutting trees unnecessarily", "Feed blood-red colored sweets to monkeys", "Apply saffron tilak on forehead", "Keep copper coin in your pocket"],
    "Mercury": {"standard": ["Donate green moong dal on Wednesday", "Feed green grass to cow", "Wear an emerald ring on Wednesday", "Keep green color items in your workplace", "Recite Vishnu Sahasranama"]},
    "Jupiter": ["Feed saffron milk to cow on Thursday", "Plant a banana tree and water it", "Donate yellow cloth or turmeric to Brahmin", "Never deny food to a guest", "Donate books to students"],
    "Venus":   ["Donate white sweets or kheer on Friday", "Keep a piece of white cloth in wardrobe", "Serve cows and white-colored animals", "Avoid accepting broken/worn jewelry", "Keep white fragrant flowers in home"],
    "Saturn":  ["Donate black sesame oil on Saturday", "Feed crows and black dogs", "Serve the poor and needy", "Avoid non-veg on Saturday", "Keep iron piece under your pillow"],
    "Rahu":    ["Donate blue/grey cloth on Saturday", "Throw coconut in flowing water", "Feed saunf (fennel) to cows", "Keep radish under your bed", "Light lamp of mustard oil"],
    "Ketu":    ["Donate grey/multi-colored cloth on Tuesday", "Feed jaggery and gram to cow", "Keep a dog as pet or feed street dogs", "Keep banana root in home", "Worship Ganesha regularly"],
}

MUHURTA_START = {
    "Sun":     "Sunday, Uttarashada or Pushya nakshatra, Shukla Paksha (waxing moon), morning before 9 AM",
    "Moon":    "Monday, Rohini or Hasta nakshatra, Shukla Paksha, evening after sunset",
    "Mars":    "Tuesday, Chitra or Mrigashira nakshatra, Shukla Paksha, morning",
    "Mercury": "Wednesday, Ashlesha or Revati nakshatra, Shukla Paksha, after sunrise",
    "Jupiter": "Thursday, Punarvasu or Vishakha nakshatra, Shukla Paksha, morning",
    "Venus":   "Friday, Bharani or Purva Phalguni nakshatra, Shukla Paksha, after sunrise",
    "Saturn":  "Saturday, Pushya or Anuradha nakshatra, Shukla Paksha (avoid Krishna Paksha for Saturn)",
    "Rahu":    "Saturday, Ardra or Swati nakshatra, Shukla Paksha",
    "Ketu":    "Tuesday, Ashwini or Magha nakshatra, Shukla Paksha",
}

WEAK_PLANETS_NEED_REMEDY = {"debilitated", "enemy_sign", "combust"}
STRONG_PLANETS_AVOID_REMEDY = {"exalted", "own_sign"}


def get_remedy_priority(status: str, retrograde: bool, combust: bool = False) -> str:
    if status == "debilitated" or combust:
        return "high"
    if status in ("enemy_sign",):
        return "medium"
    if retrograde:
        return "medium"
    if status == "neutral":
        return "low"
    return "none"  # exalted / own_sign — no remedy needed


class ChartInput(BaseModel):
    year: int
    month: int
    day: int
    hour: float
    minute: float
    tz_offset: float
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"


@router.post("/remedies")
async def get_remedies(data: ChartInput):
    from core.engine import calculate_planets, birth_to_jd

    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)

    planets = calculate_planets(jd, data.ayanamsa)

    remedies = {}
    for planet, pdata in planets.items():
        status = pdata.get("status", "neutral")
        retro = pdata.get("retrograde", False)
        priority = get_remedy_priority(status, retro)

        remedies[planet] = {
            "planet": planet,
            "sign": pdata["sign"],
            "house": pdata.get("house", "—"),
            "status": status,
            "retrograde": retro,
            "priority": priority,
            "gem": GEMS.get(planet, {}),
            "rudraksha": RUDRAKSHA.get(planet, {}),
            "mantra": MANTRAS.get(planet, {}),
            "fasting": FASTING.get(planet, ""),
            "charity": CHARITY.get(planet, ""),
            "deity": DEITY.get(planet, ""),
            "yantra": YANTRA.get(planet, {}),
            "lal_kitab": LAL_KITAB.get(planet, []) if isinstance(LAL_KITAB.get(planet), list) else LAL_KITAB.get(planet, {}).get("standard", []),
            "muhurta_start": MUHURTA_START.get(planet, ""),
        }

    # Sort: high priority first
    order = {"high": 0, "medium": 1, "low": 2, "none": 3}
    sorted_remedies = dict(sorted(remedies.items(), key=lambda x: order.get(x[1]["priority"], 3)))

    return {
        "remedies": sorted_remedies,
        "note": "Consult a qualified Jyotishi before wearing gems. Start on the planet's day during Shukla Paksha (waxing moon).",
    }
