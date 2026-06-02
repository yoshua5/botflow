-- ============================================================
-- AGENTFLOW — Supabase Schema v2
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Changes from v1:
--   • bots: soft delete (deleted_at) instead of hard CASCADE
--   • conversations: expires_at TTL column + pg_cron cleanup
--   • analytics: atomic counters via separate message_events table
--   • phone_mappings: hmac_sig for webhook ownership verification
--   • RLS: deny-all for anon/authenticated; only service_role has access
--   • audit_log: tracks changes to bot_configs and bot_secrets
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron; -- For conversation TTL cleanup job

-- ============================================================
-- USERS
-- Mirrors Clerk user data. user_id = Clerk userId string.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                 TEXT PRIMARY KEY,           -- Clerk userId (e.g. "user_abc123")
  email              TEXT,
  plan               TEXT NOT NULL DEFAULT 'free', -- 'free' | 'starter' | 'pro' | 'enterprise'
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOTS
-- Each user can have multiple bots.
-- Soft delete: set deleted_at instead of removing the row.
-- All queries must filter WHERE deleted_at IS NULL.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bots (
  id                 TEXT PRIMARY KEY,           -- e.g. "bot-1780254528012"
  user_id            TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL DEFAULT 'Mi Bot',
  agent_name         TEXT NOT NULL DEFAULT 'Asistente',
  business_name      TEXT,
  status             TEXT NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO' | 'INACTIVO'
  phone_number_id    TEXT,                       -- WhatsApp Phone Number ID
  wa_business_id     TEXT,
  display_phone      TEXT,                       -- "+52 55 1234 5678"
  message_count      INT DEFAULT 0,
  conversation_count INT DEFAULT 0,
  deleted_at         TIMESTAMPTZ,               -- NULL = active; set to NOW() to soft-delete
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bots_user_id_idx         ON public.bots(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS bots_phone_number_id_idx  ON public.bots(phone_number_id) WHERE deleted_at IS NULL;

-- ============================================================
-- BOT CONFIGS
-- One row per bot. All personality/business settings.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bot_configs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id             TEXT NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id            TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Personality
  agent_name         TEXT,
  tone               TEXT DEFAULT 'amigable',
  language           TEXT DEFAULT 'es',
  greeting           TEXT,
  extra_instructions TEXT,
  use_emojis         BOOLEAN DEFAULT TRUE,
  short_answers      BOOLEAN DEFAULT TRUE,
  faqs               JSONB DEFAULT '[]',

  -- Business info
  business_name      TEXT,
  business_desc      TEXT,
  business_profile   TEXT,
  services           TEXT,
  hours              TEXT,
  location           TEXT,
  full_address       TEXT,
  phone              TEXT,
  website            TEXT,
  contact_email      TEXT,
  price_policy       TEXT,
  instagram          TEXT,
  facebook           TEXT,
  tiktok             TEXT,
  youtube            TEXT,
  catalog            JSONB DEFAULT '[]',

  -- Conversation flow
  flow               JSONB DEFAULT '{"mode":"text"}',

  -- Appointments
  appointments       JSONB DEFAULT '{"enabled":false}',

  -- Site branding
  site_name          TEXT,
  favicon_base64     TEXT,
  favicon_mime_type  TEXT,

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(bot_id)
);

CREATE INDEX IF NOT EXISTS bot_configs_bot_id_idx   ON public.bot_configs(bot_id);
CREATE INDEX IF NOT EXISTS bot_configs_user_id_idx  ON public.bot_configs(user_id);

-- ============================================================
-- BOT SECRETS
-- Encrypted API keys. NEVER store plaintext here.
-- Encryption/decryption happens in Node.js with ENCRYPTION_KEY
-- from Vercel env vars — never in SQL.
-- Ciphertext format: "v1:<base64>" (see lib/crypto.js for rotation).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bot_secrets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id             TEXT NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id            TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- AES-256-GCM encrypted with ENCRYPTION_KEY (stored in Vercel, never here)
  access_token_enc   TEXT,   -- WhatsApp access token
  anthropic_key_enc  TEXT,   -- Anthropic API key
  openai_key_enc     TEXT,   -- OpenAI key
  verify_token       TEXT,   -- WhatsApp verify token (low sensitivity)

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(bot_id)
);

