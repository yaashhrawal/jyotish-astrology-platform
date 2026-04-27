"""
PDF report generation + client portal invites + invoice PDFs.
Uses WeasyPrint (HTML/CSS → PDF).
"""
import os
import json
import secrets
import uuid
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader, select_autoescape
from core.db import get_pool
from core.auth import get_current_user
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, calculate_atmakaraka,
    get_vimshottari_dasha, jd_to_datetime,
)

router = APIRouter(tags=["business-reports"])

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
REPORTS_DIR = Path(os.getenv("REPORTS_DIR", "/tmp/jyotish-reports"))
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/jyotish-uploads"))


def _localize_upload_urls(profile: dict) -> dict:
    """Rewrite /uploads/<id>/<file> → file:///<UPLOAD_DIR>/<id>/<file>
    so WeasyPrint can read images from disk."""
    if not profile:
        return profile
    out = dict(profile)
    for key in ("logo_url", "photo_url", "signature_url"):
        v = out.get(key)
        if v and v.startswith("/uploads/"):
            rel = v[len("/uploads/"):]
            out[key] = f"file://{UPLOAD_DIR}/{rel}"
    return out

jinja = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


# ── Section catalog (curated 20 + core 7) ────────────────────
CORE_SECTIONS = [
    "header", "birth_details", "chart_wheel", "planets",
    "dashas", "yogas", "atmakaraka", "doshas", "interpretation",
]
ADVANCED_SECTIONS = [
    "ashtakavarga", "shadbala", "vimshopaka",
    "varga_charts", "jaimini_karakas", "arudha_padas",
    "yogini_dasha", "chara_dasha", "narayana_dasha", "ashtottari_dasha",
    "transit_forecast", "varshaphal", "numerology",
    "remedies", "compatibility", "panchanga",
    "special_lagnas", "saham_points", "upagrahas",
    "sarvatobhadra",
]
ALL_SECTIONS = CORE_SECTIONS + ADVANCED_SECTIONS


class GenerateReportRequest(BaseModel):
    chart_id: Optional[str] = None
    # If chart_id absent, supply birth data inline (one-off report)
    name: Optional[str] = None
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_tz: float = 5.5
    birth_place: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ayanamsa: str = "lahiri"
    sections: List[str] = CORE_SECTIONS
    interpretation: str = ""
    template_id: Optional[str] = None  # optional saved template


async def _get_profile(conn, user_id: str) -> dict:
    row = await conn.fetchrow(
        "SELECT * FROM astrologer_profiles WHERE user_id=$1", user_id
    )
    return dict(row) if row else {}


def _build_chart_data(req: GenerateReportRequest):
    y, m, d = map(int, req.birth_date.split("-"))
    h, mn = map(int, req.birth_time.split(":"))
    jd = birth_to_jd(y, m, d, h, mn, req.birth_tz)
    planets = calculate_planets(jd, req.ayanamsa)
    house_data = calculate_houses(jd, req.latitude, req.longitude, req.ayanamsa)
    asc = house_data["ascendant"]
    planet_house_map = assign_planets_to_houses(planets, asc["sign_index"])
    atmakaraka = calculate_atmakaraka(planets)
    dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
    dasha_list = [{
        "lord": d["lord"],
        "start": jd_to_datetime(d["start_jd"]),
        "end": jd_to_datetime(d["end_jd"]),
        "years": d["years"],
    } for d in dashas[:12]]
    return {
        "jd": jd,
        "ascendant": asc,
        "planets": planets,
        "houses": house_data["houses"],
        "planet_house_map": planet_house_map,
        "atmakaraka": atmakaraka,
        "dashas": dasha_list,
    }


def _render_pdf_html(html: str, base_url: str = "") -> bytes:
    from weasyprint import HTML  # lazy import
    return HTML(string=html, base_url=base_url or str(TEMPLATES_DIR)).write_pdf()


