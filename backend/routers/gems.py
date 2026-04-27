"""
Gem Marketplace — catalog browse, recommend, orders, commissions.
The MOAT: astrologer recommends → we ship → astrologer earns 20-25%.
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.db import get_pool
from core.auth import get_current_user

router = APIRouter(tags=["gems"])

# ── Plan-based commission boost ─────────────────────────────
PLAN_BOOST = {
    "free":         0.0,
    "trial":        2.0,
    "practitioner": 2.0,
    "professional": 5.0,
}
VOLUME_BOOST_THRESHOLD_PAISE = 500_000_00  # ₹5L lifetime
VOLUME_BOOST_PCT = 2.0


def _effective_commission_pct(base: float, plan: str, lifetime_paise: int) -> float:
    pct = base + PLAN_BOOST.get(plan or "free", 0.0)
    if lifetime_paise >= VOLUME_BOOST_THRESHOLD_PAISE:
        pct += VOLUME_BOOST_PCT
    return round(pct, 2)


# ── Catalog ─────────────────────────────────────────────────
@router.get("/gems/catalog")
async def list_catalog(planet: Optional[str] = None, tier: Optional[str] = None):
    pool = await get_pool()
    where = ["is_active = TRUE"]
    args: list = []
    if planet:
        args.append(planet); where.append(f"planet = ${len(args)}")
    if tier:
        args.append(tier);   where.append(f"tier = ${len(args)}")
    sql = f"""
      SELECT id, sku, name, sanskrit_name, planet, rashi, color,
             carat_min, carat_max, carat_default, tier, cert_authority,
             retail_price_paise, base_commission_pct, image_url,
             description, benefits, contraindications, in_stock
      FROM gem_catalog WHERE {' AND '.join(where)}
      ORDER BY planet, tier DESC, sort_order
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *args)
    return [dict(r) for r in rows]


