-- ============================================================
-- CATALOG + STRIPE CONNECT + COMMISSION MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Catalog Categories ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT DEFAULT '🏷️',
  sort_order  INT  DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_user ON catalog_categories(user_id);

-- ── Catalog Items (Products / Services / Packages) ────────
CREATE TABLE IF NOT EXISTS catalog_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  category_id     UUID REFERENCES catalog_categories(id) ON DELETE SET NULL,
  type            TEXT NOT NULL DEFAULT 'service',   -- service | product | package
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(12,2),
  currency        TEXT DEFAULT 'MXN',
  images          JSONB DEFAULT '[]',                -- [{url, caption}]
  sku             TEXT,
  inventory       INT,
  status          TEXT DEFAULT 'active',             -- active | inactive | draft
  stripe_price_id TEXT,                              -- Stripe Price ID for payment links
  stripe_product_id TEXT,                            -- Stripe Product ID
  tags            JSONB DEFAULT '[]',
  meta            JSONB DEFAULT '{}',                -- extra fields
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_user    ON catalog_items(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_status  ON catalog_items(status);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_catalog_items_search
  ON catalog_items USING gin(to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,'')));

-- ── Catalog Orders (Payment tracking) ─────────────────────
CREATE TABLE IF NOT EXISTS catalog_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL,        -- seller (platform user)
  catalog_item_id       UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  customer_phone        TEXT,                 -- WhatsApp number of buyer
  customer_name         TEXT,
  quantity              INT DEFAULT 1,
  unit_price            NUMERIC(12,2),
  total_amount          NUMERIC(12,2),
  currency              TEXT DEFAULT 'MXN',
  status                TEXT DEFAULT 'pending',  -- pending | paid | failed | refunded
  stripe_session_id     TEXT,
  stripe_payment_intent TEXT,
  platform_fee          NUMERIC(12,2) DEFAULT 0,
  seller_payout         NUMERIC(12,2),
  notes                 TEXT,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_orders_user   ON catalog_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_status ON catalog_orders(status);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_phone  ON catalog_orders(customer_phone);

-- ── Stripe Connect Accounts ────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL UNIQUE,
  stripe_account_id     TEXT NOT NULL UNIQUE,   -- acct_xxx
  status                TEXT DEFAULT 'pending', -- pending | active | restricted | rejected
  charges_enabled       BOOLEAN DEFAULT false,
  payouts_enabled       BOOLEAN DEFAULT false,
  details_submitted     BOOLEAN DEFAULT false,
  country               TEXT DEFAULT 'MX',
  email                 TEXT,
  onboarding_url        TEXT,
  dashboard_url         TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_connect_user ON stripe_connect_accounts(user_id);

-- ── Platform Commission Config ─────────────────────────────
CREATE TABLE IF NOT EXISTS platform_commission (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode         TEXT DEFAULT 'none',     -- none | fixed | percentage | both
  fixed_amount NUMERIC(10,2) DEFAULT 0,
  percentage   NUMERIC(5,2)  DEFAULT 0, -- e.g. 5.00 = 5%
  currency     TEXT DEFAULT 'MXN',
  enabled      BOOLEAN DEFAULT false,
  updated_by   TEXT,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Insert default row
INSERT INTO platform_commission (mode, enabled)
VALUES ('none', false)
ON CONFLICT DO NOTHING;

-- ── WhatsApp Payment Notifications log ────────────────────
CREATE TABLE IF NOT EXISTS payment_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES catalog_orders(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,
  recipient     TEXT NOT NULL,   -- 'customer' | 'seller'
  phone         TEXT,
  message       TEXT,
  status        TEXT DEFAULT 'sent',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── RLS: all tables secured by user_id ────────────────────
ALTER TABLE catalog_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — these policies are for anon/user clients
CREATE POLICY "catalog_categories_owner" ON catalog_categories
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "catalog_items_owner" ON catalog_items
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "catalog_orders_owner" ON catalog_orders
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stripe_connect_owner" ON stripe_connect_accounts
  FOR ALL USING (true) WITH CHECK (true);

