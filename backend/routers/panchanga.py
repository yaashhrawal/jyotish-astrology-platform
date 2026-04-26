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

HORA_SEQUENCE = ["Sun","Venus","Mercury","Moon","Saturn","Jupiter","Mars"]


def get_tithi(sun_lon: float, moon_lon: float):
    diff = (moon_lon - sun_lon) % 360
    tithi_num = int(diff / 12) + 1  # 1-30
    tithi_name = TITHIS[min((tithi_num - 1) % 15, 14)]
    paksha = "Shukla" if tithi_num <= 15 else "Krishna"
    return tithi_num, tithi_name, paksha


def get_vara(jd: float, tz_offset: float):
    # Day of week from JD
    local_jd = jd + tz_offset / 24.0
    day_of_week = int(local_jd + 1.5) % 7
    return VARAS[day_of_week], VARA_LORDS[day_of_week]


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


def get_hora(jd: float, tz_offset: float):
    local_jd = jd + tz_offset / 24.0
    day_of_week = int(local_jd + 1.5) % 7
    # Hour of day (local)
    fractional_day = (local_jd + 0.5) % 1
    hour_of_day = int(fractional_day * 24)
    # Hora lord: day lord starts at sunrise (hora 0), each hora = 1 hour
    day_lord_idx = day_of_week
    hora_idx = (day_lord_idx * 24 + hour_of_day) % 7
    return HORA_SEQUENCE[hora_idx]


def get_sun_moon_positions(jd: float, ayanamsa: str):
    ayan = get_ayanamsa(jd, ayanamsa)
    sun_r, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_SWIEPH)
    moon_r, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_SWIEPH)
    sun_sid = (sun_r[0] - ayan) % 360
    moon_sid = (moon_r[0] - ayan) % 360
    return sun_sid, moon_sid


@router.post("/panchanga")
def get_panchanga(data: PanchangaRequest):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    sun_lon, moon_lon = get_sun_moon_positions(jd, data.ayanamsa)

    tithi_num, tithi_name, paksha = get_tithi(sun_lon, moon_lon)
    vara, vara_lord = get_vara(jd, data.tz_offset)
    nakshatra, nak_lord, nak_idx, pada = get_nakshatra_pada(moon_lon)
    yoga_name, yoga_inauspicious = get_yoga(sun_lon, moon_lon)
    karana_name, karana_inauspicious = get_karana(sun_lon, moon_lon)
    hora_lord = get_hora(jd, data.tz_offset)

    # Full 24-hora schedule for the day
    local_jd = jd + data.tz_offset / 24.0
    day_of_week = int(local_jd + 1.5) % 7
    hora_schedule = []
    for h in range(24):
        hora_idx = (day_of_week * 24 + h) % 7
        hora_schedule.append({"hour": h, "lord": HORA_SEQUENCE[hora_idx], "time": f"{h:02d}:00"})

    # Moon speed for waxing/waning
    moon_r, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_SWIEPH | swe.FLG_SPEED)
    is_waxing = tithi_num <= 15

    return {
        "tithi": {"number": tithi_num, "name": tithi_name, "paksha": paksha},
        "vara": {"day": vara, "lord": vara_lord},
        "nakshatra": {"name": nakshatra, "lord": nak_lord, "pada": pada, "index": nak_idx},
        "yoga": {"name": yoga_name, "inauspicious": yoga_inauspicious},
        "karana": {"name": karana_name, "inauspicious": karana_inauspicious},
        "hora": {"lord": hora_lord, "schedule": hora_schedule},
        "moon": {"longitude": round(moon_lon, 4), "is_waxing": is_waxing, "speed": round(moon_r[3], 4)},
        "sun": {"longitude": round(sun_lon, 4)},
        "date": f"{data.year}-{data.month:02d}-{data.day:02d} {data.hour:02d}:{data.minute:02d}",
    }
