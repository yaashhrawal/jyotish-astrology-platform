-- ============================================================
-- Migration 006: Google (OAuth) sign-in support
-- Google users have no password → password_hash becomes nullable.
-- auth_provider records how the account was created ('password' | 'google').
-- ============================================================

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password'
      CHECK (auth_provider IN ('password','google'));
