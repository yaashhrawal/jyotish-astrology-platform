"""
CRM layer: clients, reading sessions, appointments, invoices, predictions.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.db import get_pool
from core.auth import get_current_user

router = APIRouter(tags=["crm"])


# ── CLIENTS ──────────────────────────────────────────────────────────────────

class ClientRequest(BaseModel):
    name: str
    phone: str = ""
    whatsapp_phone: str = ""
    email: str = ""
    notes: str = ""
    tags: list[str] = []
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None
    birth_lat: Optional[float] = None
    birth_lon: Optional[float] = None
    birth_tz: Optional[float] = None


@router.post("/clients")
async def create_client(req: ClientRequest, current_user=Depends(get_current_user)):
    cid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO clients
               (id,user_id,name,phone,whatsapp_phone,email,notes,tags,
                birth_date,birth_time,birth_place,birth_lat,birth_lon,birth_tz)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)""",
            cid, current_user["sub"], req.name, req.phone, req.whatsapp_phone,
            req.email, req.notes, req.tags,
            req.birth_date, req.birth_time, req.birth_place,
            req.birth_lat, req.birth_lon, req.birth_tz
        )
    return {"client_id": cid, "name": req.name}


@router.get("/clients")
async def list_clients(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id,name,phone,email,notes,tags,created_at FROM clients WHERE user_id=$1 ORDER BY name",
            current_user["sub"]
        )
    return [dict(r) for r in rows]


@router.get("/clients/{client_id}")
async def get_client(client_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        client = await conn.fetchrow("SELECT * FROM clients WHERE id=$1 AND user_id=$2", client_id, current_user["sub"])
        if not client:
            raise HTTPException(404, "Client not found")
        charts = await conn.fetch("SELECT id,name,birth_date,birth_place,ascendant_sign,moon_sign FROM charts WHERE client_id=$1", client_id)
        sessions = await conn.fetch("SELECT id,session_date,duration_mins,fee_charged,status FROM sessions WHERE client_id=$1 ORDER BY session_date DESC LIMIT 10", client_id)
    return {**dict(client), "charts": [dict(r) for r in charts], "sessions": [dict(r) for r in sessions]}


@router.patch("/clients/{client_id}")
async def update_client(client_id: str, req: ClientRequest, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE clients SET
                 name=$3, phone=$4, whatsapp_phone=$5, email=$6, notes=$7, tags=$8,
                 birth_date=$9, birth_time=$10, birth_place=$11,
                 birth_lat=$12, birth_lon=$13, birth_tz=$14
               WHERE id=$1 AND user_id=$2""",
            client_id, current_user["sub"], req.name, req.phone, req.whatsapp_phone,
            req.email, req.notes, req.tags,
            req.birth_date, req.birth_time, req.birth_place,
            req.birth_lat, req.birth_lon, req.birth_tz
        )
    return {"ok": True}


@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM clients WHERE id=$1 AND user_id=$2", client_id, current_user["sub"])
    return {"ok": True}


# ── SESSIONS ─────────────────────────────────────────────────────────────────

class SessionRequest(BaseModel):
    client_id: str = None
    chart_id: str = None
    session_date: str        # YYYY-MM-DD
    duration_mins: int = 60
    notes: str = ""
    audio_url: str = ""
    fee_charged: float = 0
    currency: str = "INR"
    status: str = "completed"


@router.post("/sessions")
async def create_session(req: SessionRequest, current_user=Depends(get_current_user)):
    sid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO sessions (id,user_id,client_id,chart_id,session_date,duration_mins,notes,audio_url,fee_charged,currency,status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
            sid, current_user["sub"], req.client_id, req.chart_id,
            req.session_date, req.duration_mins, req.notes,
            req.audio_url, req.fee_charged, req.currency, req.status
        )
    return {"session_id": sid}


@router.get("/sessions")
async def list_sessions(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT s.id, s.session_date, s.duration_mins, s.fee_charged, s.status,
                      c.name as client_name
               FROM sessions s LEFT JOIN clients c ON c.id=s.client_id
               WHERE s.user_id=$1 ORDER BY s.session_date DESC LIMIT 50""",
            current_user["sub"]
        )
    return [dict(r) for r in rows]


# ── APPOINTMENTS ─────────────────────────────────────────────────────────────

class AppointmentRequest(BaseModel):
    client_id: str = None
    scheduled_at: str        # ISO datetime string
    duration_mins: int = 60
    type: str = "reading"
    status: str = "confirmed"
    notes: str = ""
    fee: float = 0


@router.post("/appointments")
async def create_appointment(req: AppointmentRequest, current_user=Depends(get_current_user)):
    aid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO appointments (id,user_id,client_id,scheduled_at,duration_mins,type,status,notes,fee)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
            aid, current_user["sub"], req.client_id, req.scheduled_at,
            req.duration_mins, req.type, req.status, req.notes, req.fee
        )
    return {"appointment_id": aid}


