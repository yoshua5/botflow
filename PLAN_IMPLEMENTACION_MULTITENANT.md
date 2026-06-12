# Plan de Implementación: SaaS Multi-Tenant con Meta Embedded Signup
**Proyecto:** AgentFlow  
**Fecha:** Junio 2026  
**Estado:** Documento de referencia — NO modificar código sin seguir este orden

---

## Resumen Ejecutivo

El sistema tiene una base sólida (`lib/crypto.js`, `lib/storage.js`, `supabase/schema.sql` v2, `app/api/whatsapp-signup/route.js`) que ya contempla multi-tenancy. El problema es que creció en dos direcciones en paralelo (tablas v2 del schema + tablas ad-hoc) y hay un bug crítico que anula el aislamiento de tokens. Este plan corrige todo en 4 fases ordenadas, sin reescribir desde cero.

**Lo que NO se toca (funciona bien):**
- Toda la UI / páginas del dashboard
- `lib/crypto.js` — encriptación AES-256-GCM completa
- `app/api/webhook/route.js` — arquitectura de routing por `phone_number_id` correcta
- `supabase/schema.sql` — este ES el schema correcto, se usa como base

---

## Bug Crítico Identificado (Prioridad 0)

**Archivo:** `lib/storage.js`, función `envOverrides()` línea ~100  
**Problema:** La función siempre sobreescribe el token del bot con el token del env var:
```js
return { ...stored, ...envOverrides() };  // env SIEMPRE gana
```
Esto significa que aunque cada bot tenga su propio `access_token_enc` en `bot_secrets`, todos terminan usando `WA_ACCESS_TOKEN` del `.env`. Multi-tenancy roto en la base.  
**Fix:** `envOverrides()` solo debe aplicar cuando no existe valor en DB. Se corrige en Fase 1.

---

## Estructura de Fases

| Fase | Nombre | Duración estimada | Bloquea |
|------|--------|-------------------|---------|
| 0 | Auditoría y baseline | 1 día | Todo lo demás |
| 1 | Base de datos unificada + bug fix crítico | 3-4 días | Fases 2, 3, 4 |
| 2 | Embedded Signup completo | 3-4 días | Fase 3 |
| 3 | Unificación de features (citas/tienda/pagos) | 4-5 días | Fase 4 |
| 4 | Planes, onboarding y enforcement | 3-4 días | Producción |
| — | Meta Business Verification (externo) | 1-5 días hábiles | Usuarios externos |

**Total estimado de código:** ~3 semanas  
**En paralelo:** iniciar Meta Business Verification desde el día 1

---

---

# FASE 0 — Auditoría y Baseline
**Objetivo:** Saber exactamente qué hay en Supabase antes de tocar nada.  
**Duración:** 1 día  
**No se escribe código en esta fase.**

## Paso 0.1 — Verificar qué tablas existen en Supabase

Ir a Supabase Dashboard → SQL Editor → ejecutar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Resultado esperado:** Anotar cuáles de estas tablas existen:
- `users` ✓/✗
- `bots` ✓/✗
- `bot_configs` ✓/✗
- `bot_secrets` ✓/✗
- `phone_mappings` ✓/✗
- `conversations` ✓/✗
- `analytics` ✓/✗
- `appointments` (v2) ✓/✗
- `appointment_config` (ad-hoc) ✓/✗
- `appointment_fields` (ad-hoc) ✓/✗
- `catalog_categories` ✓/✗
- `catalog_items` ✓/✗
- `stripe_connect_accounts` ✓/✗
- `knowledge_files` ✓/✗
- `subscriptions` ✓/✗

## Paso 0.2 — Verificar datos existentes

```sql
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as bots FROM bots;
SELECT COUNT(*) as bot_configs FROM bot_configs;
SELECT COUNT(*) as bot_secrets FROM bot_secrets;
```

**Checkpoint 0 ✅** — Documentar qué tablas existen y cuántos registros hay. Confirmar que no hay datos de producción reales que preservar antes de continuar.

---

---

# FASE 1 — Base de Datos Unificada + Fix Bug Crítico
**Objetivo:** Un solo schema limpio, bug de tokens corregido, y prueba de que tokens por bot funcionan.  
**Duración:** 3-4 días  
**Prerequisito:** Fase 0 completada.

## Paso 1.1 — Ejecutar schema v2 completo en Supabase

**Archivo:** `supabase/schema.sql` (ya existe en el repo, 360 líneas)  
**Acción:** Ir a Supabase → SQL Editor → ejecutar el archivo completo.

