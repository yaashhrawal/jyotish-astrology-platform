from fastapi import APIRouter
from datetime import datetime, timezone
from core.engine import calculate_planets, SIGNS
import swisseph as swe

router = APIRouter()

TITHI_NAMES = [
    "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami",
    "Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi",
    "Purnima/Amavasya"
]

HORA_LORDS = {
    0: ["Sun","Venus","Mercury","Moon","Saturn","Jupiter","Mars"],   # Sunday sequence
    1: ["Moon","Saturn","Jupiter","Mars","Sun","Venus","Mercury"],   # Monday
    2: ["Mars","Sun","Venus","Mercury","Moon","Saturn","Jupiter"],   # Tuesday
    3: ["Mercury","Moon","Saturn","Jupiter","Mars","Sun","Venus"],   # Wednesday
    4: ["Jupiter","Mars","Sun","Venus","Mercury","Moon","Saturn"],   # Thursday
    5: ["Venus","Mercury","Moon","Saturn","Jupiter","Mars","Sun"],   # Friday
    6: ["Saturn","Jupiter","Mars","Sun","Venus","Mercury","Moon"],   # Saturday
}


def get_current_tithi(jd: float, ayanamsa: str = "lahiri") -> dict:
    planets = calculate_planets(jd, ayanamsa)
    sun_lon = planets["Sun"]["longitude"]
    moon_lon = planets["Moon"]["longitude"]
    diff = (moon_lon - sun_lon) % 360
    tithi_num = int(diff / 12) + 1
    paksha = "Shukla" if tithi_num <= 15 else "Krishna"
    tithi_name = TITHI_NAMES[min((tithi_num - 1) % 15, 14)]
    return {"tithi": tithi_num, "name": f"{paksha} {tithi_name}", "paksha": paksha}


def get_hora_lord(jd: float) -> str:
    y, m, d, h = swe.revjul(jd)
    from datetime import datetime
    dt = datetime(y, m, d)
    weekday = dt.weekday()  # 0=Mon, 6=Sun
    # Convert to Sun=0 format
    sun_weekday = (weekday + 1) % 7
    hour_of_day = int(h)
    hora_idx = hour_of_day % 7
    return HORA_LORDS[sun_weekday][hora_idx]


@router.get("/sky")
def get_current_sky(ayanamsa: str = "lahiri"):
    """Full current sky snapshot — all planets + tithi + hora + current lagna."""
    now = datetime.now(timezone.utc)
    jd = swe.julday(now.year, now.month, now.day, now.hour + now.minute/60.0)
    planets = calculate_planets(jd, ayanamsa)
    tithi = get_current_tithi(jd, ayanamsa)
    hora = get_hora_lord(jd)

    # Current nakshatra (Moon's nakshatra)
    moon_nak = planets["Moon"]["nakshatra"]
    moon_nak_lord = planets["Moon"]["nakshatra_lord"]

    return {
        "timestamp": now.isoformat(),
        "planets": planets,
        "tithi": tithi,
        "hora_lord": hora,
        "current_nakshatra": moon_nak,
        "nakshatra_lord": moon_nak_lord,
        "moon_sign": planets["Moon"]["sign"],
        "sun_sign": planets["Sun"]["sign"],
    }
