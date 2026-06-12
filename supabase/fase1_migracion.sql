-- ============================================================
-- FASE 1: MIGRACIÓN COMPLETA
-- Ejecutar en Supabase → SQL Editor
-- Es seguro re-ejecutar (usa IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- ============================================================
-- PARTE A: LIMPIAR TABLA USERS (IDs CORRUPTOS)
-- ============================================================

-- Eliminar registros donde el id ES el email (bug del auth fallback)
-- Estos son del login con ADMIN_EMAIL/ADMIN_PASSWORD que genera id=email
DELETE FROM users
WHERE id = email
  AND email IS NOT NULL;

-- Eliminar registros Clerk (id empieza con "user_") que no tienen email
-- ni datos relacionados — son residuos de pruebas viejas
DELETE FROM users
WHERE id LIKE 'user_%'
  AND email IS NULL;

-- Verificar lo que quedó
SELECT id, email, plan, created_at FROM users ORDER BY created_at;


-- ============================================================
-- PARTE B: ASEGURAR COLUMNAS EN TABLA USERS
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name          TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS plan          TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS role          TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS suspended     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- PARTE C: TABLAS DEL SCHEMA V2 (si no existen)
-- ============================================================

-- bots
CREATE TABLE IF NOT EXISTS public.bots (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Mi Bot',
  phone_number_id TEXT,
  wa_business_id  TEXT,
  display_phone   TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.bots FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.bots FOR ALL TO authenticated USING (false);

-- bot_configs
CREATE TABLE IF NOT EXISTS public.bot_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id              TEXT NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_name          TEXT,
  business_name       TEXT,
  business_desc       TEXT,
  business_profile    TEXT,
  tone                TEXT DEFAULT 'professional',
  language            TEXT DEFAULT 'es',
  greeting            TEXT,
  extra_instructions  TEXT,
  use_emojis          BOOLEAN DEFAULT TRUE,
  short_answers       BOOLEAN DEFAULT FALSE,
  faqs                JSONB DEFAULT '[]',
  services            TEXT,
  hours               TEXT,
  location            TEXT,
  full_address        TEXT,
  phone               TEXT,
  website             TEXT,
  contact_email       TEXT,
  price_policy        TEXT,
  instagram           TEXT,
  facebook            TEXT,
  tiktok              TEXT,
  youtube             TEXT,
  catalog             JSONB DEFAULT '[]',
  flow                JSONB DEFAULT '{"mode":"text"}',
  appointments        JSONB DEFAULT '{"enabled":false}',
  site_name           TEXT,
  favicon_base64      TEXT,
  favicon_mime_type   TEXT,
  primary_color       TEXT,
  secondary_color     TEXT,
  font_family         TEXT,
  header_text         TEXT,
  footer_text         TEXT,
  show_whatsapp_button BOOLEAN DEFAULT TRUE,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (bot_id)
);
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.bot_configs FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.bot_configs FOR ALL TO authenticated USING (false);

-- bot_secrets
CREATE TABLE IF NOT EXISTS public.bot_secrets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id                TEXT NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id               TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_token_enc      TEXT,
  anthropic_key_enc     TEXT,
  openai_key_enc        TEXT,
  stripe_account_id_enc TEXT,
  verify_token          TEXT,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (bot_id)
);
ALTER TABLE public.bot_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.bot_secrets FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.bot_secrets FOR ALL TO authenticated USING (false);

-- phone_mappings
CREATE TABLE IF NOT EXISTS public.phone_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id TEXT NOT NULL UNIQUE,
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id          TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  ownership_hmac  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.phone_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.phone_mappings FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.phone_mappings FOR ALL TO authenticated USING (false);

-- conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id          TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  from_phone      TEXT NOT NULL,
  messages        JSONB DEFAULT '[]',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, bot_id, from_phone)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.conversations FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.conversations FOR ALL TO authenticated USING (false);

-- knowledge_files
CREATE TABLE IF NOT EXISTS public.knowledge_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  file_type   TEXT,
  file_size   BIGINT,
  source_url  TEXT,
  status      TEXT DEFAULT 'processing',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.knowledge_files FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.knowledge_files FOR ALL TO authenticated USING (false);

-- knowledge_content
CREATE TABLE IF NOT EXISTS public.knowledge_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  chunk_index INT DEFAULT 0,
  content     TEXT NOT NULL,
  tokens      INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.knowledge_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.knowledge_content FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.knowledge_content FOR ALL TO authenticated USING (false);

