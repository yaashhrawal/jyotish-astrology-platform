"""
Topic (life-area) registry. Each entry configures the generic topic engine for one
bhāva — the same 23 refined rules apply, parameterized by house + karakas + the
divisional chart that is authoritative for that area.

`primary_varga` = the divisional the area is judged in (career→D10, marriage→D9…).
`karakas` = natural significators (name → what it signifies for this area).
Composite areas use `houses` (list) instead of `house`; the engine runs each and merges.
"""

TOPICS = {
    # ── 1st: self, body, vitality, temperament ───────────────────────────
    "self": {
        "_key": "self", "house": 1, "label": "Self, body and vitality", "primary_varga": 1,
        "karakas": {"Sun": "soul, vitality, constitution"},
        "house_source": "BPHS Ch.12 — Tanu (1st) bhava results",
        "varga_source": "BPHS Ch.7 — Rashi (D1)",
    },
    # ── 2nd: wealth, family, speech, food ────────────────────────────────
    "wealth": {
        "_key": "wealth", "house": 2, "label": "Wealth, family and speech", "primary_varga": 2,
        "karakas": {"Jupiter": "accumulated wealth (dhana karaka)",
                    "Venus": "assets, valuables, refinement",
                    "Mercury": "speech, accounts, trade"},
        "house_source": "BPHS Ch.13 — Dhana (2nd) bhava results",
        "varga_source": "BPHS Ch.6 — Hora (D2, wealth divisional)",
    },
    # ── 3rd: courage, siblings, effort, communication ────────────────────
    "courage": {
        "_key": "courage", "house": 3, "label": "Courage, siblings and initiative", "primary_varga": 3,
        "karakas": {"Mars": "courage, younger siblings, drive"},
        "house_source": "BPHS Ch.14 — Sahaja (3rd) bhava results",
        "varga_source": "BPHS Ch.6 — Drekkana (D3, siblings divisional)",
    },
    # ── 4th: home, mother, property, happiness ───────────────────────────
    "home": {
        "_key": "home", "house": 4, "label": "Home, mother and happiness", "primary_varga": 4,
        "karakas": {"Moon": "mother, emotional security (matru karaka)",
                    "Venus": "vehicles, comforts, property enjoyment"},
        "house_source": "BPHS Ch.15 — Sukha (4th) bhava results",
        "varga_source": "BPHS Ch.6 — Chaturthamsha (D4, property divisional)",
    },
    # ── 5th: children, intellect, past merit, creativity ─────────────────
    "children": {
        "_key": "children", "house": 5, "label": "Children, intellect and creativity", "primary_varga": 7,
        "karakas": {"Jupiter": "children (putra karaka), wisdom, fortune"},
        "house_source": "BPHS Ch.16 — Putra (5th) bhava results",
        "varga_source": "BPHS Ch.40 — Saptamsha (D7, progeny divisional)",
    },
    # ── 6th: enemies, health, debts, service ─────────────────────────────
    "health": {
        "_key": "health", "house": 6, "label": "Health, enemies and service", "primary_varga": 6,
        "karakas": {"Mars": "wounds, surgery, conflict",
                    "Saturn": "chronic illness, service, endurance"},
        "house_source": "BPHS Ch.17 — Shatru/Roga (6th) bhava results",
        "varga_source": "BPHS Ch.6 — Shashthamsha (D6, health divisional)",
    },
    # ── 7th: marriage, partnership (Navamsha) ────────────────────────────
    "marriage": {
        "_key": "marriage", "house": 7, "label": "Marriage and partnership", "primary_varga": 9,
        "karakas": {"Venus": "spouse, love, harmony, attraction (kalatra karaka)",
                    "Jupiter": "husband/dharma in a woman's chart, wisdom in union"},
        "house_source": "BPHS Ch.18 — Jaya (7th) bhava results",
        "varga_source": "BPHS Ch.6 & 40 — Navamsha (marriage divisional)",
        "manglik": True,
    },
    # ── 8th: longevity, transformation, occult ───────────────────────────
    "longevity": {
        "_key": "longevity", "house": 8, "label": "Longevity, transformation and the occult", "primary_varga": 1,
        "karakas": {"Saturn": "longevity (ayush karaka), endurance through crisis"},
        "house_source": "BPHS Ch.19 — Ayur (8th) bhava results",
        "varga_source": "BPHS Ch.7 — Rashi (D1)",
    },
    # ── 9th: fortune, father, dharma, guru (Navamsha) ────────────────────
    "fortune": {
        "_key": "fortune", "house": 9, "label": "Fortune, father and dharma", "primary_varga": 9,
        "karakas": {"Jupiter": "guru, dharma, higher wisdom",
                    "Sun": "father, blessings of authority"},
        "house_source": "BPHS Ch.20 — Bhagya (9th) bhava results",
        "varga_source": "BPHS Ch.6 & 40 — Navamsha (dharma divisional)",
    },
    # ── 10th: career, status (Dashamsha) ─────────────────────────────────
    "career": {
        "_key": "career", "house": 10, "label": "Career and profession", "primary_varga": 10,
        "karakas": {"Sun": "authority, government, leadership, visibility",
                    "Saturn": "service, labor, discipline, long-haul work",
                    "Mercury": "commerce, communication, skilled/analytical work",
                    "Jupiter": "advisory, teaching, law, ethics-led work"},
        "house_source": "BPHS Ch.21 — Karma bhava results",
        "varga_source": "BPHS Ch.40 — Dashamsha (career divisional)",
    },
    # ── 11th: gains, income, aspirations ─────────────────────────────────
    "gains": {
        "_key": "gains", "house": 11, "label": "Gains, income and aspirations", "primary_varga": 1,
        "karakas": {"Jupiter": "income, fulfilment of desires (labha karaka)"},
        "house_source": "BPHS Ch.22 — Labha (11th) bhava results",
        "varga_source": "BPHS Ch.7 — Rashi (D1)",
    },
    # ── 12th: loss, expense, foreign, moksha ─────────────────────────────
    "moksha": {
        "_key": "moksha", "house": 12, "label": "Loss, foreign lands and liberation", "primary_varga": 20,
        "karakas": {"Saturn": "loss, isolation, renunciation",
                    "Ketu": "moksha, detachment, the beyond"},
        "house_source": "BPHS Ch.23 — Vyaya (12th) bhava results",
        "varga_source": "BPHS Ch.40 — Vimshamsha (D20, spirituality divisional)",
    },

    # ── Composite areas — engine runs each house and merges factors ──────
    "love": {
        "_key": "love", "houses": [5, 7], "house": 5, "label": "Love and romance", "primary_varga": 1,
        "karakas": {"Venus": "romance, attraction, affection (kama karaka)"},
        "house_source": "BPHS Ch.16 & 18 — 5th (romance) + 7th (union)",
        "varga_source": "BPHS Ch.7 — Rashi (D1)",
    },
    "family": {
        "_key": "family", "houses": [2, 4], "house": 2, "label": "Family and domestic life", "primary_varga": 1,
        "karakas": {"Moon": "mother, emotional bonds", "Jupiter": "family wellbeing, elders"},
        "house_source": "BPHS Ch.13 & 15 — 2nd (kutumba) + 4th (home)",
        "varga_source": "BPHS Ch.7 — Rashi (D1)",
    },
    "travel": {
        "_key": "travel", "houses": [3, 9, 12], "house": 3, "label": "Travel and relocation", "primary_varga": 1,
        "karakas": {"Rahu": "foreign lands, unconventional journeys"},
        "house_source": "BPHS — 3rd (short) + 9th (long) + 12th (foreign) journeys",
        "varga_source": "BPHS Ch.7 — Rashi (D1)",
    },
}


def get_topic(key: str) -> dict:
    return TOPICS[key]


def all_topics():
    return list(TOPICS.keys())
