-- ============================================================
-- ANALYTICS TABLES SETUP
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Analytics aggregated counters per user
CREATE TABLE IF NOT EXISTS public.analytics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id               TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  total_messages       INT DEFAULT 0,
  total_conversations  INT DEFAULT 0,
  daily_counts         JSONB DEFAULT '{}',
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index to handle NULL bot_id correctly
CREATE UNIQUE INDEX IF NOT EXISTS analytics_user_no_bot
  ON public.analytics (user_id) WHERE bot_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS analytics_user_bot
  ON public.analytics (user_id, bot_id) WHERE bot_id IS NOT NULL;

-- Individual message events
CREATE TABLE IF NOT EXISTS public.message_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  from_phone  TEXT NOT NULL,
  message     TEXT,
  bot_name    TEXT,
  is_new_conv BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_events_user_bot_idx
  ON public.message_events(user_id, bot_id, created_at DESC);

CREATE INDEX IF NOT EXISTS message_events_created_idx
  ON public.message_events(created_at);

-- Updated_at trigger for analytics
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_analytics_updated_at ON public.analytics;
CREATE TRIGGER trg_analytics_updated_at
  BEFORE UPDATE ON public.analytics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Atomic increment function (handles NULL bot_id)
CREATE OR REPLACE FUNCTION increment_analytics(
  p_user_id     TEXT,
  p_bot_id      TEXT,
  p_date        TEXT,
  p_is_new_conv BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  IF p_bot_id IS NULL THEN
    INSERT INTO public.analytics (user_id, bot_id, total_messages, total_conversations, daily_counts)
    VALUES (p_user_id, NULL, 1, CASE WHEN p_is_new_conv THEN 1 ELSE 0 END, jsonb_build_object(p_date, 1))
    ON CONFLICT (user_id) WHERE bot_id IS NULL DO UPDATE SET
      total_messages      = analytics.total_messages + 1,
      total_conversations = analytics.total_conversations + CASE WHEN p_is_new_conv THEN 1 ELSE 0 END,
      daily_counts        = jsonb_set(
                              analytics.daily_counts,
                              ARRAY[p_date],
                              to_jsonb(COALESCE((analytics.daily_counts->>p_date)::int, 0) + 1)
                            ),
      updated_at = NOW();
  ELSE
    INSERT INTO public.analytics (user_id, bot_id, total_messages, total_conversations, daily_counts)
    VALUES (p_user_id, p_bot_id, 1, CASE WHEN p_is_new_conv THEN 1 ELSE 0 END, jsonb_build_object(p_date, 1))
    ON CONFLICT (user_id, bot_id) WHERE bot_id IS NOT NULL DO UPDATE SET
      total_messages      = analytics.total_messages + 1,
      total_conversations = analytics.total_conversations + CASE WHEN p_is_new_conv THEN 1 ELSE 0 END,
      daily_counts        = jsonb_set(
                              analytics.daily_counts,
                              ARRAY[p_date],
                              to_jsonb(COALESCE((analytics.daily_counts->>p_date)::int, 0) + 1)
                            ),
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: block anon and client-side authenticated (service role bypasses)
ALTER TABLE public.analytics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_all_anon" ON public.analytics;
DROP POLICY IF EXISTS "deny_all_anon" ON public.message_events;
DROP POLICY IF EXISTS "deny_all_authenticated" ON public.analytics;
DROP POLICY IF EXISTS "deny_all_authenticated" ON public.message_events;

CREATE POLICY "deny_all_anon" ON public.analytics
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon" ON public.message_events
  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.analytics
  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated" ON public.message_events
  FOR ALL TO authenticated USING (false);

-- Optional: auto-prune message_events older than 30 days
-- Requires pg_cron extension (enable in Supabase Dashboard → Extensions)
-- SELECT cron.schedule('prune-message-events', '15 3 * * *',
--   $$DELETE FROM public.message_events WHERE created_at < NOW() - INTERVAL '30 days'$$);