@router.post("/business/reports/generate")
async def generate_report(req: GenerateReportRequest, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        profile = await _get_profile(conn, current_user["sub"])

        # Resolve chart data
        if req.chart_id:
            row = await conn.fetchrow(
                "SELECT * FROM charts WHERE id=$1 AND user_id=$2",
                req.chart_id, current_user["sub"]
            )
            if not row:
                raise HTTPException(404, "Chart not found")
            req.name = row["name"]
            req.birth_date = str(row["birth_date"])
            req.birth_time = str(row["birth_time"])[:5]
            req.birth_tz = row["birth_tz"]
            req.birth_place = row["birth_place"]
            req.latitude = row["latitude"]
            req.longitude = row["longitude"]
            req.ayanamsa = row["ayanamsa"]

        if not (req.birth_date and req.birth_time and req.latitude is not None):
            raise HTTPException(400, "Missing birth data")

        chart = _build_chart_data(req)

        # Validate section keys
        invalid = [s for s in req.sections if s not in ALL_SECTIONS]
        if invalid:
            raise HTTPException(400, f"Unknown sections: {invalid}")

        sections = list(dict.fromkeys(["header"] + req.sections))  # ensure header

        template = jinja.get_template("report.html")
        html = template.render(
            profile=_localize_upload_urls(profile),
            chart=chart,
            req=req,
            sections=sections,
            generated_at=datetime.utcnow().strftime("%d %b %Y · %H:%M UTC"),
        )

        pdf_bytes = _render_pdf_html(html)

        # Persist file + record
        report_id = str(uuid.uuid4())
        out_path = REPORTS_DIR / current_user["sub"] / f"{report_id}.pdf"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(pdf_bytes)

        await conn.execute(
            """INSERT INTO generated_reports
               (id, user_id, chart_id, sections, file_path, interpretation)
               VALUES ($1,$2,$3,$4,$5,$6)""",
            report_id, current_user["sub"], req.chart_id,
            json.dumps(req.sections), str(out_path), req.interpretation
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{req.name or "report"}.pdf"',
            "X-Report-Id": report_id,
        },
    )


# ── Invoice PDF ──────────────────────────────────────────────
@router.get("/business/invoices/{invoice_id}/pdf")
async def invoice_pdf(invoice_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        inv = await conn.fetchrow(
            """SELECT i.*, c.name as client_name, c.email as client_email,
                      c.phone as client_phone, c.address_line1
               FROM invoices i
               LEFT JOIN clients c ON c.id = i.client_id
               WHERE i.id=$1 AND i.user_id=$2""",
            invoice_id, current_user["sub"]
        )
        if not inv:
            raise HTTPException(404, "Invoice not found")
        profile = await _get_profile(conn, current_user["sub"])

    template = jinja.get_template("invoice.html")
    html = template.render(
        invoice=dict(inv),
        profile=_localize_upload_urls(profile),
        is_receipt=(inv["status"] == "paid"),
        generated_at=datetime.utcnow().strftime("%d %b %Y"),
    )
    pdf_bytes = _render_pdf_html(html)
    fname = f"{'receipt' if inv['status']=='paid' else 'invoice'}-{invoice_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{fname}"'},
    )


# ── Report templates ─────────────────────────────────────────
class TemplateRequest(BaseModel):
    name: str
    sections: List[str]
    is_default: bool = False


@router.post("/business/report-templates")
async def save_template(req: TemplateRequest, current_user=Depends(get_current_user)):
    invalid = [s for s in req.sections if s not in ALL_SECTIONS]
    if invalid:
        raise HTTPException(400, f"Unknown sections: {invalid}")
    tid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        if req.is_default:
            await conn.execute(
                "UPDATE report_templates SET is_default=FALSE WHERE user_id=$1",
                current_user["sub"]
            )
        await conn.execute(
            """INSERT INTO report_templates (id,user_id,name,sections,is_default)
               VALUES ($1,$2,$3,$4,$5)""",
            tid, current_user["sub"], req.name, json.dumps(req.sections), req.is_default
        )
    return {"id": tid}


@router.get("/business/report-templates")
async def list_templates(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id,name,sections,is_default,created_at FROM report_templates WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC",
            current_user["sub"]
        )
    return [
        {**dict(r), "sections": json.loads(r["sections"]) if isinstance(r["sections"], str) else r["sections"]}
        for r in rows
    ]


@router.delete("/business/report-templates/{tid}")
async def delete_template(tid: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM report_templates WHERE id=$1 AND user_id=$2",
            tid, current_user["sub"]
        )
    return {"ok": True}


@router.get("/business/report-sections")
async def list_sections():
    """Public listing of all available section keys grouped."""
    return {"core": CORE_SECTIONS, "advanced": ADVANCED_SECTIONS}


