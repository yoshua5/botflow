# 🔧 FIXES LISTOS PARA APLICAR

## FIX 1: Instalar @supabase/supabase-js

### Comando
```bash
npm install @supabase/supabase-js
```

### Resultado esperado
```
added 1 package in X.XXs
```

---

## FIX 2: Completar `.env.local`

**Ruta:** `C:\Users\18582\Desktop\ai-apps\botflow\.env.local`

Reemplazar con:

```bash
# Created by Vercel CLI

# ── Clerk Auth (agregar keys reales de https://dashboard.clerk.com) ──
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2hlZXJmdWwtdGFoci02NS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_qtVgvxGbR9I4j4S2sVfKhPvik2ZQqSMSILRfcDsbQe

# URLs de redirección de Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ── Supabase ──────────────────────────────────────────────────────
# Get from: supabase.com → your project → Settings → API
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Encryption ────────────────────────────────────────────────────
# AES-256 key for encrypting API keys stored in bot_secrets.
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_char_hex_string_here

# ── Webhook security ──────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
WEBHOOK_SECRET=your_random_webhook_secret_here

# ── Meta (WhatsApp) ───────────────────────────────────────────────
META_APP_SECRET=your_meta_app_secret_here
WA_VERIFY_TOKEN=your_random_verify_token_here

# ── Migration flag ────────────────────────────────────────────────
USE_SUPABASE=true

# ── Stripe ────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ── Anthropic ────────────────────────────────────────────────────
ANTHROPIC_KEY=sk-ant-...

# ── OpenAI ───────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...

# ── Vercel OIDC ───────────────────────────────────────────────────
VERCEL_OIDC_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9...
```

**Instrucciones:**
1. Obtener Supabase URL y Service Key de: https://supabase.com → tu proyecto → Settings → API
2. Generar ENCRYPTION_KEY: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Generar WEBHOOK_SECRET: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
4. Completar valores de Meta, Stripe, Anthropic, OpenAI según corresponda

---

## FIX 3: Ejecutar RLS Policies en Supabase

**Dónde:** https://supabase.com → tu proyecto → SQL Editor

**Script a ejecutar:**

```sql
-- ════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ════════════════════════════════════════════════════════════════

ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_content ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════
-- CREATE DENY-ALL DEFAULT POLICIES
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "deny_default_select" ON bots FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON bot_configs FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON bot_secrets FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON phone_mappings FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON conversations FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON message_events FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON analytics FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON subscriptions FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON knowledge_files FOR SELECT USING (false);
CREATE POLICY "deny_default_select" ON knowledge_content FOR SELECT USING (false);

-- ════════════════════════════════════════════════════════════════
-- ALLOW USERS TO READ THEIR OWN DATA
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "user_isolation_select" ON bots
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON bot_configs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON bot_secrets
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON phone_mappings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON conversations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON message_events
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON analytics
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON knowledge_files
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_isolation_select" ON knowledge_content
  FOR SELECT
  USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- ALLOW USERS TO INSERT/UPDATE/DELETE THEIR OWN DATA
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "user_isolation_insert" ON bots
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON bots
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON bots
  FOR DELETE
  USING (user_id = auth.uid());

-- bot_configs
CREATE POLICY "user_isolation_insert" ON bot_configs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON bot_configs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON bot_configs
  FOR DELETE
  USING (user_id = auth.uid());

-- bot_secrets
CREATE POLICY "user_isolation_insert" ON bot_secrets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON bot_secrets
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON bot_secrets
  FOR DELETE
  USING (user_id = auth.uid());

-- phone_mappings
CREATE POLICY "user_isolation_insert" ON phone_mappings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON phone_mappings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON phone_mappings
  FOR DELETE
  USING (user_id = auth.uid());

-- conversations
CREATE POLICY "user_isolation_insert" ON conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON conversations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON conversations
  FOR DELETE
  USING (user_id = auth.uid());

-- message_events
CREATE POLICY "user_isolation_insert" ON message_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON message_events
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON message_events
  FOR DELETE
  USING (user_id = auth.uid());

-- analytics
CREATE POLICY "user_isolation_insert" ON analytics
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON analytics
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON analytics
  FOR DELETE
  USING (user_id = auth.uid());

-- subscriptions
CREATE POLICY "user_isolation_insert" ON subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- knowledge_files
CREATE POLICY "user_isolation_insert" ON knowledge_files
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON knowledge_files
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON knowledge_files
  FOR DELETE
  USING (user_id = auth.uid());

-- knowledge_content
CREATE POLICY "user_isolation_insert" ON knowledge_content
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON knowledge_content
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON knowledge_content
  FOR DELETE
  USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- VERIFY RLS IS ENABLED
-- ════════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN (
  'bots', 'bot_configs', 'bot_secrets', 'phone_mappings', 'conversations',
  'message_events', 'analytics', 'subscriptions', 'knowledge_files', 'knowledge_content'
) ORDER BY tablename;
```

