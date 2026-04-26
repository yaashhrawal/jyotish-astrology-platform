"""
Classical Jyotish text search — keyword lookup over indexed BPHS, Saravali,
Phaladeepika, and Jataka Parijata excerpts.
"""
from fastapi import APIRouter, Query
from typing import Optional
import re

router = APIRouter()

# Curated reference database — planet/sign/house/yoga keyword → classical shloka + interpretation
CLASSICAL_DB = [
    # ── Sun ───────────────────────────────────────────────────────────────────
    {"id": 1, "source": "BPHS", "chapter": "Ch. 3", "topic": "Sun — Exaltation in Aries",
     "shloka": "Aries is the exaltation sign of the Sun (Surya). When Sun is in Aries, the native gains authority, government favour, and has strong vitality.",
     "tags": ["Sun", "Aries", "exaltation", "authority", "government", "Surya"]},
    {"id": 2, "source": "BPHS", "chapter": "Ch. 3", "topic": "Sun — Debilitation in Libra",
     "shloka": "When Sun occupies Libra (Tula), it is debilitated. The native may lack confidence, suffer from government opposition, and father may have ill health.",
     "tags": ["Sun", "Libra", "debilitation", "father", "Surya", "Tula"]},
    {"id": 3, "source": "Saravali", "chapter": "Ch. 5", "topic": "Sun in 1st House",
     "shloka": "If the Sun be in the Ascendant, the native will have less hair on the head, be bilious, will have weak sight, will be lazy, will have a big body, will be valorous and will obtain a charming wife.",
     "tags": ["Sun", "first house", "lagna", "ascendant", "Surya", "body", "health"]},
    {"id": 4, "source": "Phaladeepika", "chapter": "Ch. 8", "topic": "Sun in 10th House",
     "shloka": "Sun in the 10th house gives high position in government service, fame, paternal wealth, and the native performs meritorious deeds.",
     "tags": ["Sun", "tenth house", "career", "government", "fame", "dashamsha"]},
    # ── Moon ──────────────────────────────────────────────────────────────────
    {"id": 5, "source": "BPHS", "chapter": "Ch. 3", "topic": "Moon — Exaltation in Taurus",
     "shloka": "Moon (Chandra) is exalted in Taurus (Vrishabha). The native will be respected, have a pleasant face, good wife, and will be wealthy.",
     "tags": ["Moon", "Taurus", "exaltation", "wealth", "Chandra", "Vrishabha"]},
    {"id": 6, "source": "BPHS", "chapter": "Ch. 3", "topic": "Moon — Debilitation in Scorpio",
     "shloka": "Moon in Scorpio (Vrischika) is debilitated. The native will have mental distress, troubled relationship with mother, and unstable mind.",
     "tags": ["Moon", "Scorpio", "debilitation", "mind", "mother", "Chandra", "mental"]},
    {"id": 7, "source": "Jataka Parijata", "chapter": "Ch. 7", "topic": "Moon in 4th House",
     "shloka": "Moon posited in the 4th house gives a happy domestic life, good relation with mother, landed property and vehicles.",
     "tags": ["Moon", "fourth house", "mother", "home", "property", "happiness"]},
    # ── Mars ──────────────────────────────────────────────────────────────────
    {"id": 8, "source": "BPHS", "chapter": "Ch. 4", "topic": "Mangal Dosha — Mars in 1,4,7,8,12",
     "shloka": "If Mars (Mangal/Kuja) is placed in the 1st, 4th, 7th, 8th, or 12th house, it is called Mangal Dosha. This may cause delay in marriage or conflict with spouse.",
     "tags": ["Mars", "Mangal", "dosha", "marriage", "seventh house", "Kuja dosha"]},
    {"id": 9, "source": "Saravali", "chapter": "Ch. 6", "topic": "Mars in Aries (Own Sign)",
     "shloka": "Mars in Aries gives a brave, energetic, independent native who is a leader and has strong athletic ability.",
     "tags": ["Mars", "Aries", "own sign", "courage", "leadership", "Mangal"]},
    # ── Mercury ───────────────────────────────────────────────────────────────
    {"id": 10, "source": "BPHS", "chapter": "Ch. 3", "topic": "Mercury — Exaltation in Virgo",
     "shloka": "Mercury (Budha) is exalted in Virgo (Kanya). Native is highly intelligent, skilled in communication, medicine, and business.",
     "tags": ["Mercury", "Virgo", "exaltation", "intelligence", "communication", "Budha"]},
    {"id": 11, "source": "Phaladeepika", "chapter": "Ch. 9", "topic": "Budha-Aditya Yoga",
     "shloka": "When Mercury is within 12 degrees of Sun, Budha-Aditya yoga is formed. Native has sharp intellect, fame through education and government favour.",
     "tags": ["Mercury", "Sun", "yoga", "Budha-Aditya", "intellect", "fame", "conjunction"]},
    # ── Jupiter ───────────────────────────────────────────────────────────────
    {"id": 12, "source": "BPHS", "chapter": "Ch. 3", "topic": "Jupiter — Exaltation in Cancer",
     "shloka": "Jupiter (Guru/Brihaspati) is exalted in Cancer. Native is learned, wealthy, has many children and is revered by society.",
     "tags": ["Jupiter", "Cancer", "exaltation", "wealth", "children", "Guru", "Brihaspati"]},
    {"id": 13, "source": "BPHS", "chapter": "Ch. 28", "topic": "Hamsa Yoga — Jupiter in Kendra",
     "shloka": "When Jupiter is in its own sign or exaltation in a Kendra (1,4,7,10) house, Hamsa Yoga is formed. Native is noble, handsome, righteous and commands respect.",
     "tags": ["Jupiter", "Hamsa yoga", "kendra", "Pancha Mahapurusha", "nobility", "Guru"]},
    {"id": 14, "source": "Jataka Parijata", "chapter": "Ch. 9", "topic": "Jupiter in 5th House",
     "shloka": "Jupiter in the 5th house grants intelligent children, devotion to elders, literary talent, and skill in arts and administration.",
     "tags": ["Jupiter", "fifth house", "children", "intelligence", "arts", "Guru"]},
    # ── Venus ─────────────────────────────────────────────────────────────────
    {"id": 15, "source": "BPHS", "chapter": "Ch. 3", "topic": "Venus — Exaltation in Pisces",
     "shloka": "Venus (Shukra) is exalted in Pisces. The native is handsome, artistic, wealthy, has a devoted spouse and luxurious life.",
     "tags": ["Venus", "Pisces", "exaltation", "beauty", "spouse", "luxury", "Shukra"]},
    {"id": 16, "source": "Phaladeepika", "chapter": "Ch. 28", "topic": "Malavya Yoga — Venus in Kendra",
     "shloka": "When Venus is in its own sign or exaltation in a Kendra, Malavya yoga is formed. Native has magnetic personality, marital happiness, and artistic talent.",
     "tags": ["Venus", "Malavya yoga", "kendra", "Pancha Mahapurusha", "beauty", "arts"]},
    # ── Saturn ────────────────────────────────────────────────────────────────
    {"id": 17, "source": "BPHS", "chapter": "Ch. 3", "topic": "Saturn — Exaltation in Libra",
     "shloka": "Saturn (Shani) is exalted in Libra. Native is disciplined, hard-working, rises late in life, and accumulates wealth through persistent effort.",
     "tags": ["Saturn", "Libra", "exaltation", "discipline", "longevity", "Shani"]},
    {"id": 18, "source": "BPHS", "chapter": "Ch. 28", "topic": "Shasha Yoga — Saturn in Kendra",
     "shloka": "When Saturn is in its own sign or exaltation in a Kendra, Shasha yoga is formed. Native rules over commoners, earns through masses, has long life.",
     "tags": ["Saturn", "Shasha yoga", "kendra", "Pancha Mahapurusha", "longevity", "Shani"]},
    # ── Rahu/Ketu ─────────────────────────────────────────────────────────────
    {"id": 19, "source": "BPHS", "chapter": "Ch. 47", "topic": "Rahu in 7th House",
     "shloka": "Rahu in the 7th house can cause delay in marriage, unconventional spouse, or foreign spouse. Partnership affairs need careful attention.",
     "tags": ["Rahu", "seventh house", "marriage", "spouse", "foreign", "delay"]},
    {"id": 20, "source": "BPHS", "chapter": "Ch. 47", "topic": "Ketu in 12th House",
     "shloka": "Ketu in the 12th house gives spiritual inclination, moksha, foreign travel and expenditure. The native may be withdrawn from worldly affairs.",
     "tags": ["Ketu", "twelfth house", "moksha", "spirituality", "foreign", "liberation"]},
    # ── Yogas ─────────────────────────────────────────────────────────────────
    {"id": 21, "source": "BPHS", "chapter": "Ch. 36", "topic": "Raja Yoga — Lord of Kendra and Trikona",
     "shloka": "When the lord of a Kendra (1,4,7,10) and the lord of a Trikona (1,5,9) house conjoin, aspect or exchange signs, a Raja Yoga is formed giving power and authority.",
     "tags": ["Raja yoga", "kendra", "trikona", "lord", "power", "authority", "conjunction"]},
    {"id": 22, "source": "BPHS", "chapter": "Ch. 37", "topic": "Dhana Yoga — Wealth Combinations",
     "shloka": "Lord of the 2nd and 11th house in conjunction with the lord of lagna, or in each other's signs, creates Dhana yoga giving abundant wealth.",
     "tags": ["Dhana yoga", "wealth", "second house", "eleventh house", "money", "prosperity"]},
    {"id": 23, "source": "Phaladeepika", "chapter": "Ch. 6", "topic": "Gajakesari Yoga",
     "shloka": "Gajakesari Yoga: Jupiter in kendra from Moon. Native has elephantine dignity, wealth, good character, fame and long life.",
     "tags": ["Gajakesari yoga", "Jupiter", "Moon", "kendra", "wealth", "fame", "dignity"]},
    {"id": 24, "source": "BPHS", "chapter": "Ch. 36", "topic": "Viparita Raja Yoga",
     "shloka": "When lords of the 6th, 8th, or 12th houses are in mutual exchange, conjunction, or in each other's houses, Viparita Raja Yoga gives unexpected rise after setbacks.",
     "tags": ["Viparita Raja yoga", "sixth house", "eighth house", "twelfth house", "rise", "setbacks"]},
    # ── Nakshatras ────────────────────────────────────────────────────────────
    {"id": 25, "source": "BPHS", "chapter": "Ch. 6", "topic": "Moon in Rohini Nakshatra",
     "shloka": "Moon in Rohini gives a handsome, beautiful, and well-spoken native who is fond of music and arts. Rohini is the most favoured nakshatra for Moon.",
     "tags": ["Moon", "Rohini", "nakshatra", "beauty", "arts", "music", "Chandra"]},
    {"id": 26, "source": "BPHS", "chapter": "Ch. 6", "topic": "Moon in Ashlesha Nakshatra",
     "shloka": "Moon in Ashlesha makes the native cunning, ungrateful, indulgent in sensual pleasures, and gives interest in serpent lore.",
     "tags": ["Moon", "Ashlesha", "nakshatra", "cunning", "serpent", "Mercury", "Chandra"]},
    # ── Houses ────────────────────────────────────────────────────────────────
    {"id": 27, "source": "BPHS", "chapter": "Ch. 11", "topic": "8th House — Longevity and Transformation",
     "shloka": "The 8th house governs longevity (ayu), inheritance, sudden gains and losses, occult knowledge, and the mode of death.",
     "tags": ["eighth house", "longevity", "death", "inheritance", "occult", "transformation", "Randhra"]},
    {"id": 28, "source": "BPHS", "chapter": "Ch. 11", "topic": "12th House — Moksha and Loss",
     "shloka": "The 12th house represents moksha (liberation), losses, expenses, foreign residence, sexual pleasures, and the left eye.",
     "tags": ["twelfth house", "moksha", "expenses", "foreign", "liberation", "Vyaya"]},
    {"id": 29, "source": "BPHS", "chapter": "Ch. 11", "topic": "5th House — Progeny and Intelligence",
     "shloka": "The 5th house governs intelligence, children, past life meritorious deeds (purva punya), speculation, and romantic relationships.",
     "tags": ["fifth house", "children", "intelligence", "purva punya", "romance", "Putra"]},
    # ── Dasha ─────────────────────────────────────────────────────────────────
    {"id": 30, "source": "BPHS", "chapter": "Ch. 46", "topic": "Saturn Dasha — Effects",
     "shloka": "During Saturn dasha, the native works hard, faces delays, may suffer losses but ultimately gains through discipline. Good for those with strong Saturn.",
     "tags": ["Saturn", "dasha", "delay", "hard work", "discipline", "Shani dasha"]},
    {"id": 31, "source": "BPHS", "chapter": "Ch. 46", "topic": "Jupiter Dasha — Effects",
     "shloka": "Jupiter dasha brings wisdom, children, wealth, spiritual growth, and favour from teachers and government during its 16-year period.",
     "tags": ["Jupiter", "dasha", "wealth", "children", "wisdom", "Guru dasha", "16 years"]},
    {"id": 32, "source": "BPHS", "chapter": "Ch. 46", "topic": "Rahu Dasha — Effects",
     "shloka": "Rahu dasha of 18 years can bring foreign travels, sudden rise, unconventional events, and Maya (illusion). Results depend on Rahu's placement and strength.",
     "tags": ["Rahu", "dasha", "foreign", "illusion", "Maya", "18 years", "sudden"]},
    # ── Remedies ──────────────────────────────────────────────────────────────
    {"id": 33, "source": "Lal Kitab", "chapter": "Section on Saturn", "topic": "Saturn Remedies — Lal Kitab",
     "shloka": "For malefic Saturn: donate black sesame (til) on Saturday, feed crows, serve old people, avoid meat on Saturday, wear iron ring on middle finger.",
     "tags": ["Saturn", "remedy", "Lal Kitab", "donation", "sesame", "crow", "upaya"]},
    {"id": 34, "source": "Lal Kitab", "chapter": "Section on Rahu", "topic": "Rahu Remedies — Lal Kitab",
     "shloka": "For malefic Rahu: donate blue/black cloth, keep saunf (fennel) under pillow, give coconut in flowing water, worship Durga or Bhairav.",
     "tags": ["Rahu", "remedy", "Lal Kitab", "upaya", "Durga", "coconut", "fennel"]},
    {"id": 35, "source": "BPHS", "chapter": "Ch. 84", "topic": "Gem Therapy — Principles",
     "shloka": "Each planet's gem strengthens its significations. Wear the gem of the Lagna lord, Atmakaraka, or the dasha lord for maximum benefit. Consult a Jyotishi before wearing.",
     "tags": ["gems", "ratna", "gem therapy", "upaya", "lagna lord", "atmakaraka", "remedy"]},
    # ── Compatibility ─────────────────────────────────────────────────────────
    {"id": 36, "source": "BPHS", "chapter": "Ch. 74", "topic": "Kuja Dosha in Marriage",
     "shloka": "Mars in 1st, 2nd, 4th, 7th, 8th, or 12th house from Ascendant, Moon, or Venus creates Kuja Dosha. Matching with similarly afflicted person neutralises the dosha.",
     "tags": ["Mars", "Kuja dosha", "Mangal dosha", "marriage", "compatibility", "seventh house"]},
    {"id": 37, "source": "BPHS", "chapter": "Ch. 74", "topic": "Nadi Koota — Compatibility",
     "shloka": "Nadi koota has 8 points. Adi, Madhya, and Antya nadi should not match between bride and groom as same nadi indicates health issues in children.",
     "tags": ["Nadi", "koota", "compatibility", "marriage", "Kundali milan", "health", "children"]},
    # ── Ashtakavarga ──────────────────────────────────────────────────────────
    {"id": 38, "source": "BPHS", "chapter": "Ch. 67", "topic": "Ashtakavarga — Bindus in Transit",
     "shloka": "When a transiting planet passes through a sign with 5 or more bindus in its own Ashtakavarga, the results are favourable. Below 4 bindus indicates difficulties.",
     "tags": ["Ashtakavarga", "transit", "bindu", "benefic points", "gochara", "5 bindus"]},
    {"id": 39, "source": "BPHS", "chapter": "Ch. 67", "topic": "Sarvashtakavarga — 337 Points Rule",
     "shloka": "If the total Sarvashtakavarga points exceed 337, the native is fortunate. Between 240-337 is average. Below 240 indicates a difficult life.",
     "tags": ["Sarvashtakavarga", "337", "total points", "Ashtakavarga", "fortune"]},
    # ── Pancha Mahapurusha ────────────────────────────────────────────────────
    {"id": 40, "source": "BPHS", "chapter": "Ch. 28", "topic": "Pancha Mahapurusha Yogas",
     "shloka": "Five Pancha Mahapurusha Yogas: Ruchaka (Mars), Bhadra (Mercury), Hamsa (Jupiter), Malavya (Venus), Shasha (Saturn) — formed when these planets are in own/exaltation sign in kendra.",
     "tags": ["Pancha Mahapurusha", "Ruchaka", "Bhadra", "Hamsa", "Malavya", "Shasha", "yoga", "kendra"]},
]


