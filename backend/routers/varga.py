from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, calculate_houses
from core.varga import calculate_varga, check_vargottama, VARGA_NAMES, VARGA_DOMAINS

router = APIRouter()

AVAILABLE_VARGAS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60, 81, 108, 144]


class BirthData(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int
    tz_offset: float; latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    d: int = 9  # which divisional chart


@router.post("/varga")
def get_varga(data: BirthData):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa)
    house_data = calculate_houses(jd, data.latitude, data.longitude, data.ayanamsa)
    asc_lon = house_data["ascendant"]["longitude"]

    varga = calculate_varga(planets, asc_lon, data.d)

    # Also check vargottama if D9
    vargottama = []
    if data.d == 9:
        d1_data = calculate_varga(planets, asc_lon, 1)
        vargottama = check_vargottama(d1_data["planets"], varga["planets"])

    return {**varga, "vargottama": vargottama}


@router.get("/varga/list")
def list_vargas():
    return [
        {"d": d, "name": VARGA_NAMES.get(d, f"D{d}"), "domain": VARGA_DOMAINS.get(d, "")}
        for d in AVAILABLE_VARGAS
    ]


# ── Hora Variants ─────────────────────────────────────────────────────────────

SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]


def hora_parashari(lon: float) -> str:
    """Standard Parashari: odd→Sun/Moon, even→Moon/Sun halves."""
    sign = int(lon / 30) % 12
    deg = lon % 30
    is_odd = (sign % 2 == 0)
    first_half = deg < 15
    if is_odd:
        return "Sun Hora (Leo)" if first_half else "Moon Hora (Cancer)"
    else:
        return "Moon Hora (Cancer)" if first_half else "Sun Hora (Leo)"


def hora_kashinatha(lon: float) -> str:
    """Kashinatha: same as Parashari for movable/fixed; dual signs split 20-10."""
    sign = int(lon / 30) % 12
    deg = lon % 30
    sign_name = SIGNS[sign]
    dual = sign_name in {"Gemini", "Virgo", "Sagittarius", "Pisces"}
    is_odd = (sign % 2 == 0)
    first_part = deg < (20 if dual else 15)
    if is_odd:
        return "Sun Hora" if first_part else "Moon Hora"
    else:
        return "Moon Hora" if first_part else "Sun Hora"


def hora_tajika(lon: float) -> str:
    """Tajika/Persian: 7-planet hora lords cycle through each 60-min hour."""
    sign = int(lon / 30) % 12
    deg = lon % 30
    # 30° divided into 12 parts of 2.5° each, cycling through: Sun Moon Mars Mercury Jupiter Venus Saturn
    HORA_LORDS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]
    part = int(deg / 2.5) % 7
    lord_idx = (sign * 12 + part) % 7
    return f"{HORA_LORDS[lord_idx]} Hora"


def hora_nadi(lon: float) -> str:
    """Nadi Hora: 3 sections per sign — Sun, Moon, Jupiter."""
    sign = int(lon / 30) % 12
    deg = lon % 30
    lords = ["Sun", "Moon", "Jupiter"]
    part = int(deg / 10)
    return f"{lords[part]} Hora"


def hora_kala(lon: float) -> str:
    """Kala Hora / Planetary Hour — 7 classical planets, day/night rulership."""
    sign = int(lon / 30) % 12
    deg = lon % 30
    HORA_ORDER = ["Sun","Venus","Mercury","Moon","Saturn","Jupiter","Mars"]
    hour_part = int((sign * 30 + deg) / (210 / 7)) % 7
    return f"{HORA_ORDER[hour_part]} Hora"


def hora_bmk(lon: float) -> str:
    """B.V. Raman: same as Parashari but labels show sign (Leo/Cancer) explicitly."""
    sign = int(lon / 30) % 12
    deg = lon % 30
    is_odd = (sign % 2 == 0)
    first_half = deg < 15
    if is_odd:
        return "Leo Hora (Sun)" if first_half else "Cancer Hora (Moon)"
    else:
        return "Cancer Hora (Moon)" if first_half else "Leo Hora (Sun)"


class HoraRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int
    tz_offset: float; latitude: float; longitude: float
    ayanamsa: str = "lahiri"


@router.post("/hora_variants")
def get_hora_variants(data: HoraRequest):
    jd = birth_to_jd(data.year, data.month, data.day, data.hour, data.minute, data.tz_offset)
    planets = calculate_planets(jd, data.ayanamsa)

    HORA_METHODS = {
        "Parashari": hora_parashari,
        "Kashinatha": hora_kashinatha,
        "Tajika/Persian": hora_tajika,
        "Nadi (Sun-Moon-Jupiter)": hora_nadi,
        "BV Raman": hora_bmk,
    }

    result = {}
    for planet, pdata in planets.items():
        lon = pdata["longitude"]
        result[planet] = {
            "sign": pdata["sign"],
            "degree": round(pdata["degree"], 2),
            "horas": {method: fn(lon) for method, fn in HORA_METHODS.items()}
        }

    return {
        "planets": result,
        "methods": list(HORA_METHODS.keys()),
        "note": "Hora shows which planetary hour lord governs each planet's exact degree."
    }
