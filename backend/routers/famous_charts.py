"""
Famous Charts Atlas — curated birth data of notable figures for study.
"""
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(tags=["famous_charts"])

FAMOUS_CHARTS = [
    # Spiritual / Saints
    {"id": "swami_vivekananda", "name": "Swami Vivekananda", "category": "Saint/Philosopher",
     "year": 1863, "month": 1, "day": 12, "hour": 6, "minute": 33,
     "latitude": 22.5726, "longitude": 88.3639, "tz_offset": 5.53,
     "place": "Kolkata, India", "tags": ["saint", "vedanta", "india", "spiritual"],
     "notes": "Lagna: Sagittarius. Sun in Capricorn, Moon in Sagittarius. Jupiter in Virgo. Famous for Vedanta and Raja Yoga."},
    {"id": "ramakrishna", "name": "Ramakrishna Paramahamsa", "category": "Saint/Mystic",
     "year": 1836, "month": 2, "day": 18, "hour": 7, "minute": 0,
     "latitude": 22.9333, "longitude": 88.3667, "tz_offset": 5.53,
     "place": "Kamarpukur, Bengal", "tags": ["saint", "mystic", "india", "spiritual"],
     "notes": "Renowned mystic and spiritual teacher of 19th century Bengal."},
    {"id": "yogananda", "name": "Paramahansa Yogananda", "category": "Saint/Yogi",
     "year": 1893, "month": 1, "day": 5, "hour": 8, "minute": 38,
     "latitude": 26.8467, "longitude": 80.9462, "tz_offset": 5.53,
     "place": "Gorakhpur, India", "tags": ["saint", "yogi", "india", "kriya"],
     "notes": "Author of Autobiography of a Yogi. Strong 9th house — spirituality and travel."},
    {"id": "sri_aurobindo", "name": "Sri Aurobindo", "category": "Saint/Philosopher",
     "year": 1872, "month": 8, "day": 15, "hour": 5, "minute": 0,
     "latitude": 22.5726, "longitude": 88.3639, "tz_offset": 5.53,
     "place": "Kolkata, India", "tags": ["saint", "philosopher", "india", "yoga"],
     "notes": "Philosopher, yogi, poet, nationalist. Born on India's Independence Day."},

    # Historical Leaders / Politicians
    {"id": "mahatma_gandhi", "name": "Mahatma Gandhi", "category": "Political Leader",
     "year": 1869, "month": 10, "day": 2, "hour": 7, "minute": 45,
     "latitude": 21.6417, "longitude": 69.6293, "tz_offset": 5.53,
     "place": "Porbandar, India", "tags": ["leader", "india", "freedom", "nonviolence"],
     "notes": "Libra Lagna, Moon in Leo. Venus as Lagna lord in 12th. Saturn exalted."},
    {"id": "jawaharlal_nehru", "name": "Jawaharlal Nehru", "category": "Political Leader",
     "year": 1889, "month": 11, "day": 14, "hour": 23, "minute": 0,
     "latitude": 25.4358, "longitude": 81.8463, "tz_offset": 5.53,
     "place": "Allahabad, India", "tags": ["leader", "india", "prime minister"],
     "notes": "First Prime Minister of India. Virgo Lagna, strong Mercury."},
    {"id": "napoleon", "name": "Napoleon Bonaparte", "category": "Military/Political",
     "year": 1769, "month": 8, "day": 15, "hour": 11, "minute": 0,
     "latitude": 41.9192, "longitude": 8.7386, "tz_offset": 0.0,
     "place": "Ajaccio, Corsica", "tags": ["military", "france", "emperor", "europe"],
     "notes": "Scorpio Lagna. Mars-Saturn combination gave military prowess and ultimate downfall."},
    {"id": "abraham_lincoln", "name": "Abraham Lincoln", "category": "Political Leader",
     "year": 1809, "month": 2, "day": 12, "hour": 7, "minute": 0,
     "latitude": 37.5571, "longitude": -85.6742, "tz_offset": -6.0,
     "place": "Hardin County, Kentucky, USA", "tags": ["usa", "president", "lincoln"],
     "notes": "Aquarius Lagna. Saturn strong. Known for perseverance through hardship."},
    {"id": "adolf_hitler", "name": "Adolf Hitler", "category": "Historical Figure",
     "year": 1889, "month": 4, "day": 20, "hour": 18, "minute": 30,
     "latitude": 48.2545, "longitude": 13.0397, "tz_offset": 1.0,
     "place": "Braunau am Inn, Austria", "tags": ["germany", "wwii", "europe", "historical"],
     "notes": "Libra Lagna. Mars in 7th, Saturn-Venus in 7th. Extreme malefic combinations."},

    # Scientists / Intellectuals
    {"id": "albert_einstein", "name": "Albert Einstein", "category": "Scientist",
     "year": 1879, "month": 3, "day": 14, "hour": 11, "minute": 30,
     "latitude": 48.4011, "longitude": 9.9876, "tz_offset": 1.0,
     "place": "Ulm, Germany", "tags": ["scientist", "physics", "germany", "genius"],
     "notes": "Pisces Lagna. Mercury in Aries, strong 3rd house intellect. Sun-Saturn-Mercury cluster."},
    {"id": "nikola_tesla", "name": "Nikola Tesla", "category": "Scientist/Inventor",
     "year": 1856, "month": 7, "day": 10, "hour": 0, "minute": 0,
     "latitude": 44.5697, "longitude": 15.9728, "tz_offset": 1.0,
     "place": "Smiljan, Croatia", "tags": ["inventor", "electricity", "scientist", "europe"],
     "notes": "Cancer Lagna. Strong Uranian impulse (electricity). Rahu in 11th — eccentric genius."},
    {"id": "srinivasa_ramanujan", "name": "Srinivasa Ramanujan", "category": "Mathematician",
     "year": 1887, "month": 12, "day": 22, "hour": 18, "minute": 0,
     "latitude": 10.9601, "longitude": 79.3845, "tz_offset": 5.53,
     "place": "Erode, Tamil Nadu, India", "tags": ["mathematician", "india", "genius"],
     "notes": "Gemini Lagna. Mercury + Jupiter strong. Saturn in 5th — deep mathematical intuition."},

    # Artists / Creative
    {"id": "leonardo_da_vinci", "name": "Leonardo da Vinci", "category": "Artist/Polymath",
     "year": 1452, "month": 4, "day": 15, "hour": 22, "minute": 30,
     "latitude": 43.7832, "longitude": 10.9258, "tz_offset": 0.0,
     "place": "Vinci, Italy", "tags": ["artist", "inventor", "italy", "renaissance"],
     "notes": "Scorpio Lagna. Venus in Pisces (exalted). Moon in Pisces. Extraordinary creative genius."},
    {"id": "beethoven", "name": "Ludwig van Beethoven", "category": "Musician",
     "year": 1770, "month": 12, "day": 17, "hour": 1, "minute": 0,
     "latitude": 50.7374, "longitude": 7.0982, "tz_offset": 1.0,
     "place": "Bonn, Germany", "tags": ["musician", "composer", "germany", "classical"],
     "notes": "Libra Lagna. Venus strong. Saturn afflicting 2nd (hearing loss). Jupiter in 5th."},
    {"id": "william_shakespeare", "name": "William Shakespeare", "category": "Writer/Poet",
     "year": 1564, "month": 4, "day": 23, "hour": 10, "minute": 0,
     "latitude": 52.1917, "longitude": -1.7083, "tz_offset": 0.0,
     "place": "Stratford-upon-Avon, England", "tags": ["writer", "poet", "england", "literature"],
     "notes": "Cancer Lagna. Mercury and Jupiter powerful. 3rd and 5th houses prominent."},

    # Jyotish / Astrologers
    {"id": "bv_raman", "name": "B.V. Raman", "category": "Astrologer",
     "year": 1912, "month": 8, "day": 8, "hour": 19, "minute": 37,
     "latitude": 12.9716, "longitude": 77.5946, "tz_offset": 5.53,
     "place": "Bengaluru, India", "tags": ["astrologer", "jyotish", "india"],
     "notes": "Doyen of modern Jyotish. Capricorn Lagna. Saturn exalted. Jupiter in 9th."},
    {"id": "krishnamurti", "name": "K.S. Krishnamurti", "category": "Astrologer",
     "year": 1908, "month": 11, "day": 1, "hour": 9, "minute": 26,
     "latitude": 9.9252, "longitude": 78.1198, "tz_offset": 5.53,
     "place": "Madurai, Tamil Nadu", "tags": ["astrologer", "kp", "india"],
     "notes": "Founder of KP System. Scorpio Lagna."},

    # Indian Cinema / Entertainment
    {"id": "amitabh_bachchan", "name": "Amitabh Bachchan", "category": "Actor",
     "year": 1942, "month": 10, "day": 11, "hour": 16, "minute": 0,
     "latitude": 25.4358, "longitude": 81.8463, "tz_offset": 5.53,
     "place": "Allahabad, India", "tags": ["actor", "india", "bollywood", "celebrity"],
     "notes": "Aquarius Lagna. Saturn as lagna lord strong. Rahu in 10th gave unmatched fame."},
    {"id": "lata_mangeshkar", "name": "Lata Mangeshkar", "category": "Singer",
     "year": 1929, "month": 9, "day": 28, "hour": 11, "minute": 0,
     "latitude": 22.7196, "longitude": 75.8577, "tz_offset": 5.53,
     "place": "Indore, India", "tags": ["singer", "india", "bollywood", "music"],
     "notes": "Scorpio Lagna. Venus exalted in Pisces in 5th. Extraordinary vocal talent."},

    # Sports
    {"id": "sachin_tendulkar", "name": "Sachin Tendulkar", "category": "Sportsperson",
     "year": 1973, "month": 4, "day": 24, "hour": 17, "minute": 4,
     "latitude": 19.0760, "longitude": 72.8777, "tz_offset": 5.53,
     "place": "Mumbai, India", "tags": ["cricket", "india", "sports"],
     "notes": "Virgo Lagna. Mercury strong. Mars in 3rd gave exceptional hand-eye coordination."},
    {"id": "muhammad_ali", "name": "Muhammad Ali", "category": "Sportsperson",
     "year": 1942, "month": 1, "day": 17, "hour": 18, "minute": 35,
     "latitude": 38.2527, "longitude": -85.7585, "tz_offset": -6.0,
     "place": "Louisville, Kentucky, USA", "tags": ["boxing", "usa", "sports"],
     "notes": "Cancer Lagna. Mars strong. Moon in Aquarius. Champion who transcended sport."},

    # Business / Entrepreneurs
    {"id": "dhirubhai_ambani", "name": "Dhirubhai Ambani", "category": "Entrepreneur",
     "year": 1932, "month": 12, "day": 28, "hour": 7, "minute": 0,
     "latitude": 21.7645, "longitude": 70.0692, "tz_offset": 5.53,
     "place": "Chorwad, Gujarat, India", "tags": ["business", "india", "entrepreneur"],
     "notes": "Sagittarius Lagna. Jupiter strong. Rahu in 11th house — extraordinary wealth gains."},
    {"id": "steve_jobs", "name": "Steve Jobs", "category": "Entrepreneur",
     "year": 1955, "month": 2, "day": 24, "hour": 19, "minute": 15,
     "latitude": 37.3382, "longitude": -121.8863, "tz_offset": -8.0,
     "place": "San Francisco, California, USA", "tags": ["business", "usa", "technology", "apple"],
     "notes": "Virgo Lagna. Mercury + Saturn combination. Ketu in 10th — unconventional career path."},

    # Spiritual Modern
    {"id": "osho", "name": "Osho (Rajneesh)", "category": "Saint/Philosopher",
     "year": 1931, "month": 12, "day": 11, "hour": 17, "minute": 13,
     "latitude": 23.1765, "longitude": 79.9864, "tz_offset": 5.53,
     "place": "Kuchwada, Madhya Pradesh", "tags": ["saint", "india", "philosopher", "controversial"],
     "notes": "Taurus Lagna. Mercury + Sun + Venus in 8th. Deep occult intelligence."},
    {"id": "sai_baba_shirdi", "name": "Shirdi Sai Baba", "category": "Saint/Mystic",
     "year": 1838, "month": 9, "day": 27, "hour": 0, "minute": 0,
     "latitude": 19.7657, "longitude": 74.4766, "tz_offset": 5.53,
     "place": "Shirdi, Maharashtra (approximate)", "tags": ["saint", "india", "mystic"],
     "notes": "Approximate birth data (debated). Revered by millions across faiths."},
]

CATEGORIES = sorted(set(c["category"] for c in FAMOUS_CHARTS))
ALL_TAGS = sorted(set(t for c in FAMOUS_CHARTS for t in c["tags"]))


@router.get("/famous_charts")
async def list_famous_charts(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
):
    results = FAMOUS_CHARTS
    if category:
        results = [c for c in results if c["category"].lower() == category.lower()]
    if tag:
        results = [c for c in results if tag.lower() in [t.lower() for t in c["tags"]]]
    if q:
        ql = q.lower()
        results = [c for c in results if ql in c["name"].lower() or ql in c["notes"].lower()
                   or any(ql in t for t in c["tags"]) or ql in c["place"].lower()]
    return {"charts": results, "total": len(results)}


@router.get("/famous_charts/meta")
async def famous_charts_meta():
    return {"categories": CATEGORIES, "tags": ALL_TAGS, "total": len(FAMOUS_CHARTS)}
