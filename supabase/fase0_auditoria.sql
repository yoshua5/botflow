-- ============================================================
-- FASE 0: AUDITORÍA DE BASE DE DATOS
-- Ejecutar en Supabase → SQL Editor
-- Copiar y pegar el resultado completo y compartirlo
-- ============================================================

-- PASO 1: ¿Qué tablas existen actualmente?
SELECT
  table_name,
  CASE
    WHEN table_name IN ('users','bots','bot_configs','bot_secrets','phone_mappings',
                        'conversations','analytics','message_events','subscriptions',
                        'appointments','knowledge_files','knowledge_content','audit_log')
    THEN 'schema v2'
    WHEN table_name IN ('appointment_config','appointment_fields','appointment_sessions',
                        'catalog_categories','catalog_items','catalog_orders',
                        'stripe_connect_accounts','payment_notifications',
                        'announcements','notifications','whats_new','whats_new_seen',
                        'admin_notes','admin_audit_log','platform_commission',
                        'db_plans')
    THEN 'ad-hoc'
    ELSE 'desconocida'
  END AS origen
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY origen, table_name;

-- PASO 2: ¿Cuántos registros hay en las tablas críticas?
SELECT
  'users'               AS tabla, COUNT(*) AS registros FROM users
UNION ALL SELECT
  'bots',               COUNT(*) FROM bots
UNION ALL SELECT
  'bot_configs',        COUNT(*) FROM bot_configs
UNION ALL SELECT
  'bot_secrets',        COUNT(*) FROM bot_secrets
UNION ALL SELECT
  'phone_mappings',     COUNT(*) FROM phone_mappings
UNION ALL SELECT
  'subscriptions',      COUNT(*) FROM subscriptions
UNION ALL SELECT
  'conversations',      COUNT(*) FROM conversations
UNION ALL SELECT
  'appointments',       COUNT(*) FROM appointments
ORDER BY tabla;

-- PASO 3: ¿Las tablas ad-hoc tienen datos?
-- (Solo ejecutar si existieron en el PASO 1)
SELECT
  'appointment_config'    AS tabla, COUNT(*) AS registros FROM appointment_config
UNION ALL SELECT
  'appointment_fields',   COUNT(*) FROM appointment_fields
UNION ALL SELECT
  'catalog_categories',   COUNT(*) FROM catalog_categories
UNION ALL SELECT
  'catalog_items',        COUNT(*) FROM catalog_items
UNION ALL SELECT
  'stripe_connect_accounts', COUNT(*) FROM stripe_connect_accounts
ORDER BY tabla;

-- PASO 4: ¿Las tablas ad-hoc ya tienen columna bot_id?
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'appointment_config','appointment_fields','appointment_sessions',
    'catalog_categories','catalog_items','catalog_orders',
    'stripe_connect_accounts'
  )
  AND column_name IN ('bot_id','user_id')
ORDER BY table_name, column_name;

-- PASO 5: ¿Existe la columna stripe_account_id_enc en bot_secrets?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bot_secrets'
ORDER BY ordinal_position;

-- PASO 6: ¿Qué políticas RLS están activas?
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- PASO 7: ¿Hay datos de usuario reales que preservar?
SELECT id, email, created_at, plan
FROM users
ORDER BY created_at
LIMIT 10;
