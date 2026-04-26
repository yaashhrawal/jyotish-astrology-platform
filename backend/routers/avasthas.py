"""
Avasthas — Classical planetary states (BPHS Ch. 45-47).
Covers: Baladi (age states), Jagradi (awakening states), Lajjitadi (emotional states),
Deeptadi (brightness states), and Saptadhatu (body tissue lordship).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses

router = APIRouter(tags=["avasthas"])

# ── Baladi Avasthas (Age states) — based on degree within sign ────────────────
# Each sign = 30°, divided into 5 parts of 6° each
# Odd signs: Bala→Kumara→Yuva→Vriddha→Mrita
# Even signs: reversed — Mrita→Vriddha→Yuva→Kumara→Bala

BALADI_ODD  = ["Bala", "Kumara", "Yuva", "Vriddha", "Mrita"]
BALADI_EVEN = ["Mrita", "Vriddha", "Yuva", "Kumara", "Bala"]

BALADI_STRENGTH = {
    "Bala":    25,   # Child — weak but innocent
    "Kumara":  50,   # Youth — moderate
    "Yuva":    100,  # Adult — full strength
    "Vriddha": 50,   # Old — weakening
    "Mrita":   0,    # Dead — no strength
}

BALADI_DESC = {
    "Bala":    "Infant state — planet is innocent, weak, not fully manifested",
    "Kumara":  "Youth state — planet is developing, partial results",
    "Yuva":    "Prime state — planet at full strength, gives full results",
    "Vriddha": "Old age state — planet past its prime, results diminished",
    "Mrita":   "Dead state — planet gives no results, may cause harm",
}

# ── Jagradi Avasthas (Awakening states) — based on position relative to own sign ──
# Jagrut (Awake): In own sign, exaltation, friendly sign
# Swapna (Dreaming): Neutral sign
# Sushupti (Deep sleep): Enemy sign, debilitation

def get_jagradi(planet: str, sign: str, status: str) -> dict:
    if status in ("exalted", "own_sign"):
        state = "Jagrut"
        strength = 100
        desc = "Fully awake — planet is alert and gives maximum results"
    elif status == "neutral":
        state = "Swapna"
        strength = 50
        desc = "Dreaming — planet gives partial, mixed results"
    elif status in ("debilitated", "enemy_sign"):
        state = "Sushupti"
        strength = 0
        desc = "Deep sleep — planet is inactive, results severely curtailed"
    elif status == "friend_sign":
        state = "Jagrut"
        strength = 75
        desc = "Awake (friendly) — planet gives good results"
    else:
        state = "Swapna"
        strength = 50
        desc = "Dreaming — planet gives partial results"
    return {"state": state, "strength": strength, "description": desc}


# ── Lajjitadi Avasthas (Emotional states — BPHS Ch. 46) ──────────────────────
# These are contextual — based on conjunctions and house placement
# Lajjita (Ashamed): in 5H with Rahu/Ketu/Saturn
# Garvita (Proud): in exaltation or own sign
# Kshudita (Hungry): in enemy sign or with enemy planet
# Trushita (Thirsty): in watery signs (Cancer, Scorpio, Pisces) with malefic
# Mudita (Delighted): with friendly planet or in friendly sign
# Kshobhita (Agitated): with Sun (combust) + malefic

WATERY_SIGNS = {"Cancer", "Scorpio", "Pisces"}
MALEFICS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}  # Sun context-dependent
BENEFICS = {"Jupiter", "Venus", "Moon", "Mercury"}

def get_lajjitadi(planet: str, house: int, sign: str, status: str, conjunct_planets: list, combust: bool) -> list:
    states = []
    mal_conj = [p for p in conjunct_planets if p in MALEFICS and p != planet]
    ben_conj = [p for p in conjunct_planets if p in BENEFICS and p != planet]
    rahu_ketu_sat = [p for p in conjunct_planets if p in {"Rahu", "Ketu", "Saturn"}]

    if house == 5 and rahu_ketu_sat:
        states.append({
            "state": "Lajjita",
            "meaning": "Ashamed",
            "desc": f"In 5H with {', '.join(rahu_ketu_sat)} — planet feels shame, significations suffer especially children, intellect, past karma",
            "effect": "negative"
        })
    if status in ("exalted", "own_sign"):
        states.append({
            "state": "Garvita",
            "meaning": "Proud",
            "desc": "In exaltation or own sign — planet is proud, gives exceptional results with authority",
            "effect": "positive"
        })
    if status in ("enemy_sign", "debilitated") or (mal_conj and status not in ("exalted", "own_sign")):
        states.append({
            "state": "Kshudita",
            "meaning": "Hungry",
            "desc": "In enemy sign or with enemy planets — planet is hungry/afflicted, results incomplete",
            "effect": "negative"
        })
    if sign in WATERY_SIGNS and mal_conj:
        states.append({
            "state": "Trushita",
            "meaning": "Thirsty",
            "desc": f"In watery sign {sign} with malefics — planet craves but cannot satisfy, emotional restlessness",
            "effect": "negative"
        })
    if ben_conj or status == "friend_sign":
        states.append({
            "state": "Mudita",
            "meaning": "Delighted",
            "desc": f"With benefics ({', '.join(ben_conj) if ben_conj else 'friendly sign'}) — planet is happy, gives auspicious results",
            "effect": "positive"
        })
    if combust and mal_conj:
        states.append({
            "state": "Kshobhita",
            "meaning": "Agitated",
            "desc": "Combust + with malefic — planet is agitated, highly disturbed, gives erratic results",
            "effect": "negative"
        })

    if not states:
        states.append({
            "state": "Mudita",
            "meaning": "Delighted",
            "desc": "Neutral placement — planet is content, gives moderate results",
            "effect": "neutral"
        })
    return states


# ── Deeptadi Avasthas (Brightness states — simpler set) ──────────────────────
DEEPTADI_MAP = {
    "exalted":    ("Deetha",   "Brilliant — radiates full power, highly auspicious"),
    "own_sign":   ("Svastha",  "Healthy — planet in own domain, comfortable and effective"),
    "friend_sign":("Mudita",   "Pleased — in friendly territory, gives good results"),
    "neutral":    ("Shanta",   "Calm — neutral disposition, moderate results"),
    "enemy_sign": ("Dukhita",  "Suffering — in hostile territory, results diminished"),
    "debilitated":("Vikala",   "Disabled — severely weakened, results nearly absent"),
}

# ── Saptadhatu — body tissue lordship ────────────────────────────────────────
SAPTADHATU = {
    "Sun":     {"dhatu": "Asthi (Bone)", "body": "Bones, spine, right eye", "disease_when_afflicted": "Bone disorders, spine issues, eye problems, fever"},
    "Moon":    {"dhatu": "Rakta (Blood)", "body": "Blood, mind, left eye, breasts", "disease_when_afflicted": "Blood disorders, anemia, mental issues, hormonal"},
    "Mars":    {"dhatu": "Majja (Marrow)", "body": "Bone marrow, muscles, energy", "disease_when_afflicted": "Accidents, surgery, blood disorders, fever, inflammation"},
    "Mercury": {"dhatu": "Tvak (Skin)", "body": "Skin, nerves, speech organs", "disease_when_afflicted": "Skin disorders, nervous system, speech defects"},
    "Jupiter": {"dhatu": "Meda (Fat)", "body": "Fat tissue, liver, hips", "disease_when_afflicted": "Liver issues, obesity, diabetes, jaundice"},
    "Venus":   {"dhatu": "Shukra (Semen/Reproductive)", "body": "Reproductive system, kidneys, face", "disease_when_afflicted": "Reproductive disorders, kidney issues, diabetes"},
    "Saturn":  {"dhatu": "Snayu (Tendons/Nerves)", "body": "Tendons, nerves, teeth, joints", "disease_when_afflicted": "Chronic disease, joint pain, arthritis, depression"},
    "Rahu":    {"dhatu": "Asthi (Bone) — shadow", "body": "Neurological system, skin (unorthodox)", "disease_when_afflicted": "Mysterious illnesses, neurological, phobias, poisoning"},
    "Ketu":    {"dhatu": "Rakta (Blood) — shadow", "body": "Spiritual body, intestines", "disease_when_afflicted": "Intestinal issues, infections, fevers, occult causes"},
}


class ChartInput(BaseModel):
    year: int; month: int; day: int; hour: float; minute: float
    tz_offset: float; latitude: float; longitude: float; ayanamsa: str = "lahiri"


SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
ODD_SIGNS = {"Aries","Gemini","Leo","Libra","Sagittarius","Aquarius"}


@router.post("/avasthas")
async def get_avasthas(data: ChartInput):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa)
    houses = calculate_houses(jd, data.latitude, data.longitude, data.ayanamsa)

    # build house map
    planet_house: dict[str, int] = {}
    for planet, pd in planets.items():
        asc_sign_idx = SIGNS.index(houses["ascendant"]["sign"]) if houses["ascendant"]["sign"] in SIGNS else 0
        planet_sign_idx = SIGNS.index(pd["sign"]) if pd["sign"] in SIGNS else 0
        planet_house[planet] = (planet_sign_idx - asc_sign_idx) % 12 + 1

    # build conjunct map (same sign)
    sign_to_planets: dict[str, list] = {}
    for planet, pd in planets.items():
        sign_to_planets.setdefault(pd["sign"], []).append(planet)

    result = {}
    for planet, pd in planets.items():
        sign = pd["sign"]
        status = pd.get("status", "neutral")
        degree_in_sign = pd.get("degree", pd.get("longitude", 0)) % 30
        house = planet_house.get(planet, 1)
        combust = pd.get("combust", False)
        conjuncts = [p for p in sign_to_planets.get(sign, []) if p != planet]

        # Baladi
        part = min(int(degree_in_sign / 6), 4)
        baladi_state = (BALADI_ODD if sign in ODD_SIGNS else BALADI_EVEN)[part]

        # Jagradi
        jagradi = get_jagradi(planet, sign, status)

        # Lajjitadi
        lajjitadi = get_lajjitadi(planet, house, sign, status, conjuncts, combust)

        # Deeptadi
        deeptadi_name, deeptadi_desc = DEEPTADI_MAP.get(status, ("Shanta", "Calm disposition"))

        # Overall avastha score (0–100)
        score = round(
            BALADI_STRENGTH[baladi_state] * 0.4 +
            jagradi["strength"] * 0.4 +
            (80 if any(s["effect"] == "positive" for s in lajjitadi) else
             20 if any(s["effect"] == "negative" for s in lajjitadi) else 50) * 0.2
        )

        result[planet] = {
            "planet": planet,
            "sign": sign,
            "house": house,
            "degree_in_sign": round(degree_in_sign, 2),
            "baladi": {
                "state": baladi_state,
                "strength_percent": BALADI_STRENGTH[baladi_state],
                "description": BALADI_DESC[baladi_state],
            },
            "jagradi": jagradi,
            "lajjitadi": lajjitadi,
            "deeptadi": {
                "state": deeptadi_name,
                "description": deeptadi_desc,
            },
            "saptadhatu": SAPTADHATU.get(planet, {}),
            "overall_score": score,
            "conjunct_planets": conjuncts,
        }

    return {"avasthas": result, "ascendant": houses["ascendant"]}