-- analytics
CREATE TABLE IF NOT EXISTS public.analytics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id            TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_received INT DEFAULT 0,
  messages_sent     INT DEFAULT 0,
  unique_users      INT DEFAULT 0,
  appointments_made INT DEFAULT 0,
  orders_placed     INT DEFAULT 0,
  UNIQUE (user_id, bot_id, date)
);
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.analytics FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.analytics FOR ALL TO authenticated USING (false);

-- message_events
CREATE TABLE IF NOT EXISTS public.message_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  from_phone  TEXT,
  direction   TEXT CHECK (direction IN ('inbound','outbound')),
  msg_type    TEXT DEFAULT 'text',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.message_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.message_events FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.message_events FOR ALL TO authenticated USING (false);

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'free',
  status               TEXT DEFAULT 'active',
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.subscriptions FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.subscriptions FOR ALL TO authenticated USING (false);

-- appointments (v2)
CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id          TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  customer_phone  TEXT NOT NULL,
  customer_name   TEXT,
  scheduled_at    TIMESTAMPTZ,
  duration_min    INT DEFAULT 60,
  notes           TEXT,
  field_values    JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'pending',
  notified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "deny_all_anon" ON public.appointments FOR ALL TO anon USING (false);
CREATE POLICY IF NOT EXISTS "deny_all_authenticated" ON public.appointments FOR ALL TO authenticated USING (false);


-- ============================================================
-- PARTE D: TABLAS AD-HOC (si no existen)
-- ============================================================

-- appointment_fields
CREATE TABLE IF NOT EXISTS public.appointment_fields (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  field_key   TEXT NOT NULL,
  field_label TEXT NOT NULL,
  question    TEXT,
  field_order INT DEFAULT 0,
  required    BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.appointment_fields ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointment_fields' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.appointment_fields FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointment_fields' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.appointment_fields FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- appointment_config
CREATE TABLE IF NOT EXISTS public.appointment_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id         TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  available_days INT[] DEFAULT '{1,2,3,4,5}',
  start_time     TEXT DEFAULT '09:00',
  end_time       TEXT DEFAULT '18:00',
  slot_minutes   INT DEFAULT 60,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id)
);
ALTER TABLE public.appointment_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointment_config' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.appointment_config FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointment_config' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.appointment_config FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- appointment_sessions
CREATE TABLE IF NOT EXISTS public.appointment_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  from_phone  TEXT NOT NULL,
  state       JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id, from_phone)
);
ALTER TABLE public.appointment_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointment_sessions' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.appointment_sessions FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointment_sessions' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.appointment_sessions FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- catalog_categories
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='catalog_categories' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.catalog_categories FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='catalog_categories' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.catalog_categories FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- catalog_items
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id            TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  price             NUMERIC(10,2),
  currency          TEXT DEFAULT 'MXN',
  type              TEXT DEFAULT 'service',
  images            JSONB DEFAULT '[]',
  sku               TEXT,
  inventory         INT,
  status            TEXT DEFAULT 'active',
  tags              TEXT[] DEFAULT '{}',
  stripe_product_id TEXT,
  stripe_price_id   TEXT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='catalog_items' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.catalog_items FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='catalog_items' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.catalog_items FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- catalog_orders
CREATE TABLE IF NOT EXISTS public.catalog_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id                TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  item_id               UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  customer_phone        TEXT,
  customer_name         TEXT,
  total_amount          NUMERIC(10,2),
  platform_fee          NUMERIC(10,2),
  seller_payout         NUMERIC(10,2),
  currency              TEXT DEFAULT 'MXN',
  status                TEXT DEFAULT 'pending',
  stripe_session_id     TEXT,
  stripe_payment_intent TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.catalog_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='catalog_orders' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.catalog_orders FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='catalog_orders' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.catalog_orders FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- stripe_connect_accounts
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id              TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  stripe_account_id   TEXT NOT NULL,
  status              TEXT DEFAULT 'pending',
  email               TEXT,
  charges_enabled     BOOLEAN DEFAULT FALSE,
  payouts_enabled     BOOLEAN DEFAULT FALSE,
  details_submitted   BOOLEAN DEFAULT FALSE,
  onboarding_url      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id)
);
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stripe_connect_accounts' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.stripe_connect_accounts FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stripe_connect_accounts' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.stripe_connect_accounts FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- payment_notifications
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES public.catalog_orders(id) ON DELETE SET NULL,
  message    TEXT,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_notifications' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.payment_notifications FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_notifications' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.payment_notifications FOR ALL TO authenticated USING (false);
  END IF;
