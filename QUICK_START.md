# ⚡ Quick Start - Botflow Mejorado

**Tu dashboard y flujo de creación de bots ahora son profesionales como Codialab** 🎉

---

## 🚀 Inicio Rápido (5 minutos)

### 1. Copiar Variables de Entorno

```bash
cd /path/to/botflow
cp .env.local.example .env.local
```

### 2. Verificar Configuración

```bash
node scripts/verify-env.js
```

Deberías ver:
```
✅ Clerk Public Key
✅ Anthropic API Key
✅ Supabase URL
❌ Facebook App ID          ← Esto falta
❌ Facebook App Secret      ← Esto falta
```

### 3. Llenar Variables Faltantes

Edita `.env.local`:

```env
# Rellena estos (ya deberían estar de tus setups previos)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=sk-ant-...

# Estos son NUEVOS para WhatsApp (opcional por ahora)
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

### 4. Iniciar Servidor

```bash
npm run dev
```

Ve a `http://localhost:3000/dashboard` - ¡Ya ves el dashboard mejorado!

---

## 🎯 Qué Cambió (Resumen)

### Dashboard
- ✨ Hero section profesional con gradiente azul
- 📊 Stat cards con hover effects
- 🤖 Bot cards con status visual
- Diseño limpio y moderno

### Crear Bot
- **Antes:** 3 fases (URL → Revisión → Hecho)
- **Ahora:** 5 fases completas
  1. 🏢 Negocio (con autofill desde URL)
  2. 🎨 Identidad (tono de voz, nombre)
  3. 🎯 Objetivo (qué debe hacer)
  4. 📚 Conocimiento (políticas, docs)
  5. ✅ Resumen (confirmar)

### WhatsApp
- **Antes:** Multi-step connection
- **Ahora:** 1 click! ✅
  - Click "Conectar WhatsApp"
  - Facebook popup
  - Automáticamente se conecta

---

## 📋 Archivos Nuevos/Modificados

```
✅ CREADOS:
   /app/dashboard/create-improved/page.js (Nuevo flujo 5 fases)
   /app/components/WhatsAppOneClick.js    (Conexión 1-click)
   /api/whatsapp/init/route.js            (OAuth start)
   /api/whatsapp/callback/route.js        (OAuth callback)
   /api/bots/[id]/whatsapp/route.js       (Get/Delete conexión)
   /api/bots/[id]/whatsapp/status/route.js (Verificar estado)
   SETUP_FACEBOOK_WHATSAPP.md             (Guía detallada)
   MEJORAS_IMPLEMENTADAS.md               (Changelog completo)
   QUICK_START.md                         (Este archivo)

✏️  ACTUALIZADOS:
   /app/dashboard/page.js                 (Links a create-improved)
   .env.local.example                     (Template variables)
```

---

## 🔐 Configurar WhatsApp (Opcional, para Después)

Si quieres habilitar la conexión de WhatsApp:

1. Lee: **SETUP_FACEBOOK_WHATSAPP.md**
2. Crea Facebook App
3. Agrega credenciales a `.env.local`
4. Listo!

Por ahora, funciona sin Facebook (solo muestra que falta conectar).

---

## 🧪 Testear Sin Facebook

Para testear el flujo completo SIN configurar Facebook:

1. La app funciona perfectamente
2. El botón "Conectar WhatsApp" aparece pero no hace nada
3. Puedes simular conexión editando la base de datos manualmente (para testing)

---

## 📖 Documentación

- **`SETUP_FACEBOOK_WHATSAPP.md`** - Guía step-by-step para Facebook
- **`MEJORAS_IMPLEMENTADAS.md`** - Changelog técnico completo
- **`.env.local.example`** - Template de variables de entorno

---

## 🐛 Si Algo No Funciona

### El dashboard no se ve bien
```bash
# Limpia cache y restart
rm -rf .next
npm run dev
```

### Variables no cargan
```bash
# Verifica configuración
node scripts/verify-env.js
```

### Error en crear bot
```bash
# Revisa:
1. Supabase está corriendo
2. ANTHROPIC_API_KEY está en .env.local
3. Console del navegador (F12) para errores
```

---

## ✨ Próximos Pasos Opcionales

Cuando quieras mejorar más:

1. **Logo/Avatar upload** - Agregar en Fase 2
2. **Document parsing** - Mejorar upload de docs
3. **Analytics** - Agregar gráficos al dashboard
4. **Preview del bot** - Ver cómo se ve antes de crear

---

## 🎓 Arquitectura General

```
Dashboard (home)
├── Stat cards (bots activos, mensajes, etc)
├── Bot list (últimos 6 bots)
└── Create Button → /dashboard/create-improved

Create Flow (5 fases)
├── Fase 1: Negocio (autofill)
├── Fase 2: Identidad (agente)
├── Fase 3: Objetivo (propósito)
├── Fase 4: Conocimiento (docs)
├── Fase 5: Resumen (confirmar)
└── Bot Created → /dashboard/bots/[id]

Bot Detail Page
├── Tabs: General, Mi Negocio, WhatsApp, Flujo, etc
├── WhatsApp OneClick
│   ├── Idle: "Click para conectar"
│   ├── Connecting: "Abre Facebook popup"
│   ├── Connected: "Número de teléfono"
│   └── Error: "Reintentar"
└── Settings & Delete
```

---

## 💡 Tips

- 🎨 Los colores siguen el patrón de Codialab (azul #2563EB)
- 📱 Responsive en móvil y desktop
- ⚡ No requiere cambios en tu base de datos actual
- 🔒 Las credenciales de Facebook se guardan en Supabase
- 🌍 Funciona en localhost y en producción

---

## 🚀 Deploy a Producción

Cuando estés listo para publicar:

1. Obtén credenciales de Facebook en modo Live
2. Agrega variables en tu hosting (Vercel, etc)
3. Actualiza URLs en Facebook (localhost → tu dominio)
4. Deploy como siempre

```bash
git add -A
git commit -m "feat: Botflow redesign with 5-phase onboarding and 1-click WhatsApp"
git push
# En Vercel → auto-deploy
```

---

## 📞 Soporte

- 📚 Documentación completa en `MEJORAS_IMPLEMENTADAS.md`
- 🔐 Guía Facebook en `SETUP_FACEBOOK_WHATSAPP.md`
- 🔧 Verificar env: `node scripts/verify-env.js`

---

**¡Ahora tu Botflow es profesional como Codialab! 🎉**

Prueba el nuevo flujo de creación y dime si necesitas algo más.
