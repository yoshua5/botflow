# 🔐 Setup Facebook/WhatsApp API para Botflow

## 📋 Requisitos Previos

- Cuenta de Facebook/Meta
- Número de teléfono para verificación
- Acceso a WhatsApp Business Account

---

## 🚀 Paso 1: Crear Facebook App

### 1.1 Ir a Meta Developers

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Haz login con tu cuenta de Facebook
3. Click en **"Mi Apps"** → **"Crear aplicación"**

### 1.2 Crear Nueva App

1. Selecciona **"Tipo de aplicación: Business"**
2. Rellena los datos:
   - **Nombre de la app:** "Botflow" (o tu nombre)
   - **Email de contacto:** tu@email.com
   - **Propósito de la app:** "Crear un agente de WhatsApp con IA"

3. Click **"Crear"**
4. Completa el captcha

### 1.3 Obtener App ID y App Secret

Una vez creada la app:

1. Ve a **Settings → Basic**
2. Verás:
   - **App ID** ← Copia esto
   - **App Secret** ← Copia esto (mantenlo secreto)

3. Guarda en un lugar seguro:
   ```
   FACEBOOK_APP_ID=123456789012345
   FACEBOOK_APP_SECRET=abc123def456ghi789jkl012
   ```

---

## 📱 Paso 2: Agregar Producto WhatsApp

### 2.1 Agregar Producto a la App

1. En el dashboard de tu app, click **"+ Agregar producto"**
2. Busca **"WhatsApp"**
3. Click **"Configurar"** en la tarjeta de WhatsApp Business
4. Click **"Continuar"**

### 2.2 Configurar WhatsApp Business

1. Selecciona **"Crear nueva app de WhatsApp Business"**
2. Completa:
   - **Nombre de negocio:** "Botflow" o tu nombre
   - **Tipo de negocio:** Selecciona según corresponda
   - **País:** Tu país
   - **Teléfono:** Tu número de teléfono

3. Click **"Crear"**
4. Verifica tu teléfono (recibirás un código por SMS)

### 2.3 Obtener Phone Number ID

Una vez verificado:

1. Ve a **WhatsApp Business → API Setup**
2. Copiarás la información del número:
   - **Phone Number ID** ← Esto lo necesitarás después
   - **Business Phone Number** ← Tu número de WhatsApp

---

## 🔗 Paso 3: Configurar OAuth Redirect URI

### 3.1 Agregar URL de Callback

1. En **Settings → Basic** de tu app
2. Busca sección **"Valid OAuth Redirect URIs"**
3. Click **"+ Agregar URI"**
4. Agrega:

**Para Desarrollo:**
```
http://localhost:3000/api/whatsapp/callback
```

**Para Producción:**
```
https://tudominio.com/api/whatsapp/callback
```

5. Click **"Guardar cambios"**

### 3.2 Configurar Permisos

1. Ve a **Roles → Test Users** (o **Users**)
2. Click **"Agregar Test User"**
3. Elige rol: **Admin**
4. Esto te da acceso para testear la app antes de publicar

---

## 🔑 Paso 4: Generar Access Token (Permanente)

Este token es para que Botflow acceda a la API de WhatsApp.

### 4.1 Obtener Token

1. Ve a **WhatsApp Business → API Setup**
2. En sección **"Temporary Access Token"**, click **"Generate Token"**
3. Copia el token
4. Guarda en `.env.local`:
   ```
   WHATSAPP_ACCESS_TOKEN=EAA1234567890...
   ```

**Nota:** Este token expira. Para producción, debes implementar un sistema de refresh tokens.

---

## 📝 Paso 5: Rellenar Variables de Entorno

Crea el archivo `.env.local` en la raíz de tu proyecto:

```bash
# Copiar desde .env.local.example
cp .env.local.example .env.local
```

Luego edita `.env.local` con tus valores:

```env
# Facebook / WhatsApp Configuration
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abc123def456ghi789jkl012
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Otros que ya tenías configurados...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
ANTHROPIC_API_KEY=...
```

---

## ✅ Paso 6: Verificar Configuración

### 6.1 Test Local

1. En terminal, en la raíz del proyecto:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:3000/dashboard`

3. Crea un bot nuevo

4. En la página del bot, haz click en **"Conectar WhatsApp"**

5. Deberías ver:
   - ✅ Se abre popup de Facebook
   - ✅ Te pide autorizar Botflow
   - ✅ Se cierra automáticamente
   - ✅ El status cambia a "Conectado"

### 6.2 Si no Funciona

**Error: "Invalid client_id"**
- Verifica que `FACEBOOK_APP_ID` es correcto
- Verifica que la app está en modo desarrollo

**Error: "Redirect URI mismatch"**
- Asegúrate que `http://localhost:3000/api/whatsapp/callback` está en los URIs válidos
- Verifica que `NEXT_PUBLIC_BASE_URL` coincide

**Error: "Access token invalid"**
- El token expiró, genera uno nuevo
- O implementa refresh token (ver Paso 7)

---

## 🚀 Paso 7: Deploy a Producción

### 7.1 Cambiar Variables para Producción

En tu hosting (Vercel, etc.):

**Project Settings → Environment Variables**

```env
FACEBOOK_APP_ID=tu_app_id
FACEBOOK_APP_SECRET=tu_app_secret
NEXT_PUBLIC_BASE_URL=https://tudominio.com

# Otros...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

### 7.2 Agregar Redirect URI en Facebook

1. Ve a **Settings → Basic** de tu app
2. Agrega URI para producción:
   ```
   https://tudominio.com/api/whatsapp/callback
   ```

### 7.3 Cambiar App a Modo Producción

1. En **Settings → Basic**, click **"Switch to Live Mode"**
2. Confirma

---

## 💡 Tips Importantes

### Seguridad
- ❌ NUNCA hagas commit del `.env.local`
- ✅ Usa `.gitignore` (ya debe estar en tu proyecto)
- ✅ Mantén `FACEBOOK_APP_SECRET` privado
- ✅ Regenera secret si lo compartiste accidentalmente

### Tokens que Expiran
En producción, debes manejar token refresh:

```javascript
// Próxima mejora: implementar refresh token
// Por ahora, se regenera manualmente en Facebook dashboard
```

### Testing sin Facebook
Si quieres testear sin configurar Facebook aún:
- Comenta la línea de WhatsApp en `[id]/page.js`
- Usa valores dummy en `.env.local`
- El resto de la app funcionará igual

---

## 🎯 Checklist Final

- [ ] Facebook App creado
- [ ] App ID y Secret copiados
- [ ] WhatsApp Business configurado
- [ ] Teléfono verificado
- [ ] OAuth Redirect URI agregado (localhost)
- [ ] `.env.local` creado con valores
- [ ] Test local funciona
- [ ] OAuth Redirect URI agregado (producción)
- [ ] App en modo Live
- [ ] Variables de producción configuradas
- [ ] Deploy a producción funciona

---

## 📚 Referencias Útiles

- [Facebook Developers Docs](https://developers.facebook.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [OAuth 2.0 Guide](https://developers.facebook.com/docs/facebook-login/web)
- [Webhook Documentation](https://developers.facebook.com/docs/whatsapp/webhooks)

---

## 🆘 Soporte

Si algo no funciona:

1. Verifica los logs en console del navegador (F12)
2. Verifica los logs de servidor (`npm run dev`)
3. Asegúrate que todas las variables de `.env.local` tienen valores
4. Intenta regenerar el Access Token
5. Reinicia el servidor (`npm run dev`)

---

**¡Ahora tu Botflow está listo para conectar WhatsApp! 🎉**
