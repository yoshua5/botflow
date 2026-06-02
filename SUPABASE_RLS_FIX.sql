-- RLS POLICIES - CLEAN VERSION
-- Enable RLS on all tables
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

-- Drop existing policies
DROP POLICY IF EXISTS "Deny all by default" ON public.bots;
DROP POLICY IF EXISTS "Users can view own bots" ON public.bots;
DROP POLICY IF EXISTS "Users can create bots" ON public.bots;
DROP POLICY IF EXISTS "Users can update own bots" ON public.bots;
DROP POLICY IF EXISTS "Users can delete own bots" ON public.bots;

-- BOTS policies
CREATE POLICY "Deny all by default" ON public.bots AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own bots" ON public.bots FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create bots" ON public.bots FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own bots" ON public.bots FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own bots" ON public.bots FOR DELETE USING (auth.uid()::text = user_id);

-- BOT_CONFIGS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.bot_configs;
DROP POLICY IF EXISTS "Users can view own configs" ON public.bot_configs;
DROP POLICY IF EXISTS "Users can update own configs" ON public.bot_configs;
CREATE POLICY "Deny all by default" ON public.bot_configs AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own configs" ON public.bot_configs FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update own configs" ON public.bot_configs FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- BOT_SECRETS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.bot_secrets;
DROP POLICY IF EXISTS "Users can view own secrets" ON public.bot_secrets;
DROP POLICY IF EXISTS "Users can create secrets" ON public.bot_secrets;
DROP POLICY IF EXISTS "Users can update own secrets" ON public.bot_secrets;
CREATE POLICY "Deny all by default" ON public.bot_secrets AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own secrets" ON public.bot_secrets FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create secrets" ON public.bot_secrets FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own secrets" ON public.bot_secrets FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- PHONE_MAPPINGS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.phone_mappings;
DROP POLICY IF EXISTS "Users can view own mappings" ON public.phone_mappings;
DROP POLICY IF EXISTS "Users can manage mappings" ON public.phone_mappings;
DROP POLICY IF EXISTS "Users can update mappings" ON public.phone_mappings;
CREATE POLICY "Deny all by default" ON public.phone_mappings AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own mappings" ON public.phone_mappings FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage mappings" ON public.phone_mappings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update mappings" ON public.phone_mappings FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- CONVERSATIONS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Deny all by default" ON public.conversations AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid()::text = user_id OR bot_id IN (SELECT id FROM public.bots WHERE user_id = auth.uid()::text));

-- MESSAGE_EVENTS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.message_events;
DROP POLICY IF EXISTS "Users can view own messages" ON public.message_events;
CREATE POLICY "Deny all by default" ON public.message_events AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own messages" ON public.message_events FOR SELECT USING (bot_id IN (SELECT id FROM public.bots WHERE user_id = auth.uid()::text));

-- ANALYTICS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.analytics;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
CREATE POLICY "Deny all by default" ON public.analytics AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own analytics" ON public.analytics FOR SELECT USING (bot_id IN (SELECT id FROM public.bots WHERE user_id = auth.uid()::text));

-- SUBSCRIPTIONS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Deny all by default" ON public.subscriptions AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid()::text = user_id);

-- KNOWLEDGE_FILES policies
DROP POLICY IF EXISTS "Deny all by default" ON public.knowledge_files;
DROP POLICY IF EXISTS "Users can view own files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Users can manage own files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Users can update files" ON public.knowledge_files;
CREATE POLICY "Deny all by default" ON public.knowledge_files AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own files" ON public.knowledge_files FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage own files" ON public.knowledge_files FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update files" ON public.knowledge_files FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- KNOWLEDGE_CONTENT policies (FIXED: file_key not file_id)
DROP POLICY IF EXISTS "Deny all by default" ON public.knowledge_content;
DROP POLICY IF EXISTS "Users can view own content" ON public.knowledge_content;
DROP POLICY IF EXISTS "Users can manage own content" ON public.knowledge_content;
CREATE POLICY "Deny all by default" ON public.knowledge_content AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own content" ON public.knowledge_content FOR SELECT USING (file_key IN (SELECT id FROM public.knowledge_files WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own content" ON public.knowledge_content FOR INSERT WITH CHECK (file_key IN (SELECT id FROM public.knowledge_files WHERE user_id = auth.uid()::text));

-- USERS policies
DROP POLICY IF EXISTS "Deny all by default" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Deny all by default" ON public.users AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
