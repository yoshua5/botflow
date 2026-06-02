/**
 * CRITICAL ROW LEVEL SECURITY (RLS) POLICIES
 *
 * Execute this entire script in your Supabase SQL Editor:
 * 1. Go to supabase.com → your project
 * 2. Click SQL Editor (left sidebar)
 * 3. Click "New Query"
 * 4. Paste entire script below
 * 5. Click "Run"
 *
 * After execution:
 * 6. Verify each table shows "RLS enabled" in the Table info panel
 * 7. Deploy to production with USE_SUPABASE=true in Vercel env vars
 */

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP EXISTING POLICIES (if any) TO AVOID CONFLICTS
-- ============================================================================

-- public.bots
DROP POLICY IF EXISTS "Users can view own bots" ON public.bots;
DROP POLICY IF EXISTS "Users can create bots" ON public.bots;
DROP POLICY IF EXISTS "Users can update own bots" ON public.bots;
DROP POLICY IF EXISTS "Users can delete own bots" ON public.bots;

-- public.bot_configs
DROP POLICY IF EXISTS "Users can view own configs" ON public.bot_configs;
DROP POLICY IF EXISTS "Users can update own configs" ON public.bot_configs;

-- public.bot_secrets
DROP POLICY IF EXISTS "Users can view own secrets" ON public.bot_secrets;
DROP POLICY IF EXISTS "Users can create secrets" ON public.bot_secrets;
DROP POLICY IF EXISTS "Users can update own secrets" ON public.bot_secrets;

-- public.phone_mappings
DROP POLICY IF EXISTS "Users can view own mappings" ON public.phone_mappings;
DROP POLICY IF EXISTS "Users can manage mappings" ON public.phone_mappings;

-- public.conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

-- public.message_events
DROP POLICY IF EXISTS "Users can view own messages" ON public.message_events;

-- public.analytics
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;

-- public.subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

-- public.knowledge_files
DROP POLICY IF EXISTS "Users can view own files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Users can manage own files" ON public.knowledge_files;

-- public.knowledge_content
DROP POLICY IF EXISTS "Users can view own content" ON public.knowledge_content;
DROP POLICY IF EXISTS "Users can manage own content" ON public.knowledge_content;

-- public.users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- ============================================================================
-- 3. BOTS TABLE POLICIES
-- ============================================================================

-- Default deny policy (backup security)
CREATE POLICY "Deny all by default" ON public.bots
  AS RESTRICTIVE
  FOR ALL
  USING (false);

-- Users can view only their own bots
CREATE POLICY "Users can view own bots" ON public.bots
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can create bots (backend sets user_id)
CREATE POLICY "Users can create bots" ON public.bots
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update only their own bots
CREATE POLICY "Users can update own bots" ON public.bots
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete only their own bots
CREATE POLICY "Users can delete own bots" ON public.bots
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- 4. BOT_CONFIGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.bot_configs
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own configs" ON public.bot_configs
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own configs" ON public.bot_configs
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 5. BOT_SECRETS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.bot_secrets
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own secrets" ON public.bot_secrets
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create secrets" ON public.bot_secrets
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own secrets" ON public.bot_secrets
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 6. PHONE_MAPPINGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.phone_mappings
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own mappings" ON public.phone_mappings
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage mappings" ON public.phone_mappings
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update mappings" ON public.phone_mappings
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 7. CONVERSATIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.conversations
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR bot_id IN (SELECT id FROM public.bots WHERE user_id = auth.uid()::text)
  );

-- ============================================================================
-- 8. MESSAGE_EVENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.message_events
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own messages" ON public.message_events
  FOR SELECT
  USING (
    bot_id IN (SELECT id FROM public.bots WHERE user_id = auth.uid()::text)
  );

-- ============================================================================
-- 9. ANALYTICS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.analytics
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own analytics" ON public.analytics
  FOR SELECT
  USING (
    bot_id IN (SELECT id FROM public.bots WHERE user_id = auth.uid()::text)
  );

-- ============================================================================
-- 10. SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.subscriptions
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- 11. KNOWLEDGE_FILES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.knowledge_files
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own files" ON public.knowledge_files
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own files" ON public.knowledge_files
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update files" ON public.knowledge_files
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 12. KNOWLEDGE_CONTENT TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.knowledge_content
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own content" ON public.knowledge_content
  FOR SELECT
  USING (
    file_id IN (
      SELECT id FROM public.knowledge_files WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own content" ON public.knowledge_content
  FOR INSERT
  WITH CHECK (
    file_id IN (
      SELECT id FROM public.knowledge_files WHERE user_id = auth.uid()::text
    )
  );

-- ============================================================================
-- 13. USERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Deny all by default" ON public.users
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- All tables should show "true" in rowsecurity column.