@router.get("/gems/catalog/{gem_id}")
async def get_gem(gem_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        gem = await conn.fetchrow("SELECT * FROM gem_catalog WHERE id=$1 AND is_active=TRUE", gem_id)
        if not gem:
            raise HTTPException(404, "Gem not found")
        # Astrologer's effective commission preview
        u = await conn.fetchrow("SELECT plan FROM users WHERE id=$1", current_user["sub"])
        summary = await conn.fetchrow(
            "SELECT lifetime_paise FROM astrologer_commission_summary WHERE astrologer_id=$1",
            current_user["sub"]
        )
        plan = (u or {}).get("plan", "free") if u else "free"
        lifetime = (summary or {}).get("lifetime_paise", 0) if summary else 0
        eff_pct = _effective_commission_pct(float(gem["base_commission_pct"]), plan, int(lifetime or 0))
        commission_paise = int(gem["retail_price_paise"] * eff_pct / 100)
    return {
        **dict(gem),
        "your_commission_pct": eff_pct,
        "your_commission_paise": commission_paise,
        "plan": plan,
    }


# ── Recommendations / Orders ────────────────────────────────
class RecommendRequest(BaseModel):
    gem_id: str
    client_id: Optional[str] = None
    chart_id: Optional[str] = None
    carat: float
    recommendation_reason: Optional[str] = None
    astrologer_notes: Optional[str] = None
    # Client snapshot (if no client_id, recommend for ad-hoc)
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None


def _next_order_number(conn_seq_value: int) -> str:
    yr = datetime.now(timezone.utc).year
    return f"JG-{yr}-{conn_seq_value:05d}"


@router.post("/gems/recommend")
async def create_recommendation(req: RecommendRequest, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        gem = await conn.fetchrow("SELECT * FROM gem_catalog WHERE id=$1 AND is_active=TRUE", req.gem_id)
        if not gem:
            raise HTTPException(404, "Gem not found")
        if not gem["in_stock"]:
            raise HTTPException(400, "Gem out of stock")
        if not (float(gem["carat_min"]) <= req.carat <= float(gem["carat_max"])):
            raise HTTPException(400, f"Carat must be {gem['carat_min']}-{gem['carat_max']}")

        # Client info
        client_name = req.client_name
        client_phone = req.client_phone
        client_email = req.client_email
        if req.client_id:
            cli = await conn.fetchrow(
                "SELECT name, phone, whatsapp_phone, email FROM clients WHERE id=$1 AND user_id=$2",
                req.client_id, current_user["sub"]
            )
            if not cli:
                raise HTTPException(404, "Client not found")
            client_name = client_name or cli["name"]
            client_phone = client_phone or cli["whatsapp_phone"] or cli["phone"]
            client_email = client_email or cli["email"]

        # Pricing snapshot
        u = await conn.fetchrow("SELECT plan FROM users WHERE id=$1", current_user["sub"])
        summary = await conn.fetchrow(
            "SELECT lifetime_paise FROM astrologer_commission_summary WHERE astrologer_id=$1",
            current_user["sub"]
        )
        plan = (u or {})["plan"] if u else "free"
        lifetime = int((summary or {}).get("lifetime_paise") or 0) if summary else 0
        commission_pct = _effective_commission_pct(float(gem["base_commission_pct"]), plan, lifetime)
        retail_paise = int(gem["retail_price_paise"])
        commission_paise = int(retail_paise * commission_pct / 100)

        seq_val = await conn.fetchval("SELECT nextval('gem_order_seq')")
        order_number = _next_order_number(seq_val)
        order_id = str(uuid.uuid4())

        await conn.execute(
            """INSERT INTO gem_orders
               (id, order_number, astrologer_id, client_id, chart_id, gem_id, carat,
                retail_price_paise, commission_pct, commission_amount_paise,
                recommendation_reason, astrologer_notes,
                client_name, client_phone, client_email, status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'recommended')""",
            order_id, order_number, current_user["sub"], req.client_id, req.chart_id,
            req.gem_id, req.carat, retail_paise, commission_pct, commission_paise,
            req.recommendation_reason, req.astrologer_notes,
            client_name, client_phone, client_email,
        )

    return {
        "order_id": order_id,
        "order_number": order_number,
        "retail_paise": retail_paise,
        "commission_pct": commission_pct,
        "commission_paise": commission_paise,
        "purchase_url_path": f"/gem-purchase/{order_number}",  # client-facing; payment built later
    }


@router.get("/gems/orders")
async def list_orders(status: Optional[str] = None, current_user=Depends(get_current_user)):
    pool = await get_pool()
    where = ["o.astrologer_id = $1"]
    args: list = [current_user["sub"]]
    if status:
        args.append(status); where.append(f"o.status = ${len(args)}")
    sql = f"""
      SELECT o.*, g.name AS gem_name, g.tier AS gem_tier, g.image_url AS gem_image
      FROM gem_orders o
      LEFT JOIN gem_catalog g ON g.id = o.gem_id
      WHERE {' AND '.join(where)}
      ORDER BY o.created_at DESC
      LIMIT 200
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *args)
    return [dict(r) for r in rows]


@router.get("/gems/orders/{order_id}")
async def get_order(order_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT o.*, g.name AS gem_name, g.tier AS gem_tier, g.image_url AS gem_image,
                      g.cert_authority AS gem_cert_authority
               FROM gem_orders o
               LEFT JOIN gem_catalog g ON g.id = o.gem_id
               WHERE o.id=$1 AND o.astrologer_id=$2""",
            order_id, current_user["sub"]
        )
        if not row:
            raise HTTPException(404, "Order not found")
        cert = await conn.fetchrow("SELECT * FROM gem_certificates WHERE order_id=$1", order_id)
    return {**dict(row), "certificate": dict(cert) if cert else None}


# ── Mark-status helpers (admin-style; in v1 astrologer can simulate) ──
class StatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    courier: Optional[str] = None


@router.patch("/gems/orders/{order_id}/status")
async def update_status(order_id: str, req: StatusUpdate, current_user=Depends(get_current_user)):
    valid = {"recommended","paid","processing","shipped","delivered","cancelled","refunded","reviewed"}
    if req.status not in valid:
        raise HTTPException(400, f"Invalid status. Must be one of: {sorted(valid)}")
    pool = await get_pool()
    async with pool.acquire() as conn:
        order = await conn.fetchrow(
            "SELECT id, status, commission_amount_paise, astrologer_id FROM gem_orders WHERE id=$1 AND astrologer_id=$2",
            order_id, current_user["sub"]
        )
        if not order:
            raise HTTPException(404, "Order not found")

        now = datetime.now(timezone.utc)
        cols = ["status=$3", "updated_at=NOW()"]
        args = [order_id, current_user["sub"], req.status]
        if req.status == "paid":
            cols.append(f"paid_at=${len(args)+1}"); args.append(now)
        if req.status == "shipped":
            cols.append(f"shipped_at=${len(args)+1}"); args.append(now)
            if req.tracking_number:
                cols.append(f"tracking_number=${len(args)+1}"); args.append(req.tracking_number)
            if req.courier:
                cols.append(f"courier=${len(args)+1}"); args.append(req.courier)
        if req.status == "delivered":
            cols.append(f"delivered_at=${len(args)+1}"); args.append(now)

        await conn.execute(
            f"UPDATE gem_orders SET {', '.join(cols)} WHERE id=$1 AND astrologer_id=$2",
            *args
        )

        # On 'paid', auto-create commission row (pending)
        if req.status == "paid" and order["status"] != "paid":
            existing = await conn.fetchval("SELECT id FROM commissions WHERE order_id=$1", order_id)
            if not existing:
                await conn.execute(
                    """INSERT INTO commissions (id, astrologer_id, order_id, amount_paise, status)
                       VALUES ($1,$2,$3,$4,'pending')""",
                    str(uuid.uuid4()), order["astrologer_id"], order_id, order["commission_amount_paise"]
                )
        # On 'delivered', commission auto-approved (cleared after return window 15d in real life)
        if req.status == "delivered":
            await conn.execute(
                "UPDATE commissions SET status='approved', updated_at=NOW() WHERE order_id=$1 AND status='pending'",
                order_id
            )
    return {"ok": True, "status": req.status}


# ── Commissions / Earnings ──────────────────────────────────
@router.get("/gems/earnings")
async def earnings_summary(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM astrologer_commission_summary WHERE astrologer_id=$1",
            current_user["sub"]
        )
        recent = await conn.fetch(
            """SELECT c.id, c.amount_paise, c.status, c.created_at, c.paid_at,
                      o.order_number, o.client_name, g.name as gem_name
               FROM commissions c
               LEFT JOIN gem_orders o ON o.id = c.order_id
               LEFT JOIN gem_catalog g ON g.id = o.gem_id
               WHERE c.astrologer_id=$1 ORDER BY c.created_at DESC LIMIT 50""",
            current_user["sub"]
        )
        # Volume bonus eligibility
        plan_row = await conn.fetchrow("SELECT plan FROM users WHERE id=$1", current_user["sub"])
        plan = (plan_row or {}).get("plan", "free") if plan_row else "free"

    summary = dict(row) if row else {"pending_paise": 0, "paid_paise": 0, "lifetime_paise": 0, "total_orders": 0, "plan": plan}
    summary["plan_boost_pct"] = PLAN_BOOST.get(summary.get("plan") or "free", 0.0)
    summary["volume_bonus_active"] = int(summary.get("lifetime_paise") or 0) >= VOLUME_BOOST_THRESHOLD_PAISE
    summary["next_volume_threshold_paise"] = VOLUME_BOOST_THRESHOLD_PAISE
    return {"summary": summary, "recent": [dict(r) for r in recent]}


# ── Public order lookup (for client purchase page, future) ──
@router.get("/gem-order/{order_number}")
async def public_order_lookup(order_number: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT o.id, o.order_number, o.carat, o.retail_price_paise, o.status,
                      o.client_name, g.name AS gem_name, g.sanskrit_name, g.color,
                      g.cert_authority, g.image_url, g.description,
                      ap.display_name AS astrologer_name, ap.tagline, ap.logo_url
               FROM gem_orders o
               LEFT JOIN gem_catalog g ON g.id = o.gem_id
               LEFT JOIN astrologer_profiles ap ON ap.user_id = o.astrologer_id
               WHERE o.order_number=$1""",
            order_number
        )
        if not row:
            raise HTTPException(404, "Order not found")
    return dict(row)
