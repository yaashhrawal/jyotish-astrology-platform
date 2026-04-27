-- ============================================================
-- Migration 003: Gem Marketplace (Phase 3 — the MOAT)
-- Tables: gem_catalog, gem_orders, gem_certificates, commissions
-- ============================================================

-- ── Gem master catalog (admin-managed) ──────────────────────
CREATE TABLE IF NOT EXISTS gem_catalog (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             TEXT NOT NULL UNIQUE,             -- e.g. "YS-PREM-5C"
    name            TEXT NOT NULL,                    -- "Yellow Sapphire (Pukhraj)"
    sanskrit_name   TEXT,                             -- "पुष्पराग"
    planet          TEXT NOT NULL,                    -- significator: Jupiter
    rashi           TEXT[] NOT NULL DEFAULT '{}',     -- compatible signs
    color           TEXT,                             -- "Yellow"
    -- Sizing
    carat_min       NUMERIC(6,2) NOT NULL,
    carat_max       NUMERIC(6,2) NOT NULL,
    carat_default   NUMERIC(6,2),                     -- recommended
    -- Pricing (in paise — INR * 100)
    tier            TEXT NOT NULL CHECK (tier IN ('premium','standard','budget')),
    cert_authority  TEXT NOT NULL,                    -- "GIA + GRS" / "IGI + GJEPC"
    retail_price_paise   BIGINT NOT NULL,
    astrologer_cost_paise BIGINT NOT NULL,            -- our wholesale to ourselves
    base_commission_pct  NUMERIC(5,2) NOT NULL DEFAULT 20.0,
    -- Inventory
    in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
    stock_count     INT,
    -- Visuals
    image_url       TEXT,
    description     TEXT,
    benefits        TEXT,                             -- markdown
    contraindications TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gem_catalog_planet ON gem_catalog(planet);
CREATE INDEX IF NOT EXISTS idx_gem_catalog_tier   ON gem_catalog(tier);
CREATE INDEX IF NOT EXISTS idx_gem_catalog_active ON gem_catalog(is_active) WHERE is_active = TRUE;

-- ── Gem orders (the revenue engine) ─────────────────────────
CREATE TABLE IF NOT EXISTS gem_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number        TEXT NOT NULL UNIQUE,             -- e.g. JG-2026-00001
    -- Parties
    astrologer_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
    chart_id            UUID REFERENCES charts(id) ON DELETE SET NULL,
    gem_id              UUID NOT NULL REFERENCES gem_catalog(id),
    -- Spec
    carat               NUMERIC(6,2) NOT NULL,
    -- Pricing snapshot (frozen at recommend-time, in paise)
    retail_price_paise        BIGINT NOT NULL,
    commission_pct            NUMERIC(5,2) NOT NULL,
    commission_amount_paise   BIGINT NOT NULL,
    -- Recommendation context
    recommendation_reason   TEXT,
    astrologer_notes        TEXT,
    -- Client details
    client_name             TEXT,
    client_phone            TEXT,
    client_email            TEXT,
    shipping_address        TEXT,
    shipping_city           TEXT,
    shipping_state          TEXT,
    shipping_pincode        TEXT,
    -- Payment + fulfillment
    status                  TEXT NOT NULL DEFAULT 'recommended'
                                CHECK (status IN ('recommended','paid','processing','shipped','delivered','cancelled','refunded','reviewed')),
    payment_link            TEXT,                         -- Razorpay short URL
    razorpay_order_id       TEXT,
    razorpay_payment_id     TEXT,
    paid_at                 TIMESTAMPTZ,
    tracking_number         TEXT,
    courier                 TEXT,                          -- "BlueDart" / "FedEx"
    shipped_at              TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    -- Review
    client_review_rating    INT CHECK (client_review_rating BETWEEN 1 AND 5),
    client_review_text      TEXT,
    reviewed_at             TIMESTAMPTZ,
    -- Meta
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gem_orders_astrologer ON gem_orders(astrologer_id);
CREATE INDEX IF NOT EXISTS idx_gem_orders_client ON gem_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_gem_orders_status ON gem_orders(status);
CREATE INDEX IF NOT EXISTS idx_gem_orders_created ON gem_orders(created_at DESC);

-- ── Cert tracking (1 per order, lab-verified) ───────────────
CREATE TABLE IF NOT EXISTS gem_certificates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL UNIQUE REFERENCES gem_orders(id) ON DELETE CASCADE,
    cert_authority  TEXT NOT NULL,                    -- "GIA"
    cert_number     TEXT NOT NULL,                    -- lab-issued
    cert_pdf_url    TEXT,
    cert_image_url  TEXT,
    blockchain_qr_data TEXT,                          -- our anchor (stored or computed)
    issued_on       DATE,
    issued_by_lab   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Commission ledger (per order, payable to astrologer) ────
CREATE TABLE IF NOT EXISTS commissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astrologer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id        UUID NOT NULL UNIQUE REFERENCES gem_orders(id) ON DELETE CASCADE,
    amount_paise    BIGINT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','paid','reversed')),
    -- Payout
    payout_method   TEXT,                              -- "bank_transfer" / "upi"
    payout_ref      TEXT,
    paid_at         TIMESTAMPTZ,
    -- Meta
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commissions_astrologer ON commissions(astrologer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- ── Commission tier per plan (drives base_commission_pct override) ──
-- Astrologer plan → bonus pct
-- Used in app logic: free→0, trial→+2, practitioner→+2, professional→+5
-- Plus volume bonus +2 after ₹5L lifetime sales.

-- ── Order number sequence (atomic) ──────────────────────────
CREATE SEQUENCE IF NOT EXISTS gem_order_seq START WITH 1;

-- ── Plan-based commission boost view ────────────────────────
CREATE OR REPLACE VIEW astrologer_commission_summary AS
SELECT
  u.id                             AS astrologer_id,
  u.plan,
  COALESCE(SUM(CASE WHEN c.status IN ('pending','approved') THEN c.amount_paise ELSE 0 END), 0) AS pending_paise,
  COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amount_paise ELSE 0 END), 0) AS paid_paise,
  COALESCE(SUM(c.amount_paise), 0) AS lifetime_paise,
  COUNT(c.id)                      AS total_orders
FROM users u
LEFT JOIN commissions c ON c.astrologer_id = u.id AND c.status != 'reversed'
GROUP BY u.id, u.plan;
