-- ============================================================
-- Migration 002: Business modules (Phase 1)
-- Adds: astrologer profiles, client birth data, portal invites,
--       report templates
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

-- ── Astrologer brand / profile ──────────────────────────────
CREATE TABLE IF NOT EXISTS astrologer_profiles (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name     TEXT,
    title            TEXT,
    qualifications   TEXT[] NOT NULL DEFAULT '{}',
    registration_no  TEXT,
    photo_url        TEXT,
    signature_url    TEXT,
    logo_url         TEXT,
    tagline          TEXT,
    bio              TEXT,
    languages        TEXT[] NOT NULL DEFAULT '{}',
    -- Contact
    phone            TEXT,
    whatsapp         TEXT,
    email            TEXT,
    website          TEXT,
    -- Address
    address_line1    TEXT,
    address_line2    TEXT,
    city             TEXT,
    state            TEXT,
    pincode          TEXT,
    -- Business
    gst_number       TEXT,
    pan_number       TEXT,
    -- Branding
    primary_color    TEXT NOT NULL DEFAULT '#7C2D12',
    secondary_color  TEXT NOT NULL DEFAULT '#92400E',
    font_family      TEXT NOT NULL DEFAULT 'serif',
    -- Social
    youtube_url      TEXT,
    instagram_url    TEXT,
    facebook_url     TEXT,
    -- PDF preferences
    show_powered_by  BOOLEAN NOT NULL DEFAULT TRUE,   -- Pro can hide
    pdf_footer_quote TEXT,                            -- Sanskrit shloka or motto
    -- Meta
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Client birth data + portal toggle ───────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date     DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_time     TIME;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_place    TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_lat      FLOAT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_lon      FLOAT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_tz       FLOAT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Client portal invites (token-based access) ──────────────
CREATE TABLE IF NOT EXISTS client_portal_invites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- astrologer
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    view_count  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_token ON client_portal_invites(token);

-- ── Report templates (saved section bundles) ────────────────
CREATE TABLE IF NOT EXISTS report_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    sections    JSONB NOT NULL DEFAULT '[]',  -- ["chart_wheel","planets","dashas",...]
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_report_templates_user ON report_templates(user_id);

-- ── Generated reports archive (keep audit trail) ────────────
CREATE TABLE IF NOT EXISTS generated_reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chart_id    UUID REFERENCES charts(id) ON DELETE SET NULL,
    client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
    sections    JSONB NOT NULL DEFAULT '[]',
    file_path   TEXT,                          -- relative path on disk
    interpretation TEXT,                       -- astrologer's free-text notes
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_user ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_client ON generated_reports(client_id);