---

## FIX 4: Actualizar `app/api/bots/route.js`

**Ruta:** `C:\Users\18582\Desktop\ai-apps\botflow\app\api\bots\route.js`

**Reemplazar con:**

```javascript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBots, setBots } from "@/lib/storage";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const bots = await getBots(userId);
    return NextResponse.json({ bots });
  } catch (err) {
    console.error("GET /api/bots error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();
    const bots = await getBots(userId);

    // Verify the bot belongs to this user
    const botExists = bots.some(b => b.id === id);
    if (!botExists) {
      return NextResponse.json(
        { error: "Bot not found or unauthorized" },
        { status: 403 }
      );
    }

    const updated = bots.map(b => b.id === id ? { ...b, status } : b);
    await setBots(updated, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/bots error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await request.json();
    const bots = await getBots(userId);

    // Verify the bot belongs to this user before deleting
    const botToDelete = bots.find(b => b.id === id);
    if (!botToDelete) {
      return NextResponse.json(
        { error: "Bot not found or unauthorized" },
        { status: 403 }
      );
    }

    const updated = bots.filter(b => b.id !== id);
    await setBots(updated, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/bots error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
```

---

## FIX 5: Verificar `app/api/create-bot/route.js` (línea 52, 73, 84, 157, 168)

**Archivo:** `C:\Users\18582\Desktop\ai-apps\botflow\app\api\create-bot\route.js`

**Cambios necesarios:**

**Línea 51-52 (agregar userId):**
```javascript
export async function POST(request) {
  const { userId } = auth();  // ✅ AGREGAR
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { step, userAnswer, answers, anthropicKey, _autofill } = await request.json();

  const config = await getConfig(userId);  // ✅ Pasar userId
```

**Línea 73 (setBots con userId):**
```javascript
      bots.unshift(newBot);
      await setBots(bots, userId);  // ✅ Pasar userId
      return NextResponse.json({ success: true, bot: newBot });
```

**Línea 157-170 (setConfig y setBots con userId):**
```javascript
      await setConfig(newConfig, userId);  // ✅ Pasar userId

      const bots   = await getBots(userId);  // ✅ Pasar userId
      const newBot = {
        id:                `bot-${Date.now()}`,
        name:              merged.businessName || "Mi Bot",
        agentName:         merged.agentName    || "Asistente",
        businessName:      merged.businessName || "Mi negocio",
        status:            "ACTIVO",
        createdAt:         new Date().toISOString(),
        messageCount:      0,
        conversationCount: 0,
      };
      bots.unshift(newBot);
      await setBots(bots, userId);  // ✅ Pasar userId
```

---

## FIX 6: Verificar Otros Endpoints

**Auditar estos endpoints para pasar `userId` explícitamente:**

1. `app/api/bots/[id]/route.js` — GET, PATCH, DELETE
2. `app/api/config/route.js` — GET, POST
3. `app/api/analytics/route.js` — GET
4. `app/api/knowledge/route.js` — GET, POST, DELETE
5. `app/api/chat/route.js` — POST
6. `app/api/settings/*` — Todos

**Patrón a seguir:**
```javascript
import { auth } from "@clerk/nextjs/server";

export async function GET(request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // ... rest of logic, pasar userId a todas las funciones de storage
  const data = await getConfig(userId);
}
```

---

## CHECKLIST DE IMPLEMENTACIÓN

- [ ] `npm install @supabase/supabase-js`
- [ ] Completar `.env.local` con Supabase vars
- [ ] Ejecutar RLS SQL en Supabase
- [ ] Fijar `USE_SUPABASE=true` en `.env.local`
- [ ] Actualizar `app/api/bots/route.js`
- [ ] Actualizar `app/api/create-bot/route.js`
- [ ] Auditar y fijar resto de endpoints
- [ ] Test local con 2 usuarios simultáneamente
- [ ] Deploy a Vercel con env vars
- [ ] Verificar cross-tenant leakage está bloqueado

---

**Tiempo estimado:** 3-4 horas  
**Crítico:** Estos fixes DEBEN aplicarse hoy
