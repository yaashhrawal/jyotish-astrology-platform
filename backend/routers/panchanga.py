from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, get_ayanamsa
import swisseph as swe

router = APIRouter()

class PanchangaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"

TITHIS = [
    "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami",
    "Shashthi","Saptami","Ashtami","Navami","Dashami",
    "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima/Amavasya"
]

VARAS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
VARA_LORDS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]

KARANAS = [
    "Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti",
    "Shakuni","Chatushpada","Naga","Kimstughna"
]

NITYA_YOGAS = [
    "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana",
    "Atiganda","Sukarman","Dhriti","Shula","Ganda",
    "Vriddhi","Dhruva","Vyaghata","Harshana","Vajra",
    "Siddhi","Vyatipata","Variyan","Parigha","Shiva",
    "Siddha","Sadhya","Shubha","Shukla","Brahma",
    "Indra","Vaidhriti"
]

INAUSPICIOUS_YOGAS = [
    "Vishkambha","Atiganda","Shula","Ganda","Vyaghata",
    "Vajra","Vyatipata","Parigha","Vaidhriti"
]

NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
    "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
    "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
    "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta",
    "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
]

NAKSHATRA_LORDS = [
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
]

# Planetary hours advance in CHALDEAN order (slowest → fastest graha),
# repeating every 7. The FIRST hora of the day (at sunrise) is ruled by the
# weekday lord; each subsequent hora steps forward in this sequence.
CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]


def get_tithi(sun_lon: float, moon_lon: float):
    diff = (moon_lon - sun_lon) % 360
    tithi_num = int(diff / 12) + 1  # 1-30
    tithi_name = TITHIS[min((tithi_num - 1) % 15, 14)]
    paksha = "Shukla" if tithi_num <= 15 else "Krishna"
    return tithi_num, tithi_name, paksha


def get_vara(jd: float, tz_offset: float):
    # Fallback (civil, midnight boundary). Prefer get_vara_sunrise below.
    local_jd = jd + tz_offset / 24.0
    day_of_week = int(local_jd + 1.5) % 7
    return VARAS[day_of_week], VARA_LORDS[day_of_week]


def get_vara_sunrise(year, month, day, tz_offset, lat, lon, query_jd):
    """Vedic weekday — changes at SUNRISE, not midnight. Before sunrise the
    running vara still belongs to the previous day."""
    def _wd(sr):
        return int((sr + tz_offset / 24.0) + 1.5) % 7
    try:
        sr, _, _ = _sun_rise_set(birth_to_jd(year, month, day, 0, 0, tz_offset), lat, lon)
        if query_jd < sr:  # before today's sunrise → previous Vedic day
            sr_prev, _, _ = _sun_rise_set(birth_to_jd(year, month, day - 1, 0, 0, tz_offset), lat, lon)
            wd = _wd(sr_prev)
        else:
            wd = _wd(sr)
        return VARAS[wd], VARA_LORDS[wd]
    except Exception:
        return get_vara(query_jd, tz_offset)


def get_nakshatra_pada(moon_lon: float):
    nak_idx = int(moon_lon / (360 / 27))
    pada = int((moon_lon % (360 / 27)) / (360 / 108)) + 1
    return NAKSHATRAS[nak_idx], NAKSHATRA_LORDS[nak_idx], nak_idx, pada


def get_yoga(sun_lon: float, moon_lon: float):
    combined = (sun_lon + moon_lon) % 360
    yoga_idx = int(combined / (360 / 27))
    yoga_name = NITYA_YOGAS[yoga_idx]
    is_inauspicious = yoga_name in INAUSPICIOUS_YOGAS
    return yoga_name, is_inauspicious


def get_karana(sun_lon: float, moon_lon: float):
    diff = (moon_lon - sun_lon) % 360
    karana_num = int(diff / 6)  # 0-59
    # First karana is Kimstughna (fixed), positions 0
    # karanas 1-56: repeat Bava..Vishti (7 movable)
    # 57=Shakuni, 58=Chatushpada, 59=Naga
    if karana_num == 0:
        name = "Kimstughna"
    elif 1 <= karana_num <= 56:
        name = KARANAS[(karana_num - 1) % 7]
    elif karana_num == 57:
        name = "Shakuni"
    elif karana_num == 58:
        name = "Chatushpada"
    else:
        name = "Naga"
    inauspicious = name in ["Vishti", "Shakuni", "Chatushpada", "Naga", "Kimstughna"]
    return name, inauspicious


def _jd_to_local_hm(jd: float, tz_offset: float) -> str:
    """Julian Day (UT) → local HH:MM string."""
    local = jd + tz_offset / 24.0
    frac = (local + 0.5) % 1.0        # 0 = local midnight
    total_min = round(frac * 24 * 60)
    return f"{(total_min // 60) % 24:02d}:{total_min % 60:02d}"