@router.get("/appointments")
async def list_appointments(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT a.id, a.scheduled_at, a.duration_mins, a.type, a.status, a.fee,
                      c.name as client_name
               FROM appointments a LEFT JOIN clients c ON c.id=a.client_id
               WHERE a.user_id=$1 ORDER BY a.scheduled_at DESC LIMIT 50""",
            current_user["sub"]
        )
    return [dict(r) for r in rows]


@router.patch("/appointments/{appt_id}/status")
async def update_appointment_status(appt_id: str, status: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE appointments SET status=$3 WHERE id=$1 AND user_id=$2", appt_id, current_user["sub"], status
        )
    return {"ok": True}


# ── INVOICES ─────────────────────────────────────────────────────────────────

class InvoiceRequest(BaseModel):
    client_id: str = None
    session_id: str = None
    amount: float
    currency: str = "INR"
    due_on: str = None
    notes: str = ""


@router.post("/invoices")
async def create_invoice(req: InvoiceRequest, current_user=Depends(get_current_user)):
    iid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO invoices (id,user_id,client_id,session_id,amount,currency,due_on,notes)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
            iid, current_user["sub"], req.client_id, req.session_id,
            req.amount, req.currency, req.due_on, req.notes
        )
    return {"invoice_id": iid}


@router.get("/invoices")
async def list_invoices(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT i.id, i.amount, i.currency, i.status, i.issued_on, i.due_on, i.paid_on,
                      c.name as client_name
               FROM invoices i LEFT JOIN clients c ON c.id=i.client_id
               WHERE i.user_id=$1 ORDER BY i.issued_on DESC LIMIT 50""",
            current_user["sub"]
        )
    return [dict(r) for r in rows]


@router.patch("/invoices/{invoice_id}/paid")
async def mark_paid(invoice_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE invoices SET status='paid', paid_on=CURRENT_DATE WHERE id=$1 AND user_id=$2",
            invoice_id, current_user["sub"]
        )
    return {"ok": True}


# ── PREDICTIONS (credibility engine) ─────────────────────────────────────────

class PredictionRequest(BaseModel):
    chart_id: str
    session_id: str = None
    prediction_text: str
    category: str = "general"
    predicted_for: str = ""
    is_public: bool = False


class OutcomeRequest(BaseModel):
    outcome: str    # pending/fulfilled/partially_fulfilled/unfulfilled
    outcome_notes: str = ""
    outcome_date: str = None


@router.post("/predictions")
async def create_prediction(req: PredictionRequest, current_user=Depends(get_current_user)):
    pid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO predictions (id,user_id,chart_id,session_id,prediction_text,category,predicted_for,is_public)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
            pid, current_user["sub"], req.chart_id, req.session_id,
            req.prediction_text, req.category, req.predicted_for, req.is_public
        )
    return {"prediction_id": pid}


@router.get("/predictions")
async def list_predictions(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT p.id, p.prediction_text, p.category, p.predicted_for, p.predicted_on,
                      p.outcome, p.outcome_notes, p.outcome_date, c.name as chart_name
               FROM predictions p LEFT JOIN charts c ON c.id=p.chart_id
               WHERE p.user_id=$1 ORDER BY p.predicted_on DESC LIMIT 100""",
            current_user["sub"]
        )
    return [dict(r) for r in rows]


@router.patch("/predictions/{pred_id}/outcome")
async def update_outcome(pred_id: str, req: OutcomeRequest, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE predictions SET outcome=$3, outcome_notes=$4, outcome_date=$5
               WHERE id=$1 AND user_id=$2""",
            pred_id, current_user["sub"], req.outcome, req.outcome_notes, req.outcome_date
        )
    return {"ok": True}


@router.get("/predictions/accuracy")
async def accuracy_stats(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT outcome, COUNT(*) as count FROM predictions WHERE user_id=$1 AND outcome IS NOT NULL GROUP BY outcome",
            current_user["sub"]
        )
    total = sum(r["count"] for r in rows)
    fulfilled = next((r["count"] for r in rows if r["outcome"] == "fulfilled"), 0)
    partial = next((r["count"] for r in rows if r["outcome"] == "partially_fulfilled"), 0)
    accuracy = round((fulfilled + partial * 0.5) / total * 100, 1) if total else 0
    return {
        "total": total,
        "fulfilled": fulfilled,
        "partially_fulfilled": partial,
        "unfulfilled": next((r["count"] for r in rows if r["outcome"] == "unfulfilled"), 0),
        "pending": next((r["count"] for r in rows if r["outcome"] == "pending"), 0),
        "accuracy_pct": accuracy,
    }