# ── Client portal invites ────────────────────────────────────
class InviteRequest(BaseModel):
    client_id: str
    expires_days: int = 90


@router.post("/business/clients/{client_id}/invite")
async def create_invite(client_id: str, req: InviteRequest = None,
                         current_user=Depends(get_current_user)):
    days = (req.expires_days if req else 90)
    pool = await get_pool()
    async with pool.acquire() as conn:
        client = await conn.fetchrow(
            "SELECT id,name,whatsapp_phone,email FROM clients WHERE id=$1 AND user_id=$2",
            client_id, current_user["sub"]
        )
        if not client:
            raise HTTPException(404, "Client not found")
        token = secrets.token_urlsafe(32)
        invite_id = str(uuid.uuid4())
        expires = datetime.now(timezone.utc) + timedelta(days=days)
        await conn.execute(
            """INSERT INTO client_portal_invites
               (id,client_id,user_id,token,expires_at)
               VALUES ($1,$2,$3,$4,$5)""",
            invite_id, client_id, current_user["sub"], token, expires
        )
        await conn.execute(
            "UPDATE clients SET portal_enabled=TRUE WHERE id=$1", client_id
        )
    return {
        "token": token,
        "expires_at": expires.isoformat(),
        "portal_url_path": f"/portal/{token}",
        "client": dict(client),
    }


@router.get("/business/clients/{client_id}/invites")
async def list_invites(client_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, token, expires_at, revoked_at, last_seen_at, view_count, created_at
               FROM client_portal_invites
               WHERE client_id=$1 AND user_id=$2
               ORDER BY created_at DESC""",
            client_id, current_user["sub"]
        )
    return [dict(r) for r in rows]


@router.delete("/business/invites/{invite_id}")
async def revoke_invite(invite_id: str, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE client_portal_invites SET revoked_at=NOW() WHERE id=$1 AND user_id=$2",
            invite_id, current_user["sub"]
        )
    return {"ok": True}


# ── Public portal endpoint (no auth, token-based) ────────────
@router.get("/portal/{token}")
async def portal_view(token: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        invite = await conn.fetchrow(
            """SELECT i.*, c.name as client_name, c.birth_date, c.birth_time,
                      c.birth_place, c.birth_lat, c.birth_lon, c.birth_tz, c.email,
                      c.phone, c.user_id as astrologer_id
               FROM client_portal_invites i
               JOIN clients c ON c.id = i.client_id
               WHERE i.token=$1""",
            token
        )
        if not invite:
            raise HTTPException(404, "Invalid link")
        if invite["revoked_at"]:
            raise HTTPException(403, "Link revoked")
        if invite["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(403, "Link expired")

        # Track view
        await conn.execute(
            "UPDATE client_portal_invites SET last_seen_at=NOW(), view_count=view_count+1 WHERE id=$1",
            invite["id"]
        )

        # Astrologer's brand for portal page
        profile = await _get_profile(conn, invite["astrologer_id"])

        # Recent reports for this client
        reports = await conn.fetch(
            """SELECT id, sections, created_at
               FROM generated_reports WHERE client_id=$1
               ORDER BY created_at DESC LIMIT 10""",
            invite["client_id"]
        )

        # Recent invoices
        invoices = await conn.fetch(
            """SELECT id, amount, currency, status, issued_on, paid_on
               FROM invoices WHERE client_id=$1 ORDER BY issued_on DESC LIMIT 10""",
            invite["client_id"]
        )

    return {
        "client": {
            "name": invite["client_name"],
            "birth_date": str(invite["birth_date"]) if invite["birth_date"] else None,
            "birth_time": str(invite["birth_time"])[:5] if invite["birth_time"] else None,
            "birth_place": invite["birth_place"],
        },
        "astrologer": {
            "display_name": profile.get("display_name"),
            "title": profile.get("title"),
            "phone": profile.get("phone"),
            "whatsapp": profile.get("whatsapp"),
            "email": profile.get("email"),
            "logo_url": profile.get("logo_url"),
            "primary_color": profile.get("primary_color"),
            "tagline": profile.get("tagline"),
        },
        "reports": [dict(r) for r in reports],
        "invoices": [dict(r) for r in invoices],
    }