def _sun_rise_set(day_start_ut: float, lat: float, lon: float):
    """Return (sunrise, sunset, next_sunrise) as UT Julian Days for the local day.
    Falls back to 06:00/18:00 if Swiss Ephemeris rise/set can't be computed
    (e.g. polar latitudes)."""
    def _find(rsmi: int, start: float) -> float:
        # Signature: rise_trans(tjdut, body, rsmi, geopos=(lon,lat,alt), atpress, attemp, flags)
        res = swe.rise_trans(start, swe.SUN, rsmi, (lon, lat, 0), 0, 0, swe.FLG_MOSEPH)
        return res[1][0]  # (retflag, (tret, ...))
    sr = _find(swe.CALC_RISE, day_start_ut)
    ss = _find(swe.CALC_SET, sr)
    nsr = _find(swe.CALC_RISE, ss)
    return sr, ss, nsr


def get_hora_schedule(year, month, day, tz_offset, lat, lon, query_jd):
    """Correct planetary-hours (hora) schedule.
    Day (sunrise→sunset) split into 12 unequal horas, night (sunset→next
    sunrise) into 12. First day-hora ruled by the weekday lord, then Chaldean.
    Returns (current_lord, schedule, sun_times)."""
    midnight_ut = birth_to_jd(year, month, day, 0, 0, tz_offset)  # local midnight in UT
    try:
        sr, ss, nsr = _sun_rise_set(midnight_ut, lat, lon)
        if not (sr < ss < nsr):
            raise ValueError("bad rise/set order")
    except Exception:
        sr = birth_to_jd(year, month, day, 6, 0, tz_offset)
        ss = birth_to_jd(year, month, day, 18, 0, tz_offset)
        nsr = birth_to_jd(year, month, day + 1, 6, 0, tz_offset)

    # Weekday at SUNRISE (Vedic day begins at sunrise) → its lord starts the horas
    weekday = int((sr + tz_offset / 24.0) + 1.5) % 7
    start_idx = CHALDEAN_ORDER.index(VARA_LORDS[weekday])

    day_h = (ss - sr) / 12.0
    night_h = (nsr - ss) / 12.0
    schedule = []
    current_lord = None
    for i in range(24):
        if i < 12:
            h_start, h_end, is_night = sr + i * day_h, sr + (i + 1) * day_h, False
        else:
            j = i - 12
            h_start, h_end, is_night = ss + j * night_h, ss + (j + 1) * night_h, True
        lord = CHALDEAN_ORDER[(start_idx + i) % 7]
        is_current = h_start <= query_jd < h_end
        if is_current:
            current_lord = lord
        schedule.append({
            "index": i, "lord": lord, "is_night": is_night,
            "start": _jd_to_local_hm(h_start, tz_offset),
            "end": _jd_to_local_hm(h_end, tz_offset),
            "current": is_current,
        })
    sun_times = {"sunrise": _jd_to_local_hm(sr, tz_offset), "sunset": _jd_to_local_hm(ss, tz_offset)}
    return current_lord, schedule, sun_times


def get_sun_moon_positions(jd: float, ayanamsa: str):
    ayan = get_ayanamsa(jd, ayanamsa)
    # Use Moshier (FLG_MOSEPH) to match core/engine.py — no ephemeris files shipped.
    sun_r, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_MOSEPH)
    moon_r, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_MOSEPH)
    sun_sid = (sun_r[0] - ayan) % 360
    moon_sid = (moon_r[0] - ayan) % 360
    return sun_sid, moon_sid


@router.post("/panchanga")
def get_panchanga(data: PanchangaRequest):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    sun_lon, moon_lon = get_sun_moon_positions(jd, data.ayanamsa)

    tithi_num, tithi_name, paksha = get_tithi(sun_lon, moon_lon)
    vara, vara_lord = get_vara_sunrise(data.year, data.month, data.day, data.tz_offset, data.latitude, data.longitude, jd)
    nakshatra, nak_lord, nak_idx, pada = get_nakshatra_pada(moon_lon)
    yoga_name, yoga_inauspicious = get_yoga(sun_lon, moon_lon)
    karana_name, karana_inauspicious = get_karana(sun_lon, moon_lon)

    # Correct sunrise-based planetary hours (Chaldean order from weekday lord)
    hora_lord, hora_schedule, sun_times = get_hora_schedule(
        data.year, data.month, data.day, data.tz_offset, data.latitude, data.longitude, jd
    )

    # Moon speed for waxing/waning
    moon_r, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_MOSEPH | swe.FLG_SPEED)
    is_waxing = tithi_num <= 15

    return {
        "tithi": {"number": tithi_num, "name": tithi_name, "paksha": paksha},
        "vara": {"day": vara, "lord": vara_lord},
        "nakshatra": {"name": nakshatra, "lord": nak_lord, "pada": pada, "index": nak_idx},
        "yoga": {"name": yoga_name, "inauspicious": yoga_inauspicious},
        "karana": {"name": karana_name, "inauspicious": karana_inauspicious},
        "hora": {"lord": hora_lord, "schedule": hora_schedule, **sun_times},
        "moon": {"longitude": round(moon_lon, 4), "is_waxing": is_waxing, "speed": round(moon_r[3], 4)},
        "sun": {"longitude": round(sun_lon, 4)},
        "date": f"{data.year}-{data.month:02d}-{data.day:02d} {data.hour:02d}:{data.minute:02d}",
    }
