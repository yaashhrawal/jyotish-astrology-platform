"""
Interpretation API — exposes the rule-based engine (core/interpretation).
Public (calc-prefixed): deterministic, no auth needed. Every returned factor carries
its source rule; the seeker narrative carries a per-prediction rule citation.
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import (birth_to_jd, calculate_planets, calculate_houses,
                         assign_planets_to_houses)
from core.interpretation.analyze import analyze, analyze_varga
from core.interpretation.topics import all_topics, get_topic

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
