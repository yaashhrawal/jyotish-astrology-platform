"""
Prashna Kundali (Horary Astrology) Engine
Based on: Prashna Marga, Brihat Prashna Sarita, KP system
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import os

from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, SIGN_LORDS, SIGNS, AYANAMSA_MAP
)

router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────

BENEFICS = {'Jupiter', 'Venus', 'Mercury', 'Moon'}
MALEFICS = {'Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'}

NAKSHATRA_LORDS_SEQ = [
    'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'
] * 3  # 27 nakshatras

NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu",
    "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta",
    "Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha",
    "Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada",
    "Uttara Bhadrapada","Revati"
]

# KP / Hora
HORA_ORDER = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars']
# weekday (Mon=0) → first hora lord
FIRST_HORA = {6:'Sun', 0:'Moon', 1:'Mars', 2:'Mercury', 3:'Jupiter', 4:'Venus', 5:'Saturn'}

# Gulika: weekday → which day portion (1-8, each = 1.5 hours after sunrise)
GULIKA_DAY_PART = {6: 6, 0: 4, 1: 2, 2: 7, 3: 5, 4: 3, 5: 1}  # day birth
GULIKA_NIGHT_PART = {6: 7, 0: 5, 1: 3, 2: 8, 3: 6, 4: 4, 5: 2}

# Question category → relevant houses
QUESTION_HOUSES = {
    'career':       {'primary': [10, 11], 'secondary': [6, 2],  'enemy': [12]},
    'marriage':     {'primary': [7, 2],   'secondary': [5, 11], 'enemy': [6]},
    'health':       {'primary': [1, 6],   'secondary': [8],     'enemy': [12]},
    'lost_item':    {'primary': [2, 4],   'secondary': [7],     'enemy': []},
    'children':     {'primary': [5],      'secondary': [9, 1],  'enemy': [12]},
    'legal':        {'primary': [7, 6],   'secondary': [10],    'enemy': [12]},
    'travel':       {'primary': [3, 9],   'secondary': [12],    'enemy': [8]},
    'property':     {'primary': [4],      'secondary': [11],    'enemy': [12]},
    'finance':      {'primary': [2, 11],  'secondary': [5, 9],  'enemy': [8, 12]},
    'education':    {'primary': [4, 9],   'secondary': [5],     'enemy': [12]},
    'spiritual':    {'primary': [9, 12],  'secondary': [5, 1],  'enemy': []},
    'spirituality': {'primary': [9, 12],  'secondary': [5, 1],  'enemy': []},
    'general':      {'primary': [1, 10],  'secondary': [5, 9],  'enemy': []},
}

CATEGORY_LABELS = {
    'career': 'Career & Job', 'marriage': 'Marriage & Relationship',
    'health': 'Health', 'lost_item': 'Lost Item',
    'children': 'Children', 'legal': 'Legal Matter',
    'travel': 'Travel', 'property': 'Property & Home',
    'finance': 'Finance & Wealth', 'education': 'Education',
    'spiritual': 'Spiritual & Dharma', 'general': 'General Query',
}


# ── Calculations ──────────────────────────────────────────────────────────────

def get_hora_lord(dt: datetime) -> str:
    weekday = dt.weekday()
    first_idx = HORA_ORDER.index(FIRST_HORA[weekday])
    hours_since_sunrise = (dt.hour - 6) % 24
    return HORA_ORDER[(first_idx + int(hours_since_sunrise)) % 7]


def get_vara_lord(dt: datetime) -> str:
    day_lords = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun']
    return day_lords[dt.weekday()]


def get_tithi(planets: dict) -> dict:
    moon_lon = planets.get('Moon', {}).get('longitude', 0)
    sun_lon = planets.get('Sun', {}).get('longitude', 0)
    diff = (moon_lon - sun_lon) % 360
    tithi_num = int(diff / 12) + 1

    TITHI_NAMES = [
        'Pratipada','Dvitiya','Tritiya','Chaturthi','Panchami',
        'Shashthi','Saptami','Ashtami','Navami','Dashami',
        'Ekadashi','Dvadashi','Trayodashi','Chaturdashi',
        'Purnima' if diff < 180 else 'Amavasya'
    ]
    paksha = 'Shukla' if diff < 180 else 'Krishna'
    idx = min(tithi_num - 1, 14)
    return {
        'number': tithi_num,
        'name': TITHI_NAMES[idx],
        'paksha': paksha,
        'paksha_num': tithi_num if diff < 180 else tithi_num - 15,
    }


def get_gulika(jd: float, lat: float, lon: float, ayanamsa: str, is_day: bool) -> dict:
    """Calculate Gulika (Mandi) position."""
    import swisseph as swe

    dt_utc = datetime(2000, 1, 1, tzinfo=timezone.utc) + timedelta(days=jd - 2451545.0)
    weekday = dt_utc.weekday()

    parts = GULIKA_DAY_PART if is_day else GULIKA_NIGHT_PART
    portion = parts.get(weekday, 6)

    # Approximate sunrise 6 AM local; each portion = 90 min
    tz_offset = lon / 15
    local_sunrise = dt_utc.replace(
        hour=6, minute=0, second=0
    ) - timedelta(hours=tz_offset)

    gulika_dt = local_sunrise + timedelta(minutes=(portion - 1) * 90)
    gulika_jd = 2451545.0 + (gulika_dt - datetime(2000, 1, 1, tzinfo=timezone.utc)).total_seconds() / 86400

    swe.set_sid_mode(AYANAMSA_MAP.get(ayanamsa, swe.SIDM_LAHIRI))
    try:
        cusps, ascmc = swe.houses(gulika_jd, lat, lon, b'P')
        ayanamsa_val = swe.get_ayanamsa(gulika_jd)
        gulika_lon = (ascmc[0] - ayanamsa_val) % 360
    except Exception:
        gulika_lon = 0

    sign_idx = int(gulika_lon / 30)
    nak_idx = int(gulika_lon / (360 / 27))
    return {
        'longitude': round(gulika_lon, 4),
        'sign': SIGNS[sign_idx],
        'sign_index': sign_idx,
        'degree': round(gulika_lon % 30, 4),
        'nakshatra': NAKSHATRAS[nak_idx % 27],
        'house': None,
    }


def get_pranapada(planets: dict, is_day: bool) -> dict:
    """
    Pranapada Lagna = life-force point of the query.
    Classical: Sun's longitude + 3 signs (day birth) or - 3 signs (night).
    """
    sun_lon = planets.get('Sun', {}).get('longitude', 0)
    offset = 90 if is_day else -90
    pp_lon = (sun_lon + offset) % 360
    sign_idx = int(pp_lon / 30)
    nak_idx = int(pp_lon / (360 / 27))
    return {
        'longitude': round(pp_lon, 4),
        'sign': SIGNS[sign_idx],
        'sign_index': sign_idx,
        'degree': round(pp_lon % 30, 4),
        'nakshatra': NAKSHATRAS[nak_idx % 27],
    }


def get_moon_analysis(planets: dict) -> dict:
    """
    Moon application/separation — the core Prashna yes/no indicator.
    Applying to benefic = favorable; malefic = caution.
    Void of course = nothing will happen.
    """
    moon = planets.get('Moon', {})
    moon_lon = moon.get('longitude', 0)
    sun_lon = planets.get('Sun', {}).get('longitude', 0)
    moon_speed = abs(moon.get('speed', 13.17))

    # Waxing if Moon ahead of Sun (diff 0-180)
    diff_sun = (moon_lon - sun_lon) % 360
    is_waxing = diff_sun < 180

    # Combust check: within 12° of Sun
    sun_diff = min((moon_lon - sun_lon) % 360, (sun_lon - moon_lon) % 360)
    is_combust = sun_diff < 12

    applying_to = []
    separating_from = []

    for name, p in planets.items():
        if name in ('Moon', 'Rahu', 'Ketu'):
            continue
        p_lon = p.get('longitude', 0)

        # Applying: planet is ahead of Moon within 15°
        ahead = (p_lon - moon_lon) % 360
        if ahead < 15:
            days = round(ahead / moon_speed, 1)
            applying_to.append({
                'planet': name, 'diff': round(ahead, 2),
                'days_to_meet': days,
                'nature': 'benefic' if name in BENEFICS else 'malefic',
            })

        # Separating: Moon recently passed this planet (within 10°)
        behind = (moon_lon - p_lon) % 360
        if behind < 10:
            separating_from.append({
                'planet': name, 'diff': round(behind, 2),
                'nature': 'benefic' if name in BENEFICS else 'malefic',
            })

    applying_to.sort(key=lambda x: x['diff'])
    separating_from.sort(key=lambda x: x['diff'])

    # Void of course: no applying aspects before Moon changes sign
    degrees_to_sign_end = 30 - (moon_lon % 30)
    void_of_course = len(applying_to) == 0 or (
        applying_to and applying_to[0]['diff'] > degrees_to_sign_end
    )

    return {
        'is_waxing': is_waxing,
        'is_combust': is_combust,
        'void_of_course': void_of_course,
        'degrees_to_sign_end': round(degrees_to_sign_end, 2),
        'applying_to': applying_to[:3],
        'separating_from': separating_from[:2],
        'sign': moon.get('sign', ''),
        'nakshatra': moon.get('nakshatra', ''),
        'degree': round(moon.get('degree', 0), 2),
    }


def get_kp_ruling_planets(planets: dict, asc: dict, dt: datetime) -> list:
    """
    KP Ruling Planets at moment of question.
    5 ruling planets determine the signification of the query.
    """
    results = []

    # 1. Lagna sign lord
    asc_sign = asc.get('sign', '')
    results.append({'rank': 1, 'type': 'Lagna Sign Lord', 'planet': SIGN_LORDS.get(asc_sign, '')})

    # 2. Lagna nakshatra lord
    asc_lon = asc.get('sign_index', 0) * 30 + asc.get('degree', 0)
    nak_idx = int(asc_lon / (360 / 27))
    results.append({'rank': 2, 'type': 'Lagna Nakshatra Lord', 'planet': NAKSHATRA_LORDS_SEQ[nak_idx % 27]})

    # 3. Moon sign lord
    moon = planets.get('Moon', {})
    results.append({'rank': 3, 'type': 'Moon Sign Lord', 'planet': SIGN_LORDS.get(moon.get('sign', ''), '')})

    # 4. Moon nakshatra lord
    results.append({'rank': 4, 'type': 'Moon Nakshatra Lord', 'planet': moon.get('nakshatra_lord', '')})

    # 5. Day (Vara) lord
    day_lords = ['Moon','Mars','Mercury','Jupiter','Venus','Saturn','Sun']
    results.append({'rank': 5, 'type': 'Vara (Day) Lord', 'planet': day_lords[dt.weekday()]})

    return results


def compute_verdict(
    planets: dict, asc: dict, moon_analysis: dict,
    ruling_planets: list, question_category: str,
    gulika: dict, hora_lord: str,
) -> dict:
    """
    Compute a preliminary yes/no tendency using classical Prashna rules.
    Final interpretation via AI; this gives a score.
    """
    score = 0  # +positive, -negative
    signals = []

    # 1. Moon waxing = strength to query
    if moon_analysis['is_waxing']:
        score += 2
        signals.append({'text': 'Moon waxing — query has strength', 'positive': True})
    else:
        score -= 1
        signals.append({'text': 'Moon waning — reduced vitality', 'positive': False})

    # 2. Moon combust = weakened
    if moon_analysis['is_combust']:
        score -= 2
        signals.append({'text': 'Moon combust (near Sun) — confused, obscured', 'positive': False})

    # 3. Void of course = nothing happens
    if moon_analysis['void_of_course']:
        score -= 3
        signals.append({'text': 'Moon void of course — matter unlikely to proceed', 'positive': False})

    # 4. Moon applying to benefic = favorable
    for app in moon_analysis.get('applying_to', []):
        if app['nature'] == 'benefic':
            score += 2
            signals.append({'text': f"Moon applying to {app['planet']} in {app['days_to_meet']}d — favorable outcome forming", 'positive': True})
            break
        else:
            score -= 1
            signals.append({'text': f"Moon applying to {app['planet']} (malefic) — obstacles ahead", 'positive': False})
            break

    # 5. Lagna lord in kendra/trikona = strong query
    house_map = {name: p.get('house') for name, p in planets.items()}
    lagna_lord = SIGN_LORDS.get(asc.get('sign', ''), '')
    ll_house = house_map.get(lagna_lord)
    if ll_house in [1, 4, 7, 10]:
        score += 2
        signals.append({'text': f'Lagna lord {lagna_lord} in kendra — strong, decisive matter', 'positive': True})
    elif ll_house in [1, 5, 9]:
        score += 1
        signals.append({'text': f'Lagna lord {lagna_lord} in trikona — favorable dharma', 'positive': True})
    elif ll_house in [6, 8, 12]:
        score -= 2
        signals.append({'text': f'Lagna lord {lagna_lord} in dusthana (H{ll_house}) — complications', 'positive': False})

    # 6. Hora lord = benefic?
    if hora_lord in BENEFICS:
        score += 1
        signals.append({'text': f'Hora lord {hora_lord} is benefic — auspicious moment for query', 'positive': True})
    else:
        signals.append({'text': f'Hora lord {hora_lord} is malefic — requires caution', 'positive': False})

    # 7. Primary house lord condition
    primary_houses = QUESTION_HOUSES.get(question_category, {}).get('primary', [10])
    from routers.yogas import house_lords
    try:
        hlords = house_lords(asc.get('sign', 'Aries'))
    except (ValueError, KeyError):
        hlords = {}

    for ph in primary_houses[:1]:
        ph_lord = hlords.get(ph, '')
        ph_lord_house = house_map.get(ph_lord)
        if ph_lord_house in [1, 4, 7, 10, 5, 9]:
            score += 2
            signals.append({'text': f'H{ph} lord {ph_lord} well-placed (H{ph_lord_house}) — matter signified positively', 'positive': True})
        elif ph_lord_house in [6, 8, 12]:
            score -= 1
            signals.append({'text': f'H{ph} lord {ph_lord} in dusthana (H{ph_lord_house}) — delays/obstacles', 'positive': False})

    # Determine verdict
    if score >= 4:
        verdict = 'Favorable'
        verdict_color = 'green'
    elif score >= 1:
        verdict = 'Moderately Favorable'
        verdict_color = 'yellow'
    elif score >= -1:
        verdict = 'Mixed / Uncertain'
        verdict_color = 'orange'
    else:
        verdict = 'Unfavorable'
        verdict_color = 'red'

    if moon_analysis['void_of_course']:
        verdict = 'Matter Will Not Proceed'
        verdict_color = 'red'

    # Timeline estimate from Moon's applying aspect
    timeline = None
    if moon_analysis.get('applying_to'):
        days = moon_analysis['applying_to'][0]['days_to_meet']
        if days < 3:
            timeline = 'Within days'
        elif days < 14:
            timeline = f'Within ~{int(days)} days'
        else:
            timeline = 'Several weeks'

    return {
        'verdict': verdict,
        'verdict_color': verdict_color,
        'score': score,
        'signals': signals[:6],
        'timeline': timeline,
    }


# ── New classical factors ─────────────────────────────────────────────────────

NITYA_YOGAS = [
    "Vishkambha","Preeti","Ayushman","Saubhagya","Shobhana","Atiganda",
    "Sukarma","Dhriti","Shoola","Ganda","Vriddhi","Dhruva","Vyaghata",
    "Harshana","Vajra","Siddhi","Vyatipata","Variyan","Parigha","Shiva",
    "Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"
]
INAUSPICIOUS_YOGAS = {0, 5, 8, 9, 12, 14, 16, 18, 26}  # 0-indexed

KARANAS = [
    "Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti",
    "Shakuni","Chatushpada","Naga","Kimstughna"
]
INAUSPICIOUS_KARANAS = {"Vishti"}  # Bhadra

NIMITTA_POSITIVE = [
    'flower','fruit','cow','gold','silver','white','elephant','horse',
    'water','sun','lamp','fire','sandalwood','conch','fish','bride',
    'child','music','singing','rainbow','milk','honey','butter','grass',
    'vedas','blessing','worship','auspicious','good','success','win',
]
NIMITTA_NEGATIVE = [
    'crow','cat','snake','bone','cry','weep','black','broken','fall',
    'dead','donkey','owl','dirty','fight','blood','torn','fire (bad)',
    'widow','coal','ashes','dry','naked','vulture','rat','spider',
    'poison','knife','empty','theft','loss','fail','no','refuse',
]

# Combustion thresholds (degrees from Sun) per planet
COMBUSTION_DEGREES = {
    'Moon': 12, 'Mars': 17, 'Mercury': 14, 'Jupiter': 11,
    'Venus': 10, 'Saturn': 15
}


def get_nitya_yoga(planets: dict) -> dict:
    sun_lon = planets.get('Sun', {}).get('longitude', 0)
    moon_lon = planets.get('Moon', {}).get('longitude', 0)
    combined = (sun_lon + moon_lon) % 360
    idx = int(combined / (360 / 27))
    name = NITYA_YOGAS[idx % 27]
    auspicious = idx not in INAUSPICIOUS_YOGAS
    return {
        'name': name,
        'number': idx + 1,
        'auspicious': auspicious,
        'note': 'Auspicious time quality' if auspicious else f'{name} is inauspicious — delays or obstacles likely',
    }


def get_karana(planets: dict) -> dict:
    moon_lon = planets.get('Moon', {}).get('longitude', 0)
    sun_lon = planets.get('Sun', {}).get('longitude', 0)
    diff = (moon_lon - sun_lon) % 360
    karana_num = int(diff / 6)
    # First 4 are fixed; rest cycle through movable karanas
    if karana_num < 1:
        idx = 10  # Kimstughna
    elif karana_num < 2:
        idx = 0  # Bava
    else:
        idx = (karana_num - 1) % 7
    name = KARANAS[idx % 11]
    auspicious = name not in INAUSPICIOUS_KARANAS
    return {
        'name': name,
        'number': karana_num + 1,
        'auspicious': auspicious,
        'note': 'Vishti/Bhadra — strongly inauspicious, avoid starting new matters' if not auspicious else f'{name} — suitable for the query',
    }


def get_drekkana_analysis(asc_degree: float, asc_sign: str, is_day: bool) -> dict:
    """Drekkana (decanate) of rising degree — classical Prashna indicator."""
    degree_in_sign = asc_degree % 30
    face = int(degree_in_sign / 10) + 1  # 1, 2, or 3

    # Sarpa Drekkana: 2nd drekkana of Cancer, 3rd of Scorpio, 1st of Pisces
    SARPA_DREKKANAS = [('Cancer', 2), ('Scorpio', 3), ('Pisces', 1)]
    is_sarpa = any(asc_sign == s and face == f for s, f in SARPA_DREKKANAS)

    face_notes = {
        1: 'Ascending face — fresh energy, matter is new, querent is motivated',
        2: 'Middle face — matter in progress, moderate energy, needs effort',
        3: 'Declining face — matter nearing conclusion, weakening energy',
    }
    return {
        'face': face,
        'sign': asc_sign,
        'degree': round(degree_in_sign, 2),
        'is_sarpa': is_sarpa,
        'note': 'Sarpa Drekkana rising — complications, deception, or hidden factors per Prashna Marga' if is_sarpa else face_notes[face],
    }


def get_combustion_analysis(planets: dict) -> list:
    """Check all planets for combustion — combust planets lose power in Prashna."""
    sun_lon = planets.get('Sun', {}).get('longitude', 0)
    combust = []
    for name, thresh in COMBUSTION_DEGREES.items():
        p = planets.get(name, {})
        p_lon = p.get('longitude', 0)
        diff = min((p_lon - sun_lon) % 360, (sun_lon - p_lon) % 360)
        if diff < thresh:
            combust.append({
                'planet': name,
                'degrees_from_sun': round(diff, 2),
                'threshold': thresh,
                'effect': f'{name} combust — loses power, significations weakened in this query',
            })
    return combust


def get_planetary_war(planets: dict) -> list:
    """Graha Yuddha — two planets within 1° = war. Lower latitude wins."""
    wars = []
    names = [n for n in planets if n not in ('Rahu', 'Ketu')]
    for i, n1 in enumerate(names):
        for n2 in names[i+1:]:
            p1 = planets[n1]
            p2 = planets[n2]
            diff = abs(p1.get('longitude', 0) - p2.get('longitude', 0))
            if diff > 180:
                diff = 360 - diff
            if diff <= 1.0:
                # Northern latitude wins (simplified: benefic wins)
                winner = n1 if n1 in BENEFICS else n2
                loser = n2 if winner == n1 else n1
                wars.append({
                    'planets': [n1, n2],
                    'winner': winner,
                    'loser': loser,
                    'separation': round(diff, 3),
                    'effect': f'{loser} loses the war — {loser}\'s significations are damaged in this query',
                })
    return wars


def get_arudha_lagna(planets: dict, asc: dict) -> dict:
    """
    Arudha Lagna (AL) — reflection of Lagna lord.
    Count from Lagna to Lagna lord's house, same count from Lagna lord = AL.
    """
    lagna_lord = SIGN_LORDS.get(asc.get('sign', ''), '')
    ll_house = planets.get(lagna_lord, {}).get('house', 1) or 1
    # AL = count from LL house as many steps as LL is from Lagna
    al_house_raw = ((ll_house - 1) + (ll_house - 1)) % 12
    # Exception: if AL falls in 1 or 7 from Lagna, shift by 10
    al_house = al_house_raw + 1
    if al_house == 1:
        al_house = 10
    elif al_house == 7:
        al_house = 4
    asc_sign_idx = asc.get('sign_index', 0)
    al_sign_idx = (asc_sign_idx + al_house - 1) % 12
    return {
        'house': al_house,
        'sign': SIGNS[al_sign_idx],
        'lagna_lord': lagna_lord,
        'll_house': ll_house,
        'note': f'{lagna_lord} in H{ll_house} → Arudha falls in H{al_house} ({SIGNS[al_sign_idx]}) — public image and apparent reality of the matter',
    }


def classify_nimitta(nimitta_text: str) -> dict:
    """Classify nimitta per classical Prashna Marga nimitta-shastra."""
    if not nimitta_text or not nimitta_text.strip():
        return None
    text = nimitta_text.lower()
    pos = sum(2 for w in NIMITTA_POSITIVE if w in text)
    neg = sum(2 for w in NIMITTA_NEGATIVE if w in text)

    # Direction of approach (mentioned in text)
    direction_notes = {
        'east': 'Querent approached from East — auspicious for most queries',
        'north': 'Querent from North — wealth direction, good for finance/property',
        'south': 'Querent from South — Yama\'s direction, caution for health queries',
        'west': 'Querent from West — moderate, travel or change indicated',
    }
    direction = next((d for d in direction_notes if d in text), None)

    if pos > neg + 1:
        verdict = 'auspicious'
        score = min(pos, 6)
        interp = f'Positive nimitta: "{nimitta_text}" — classical texts (Prashna Marga ch.4) indicate favorable outcome. {direction_notes.get(direction, "")}'
    elif neg > pos + 1:
        verdict = 'inauspicious'
        score = -min(neg, 6)
        interp = f'Negative nimitta: "{nimitta_text}" — classical texts warn of obstacles or unfavorable development. {direction_notes.get(direction, "")}'
    else:
        verdict = 'neutral'
        score = 0
        interp = f'Neutral nimitta: "{nimitta_text}" — mixed or indeterminate signs; chart factors dominate. {direction_notes.get(direction, "")}'

    return {
        'text': nimitta_text,
        'verdict': verdict,
        'score': score,
        'interpretation': interp,
        'direction': direction,
    }


def compute_house_analysis(planets: dict, asc: dict, question_category: str) -> dict:
    """
    Full analysis of all relevant houses — lords, occupants, aspects received.
    Per classical Prashna rules from Prashna Marga.
    """
    from routers.yogas import house_lords
    try:
        hlords = house_lords(asc.get('sign', 'Aries'))
    except (ValueError, KeyError):
        hlords = {}
    house_map = {name: p.get('house') for name, p in planets.items()}
    q_houses = QUESTION_HOUSES.get(question_category, QUESTION_HOUSES['general'])
    all_relevant = (
        q_houses.get('primary', []) +
        q_houses.get('secondary', []) +
        q_houses.get('enemy', [])
    )

    result = {}
    for h in all_relevant:
        lord = hlords.get(h, '')
        lord_house = house_map.get(lord)
        occupants = [n for n, p in planets.items() if p.get('house') == h]
        benefic_occ = [p for p in occupants if p in BENEFICS]
        malefic_occ = [p for p in occupants if p in MALEFICS]

        # Strength assessment
        if lord_house in [1, 4, 7, 10]:
            lord_strength = 'strong (kendra)'
        elif lord_house in [5, 9]:
            lord_strength = 'strong (trikona)'
        elif lord_house in [6, 8, 12]:
            lord_strength = 'weak (dusthana)'
        elif lord_house == h:
            lord_strength = 'in own house'
        else:
            lord_strength = 'moderate'

        is_primary = h in q_houses.get('primary', [])
        is_enemy = h in q_houses.get('enemy', [])

        interp_parts = []
        if occupants:
            if benefic_occ:
                interp_parts.append(f'{", ".join(benefic_occ)} placed here — benefic influence')
            if malefic_occ:
                interp_parts.append(f'{", ".join(malefic_occ)} placed here — malefic pressure')
        interp_parts.append(f'Lord {lord} is {lord_strength} (H{lord_house})')
        if is_primary and 'strong' in lord_strength:
            interp_parts.append('Primary house strong — favorable for the matter')
        elif is_primary and 'weak' in lord_strength:
            interp_parts.append('Primary house lord weakened — obstacles likely')
        if is_enemy and malefic_occ:
            interp_parts.append('Enemy house active — complications compound')

        result[str(h)] = {
            'house': h,
            'role': 'Primary' if is_primary else ('Obstacle' if is_enemy else 'Secondary'),
            'lord': lord,
            'lord_house': lord_house,
            'lord_strength': lord_strength,
            'occupants': occupants,
            'strength': 'strong' if 'strong' in lord_strength else ('weak' if 'weak' in lord_strength else 'moderate'),
            'interpretation': '. '.join(interp_parts),
        }
    return result


def compute_vibe_score(
    moon_analysis: dict, verdict: dict, nitya_yoga: dict,
    karana: dict, drekkana: dict, combustion: list, planetary_war: list,
    nimitta: dict, lagna_lord_strength: str, hora_lord: str,
    vara_lord: str, tithi: dict, house_analysis: dict,
) -> dict:
    """
    Composite Prashna Vibe Score 0–100.
    50 = neutral. Above 65 = favorable. Below 35 = unfavorable.
    Based on weighted classical factors.
    """
    score = 50
    breakdown = []

    # Moon (25% weight = ±12.5 pts)
    if moon_analysis['is_waxing']:
        score += 4; breakdown.append({'factor': 'Moon Waxing', 'pts': +4, 'note': 'Shukla paksha — strength'})
    else:
        score -= 3; breakdown.append({'factor': 'Moon Waning', 'pts': -3, 'note': 'Krishna paksha — reduced vitality'})
    if moon_analysis['void_of_course']:
        score -= 10; breakdown.append({'factor': 'Moon Void of Course', 'pts': -10, 'note': 'Matter will not proceed'})
    if moon_analysis['is_combust']:
        score -= 5; breakdown.append({'factor': 'Moon Combust', 'pts': -5, 'note': 'Confusion, obscured outcome'})
    for app in moon_analysis.get('applying_to', [])[:1]:
        if app['nature'] == 'benefic':
            score += 6; breakdown.append({'factor': f"Moon → {app['planet']}", 'pts': +6, 'note': 'Applying to benefic — yes-indicator'})
        else:
            score -= 3; breakdown.append({'factor': f"Moon → {app['planet']}", 'pts': -3, 'note': 'Applying to malefic — obstacle'})

    # Panchanga (15%)
    if nitya_yoga['auspicious']:
        score += 4; breakdown.append({'factor': f"Yoga: {nitya_yoga['name']}", 'pts': +4, 'note': 'Auspicious nitya yoga'})
    else:
        score -= 4; breakdown.append({'factor': f"Yoga: {nitya_yoga['name']}", 'pts': -4, 'note': 'Inauspicious yoga'})
    if karana['auspicious']:
        score += 2; breakdown.append({'factor': f"Karana: {karana['name']}", 'pts': +2, 'note': 'Suitable karana'})
    else:
        score -= 5; breakdown.append({'factor': f"Karana: {karana['name']} (Vishti)", 'pts': -5, 'note': 'Bhadra — strongly inauspicious'})
    if tithi.get('paksha') == 'Shukla' and tithi.get('number', 0) not in [4, 8, 9, 12, 14]:
        score += 2; breakdown.append({'factor': f"Tithi: {tithi['name']}", 'pts': +2, 'note': 'Auspicious tithi'})
    elif tithi.get('number', 0) in [4, 8, 9, 12, 14]:
        score -= 2; breakdown.append({'factor': f"Tithi: {tithi['name']}", 'pts': -2, 'note': 'Rikta/inauspicious tithi'})

    # Lagna factors (20%)
    if drekkana['is_sarpa']:
        score -= 6; breakdown.append({'factor': 'Sarpa Drekkana rising', 'pts': -6, 'note': 'Complications, hidden factors'})
    elif drekkana['face'] == 1:
        score += 3; breakdown.append({'factor': 'Rising Drekkana: 1st face', 'pts': +3, 'note': 'Fresh energy, favorable start'})
    elif drekkana['face'] == 3:
        score -= 2; breakdown.append({'factor': 'Rising Drekkana: 3rd face', 'pts': -2, 'note': 'Declining energy'})
    if 'strong' in lagna_lord_strength:
        score += 5; breakdown.append({'factor': 'Lagna Lord Strong', 'pts': +5, 'note': lagna_lord_strength})
    elif 'weak' in lagna_lord_strength:
        score -= 4; breakdown.append({'factor': 'Lagna Lord Weak', 'pts': -4, 'note': lagna_lord_strength})

    # Hora/Vara (8%)
    if hora_lord in BENEFICS:
        score += 3; breakdown.append({'factor': f'Hora Lord: {hora_lord}', 'pts': +3, 'note': 'Benefic hora'})
    else:
        score -= 1; breakdown.append({'factor': f'Hora Lord: {hora_lord}', 'pts': -1, 'note': 'Malefic hora'})

    # Combustion (10%)
    for c in combustion[:2]:
        pts = -3 if c['planet'] in ('Moon', 'Jupiter', 'Venus') else -2
        score += pts; breakdown.append({'factor': f"{c['planet']} Combust", 'pts': pts, 'note': c['effect']})

    # Planetary war (5%)
    for w in planetary_war[:1]:
        score -= 3; breakdown.append({'factor': f"Graha Yuddha: {w['planets'][0]}–{w['planets'][1]}", 'pts': -3, 'note': w['effect']})

    # Nimitta (10%)
    if nimitta:
        pts = max(-8, min(8, nimitta['score']))
        score += pts; breakdown.append({'factor': f"Nimitta: {nimitta['verdict']}", 'pts': pts, 'note': nimitta['interpretation'][:80]})

    # House analysis (7%)
    for h_data in house_analysis.values():
        if h_data['role'] == 'Primary':
            if h_data['strength'] == 'strong':
                score += 2; breakdown.append({'factor': f"H{h_data['house']} Lord Strong", 'pts': +2, 'note': h_data['lord_strength']})
                break
            elif h_data['strength'] == 'weak':
                score -= 2; breakdown.append({'factor': f"H{h_data['house']} Lord Weak", 'pts': -2, 'note': h_data['lord_strength']})
                break

    score = max(0, min(100, score))

    if score >= 72:
        label, color = 'Very Favorable', 'green'
    elif score >= 58:
        label, color = 'Favorable', 'lime'
    elif score >= 45:
        label, color = 'Mixed', 'yellow'
    elif score >= 32:
        label, color = 'Unfavorable', 'orange'
    else:
        label, color = 'Very Unfavorable', 'red'

    if moon_analysis['void_of_course']:
        label, color = 'Will Not Proceed', 'gray'

    return {
        'score': round(score),
        'label': label,
        'color': color,
        'breakdown': breakdown,
    }


# ── Schema ────────────────────────────────────────────────────────────────────

class PrashnaRequest(BaseModel):
    latitude: float = 28.613
    longitude: float = 77.209
    tz_offset: float = 5.5
    ayanamsa: str = "lahiri"
    question_category: str = "general"
    question_text: str = ""
    nimitta: str = ""
    custom_year: Optional[int] = None
    custom_month: Optional[int] = None
    custom_day: Optional[int] = None
    custom_hour: Optional[int] = None
    custom_minute: Optional[int] = None


class PrashnaAIRequest(PrashnaRequest):
    prashna_data: Optional[dict] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/prashna/chart")
def get_prashna_chart(req: PrashnaRequest):
    """Compute full Prashna Kundali for current moment (or specified time)."""

    # Time of question
    if req.custom_year:
        dt = datetime(req.custom_year, req.custom_month or 1,
                      req.custom_day or 1, req.custom_hour or 12,
                      req.custom_minute or 0, tzinfo=timezone.utc)
    else:
        dt = datetime.now(timezone.utc)

    local_hour = (dt.hour + req.tz_offset) % 24
    is_day = 6 <= local_hour < 18

    # Julian Day
    jd = birth_to_jd(
        dt.year, dt.month, dt.day,
        dt.hour, dt.minute, 0  # UTC, no tz offset
    )

    # Core calculations
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data['ascendant']
    assign_planets_to_houses(planets, asc['sign_index'])

    # Add longitude to each planet (for aspect calcs)
    for name, p in planets.items():
        if 'longitude' not in p:
            p['longitude'] = p.get('sign_index', 0) * 30 + p.get('degree', 0)

    # Special points
    gulika = get_gulika(jd, req.latitude, req.longitude, req.ayanamsa, is_day)
    pranapada = get_pranapada(planets, is_day)

    # Assign Gulika to house
    if gulika['sign_index'] is not None:
        gulika_house = ((gulika['sign_index'] - asc['sign_index']) % 12) + 1
        gulika['house'] = gulika_house

    # Assign Pranapada to house
    pp_house = ((pranapada['sign_index'] - asc['sign_index']) % 12) + 1
    pranapada['house'] = pp_house

    # Timing indicators
    hora_lord = get_hora_lord(dt)
    vara_lord = get_vara_lord(dt)
    tithi = get_tithi(planets)

    # Moon analysis
    moon_analysis = get_moon_analysis(planets)

    # KP Ruling planets
    ruling_planets = get_kp_ruling_planets(planets, asc, dt)

    # New classical factors
    nitya_yoga = get_nitya_yoga(planets)
    karana = get_karana(planets)
    drekkana = get_drekkana_analysis(asc.get('degree', 0), asc.get('sign', ''), is_day)
    combustion = get_combustion_analysis(planets)
    planetary_war = get_planetary_war(planets)
    arudha = get_arudha_lagna(planets, asc)
    nimitta_analysis = classify_nimitta(getattr(req, 'nimitta', '') or '')

    # Lagna lord strength for vibe score
    from routers.yogas import house_lords as _house_lords
    try:
        hlords = _house_lords(asc.get('sign', 'Aries'))
    except (ValueError, KeyError):
        hlords = {}
    lagna_lord = SIGN_LORDS.get(asc.get('sign', ''), '')
    ll_house = planets.get(lagna_lord, {}).get('house', 1) or 1
    if ll_house in [1, 4, 7, 10]:
        ll_strength = f'strong — {lagna_lord} in kendra H{ll_house}'
    elif ll_house in [5, 9]:
        ll_strength = f'strong — {lagna_lord} in trikona H{ll_house}'
    elif ll_house in [6, 8, 12]:
        ll_strength = f'weak — {lagna_lord} in dusthana H{ll_house}'
    else:
        ll_strength = f'moderate — {lagna_lord} in H{ll_house}'

    # Full house analysis
    house_analysis = compute_house_analysis(planets, asc, req.question_category)

    # Preliminary verdict
    verdict = compute_verdict(
        planets, asc, moon_analysis, ruling_planets,
        req.question_category, gulika, hora_lord
    )

    # Composite vibe score
    vibe_score = compute_vibe_score(
        moon_analysis, verdict, nitya_yoga, karana, drekkana,
        combustion, planetary_war, nimitta_analysis,
        ll_strength, hora_lord, vara_lord, tithi, house_analysis,
    )

    # Planet house map for chart rendering
    planet_house_map: dict = {}
    for name, p in planets.items():
        h = str(p.get('house', 1))
        planet_house_map.setdefault(h, []).append(name)

    if gulika.get('house'):
        planet_house_map.setdefault(str(gulika['house']), [])

    return {
        'timestamp': dt.isoformat(),
        'question_category': req.question_category,
        'question_text': req.question_text,
        'ascendant': asc,
        'planets': planets,
        'planet_house_map': planet_house_map,
        'gulika': gulika,
        'pranapada': pranapada,
        'hora_lord': hora_lord,
        'vara_lord': vara_lord,
        'tithi': tithi,
        'moon_analysis': moon_analysis,
        'ruling_planets': ruling_planets,
        'verdict': verdict,
        'vibe_score': vibe_score,
        'nitya_yoga': nitya_yoga,
        'karana': karana,
        'drekkana': drekkana,
        'combustion': combustion,
        'planetary_war': planetary_war,
        'arudha_lagna': arudha,
        'nimitta_analysis': nimitta_analysis,
        'house_analysis': house_analysis,
        'question_houses': QUESTION_HOUSES.get(req.question_category, {}),
        'is_day': is_day,
        'ayanamsa': req.ayanamsa,
    }


@router.post("/prashna/analyze")
async def analyze_prashna(req: PrashnaAIRequest):
    """AI-powered Prashna interpretation using classical texts."""
    import anthropic

    # Compute chart if not pre-provided
    if req.prashna_data:
        data = req.prashna_data
    else:
        data = get_prashna_chart(req)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {**data, 'ai_interpretation': 'Set ANTHROPIC_API_KEY for AI interpretation.'}

    client = anthropic.Anthropic(api_key=api_key)

    moon = data['moon_analysis']
    verdict = data['verdict']
    rp = [f"{r['planet']} ({r['type']})" for r in data['ruling_planets']]

    ny = data.get('nitya_yoga', {})
    kara = data.get('karana', {})
    drek = data.get('drekkana', {})
    comb = data.get('combustion', [])
    pwar = data.get('planetary_war', [])
    al = data.get('arudha_lagna', {})
    nim = data.get('nimitta_analysis')
    vs = data.get('vibe_score', {})
    ha = data.get('house_analysis', {})

    prompt = f"""You are a master Jyotish scholar of the Kerala tradition, deeply versed in Prashna Marga (all 30 chapters), Brihat Prashna Sarita, Krishneeyam, Prashna Tantra, and Krishnamurti Paddhati (KP Horary).