END $$;


-- ============================================================
-- PARTE E: TABLAS ADMIN (si no existen)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT DEFAULT 'info',
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.announcements FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.announcements FOR ALL TO authenticated USING (false);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT,
  body       TEXT,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.notifications FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.notifications FOR ALL TO authenticated USING (false);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.whats_new (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version    TEXT,
  title      TEXT NOT NULL,
  body       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.whats_new ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whats_new' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.whats_new FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whats_new' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.whats_new FOR ALL TO authenticated USING (false);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.whats_new_seen (
  user_id  TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id  UUID NOT NULL REFERENCES public.whats_new(id) ON DELETE CASCADE,
  seen_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);
ALTER TABLE public.whats_new_seen ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whats_new_seen' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.whats_new_seen FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whats_new_seen' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.whats_new_seen FOR ALL TO authenticated USING (false);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id   TEXT,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_notes' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.admin_notes FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_notes' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.admin_notes FOR ALL TO authenticated USING (false);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB DEFAULT '{}',
  ip          TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.admin_audit_log FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.admin_audit_log FOR ALL TO authenticated USING (false);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.platform_commission (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage NUMERIC(5,2) DEFAULT 5.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.platform_commission ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_commission' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.platform_commission FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_commission' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.platform_commission FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- Insertar comisión default si no existe
INSERT INTO public.platform_commission (percentage)
SELECT 5.00 WHERE NOT EXISTS (SELECT 1 FROM public.platform_commission);

CREATE TABLE IF NOT EXISTS public.db_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  price_monthly NUMERIC(8,2),
  max_bots      INT DEFAULT 1,
  features      JSONB DEFAULT '[]',
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.db_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='db_plans' AND policyname='deny_all_anon') THEN
    CREATE POLICY "deny_all_anon" ON public.db_plans FOR ALL TO anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='db_plans' AND policyname='deny_all_authenticated') THEN
    CREATE POLICY "deny_all_authenticated" ON public.db_plans FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- Insertar planes si no existen
INSERT INTO public.db_plans (name, price_monthly, max_bots, features)
SELECT 'Básico', 25.00, 2, '["2 bots","Agendamiento de citas","Catálogo de productos","Soporte por email"]'
WHERE NOT EXISTS (SELECT 1 FROM public.db_plans WHERE name = 'Básico');

INSERT INTO public.db_plans (name, price_monthly, max_bots, features)
SELECT 'Profesional', 50.00, 5, '["5 bots","Todo lo del Básico","Analíticas avanzadas","Soporte prioritario"]'
WHERE NOT EXISTS (SELECT 1 FROM public.db_plans WHERE name = 'Profesional');

INSERT INTO public.db_plans (name, price_monthly, max_bots, features)
SELECT 'Pro', 100.00, 25, '["25 bots","Todo lo del Profesional","API access","Soporte dedicado"]'
WHERE NOT EXISTS (SELECT 1 FROM public.db_plans WHERE name = 'Pro');


-- ============================================================
-- PARTE F: ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bots_user_id ON public.bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_phone_number_id ON public.bots(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_bot_configs_bot_id ON public.bot_configs(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_secrets_bot_id ON public.bot_secrets(bot_id);
CREATE INDEX IF NOT EXISTS idx_phone_mappings_phone ON public.phone_mappings(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_bot ON public.conversations(user_id, bot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_from ON public.conversations(from_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_user_bot ON public.appointments(user_id, bot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON public.analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_message_events_user ON public.message_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_catalog_items_user_bot ON public.catalog_items(user_id, bot_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_status ON public.catalog_items(status);


-- ============================================================
-- PARTE G: VERIFICACIÓN FINAL
-- ============================================================

SELECT
  table_name,
  CASE
    WHEN table_name IN ('users','bots','bot_configs','bot_secrets','phone_mappings',
                        'conversations','analytics','message_events','subscriptions',
                        'appointments','knowledge_files','knowledge_content')
    THEN '✅ schema v2'
    WHEN table_name IN ('appointment_config','appointment_fields','appointment_sessions',
                        'catalog_categories','catalog_items','catalog_orders',
                        'stripe_connect_accounts','payment_notifications',
                        'announcements','notifications','whats_new','whats_new_seen',
                        'admin_notes','admin_audit_log','platform_commission','db_plans')
    THEN '✅ ad-hoc'
    ELSE '❓ otra'
  END AS estado
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY estado, table_name;
