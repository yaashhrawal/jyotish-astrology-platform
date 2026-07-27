"""
JWT auth utilities.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET env var must be set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {
            "sub": user_id,
            "email": email,
            "exp": expire,
            "iat": now,
            "jti": str(uuid.uuid4()),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    return decode_token(token)
