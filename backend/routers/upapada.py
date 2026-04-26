"""
Upapada Lagna (UL) — Deep analysis for marriage/partnership timing.
UL = Arudha of 12th house. Classical source: Jaimini Sutras, BPHS Ch. 80-81.

Key analysis:
- UL sign and lord → nature of spouse/marriage
- Planets in UL → quality and character of marriage
- 2nd from UL (Gaunapada) → longevity and quality of marriage
- 7th from UL → separation/divorce indicators
- UL lord placement → spouse characteristics and marriage events
- Darakaraka + UL combined reading
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter(tags=["upapada"])

SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

MALEFICS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}
BENEFICS = {"Jupiter", "Venus", "Moon", "Mercury"}

# UL sign → nature of marriage/spouse
UL_SIGN_READINGS = {
    "Aries":       {"spouse_nature": "Energetic, independent, ambitious, possibly athletic", "marriage": "Dynamic, passionate but prone to conflicts; spouse may be impulsive", "quality": "active"},
    "Taurus":      {"spouse_nature": "Stable, sensual, artistic, materially inclined", "marriage": "Comfortable, enduring, value-based; spouse focused on security and pleasure", "quality": "stable"},
    "Gemini":      {"spouse_nature": "Intellectual, communicative, adaptable, possibly dual-minded", "marriage": "Mentally stimulating; needs constant communication; possible two marriages", "quality": "dual"},
    "Cancer":      {"spouse_nature": "Nurturing, emotional, family-oriented, intuitive", "marriage": "Deep emotional bond, home-centric; strong maternal qualities in spouse", "quality": "nurturing"},
    "Leo":         {"spouse_nature": "Proud, creative, authoritative, generous", "marriage": "Dignified, status-conscious; spouse from good family or with leadership qualities", "quality": "royal"},
    "Virgo":       {"spouse_nature": "Analytical, health-conscious, service-oriented, detail-minded", "marriage": "Practical; possible age difference; spouse may be in healing or service field", "quality": "practical"},
    "Libra":       {"spouse_nature": "Charming, fair-minded, artistic, relationship-focused", "marriage": "Harmonious, beautiful partnership; spouse naturally diplomatic and attractive", "quality": "harmonious"},
    "Scorpio":     {"spouse_nature": "Intense, secretive, passionate, transformative", "marriage": "Deep, transformative bond; intense karma with spouse; possible power struggles", "quality": "intense"},
    "Sagittarius": {"spouse_nature": "Philosophical, adventurous, dharmic, educated", "marriage": "Freedom-oriented; spouse from different culture/religion; higher learning valued", "quality": "philosophical"},
    "Capricorn":   {"spouse_nature": "Disciplined, traditional, career-focused, older-seeming", "marriage": "Late marriage possible; practical, duty-based; spouse may be older or senior", "quality": "traditional"},
    "Aquarius":    {"spouse_nature": "Unconventional, humanitarian, intellectual, unique", "marriage": "Unusual union; friendship-based marriage; non-traditional approach to partnership", "quality": "unconventional"},
    "Pisces":      {"spouse_nature": "Spiritual, compassionate, artistic, dreamy", "marriage": "Spiritually inclined union; artistic or spiritual spouse; compassionate bond", "quality": "spiritual"},
}

# Planet in UL — effect on marriage (classical Jaimini readings)
PLANET_IN_UL = {
    "Sun":     {"effect": "negative", "reading": "Sun in UL — domineering spouse or ego conflicts; marriage may face authority issues. Spouse may be proud or from royal/government family."},
    "Moon":    {"effect": "positive", "reading": "Moon in UL — emotionally supportive, nurturing marriage. Spouse is caring and family-oriented. Strong mother-like bond."},
    "Mars":    {"effect": "negative", "reading": "Mars in UL — passionate but conflict-prone marriage. Risk of separation if Mars is afflicted. Spouse is energetic, possibly aggressive."},
    "Mercury": {"effect": "positive", "reading": "Mercury in UL — intellectual partnership; good communication. Spouse is educated, witty, younger-appearing. Multiple partnerships possible."},
    "Jupiter": {"effect": "positive", "reading": "Jupiter in UL — blessed marriage; wise, dharmic spouse. Generally indicates a happy, long-lasting union. Divine grace on marriage."},
    "Venus":   {"effect": "positive", "reading": "Venus in UL — beautiful, loving, romantic marriage. Spouse is charming and artistic. Strong physical attraction. Excellent for marriage."},
    "Saturn":  {"effect": "negative", "reading": "Saturn in UL — delayed marriage, karmic burden. Spouse may be older, cold, or have health issues. Long-lasting if endured."},
    "Rahu":    {"effect": "negative", "reading": "Rahu in UL — unconventional or inter-caste/foreign marriage. Illusions around spouse; possible deception or unusual circumstances."},
    "Ketu":    {"effect": "negative", "reading": "Ketu in UL — past-life karma in marriage; spiritually intense. Possible separation or lack of attachment. Renunciation of marriage possible."},
}

# 2nd from UL (Gaunapada) — quality of marriage
GAUNAPADA_READINGS = {
    "benefic_planets": "Benefics in 2nd from UL → stable, prosperous marriage; good family life post-marriage",
    "malefic_planets": "Malefics in 2nd from UL → instability, challenges in sustaining marriage; possible loss",
    "empty":           "No planets in 2nd from UL → marriage quality depends primarily on UL lord",
}

# 7th from UL — separation/divorce
SEVENTH_UL_READINGS = {
    "malefic":  "Malefics in 7th from UL → significant risk of separation, divorce, or spouse's health issues",
    "benefic":  "Benefics in 7th from UL → marriage endures; partner regenerates the bond",
    "rahu_ketu":"Rahu/Ketu in 7th from UL → sudden separation, foreign spouse, karmic dissolution of marriage",
    "empty":    "No planets in 7th from UL → separation risk depends on other factors",
}

# UL lord in D1 house → marriage timing indicators
UL_LORD_IN_HOUSE = {
    1:  "UL lord in lagna — spouse integrates with self; strong mutual identification; early marriage",
    2:  "UL lord in 2H — marriage brings wealth; family connection to spouse; financial partnership",
    3:  "UL lord in 3H — spouse from nearby locality; courageous partner; possible sibling connection",
    4:  "UL lord in 4H — domestic, home-centered marriage; close to mother's qualities; property gain",
    5:  "UL lord in 5H — love marriage possible; spouse is creative/intellectual; children are focus",
    6:  "UL lord in 6H — delays or obstacles in marriage; service-oriented spouse; health matters",
    7:  "UL lord in 7H — excellent for marriage; partner is dharmic and complementary",
    8:  "UL lord in 8H — sudden/secret marriage possible; transformative union; inheritance from spouse",
    9:  "UL lord in 9H — higher learning connection; foreign or guru-like spouse; dharmic union",
    10: "UL lord in 10H — career-focused spouse; marriage elevates social status; public partnership",
    11: "UL lord in 11H — marriage brings gains and fulfillment; spouse connected to aspirations",
    12: "UL lord in 12H — foreign spouse possible; spiritual marriage; possible separation or delays",
}


def compute_arudha(house_num: int, asc_sign_idx: int, planets: dict) -> int:
    house_sign_idx = (asc_sign_idx + house_num - 1) % 12
    house_sign = SIGNS[house_sign_idx]
    lord_name = SIGN_LORDS[house_sign]
    lord_data = planets.get(lord_name)
    if not lord_data:
        return house_sign_idx

    lord_sign_idx = lord_data.get("sign_index", SIGNS.index(lord_data["sign"]) if lord_data.get("sign") in SIGNS else 0)
    signs_from_house = (lord_sign_idx - house_sign_idx) % 12 or 12
    arudha_idx = (lord_sign_idx + signs_from_house - 1) % 12

    if arudha_idx == house_sign_idx or arudha_idx == (house_sign_idx + 6) % 12:
        arudha_idx = (arudha_idx + 9) % 12

    return arudha_idx


class UpapadaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/upapada_analysis")
def get_upapada_analysis(req: UpapadaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_idx = asc.get("sign_index", SIGNS.index(asc["sign"]) if asc.get("sign") in SIGNS else 0)

    for name, pd in planets.items():
        if "sign_index" not in pd and pd.get("sign") in SIGNS:
            pd["sign_index"] = SIGNS.index(pd["sign"])

    # Upapada Lagna = Arudha of 12H
    ul_idx = compute_arudha(12, asc_idx, planets)
    ul_sign = SIGNS[ul_idx]
    ul_house_in_d1 = (ul_idx - asc_idx) % 12 + 1
    ul_lord = SIGN_LORDS[ul_sign]

    # 2nd from UL (Gaunapada)
    gaunapada_idx = (ul_idx + 1) % 12
    gaunapada_sign = SIGNS[gaunapada_idx]

    # 7th from UL
    seventh_from_ul_idx = (ul_idx + 6) % 12
    seventh_from_ul_sign = SIGNS[seventh_from_ul_idx]

    # Planets in UL, 2nd from UL, 7th from UL
    def planets_in_sign(sign_idx: int) -> list:
        return [n for n, pd in planets.items() if pd.get("sign_index", -1) == sign_idx]

    ul_planets = planets_in_sign(ul_idx)
    gaunapada_planets = planets_in_sign(gaunapada_idx)
    seventh_ul_planets = planets_in_sign(seventh_from_ul_idx)

    # UL lord position
    ul_lord_data = planets.get(ul_lord, {})
    ul_lord_sign_idx = ul_lord_data.get("sign_index", 0)
    ul_lord_house = (ul_lord_sign_idx - asc_idx) % 12 + 1
    ul_lord_sign = ul_lord_data.get("sign", "")
    ul_lord_status = ul_lord_data.get("status", "neutral")

    # Darakaraka (7th karaka in Jaimini — lowest degree planet)
    graha_order = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    ranked = sorted(graha_order, key=lambda g: planets[g]["degree"], reverse=True)
    darakaraka = ranked[6]["planet"] if False else ranked[-1]  # DK = lowest degree

    # Analyze planets in UL
    ul_planet_readings = []
    for p in ul_planets:
        reading = PLANET_IN_UL.get(p, {"effect": "neutral", "reading": f"{p} in UL — mixed results"})
        ul_planet_readings.append({"planet": p, **reading})

    # Gaunapada analysis
    gauna_mal = [p for p in gaunapada_planets if p in MALEFICS]
    gauna_ben = [p for p in gaunapada_planets if p in BENEFICS]
    if not gaunapada_planets:
        gauna_reading = GAUNAPADA_READINGS["empty"]
    elif len(gauna_ben) >= len(gauna_mal):
        gauna_reading = GAUNAPADA_READINGS["benefic_planets"]
    else:
        gauna_reading = GAUNAPADA_READINGS["malefic_planets"]

    # 7th from UL analysis
    seventh_mal = [p for p in seventh_ul_planets if p in MALEFICS]
    seventh_ben = [p for p in seventh_ul_planets if p in BENEFICS]
    rahu_ketu_in_7th = [p for p in seventh_ul_planets if p in {"Rahu", "Ketu"}]

    if rahu_ketu_in_7th:
        seventh_reading = SEVENTH_UL_READINGS["rahu_ketu"]
        separation_risk = "high"
    elif seventh_mal:
        seventh_reading = SEVENTH_UL_READINGS["malefic"]
        separation_risk = "moderate"
    elif seventh_ben:
        seventh_reading = SEVENTH_UL_READINGS["benefic"]
        separation_risk = "low"
    else:
        seventh_reading = SEVENTH_UL_READINGS["empty"]
        separation_risk = "low"

    # UL lord reading
    ul_lord_house_reading = UL_LORD_IN_HOUSE.get(ul_lord_house, "")

    # Overall marriage quality score (0-100)
    score = 50  # base
    for p in ul_planets:
        if p in BENEFICS: score += 15
        if p in MALEFICS: score -= 10
    if ul_lord_status == "exalted": score += 20
    elif ul_lord_status == "own_sign": score += 15
    elif ul_lord_status == "debilitated": score -= 15
    elif ul_lord_status == "enemy_sign": score -= 10
    if len(gauna_ben) > len(gauna_mal): score += 10
    if len(seventh_mal) > 0: score -= 10
    if rahu_ketu_in_7th: score -= 15
    score = max(0, min(100, score))

    return {
        "upapada_lagna": {
            "sign": ul_sign,
            "sign_index": ul_idx,
            "house_in_d1": ul_house_in_d1,
            "lord": ul_lord,
            "planets_in_ul": ul_planets,
        },
        "ul_sign_interpretation": UL_SIGN_READINGS.get(ul_sign, {}),
        "ul_planet_readings": ul_planet_readings,
        "ul_lord_analysis": {
            "planet": ul_lord,
            "sign": ul_lord_sign,
            "house": ul_lord_house,
            "status": ul_lord_status,
            "reading": ul_lord_house_reading,
        },
        "gaunapada": {
            "sign": gaunapada_sign,
            "sign_index": gaunapada_idx,
            "planets": gaunapada_planets,
            "reading": gauna_reading,
        },
        "seventh_from_ul": {
            "sign": seventh_from_ul_sign,
            "sign_index": seventh_from_ul_idx,
            "planets": seventh_ul_planets,
            "reading": seventh_reading,
            "separation_risk": separation_risk,
        },
        "darakaraka": darakaraka,
        "marriage_quality_score": score,
        "ascendant": asc,
    }
