"""
Research Lab: chart atlas browser, multi-filter queries, pattern search, saved queries.
"""
import uuid
import json
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from core.db import get_pool
from core.auth import get_current_user

router = APIRouter(tags=["research"])


# ── ATLAS (community famous charts) ──────────────────────────────────────────

@router.get("/research/atlas")
async def browse_atlas(
    ascendant: str = None,
    moon_sign: str = None,
    sun_sign: str = None,
    yoga: str = None,
    category: str = None,
    limit: int = 50,
    current_user=Depends(get_current_user)
):
    pool = await get_pool()
    filters = ["1=1"]
    vals = []
    i = 1
    if ascendant:
        filters.append(f"ascendant_sign=${i}"); vals.append(ascendant); i += 1
    if moon_sign:
        filters.append(f"moon_sign=${i}"); vals.append(moon_sign); i += 1
    if sun_sign:
        filters.append(f"sun_sign=${i}"); vals.append(sun_sign); i += 1
    if yoga:
        filters.append(f"${{i}} = ANY(yogas)"); vals.append(yoga); i += 1
    if category:
        filters.append(f"category=${i}"); vals.append(category); i += 1

    where = " AND ".join(filters)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT id,name,category,birth_date,birth_place,ascendant_sign,moon_sign,sun_sign,yogas,verified FROM atlas_charts WHERE {where} ORDER BY name LIMIT ${{i}}",
            *vals, limit
        )
    return [dict(r) for r in rows]


# ── FILTER CHARTS (research query on own + public charts) ────────────────────

@router.get("/research/filter")
async def filter_charts(
    ascendant: str = None,
    moon_sign: str = None,
    sun_sign: str = None,
    atmakaraka: str = None,
    yoga: str = None,
    active_md: str = None,
    planet: str = None,          # e.g. "mars"
    planet_sign: str = None,     # e.g. "Scorpio"
    planet_house: str = None,    # e.g. "10"
    planet_nakshatra: str = None,
    limit: int = 50,
    current_user=Depends(get_current_user)
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Base: user's own charts
        base_filters = ["c.user_id=$1"]
        vals = [current_user["sub"]]
        i = 2

        if ascendant:
            base_filters.append(f"c.ascendant_sign=${i}"); vals.append(ascendant); i += 1
        if moon_sign:
            base_filters.append(f"c.moon_sign=${i}"); vals.append(moon_sign); i += 1
        if sun_sign:
            base_filters.append(f"c.sun_sign=${i}"); vals.append(sun_sign); i += 1
        if atmakaraka:
            base_filters.append(f"c.atmakaraka=${i}"); vals.append(atmakaraka); i += 1
        if active_md:
            base_filters.append(f"c.active_md=${i}"); vals.append(active_md); i += 1
        if yoga:
            base_filters.append(f"${i} = ANY(c.yogas)"); vals.append(yoga); i += 1

        # Planet tag join
        join = ""
        if planet and (planet_sign or planet_house or planet_nakshatra):
            join = "JOIN chart_tags ct ON ct.chart_id = c.id"
            tag_conditions = [f"ct.tag_key LIKE ${i}"]
            vals.append(f"{planet.lower()}_%")
            i += 1
            if planet_sign:
                tag_conditions.append(f"(ct.tag_key=${i} AND ct.tag_value=${i+1})")
                vals += [f"{planet.lower()}_sign", planet_sign]; i += 2
            if planet_house:
                tag_conditions.append(f"(ct.tag_key=${i} AND ct.tag_value=${i+1})")
                vals += [f"{planet.lower()}_house", planet_house]; i += 2
            if planet_nakshatra:
                tag_conditions.append(f"(ct.tag_key=${i} AND ct.tag_value=${i+1})")
                vals += [f"{planet.lower()}_nakshatra", planet_nakshatra]; i += 2
            base_filters.append(f"({' OR '.join(tag_conditions[1:])})")

        where = " AND ".join(base_filters)
        rows = await conn.fetch(
            f"""SELECT DISTINCT c.id, c.name, c.birth_date, c.birth_place,
                       c.ascendant_sign, c.moon_sign, c.atmakaraka, c.active_md, c.yogas
                FROM charts c {join}
                WHERE {where}
                ORDER BY c.name LIMIT {limit}""",
            *vals
        )
    return {"count": len(rows), "charts": [dict(r) for r in rows]}


# ── SAVED RESEARCH QUERIES ────────────────────────────────────────────────────

class SaveQueryRequest(BaseModel):
    name: str
    description: str = ""
    filters: dict


@router.post("/research/queries")
async def save_query(req: SaveQueryRequest, current_user=Depends(get_current_user)):
    qid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO research_queries (id,user_id,name,description,filters) VALUES ($1,$2,$3,$4,$5)",
            qid, current_user["sub"], req.name, req.description, json.dumps(req.filters)
        )
    return {"query_id": qid}


@router.get("/research/queries")
async def list_queries(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id,name,description,filters,result_count,created_at,last_run FROM research_queries WHERE user_id=$1 ORDER BY created_at DESC",
            current_user["sub"]
        )
    return [dict(r) for r in rows]


# ── PATTERN STATS ─────────────────────────────────────────────────────────────

@router.get("/research/stats")
async def chart_stats(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        total = await conn.fetchval("SELECT COUNT(*) FROM charts WHERE user_id=$1", current_user["sub"])
        asc_dist = await conn.fetch(
            "SELECT ascendant_sign, COUNT(*) as count FROM charts WHERE user_id=$1 GROUP BY ascendant_sign ORDER BY count DESC",
            current_user["sub"]
        )
        yoga_dist = await conn.fetch(
            """SELECT unnest(yogas) as yoga, COUNT(*) as count
               FROM charts WHERE user_id=$1 AND yogas IS NOT NULL
               GROUP BY yoga ORDER BY count DESC LIMIT 10""",
            current_user["sub"]
        )
    return {
        "total_charts": total,
        "ascendant_distribution": [dict(r) for r in asc_dist],
        "top_yogas": [dict(r) for r in yoga_dist],
    }