El schema v2 crea/actualiza:
- `users`, `bots`, `bot_configs`, `bot_secrets`, `phone_mappings`
- `knowledge_files`, `knowledge_content`, `conversations`
- `analytics`, `message_events`, `subscriptions`, `appointments`, `audit_log`
- RLS deny-all para anon/authenticated
- Triggers de `updated_at`
- Trigger de audit log en `bot_configs` y `bot_secrets`
- Función `increment_analytics()`
- Jobs de pg_cron para limpieza automática

**Si alguna tabla ya existe:** el schema usa `CREATE TABLE IF NOT EXISTS` — no rompe datos existentes.

**Checkpoint 1.1 ✅** — Ejecutar en Supabase:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```
Deben aparecer todas las tablas del schema v2.

## Paso 1.2 — Ejecutar migration de tablas ad-hoc

Crear nuevo archivo `supabase/migrations/001_addhoc_tables.sql` con las tablas que NO están en el schema v2 pero sí se usan en el código:

```sql
-- Tablas ad-hoc que se mantienen durante la transición
-- Eventualmente se consolidan en bot_configs en Fase 3

-- appointment_fields: configuración de campos por bot
CREATE TABLE IF NOT EXISTS public.appointment_fields (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id     TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  field_key  TEXT NOT NULL,
  field_label TEXT NOT NULL,
  question   TEXT,
  field_order INT DEFAULT 0,
  required   BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.appointment_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.appointment_fields FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.appointment_fields FOR ALL TO authenticated USING (false);

-- appointment_config: horarios y disponibilidad por bot
CREATE TABLE IF NOT EXISTS public.appointment_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id         TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  available_days INT[] DEFAULT '{1,2,3,4,5}',
  start_time     TEXT DEFAULT '09:00',
  end_time       TEXT DEFAULT '18:00',
  slot_minutes   INT DEFAULT 60,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id)
);
ALTER TABLE public.appointment_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.appointment_config FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.appointment_config FOR ALL TO authenticated USING (false);

-- appointment_sessions: estado temporal de conversación de cita
CREATE TABLE IF NOT EXISTS public.appointment_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_phone TEXT NOT NULL,
  state      JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, from_phone)
);
ALTER TABLE public.appointment_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.appointment_sessions FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.appointment_sessions FOR ALL TO authenticated USING (false);

-- catalog_categories
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id      TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.catalog_categories FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.catalog_categories FOR ALL TO authenticated USING (false);

-- catalog_items
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id             TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  category_id        UUID REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  description        TEXT,
  price              NUMERIC(10,2),
  currency           TEXT DEFAULT 'MXN',
  type               TEXT DEFAULT 'service',
  images             JSONB DEFAULT '[]',
  sku                TEXT,
  inventory          INT,
  status             TEXT DEFAULT 'active',
  tags               TEXT[] DEFAULT '{}',
  stripe_product_id  TEXT,
  stripe_price_id    TEXT,
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.catalog_items FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.catalog_items FOR ALL TO authenticated USING (false);

-- catalog_orders
CREATE TABLE IF NOT EXISTS public.catalog_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id           TEXT REFERENCES public.bots(id) ON DELETE SET NULL,
  item_id          UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  customer_phone   TEXT,
  customer_name    TEXT,
  total_amount     NUMERIC(10,2),
  platform_fee     NUMERIC(10,2),
  seller_payout    NUMERIC(10,2),
  currency         TEXT DEFAULT 'MXN',
  status           TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.catalog_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.catalog_orders FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.catalog_orders FOR ALL TO authenticated USING (false);

-- stripe_connect_accounts: cuenta Stripe Connect por bot
-- Los tokens de Stripe van encriptados en bot_secrets (Fase 3)
-- Esta tabla guarda solo metadata pública
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id              TEXT REFERENCES public.bots(id) ON DELETE CASCADE,
  stripe_account_id   TEXT NOT NULL,
  status              TEXT DEFAULT 'pending',
  email               TEXT,
  charges_enabled     BOOLEAN DEFAULT FALSE,
  payouts_enabled     BOOLEAN DEFAULT FALSE,
  details_submitted   BOOLEAN DEFAULT FALSE,
  onboarding_url      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id)
);
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.stripe_connect_accounts FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.stripe_connect_accounts FOR ALL TO authenticated USING (false);

