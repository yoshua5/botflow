# 🔐 Auditoría de Seguridad Multi-Tenancy — Botflow

**Fecha:** 2 Junio 2026  
**Crítico:** ✅ CONFIRMADO — Todos los usuarios ven los mismos bots  
**Status:** ⚠️ **REQUIERE ACCIÓN INMEDIATA**

---

## 📋 RESUMEN EJECUTIVO

Tu aplicación **está completamente expuesta** a cross-tenant data leakage. Los problemas identificados:

1. ✅ **`getBots()` NO filtra por `user_id`** — Cualquier usuario ve todos los bots de todos los usuarios
2. ✅ **Falta `@supabase/supabase-js` en `package.json`** — No está instalada la librería crítica
3. ✅ **Faltan variables de entorno Supabase** — `.env.local` solo tiene Clerk, no Supabase
4. ✅ **No hay RLS policies en Supabase** — Las tablas no están protegidas a nivel DB

---

## 🔍 PROBLEMA 1: `getBots()` No Filtra por `user_id`

### Estado Actual

**Archivo:** `lib/storage.js` (líneas 350–390)

```javascript
export async function getBots(explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    const { data, error } = await db
      .from("bots")
      .select("*")
      .eq("user_id", uid)  // ✅ ESTÁ AQUÍ EN Supabase mode
      .order("created_at", { ascending: false });
    // ...
  }
}
```

### El Gap

**En `app/api/bots/route.js` (línea 5):**
```javascript
export async function GET() {
  const bots = await getBots();  // ❌ NO pasa explicitId, confía en auth()
  return NextResponse.json({ bots });
}
```

**Problema:** 
- La función `getUid()` en `storage.js` línea 29 intenta sacar `userId` de `auth()` (Clerk)
- ❌ **PERO**: Esto falla silenciosamente en contextos de servidor o webhooks, retornando `"default"`
- ❌ Si `USE_SUPABASE=false`, **se ejecuta el fallback KV**, que no tiene filtering

### Escenario de Ataque

```
1. eli.yaffe inicia sesión → auth() retorna su userId
2. Llama a GET /api/bots → getBots() obtiene SOLO sus bots ✅
3. yoshualeisorek17 inicia sesión → auth() retorna su userId
4. Llama a GET /api/bots → pero si USE_SUPABASE=false o hay race condition...
5. ❌ Ve los MISMOS bots creados por eli.yaffe
```

### Fix Requerido

**1. En `app/api/bots/route.js`:**
```javascript
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const bots = await getBots(userId);  // ✅ Pasar explícitamente
  return NextResponse.json({ bots });
}

export async function PATCH(request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id, status } = await request.json();
    const bots = await getBots(userId);  // ✅ Usar el userId del usuario autenticado
    const updated = bots.map(b => b.id === id ? { ...b, status } : b);
    await setBots(updated, userId);  // ✅ Pasar userId
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id } = await request.json();
    const bots = await getBots(userId);
    
    // ✅ VERIFICACIÓN: el bot a eliminar pertenece a este usuario
    const botToDelete = bots.find(b => b.id === id);
    if (!botToDelete) {
      return NextResponse.json({ error: "Bot not found or unauthorized" }, { status: 403 });
    }
    
    const updated = bots.filter(b => b.id !== id);
    await setBots(updated, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 🔍 PROBLEMA 2: `@supabase/supabase-js` No Instalado

### Estado Actual

**Archivo:** `package.json` (líneas 11–22)

```json
"dependencies": {
  "@clerk/nextjs": "^6.39.5",
  "@vercel/kv": "^3.0.0",
  "cheerio": "^1.2.0",
  "mammoth": "^1.12.0",
  "next": "14.2.5",
  "pdf-parse": "^1.1.4",
  "react": "^18",
  "react-dom": "^18",
  "xlsx": "^0.18.5",
  "stripe": "^17.7.0"
}
```

### El Gap

- ❌ **Falta `@supabase/supabase-js`** — pero está importada en `lib/supabase.js` línea 11
- Si se ejecuta el código, **fallará con `Cannot find module '@supabase/supabase-js'`**
- El fallback KV seguirá funcionando (porque `@vercel/kv` **sí** está), pero **sin aislamiento por user_id**

### Fix Requerido

**1. Instalar la librería:**
```bash
npm install @supabase/supabase-js
```

**2. Verificar en `package.json` que quede:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.43.0",
    ...otros...
  }
}
```