def search_texts(query: str, source: Optional[str] = None, max_results: int = 10) -> list:
    words = re.findall(r'\w+', query.lower())
    results = []
    for entry in CLASSICAL_DB:
        if source and entry["source"].lower() != source.lower():
            continue
        tags_lower = [t.lower() for t in entry["tags"]]
        topic_lower = entry["topic"].lower()
        shloka_lower = entry["shloka"].lower()
        score = 0
        for w in words:
            if w in tags_lower:
                score += 3
            elif any(w in t for t in tags_lower):
                score += 2
            elif w in topic_lower:
                score += 2
            elif w in shloka_lower:
                score += 1
        if score > 0:
            results.append({**entry, "relevance_score": score})
    results.sort(key=lambda x: -x["relevance_score"])
    return results[:max_results]


@router.get("/classical_search")
def classical_text_search(
    q: str = Query(..., description="Search query"),
    source: Optional[str] = Query(None, description="Filter by source: BPHS, Saravali, Phaladeepika, Lal Kitab, Jataka Parijata"),
    limit: int = Query(10, le=40),
):
    results = search_texts(q, source, limit)
    return {
        "query": q,
        "results": results,
        "total": len(results),
        "sources": ["BPHS", "Saravali", "Phaladeepika", "Lal Kitab", "Jataka Parijata"],
    }


@router.get("/classical_topics")
def list_topics():
    topics = {}
    for entry in CLASSICAL_DB:
        src = entry["source"]
        if src not in topics:
            topics[src] = []
        topics[src].append({"id": entry["id"], "topic": entry["topic"], "chapter": entry["chapter"]})
    return topics
