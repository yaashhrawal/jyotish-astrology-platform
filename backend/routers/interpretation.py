"""
Interpretation API — exposes the rule-based engine (core/interpretation).
Public (calc-prefixed): deterministic, no auth needed. Every returned factor carries
its source rule; the seeker narrative carries a per-prediction rule citation.
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (birth_to_jd, calculate_planets, calculate_houses,
                         assign_planets_to_houses, get_vimshottari_dasha, jd_to_datetime)
from core.interpretation.analyze import analyze, analyze_varga
from core.interpretation.topics import all_topics, get_topic
from core.interpretation.dasha import dasha_reading
from core.interpretation.planet import planet_reading
from core.engine import VIMSHOTTARI_SEQUENCE, VIMSHOTTARI_YEARS


def _antardashas_jd(maha_lord, maha_start_jd, maha_years):
    """Antardasha boundaries as Julian Days (for as-of comparison)."""
    out = []
    idx = VIMSHOTTARI_SEQUENCE.index(maha_lord)
    cur = maha_start_jd
    for i in range(9):
        lord = VIMSHOTTARI_SEQUENCE[(idx + i) % 9]
        yrs = (VIMSHOTTARI_YEARS[lord] / 120) * maha_years
        end = cur + yrs * 365.25
        out.append({"lord": lord, "start_jd": cur, "end_jd": end, "years": round(yrs, 3)})
        cur = end
    return out

router = APIRouter(tags=["interpretation"])

_COMPOSITES = ["love", "family", "travel"]


class InterpretRequest(BaseModel):
    name: str = ""
    year: int
    month: int
    day: int
    hour: int
    minute: int
    tz_offset: float = 5.5
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"
    topic: str = "career"       # a topic key, or "all"
    varga: int = 1              # 1 = D1 (rashi); >1 judges the topic inside that divisional
    scheme: str = "parashari"


def _asof_jd() -> float:
    now = datetime.now(timezone.utc)
    return birth_to_jd(now.year, now.month, now.day, now.hour, now.minute, 0)


@router.get("/interpret/topics")
def list_topics():
    out = []
    for k in all_topics():
        cfg = get_topic(k)
        out.append({"key": k, "label": cfg["label"],
                    "house": cfg.get("house"), "houses": cfg.get("houses"),
                    "primary_varga": cfg.get("primary_varga")})
    return {"topics": out}


@router.post("/interpret")
def interpret(req: InterpretRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    houses = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    lagna = houses["ascendant"]["sign_index"]
    assign_planets_to_houses(planets, lagna)
    asof = _asof_jd()

    keys = all_topics() if req.topic == "all" else [req.topic]
    results = []
    for t in keys:
        if req.varga and req.varga != 1:
            results.append(analyze_varga(t, planets, lagna, jd, asof, req.varga, req.scheme))
        else:
            results.append(analyze(t, planets, lagna, jd, asof, req.scheme))

    return {
        "topic": req.topic, "varga": f"D{req.varga}", "scheme": req.scheme,
        "ascendant": houses["ascendant"]["sign"],
        "results": results,
    }


_SPECIAL_ASP = {"Mars": [4, 8], "Jupiter": [5, 9], "Saturn": [3, 10]}


class PlanetInterpretRequest(BaseModel):
    name: str = ""
    year: int; month: int; day: int; hour: int; minute: int
    tz_offset: float = 5.5
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    planet: str
    varga: int = 1
    scheme: str = "parashari"


@router.post("/interpret-planet")
def interpret_planet(req: PlanetInterpretRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    houses = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    lagna = houses["ascendant"]["sign_index"]
    assign_planets_to_houses(planets, lagna)

    varga_name = ""
    if req.varga and req.varga != 1:
        from core.varga import calculate_varga
        from core.interpretation.varga_domains import varga_info
        vc = calculate_varga(planets, lagna * 30 + 1, req.varga)
        planets = vc["planets"]; lagna = vc["ascendant"]["sign_index"]
        varga_name = varga_info(req.varga)["name"]

    def house_of(p): return ((planets[p]["sign_index"] - lagna) % 12) + 1
    tgt_house = house_of(req.planet)
    aspects_on = []
    for a in planets:
        ah = house_of(a)
        targets = {((ah - 1 + 6) % 12) + 1}
        for off in _SPECIAL_ASP.get(a, []):
            targets.add(((ah - 1 + off - 1) % 12) + 1)
        if tgt_house in targets and a != req.planet:
            aspects_on.append({"planet": a})

    return planet_reading(req.planet, planets, lagna, req.scheme,
                          aspects_on_planet=aspects_on, varga_num=req.varga, varga_name=varga_name)


class DashaPredictRequest(BaseModel):
    name: str = ""
    year: int; month: int; day: int; hour: int; minute: int
    tz_offset: float = 5.5
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    scheme: str = "parashari"
    maha: str = ""     # if set (with antar), return the full detail for that one pair
    antar: str = ""


def _summary(r, lord, s_jd, e_jd, running):
    return {"lord": lord, "start": jd_to_datetime(s_jd), "end": jd_to_datetime(e_jd),
            "net": r["net"], "tension": r["tension"], "headline": r["narrative"]["headline"],
            "running": running}


@router.post("/dasha-predict")
def dasha_predict(req: DashaPredictRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    houses = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    lagna = houses["ascendant"]["sign_index"]
    assign_planets_to_houses(planets, lagna)
    mahas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
    asof = _asof_jd()

    # On-demand full detail for a single maha (+optional antar) — for click-to-expand.
    if req.maha:
        r = dasha_reading(planets, lagna, req.maha, req.antar or None, req.scheme)
        return {"detail": r}

    cur_maha = next((d for d in mahas if d["start_jd"] <= asof < d["end_jd"]), mahas[0])
    cur_antar_lord = None
    tree = []
    for d in mahas[:9]:
        m_running = d["start_jd"] <= asof < d["end_jd"]
        mr = dasha_reading(planets, lagna, d["lord"], None, req.scheme)
        antars = _antardashas_jd(d["lord"], d["start_jd"], d["years"])
        asum = []
        for a in antars:
            a_running = a["start_jd"] <= asof < a["end_jd"]
            if m_running and a_running:
                cur_antar_lord = a["lord"]
            ar = dasha_reading(planets, lagna, d["lord"], a["lord"], req.scheme)
            asum.append(_summary(ar, a["lord"], a["start_jd"], a["end_jd"], a_running))
        tree.append({
            "lord": d["lord"], "start": jd_to_datetime(d["start_jd"]),
            "end": jd_to_datetime(d["end_jd"]), "years": d["years"], "running": m_running,
            "net": mr["net"], "tension": mr["tension"], "headline": mr["narrative"]["headline"],
            "reading": mr, "antardashas": asum,
        })

    return {
        "ascendant": houses["ascendant"]["sign"],
        "current": {"maha": cur_maha["lord"], "antar": cur_antar_lord},
        "mahadashas": tree,
    }
