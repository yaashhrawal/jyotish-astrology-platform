"""
Saptarishis (Seven Sages) — Nakshatra-based era/age system.
7 sages rotate through 27 nakshatras, spending ~100 years in each.
Full cycle: 2700 years.
Classical reference point: Sages in Magha at ~3100 BCE (Mahabharata era).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, SIGNS

router = APIRouter()

NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
    "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
    "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
    "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha",
    "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
]

NAKSHATRA_LORDS = [
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
]

SAGES = ["Vasishtha","Kashyapa","Atri","Jamadagni","Gautama","Bharadvaja","Vishvamitra"]

# Reference: Sages were in Magha (index 9) at 3100 BCE
REFERENCE_YEAR = -3100
REFERENCE_NAK_IDX = 9  # Magha
YEARS_PER_NAK = 100

SAGE_MEANINGS: dict[str, str] = {
    "Vasishtha":   "Spiritual guidance, wisdom, righteous conduct",
    "Kashyapa":    "Creation, progeny, material manifestation",
    "Atri":        "Devotion, austerity, divine grace",
    "Jamadagni":   "Discipline, focus, transformation of anger into strength",
    "Gautama":     "Knowledge, logic, dharmic justice",
    "Bharadvaja":  "Learning, skill, service to society",
    "Vishvamitra": "Power, ambition, transcending limitations",
}

NAK_THEMES: dict[str, str] = {
    "Ashwini": "swift beginnings, healing, vitality",
    "Bharani": "containment, birth/death cycles, discipline",
    "Krittika": "purification, brilliance, cutting through illusion",
    "Rohini": "growth, beauty, material abundance",
    "Mrigashira": "searching, gentle, curious",
    "Ardra": "storms, transformation, clearing",
    "Punarvasu": "renewal, return, abundance",
    "Pushya": "nourishment, protection, best nakshatra",
    "Ashlesha": "serpent wisdom, psychology, hidden matters",
    "Magha": "royal ancestors, authority, past karma",
    "Purva Phalguni": "relaxation, creativity, romance",
    "Uttara Phalguni": "partnership, social contracts, patronage",
    "Hasta": "skill, hands, craftsmanship, manifestation",
    "Chitra": "creation, architecture, jewels",
    "Swati": "independence, spread, trade winds",
    "Vishakha": "determination, goal-focus, harvest",
    "Anuradha": "devotion, friendship, travel",
    "Jyeshtha": "seniority, courage, protection",
    "Mula": "roots, destruction for rebirth, Ketu",
    "Purva Ashadha": "invincibility, purification, water",
    "Uttara Ashadha": "universal victory, ethics, elephant",
    "Shravana": "listening, learning, Vishnu's nakshatra",
    "Dhanishtha": "wealth, music, Mars/Shiva",
    "Shatabhisha": "100 healers, mystery, Varuna",
    "Purva Bhadrapada": "intensity, fire serpent, transformation",
    "Uttara Bhadrapada": "depth, wisdom, rain",
    "Revati": "completion, nourishment, journey's end",
}


def get_current_nak_idx(year: int) -> int:
    years_elapsed = year - REFERENCE_YEAR
    nak_advance = int(years_elapsed / YEARS_PER_NAK)
    return (REFERENCE_NAK_IDX + nak_advance) % 27


class SaptarishiRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/saptarishis")
def compute_saptarishis(req: SaptarishiRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)

    moon_lon = planets["Moon"]["longitude"]
    moon_nak_idx = int(moon_lon / (360 / 27))
    moon_nakshatra = NAKSHATRAS[moon_nak_idx]

    birth_nak_idx = get_current_nak_idx(req.year)
    current_nak_idx = get_current_nak_idx(2026)  # current year

    # Sage positions: leading sage at birth_nak_idx, rest follow
    birth_sages = []
    current_sages = []
    for i, sage in enumerate(SAGES):
        b_idx = (birth_nak_idx + i) % 27
        c_idx = (current_nak_idx + i) % 27
        birth_sages.append({
            "sage": sage,
            "nakshatra": NAKSHATRAS[b_idx],
            "nak_index": b_idx,
            "meaning": SAGE_MEANINGS[sage],
            "nak_theme": NAK_THEMES.get(NAKSHATRAS[b_idx], ""),
        })
        current_sages.append({
            "sage": sage,
            "nakshatra": NAKSHATRAS[c_idx],
            "nak_index": c_idx,
            "meaning": SAGE_MEANINGS[sage],
            "nak_theme": NAK_THEMES.get(NAKSHATRAS[c_idx], ""),
        })

    # Distance from Moon nakshatra to leading sage (birth)
    dist = (birth_nak_idx - moon_nak_idx) % 27
    ruling_period = f"Sages are {dist} nakshatras ahead of natal Moon ({moon_nakshatra})"

    # Era interpretation: which sage is closest to Moon
    closest_birth = min(birth_sages, key=lambda s: min((s['nak_index'] - moon_nak_idx) % 27,
                                                         (moon_nak_idx - s['nak_index']) % 27))

    years_in_current_nak = (req.year - REFERENCE_YEAR) % YEARS_PER_NAK
    years_remaining = YEARS_PER_NAK - years_in_current_nak

    return {
        "moon_nakshatra": moon_nakshatra,
        "moon_nak_index": moon_nak_idx,
        "birth_year": req.year,
        "birth_leading_nakshatra": NAKSHATRAS[birth_nak_idx],
        "current_leading_nakshatra": NAKSHATRAS[current_nak_idx],
        "years_in_current_nak": years_in_current_nak,
        "years_remaining_in_current_nak": years_remaining,
        "birth_sages": birth_sages,
        "current_sages": current_sages,
        "closest_sage_to_moon": closest_birth,
        "distance_note": ruling_period,
        "cycle_note": f"Sages complete one 27-nakshatra cycle in 2700 years. Currently in {NAKSHATRAS[current_nak_idx]} era.",
    }
