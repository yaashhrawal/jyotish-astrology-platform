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


class DashaPredictRequest(BaseModel):
    name: str = ""
    year: int; month: int; day: int; hour: int; minute: int
    tz_offset: float = 5.5
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    scheme: str = "parashari"


@router.post("/dasha-predict")
def dasha_predict(req: DashaPredictRequest):
    jd = birth_to_jd(req.year, req.month, req.day, req.hour, req.minute, req.tz_offset)
    planets = calculate_planets(jd, req.ayanamsa)
    houses = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    lagna = houses["ascendant"]["sign_index"]
    assign_planets_to_houses(planets, lagna)

    mahas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
    asof = _asof_jd()

    # current maha + antar
    cur_maha = next((d for d in mahas if d["start_jd"] <= asof < d["end_jd"]), mahas[0])
    antars = _antardashas_jd(cur_maha["lord"], cur_maha["start_jd"], cur_maha["years"])
    cur_antar = next((a for a in antars if a["start_jd"] <= asof < a["end_jd"]), antars[0] if antars else None)

    current = dasha_reading(planets, lagna, cur_maha["lord"],
                            cur_antar["lord"] if cur_antar else None, req.scheme)
    current["period"] = {
        "maha": cur_maha["lord"], "antar": cur_antar["lord"] if cur_antar else None,
        "maha_start": jd_to_datetime(cur_maha["start_jd"]), "maha_end": jd_to_datetime(cur_maha["end_jd"]),
        "antar_start": jd_to_datetime(cur_antar["start_jd"]) if cur_antar else None,
        "antar_end": jd_to_datetime(cur_antar["end_jd"]) if cur_antar else None,
    }

    # timeline: each mahadasha with a one-line verdict
    timeline = []
    for d in mahas[:9]:
        r = dasha_reading(planets, lagna, d["lord"], None, req.scheme)
        timeline.append({
            "lord": d["lord"], "start": jd_to_datetime(d["start_jd"]),
            "end": jd_to_datetime(d["end_jd"]), "years": d["years"],
            "net": r["net"], "tension": r["tension"], "headline": r["narrative"]["headline"],
            "running": d["start_jd"] <= asof < d["end_jd"],
        })

    return {"ascendant": houses["ascendant"]["sign"], "current": current, "timeline": timeline}
