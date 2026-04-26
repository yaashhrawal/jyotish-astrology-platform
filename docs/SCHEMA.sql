-- ============================================================
-- Jyotish SaaS — PostgreSQL Schema
-- Run once on Oracle Cloud VM: psql -U postgres -d jyotish -f SCHEMA.sql
-- ============================================================

CREATE DATABASE jyotish;
\c jyotish;

-- ─── USERS (Astrologers) ─────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    name            TEXT NOT NULL,
    phone           TEXT,
    plan            TEXT DEFAULT 'free'   CHECK (plan IN ('free','astrologer','research','agency')),
    ayanamsa_pref   TEXT DEFAULT 'lahiri',
    chart_style     TEXT DEFAULT 'north_indian',
    timezone        TEXT DEFAULT 'Asia/Kolkata',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login      TIMESTAMPTZ
);

-- ─── CLIENTS (per astrologer) ────────────────────────────────────────────────
CREATE TABLE clients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT,
    email       TEXT,
    notes       TEXT,
    tags        TEXT[],
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_clients_user ON clients(user_id);

-- ─── CHARTS (birth charts, stored once, reused) ───────────────────────────────
CREATE TABLE charts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    birth_date      DATE NOT NULL,
    birth_time      TIME NOT NULL,
    birth_tz        FLOAT NOT NULL DEFAULT 5.5,
    birth_place     TEXT NOT NULL,
    latitude        FLOAT NOT NULL,
    longitude       FLOAT NOT NULL,
    ayanamsa        TEXT DEFAULT 'lahiri',
    -- Cached computation (JSON blob of full chart response)
    chart_data      JSONB,
    -- Indexed fields for Research Lab filtering
    ascendant_sign  TEXT,
    moon_sign       TEXT,
    sun_sign        TEXT,
    atmakaraka      TEXT,
    yogas           TEXT[],         -- array of detected yoga names
    active_md       TEXT,           -- current mahadasha lord
    active_ad       TEXT,           -- current antardasha lord
    is_public       BOOLEAN DEFAULT FALSE,  -- for community atlas
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_charts_user         ON charts(user_id);
CREATE INDEX idx_charts_ascendant    ON charts(ascendant_sign);
CREATE INDEX idx_charts_moon         ON charts(moon_sign);
CREATE INDEX idx_charts_sun          ON charts(sun_sign);
CREATE INDEX idx_charts_atmakaraka   ON charts(atmakaraka);
CREATE INDEX idx_charts_active_md    ON charts(active_md);
CREATE INDEX idx_charts_yogas        ON charts USING GIN(yogas);

-- ─── CHART TAGS (flexible key-value for research filtering) ──────────────────
CREATE TABLE chart_tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id    UUID NOT NULL REFERENCES charts(id) ON DELETE CASCADE,
    tag_key     TEXT NOT NULL,   -- e.g. "mars_house", "jupiter_sign", "rahu_nakshatra"
    tag_value   TEXT NOT NULL,   -- e.g. "10", "Sagittarius", "Rohini"
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chart_tags_chart     ON chart_tags(chart_id);
CREATE INDEX idx_chart_tags_key_value ON chart_tags(tag_key, tag_value);

-- ─── READING SESSIONS ─────────────────────────────────────────────────────────
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    chart_id        UUID REFERENCES charts(id) ON DELETE SET NULL,
    session_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_mins   INT,
    notes           TEXT,
    audio_url       TEXT,
    fee_charged     NUMERIC(10,2),
    currency        TEXT DEFAULT 'INR',
    status          TEXT DEFAULT 'completed' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_user   ON sessions(user_id);
CREATE INDEX idx_sessions_client ON sessions(client_id);

-- ─── PREDICTIONS (the credibility engine) ────────────────────────────────────
CREATE TABLE predictions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chart_id        UUID NOT NULL REFERENCES charts(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    prediction_text TEXT NOT NULL,
    category        TEXT,        -- 'career', 'marriage', 'health', 'finance', etc.
    predicted_for   TEXT,        -- time period, e.g. "2025-01 to 2025-06"
    predicted_on    DATE DEFAULT CURRENT_DATE,
    outcome         TEXT CHECK (outcome IN ('pending', 'fulfilled', 'partially_fulfilled', 'unfulfilled')),
    outcome_notes   TEXT,
    outcome_date    DATE,
    is_public       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_predictions_user  ON predictions(user_id);
CREATE INDEX idx_predictions_chart ON predictions(chart_id);

-- ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    duration_mins   INT DEFAULT 60,
    type            TEXT DEFAULT 'reading',
    status          TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
    notes           TEXT,
    fee             NUMERIC(10,2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_appts_user ON appointments(user_id);
CREATE INDEX idx_appts_date ON appointments(scheduled_at);

-- ─── INVOICES ─────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    amount          NUMERIC(10,2) NOT NULL,
    currency        TEXT DEFAULT 'INR',
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
    issued_on       DATE DEFAULT CURRENT_DATE,
    due_on          DATE,
    paid_on         DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESEARCH QUERIES (saved filter queries) ──────────────────────────────────
CREATE TABLE research_queries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    filters     JSONB NOT NULL,  -- {"ascendant": "Scorpio", "mars_house": "10", ...}
    result_count INT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    last_run    TIMESTAMPTZ
);

-- ─── COMMUNITY ATLAS (famous/public charts) ──────────────────────────────────
CREATE TABLE atlas_charts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    category        TEXT,        -- 'politician', 'actor', 'sportsperson', 'historical', 'event'
    birth_date      DATE,
    birth_time      TIME,
    birth_place     TEXT,
    latitude        FLOAT,
    longitude       FLOAT,
    birth_tz        FLOAT DEFAULT 5.5,
    chart_data      JSONB,
    ascendant_sign  TEXT,
    moon_sign       TEXT,
    sun_sign        TEXT,
    yogas           TEXT[],
    verified        BOOLEAN DEFAULT FALSE,
    source_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_atlas_ascendant ON atlas_charts(ascendant_sign);
CREATE INDEX idx_atlas_category  ON atlas_charts(category);
CREATE INDEX idx_atlas_yogas     ON atlas_charts USING GIN(yogas);

-- ─── SEED: Demo astrologer account ───────────────────────────────────────────
INSERT INTO users (email, password_hash, name, plan)
VALUES ('demo@jyotish.app', 'CHANGE_BEFORE_PROD', 'Demo Astrologer', 'research');
