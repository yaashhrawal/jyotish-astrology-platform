-- ============================================================
-- Migration 004: User role (astrologer vs regular user)
-- Default 'astrologer' grandfathers all existing users with full access.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'astrologer'
      CHECK (role IN ('astrologer','user'));
