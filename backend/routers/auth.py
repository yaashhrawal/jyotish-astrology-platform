from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from core.db import get_pool
from core.auth import hash_password, verify_password, create_access_token, get_current_user
import uuid

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
        await conn.execute(
            """INSERT INTO users (id, email, password_hash, name, phone)
               VALUES ($1, $2, $3, $4, $5)""",
            user_id, req.email, hash_password(req.password), req.name, req.phone
        )
        token = create_access_token(user_id, req.email)
        return {"token": token, "user": {"id": user_id, "email": req.email, "name": req.name, "plan": "free"}}


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
