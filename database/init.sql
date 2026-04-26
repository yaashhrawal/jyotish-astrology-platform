-- ============================================================
-- Jyotish SaaS — Complete Database Schema
-- Multi-tenant: all data isolated by user_id
-- Run once on fresh PostgreSQL 16 instance
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for text search on charts

-- ============================================================
-- USERS & SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    name            TEXT NOT NULL DEFAULT '',
    phone           TEXT NOT NULL DEFAULT '',
    plan            TEXT NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free','trial','practitioner','professional')),
    trial_ends_at   TIMESTAMPTZ,
    ayanamsa_pref   TEXT NOT NULL DEFAULT 'lahiri',
    chart_style     TEXT NOT NULL DEFAULT 'north',
    timezone        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    -- Billing
    razorpay_customer_id TEXT,
    -- Meta
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan                TEXT NOT NULL CHECK (plan IN ('practitioner','professional')),
    status              TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','cancelled','expired','trialing')),
    razorpay_sub_id     TEXT,
    razorpay_plan_id    TEXT,
    amount_paise        INT,          -- amount in paise (₹499 = 49900)
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CHARTS
-- ============================================================

CREATE TABLE IF NOT EXISTS charts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID,             -- FK to clients (optional)
    name            TEXT NOT NULL,
    birth_date      DATE NOT NULL,
    birth_time      TIME NOT NULL,
    birth_tz        FLOAT NOT NULL DEFAULT 5.5,
    birth_place     TEXT NOT NULL DEFAULT '',
    latitude        FLOAT NOT NULL,
    longitude       FLOAT NOT NULL,
    ayanamsa        TEXT NOT NULL DEFAULT 'lahiri',
    chart_data      JSONB NOT NULL DEFAULT '{}',
    -- Indexed fields for research lab
    ascendant_sign  TEXT,
    moon_sign       TEXT,
    sun_sign        TEXT,
    atmakaraka      TEXT,
    yogas           TEXT[],
    active_md       TEXT,
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Planet-level tags for cross-chart research queries
CREATE TABLE IF NOT EXISTS chart_tags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id    UUID NOT NULL REFERENCES charts(id) ON DELETE CASCADE,
    tag_key     TEXT NOT NULL,   -- e.g. "sun_sign", "moon_house", "mars_nakshatra"
    tag_value   TEXT NOT NULL
);

-- ============================================================
-- CRM
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL DEFAULT '',
    notes       TEXT NOT NULL DEFAULT '',
    tags        TEXT[] NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    chart_id        UUID REFERENCES charts(id) ON DELETE SET NULL,
    session_date    DATE NOT NULL,
    duration_mins   INT NOT NULL DEFAULT 60,
    notes           TEXT NOT NULL DEFAULT '',
    audio_url       TEXT NOT NULL DEFAULT '',
    fee_charged     NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'INR',
    status          TEXT NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('scheduled','completed','cancelled','no_show')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    duration_mins   INT NOT NULL DEFAULT 60,
    type            TEXT NOT NULL DEFAULT 'reading',
    status          TEXT NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('confirmed','completed','cancelled','no_show')),
    notes           TEXT NOT NULL DEFAULT '',
    fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
    session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
    amount      NUMERIC(10,2) NOT NULL,
    currency    TEXT NOT NULL DEFAULT 'INR',
    status      TEXT NOT NULL DEFAULT 'unpaid'
                    CHECK (status IN ('unpaid','paid','cancelled')),
    issued_on   DATE NOT NULL DEFAULT CURRENT_DATE,
    due_on      DATE,
    paid_on     DATE,
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PREDICTIONS / CREDIBILITY ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chart_id            UUID REFERENCES charts(id) ON DELETE SET NULL,
    session_id          UUID REFERENCES sessions(id) ON DELETE SET NULL,
    prediction_text     TEXT NOT NULL,
    category            TEXT NOT NULL DEFAULT 'general',
    predicted_for       TEXT NOT NULL DEFAULT '',    -- date range or event
    predicted_on        DATE NOT NULL DEFAULT CURRENT_DATE,
    outcome             TEXT CHECK (outcome IN ('pending','fulfilled','partially_fulfilled','unfulfilled')),
    outcome_notes       TEXT NOT NULL DEFAULT '',
    outcome_date        DATE,
    is_public           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chart_id    UUID REFERENCES charts(id) ON DELETE SET NULL,
    title       TEXT NOT NULL DEFAULT 'Untitled',
    messages    JSONB NOT NULL DEFAULT '[]',
    tokens_used INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- User lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Chart queries (research lab, user listing)
CREATE INDEX IF NOT EXISTS idx_charts_user_id ON charts(user_id);
CREATE INDEX IF NOT EXISTS idx_charts_client_id ON charts(client_id);
CREATE INDEX IF NOT EXISTS idx_charts_asc_sign ON charts(ascendant_sign);
CREATE INDEX IF NOT EXISTS idx_charts_moon_sign ON charts(moon_sign);
CREATE INDEX IF NOT EXISTS idx_charts_is_public ON charts(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_chart_tags_chart ON chart_tags(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_tags_key_val ON chart_tags(tag_key, tag_value);

-- CRM
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);

-- AI
CREATE INDEX IF NOT EXISTS idx_ai_convos_user ON ai_conversations(user_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);

-- ============================================================
-- PLAN LIMIT VIEW (helper for enforcement)
-- ============================================================

CREATE OR REPLACE VIEW user_plan_usage AS
SELECT
    u.id                    AS user_id,
    u.plan,
    COUNT(DISTINCT c.id)    AS chart_count,
    COUNT(DISTINCT cl.id)   AS client_count
FROM users u
LEFT JOIN charts c  ON c.user_id  = u.id
LEFT JOIN clients cl ON cl.user_id = u.id
GROUP BY u.id, u.plan;
