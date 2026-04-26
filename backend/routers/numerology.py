"""
Vedic Numerology — based on date of birth.
Calculates: Life Path (Moolank), Destiny (Bhagyank), Name Number basics,
Lucky numbers, Lucky days, Compatible numbers, Ruling planet.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["numerology"])

PLANET_OF_NUMBER = {
    1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
    6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
}

LUCKY_DAYS = {
    1: ["Sunday", "Monday"], 2: ["Monday", "Friday"], 3: ["Thursday", "Tuesday"],
    4: ["Sunday", "Saturday"], 5: ["Wednesday", "Friday"], 6: ["Friday", "Wednesday"],
    7: ["Monday", "Sunday"], 8: ["Saturday", "Friday"], 9: ["Tuesday", "Thursday"],
}

LUCKY_COLORS = {
    1: ["Gold", "Orange", "Yellow"], 2: ["White", "Silver", "Cream"],
    3: ["Yellow", "Violet", "Gold"], 4: ["Electric Blue", "Grey", "Dark Blue"],
    5: ["Green", "Light Grey", "White"], 6: ["Pink", "White", "Light Blue"],
    7: ["Violet", "White", "Pale Yellow"], 8: ["Dark Blue", "Black", "Brown"],
    9: ["Red", "Crimson", "Orange"],
}

LUCKY_GEMS = {
    1: "Ruby", 2: "Pearl", 3: "Yellow Sapphire", 4: "Hessonite",
    5: "Emerald", 6: "Diamond", 7: "Cat's Eye", 8: "Blue Sapphire", 9: "Red Coral",
}

COMPATIBLE_NUMBERS = {
    1: [1, 4, 7, 9], 2: [2, 4, 7, 8], 3: [3, 6, 9], 4: [1, 2, 4, 7],
    5: [1, 3, 5, 7], 6: [3, 6, 9], 7: [1, 2, 4, 7], 8: [2, 4, 8], 9: [1, 3, 6, 9],
}

KARMIC_DEBT_NUMBERS = {13, 14, 16, 19}

NUMBER_TRAITS = {
    1: {"keyword": "Leader", "positive": ["Independent", "Ambitious", "Creative", "Pioneering", "Determined"],
        "negative": ["Stubborn", "Domineering", "Self-centered"], "life_theme": "Leadership and individuality"},
    2: {"keyword": "Diplomat", "positive": ["Cooperative", "Sensitive", "Intuitive", "Peacemaker", "Supportive"],
        "negative": ["Over-sensitive", "Indecisive", "Timid"], "life_theme": "Partnership and balance"},
    3: {"keyword": "Communicator", "positive": ["Creative", "Expressive", "Optimistic", "Joyful", "Artistic"],
        "negative": ["Scattered", "Superficial", "Extravagant"], "life_theme": "Expression and creativity"},
    4: {"keyword": "Builder", "positive": ["Practical", "Disciplined", "Reliable", "Systematic", "Hardworking"],
        "negative": ["Rigid", "Stubborn", "Limiting"], "life_theme": "Foundation and stability"},
    5: {"keyword": "Freedom-seeker", "positive": ["Versatile", "Adventurous", "Progressive", "Curious", "Energetic"],
        "negative": ["Restless", "Irresponsible", "Overindulgent"], "life_theme": "Freedom and change"},
    6: {"keyword": "Nurturer", "positive": ["Loving", "Responsible", "Protective", "Healing", "Idealistic"],
        "negative": ["Perfectionist", "Controlling", "Martyrdom"], "life_theme": "Love and service"},
    7: {"keyword": "Seeker", "positive": ["Analytical", "Spiritual", "Introspective", "Wise", "Intuitive"],
        "negative": ["Withdrawn", "Skeptical", "Aloof"], "life_theme": "Wisdom and inner knowing"},
    8: {"keyword": "Achiever", "positive": ["Ambitious", "Authoritative", "Business-minded", "Resilient", "Powerful"],
        "negative": ["Materialistic", "Controlling", "Ruthless"], "life_theme": "Power and material mastery"},
    9: {"keyword": "Humanitarian", "positive": ["Compassionate", "Generous", "Idealistic", "Universal", "Creative"],
        "negative": ["Bitter", "Moody", "Possessive"], "life_theme": "Service and completion"},
}

LETTER_VALUES = {
    'A':1,'B':2,'C':3,'D':4,'E':5,'F':8,'G':3,'H':5,'I':1,'J':1,
    'K':2,'L':3,'M':4,'N':5,'O':7,'P':8,'Q':1,'R':2,'S':3,'T':4,
    'U':6,'V':6,'W':6,'X':5,'Y':1,'Z':7,
}

VOWELS = set('AEIOU')


def reduce(n: int) -> int:
    while n > 9 and n not in {11, 22, 33}:
        n = sum(int(d) for d in str(n))
    return n


def reduce_strict(n: int) -> int:
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n


def name_to_value(name: str) -> int:
    name = name.upper().replace(' ', '')
    return sum(LETTER_VALUES.get(c, 0) for c in name if c.isalpha())


def soul_urge(name: str) -> int:
    name = name.upper().replace(' ', '')
    return reduce(sum(LETTER_VALUES.get(c, 0) for c in name if c in VOWELS and c.isalpha()))


def personality_number(name: str) -> int:
    name = name.upper().replace(' ', '')
    return reduce(sum(LETTER_VALUES.get(c, 0) for c in name if c not in VOWELS and c.isalpha()))


class NumerologyInput(BaseModel):
    day: int
    month: int
    year: int
    name: str = ""


@router.post("/numerology")
async def get_numerology(data: NumerologyInput):
    # Moolank (Birth Number / Driver) — just the day reduced
    raw_day = data.day
    moolank = reduce_strict(raw_day)

    # Bhagyank (Life Path / Destiny) — sum of full date
    raw_sum = data.day + data.month + sum(int(d) for d in str(data.year))
    bhagyank = reduce(raw_sum)

    # Kua number (Feng Shui / Vedic direction) for fun
    yr_sum = reduce_strict(sum(int(d) for d in str(data.year)))

    karmic_debt = raw_day in KARMIC_DEBT_NUMBERS or raw_sum in KARMIC_DEBT_NUMBERS

    # Name numbers
    name_num = reduce(name_to_value(data.name)) if data.name.strip() else None
    soul = soul_urge(data.name) if data.name.strip() else None
    personality = personality_number(data.name) if data.name.strip() else None

    traits_m = NUMBER_TRAITS.get(moolank, {})
    traits_b = NUMBER_TRAITS.get(bhagyank, {})

    # Personal year (current) = (day + month + current_year_sum) reduced
    # Use year from input as "current" year for personal year calc
    py_raw = data.day + data.month + yr_sum
    personal_year = reduce(py_raw)

    return {
        "moolank": {
            "number": moolank,
            "raw": raw_day,
            "label": "Birth Number (Moolank / Driver)",
            "planet": PLANET_OF_NUMBER.get(moolank),
            "keyword": traits_m.get("keyword", ""),
            "positive_traits": traits_m.get("positive", []),
            "negative_traits": traits_m.get("negative", []),
            "life_theme": traits_m.get("life_theme", ""),
        },
        "bhagyank": {
            "number": bhagyank,
            "raw": raw_sum,
            "label": "Destiny Number (Bhagyank / Life Path)",
            "planet": PLANET_OF_NUMBER.get(bhagyank if bhagyank <= 9 else reduce_strict(bhagyank)),
            "keyword": traits_b.get("keyword", ""),
            "positive_traits": traits_b.get("positive", []),
            "negative_traits": traits_b.get("negative", []),
            "life_theme": traits_b.get("life_theme", ""),
        },
        "name_analysis": {
            "expression_number": name_num,
            "soul_urge": soul,
            "personality": personality,
            "planet": PLANET_OF_NUMBER.get(name_num) if name_num else None,
        } if data.name.strip() else None,
        "lucky": {
            "numbers": COMPATIBLE_NUMBERS.get(moolank, []),
            "days": LUCKY_DAYS.get(moolank, []),
            "colors": LUCKY_COLORS.get(moolank, []),
            "gem": LUCKY_GEMS.get(moolank, ""),
        },
        "compatible_numbers": COMPATIBLE_NUMBERS.get(moolank, []),
        "personal_year": personal_year,
        "karmic_debt": karmic_debt,
        "karmic_debt_number": raw_day if raw_day in KARMIC_DEBT_NUMBERS else (raw_sum if raw_sum in KARMIC_DEBT_NUMBERS else None),
        "input": {"day": data.day, "month": data.month, "year": data.year, "name": data.name},
    }
