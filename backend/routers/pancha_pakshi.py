"""
Pancha Pakshi (Five Birds) — South Indian predictive system.
5 birds govern 5 daily time slots; activities (Ruling/Eating/Walking/Sleeping/Dying)
cycle through each slot. Ruling bird = most powerful; Dying = worst.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, get_ayanamsa
import swisseph as swe
from core.engine import EPHE_FLAG
from datetime import datetime, timezone

router = APIRouter()

BIRDS = ["Vulture", "Owl", "Crow", "Cock", "Peacock"]
ACTIVITIES = ["Ruling", "Eating", "Walking", "Sleeping", "Dying"]

# Weekday ruling bird (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
# Shukla paksha (waxing): Sun→Vulture, Mon→Owl, Tue→Crow, Wed→Cock, Thu→Peacock, Fri→Vulture, Sat→Owl
# Krishna paksha (waning): reversed assignment
WEEKDAY_BIRD_SHUKLA  = [0, 1, 2, 3, 4, 0, 1]  # index into BIRDS
WEEKDAY_BIRD_KRISHNA = [4, 3, 2, 1, 0, 4, 3]

# Bird planetary rulers
BIRD_PLANET = {
    "Vulture": "Sun", "Owl": "Moon", "Crow": "Mars",
    "Cock": "Mercury", "Peacock": "Venus"
}

# Activity descriptions
ACTIVITY_DESC = {
    "Ruling":   "Peak power — start important work now",
    "Eating":   "Active but distracted — routine tasks OK",
    "Walking":  "Transition — moderate results",
    "Sleeping": "Dormant — avoid new beginnings",
    "Dying":    "Weakest point — avoid critical decisions",
}

# Birth nakshatra → birth bird mapping
# Nakshatras 1-5 → Vulture, 6-10 → Owl, 11-15 → Crow, 16-20 → Cock, 21-27 → Peacock (cycling)
def nak_to_bird(nak_idx: int) -> str:
    return BIRDS[nak_idx % 5]


def get_day_bird(weekday: int, is_shukla: bool) -> str:
    idx = WEEKDAY_BIRD_SHUKLA[weekday] if is_shukla else WEEKDAY_BIRD_KRISHNA[weekday]
    return BIRDS[idx]


def get_activity_sequence(bird: str, slot: int) -> str:
    """Returns activity for given bird at given time slot (0-4)."""
    bird_idx = BIRDS.index(bird)
    return ACTIVITIES[(bird_idx + slot) % 5]


def get_current_slot(hour: int) -> int:
    """Divides day into 5 equal slots of ~4.8 hours each."""
    return min(int(hour / (24 / 5)), 4)


class PanchaPakshiRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/pancha_pakshi")
def compute_pancha_pakshi(req: PanchaPakshiRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)

    # Moon nakshatra at birth
    moon_lon = planets["Moon"]["longitude"]
    birth_nak_idx = int(moon_lon / (360 / 27))
    birth_bird = nak_to_bird(birth_nak_idx)

    # Tithi (waxing/waning) for query time
    ayan = get_ayanamsa(jd, req.ayanamsa)
    sun_r, _ = swe.calc_ut(jd, swe.SUN, EPHE_FLAG)
    moon_r, _ = swe.calc_ut(jd, swe.MOON, EPHE_FLAG)
    sun_sid = (sun_r[0] - ayan) % 360
    moon_sid = (moon_r[0] - ayan) % 360
    diff = (moon_sid - sun_sid) % 360
    tithi_num = int(diff / 12) + 1
    is_shukla = tithi_num <= 15

    # Weekday from JD
    local_jd = jd + req.tz_offset / 24.0
    weekday = int(local_jd + 1.5) % 7  # 0=Sun

    day_bird = get_day_bird(weekday, is_shukla)
    current_hour = req.hour
    current_slot = get_current_slot(current_hour)

    # Build 5-slot schedule for today
    slots = []
    slot_hours = 24 / 5
    for i in range(5):
        start_h = i * slot_hours
        end_h = (i + 1) * slot_hours
        activity = get_activity_sequence(day_bird, i)
        birth_activity = get_activity_sequence(birth_bird, i)
        # Combined strength: both ruling = very strong; both dying = very weak
        combined = "Excellent" if activity == "Ruling" and birth_activity == "Ruling" \
            else "Very Poor" if activity == "Dying" and birth_activity == "Dying" \
            else activity
        slots.append({
            "slot": i + 1,
            "time_range": f"{int(start_h):02d}:00–{int(end_h):02d}:00",
            "day_bird_activity": activity,
            "birth_bird_activity": birth_activity,
            "combined_verdict": combined,
            "is_current": i == current_slot,
            "power_score": 5 - ACTIVITIES.index(activity),  # Ruling=5, Dying=1
        })

    current_activity = get_activity_sequence(day_bird, current_slot)
    birth_activity_now = get_activity_sequence(birth_bird, current_slot)

    return {
        "birth_bird": birth_bird,
        "birth_bird_planet": BIRD_PLANET[birth_bird],
        "birth_nak_index": birth_nak_idx,
        "day_bird": day_bird,
        "day_bird_planet": BIRD_PLANET[day_bird],
        "paksha": "Shukla" if is_shukla else "Krishna",
        "weekday": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][weekday],
        "current_slot": current_slot + 1,
        "current_day_activity": current_activity,
        "current_birth_activity": birth_activity_now,
        "current_verdict": ACTIVITY_DESC[current_activity],
        "slots": slots,
        "birds_info": [{"bird": b, "planet": BIRD_PLANET[b], "activities": ACTIVITIES} for b in BIRDS],
    }
