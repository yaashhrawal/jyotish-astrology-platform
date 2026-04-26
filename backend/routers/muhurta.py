"""
Muhurta — auspicious timing finder.
Checks Panchanga quality for a given time window.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import swisseph as swe
from core.engine import (
    birth_to_jd, get_ayanamsa, tropical_to_sidereal, get_sign_and_degree,
    get_nakshatra, SIGNS, NAKSHATRAS, NAKSHATRA_LORDS, calculate_planets
)
from routers.panchanga import (
    get_tithi, get_vara, get_yoga, get_karana, get_nakshatra_pada
)

router = APIRouter()

# Auspicious nakshatras by purpose
NAKSHATRA_QUALITY = {
    # Fixed (Sthira): good for construction, coronation
    "fixed": ["Rohini", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada"],
    # Soft/tender (Mridu): good for arts, love, learning
    "soft": ["Mrigashira", "Chitra", "Anuradha", "Revati"],
    # Swift (Laghu/Kshipra): good for business, travel
    "swift": ["Ashwini", "Pushya", "Hasta", "Abhijit"],
    # Fierce (Ugra): avoid for auspicious, ok for aggressive acts
    "fierce": ["Bharani", "Magha", "Purva Phalguni", "Purva Ashadha", "Purva Bhadrapada"],
    # Mixed (Mishra): average
    "mixed": ["Krittika", "Vishakha"],
    # Moveable (Chara): good for travel, new ventures
    "moveable": ["Punarvasu", "Swati", "Shravana", "Dhanishta", "Shatabhisha"],
    # Sharp/dreadful (Tikshna): avoid, ok for surgery, enemies
    "sharp": ["Ardra", "Ashlesha", "Jyeshtha", "Mula"],
}

# Tithi quality: 2/7/12=good, 5/10=medium, 4/8/14=avoid
GOOD_TITHIS = [1, 2, 3, 5, 6, 7, 10, 11, 12, 13]
AVOID_TITHIS = [4, 8, 9, 14, 30]  # 30 = Amavasya

# Vara (weekday) suitability
VARA_QUALITY = {
    "Sunday": "medium",    "Monday": "good",   "Tuesday": "avoid",
    "Wednesday": "good",   "Thursday": "good", "Friday": "good",  "Saturday": "medium"
}

# Yoga quality: 1=Vishkambha(bad) ... 27=Vaidhriti(bad)
BAD_YOGAS = ["Vishkambha", "Atiganda", "Shoola", "Ganda", "Vyaghatya", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"]

KARANA_QUALITY = {
    "Bava": "good", "Balava": "good", "Kaulava": "good", "Taitila": "good",
    "Gara": "good", "Vanija": "good", "Vishti": "avoid",  # Vishti=Bhadra is bad
    "Shakuni": "medium", "Chatushpada": "medium", "Naga": "medium", "Kimstughna": "good"
}

PURPOSE_NAKSHATRA = {
    "marriage": ["Rohini","Mrigashira","Uttara Phalguni","Hasta","Swati","Anuradha","Uttara Ashadha","Uttara Bhadrapada","Revati"],
    "travel": ["Ashwini","Punarvasu","Pushya","Hasta","Swati","Shravana","Dhanishta","Shatabhisha","Revati"],
    "business": ["Ashwini","Rohini","Pushya","Hasta","Chitra","Anuradha","Shravana","Dhanishta","Revati"],
    "education": ["Ashwini","Rohini","Mrigashira","Punarvasu","Pushya","Hasta","Chitra","Swati","Shravana","Revati"],
    "medical": ["Ashwini","Punarvasu","Pushya","Hasta","Uttara Phalguni","Uttara Ashadha","Uttara Bhadrapada","Revati"],
    "construction": ["Rohini","Uttara Phalguni","Uttara Ashadha","Uttara Bhadrapada"],
    "general": ["Rohini","Mrigashira","Punarvasu","Pushya","Hasta","Chitra","Swati","Anuradha","Uttara Phalguni","Uttara Ashadha","Uttara Bhadrapada","Revati"],
}


def score_slot(tithi: dict, vara: dict, nakshatra: str, yoga: dict, karana: dict, purpose: str) -> dict:
    score = 0
    issues = []
    positives = []

    # Tithi (max 25)
    t_num = tithi.get("number", 0)
    if t_num in GOOD_TITHIS:
        score += 25; positives.append(f"Good Tithi ({tithi.get('name','')})")
    elif t_num in AVOID_TITHIS:
        score -= 15; issues.append(f"Avoid Tithi ({tithi.get('name','')})")
    else:
        score += 10

    # Vara (max 20)
    vq = VARA_QUALITY.get(vara.get("day", ""), "medium")
    if vq == "good":
        score += 20; positives.append(f"Favorable day ({vara.get('day','')})")
    elif vq == "avoid":
        score -= 10; issues.append(f"Avoid day ({vara.get('day','')})")
    else:
        score += 10

    # Nakshatra (max 30)
    good_naks = PURPOSE_NAKSHATRA.get(purpose, PURPOSE_NAKSHATRA["general"])
    if nakshatra in good_naks:
        score += 30; positives.append(f"Auspicious Nakshatra ({nakshatra})")
    else:
        # Check quality category
        for qual, naks in NAKSHATRA_QUALITY.items():
            if nakshatra in naks:
                if qual in ("fixed", "soft", "swift", "moveable"):
                    score += 15
                elif qual in ("fierce", "sharp"):
                    score -= 10; issues.append(f"{qual.title()} Nakshatra ({nakshatra})")
                else:
                    score += 5

    # Yoga (max 15)
    yoga_name = yoga.get("name", "")
    if yoga_name in BAD_YOGAS:
        score -= 15; issues.append(f"Inauspicious Yoga ({yoga_name})")
    else:
        score += 15; positives.append(f"Good Yoga ({yoga_name})")

    # Karana (max 10)
    kq = KARANA_QUALITY.get(karana.get("name", ""), "medium")
    if kq == "good":
        score += 10; positives.append(f"Good Karana ({karana.get('name','')})")
    elif kq == "avoid":
        score -= 5; issues.append(f"Bad Karana ({karana.get('name','')}) — Bhadra")
    else:
        score += 5

    quality = "Excellent" if score >= 70 else "Good" if score >= 50 else "Average" if score >= 30 else "Poor"
    return {"score": max(0, min(100, score)), "quality": quality, "positives": positives, "issues": issues}


class MuhurtaRequest(BaseModel):
    lat: float; lon: float; tz: float
    start_year: int; start_month: int; start_day: int
    end_year: int; end_month: int; end_day: int
    purpose: str = "general"  # marriage/travel/business/education/medical/construction/general
    ayanamsa: str = "lahiri"


@router.post("/muhurta")
def find_muhurta(req: MuhurtaRequest):
    from datetime import date, timedelta

    swe.set_sid_mode(swe.SIDM_LAHIRI)
    purpose = req.purpose if req.purpose in PURPOSE_NAKSHATRA else "general"

    start_date = date(req.start_year, req.start_month, req.start_day)
    end_date = date(req.end_year, req.end_month, req.end_day)
    delta = (end_date - start_date).days + 1
    if delta > 30:
        end_date = start_date + timedelta(days=30)
        delta = 30

    slots = []

    for day_offset in range(delta):
        current = start_date + timedelta(days=day_offset)
        # Check morning (7am), midday (11am), afternoon (3pm), evening (6pm)
        for hour in [7, 9, 11, 15, 17]:
            jd = swe.julday(current.year, current.month, current.day, hour - req.tz)

            ayan = swe.get_ayanamsa_ut(jd)
            # Sun + Moon positions for panchanga
            sun_r, _ = swe.calc_ut(jd, swe.SUN)
            moon_r, _ = swe.calc_ut(jd, swe.MOON)
            sun_sid = (sun_r[0] - ayan) % 360
            moon_sid = (moon_r[0] - ayan) % 360

            tithi_num, tithi_name, paksha = get_tithi(sun_sid, moon_sid)
            tithi = {"number": tithi_num, "name": tithi_name, "paksha": paksha}
            vara_name, vara_lord = get_vara(jd, req.tz)
            vara = {"day": vara_name, "lord": vara_lord}
            nak_name, nak_lord, nak_idx, pada = get_nakshatra_pada(moon_sid)
            nak_data = {"nakshatra": nak_name, "lord": nak_lord, "pada": pada}
            yoga_name, yoga_inauspicious = get_yoga(sun_sid, moon_sid)
            yoga = {"name": yoga_name, "inauspicious": yoga_inauspicious}
            karana_name, karana_inauspicious = get_karana(sun_sid, moon_sid)
            karana = {"name": karana_name, "inauspicious": karana_inauspicious}

            nakshatra_name = nak_name
            assessment = score_slot(tithi, vara, nakshatra_name, yoga, karana, purpose)

            slots.append({
                "date": current.isoformat(),
                "time": f"{hour:02d}:00",
                "datetime": f"{current.isoformat()} {hour:02d}:00",
                "tithi": tithi,
                "vara": vara,
                "nakshatra": nak_data,
                "yoga": yoga,
                "karana": karana,
                **assessment,
            })

    # Sort by score descending
    slots.sort(key=lambda x: x["score"], reverse=True)

    best = slots[:5]
    all_slots = sorted(slots, key=lambda x: x["datetime"])

    return {
        "purpose": purpose,
        "best_muhurtas": best,
        "all_slots": all_slots,
        "total_checked": len(slots),
    }
