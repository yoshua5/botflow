-- Super Admin System Tables
-- Run this in Supabase SQL Editor

-- Admin notes per user
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements / broadcasts
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  image_url TEXT,
  priority TEXT DEFAULT 'info',
  channels JSONB DEFAULT '[]',
  target_segment TEXT DEFAULT 'all',
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  delivery_stats JSONB DEFAULT '{}'
);

-- In-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- What's New entries
CREATE TABLE IF NOT EXISTS whats_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  learn_more_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User seen whats_new tracking
CREATE TABLE IF NOT EXISTS whats_new_seen (
  user_id TEXT NOT NULL,
  whats_new_id UUID NOT NULL REFERENCES whats_new(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, whats_new_id)
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Landing config CMS
CREATE TABLE IF NOT EXISTS landing_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plans (DB-managed, can override lib/plans.js)
CREATE TABLE IF NOT EXISTS db_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  interval TEXT,
  stripe_price_id TEXT,
  color TEXT DEFAULT '#64748B',
  badge TEXT,
  limits JSONB NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON admin_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whats_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE whats_new_seen ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE db_plans ENABLE ROW LEVEL SECURITY;
