import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from core.db import get_pool
from core.auth import hash_password, verify_password, create_access_token, get_current_user
import uuid
from datetime import datetime, timedelta

FREE_TRIAL_DAYS = 30
DEMO_USER_ID = os.getenv("DEMO_USER_ID")  # set only in demo env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")  # OAuth web client id

router = APIRouter(tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""
    role: str = "astrologer"   # 'astrologer' | 'user'


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str            # Google ID token (JWT) from Google Identity Services
    role: str = "user"         # only used when creating a brand-new account


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
        role = req.role if req.role in ("astrologer", "user") else "astrologer"
        user_id = str(uuid.uuid4())
        trial_ends = datetime.utcnow() + timedelta(days=FREE_TRIAL_DAYS)
        await conn.execute(
            """INSERT INTO users (id, email, password_hash, name, phone, plan, trial_ends_at, role)
               VALUES ($1, $2, $3, $4, $5, 'trial', $6, $7)""",
            user_id, req.email, hash_password(req.password), req.name, req.phone, trial_ends, role
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
            "user": {"id": user_id, "email": req.email, "name": req.name, "plan": "trial", "role": role},
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
                "role": user["role"],
                "ayanamsa_pref": user["ayanamsa_pref"],
                "chart_style": user["chart_style"],
            }
        }


@router.post("/auth/google")
async def google_auth(req: GoogleAuthRequest):
    """Sign in / sign up with a Google ID token (Google Identity Services).
    Verifies the token against our OAuth client id, then find-or-creates the user
    and issues our own JWT (same shape as /auth/login)."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in not configured")
    # Verify the Google ID token
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        info = google_id_token.verify_oauth2_token(
            req.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    if not info.get("email") or not info.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Google account email not verified")

    email = info["email"].lower()
    name = info.get("name") or email.split("@")[0]
    role = req.role if req.role in ("astrologer", "user") else "user"

    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", email)
        if user:
            # Existing account (password or google) → just log in
            await conn.execute("UPDATE users SET last_login=NOW() WHERE id=$1", user["id"])
            uid = str(user["id"])
            return {
                "token": create_access_token(uid, email),
                "user": {"id": uid, "email": email, "name": user["name"], "plan": user["plan"],
                         "role": user["role"], "ayanamsa_pref": user["ayanamsa_pref"],
                         "chart_style": user["chart_style"]},
            }
        # New Google account — no password, 14-day trial like register
        uid = str(uuid.uuid4())
        trial_ends = datetime.utcnow() + timedelta(days=FREE_TRIAL_DAYS)
        await conn.execute(
            """INSERT INTO users (id, email, password_hash, name, phone, plan, trial_ends_at, role, auth_provider, last_login)
               VALUES ($1,$2,NULL,$3,'','trial',$4,$5,'google',NOW())""",
            uid, email, name, trial_ends, role
        )
        await conn.execute(
            """INSERT INTO subscriptions (id, user_id, plan, status, ends_at)
               VALUES ($1,$2,'professional','trialing',$3)""",
            str(uuid.uuid4()), uid, trial_ends
        )
        return {
            "token": create_access_token(uid, email),
            "user": {"id": uid, "email": email, "name": name, "plan": "trial", "role": role},
            "trial_ends_at": trial_ends.isoformat(), "trial_days": FREE_TRIAL_DAYS, "new_user": True,
        }


# ── Billing / pricing scaffold (numbers NOT final — geo-priced) ──────────────
PLAN_PRICING = {
    "IN":   {"price": 500, "currency": "INR", "symbol": "₹", "period": "month"},
    "INTL": {"price": 10,  "currency": "USD", "symbol": "$", "period": "month"},
}

@router.get("/billing/plans")
async def billing_plans(region: str = "IN"):
    """Geo-priced single 'Practice' plan + trial length. Final numbers TBD."""
    region = "IN" if region.upper() == "IN" else "INTL"
    return {
        "trial_days": FREE_TRIAL_DAYS,
        "region": region,
        "practice": PLAN_PRICING[region],
        "all_regions": PLAN_PRICING,
        "free_includes": ["all calculations", "gem referral earnings"],
        "practice_includes": ["clients (CRM)", "invoices", "branded PDF reports", "client portal", "prediction tracker"],
        "pricing_final": False,
    }


@router.get("/auth/google/config")
async def google_config():
    """Frontend asks whether Google sign-in is available + the client id to use."""
    return {"enabled": bool(GOOGLE_CLIENT_ID), "client_id": GOOGLE_CLIENT_ID}


@router.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id,email,name,plan,role,phone,ayanamsa_pref,chart_style,timezone,board_layout,created_at FROM users WHERE id=$1", current_user["sub"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        d = dict(user)
        # board_layout is stored as JSONB text via asyncpg — decode to a list
        if isinstance(d.get("board_layout"), str):
            import json as _json
            try: d["board_layout"] = _json.loads(d["board_layout"])
            except Exception: d["board_layout"] = None
        return d


class BoardLayoutRequest(BaseModel):
    layout: list[int]


@router.patch("/auth/board-layout")
async def save_board_layout(req: BoardLayoutRequest, current_user=Depends(get_current_user)):
    """Persist the user's Divisional Charts Board (list of varga divisors, e.g. [1,9,10])."""
    import json as _json
    # keep it sane: unique, valid divisors, D1 always first
    valid = {1,2,3,4,5,6,7,8,9,10,11,12,16,20,24,27,30,40,45,60,81,108,144}
    seen, layout = set(), []
    for d in req.layout:
        if d in valid and d not in seen:
            seen.add(d); layout.append(d)
    if 1 not in seen:
        layout = [1] + layout
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET board_layout=$2 WHERE id=$1",
            current_user["sub"], _json.dumps(layout)
        )
    return {"ok": True, "layout": layout}


@router.get("/auth/demo-login")
async def demo_login():
    """Auto-login endpoint for demo environment only. Returns token for pre-seeded demo user."""
    if not DEMO_USER_ID:
        raise HTTPException(status_code=403, detail="Demo mode not enabled on this server")
    token = create_access_token(DEMO_USER_ID, "demo@jyotish.app")
    return {
        "token": token,
        "user": {"id": DEMO_USER_ID, "email": "demo@jyotish.app", "name": "Demo Astrologer", "plan": "professional", "role": "astrologer"},
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