-- ============================================================
-- PHONE MAPPINGS
-- Maps WhatsApp phoneNumberId → user + bot.
-- hmac_sig = HMAC-SHA256(phone_number_id + ":" + user_id, WEBHOOK_SECRET)
-- Verified on every incoming webhook message to prevent phone ID hijacking.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.phone_mappings (
  phone_number_id    TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id             TEXT NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  hmac_sig           TEXT,   -- ownership proof; NULL = legacy row (pre-HMAC)
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE BASE INDEX
-- Metadata for uploaded files/websites per user.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_files (
  id          TEXT PRIMARY KEY,                  -- e.g. "1780254528012-website"
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  type        TEXT,                              -- 'Sitio Web' | 'PDF' | 'DOCX' | 'Imagen'
  size        TEXT,
  status      TEXT DEFAULT 'PROCESANDO',         -- 'PROCESANDO' | 'PROCESADO' | 'ERROR'
  text_file   TEXT,                              -- key to knowledge_content
  preview     TEXT,
  is_image    BOOLEAN DEFAULT FALSE,
  mime_type   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_user_id_idx ON public.knowledge_files(user_id);

-- ============================================================
-- KNOWLEDGE CONTENT
-- Actual text content of files. Images go to Supabase Storage
-- (bucket: knowledge-images) — only the storage path is kept here.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_content (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_key   TEXT NOT NULL,                      -- matches knowledge_files.text_file
  content    TEXT,                               -- extracted text or storage path for images
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, file_key)
);

-- ============================================================
-- CONVERSATIONS
-- Rolling conversation history per user/bot/contact.
-- expires_at: automatic TTL — rows older than 7 days are pruned by pg_cron.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  from_phone  TEXT NOT NULL,
  messages    JSONB DEFAULT '[]',                -- last N messages
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id, from_phone)
);

CREATE INDEX IF NOT EXISTS conversations_user_bot_idx ON public.conversations(user_id, bot_id);
CREATE INDEX IF NOT EXISTS conversations_expires_idx  ON public.conversations(expires_at);

-- ============================================================
-- ANALYTICS (aggregated counters — updated atomically)
-- Race-condition-safe: use UPDATE ... SET total = total + 1
-- Never read-modify-write the JSONB in application code.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id               TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  total_messages       INT DEFAULT 0,
  total_conversations  INT DEFAULT 0,
  daily_counts         JSONB DEFAULT '{}',       -- {"2026-06-01": 5, ...}
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id)
);

