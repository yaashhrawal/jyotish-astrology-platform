from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, assign_planets_to_houses, calculate_atmakaraka
from core.shadbala import compute_shadbala

router = APIRouter(tags=["shadbala"])


class ShadbaladRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: int
    minute: int
    tz_offset: float = 5.5
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"
    is_day_birth: bool = True


@router.post("/shadbala")
async def shadbala(req: ShadbaladRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    assign_planets_to_houses(planets, asc["sign_index"])

    sun_lon = planets.get("Sun", {}).get("longitude", 0)
    moon_lon = planets.get("Moon", {}).get("longitude", 90)
    moon_phase = (moon_lon - sun_lon) % 360

    result = compute_shadbala(planets, asc, req.is_day_birth, moon_phase)
    return {"shadbala": result}
