from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
from core.engine import calculate_planets, get_ayanamsa, birth_to_jd
import swisseph as swe

router = APIRouter()


class TransitRequest(BaseModel):
    # Natal chart birth data
    birth_year: int
    birth_month: int
    birth_day: int
    birth_hour: int
    birth_minute: int
    birth_tz_offset: float
    birth_lat: float
    birth_lon: float
    ayanamsa: str = "lahiri"
    # Optional: transit date (defaults to now)
    transit_year: int | None = None
    transit_month: int | None = None
    transit_day: int | None = None
    transit_hour: int | None = None
    transit_minute: int | None = None
    transit_tz_offset: float = 5.5


@router.post("/transit")
def get_transit(data: TransitRequest):
    # Natal chart
    natal_jd = birth_to_jd(
        data.birth_year, data.birth_month, data.birth_day,
        data.birth_hour, data.birth_minute, data.birth_tz_offset
    )
    natal_planets = calculate_planets(natal_jd, data.ayanamsa)

    # Transit date. If the user supplied one, treat its time as LOCAL (their
    # transit_tz_offset). Otherwise use "now" in UTC — and pass tz_offset=0 so
    # birth_to_jd doesn't subtract the offset a second time (was double-counting
    # ~5.5h and putting the transit chart in the past).
    now = datetime.now(timezone.utc)
    if data.transit_year:
        ty, tm, td = data.transit_year, data.transit_month or now.month, data.transit_day or now.day
        th = data.transit_hour if data.transit_hour is not None else 12
        tmin = data.transit_minute if data.transit_minute is not None else 0
        transit_jd = birth_to_jd(ty, tm, td, th, tmin, data.transit_tz_offset)
    else:
        ty, tm, td, th, tmin = now.year, now.month, now.day, now.hour, now.minute
        transit_jd = birth_to_jd(ty, tm, td, th, tmin, 0.0)
    transit_planets = calculate_planets(transit_jd, data.ayanamsa)

    return {
        "transit_date": f"{ty}-{tm:02d}-{td:02d} {th:02d}:{tmin:02d}",
        "natal": natal_planets,
        "transit": transit_planets,
    }


@router.get("/live")
def get_live_planets(ayanamsa: str = "lahiri"):
    """Current real-time planet positions."""
    now = datetime.now(timezone.utc)
    jd = swe.julday(now.year, now.month, now.day, now.hour + now.minute / 60.0)
    planets = calculate_planets(jd, ayanamsa)
    return {
        "timestamp": now.isoformat(),
        "planets": planets,
    }
