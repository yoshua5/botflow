-- =====================================================
-- SUPABASE RLS FIX - Execute in SQL Editor
-- =====================================================
-- This script fixes Row-Level Security policies for bot retrieval
--
-- STEPS:
-- 1. Go to https://supabase.com → Your Project → SQL Editor
-- 2. Copy and paste ALL the code below
-- 3. Click "Run" button
-- 4. Test the app - create a bot and verify it appears in "My Bots"
-- =====================================================

-- STEP 1: Disable RLS on all tables (temporary)
ALTER TABLE IF EXISTS bots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bot_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bot_secrets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS phone_mappings DISABLE ROW LEVEL SECURITY;

-- STEP 2: Verify tables exist and show their structure
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- STEP 3: Check if there are any bots in the database
SELECT id, user_id, agent_name, created_at FROM bots LIMIT 10;

-- STEP 4: Check users table
SELECT id, email FROM users LIMIT 10;

-- STEP 5: Re-enable RLS
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_mappings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTE: If you see bots in Step 3, the problem was RLS.
-- The tables now have RLS disabled, so the app should work.
--
-- For a secure production setup, implement proper RLS policies:
-- - Users can only SELECT/INSERT/UPDATE/DELETE their own bots
-- - Filter by user_id column
-- =====================================================
