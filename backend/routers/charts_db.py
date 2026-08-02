"""
Saved charts CRUD — store calculated charts to DB with research lab indexes.
"""
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.db import get_pool
from core.auth import get_current_user
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, calculate_atmakaraka, get_vimshottari_dasha, jd_to_datetime
)
from routers.yogas import detect_yogas_internal

router = APIRouter(tags=["charts"])


class SaveChartRequest(BaseModel):
    name: str
    birth_date: str       # YYYY-MM-DD
    birth_time: str       # HH:MM
    birth_tz: float = 5.5
    birth_place: str
    latitude: float
    longitude: float
    ayanamsa: str = "lahiri"
    client_id: str = None
    is_public: bool = False


def _build_chart(req: SaveChartRequest) -> dict:
    y, m, d = map(int, req.birth_date.split("-"))
    h, mn = map(int, req.birth_time.split(":"))
    from core.engine import birth_to_jd, calculate_planets, calculate_houses, assign_planets_to_houses, calculate_atmakaraka, get_vimshottari_dasha, jd_to_datetime
    jd = birth_to_jd(y, m, d, h, mn, req.birth_tz)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    planet_house_map = assign_planets_to_houses(planets, asc["sign_index"])
    atmakaraka = calculate_atmakaraka(planets)
    dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
    dasha_list = [{"lord": d["lord"], "start": jd_to_datetime(d["start_jd"]), "end": jd_to_datetime(d["end_jd"]), "years": d["years"]} for d in dashas[:12]]
    return {
        "ascendant": asc,
        "planets": planets,
        "houses": house_data["houses"],
        "planet_house_map": planet_house_map,
        "atmakaraka": atmakaraka,
        "dashas": dasha_list,
    }


FREE_CHART_LIMIT = 3
# trial and paid plans get unlimited charts

@router.post("/charts/save")
async def save_chart(req: SaveChartRequest, current_user=Depends(get_current_user)):
    pool = await get_pool()
    from datetime import datetime, timezone
    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT plan, trial_ends_at FROM users WHERE id=$1", current_user["sub"]
        )
        plan = (user_row["plan"] if user_row else None) or "free"
        # Expire trial → downgrade to free automatically
        if plan == "trial" and user_row["trial_ends_at"] and user_row["trial_ends_at"] < datetime.now(timezone.utc):
            await conn.execute("UPDATE users SET plan='free' WHERE id=$1", current_user["sub"])
            plan = "free"
        if plan == "free":
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM charts WHERE user_id=$1", current_user["sub"]
            )
            if count >= FREE_CHART_LIMIT:
                raise HTTPException(
                    status_code=403,
                    detail=f"Free plan limited to {FREE_CHART_LIMIT} saved charts. Upgrade to save more."
                )
    chart_data = _build_chart(req)
    planets = chart_data["planets"]
    asc_sign = chart_data["ascendant"]["sign"]
    moon_sign = planets.get("Moon", {}).get("sign", "")
    sun_sign = planets.get("Sun", {}).get("sign", "")
    atmakaraka = chart_data["atmakaraka"]
    active_md = chart_data["dashas"][0]["lord"] if chart_data["dashas"] else ""

    # Detect yogas for indexing
    try:
        yoga_list = detect_yogas_internal(planets, chart_data["planet_house_map"], chart_data["ascendant"])
        yoga_names = [y["name"] for y in yoga_list]
    except Exception:
        yoga_names = []

    chart_id = str(uuid.uuid4())
    # asyncpg needs real date/time objects for DATE/TIME columns (not strings)
    from datetime import date as _date, time as _time
    _y, _m, _d = map(int, req.birth_date.split("-"))
    _hh, _mm = map(int, req.birth_time.split(":")[:2])
    bd = _date(_y, _m, _d)
    bt = _time(_hh, _mm)
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO charts
               (id, user_id, client_id, name, birth_date, birth_time, birth_tz, birth_place,
                latitude, longitude, ayanamsa, chart_data, ascendant_sign, moon_sign, sun_sign,
                atmakaraka, yogas, active_md, is_public)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19)""",
            chart_id, current_user["sub"],
            req.client_id,
            req.name,
            bd,
            bt,
            req.birth_tz,
            req.birth_place,
            req.latitude, req.longitude,
            req.ayanamsa,
            json.dumps(chart_data),
            asc_sign, moon_sign, sun_sign, atmakaraka,
            yoga_names, active_md, req.is_public
        )

        # Insert per-planet chart_tags for research lab
        tags = []
        for pname, pdata in planets.items():
            tags.append((str(uuid.uuid4()), chart_id, f"{pname.lower()}_sign", pdata.get("sign", "")))
            tags.append((str(uuid.uuid4()), chart_id, f"{pname.lower()}_house", str(pdata.get("house", ""))))
            tags.append((str(uuid.uuid4()), chart_id, f"{pname.lower()}_nakshatra", pdata.get("nakshatra", "")))
        await conn.executemany(
            "INSERT INTO chart_tags (id, chart_id, tag_key, tag_value) VALUES ($1,$2,$3,$4)",
            tags
        )

    return {"chart_id": chart_id, "ascendant": asc_sign, "yogas": yoga_names}


@router.get("/charts/list")
async def list_charts(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, name, birth_date, birth_time, birth_place, birth_tz,
                      latitude, longitude, ayanamsa, ascendant_sign, moon_sign,
                      atmakaraka, active_md, yogas, created_at
               FROM charts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100""",
            current_user["sub"]
        )
    return [dict(r) for r in rows]


@router.get("/charts/{chart_id}")
async def get_chart(chart_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM charts WHERE id=$1 AND (user_id=$2 OR is_public=true)",
            chart_id, current_user["sub"]
        )
    if not row:
        raise HTTPException(status_code=404, detail="Chart not found")
    r = dict(row)
    r["chart_data"] = json.loads(r["chart_data"]) if r.get("chart_data") else {}
    return r


@router.delete("/charts/{chart_id}")
async def delete_chart(chart_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM charts WHERE id=$1 AND user_id=$2", chart_id, current_user["sub"]
        )
    return {"ok": True}
