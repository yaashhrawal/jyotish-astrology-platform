import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from core.db import get_pool
from core.auth import hash_password, verify_password, create_access_token, get_current_user
import uuid
from datetime import datetime, timedelta

FREE_TRIAL_DAYS = 14
DEMO_USER_ID = os.getenv("DEMO_USER_ID")  # set only in demo env

router = APIRouter(tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: str = None
    phone: str = None
    ayanamsa_pref: str = None
    chart_style: str = None
    timezone: str = None


@router.post("/auth/register")
async def register(req: RegisterRequest):
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id FROM users WHERE email=$1", req.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = str(uuid.uuid4())
        trial_ends = datetime.utcnow() + timedelta(days=FREE_TRIAL_DAYS)
        await conn.execute(
            """INSERT INTO users (id, email, password_hash, name, phone, plan, trial_ends_at)
               VALUES ($1, $2, $3, $4, $5, 'trial', $6)""",
            user_id, req.email, hash_password(req.password), req.name, req.phone, trial_ends
        )
        # Insert trial subscription record
        await conn.execute(
            """INSERT INTO subscriptions (id, user_id, plan, status, ends_at)
               VALUES ($1, $2, 'professional', 'trialing', $3)""",
            str(uuid.uuid4()), user_id, trial_ends
        )
        token = create_access_token(user_id, req.email)
        return {
            "token": token,
            "user": {"id": user_id, "email": req.email, "name": req.name, "plan": "trial"},
            "trial_ends_at": trial_ends.isoformat(),
            "trial_days": FREE_TRIAL_DAYS,
        }


@router.post("/auth/login")
async def login(req: LoginRequest):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", req.email)
        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        await conn.execute("UPDATE users SET last_login=NOW() WHERE id=$1", user["id"])
        token = create_access_token(str(user["id"]), user["email"])
        return {
            "token": token,
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "name": user["name"],
                "plan": user["plan"],
                "ayanamsa_pref": user["ayanamsa_pref"],
                "chart_style": user["chart_style"],
            }
        }


@router.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id,email,name,plan,phone,ayanamsa_pref,chart_style,timezone,created_at FROM users WHERE id=$1", current_user["sub"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(user)


@router.get("/auth/demo-login")
async def demo_login():
    """Auto-login endpoint for demo environment only. Returns token for pre-seeded demo user."""
    if not DEMO_USER_ID:
        raise HTTPException(status_code=403, detail="Demo mode not enabled on this server")
    token = create_access_token(DEMO_USER_ID, "demo@jyotish.app")
    return {
        "token": token,
        "user": {"id": DEMO_USER_ID, "email": "demo@jyotish.app", "name": "Demo Astrologer", "plan": "professional"},
        "is_demo": True,
    }


@router.patch("/auth/profile")
async def update_profile(req: UpdateProfileRequest, current_user=Depends(get_current_user)):
    pool = await get_pool()
    updates = {k: v for k, v in req.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k}=${i+2}" for i, k in enumerate(updates.keys()))
    values = list(updates.values())
    async with pool.acquire() as conn:
        await conn.execute(
            f"UPDATE users SET {set_clause} WHERE id=$1",
            current_user["sub"], *values
        )
    return {"ok": True}
