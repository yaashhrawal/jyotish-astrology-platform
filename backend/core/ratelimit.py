"""Shared slowapi limiter (imported by main + routers to avoid circular deps)."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
