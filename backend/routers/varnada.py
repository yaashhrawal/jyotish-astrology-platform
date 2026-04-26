"""
Varnada Lagna — Jaimini longevity and timing technique.
Derived from Hora Lagna and Lagna.
Used for longevity determination and timing of important life events.

Method (Jaimini Sutras 1.1.28-31):
- Count from Aries to Lagna (day birth) or Lagna to Aries (night birth) in rasi order
- Count from Aries to Hora Lagna (day) or Hora Lagna to Aries (night)
- Add both counts → that many signs from Aries = Varnada
- If sum > 12, subtract 12
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS
import swisseph as swe

router = APIRouter(tags=["varnada"])

SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

ODD_SIGNS = {"Aries", "Gemini", "Leo", "Libra", "Sagittarius", "Aquarius"}

# Varnada lord house → longevity type
LONGEVITY_TYPE = {
    "strong": "Purna Ayu (Long Life) — above 70-100 years",
    "medium": "Madhya Ayu (Medium Life) — 36-70 years",
    "short":  "Alpa Ayu (Short Life) — below 36 years",
}

# VL sign → life theme
VL_SIGN_THEMES = {
    "Aries":       {"theme": "Life of action, courage, pioneering; physical vitality is key to longevity", "quality": "active"},
    "Taurus":      {"theme": "Life of material accumulation, stability, sensory enjoyment; endurance is strength", "quality": "stable"},
    "Gemini":      {"theme": "Life of intellect, communication, adaptability; mental engagement sustains life", "quality": "dual"},
    "Cancer":      {"theme": "Life of emotional depth, home, family; emotional wellbeing determines vitality", "quality": "nurturing"},
    "Leo":         {"theme": "Life of authority, recognition, leadership; pride and purpose sustain the soul", "quality": "royal"},
    "Virgo":       {"theme": "Life of service, analysis, health consciousness; daily discipline extends life", "quality": "analytical"},
    "Libra":       {"theme": "Life of balance, relationships, beauty; harmonious partnerships sustain life force", "quality": "balanced"},
    "Scorpio":     {"theme": "Life of transformation, secrets, occult; death and regeneration are constants", "quality": "intense"},
    "Sagittarius": {"theme": "Life of philosophy, dharma, travel; expansion of consciousness is the key mission", "quality": "expansive"},
    "Capricorn":   {"theme": "Life of discipline, karma, structured achievement; time itself is the teacher", "quality": "disciplined"},
    "Aquarius":    {"theme": "Life of innovation, humanity, idealism; social mission gives meaning to longevity", "quality": "humanitarian"},
    "Pisces":      {"theme": "Life of spirituality, surrender, compassion; dissolution into divine is the destiny", "quality": "spiritual"},
}

# VL lord strength → longevity assessment
def assess_longevity(vl_lord: str, vl_lord_status: str, vl_lord_house: int,
                     planets_in_vl: list, planets_in_8th_from_vl: list) -> dict:
    score = 50  # base

    # VL lord dignity
    if vl_lord_status == "exalted":           score += 25
    elif vl_lord_status == "own_sign":        score += 20
    elif vl_lord_status == "friend_sign":     score += 10
    elif vl_lord_status == "enemy_sign":      score -= 10
    elif vl_lord_status == "debilitated":     score -= 20

    # VL lord house placement (good: 1,2,4,5,7,9,10,11; bad: 6,8,12)
    if vl_lord_house in (1, 5, 9):    score += 15
    elif vl_lord_house in (4, 7, 10): score += 10
    elif vl_lord_house in (2, 11):    score += 5
    elif vl_lord_house in (6, 12):    score -= 10
    elif vl_lord_house == 8:          score -= 20

    # 8th from VL: 8H is maraka from VL; malefics here reduce longevity
    mal_in_8th = [p for p in planets_in_8th_from_vl if p in {"Saturn", "Mars", "Rahu", "Ketu"}]
    score -= len(mal_in_8th) * 10

    # Benefics in VL enhance
    ben_in_vl = [p for p in planets_in_vl if p in {"Jupiter", "Venus", "Moon", "Mercury"}]
    score += len(ben_in_vl) * 8

    score = max(0, min(100, score))

    if score >= 65:
        longevity = "Purna Ayu (Long Life)"
        span = "70-100+ years"
    elif score >= 40:
        longevity = "Madhya Ayu (Medium Life)"
        span = "36-70 years"
    else:
        longevity = "Alpa Ayu (Short Life)"
        span = "Below 36 years"

    return {"score": score, "longevity": longevity, "span": span}


class VarnadaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/varnada")
def get_varnada(req: VarnadaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc.get("sign_index", SIGNS.index(asc["sign"]) if asc.get("sign") in SIGNS else 0)

    for name, pd in planets.items():
        if "sign_index" not in pd and pd.get("sign") in SIGNS:
            pd["sign_index"] = SIGNS.index(pd["sign"])

    # Compute Hora Lagna (approximate: ascends 1 sign/hour from sunrise)
    try:
        r = swe.rise_trans(jd - 0.5, swe.SUN, swe.CALC_RISE, (req.longitude, req.latitude, 0), 1013.25, 15)
        sunrise_jd = r[1][0] if r[0] == 0 else jd - 0.25
    except Exception:
        sunrise_jd = jd - 0.25

    hours_from_sunrise = max(0, (jd - sunrise_jd) * 24)
    hl_idx = (asc_idx + int(hours_from_sunrise)) % 12
    hora_lagna_sign = SIGNS[hl_idx]

    # Determine day/night birth
    sun_long = planets.get("Sun", {}).get("longitude", 0)
    sun_above_horizon = (hours_from_sunrise < 12)  # rough: day if within 12hrs of sunrise

    # Varnada computation (Jaimini method)
    # Day birth: count Aries→Lagna + Aries→HL; Night: count Lagna→Aries + HL→Aries
    aries_idx = 0  # Aries = 0

    if sun_above_horizon:
        count_lagna = (asc_idx - aries_idx) % 12 + 1
        count_hl = (hl_idx - aries_idx) % 12 + 1
    else:
        count_lagna = (aries_idx - asc_idx) % 12 + 1
        count_hl = (aries_idx - hl_idx) % 12 + 1

    total = count_lagna + count_hl
    vl_idx = (total - 1) % 12  # convert to 0-based
    vl_sign = SIGNS[vl_idx]
    vl_house = (vl_idx - asc_idx) % 12 + 1

    vl_lord = SIGN_LORDS[vl_sign]
    vl_lord_data = planets.get(vl_lord, {})
    vl_lord_sign_idx = vl_lord_data.get("sign_index", 0)
    vl_lord_house = (vl_lord_sign_idx - asc_idx) % 12 + 1
    vl_lord_status = vl_lord_data.get("status", "neutral")

    # Planets in Varnada
    planets_in_vl = [n for n, pd in planets.items() if pd.get("sign_index") == vl_idx]

    # 8th from Varnada (maraka)
    eighth_from_vl_idx = (vl_idx + 7) % 12
    planets_in_8th = [n for n, pd in planets.items() if pd.get("sign_index") == eighth_from_vl_idx]

    # Longevity assessment
    longevity = assess_longevity(vl_lord, vl_lord_status, vl_lord_house, planets_in_vl, planets_in_8th)

    # Varnada periods for timing (each sign = 1/12 of life span in medium ayu ≈ 53yr)
    # Mahadasha of Varnada: each sign lord rules for period = total years / 12
    # Simplified: use 7-year periods from Varnada sign sequence
    varnada_periods = []
    for i in range(12):
        si = (vl_idx + i) % 12
        varnada_periods.append({
            "period": i + 1,
            "sign": SIGNS[si],
            "lord": SIGN_LORDS[SIGNS[si]],
            "age_range": f"{i * 7}–{(i + 1) * 7}",
            "theme": VL_SIGN_THEMES.get(SIGNS[si], {}).get("theme", ""),
        })

    return {
        "varnada_lagna": {
            "sign": vl_sign,
            "sign_index": vl_idx,
            "house_in_d1": vl_house,
            "lord": vl_lord,
        },
        "computation": {
            "day_birth": sun_above_horizon,
            "hours_from_sunrise": round(hours_from_sunrise, 2),
            "count_lagna": count_lagna,
            "count_hl": count_hl,
            "total": total,
        },
        "hora_lagna": {"sign": hora_lagna_sign, "sign_index": hl_idx},
        "vl_lord_analysis": {
            "planet": vl_lord,
            "sign": vl_lord_data.get("sign", ""),
            "house": vl_lord_house,
            "status": vl_lord_status,
        },
        "planets_in_vl": planets_in_vl,
        "eighth_from_vl": {
            "sign": SIGNS[eighth_from_vl_idx],
            "planets": planets_in_8th,
        },
        "longevity": longevity,
        "vl_theme": VL_SIGN_THEMES.get(vl_sign, {}),
        "varnada_periods": varnada_periods,
        "ascendant": asc,
    }
