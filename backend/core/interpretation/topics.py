"""
Topic (life-area) registry. Each entry configures the generic topic engine for one
bhāva — the same 23 refined rules apply, parameterized by house + karakas + the
divisional chart that is authoritative for that area.

`primary_varga` = the divisional the area is judged in (career→D10, marriage→D9…).
`karakas` = natural significators (name → what it signifies for this area).
"""

TOPICS = {
    "career": {
        "_key": "career",
        "house": 10, "label": "Career and profession", "primary_varga": 10,
        "karakas": {
            "Sun": "authority, government, leadership, visibility",
            "Saturn": "service, labor, discipline, long-haul work",
            "Mercury": "commerce, communication, skilled/analytical work",
            "Jupiter": "advisory, teaching, law, ethics-led work",
        },
        "house_source": "BPHS Ch.21 — Karma bhava results",
        "varga_source": "BPHS Ch.40 — Dashamsha (career divisional)",
    },
    "marriage": {
        "_key": "marriage",
        "house": 7, "label": "Marriage and partnership", "primary_varga": 9,
        "karakas": {
            "Venus": "spouse, love, harmony, attraction (kalatra karaka)",
            "Jupiter": "husband/dharma in a woman's chart, wisdom in union",
        },
        "house_source": "BPHS Ch.18 — Jaya (7th) bhava results",
        "varga_source": "BPHS Ch.6 & 40 — Navamsha (marriage divisional)",
        # marriage-specific extra rule
        "manglik": True,
    },
}


def get_topic(key: str) -> dict:
    return TOPICS[key]
