-- ============================================================
-- Migration: Per-bot configuration
-- Add bot_id to appointment_fields, appointment_config,
-- catalog_categories, catalog_items, stripe_connect_accounts
-- ============================================================

-- 1. appointment_fields
ALTER TABLE appointment_fields ADD COLUMN IF NOT EXISTS bot_id UUID REFERENCES bots(id) ON DELETE CASCADE;
DROP INDEX IF EXISTS appointment_fields_user_id_idx;
CREATE INDEX IF NOT EXISTS appointment_fields_user_bot_idx ON appointment_fields(user_id, bot_id);

-- 2. appointment_config — change unique constraint from user_id → (user_id, bot_id)
ALTER TABLE appointment_config ADD COLUMN IF NOT EXISTS bot_id UUID REFERENCES bots(id) ON DELETE CASCADE;
ALTER TABLE appointment_config DROP CONSTRAINT IF EXISTS appointment_config_user_id_key;
ALTER TABLE appointment_config DROP CONSTRAINT IF EXISTS appointment_config_user_id_bot_id_key;
ALTER TABLE appointment_config ADD CONSTRAINT appointment_config_user_id_bot_id_key UNIQUE (user_id, bot_id);

-- 3. catalog_categories
ALTER TABLE catalog_categories ADD COLUMN IF NOT EXISTS bot_id UUID REFERENCES bots(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS catalog_categories_user_bot_idx ON catalog_categories(user_id, bot_id);

-- 4. catalog_items — already linked to categories, but also add direct bot_id for easier filtering
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS bot_id UUID REFERENCES bots(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS catalog_items_user_bot_idx ON catalog_items(user_id, bot_id);

-- 5. stripe_connect_accounts — one Stripe Connect account per bot
ALTER TABLE stripe_connect_accounts ADD COLUMN IF NOT EXISTS bot_id UUID REFERENCES bots(id) ON DELETE CASCADE;
ALTER TABLE stripe_connect_accounts DROP CONSTRAINT IF EXISTS stripe_connect_accounts_user_id_key;
ALTER TABLE stripe_connect_accounts DROP CONSTRAINT IF EXISTS stripe_connect_accounts_user_id_bot_id_key;
ALTER TABLE stripe_connect_accounts ADD CONSTRAINT stripe_connect_accounts_user_id_bot_id_key UNIQUE (user_id, bot_id);

-- Done!
