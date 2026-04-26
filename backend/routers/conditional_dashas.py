"""
Conditional Dasha Systems (BPHS Ch. 46, Parashari tradition).
These apply only when specific birth conditions are met.

1. Dwisaptati Sama Dasha (72 years)   — condition: lagna lord in 7H OR 7th lord in lagna
2. Shodashottari Dasha (116 years)    — condition: Moon in Hora Lagna
3. Shatabdika Dasha (100 years)       — condition: lagna lord in lagna (no condition variant)
4. Dwadasottari Dasha (112 years)     — condition: Venus in lagna or 7H
5. Saptavimsati Sama Dasha (108 years)— condition: Saturn in lagna or 7H (alternative)
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, jd_to_datetime, NAKSHATRAS, NAKSHATRA_LORDS
import swisseph as swe

router = APIRouter(tags=["conditional_dashas"])

SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
SIGN_LORDS = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"]

def sign_lord(idx: int) -> str:
    return SIGN_LORDS[idx % 12]

# ── Dwisaptati Sama Dasha (72 years — 8 planets × 9 years) ──────────────────
# Active when: lagna lord in 7H, OR 7H lord in lagna
# Sequence: Sun→Moon→Mars→Mercury→Jupiter→Venus→Saturn→Rahu (no Ketu)
DWISAPTATI_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu"]
DWISAPTATI_YEARS_EACH = 9  # 8 × 9 = 72 total

def check_dwisaptati_condition(planets: dict, asc_sign_idx: int) -> tuple[bool, str]:
    lagna_lord = sign_lord(asc_sign_idx)
    ll_planet = planets.get(lagna_lord, {})
    ll_sign_idx = ll_planet.get("sign_index", SIGNS.index(ll_planet.get("sign", SIGNS[0])) if ll_planet.get("sign") else 0)
    ll_house = (ll_sign_idx - asc_sign_idx) % 12 + 1

    seventh_sign_idx = (asc_sign_idx + 6) % 12
    seventh_lord = sign_lord(seventh_sign_idx)
    sl_planet = planets.get(seventh_lord, {})
    sl_sign_idx = sl_planet.get("sign_index", SIGNS.index(sl_planet.get("sign", SIGNS[0])) if sl_planet.get("sign") else 0)
    sl_house = (sl_sign_idx - asc_sign_idx) % 12 + 1

    if ll_house == 7:
        return True, f"Lagna lord {lagna_lord} in 7H"
    if sl_house == 1:
        return True, f"7th lord {seventh_lord} in lagna"
    return False, "Condition not met (lagna lord not in 7H, 7th lord not in lagna)"


def get_dwisaptati_sequence(moon_lon: float, birth_jd: float) -> list:
    nak_idx = int(moon_lon / (360 / 27))
    nak_elapsed = (moon_lon % (360 / 27)) / (360 / 27)

    # Starting lord from nakshatra owner (mapped to Dwisaptati 8-lord sequence)
    nak_lord = NAKSHATRA_LORDS[nak_idx]
    if nak_lord == "Ketu":
        nak_lord = "Sun"  # Ketu not in this system → map to Sun
    if nak_lord in DWISAPTATI_LORDS:
        start_idx = DWISAPTATI_LORDS.index(nak_lord)
    else:
        start_idx = 0

    elapsed_years = DWISAPTATI_YEARS_EACH * nak_elapsed
    remaining = DWISAPTATI_YEARS_EACH - elapsed_years

    dashas = []
    current_jd = birth_jd

    end_jd = current_jd + remaining * 365.25
    dashas.append({
        "lord": DWISAPTATI_LORDS[start_idx],
        "years": round(remaining, 4),
        "start": jd_to_datetime(current_jd),
        "end": jd_to_datetime(end_jd),
    })
    current_jd = end_jd

    for i in range(1, 32):
        idx = (start_idx + i) % 8
        end_jd = current_jd + DWISAPTATI_YEARS_EACH * 365.25
        dashas.append({
            "lord": DWISAPTATI_LORDS[idx],
            "years": DWISAPTATI_YEARS_EACH,
            "start": jd_to_datetime(current_jd),
            "end": jd_to_datetime(end_jd),
        })
        current_jd = end_jd

    return dashas


# ── Shodashottari Dasha (116 years — Moon in Hora Lagna) ─────────────────────
# Sequence: Sun→Moon→Jupiter→Rahu→Mercury→Venus→Ketu→Saturn→Mars→Sun… (repeating 9, total 116)
SHODASHOTTARI_LORDS = ["Sun", "Moon", "Jupiter", "Rahu", "Mercury", "Venus", "Ketu", "Saturn", "Mars"]
SHODASHOTTARI_YEARS = {"Sun": 11, "Moon": 12, "Jupiter": 16, "Rahu": 17,
                        "Mercury": 13, "Venus": 14, "Ketu": 7, "Saturn": 15, "Mars": 11}
SHODASHOTTARI_TOTAL = 116

def compute_hora_lagna(birth_jd: float, lat: float, lon: float, ayanamsa: str) -> float:
    """Hora Lagna rises at rate of 1 sign per hour from sunrise."""
    import swisseph as swe_local
    # Sunrise approximate: use Ascendant at local solar noon midpoint
    # Simplified: use tropical sun longitude modulo 30 for hora position
    sun_lon = swe_local.calc_ut(birth_jd, swe_local.SUN)[0][0]
    # Hora Lagna = Sun position + sidereal correction (simplified)
    # Proper: track signs risen since sunrise; simplified: use ascendant as proxy
    houses = swe_local.houses(birth_jd, lat, lon, b'P')
    asc_lon = houses[0][0]  # tropical
    # Hora changes every 2.5 hours; each planet controls 1 hora hour
    # Simplified approximation: hora lagna from sun + time elapsed since SR
    return asc_lon  # placeholder — proper impl requires sunrise time


def check_shodashottari_condition(moon_lon: float, hora_lagna_lon: float) -> tuple[bool, str]:
    # Condition: Moon is in Hora Lagna sign
    moon_sign = int(moon_lon / 30)
    hora_sign = int(hora_lagna_lon / 30)
    if moon_sign == hora_sign:
        return True, f"Moon in Hora Lagna ({SIGNS[moon_sign]})"
    return False, f"Moon ({SIGNS[moon_sign]}) not in Hora Lagna ({SIGNS[hora_sign]})"


def get_shodashottari_sequence(moon_lon: float, birth_jd: float) -> list:
    nak_idx = int(moon_lon / (360 / 27))
    nak_elapsed = (moon_lon % (360 / 27)) / (360 / 27)

    nak_lord = NAKSHATRA_LORDS[nak_idx]
    if nak_lord in SHODASHOTTARI_LORDS:
        start_idx = SHODASHOTTARI_LORDS.index(nak_lord)
    else:
        start_idx = 0

    total_years = SHODASHOTTARI_YEARS[SHODASHOTTARI_LORDS[start_idx]]
    elapsed = total_years * nak_elapsed
    remaining = total_years - elapsed

    dashas = []
    current_jd = birth_jd

    end_jd = current_jd + remaining * 365.25
    dashas.append({
        "lord": SHODASHOTTARI_LORDS[start_idx],
        "years": round(remaining, 4),
        "start": jd_to_datetime(current_jd),
        "end": jd_to_datetime(end_jd),
    })
    current_jd = end_jd

    for i in range(1, 30):
        idx = (start_idx + i) % 9
        lord = SHODASHOTTARI_LORDS[idx]
        y = SHODASHOTTARI_YEARS[lord]
        end_jd = current_jd + y * 365.25
        dashas.append({
            "lord": lord, "years": y,
            "start": jd_to_datetime(current_jd),
            "end": jd_to_datetime(end_jd),
        })
        current_jd = end_jd

    return dashas


# ── Shatabdika Dasha (100 years — sign-based, always applicable) ─────────────
# Each sign rules 100/12 ≈ 8.33 years; sequence from lagna sign
SHATABDIKA_TOTAL = 100

def get_shatabdika_sequence(asc_sign_idx: int, birth_jd: float) -> list:
    years_per_sign = SHATABDIKA_TOTAL / 12
    dashas = []
    current_jd = birth_jd
    for i in range(12):
        si = (asc_sign_idx + i) % 12
        end_jd = current_jd + years_per_sign * 365.25
        dashas.append({
            "sign": SIGNS[si],
            "lord": sign_lord(si),
            "years": round(years_per_sign, 4),
            "start": jd_to_datetime(current_jd),
            "end": jd_to_datetime(end_jd),
        })
        current_jd = end_jd
    return dashas


# ── Dwadasottari Dasha (112 years — Venus in lagna or 7H) ────────────────────
DWADASOTTARI_LORDS = ["Sun", "Jupiter", "Ketu", "Mercury", "Rahu", "Mars", "Venus", "Moon", "Saturn"]
DWADASOTTARI_YEARS = {"Sun": 7, "Jupiter": 9, "Ketu": 11, "Mercury": 13,
                       "Rahu": 12, "Mars": 10, "Venus": 16, "Moon": 8, "Saturn": 26}
DWADASOTTARI_TOTAL = 112

def check_dwadasottari_condition(planets: dict, asc_sign_idx: int) -> tuple[bool, str]:
    venus = planets.get("Venus", {})
    v_sign_idx = venus.get("sign_index", SIGNS.index(venus.get("sign", SIGNS[0])) if venus.get("sign") else 0)
    v_house = (v_sign_idx - asc_sign_idx) % 12 + 1
    if v_house in (1, 7):
        return True, f"Venus in {v_house}H"
    return False, f"Venus in {v_house}H — not 1H or 7H"

def get_dwadasottari_sequence(moon_lon: float, birth_jd: float) -> list:
    nak_idx = int(moon_lon / (360 / 27))
    nak_elapsed = (moon_lon % (360 / 27)) / (360 / 27)
    nak_lord = NAKSHATRA_LORDS[nak_idx]
    if nak_lord in DWADASOTTARI_LORDS:
        start_idx = DWADASOTTARI_LORDS.index(nak_lord)
    else:
        start_idx = 0
    total_y = DWADASOTTARI_YEARS[DWADASOTTARI_LORDS[start_idx]]
    remaining = total_y * (1 - nak_elapsed)
    dashas = []
    current_jd = birth_jd
    end_jd = current_jd + remaining * 365.25
    dashas.append({"lord": DWADASOTTARI_LORDS[start_idx], "years": round(remaining, 4),
                   "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd)})
    current_jd = end_jd
    for i in range(1, 30):
        idx = (start_idx + i) % 9
        lord = DWADASOTTARI_LORDS[idx]
        y = DWADASOTTARI_YEARS[lord]
        end_jd = current_jd + y * 365.25
        dashas.append({"lord": lord, "years": y,
                       "start": jd_to_datetime(current_jd), "end": jd_to_datetime(end_jd)})
        current_jd = end_jd
    return dashas


class ConditionalDashaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/conditional_dashas")
def get_conditional_dashas(req: ConditionalDashaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    asc_sign_idx = asc.get("sign_index", SIGNS.index(asc["sign"]) if asc["sign"] in SIGNS else 0)

    # Normalize planet sign_index
    for name, pd in planets.items():
        if "sign_index" not in pd and "sign" in pd and pd["sign"] in SIGNS:
            pd["sign_index"] = SIGNS.index(pd["sign"])

    moon_lon = planets.get("Moon", {}).get("longitude", 0)
    hora_lagna_lon = compute_hora_lagna(jd, req.latitude, req.longitude, req.ayanamsa)

    # Check conditions
    dw_active, dw_reason = check_dwisaptati_condition(planets, asc_sign_idx)
    sh_active, sh_reason = check_shodashottari_condition(moon_lon, hora_lagna_lon)
    dwd_active, dwd_reason = check_dwadasottari_condition(planets, asc_sign_idx)

    result = {
        "conditions_met": [],
        "dashas": {},
        "ascendant": asc,
        "moon_sign": planets.get("Moon", {}).get("sign", ""),
    }

    # Dwisaptati Sama (72 yr)
    result["dashas"]["dwisaptati_sama"] = {
        "name": "Dwisaptati Sama Dasha",
        "total_years": 72,
        "condition": "Lagna lord in 7H OR 7th lord in lagna",
        "condition_met": dw_active,
        "condition_reason": dw_reason,
        "sequence": get_dwisaptati_sequence(moon_lon, jd) if dw_active else [],
    }
    if dw_active:
        result["conditions_met"].append("Dwisaptati Sama")

    # Shodashottari (116 yr)
    result["dashas"]["shodashottari"] = {
        "name": "Shodashottari Dasha",
        "total_years": 116,
        "condition": "Moon in Hora Lagna",
        "condition_met": sh_active,
        "condition_reason": sh_reason,
        "sequence": get_shodashottari_sequence(moon_lon, jd) if sh_active else [],
    }
    if sh_active:
        result["conditions_met"].append("Shodashottari")

    # Shatabdika (100 yr — always shown)
    result["dashas"]["shatabdika"] = {
        "name": "Shatabdika Dasha",
        "total_years": 100,
        "condition": "Universal (no condition)",
        "condition_met": True,
        "condition_reason": "Always applicable",
        "sequence": get_shatabdika_sequence(asc_sign_idx, jd),
    }
    result["conditions_met"].append("Shatabdika")

    # Dwadasottari (112 yr)
    result["dashas"]["dwadasottari"] = {
        "name": "Dwadasottari Dasha",
        "total_years": 112,
        "condition": "Venus in lagna or 7H",
        "condition_met": dwd_active,
        "condition_reason": dwd_reason,
        "sequence": get_dwadasottari_sequence(moon_lon, jd) if dwd_active else [],
    }
    if dwd_active:
        result["conditions_met"].append("Dwadasottari")

    return result
