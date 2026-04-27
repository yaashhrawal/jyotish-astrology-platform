"""
Astrologer profile — brand details, contact, branding for PDF letterhead.
"""
import os
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from core.db import get_pool
from core.auth import get_current_user

router = APIRouter(tags=["astrologer-profile"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/jyotish-uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMG_EXT = {".png", ".jpg", ".jpeg", ".svg", ".webp"}
MAX_UPLOAD_BYTES = 1 * 1024 * 1024  # 1 MB


class ProfileRequest(BaseModel):
    display_name: Optional[str] = None
    title: Optional[str] = None
    qualifications: List[str] = []
    registration_no: Optional[str] = None
    tagline: Optional[str] = None
    bio: Optional[str] = None
    languages: List[str] = []
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    primary_color: str = "#7C2D12"
    secondary_color: str = "#92400E"
    font_family: str = "serif"
    youtube_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    show_powered_by: bool = True
    pdf_footer_quote: Optional[str] = None


@router.get("/business/profile")
async def get_profile(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM astrologer_profiles WHERE user_id=$1", current_user["sub"]
        )
        if not row:
            return {"user_id": current_user["sub"], "exists": False}
    return {**dict(row), "exists": True}


@router.put("/business/profile")
async def upsert_profile(req: ProfileRequest, current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO astrologer_profiles (
                user_id, display_name, title, qualifications, registration_no,
                tagline, bio, languages, phone, whatsapp, email, website,
                address_line1, address_line2, city, state, pincode,
                gst_number, pan_number, primary_color, secondary_color,
                font_family, youtube_url, instagram_url, facebook_url,
                show_powered_by, pdf_footer_quote, updated_at
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
                $18,$19,$20,$21,$22,$23,$24,$25,$26,$27, NOW()
            )
            ON CONFLICT (user_id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                title = EXCLUDED.title,
                qualifications = EXCLUDED.qualifications,
                registration_no = EXCLUDED.registration_no,
                tagline = EXCLUDED.tagline,
                bio = EXCLUDED.bio,
                languages = EXCLUDED.languages,
                phone = EXCLUDED.phone,
                whatsapp = EXCLUDED.whatsapp,
                email = EXCLUDED.email,
                website = EXCLUDED.website,
                address_line1 = EXCLUDED.address_line1,
                address_line2 = EXCLUDED.address_line2,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                pincode = EXCLUDED.pincode,
                gst_number = EXCLUDED.gst_number,
                pan_number = EXCLUDED.pan_number,
                primary_color = EXCLUDED.primary_color,
                secondary_color = EXCLUDED.secondary_color,
                font_family = EXCLUDED.font_family,
                youtube_url = EXCLUDED.youtube_url,
                instagram_url = EXCLUDED.instagram_url,
                facebook_url = EXCLUDED.facebook_url,
                show_powered_by = EXCLUDED.show_powered_by,
                pdf_footer_quote = EXCLUDED.pdf_footer_quote,
                updated_at = NOW()
            """,
            current_user["sub"], req.display_name, req.title, req.qualifications,
            req.registration_no, req.tagline, req.bio, req.languages, req.phone,
            req.whatsapp, req.email, req.website, req.address_line1, req.address_line2,
            req.city, req.state, req.pincode, req.gst_number, req.pan_number,
            req.primary_color, req.secondary_color, req.font_family,
            req.youtube_url, req.instagram_url, req.facebook_url,
            req.show_powered_by, req.pdf_footer_quote
        )
    return {"ok": True}


def _save_upload(file: UploadFile, user_id: str, kind: str) -> str:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMG_EXT:
        raise HTTPException(400, f"Unsupported file type: {ext}")
    user_dir = UPLOAD_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    target = user_dir / f"{kind}{ext}"
    size = 0
    with target.open("wb") as out:
        while chunk := file.file.read(64 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                target.unlink(missing_ok=True)
                raise HTTPException(413, "File exceeds 1 MB")
            out.write(chunk)
    # Public URL relative to UPLOAD_DIR (served by static mount)
    return f"/uploads/{user_id}/{kind}{ext}"


@router.post("/business/profile/upload/{kind}")
async def upload_brand_asset(kind: str, file: UploadFile = File(...),
                             current_user=Depends(get_current_user)):
    if kind not in ("logo", "photo", "signature"):
        raise HTTPException(400, "kind must be logo|photo|signature")
    url = _save_upload(file, current_user["sub"], kind)
    pool = await get_pool()
    column = f"{kind}_url"
    async with pool.acquire() as conn:
        # Ensure profile row exists
        await conn.execute(
            "INSERT INTO astrologer_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
            current_user["sub"]
        )
        await conn.execute(
            f"UPDATE astrologer_profiles SET {column}=$1, updated_at=NOW() WHERE user_id=$2",
            url, current_user["sub"]
        )
    return {"url": url}