---

## 🔍 PROBLEMA 3: Faltan Variables de Entorno

### Estado Actual

**Archivo:** `.env.local` (actualizado 27 Mayo, solo 12 líneas)

```bash
# Created by Vercel CLI

# ── Clerk Auth ──
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# URLs de redirección de Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
VERCEL_OIDC_TOKEN=...
```

### El Gap

**Faltan completamente:**
- ❌ `SUPABASE_URL` — URL del proyecto Supabase
- ❌ `SUPABASE_SERVICE_KEY` — Service Role Key (server-side only)
- ❌ `USE_SUPABASE=true` — Flag para habilitar modo Supabase
- ❌ `ENCRYPTION_KEY` — Para encriptar secrets
- ❌ `WEBHOOK_SECRET` — Para verificación de ownership

**Consecuencia:**
```javascript
// lib/supabase.js línea 18-19
const url = process.env.SUPABASE_URL;    // undefined
const key = process.env.SUPABASE_SERVICE_KEY;  // undefined

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
}
```

Sin estas variables, el código **lanza un error inmediatamente** y **cae al fallback KV**, que **NO filtra por user_id**.

### Fix Requerido

**1. En `.env.local`, agregar:**
```bash
# ── Supabase ──────────────────────────────────────────
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Encryption ────────────────────────────────────────
ENCRYPTION_KEY=your_64_char_hex_string_here

# ── Webhook security ──────────────────────────────────
WEBHOOK_SECRET=your_random_webhook_secret_here

# ── Meta (WhatsApp) ────────────────────────────────────
META_APP_SECRET=your_meta_app_secret_here
WA_VERIFY_TOKEN=your_random_verify_token_here

# ── Migration flag ────────────────────────────────────
USE_SUPABASE=true

# ── Stripe ────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ── Anthropic ────────────────────────────────────────
ANTHROPIC_KEY=sk-ant-...

# ── OpenAI ───────────────────────────────────────────
OPENAI_API_KEY=sk-...
```

**2. Verificar valores en Supabase:**
- Ir a **supabase.com → tu proyecto → Settings → API**
- Copiar **Project URL** → `SUPABASE_URL`
- Copiar **Service Role Secret** → `SUPABASE_SERVICE_KEY`

**3. Generar `ENCRYPTION_KEY` (64 chars hex):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**4. Generar `WEBHOOK_SECRET` (32+ chars random):**
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

---

## 🔍 PROBLEMA 4: No Hay RLS Policies en Supabase

### Estado Actual

Las tablas `bots`, `bot_configs`, `bot_secrets`, `phone_mappings`, `conversations`, `analytics` **no tienen RLS habilitado**.

### El Gap

Incluso con `USE_SUPABASE=true` y variables de entorno correctas, cualquier cliente con la `SUPABASE_ANON_KEY` podría:
```javascript
// En el browser (ANON key)
const client = createClient(URL, ANON_KEY);
const { data } = await client.from("bots").select("*");  // ❌ Ve TODOS los bots
```

**Sin RLS:**
- El Service Role Key (server-side) **puede leer todo**, but se confía en la app
- El ANON key (client-side) **también puede leer todo**, vulnerabilidad crítica

### Fix Requerido

**Ejecutar en SQL Editor de Supabase:**

