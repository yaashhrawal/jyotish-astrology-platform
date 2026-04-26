"""
Varga-based Dasha: Vimshottari keyed to a specific varga lagna's nakshatra.
Useful for timing: D9 lagna → marriage events, D10 lagna → career events, etc.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    get_vimshottari_dasha, jd_to_datetime, NAKSHATRAS, NAKSHATRA_LORDS
)
from core.varga import calculate_varga
import swisseph as swe

router = APIRouter()

VARGA_DOMAIN = {
    1: "Overall life", 2: "Wealth", 3: "Siblings", 4: "Property",
    7: "Children", 9: "Spouse/Marriage", 10: "Career", 12: "Parents",
    16: "Vehicles", 20: "Spirituality", 24: "Education", 27: "Strength",
    30: "Misfortunes", 40: "Maternal ancestry", 45: "Paternal ancestry", 60: "Past karma",
}


class VargaDashaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    d: int = 9   # which divisional chart lagna to use


@router.post("/varga_dasha")
def compute_varga_dasha(req: VargaDashaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc_lon = house_data["ascendant"]["longitude"]

    # Get varga chart lagna longitude
    varga = calculate_varga(planets, asc_lon, req.d)
    varga_asc_sign_idx = varga["ascendant"]["sign_index"]

    # We need the actual longitude within that sign for nakshatra calculation.
    # Use Ascendant's position within D1, then scale to Dn.
    # Approximate: varga lagna = varga_asc_sign_idx * 30 + (asc_lon % 30 * req.d % 30)
    deg_in_sign = (asc_lon % 30 * req.d) % 30
    varga_asc_lon = varga_asc_sign_idx * 30 + deg_in_sign

    # Get nakshatra from varga lagna longitude
    nak_idx = int(varga_asc_lon / (360 / 27))
    nak_lord = NAKSHATRA_LORDS[nak_idx]

    # Run Vimshottari from this point
    dashas = get_vimshottari_dasha(varga_asc_lon, jd)

    # Add active markers
    from datetime import datetime
    now = datetime.utcnow()
    now_jd = swe.julday(now.year, now.month, now.day, now.hour)

    result_dashas = []
    for d in dashas[:15]:
        is_active = d["start_jd"] <= now_jd <= d["end_jd"]
        antars = []
        for ad in d.get("antardashas", [])[:9]:
            antars.append({
                "lord": ad["lord"],
                "start": jd_to_datetime(ad["start_jd"]),
                "end": jd_to_datetime(ad["end_jd"]),
                "years": round(ad["years"], 3),
                "is_active": ad["start_jd"] <= now_jd <= ad["end_jd"],
            })
        result_dashas.append({
            "lord": d["lord"],
            "start": jd_to_datetime(d["start_jd"]),
            "end": jd_to_datetime(d["end_jd"]),
            "years": round(d["years"], 3),
            "is_active": is_active,
            "antardashas": antars,
        })

    return {
        "d": req.d,
        "varga_name": f"D{req.d}",
        "domain": VARGA_DOMAIN.get(req.d, f"D{req.d} matters"),
        "varga_lagna": NAKSHATRAS[nak_idx],
        "varga_lagna_lord": nak_lord,
        "dashas": result_dashas,
        "note": f"Vimshottari timed to D{req.d} Lagna nakshatra — activates D{req.d} significations.",
    }