═══ PRASHNA DATA ═══
Question: "{req.question_text or '(Not stated — interpret from chart)'}"
Category: {req.question_category}
Time: {data['timestamp']}

═══ PANCHANGA ═══
Tithi: {data['tithi']['paksha']} {data['tithi']['name']} (#{data['tithi']['number']})
Vara: {data['vara_lord']} | Hora: {data['hora_lord']}
Nitya Yoga: {ny.get('name')} ({'AUSPICIOUS' if ny.get('auspicious') else 'INAUSPICIOUS'})
Karana: {kara.get('name')} ({'OK' if kara.get('auspicious') else 'VISHTI/INAUSPICIOUS'})

═══ ASCENDANT ═══
{data['ascendant']['sign']} {data['ascendant']['degree']:.1f}° — Drekkana {drek.get('face')}/3 ({'SARPA DREKKANA' if drek.get('is_sarpa') else 'normal'})
Lagna Lord: {SIGN_LORDS.get(data['ascendant']['sign'], '')} in H{planets.get(SIGN_LORDS.get(data['ascendant']['sign'],''), {}).get('house','?')}
Arudha Lagna: H{al.get('house')} ({al.get('sign')})

═══ MOON — PRIMARY INDICATOR ═══
{moon['sign']} {moon['degree']}° — {moon['nakshatra']}
Phase: {'WAXING (Shukla)' if moon['is_waxing'] else 'WANING (Krishna)'}
Combust: {moon['is_combust']} | Void of Course: {moon['void_of_course']}
Degrees to sign end: {moon['degrees_to_sign_end']}°
Applying to: {[(a['planet'], a['diff'], a['days_to_meet'], a['nature']) for a in moon['applying_to']]}
Separating from: {[(s['planet'], s['diff'], s['nature']) for s in moon['separating_from']]}

═══ SPECIAL POINTS ═══
Gulika (Mandi): {data['gulika']['sign']} {data['gulika']['degree']:.1f}° H{data['gulika']['house']}
Pranapada: {data['pranapada']['sign']} {data['pranapada']['degree']:.1f}°

═══ KP RULING PLANETS ═══
{chr(10).join(f"  {r['rank']}. {r['type']}: {r['planet']}" for r in data['ruling_planets'])}

═══ COMBUSTION ═══
{', '.join(f"{c['planet']} ({c['degrees_from_sun']:.1f}° from Sun)" for c in comb) or 'None'}

═══ PLANETARY WAR ═══
{chr(10).join(f"  {w['planets'][0]} vs {w['planets'][1]} — {w['loser']} loses" for w in pwar) or 'None'}

═══ NIMITTA ═══
{f"{nim['text']} → {nim['verdict'].upper()} ({nim['score']:+d} pts)" if nim else 'Not provided'}

═══ HOUSE ANALYSIS ═══
{chr(10).join(f"  H{h}: {d['role']} | Lord {d['lord']} H{d['lord_house']} ({d['lord_strength']}) | Occupants: {d['occupants'] or 'none'}" for h,d in ha.items())}

═══ PLANET POSITIONS ═══
{chr(10).join(f"  {n}: {p['sign']} H{p.get('house','?')} {p.get('degree',0):.1f}° {'(R)' if p.get('retrograde') else ''} {'[COMBUST]' if any(c['planet']==n for c in comb) else ''}" for n,p in data['planets'].items())}

═══ ALGORITHMIC VIBE SCORE: {vs.get('score')}/100 — {vs.get('label')} ═══

As a Kerala Prashna master, synthesize ALL factors above. Your interpretation must:

1. VERDICT — Clear YES / NO / DELAYED / NOT IN QUERENT'S HANDS. State immediately.
2. PRIMARY EVIDENCE — 2-3 strongest classical indicators from Prashna Marga/KP. Name the specific rule.
3. MOON ANALYSIS — Applying aspect interpretation. What planet rules the outcome. Est. timeline.
4. PANCHANGA QUALITY — Yoga/Karana/Tithi effect on this specific query type.
5. NIMITTA VERDICT — If provided, classical interpretation per Prashna Marga chapter 4.
6. WHAT TO ADVISE — Practical guidance: act now / wait / consult / remedy needed.

Be direct, cite rules by name. 200-250 words. Write like a Kerala traditional astrologer giving verbal consultation."""

    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )

    return {**data, 'ai_interpretation': msg.content[0].text}
