"""
Birth Time Rectification tool.
User provides life events with dates; we test birth times ±30 min in steps
and score each candidate time by how well key events align with dashas/transits.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    get_vimshottari_dasha, jd_to_datetime, SIGNS
)
import swisseph as swe
from datetime import datetime

router = APIRouter()


EVENT_HOUSE_RELEVANCE = {
    "marriage":     [7, 2, 5],
    "divorce":      [7, 2, 12],
    "child":        [5, 9],
    "job":          [10, 6, 2],
    "job_loss":     [10, 6, 12],
    "death_family": [8, 4, 12],
    "relocation":   [4, 9, 12],
    "accident":     [8, 6, 1],
    "property":     [4, 2],
    "education":    [4, 5, 9],
    "other":        [1],
}

# Planets relevant to each event type
EVENT_PLANET_RELEVANCE = {
    "marriage":     ["Venus", "Jupiter", "Moon"],
    "divorce":      ["Mars", "Rahu", "Saturn"],
    "child":        ["Jupiter", "Moon", "Venus"],
    "job":          ["Sun", "Saturn", "Jupiter", "Mercury"],
    "job_loss":     ["Saturn", "Rahu", "Ketu"],
    "death_family": ["Saturn", "Ketu", "Mars"],
    "relocation":   ["Rahu", "Ketu", "Saturn"],
    "accident":     ["Mars", "Rahu", "Saturn"],
    "property":     ["Venus", "Jupiter", "Moon"],
    "education":    ["Mercury", "Jupiter", "Venus"],
    "other":        [],
}


class LifeEvent(BaseModel):
    year: int
    month: int = 6
    day: int = 15
    event_type: str = "other"
    description: str = ""


class RectificationRequest(BaseModel):
    year: int; month: int; day: int
    hour: int; minute: int; tz_offset: float
    latitude: float; longitude: float
    ayanamsa: str = "lahiri"
    events: list[LifeEvent] = []
    range_minutes: int = 60   # test ±range_minutes around given time
    step_minutes: int = 2


def score_candidate(birth_jd: float, req: RectificationRequest, lat: float, lon: float) -> float:
    """Score a birth time against life events. Higher = better fit."""
    try:
        planets = calculate_planets(birth_jd, req.ayanamsa)
        moon_lon = planets["Moon"]["longitude"]
        dashas = get_vimshottari_dasha(moon_lon, birth_jd)
    except Exception:
        return 0.0

    total_score = 0.0

    for event in req.events:
        try:
            event_jd = swe.julday(event.year, event.month, event.day, 12.0)
        except Exception:
            continue

        relevant_planets = EVENT_PLANET_RELEVANCE.get(event.event_type, [])
        relevant_houses = EVENT_HOUSE_RELEVANCE.get(event.event_type, [1])

        # Check if event falls in a relevant dasha
        for d in dashas:
            if d["start_jd"] <= event_jd <= d["end_jd"]:
                lord = d["lord"]
                if lord in relevant_planets:
                    total_score += 3.0
                else:
                    total_score += 0.5
                break

        # Check antardasha (sub-period)
        for d in dashas:
            if d["start_jd"] <= event_jd <= d["end_jd"]:
                for ad in d.get("antardashas", []):
                    if ad.get("start_jd", 0) <= event_jd <= ad.get("end_jd", 0):
                        if ad["lord"] in relevant_planets:
                            total_score += 2.0
                        break
                break

        # Check transit at event date
        try:
            transit_planets = calculate_planets(event_jd, req.ayanamsa)
            house_data = calculate_houses(birth_jd, lat, lon, req.ayanamsa)
            asc_idx = house_data["ascendant"]["sign_index"]
            for p_name, p_data in transit_planets.items():
                if p_name in relevant_planets:
                    p_house = ((p_data["sign_index"] - asc_idx) % 12) + 1
                    if p_house in relevant_houses:
                        total_score += 1.0
        except Exception:
            pass

    return total_score


@router.post("/rectification")
def rectify_birth_time(req: RectificationRequest):
    if not req.events:
        return {"error": "Provide at least one life event for rectification"}

    # Generate candidate times
    base_minutes = req.hour * 60 + req.minute
    step = max(1, req.step_minutes)
    rng = min(req.range_minutes, 120)  # cap at ±2 hours

    candidates = []
    for offset in range(-rng, rng + 1, step):
        total_min = base_minutes + offset
        if total_min < 0 or total_min >= 24 * 60:
            continue
        h = total_min // 60
        m = total_min % 60
        try:
            jd = birth_to_jd(req.year, req.month, req.day, h, m, req.tz_offset)
            score = score_candidate(jd, req, req.latitude, req.longitude)
            house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
            asc = house_data["ascendant"]
            candidates.append({
                "hour": h, "minute": m,
                "time": f"{h:02d}:{m:02d}",
                "offset_minutes": offset,
                "score": round(score, 2),
                "lagna": asc["sign"],
                "lagna_degree": round(asc["degree"], 2),
            })
        except Exception:
            continue

    if not candidates:
        return {"error": "No valid candidates generated"}

    candidates.sort(key=lambda x: -x["score"])
    best = candidates[0]

    return {
        "best_time": best,
        "top_candidates": candidates[:10],
        "all_candidates": candidates,
        "events_tested": len(req.events),
        "note": "Scores based on dasha lord alignment + transit matches for event types. Higher = better fit.",
    }
