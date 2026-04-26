from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, calculate_atmakaraka, get_vimshottari_dasha, jd_to_datetime
)

router = APIRouter()


class BirthData(BaseModel):
    name: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    tz_offset: float       # e.g. 5.5 for IST
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"
    house_system: str = "placidus"
    node_type: str = "true"
    place: str = ""


@router.post("/chart")
def get_chart(data: BirthData):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa, data.node_type)
    house_data = calculate_houses(jd, data.latitude, data.longitude, data.ayanamsa, data.house_system)
    asc = house_data["ascendant"]
    planet_house_map = assign_planets_to_houses(planets, asc["sign_index"])
    atmakaraka = calculate_atmakaraka(planets)
    dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)

    # Format dashas with readable dates
    dasha_list = []
    for d in dashas[:12]:  # first 12 periods
        dasha_list.append({
            "lord": d["lord"],
            "start": jd_to_datetime(d["start_jd"]),
            "end": jd_to_datetime(d["end_jd"]),
            "years": d["years"],
        })

    return {
        "name": data.name,
        "birth": f"{data.year}-{data.month:02d}-{data.day:02d} {data.hour:02d}:{data.minute:02d}",
        "place": data.place,
        "ayanamsa": data.ayanamsa,
        "julian_day": jd,
        "ascendant": asc,
        "planets": planets,
        "houses": house_data["houses"],
        "planet_house_map": planet_house_map,
        "atmakaraka": atmakaraka,
        "dashas": dasha_list,
    }
