"""
Varga (divisional) domains + reframed house meanings — so a reading INSIDE a varga
speaks in that varga's language (D9 = marriage/dharma, D10 = career, D7 = children …),
not generic house terms. Mirrors the classical scope of each Shodashavarga divisional.

Sources: BPHS Ch.6 & Ch.40 (Shodashavarga); Phaladeepika Ch.16.
"""

BASE_HOUSE_MEANINGS = [
    "self, body, overall temperament",
    "wealth, family, speech, resources",
    "courage, siblings, effort, communication",
    "home, mother, property, inner peace",
    "children, intellect, past merit, creativity",
    "enemies, debts, disease, service",
    "spouse, partnerships, public dealings",
    "longevity, transformation, the occult",
    "fortune, father, dharma, higher learning",
    "career, status, authority, action",
    "gains, income, desires fulfilled, networks",
    "loss, expenditure, foreign lands, liberation",
]

# domain = what the whole varga governs; houseMeanings = 12 house themes reframed for it.
VARGA_DOMAINS = {
    1:  {"name": "Rashi", "domain": "body & the whole of life", "houseMeanings": BASE_HOUSE_MEANINGS},
    2:  {"name": "Hora", "domain": "wealth & financial sustenance", "houseMeanings": None},
    3:  {"name": "Drekkana", "domain": "siblings, courage & co-borns", "houseMeanings": None},
    4:  {"name": "Chaturthamsha", "domain": "home, property & fixed assets", "houseMeanings": None},
    7:  {"name": "Saptamsha", "domain": "children & progeny", "houseMeanings": None},
    9:  {"name": "Navamsha", "domain": "marriage, dharma & inner strength", "houseMeanings": [
        "inner self, true character, strength of the whole chart",
        "family life after marriage, sustained values",
        "courage in relationships, in-laws through siblings",
        "domestic happiness with the spouse, emotional foundation",
        "devotion, dharmic progeny, mantra & worship",
        "friction in marriage, service to the partner, debts of union",
        "the spouse — nature, character, marital harmony",
        "longevity of the marriage, hidden dynamics",
        "fortune through marriage, guru, right conduct (very strong here)",
        "dharmic conduct in action, principle-led work",
        "fulfilment of desires through partnership, gains of dharma",
        "bed pleasures, moksha, surrender in relationship",
    ]},
    10: {"name": "Dashamsha", "domain": "career, profession & public status", "houseMeanings": [
        "professional self, work identity, how you are seen at work",
        "professional income, earnings from the vocation",
        "professional courage, initiative, colleagues",
        "workplace comfort, employer as your base",
        "professional intelligence, advisory roles",
        "competition, rivals, subordinates, daily duties",
        "business partnerships, clients, public-facing deals",
        "sudden career shifts, obstacles, transformation of work",
        "career fortune, mentors, ethics & luck in profession",
        "the peak of career, authority, the profession itself",
        "professional gains, achievement of ambitions, networks",
        "career expenses, foreign work, exit/retirement",
    ]},
    12: {"name": "Dwadashamsha", "domain": "parents & ancestry", "houseMeanings": None},
    16: {"name": "Shodashamsha", "domain": "vehicles, luxuries & comforts", "houseMeanings": None},
    20: {"name": "Vimshamsha", "domain": "spiritual practice & devotion", "houseMeanings": None},
    24: {"name": "Chaturvimshamsha", "domain": "education, learning & scholarship", "houseMeanings": None},
    27: {"name": "Bhamsha", "domain": "strengths, weaknesses & vitality", "houseMeanings": None},
    30: {"name": "Trimshamsha", "domain": "misfortunes, adversity & evils", "houseMeanings": None},
    40: {"name": "Khavedamsha", "domain": "maternal legacy & auspicious effects", "houseMeanings": None},
    45: {"name": "Akshavedamsha", "domain": "paternal legacy & overall conduct", "houseMeanings": None},
    60: {"name": "Shashtyamsha", "domain": "past-life karma & fine detail", "houseMeanings": None},
}


def varga_info(d: int) -> dict:
    v = VARGA_DOMAINS.get(d, {"name": f"D{d}", "domain": "this divisional chart", "houseMeanings": None})
    return {"d": d, "name": v["name"], "domain": v["domain"]}


def varga_house_meaning(d: int, house: int) -> str:
    """House theme reframed for this varga (falls back to the generic theme)."""
    v = VARGA_DOMAINS.get(d)
    hm = (v or {}).get("houseMeanings")
    if hm:
        return hm[(house - 1) % 12]
    return BASE_HOUSE_MEANINGS[(house - 1) % 12]
