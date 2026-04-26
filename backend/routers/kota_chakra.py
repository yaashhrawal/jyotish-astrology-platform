"""
Kota Chakra — 9-zone fortress wheel showing protection/vulnerability of natal Moon.
Zones (outer to inner): Praakara, Kota, Stambha, Dvara (4), Bahya, Madhya, Abhyantara, Kendra.
Planets transiting each zone = protection or danger.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, NAKSHATRAS
import swisseph as swe
from datetime import datetime

router = APIRouter()

# Kota Chakra: 28 nakshatras in 8 zones (Abhijit included)
# Zone assignment based on count from natal Moon nakshatra
ZONE_NAMES = [
    "Kendra (Inner Fort)",     # 1st — natal Moon's nak
    "Madhya",                   # 2nd
    "Bahya",                    # 3rd
    "Dvara 1",                  # 4th
    "Dvara 2",                  # 5th
    "Stambha",                  # 6th
    "Praakara",                 # 7th — outer wall
    "Bahir Kota (Outside)",     # 8th — enemy zone
]

ZONE_NATURE = [
    "protected",   # Kendra
    "protected",   # Madhya
    "neutral",     # Bahya
    "neutral",     # Dvara 1
    "hostile",     # Dvara 2
    "hostile",     # Stambha
    "hostile",     # Praakara
    "danger",      # Bahir Kota
]

# Traditional: naks 1,2,3 = Kendra; 4,5,6 = Madhya; 7,8,9=Bahya; 10,11,12=Dvara1;
#              13,14,15=Dvara2; 16,17,18=Stambha; 19,20,21=Praakara; 22-28=Bahir
def get_zone(natal_nak: int, transit_nak: int) -> dict:
    diff = (transit_nak - natal_nak) % 28
    if diff <= 2:
        zone_idx = 0
    elif diff <= 5:
        zone_idx = 1
    elif diff <= 8:
        zone_idx = 2
    elif diff <= 11:
        zone_idx = 3
    elif diff <= 14:
        zone_idx = 4
    elif diff <= 17:
        zone_idx = 5
    elif diff <= 20:
        zone_idx = 6
    else:
        zone_idx = 7
    return {
        "zone_index": zone_idx,
        "zone": ZONE_NAMES[zone_idx],
        "nature": ZONE_NATURE[zone_idx],
        "nak_distance": diff,
    }


class KotaRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/kota_chakra")
def compute_kota(req: KotaRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    natal = calculate_planets(jd, req.ayanamsa)

    now = datetime.utcnow()
    transit_jd = swe.julday(now.year, now.month, now.day, now.hour)
    transit = calculate_planets(transit_jd, req.ayanamsa)

    moon_lon = natal["Moon"]["longitude"]
    natal_moon_nak = int(moon_lon / (360 / 27))

    planet_zones = []
    for name, pd in transit.items():
        t_nak = int(pd["longitude"] / (360 / 27))
        zone = get_zone(natal_moon_nak, t_nak)
        planet_zones.append({
            "planet": name,
            "transit_sign": pd["sign"],
            "transit_nakshatra": pd["nakshatra"],
            "transit_nak_idx": t_nak,
            **zone,
        })

    # Sort by zone (inner to outer)
    planet_zones.sort(key=lambda x: x["zone_index"])

    # Summary by zone
    zones_summary = []
    for i, (zname, znature) in enumerate(zip(ZONE_NAMES, ZONE_NATURE)):
        planets_here = [p for p in planet_zones if p["zone_index"] == i]
        zones_summary.append({
            "zone_index": i,
            "zone": zname,
            "nature": znature,
            "planets": [p["planet"] for p in planets_here],
        })

    # Protection score: planets in protected zones
    protected = [p for p in planet_zones if p["nature"] == "protected"]
    hostile = [p for p in planet_zones if p["nature"] in ("hostile", "danger")]

    return {
        "natal_moon_nakshatra": NAKSHATRAS[natal_moon_nak],
        "natal_moon_nak_idx": natal_moon_nak,
        "planet_zones": planet_zones,
        "zones_summary": zones_summary,
        "protected_planets": [p["planet"] for p in protected],
        "hostile_planets": [p["planet"] for p in hostile],
        "protection_score": len(protected),
        "hostility_score": len(hostile),
        "overall": "protected" if len(protected) > len(hostile) else "vulnerable" if len(hostile) > len(protected) else "neutral",
    }