-- ============================================================
-- MESSAGE EVENTS
-- Individual message log. Used to derive recent_messages and
-- for analytics queries. Avoids race conditions on the analytics row.
-- Pruned automatically after 30 days.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.message_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  from_phone  TEXT NOT NULL,
  message     TEXT,                              -- first 120 chars of user message
  bot_name    TEXT,
  is_new_conv BOOLEAN DEFAULT FALSE,             -- true if this started a new conversation
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_events_user_bot_idx ON public.message_events(user_id, bot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS message_events_created_idx  ON public.message_events(created_at);

-- ============================================================
-- SUBSCRIPTIONS
-- Stripe subscription data per user.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  plan                   TEXT DEFAULT 'free',
  status                 TEXT,                   -- 'active' | 'canceled' | 'past_due'
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- APPOINTMENTS
-- Individual appointment bookings.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id            TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  from_phone        TEXT,
  data              JSONB NOT NULL DEFAULT '{}', -- form fields filled by customer
  calendar_event_id TEXT,
  sheets_row        INT,
  status            TEXT DEFAULT 'pending',      -- 'pending' | 'confirmed' | 'cancelled'
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON public.appointments(user_id);

-- ============================================================
-- AUDIT LOG
-- Immutable log of changes to sensitive tables.
-- Written by triggers on bot_configs and bot_secrets.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  action      TEXT NOT NULL,                     -- 'INSERT' | 'UPDATE' | 'DELETE'
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_user_idx      ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_table_idx     ON public.audit_log(table_name, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
--
-- Security model:
--   • All server-side code uses SUPABASE_SERVICE_KEY (service_role).
--     service_role bypasses RLS by design — no policies needed for it.
--   • The browser NEVER queries Supabase directly. Auth (Clerk) is
--     handled server-side only.
--   • RLS is a defense-in-depth layer: if the anon or authenticated
--     key is ever accidentally exposed, these policies ensure zero data leaks.
--   • Strategy: deny ALL access to anon + authenticated roles explicitly.
-- ============================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_secrets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_mappings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_files   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log         ENABLE ROW LEVEL SECURITY;

-- Revoke default privileges from anon and authenticated roles.
-- This ensures that even if RLS policies are accidentally misconfigured,
-- these roles have no permissions at the PostgreSQL level either.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Explicit deny-all policies (belt-and-suspenders on top of REVOKE).
-- The service_role bypasses RLS automatically — these policies only
-- affect anon and authenticated connections (which should never reach prod).

CREATE POLICY "deny_all_anon" ON public.users
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.bots
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.bot_configs
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.bot_secrets
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.phone_mappings
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.knowledge_files
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.knowledge_content
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.conversations
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.analytics
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.message_events
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.subscriptions
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.appointments
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.audit_log
  FOR ALL TO anon USING (false);

CREATE POLICY "deny_all_authenticated" ON public.users
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.bots
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.bot_configs
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.bot_secrets
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.phone_mappings
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.knowledge_files
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.knowledge_content
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.conversations
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.analytics
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.message_events
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.subscriptions
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.appointments
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.audit_log
  FOR ALL TO authenticated USING (false);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bots_updated_at
  BEFORE UPDATE ON public.bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bot_configs_updated_at
  BEFORE UPDATE ON public.bot_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bot_secrets_updated_at
  BEFORE UPDATE ON public.bot_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_analytics_updated_at
  BEFORE UPDATE ON public.analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: refresh conversations.expires_at on every update
-- Keeps the TTL window sliding — active conversations don't expire.
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_conversation_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at = NOW() + INTERVAL '7 days';
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conversations_expiry
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION refresh_conversation_expiry();

-- ============================================================
-- TRIGGER: audit log for bot_configs and bot_secrets
-- ============================================================
CREATE OR REPLACE FUNCTION write_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  record_id TEXT;
BEGIN
  record_id := COALESCE(NEW.bot_id, OLD.bot_id);

  -- Exclude encrypted ciphertext from audit log (log key names only, not values)
  INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_TABLE_NAME,
    record_id,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE'
      THEN (to_jsonb(OLD) - 'access_token_enc' - 'anthropic_key_enc' - 'openai_key_enc')
      ELSE NULL
    END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE'
      THEN (to_jsonb(NEW) - 'access_token_enc' - 'anthropic_key_enc' - 'openai_key_enc')
      ELSE NULL
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_bot_configs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.bot_configs
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

CREATE TRIGGER trg_bot_secrets_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.bot_secrets
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

-- ============================================================
-- ATOMIC ANALYTICS HELPER FUNCTION
-- Call this instead of read-modify-write in application code.
-- Safely increments counters and updates daily_counts JSONB atomically.
-- ============================================================
CREATE OR REPLACE FUNCTION increment_analytics(
  p_user_id    TEXT,
  p_bot_id     TEXT,
  p_date       TEXT,   -- 'YYYY-MM-DD'
  p_is_new_conv BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.analytics (user_id, bot_id, total_messages, total_conversations, daily_counts)
  VALUES (
    p_user_id,
    p_bot_id,
    1,
    CASE WHEN p_is_new_conv THEN 1 ELSE 0 END,
    jsonb_build_object(p_date, 1)
  )
  ON CONFLICT (user_id, bot_id) DO UPDATE SET
    total_messages      = analytics.total_messages + 1,
    total_conversations = analytics.total_conversations + CASE WHEN p_is_new_conv THEN 1 ELSE 0 END,
    daily_counts        = jsonb_set(
                            analytics.daily_counts,
                            ARRAY[p_date],
                            to_jsonb(COALESCE((analytics.daily_counts->>p_date)::int, 0) + 1)
                          ),
    updated_at          = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- pg_cron: Automatic cleanup jobs
-- Requires pg_cron extension (enabled above).
-- Supabase Dashboard → Database → Extensions to verify it's on.
-- ============================================================

-- Prune expired conversations daily at 3am UTC
SELECT cron.schedule(
  'prune-expired-conversations',
  '0 3 * * *',
  $$DELETE FROM public.conversations WHERE expires_at < NOW()$$
);

-- Prune message_events older than 30 days daily at 3:15am UTC
SELECT cron.schedule(
  'prune-old-message-events',
  '15 3 * * *',
  $$DELETE FROM public.message_events WHERE created_at < NOW() - INTERVAL '30 days'$$
);

-- Prune audit_log older than 90 days weekly on Sunday at 4am UTC
SELECT cron.schedule(
  'prune-old-audit-log',
  '0 4 * * 0',
  $$DELETE FROM public.audit_log WHERE created_at < NOW() - INTERVAL '90 days'$$
);

-- ============================================================
-- DONE — Next steps:
--   1. Add to Vercel env vars:
--        SUPABASE_URL, SUPABASE_SERVICE_KEY
--        ENCRYPTION_KEY (64-char hex, never commit to git)
--        WEBHOOK_SECRET (32+ random chars)
--        META_APP_SECRET (from Meta Developer Console)
--        WA_VERIFY_TOKEN (random string for WhatsApp webhook verify)
--   2. Run: node scripts/migrate-kv-to-supabase.js --dry-run
--   3. Run: node scripts/migrate-kv-to-supabase.js  (when dry-run looks good)
--   4. Set USE_SUPABASE=true in Vercel env vars and deploy.
--   5. Run: node scripts/backfill-ownership-hmac.js  (adds hmac_sig to existing rows)
-- ============================================================