-- Super admin tables
CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT DEFAULT 'info',
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.announcements FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.announcements FOR ALL TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.whats_new (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version    TEXT,
  title      TEXT NOT NULL,
  body       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.whats_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.whats_new FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.whats_new FOR ALL TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.whats_new_seen (
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES public.whats_new(id) ON DELETE CASCADE,
  seen_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);
ALTER TABLE public.whats_new_seen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.whats_new_seen FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.whats_new_seen FOR ALL TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id   TEXT,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.admin_notes FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.admin_notes FOR ALL TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.platform_commission (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage      NUMERIC(5,2) DEFAULT 5.00,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.platform_commission ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.platform_commission FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.platform_commission FOR ALL TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.db_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  price_monthly NUMERIC(8,2),
  max_bots      INT DEFAULT 1,
  features      JSONB DEFAULT '[]',
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.db_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.db_plans FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.db_plans FOR ALL TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT,
  body       TEXT,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.notifications FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.notifications FOR ALL TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES public.catalog_orders(id) ON DELETE SET NULL,
  message    TEXT,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.payment_notifications FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.payment_notifications FOR ALL TO authenticated USING (false);
```

**Checkpoint 1.2 ✅** — Ejecutar en Supabase:
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Debe retornar 30+ tablas
```

## Paso 1.3 — Fix Bug Crítico: `envOverrides()` rompe multi-tenancy

**Archivo a modificar:** `lib/storage.js`  
**Problema:** `envOverrides()` aplica siempre en última posición, sobreescribiendo tokens de DB con env vars.

**Cambio:** La función `getConfig()` debe aplicar env vars SOLO como fallback (cuando el campo no existe en DB), no como override.

```js
// ANTES (línea ~280 en getConfig):
return { ...stored, ...envOverrides() };

// DESPUÉS:
// Solo usar env vars si el campo no existe en DB
const env = envOverrides();
const merged = { ...stored };
for (const [k, v] of Object.entries(env)) {
  if (!merged[k]) merged[k] = v;  // env solo como fallback
}
return merged;
```

**Excepción:** `anthropicKey` siempre puede venir del env (es la key de la plataforma, compartida). Solo `accessToken`, `phoneNumberId`, `waBusinessId` deben ser por-bot.

**Checkpoint 1.3 ✅** — Test en desarrollo:
1. Crear dos bots con diferentes `phone_number_id` en Supabase
2. Guardar un token ficticio en `bot_secrets` para cada uno
3. Llamar `getConfig(userId, botId1)` y `getConfig(userId, botId2)`
4. Verificar que cada llamada retorna el token de su bot, no el del `.env`
5. Log en consola debe mostrar: `🤖 Bot: NombreBot (id: bot-xxx)`

## Paso 1.4 — Agregar `ENCRYPTION_KEY` a variables de entorno

**Requerido para que `bot_secrets` funcione.**

Generar la key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Agregar en Vercel → Settings → Environment Variables:
- `ENCRYPTION_KEY` = (el hex generado, 64 caracteres)

También agregar en `.env.local` para desarrollo local.

**Checkpoint 1.4 ✅** — Ejecutar en Node:
```js
import { encrypt, decrypt } from './lib/crypto.js';
const enc = encrypt("test-token-12345");
console.log(enc);  // debe iniciar con "v1:"
const dec = decrypt(enc);
console.log(dec === "test-token-12345");  // true
```

## Paso 1.5 — Verificar `USE_SUPABASE` flag

**Archivo:** `lib/storage.js` línea ~1  
Verificar que `USE_SUPABASE=true` está en las variables de entorno de Vercel y en `.env.local`. Sin esto, el código usa archivos locales o KV en lugar de Supabase.

**Checkpoint 1.5 ✅** — En la consola de Vercel (logs de una request cualquiera) debe aparecer:
```
✅ getBots: Found X bots for user_id: ...
```
Y NO debe aparecer:
```
⚠️ setConfig: no Supabase bot found → saving config to local file
```

---

**CHECKPOINT DE FASE 1 ✅**

Antes de continuar a Fase 2, verificar:
- [ ] Schema v2 corriendo en Supabase (todas las tablas existen)
- [ ] Tablas ad-hoc migradas con RLS deny-all
- [ ] `ENCRYPTION_KEY` en Vercel env vars
- [ ] Bug de `envOverrides()` corregido
- [ ] `USE_SUPABASE=true` en env vars
- [ ] Crear un bot de prueba manualmente en Supabase y verificar que el dashboard lo carga

---

---

# FASE 2 — Meta Embedded Signup Completo
**Objetivo:** Un usuario puede entrar al portal, crear un bot, conectar su WhatsApp y empezar a recibir mensajes. Sin pegar tokens manualmente.  
**Duración:** 3-4 días  
**Prerequisito:** Fase 1 completada.

## Contexto: Cómo funciona Meta Embedded Signup

El flujo completo paso a paso:

```
1. Usuario click "Conectar WhatsApp" en tu portal
2. Se abre popup de Facebook Login con permisos:
   - whatsapp_business_management
   - whatsapp_business_messaging  
   - business_management
3. Usuario autoriza en Facebook → Meta regresa un "code" a tu app
4. Tu backend (whatsapp-signup/route.js) intercambia code → access_token
5. Tu backend llama a Meta API para listar WABAs y números del usuario
6. Tu backend:
   a. Guarda el access_token encriptado en bot_secrets
   b. Guarda phone_number_id en bots.phone_number_id
   c. Registra el número en phone_mappings (para el webhook)
   d. Llama a Meta API para suscribir la WABA al webhook de tu app
7. Dashboard muestra "✅ Conectado — +52 55 XXXX XXXX"
8. Los mensajes de WhatsApp llegan al webhook, se enrutan al bot correcto
```

## Paso 2.1 — Configurar Meta App para Embedded Signup

**Acciones en Meta Developer Console (developers.facebook.com):**

1. **Habilitar WhatsApp → Embedded Signup** en tu Meta App:
   - Meta App → WhatsApp → Configuration → Embedded Signup → Enable

2. **Agregar dominio a "Valid OAuth Redirect URIs":**
   - `https://botflow-nine.vercel.app/api/whatsapp/callback`
   - `http://localhost:3000/api/whatsapp/callback` (desarrollo)

3. **Agregar dominio a "Allowed Domains"** en Facebook Login settings:
   - `botflow-nine.vercel.app`
   - `localhost`

4. **Configurar permisos de la App** (App Review → Permissions):
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
   - `business_management`
   - Nota: Para pruebas con tu propia cuenta, no necesitas aprobación. Para usuarios externos, sí.

5. **Agregar variables de entorno en Vercel:**
   - `META_APP_ID` = (tu App ID de Meta)
   - `META_APP_SECRET` = (ya existe)
   - `NEXT_PUBLIC_META_APP_ID` = (mismo App ID, para el frontend)

**Checkpoint 2.1 ✅**
- [ ] Embedded Signup activado en Meta Developer Console
- [ ] Redirect URIs configurados
- [ ] `META_APP_ID` y `NEXT_PUBLIC_META_APP_ID` en Vercel env vars

## Paso 2.2 — Completar `app/api/whatsapp-signup/route.js`

El backend ya existe (120 líneas). Necesita estas adiciones:

**2.2.1 — Convertir user token a System User token (permanente)**

Los tokens de usuario expiran en ~60 días. Para producción se necesita un System User token que no expira.

```js
// Después de obtener userToken, obtener long-lived token:
const llRes = await fetch(
  `https://graph.facebook.com/v21.0/oauth/access_token` +
  `?grant_type=fb_exchange_token` +
  `&client_id=${appId}` +
  `&client_secret=${appSecret}` +
  `&fb_exchange_token=${userToken}`
);
const llData = await llRes.json();
const longLivedToken = llData.access_token || userToken;
// longLivedToken dura ~60 días (para producción usar System Users)
```

**2.2.2 — Guardar token encriptado en `bot_secrets`**

```js
import { safeEncrypt } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";

// Guardar en bot_secrets
await supabase().from("bot_secrets").upsert({
  bot_id: botId,
  user_id: userId,
  access_token_enc: safeEncrypt(longLivedToken),
  verify_token: process.env.WA_VERIFY_TOKEN || "agentflow_verify",
  updated_at: new Date().toISOString(),
}, { onConflict: "bot_id" });
```

**2.2.3 — Registrar `phone_number_id` en `bots` y `phone_mappings`**

```js
// Actualizar bots
await supabase().from("bots").update({
  phone_number_id: phoneNumberId,
  wa_business_id:  wabaId,
  display_phone:   displayPhone,
  updated_at:      new Date().toISOString(),
}).eq("id", botId).eq("user_id", userId);

// Registrar en phone_mappings para el webhook
await supabase().from("phone_mappings").upsert({
  phone_number_id: phoneNumberId,
  user_id:         userId,
  bot_id:          botId,
}, { onConflict: "phone_number_id" });
```

**2.2.4 — Suscribir WABA al webhook de tu app**

Este paso es CRÍTICO y actualmente no existe. Sin él, Meta no envía mensajes al webhook.

```js
// Suscribir la WABA al webhook de tu app
// Esto se hace UNA SOLA VEZ por WABA
const subscribeRes = await fetch(
  `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`,
  {
    method: "POST",
    headers: { "Authorization": `Bearer ${longLivedToken}` },
  }
);
const subscribeData = await subscribeRes.json();
if (!subscribeData.success) {
  console.error("⚠️ WABA subscription failed:", subscribeData);
  // No es fatal — el admin puede hacer esto manualmente
}
```

**Checkpoint 2.2 ✅** — En Supabase, verificar después de conectar un número:
```sql
SELECT bs.bot_id, LEFT(bs.access_token_enc, 10) as token_enc,
       b.phone_number_id, b.display_phone
FROM bot_secrets bs
JOIN bots b ON b.id = bs.bot_id
WHERE b.user_id = 'tu-user-id';
```
Debe retornar una fila con `token_enc` que empieza con `v1:` y `phone_number_id` poblado.

## Paso 2.3 — Reemplazar formulario manual en `/configuracion/conexiones`

**Archivo:** `app/dashboard/configuracion/conexiones/page.js`  
**Cambio:** Reemplazar el formulario de 3 campos (Phone ID, Token, Verify Token) con un botón de OAuth.

**Nueva UI de conexiones:**

```jsx
// En lugar del formulario manual, mostrar:
function EmbeddedSignupButton({ botId, onSuccess }) {
  function launchSignup() {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const redirectUri = `${window.location.origin}/api/whatsapp/callback`;
    const state = JSON.stringify({ botId, returnUrl: "/dashboard/configuracion/conexiones" });
    
    // Abrir popup de Facebook OAuth
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: "whatsapp_business_management,whatsapp_business_messaging,business_management",
      response_type: "code",
      state: btoa(state),
    });
    
    const popup = window.open(
      `https://www.facebook.com/v21.0/dialog/oauth?${params}`,
      "WhatsApp Signup",
      "width=600,height=700,scrollbars=yes"
    );
    
    // Escuchar mensaje del popup cuando complete
    window.addEventListener("message", function handler(e) {
      if (e.data?.type === "WA_SIGNUP_SUCCESS") {
        window.removeEventListener("message", handler);
        popup?.close();
        onSuccess(e.data);
      }
    });
  }

  return (
    <button onClick={launchSignup} style={{ /* estilos */ }}>
      Conectar con WhatsApp Business
    </button>
  );
}
```

## Paso 2.4 — Crear `app/api/whatsapp/callback/route.js`

Este endpoint recibe el redirect de Meta después del OAuth y cierra el popup.

```js
// app/api/whatsapp/callback/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    // Retornar HTML que cierra popup y notifica error al padre
    return new Response(
      `<script>window.opener?.postMessage({type:"WA_SIGNUP_ERROR",error:"${error}"},"*");window.close();</script>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const { botId, returnUrl } = JSON.parse(atob(state || "e30="));
  
  // Llamar al signup handler
  const session = await getServerSession(authOptions);
  const signupRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp-signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": req.headers.get("cookie") || "" },
    body: JSON.stringify({ code, botId }),
  });
  const signupData = await signupRes.json();

  if (signupData.error) {
    return new Response(
      `<script>window.opener?.postMessage({type:"WA_SIGNUP_ERROR",error:${JSON.stringify(signupData.error)}},"*");window.close();</script>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Éxito: notificar al padre y cerrar popup
  return new Response(
    `<script>window.opener?.postMessage({type:"WA_SIGNUP_SUCCESS",phone:${JSON.stringify(signupData.displayPhone)},phoneId:${JSON.stringify(signupData.phoneNumberId)}},"*");window.close();</script>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
```

**Checkpoint 2.4 ✅** — Flujo completo de prueba:
1. Crear un bot nuevo en el dashboard
2. Ir a Configuración → Conexiones
3. Click "Conectar con WhatsApp Business"
4. Completar el flujo de Facebook OAuth con TU cuenta (no necesitas verificación para esto)
5. El popup cierra y la página muestra: "✅ Conectado — +52 55 XXXX XXXX"
6. En Supabase: verificar que `bots.phone_number_id` tiene valor y `bot_secrets.access_token_enc` empieza con `v1:`
7. Enviar un mensaje de WhatsApp al número conectado
8. En los logs de Vercel: debe aparecer `🤖 Bot: NombreBot (id: bot-xxx)` y el bot debe responder

---

**CHECKPOINT DE FASE 2 ✅**

Antes de continuar a Fase 3, verificar:
- [ ] OAuth flow completo sin pegar tokens manualmente
- [ ] Token guardado encriptado en `bot_secrets`
- [ ] `phone_mappings` tiene el registro del número
- [ ] Webhook recibe mensajes y los enruta al bot correcto
- [ ] El bot responde usando SU token (no el del `.env`)
- [ ] Si se crea un segundo bot con otro número, los dos funcionan independientemente

---

---

# FASE 3 — Unificación de Features (Citas, Tienda, Pagos)
**Objetivo:** Citas, catálogo y pagos funcionan per-bot con el schema unificado.  
**Duración:** 4-5 días  
**Prerequisito:** Fase 2 completada.

## Paso 3.1 — Verificar que `bot_id` FK es correcto en tablas ad-hoc

Las tablas ad-hoc ya tienen `bot_id` (agregado en sesión anterior). Verificar que apuntan a `bots.id` del schema v2, no a un id distinto.

```sql
-- Verificar FK integridad
SELECT cf.bot_id, b.id, b.name 
FROM appointment_fields cf
LEFT JOIN bots b ON b.id = cf.bot_id::text
WHERE b.id IS NULL AND cf.bot_id IS NOT NULL;
-- Debe retornar 0 filas (no hay referencias huérfanas)
```

**Checkpoint 3.1 ✅** — Query retorna 0 filas en todas las tablas ad-hoc.

## Paso 3.2 — Auditar y limpiar API routes de citas

**Archivos afectados:**
- `app/api/citas/route.js`
- `app/api/citas/fields/route.js`
- `app/api/citas/config/route.js`
- `app/api/citas/[id]/route.js`

**Verificar que cada route:**
1. Lee `?bot_id` del query string ✓ (ya implementado)
2. Filtra con `.eq("bot_id", botId)` cuando bot_id existe ✓
3. Verifica que `bot_id` pertenece al `user_id` del session (SEGURIDAD — falta)

**Agregar validación de ownership** en todas las routes de citas:
```js
// Verificar que el bot_id pertenece al usuario antes de operar
if (botId) {
  const { data: bot } = await db.from("bots")
    .select("id").eq("id", botId).eq("user_id", userId).single();
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 403 });
}
```

**Checkpoint 3.2 ✅**
1. Crear una cita desde el dashboard con Bot A
2. Intentar acceder a `/api/citas?bot_id=ID_DE_BOT_B` (bot de otro usuario) — debe retornar 403
3. La página `/dashboard/citas` muestra solo citas del bot seleccionado

## Paso 3.3 — Auditar y limpiar API routes de catálogo

**Archivos afectados:**
- `app/api/catalog/categories/route.js`
- `app/api/catalog/items/route.js`
- `app/api/catalog/items/[id]/route.js`
- `app/api/catalog/orders/route.js`

**Mismos cambios que 3.2:** agregar validación de ownership del bot_id.

**Checkpoint 3.3 ✅**
1. Crear categoría e item desde Bot A
2. Cambiar al Bot B en el selector del dashboard
3. La tienda debe estar vacía (no ve items de Bot A)
4. Crear un item desde Bot B — debe aparecer solo en Bot B

## Paso 3.4 — Migrar Stripe Connect a bot_secrets

Actualmente `stripe_connect_accounts` guarda el `stripe_account_id` en texto plano. Para el plan definitivo, las credenciales sensibles de Stripe deben ir encriptadas en `bot_secrets`.

**Cambio en `bot_secrets`:** Agregar columna `stripe_account_id_enc`:
```sql
ALTER TABLE public.bot_secrets 
ADD COLUMN IF NOT EXISTS stripe_account_id_enc TEXT;
```

**Cambio en `app/api/stripe/connect/onboard/route.js`:** Al crear el Stripe Connect account, guardar el `account_id` encriptado en `bot_secrets` además de la fila en `stripe_connect_accounts` (se mantiene por compatibilidad, pero el id sensible va encriptado).

**Checkpoint 3.4 ✅**
1. Ir a `/dashboard/pagos` con Bot A → conectar Stripe
2. Ir a Supabase → `bot_secrets` → verificar que `stripe_account_id_enc` tiene valor `v1:...`
3. Cambiar al Bot B → página de pagos muestra "Sin cuenta conectada"

## Paso 3.5 — Validación de ownership en TODOS los API routes

**Regla de oro de seguridad multi-tenant:** Todo endpoint que recibe un `bot_id` debe verificar que ese `bot_id.user_id === session.user.id`.

Crear helper en `lib/auth.js`:
```js
export async function verifyBotOwnership(userId, botId) {
  if (!botId) return true; // sin bot_id es válido
  const db = supabase();
  const { data } = await db.from("bots")
    .select("id").eq("id", botId).eq("user_id", userId)
    .is("deleted_at", null).single();
  return !!data;
}
```

Agregar este check en: `/api/citas/*`, `/api/catalog/*`, `/api/stripe/*`, `/api/config`, `/api/knowledge/*`.

**Checkpoint 3.5 ✅** — Test de seguridad:
1. Con Cuenta A, obtener el bot_id de un bot
2. Hacer logout, entrar como Cuenta B
3. Llamar a `GET /api/citas?bot_id=BOT_ID_DE_A` — debe retornar 403
4. Llamar a `GET /api/catalog/items?bot_id=BOT_ID_DE_A` — debe retornar 403

---

**CHECKPOINT DE FASE 3 ✅**

Antes de continuar a Fase 4, verificar:
- [ ] Citas, catálogo, pagos funcionan per-bot
- [ ] Cambiar bot en el selector del dashboard cambia TODOS los datos
- [ ] Ownership validation en todos los routes
- [ ] Usuario A no puede ver ni modificar datos de Usuario B bajo ninguna circunstancia
- [ ] Deploy a Vercel sin errores de build

---

---

# FASE 4 — Planes, Onboarding y Enforcement
**Objetivo:** Usuarios nuevos pueden registrarse, crear bots y pagar, con límites por plan.  
**Duración:** 3-4 días  
**Prerequisito:** Fase 3 completada.

## Paso 4.1 — Definir planes en base de datos

Ejecutar en Supabase:
```sql
INSERT INTO public.db_plans (name, price_monthly, max_bots, features) VALUES
  ('Básico',     25.00,  2, '["2 bots","Agendamiento de citas","Catálogo de productos","Soporte por email"]'),
  ('Profesional',50.00,  5, '["5 bots","Todo lo del Básico","Analíticas avanzadas","Soporte prioritario"]'),
  ('Pro',       100.00, 25, '["25 bots","Todo lo del Profesional","API access","Soporte dedicado"]')
ON CONFLICT DO NOTHING;
```

## Paso 4.2 — Middleware de enforcement de límite de bots

**Archivo a modificar:** `app/api/bots/route.js` (POST — crear bot)  
**Cambio:** Antes de crear un bot, verificar que el usuario no ha alcanzado su límite.

```js
// En POST /api/bots:
const { data: subscription } = await db.from("subscriptions")
  .select("plan").eq("user_id", userId).single();

const planName = subscription?.plan || "free";
const PLAN_LIMITS = { free: 1, basic: 2, professional: 5, pro: 25 };
const limit = PLAN_LIMITS[planName] ?? 1;

const { count } = await db.from("bots")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId).is("deleted_at", null);

if (count >= limit) {
  return NextResponse.json({ 
    error: `Tu plan ${planName} permite máximo ${limit} bot(s). Actualiza tu plan para agregar más.`,
    upgrade: true 
  }, { status: 403 });
}
```

**Checkpoint 4.2 ✅**
1. Con plan free (1 bot), intentar crear un segundo bot → debe retornar 403 con mensaje de upgrade
2. Con plan basic (2 bots), crear 2 bots → éxito; intentar el 3ro → 403

## Paso 4.3 — Flujo de onboarding de 3 pasos

**Archivo nuevo:** `app/dashboard/onboarding/page.js`  
Este flujo se muestra SOLO a usuarios nuevos (sin bots aún).

**Paso 1 — Crear bot:**
- Nombre del bot
- Nombre del negocio
- Giro/industria (dropdown: restaurante, clínica, tienda, servicios, otro)

**Paso 2 — Conectar WhatsApp:**
- Botón de Embedded Signup (de Fase 2)
- Si no puede conectar ahora: opción "Conectar después"

**Paso 3 — Prueba:**
- Muestra el número de WhatsApp conectado
- Botón "Enviarme un mensaje de prueba"
- Enlace "Ir al Dashboard"

**Trigger del onboarding:** En `app/dashboard/layout.js`, si `bots.length === 0`, redirigir a `/dashboard/onboarding`.

**Checkpoint 4.3 ✅**
1. Crear una cuenta nueva
2. Al entrar al dashboard → redirige automáticamente al onboarding
3. Completar los 3 pasos → llega al dashboard con el bot ya configurado
4. Al recargar → no redirige al onboarding (ya tiene un bot)

## Paso 4.4 — Página de planes (`/dashboard/planes`)

La página ya existe (`app/dashboard/planes/page.js`). Verificar que:
1. Muestra los 3 planes correctos (Básico $25, Profesional $50, Pro $100)
2. Marca el plan actual del usuario
3. El botón de upgrade dispara el checkout de Stripe
4. Al completar el pago, `subscriptions.plan` se actualiza via webhook de Stripe

**Checkpoint 4.4 ✅**
1. Usuario en plan free → click en Básico → completa pago de prueba en Stripe
2. `subscriptions.plan` cambia a `basic`
3. Usuario puede crear hasta 2 bots

## Paso 4.5 — Registro de nuevos usuarios

**Archivo:** `app/api/auth/register/route.js`  
Verificar que al registrarse:
1. Se crea fila en `users` con `plan: 'free'`
2. Se crea fila en `subscriptions` con `plan: 'free', status: 'active'`
3. Se redirige al onboarding

**Checkpoint 4.5 ✅**
1. Registrar usuario nuevo con email/password
2. Verificar en Supabase: fila en `users` y en `subscriptions`
3. Al iniciar sesión → redirige al onboarding automáticamente

---

**CHECKPOINT DE FASE 4 ✅**

Antes de declarar el sistema listo:
- [ ] Registro → onboarding → bot conectado → mensajes funcionando, en menos de 5 minutos
- [ ] Límites de bots por plan se cumplen
- [ ] Stripe billing funciona (upgrade de plan)
- [ ] Usuario A y Usuario B completamente aislados
- [ ] Dos bots del mismo usuario con diferentes números de WhatsApp funcionan en paralelo

---

---

# PROCESO EXTERNO — Meta Business Verification
**Este proceso ocurre en paralelo al desarrollo.**  
**Sin esto: solo TÚ puedes conectar WhatsApp. Tus clientes no pueden.**

## Pasos para verificar tu negocio en Meta

1. Ir a **business.facebook.com** → Business Settings → Business Info
2. Completar: nombre legal de empresa, dirección, número de teléfono de negocio
3. Ir a **Security Center** → Business Verification → Start Verification
4. Meta pedirá uno de: documentos legales de la empresa, extracto bancario, o verificación de dominio web
5. El proceso tarda de 1 a 5 días hábiles
6. Una vez verificado, tu Meta App puede pedir aprobación para `whatsapp_business_management`

## Pasos para aprobar permisos de Meta App

1. Meta Developer Console → App Review → Permissions
2. Solicitar: `whatsapp_business_management`, `whatsapp_business_messaging`
3. Subir: screencast del flujo completo (signup → conectar número → recibir mensaje)
4. Describir el caso de uso en inglés

## Estado sin verificación

- **Puedes desarrollar y probar con TU propia cuenta** sin restricciones
- **Usuarios externos NO pueden conectar** hasta tener verificación aprobada
- La verificación no bloquea el desarrollo — hazla en paralelo

---

---

# Resumen de Variables de Entorno Necesarias

| Variable | Dónde se obtiene | Cuándo agregar |
|---|---|---|
| `ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Fase 1 |
| `USE_SUPABASE` | `true` (literal) | Fase 1 |
| `META_APP_ID` | Meta Developer Console → App ID | Fase 2 |
| `NEXT_PUBLIC_META_APP_ID` | Mismo que META_APP_ID | Fase 2 |
| `META_APP_SECRET` | Ya existe | — |
| `WA_VERIFY_TOKEN` | Ya existe | — |
| `NEXT_PUBLIC_APP_URL` | Ya existe | — |
| `ANTHROPIC_KEY` | Ya existe | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya existe | — |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya existe | — |
| `STRIPE_SECRET_KEY` | Ya existe | — |
| `STRIPE_WEBHOOK_SECRET` | Ya existe | — |

---

# Orden de Implementación — Resumen Rápido

```
[ ] Fase 0: Auditoría Supabase (1 día)
      └── Verificar qué tablas existen hoy

[ ] Fase 1: Base de datos + bug fix (3-4 días)
      ├── 1.1 Ejecutar schema v2
      ├── 1.2 Ejecutar migration tablas ad-hoc
      ├── 1.3 Fix envOverrides() bug crítico
      ├── 1.4 Agregar ENCRYPTION_KEY a Vercel
      └── 1.5 Verificar USE_SUPABASE=true

[ ] Fase 2: Embedded Signup (3-4 días)
      ├── 2.1 Configurar Meta App
      ├── 2.2 Completar whatsapp-signup/route.js
      ├── 2.3 Reemplazar formulario manual en conexiones
      └── 2.4 Crear whatsapp/callback/route.js

[ ] Fase 3: Features per-bot (4-5 días)
      ├── 3.1 Verificar FKs de tablas ad-hoc
      ├── 3.2 Validar ownership en routes de citas
      ├── 3.3 Validar ownership en routes de catálogo
      ├── 3.4 Migrar Stripe a bot_secrets
      └── 3.5 Helper verifyBotOwnership() global

[ ] Fase 4: Planes y onboarding (3-4 días)
      ├── 4.1 Insertar planes en db_plans
      ├── 4.2 Enforcement de límite de bots
      ├── 4.3 Flujo de onboarding 3 pasos
      ├── 4.4 Página de planes + Stripe checkout
      └── 4.5 Registro de usuarios → subscriptions

[ ] Externo (en paralelo):
      ├── Meta Business Verification
      └── Aprobación de permisos whatsapp_business_management
```

---

*Documento generado: Junio 2026*  
*Última actualización: antes de iniciar implementación*
