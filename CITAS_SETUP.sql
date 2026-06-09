-- Run this in your Supabase SQL Editor

-- 1. Fields config: defines what the bot asks per user
CREATE TABLE IF NOT EXISTS public.appointment_fields (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT NOT NULL,
  field_key    TEXT NOT NULL,
  field_label  TEXT NOT NULL,      -- shown to dashboard owner
  question     TEXT NOT NULL,      -- what the bot says to the user
  field_order  INTEGER NOT NULL DEFAULT 0,
  required     BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, field_key)
);

-- 2. Appointments: one row per collected appointment
CREATE TABLE IF NOT EXISTS public.appointments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT NOT NULL,
  bot_id       UUID REFERENCES public.bots(id) ON DELETE SET NULL,
  from_phone   TEXT NOT NULL,
  contact_name TEXT,
  data         JSONB DEFAULT '{}',
  status       TEXT DEFAULT 'pendiente',   -- pendiente | confirmada | cancelada
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add appointment_state column to conversations (tracks mid-flow state)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS appointment_state JSONB DEFAULT NULL;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_appt_fields_user ON public.appointment_fields(user_id, field_order);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments(from_phone);

-- 5. RLS (service role bypasses these, client access is blocked)
ALTER TABLE public.appointment_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_fields" ON public.appointment_fields FOR ALL TO anon    USING (false);
CREATE POLICY "deny_auth_fields" ON public.appointment_fields FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_anon_appts"  ON public.appointments        FOR ALL TO anon    USING (false);
CREATE POLICY "deny_auth_appts"  ON public.appointments        FOR ALL TO authenticated USING (false);

-- 6. Availability config (run this too)
CREATE TABLE IF NOT EXISTS public.appointment_config (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT NOT NULL UNIQUE,
  available_days  INTEGER[] DEFAULT '{1,2,3,4,5}',  -- 0=Sun,1=Mon...6=Sat
  start_time   TEXT DEFAULT '09:00',
  end_time     TEXT DEFAULT '18:00',
  slot_minutes INTEGER DEFAULT 60,
  notes        TEXT DEFAULT '',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.appointment_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_anon_config"  ON public.appointment_config FOR ALL TO anon         USING (false);
CREATE POLICY "deny_auth_config"  ON public.appointment_config FOR ALL TO authenticated USING (false);
