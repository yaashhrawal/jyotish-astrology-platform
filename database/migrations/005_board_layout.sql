-- ============================================================
-- Migration 005: Divisional Charts Board layout (per user)
-- Stores the astrologer's chosen set of divisional charts (e.g. [1,9,10])
-- shown on the Kundli screen. NULL = use the app default.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS board_layout JSONB DEFAULT NULL;