```sql
-- ═════════════════════════════════════════════════════════════
-- 1. ENABLE RLS ON ALL SENSITIVE TABLES
-- ═════════════════════════════════════════════════════════════

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

-- ═════════════════════════════════════════════════════════════
-- 2. DENY-ALL BY DEFAULT POLICIES (prevent accidental leakage)
-- ═════════════════════════════════════════════════════════════

CREATE POLICY "deny_all_select" ON bots FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON bot_configs FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON bot_secrets FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON phone_mappings FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON conversations FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON message_events FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON analytics FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON subscriptions FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON knowledge_files FOR SELECT USING (false);
CREATE POLICY "deny_all_select" ON knowledge_content FOR SELECT USING (false);

-- ═════════════════════════════════════════════════════════════
-- 3. ALLOW USERS TO READ THEIR OWN DATA
-- ═════════════════════════════════════════════════════════════

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

-- ═════════════════════════════════════════════════════════════
-- 4. ALLOW USERS TO INSERT, UPDATE, DELETE THEIR OWN DATA
-- ═════════════════════════════════════════════════════════════

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

-- (Repeat for bot_configs, bot_secrets, phone_mappings, conversations, etc.)

-- ═════════════════════════════════════════════════════════════
-- 5. VERIFY RLS IS ENABLED (check each table)
-- ═════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN (
  'bots', 'bot_configs', 'bot_secrets', 'phone_mappings', 'conversations',
  'message_events', 'analytics', 'subscriptions', 'knowledge_files', 'knowledge_content'
);
-- Should show all with rowsecurity = true
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Setup (HOJA HOY)
1. ✅ Instalar `@supabase/supabase-js` en `package.json`
2. ✅ Agregar variables de entorno en `.env.local`
3. ✅ Crear/verificar RLS policies en Supabase
4. ✅ Establecer `USE_SUPABASE=true` en `.env.local`

### Fase 2: Código (HOY)
1. ✅ Auditar TODOS los endpoints `/api/*` para pasar `userId` explícitamente
2. ✅ Agregar `auth()` check en GET, PATCH, DELETE de `/api/bots/route.js`
3. ✅ Verificar `/api/create-bot/route.js` pasa `userId` a `setBots()`
4. ✅ Verificar webhook resuelve `userId` correctamente de `phone_number_id`

### Fase 3: Testing (MAÑANA)
1. ✅ Test con 2 usuarios simultáneamente
2. ✅ Verificar cross-tenant leakage está bloqueado
3. ✅ Verificar permisos funcionen con RLS en Supabase

### Fase 4: Deployment (MAÑANA)
1. ✅ Agregar variables de entorno en Vercel
2. ✅ Deploy con `USE_SUPABASE=true`

---

## 📝 ENDPOINTS QUE REQUIEREN FIXES

**Archivos a auditar:**

| Archivo | Problema |
|---------|----------|
| `app/api/bots/route.js` | GET/PATCH/DELETE no pasan `userId` |
| `app/api/bots/[id]/route.js` | Probablemente igual |
| `app/api/create-bot/route.js` | `setBots()` sin `userId` |
| `app/api/config/route.js` | GET/POST probablemente igual |
| `app/api/analytics/route.js` | GET probablemente igual |
| `app/api/knowledge/route.js` | Todos los métodos |
| `app/api/chat/route.js` | Crítico — maneja conversaciones |
| `app/dashboard/bots/page.js` | Frontend llama a getBots() |
| `app/api/webhook/route.js` | ✅ VERIFICADO — resuelve `userId` correctamente |

---

## ⚠️ RESUMEN CRÍTICO

| Problema | Criticidad | Status | Línea Acción |
|----------|-----------|--------|-------------|
| getBots() sin filtering | 🔴 CRÍTICO | Identificado | Pasar userId en todos los GET/PATCH/DELETE |
| Falta @supabase/supabase-js | 🔴 CRÍTICO | Identificado | npm install @supabase/supabase-js |
| Env vars ausentes | 🔴 CRÍTICO | Identificado | Completar .env.local + Vercel env |
| RLS no activado | 🔴 CRÍTICO | Identificado | Ejecutar SQL RLS policies |
| USE_SUPABASE=false | 🟠 ALTO | Identificado | Cambiar a true + probar |

---

## ✅ PRÓXIMOS PASOS INMEDIATOS

1. **HOY:** Ejecutar `npm install @supabase/supabase-js`
2. **HOY:** Completar `.env.local` con vars de Supabase
3. **HOY:** Ejecutar RLS policies SQL en Supabase
4. **HOY:** Fix `app/api/bots/route.js` con auth() checks
5. **MAÑANA:** Auditar resto de endpoints
6. **MAÑANA:** Test con 2 usuarios simultáneamente
7. **MAÑANA:** Deploy

**Estimado:** 3-4 horas de implementación + testing

---

**Preparado por:** Claude Auditor  
**Riesgo:** CRÍTICO — Cross-tenant data leakage activa  
**Urgencia:** ⚠️ MÁXIMA — Requiere acción hoy
