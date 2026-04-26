"""
Bhava Madhya (House Midpoints) — midpoint of each house cusp.
Also exports planet positions as CSV-ready data.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses, SIGNS

router = APIRouter()


class BhavaMadhyaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/bhava_madhya")
def compute_bhava_madhya(req: BhavaMadhyaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    houses = house_data["houses"]
    asc = house_data["ascendant"]

    # houses dict may only have keys 1-11; derive H12 from ascendant if missing
    h12_lon = houses[12]["cusp_longitude"] if 12 in houses else asc["longitude"]
    cusp_lons = [houses[i]["cusp_longitude"] if i in houses else h12_lon for i in range(1, 13)]

    madhya_list = []
    for i in range(12):
        start = cusp_lons[i]
        end = cusp_lons[(i + 1) % 12]
        if end < start:
            end += 360
        mid = ((start + end) / 2) % 360
        sign_idx = int(mid / 30)
        deg = mid % 30
        madhya_list.append({
            "house": i + 1,
            "cusp_start": round(start, 4),
            "cusp_end": round(cusp_lons[(i + 1) % 12], 4),
            "madhya_longitude": round(mid, 4),
            "madhya_sign": SIGNS[sign_idx],
            "madhya_sign_idx": sign_idx,
            "madhya_degree": round(deg, 4),
        })

    # Planet CSV data
    planet_csv = []
    asc_sign_idx = asc["sign_index"]
    for name, pd in planets.items():
        house = (pd["sign_index"] - asc_sign_idx) % 12 + 1
        planet_csv.append({
            "planet": name,
            "sign": pd["sign"],
            "degree": round(pd["degree"], 4),
            "longitude": pd["longitude"],
            "nakshatra": pd["nakshatra"],
            "nakshatra_lord": pd["nakshatra_lord"],
            "pada": pd["pada"],
            "house": house,
            "retrograde": pd["retrograde"],
            "status": pd["status"],
        })

    return {
        "ascendant": asc,
        "bhava_madhya": madhya_list,
        "planets": planet_csv,
    }
