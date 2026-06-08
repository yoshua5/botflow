"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const GREEN = "#16A34A";

const TABS = [
  { id: "general",    icon: "⚙️",  label: "General" },
  { id: "negocio",    icon: "🏢",  label: "Mi Negocio" },
  { id: "whatsapp",   icon: "💬",  label: "WhatsApp" },
  { id: "flujo",      icon: "🔀",  label: "Flujo" },
  { id: "respuestas", icon: "🗨️",  label: "Respuestas" },
  { id: "avanzado",   icon: "🔧",  label: "Avanzado" },
];

// ── Field helpers ─────────────────────────────────────────
function Label({ children }) {
  return <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>{children}</label>;
}
function Input({ value, onChange, placeholder, type = "text", readOnly }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ position: "relative" }}>
      <input
        type={isPass && !show ? "password" : "text"}
        value={value || ""} onChange={onChange} placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: "100%", padding: "10px 14px", paddingRight: isPass ? 40 : 14,
          background: readOnly ? "#F8FAFF" : WHITE,
          border: "1.5px solid #E2E8F0", borderRadius: 10,
          fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
          boxSizing: "border-box", transition: "border-color 0.2s",
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = "#93C5FD"; }}
        onBlur={e => e.target.style.borderColor = "#E2E8F0"}
      />
      {isPass && (
        <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: MUTED }}>
          {show ? "🙈" : "👁️"}
        </button>
      )}
    </div>
  );
}
function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value || ""} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "10px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", transition: "border-color 0.2s" }}
      onFocus={e => e.target.style.borderColor = "#93C5FD"}
      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value || ""} onChange={onChange} style={{
      width: "100%", padding: "10px 14px", background: WHITE, border: "1.5px solid #E2E8F0",
      borderRadius: 10, fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
      cursor: "pointer", appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 14px) center", paddingRight: 36,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Toggle({ checked, onChange, label, desc }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 12, position: "relative",
        background: checked ? BLUE : "#CBD5E1", border: "none", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
      }}>
        <span style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: WHITE, boxShadow: "0 1px 4px rgba(0,0,0,0.15)", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}
function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}
function FieldGroup({ label, children, span }) {
  return <div style={{ marginBottom: 20, ...(span ? { gridColumn: "1 / -1" } : {}) }}><Label>{label}</Label>{children}</div>;
}

// ── Tabs ──────────────────────────────────────────────────
const TONE_OPTIONS = [
  { value: "amigable",    icon: "😊", label: "Amigable",    desc: "Cercano y casual" },
  { value: "profesional", icon: "💼", label: "Profesional", desc: "Formal y serio" },
  { value: "energético",  icon: "⚡", label: "Energético",  desc: "Dinámico" },
  { value: "empático",    icon: "💚", label: "Empático",    desc: "Comprensivo" },
  { value: "directo",     icon: "🎯", label: "Directo",     desc: "Al grano" },
];

function TabGeneral({ bot, setBot }) {
  return (
    <div>
      <SectionHeader icon="⚙️" title="Información General" />
      <Grid2>
        <FieldGroup label="Nombre del Bot">
          <Input value={bot.agentName} onChange={e => setBot({ ...bot, agentName: e.target.value })} placeholder="Ej: Asistente Ventas" />
        </FieldGroup>
        <FieldGroup label="Idioma">
          <Select value={bot.language || "es"} onChange={e => setBot({ ...bot, language: e.target.value })}
            options={[{ value: "es", label: "Español" }, { value: "en", label: "English" }, { value: "pt", label: "Português" }]} />
        </FieldGroup>
        <FieldGroup label="Nombre del Negocio">
          <Input value={bot.businessName} onChange={e => setBot({ ...bot, businessName: e.target.value })} placeholder="Mi Empresa S.A." />
        </FieldGroup>
        <FieldGroup label="Horario de Atención">
          <Input value={bot.hours} onChange={e => setBot({ ...bot, hours: e.target.value })} placeholder="Lun–Vie 9am–6pm" />
        </FieldGroup>
      </Grid2>
      <FieldGroup label="Objetivo del Bot">
        <Textarea value={bot.businessDesc} onChange={e => setBot({ ...bot, businessDesc: e.target.value })}
          placeholder="Describe para qué sirve este bot..." rows={3} />
      </FieldGroup>
      <FieldGroup label="Servicios / Productos">
        <Textarea value={bot.services} onChange={e => setBot({ ...bot, services: e.target.value })}
          placeholder="Lista los servicios o productos que ofreces..." rows={2} />
      </FieldGroup>
    </div>
  );
}

function TabNegocio({ bot, setBot }) {
  return (
    <div>
      <SectionHeader icon="🏢" title="Mi Negocio" />
      <Grid2>
        <FieldGroup label="Sitio Web">
          <Input value={bot.website} onChange={e => setBot({ ...bot, website: e.target.value })} placeholder="https://minegocio.com" />
        </FieldGroup>
        <FieldGroup label="Ubicación">
          <Input value={bot.location} onChange={e => setBot({ ...bot, location: e.target.value })} placeholder="Ciudad de México, CDMX" />
        </FieldGroup>
        <FieldGroup label="Instagram">
          <Input value={bot.instagram} onChange={e => setBot({ ...bot, instagram: e.target.value })} placeholder="@minegocio" />
        </FieldGroup>
        <FieldGroup label="Facebook">
          <Input value={bot.facebook} onChange={e => setBot({ ...bot, facebook: e.target.value })} placeholder="facebook.com/minegocio" />
        </FieldGroup>
        <FieldGroup label="TikTok">
          <Input value={bot.tiktok} onChange={e => setBot({ ...bot, tiktok: e.target.value })} placeholder="@minegocio" />
        </FieldGroup>
        <FieldGroup label="Teléfono de contacto">
          <Input value={bot.contactPhone} onChange={e => setBot({ ...bot, contactPhone: e.target.value })} placeholder="+52 55 1234 5678" />
        </FieldGroup>
      </Grid2>
      <FieldGroup label="Descripción de la empresa">
        <Textarea value={bot.companyDescription} onChange={e => setBot({ ...bot, companyDescription: e.target.value })}
          placeholder="Breve historia o descripción de tu empresa para que el bot tenga contexto..." rows={4} />
      </FieldGroup>
    </div>
  );
}

function TabWhatsApp({ bot, setBot, autoConnect }) {
  const isConnected = !!(bot.phoneNumberId && bot.accessToken);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [fbReady, setFbReady] = useState(false);
  const autoConnectFired = useRef(false);
  const popupCheckRef = useRef(null);

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) { setFbReady(true); return; }
    const timer = setTimeout(() => {
      // If SDK hasn't loaded after 8s, mark as ready anyway so button isn't permanently disabled
      setFbReady(true);
    }, 8000);
    window.fbAsyncInit = function () {
      clearTimeout(timer);
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || "1806315730812154",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      });
      setFbReady(true);
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => clearTimeout(timer);
  }, []);

  // Clean up popup check interval on unmount
  useEffect(() => {
    return () => { if (popupCheckRef.current) clearInterval(popupCheckRef.current); };
  }, []);

  const handleFacebookConnect = () => {
    if (!window.FB) {
      setConnectError("El SDK de Facebook no se pudo cargar. Intenta recargar la página.");
      return;
    }

    // If no config_id is set, go straight to manual entry
    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || "";
    if (!configId) {
      setShowManual(true);
      return;
    }

    setConnecting(true);
    setConnectError(null);

    // Auto-cancel after 45s if popup never responds
    const timeout = setTimeout(() => {
      setConnecting(false);
      setConnectError("El popup no respondió. Intenta de nuevo o usa credenciales manuales.");
    }, 45000);

    window.FB.login(
      async (response) => {
        clearTimeout(timeout);
        if (popupCheckRef.current) { clearInterval(popupCheckRef.current); popupCheckRef.current = null; }
        if (response.authResponse?.code) {
          try {
            const res = await fetch("/api/whatsapp-signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: response.authResponse.code, botId: bot.id }),
            });
            const data = await res.json();
            if (data.phoneNumberId) {
              setBot({
                ...bot,
                phoneNumberId: data.phoneNumberId,
                waBusinessId: data.wabaId,
                accessToken: data.accessToken,
                displayPhone: data.displayPhone || "",
              });
            } else {
              setConnectError(data.error || "No se pudo obtener el número. Intenta de nuevo.");
            }
          } catch (e) {
            setConnectError("Error al conectar. Intenta de nuevo.");
          }
        } else {
          setConnectError("Conexión cancelada o sin permisos. Intenta de nuevo.");
        }
        setConnecting(false);
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      }
    );
  };

  const handleCancel = () => {
    if (popupCheckRef.current) { clearInterval(popupCheckRef.current); popupCheckRef.current = null; }
    setConnecting(false);
    setConnectError(null);
  };

  const handleDisconnect = () => {
    setBot({ ...bot, phoneNumberId: "", waBusinessId: "", accessToken: "" });
  };

  // No auto-trigger — user must click manually to avoid connecting wrong number

  return (
    <div>
      <SectionHeader icon="💬" title="Conexión WhatsApp" />

      {/* Connected state */}
      {isConnected ? (
        <div>
          {/* Success banner */}
          <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 16, padding: "20px 22px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>✓</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#15803D", marginBottom: 4 }}>WhatsApp conectado</div>
              {bot.displayPhone && (
                <div style={{ fontSize: 18, fontWeight: 900, color: "#15803D", marginBottom: 2, letterSpacing: "0.02em" }}>
                  📱 {bot.displayPhone}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#166534", opacity: 0.7 }}>Phone ID: {bot.phoneNumberId}</div>
            </div>
            <button onClick={handleDisconnect} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Desconectar
            </button>
          </div>

          {/* Webhook URL */}
          <div style={{ background: "#F8FAFF", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 8 }}>🔗 URL del Webhook</div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: "monospace", background: WHITE, padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              https://www.agentflow.com.mx/api/webhook
            </div>
          </div>

          {/* Show manual option */}
          <button onClick={() => setShowManual(!showManual)} style={{ fontSize: 13, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            {showManual ? "Ocultar" : "Ver / editar credenciales manualmente"}
          </button>
          {showManual && (
            <div style={{ marginTop: 16 }}>
              <Grid2>
                <FieldGroup label="Phone Number ID">
                  <Input value={bot.phoneNumberId} onChange={e => setBot({ ...bot, phoneNumberId: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="WABA ID">
                  <Input value={bot.waBusinessId} onChange={e => setBot({ ...bot, waBusinessId: e.target.value })} />
                </FieldGroup>
              </Grid2>
              <FieldGroup label="Access Token">
                <Input value={bot.accessToken} onChange={e => setBot({ ...bot, accessToken: e.target.value })} type="password" />
              </FieldGroup>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Main connect button */}
          <div style={{ background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 20, padding: "36px 28px", textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 8, letterSpacing: "-0.02em" }}>
              Conecta tu WhatsApp Business
            </h3>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
              Inicia sesión con Facebook para conectar tu cuenta de WhatsApp Business automáticamente. Solo toma 1 minuto.
            </p>

            {/* Steps */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
              {[
                { n: 1, text: "Inicia sesión con Facebook" },
                { n: 2, text: "Selecciona tu número" },
                { n: 3, text: "¡Listo!" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: BLUE, color: WHITE, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                    <span style={{ fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>{s.text}</span>
                  </div>
                  {i < 2 && <span style={{ color: "#CBD5E1", fontSize: 16 }}>→</span>}
                </div>
              ))}
            </div>

            {/* Facebook Connect Button */}
            <button
              onClick={connecting ? handleCancel : handleFacebookConnect}
              disabled={!fbReady && !connecting}
              style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: connecting ? "#DC2626" : "#1877F2",
                color: WHITE, fontSize: 15, fontWeight: 700,
                cursor: (!fbReady && !connecting) ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: connecting ? "none" : "0 4px 16px rgba(24,119,242,0.4)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!connecting && fbReady) e.currentTarget.style.background = "#166FE5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = connecting ? "#DC2626" : "#1877F2"; }}
            >
              {/* Facebook logo / spinner */}
              {connecting ? (
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              {connecting ? "Cancelar" : !fbReady ? "Cargando SDK..." : "Conectar con Facebook"}
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {connecting && (
              <p style={{ fontSize: 13, color: BLUE, marginTop: 12 }}>
                Completa el login en la ventana de Facebook que se abrió...
              </p>
            )}
            {connectError && (
              <p style={{ fontSize: 13, color: "#DC2626", marginTop: 12, background: "#FEF2F2", padding: "8px 14px", borderRadius: 8, border: "1px solid #FCA5A5" }}>
                ⚠️ {connectError}
              </p>
            )}
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12 }}>
              Necesitas una cuenta de Facebook y WhatsApp Business API activa
            </p>
          </div>

          {/* Manual fallback */}
          <div style={{ textAlign: "center" }}>
            <button onClick={() => setShowManual(!showManual)} style={{ fontSize: 13, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              {showManual ? "Ocultar" : "Ingresar credenciales manualmente"}
            </button>
          </div>

          {showManual && (
            <div style={{ marginTop: 20, background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "20px 20px" }}>
              <Grid2>
                <FieldGroup label="Phone Number ID">
                  <Input value={bot.phoneNumberId} onChange={e => setBot({ ...bot, phoneNumberId: e.target.value })} placeholder="113xxxxxxxxxxxxx" />
                </FieldGroup>
                <FieldGroup label="WABA ID">
                  <Input value={bot.waBusinessId} onChange={e => setBot({ ...bot, waBusinessId: e.target.value })} placeholder="107xxxxxxxxxxxxx" />
                </FieldGroup>
              </Grid2>
              <FieldGroup label="Access Token">
                <Input value={bot.accessToken} onChange={e => setBot({ ...bot, accessToken: e.target.value })} placeholder="EAAxxxxx..." type="password" />
              </FieldGroup>
              <FieldGroup label="Verify Token">
                <Input value={bot.verifyToken} onChange={e => setBot({ ...bot, verifyToken: e.target.value })} placeholder="botflow123" />
              </FieldGroup>
              <div style={{ background: "#F8FAFF", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>🔗 URL del Webhook</div>
                <div style={{ fontSize: 12, fontFamily: "monospace", background: WHITE, padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", color: MUTED }}>
                  https://www.agentflow.com.mx/api/webhook
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab Flujo ─────────────────────────────────────────────
function TabFlujo({ bot, setBot }) {
  const flow   = bot.flow || {};
  const mode   = flow.mode || "text";
  const items  = flow.menuItems || [];
  const setFlow = (patch) => setBot({ ...bot, flow: { ...flow, ...patch } });

  const addItem = () => setFlow({
    menuItems: [...items, { id: `opt${Date.now()}`, title: "", description: "", response: "" }],
  });
  const updateItem = (idx, field, val) => {
    const updated = items.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    setFlow({ menuItems: updated });
  };
  const removeItem = (idx) => setFlow({ menuItems: items.filter((_, i) => i !== idx) });

  const inputStyle = {
    width: "100%", padding: "8px 12px", border: "1.5px solid #E2E8F0",
    borderRadius: 9, fontSize: 13, color: TEXT, outline: "none",
    fontFamily: "inherit", background: WHITE, boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔀</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Flujo de Conversación</h2>
          <p style={{ fontSize: 12, color: MUTED }}>Define cómo interactúa el bot con tus clientes</p>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
        {[
          { id: "text",   icon: "✍️", title: "Texto libre",   desc: "El cliente escribe lo que quiera. Claude responde con IA." },
          { id: "menu",   icon: "📋", title: "Menú de opciones", desc: "El cliente elige de un menú de botones. Sin texto libre." },
          { id: "hybrid", icon: "⚡", title: "Híbrido",        desc: "Muestra menú al inicio pero también acepta texto libre." },
        ].map(m => (
          <button key={m.id} onClick={() => setFlow({ mode: m.id })} style={{
            padding: "16px 14px", borderRadius: 12, textAlign: "left",
            background: mode === m.id ? BLUE_MID : WHITE,
            border: `1.5px solid ${mode === m.id ? BLUE : "#E2E8F0"}`,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.id ? BLUE : TEXT, marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Texto libre — no extra config needed */}
      {mode === "text" && (
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>✅ Modo activo: Texto libre</div>
          <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
            El cliente escribe lo que quiera y Claude responde con inteligencia artificial. Es el modo más natural y flexible.
          </p>
        </div>
      )}

      {/* Menu / Hybrid — show menu builder */}
      {(mode === "menu" || mode === "hybrid") && (
        <div>
          {mode === "hybrid" && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#92400E" }}>
              ⚡ <strong>Modo híbrido:</strong> el bot muestra el menú en el primer mensaje, pero si el cliente escribe texto libre, Claude también responde con IA.
            </div>
          )}

          {/* Welcome message */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>Mensaje de bienvenida del menú</label>
            <textarea
              value={flow.menuWelcome || ""}
              onChange={e => setFlow({ menuWelcome: e.target.value })}
              placeholder="Ej: ¡Hola! 👋 Bienvenido a Producciones YL. Selecciona una opción:"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>

          {/* Button type */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginRight: 8, alignSelf: "center" }}>Tipo:</label>
            {[
              { id: "buttons", label: "🔘 Botones (máx 3)", desc: "Botones rápidos debajo del mensaje" },
              { id: "list",    label: "📝 Lista (máx 10)",  desc: "Menú desplegable con más opciones" },
            ].map(t => (
              <button key={t.id} onClick={() => setFlow({ menuType: t.id })} style={{
                padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600,
                background: (flow.menuType || "buttons") === t.id ? BLUE_MID : WHITE,
                border: `1.5px solid ${(flow.menuType || "buttons") === t.id ? BLUE : "#E2E8F0"}`,
                color: (flow.menuType || "buttons") === t.id ? BLUE : TEXT,
                cursor: "pointer", fontFamily: "inherit",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Menu items */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Opciones del menú</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {(flow.menuType || "buttons") === "buttons" ? "Máximo 3 botones (20 caracteres c/u)" : "Máximo 10 opciones"}
                </div>
              </div>
              <button onClick={addItem} disabled={items.length >= ((flow.menuType || "buttons") === "buttons" ? 3 : 10)} style={{
                padding: "7px 14px", background: BLUE, border: "none", borderRadius: 8,
                fontSize: 12, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit",
                opacity: items.length >= ((flow.menuType || "buttons") === "buttons" ? 3 : 10) ? 0.5 : 1,
              }}>
                + Agregar opción
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px", background: "#F8FAFF", borderRadius: 10, border: "1.5px dashed #CBD5E1" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
                  <div style={{ fontSize: 13, color: MUTED }}>Sin opciones aún. Clic en "+ Agregar opción"</div>
                </div>
              )}
              {items.map((item, idx) => (
                <div key={item.id} style={{ background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 11, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, letterSpacing: "0.05em" }}>OPCIÓN {idx + 1}</span>
                    <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#EF4444" }}>✕</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, display: "block", marginBottom: 4 }}>
                        TÍTULO DEL BOTÓN {(flow.menuType || "buttons") === "buttons" ? `(${(item.title||"").length}/20)` : ""}
                      </label>
                      <input
                        value={item.title}
                        onChange={e => updateItem(idx, "title", (flow.menuType || "buttons") === "buttons" ? e.target.value.slice(0, 20) : e.target.value)}
                        placeholder="Ej: Hacer pedido 🌮"
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#93C5FD"}
                        onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, display: "block", marginBottom: 4 }}>DESCRIPCIÓN (opcional, solo listas)</label>
                      <input
                        value={item.description || ""}
                        onChange={e => updateItem(idx, "description", e.target.value)}
                        placeholder="Ej: Ordena comida a domicilio"
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#93C5FD"}
                        onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, display: "block", marginBottom: 4 }}>¿QUÉ HACE CLAUDE CUANDO ELIGEN ESTA OPCIÓN?</label>
                    <textarea
                      value={item.response || ""}
                      onChange={e => updateItem(idx, "response", e.target.value)}
                      placeholder="Ej: El usuario quiere hacer un pedido. Pídele qué quiere ordenar y sus datos de entrega."
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical" }}
                      onFocus={e => e.target.style.borderColor = "#93C5FD"}
                      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {items.length > 0 && (
            <div style={{ background: "#1A1A2E", borderRadius: 14, padding: "16px", marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 10, letterSpacing: "0.06em" }}>PREVIEW EN WHATSAPP</div>
              <div style={{ background: "#2C2C3E", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.6 }}>
                  {flow.menuWelcome || "¡Hola! Selecciona una opción:"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.filter(i => i.title).slice(0, (flow.menuType || "buttons") === "buttons" ? 3 : 10).map((item, i) => (
                  <div key={i} style={{ background: "#1C3A5E", border: "1px solid #2563EB", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#93C5FD", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#64748B" }}>↩</span> {item.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabRespuestas({ bot, setBot }) {
  return (
    <div>
      <SectionHeader icon="🗨️" title="Personalidad y Respuestas" />
      <div style={{ marginBottom: 24 }}>
        <Label>Tono de Voz</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {TONE_OPTIONS.map(t => (
            <button key={t.value} onClick={() => setBot({ ...bot, tone: t.value })} style={{
              padding: "12px 8px", borderRadius: 12, textAlign: "center",
              background: bot.tone === t.value ? BLUE_MID : WHITE,
              border: bot.tone === t.value ? `1.5px solid ${BLUE}` : "1.5px solid #E2E8F0",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: bot.tone === t.value ? BLUE : TEXT }}>{t.label}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <FieldGroup label="Mensaje de Bienvenida">
        <Textarea value={bot.greeting} onChange={e => setBot({ ...bot, greeting: e.target.value })}
          placeholder="¡Hola! Soy el asistente de [negocio]. ¿En qué puedo ayudarte?" rows={2} />
      </FieldGroup>
      <FieldGroup label="Instrucciones Adicionales">
        <Textarea value={bot.extraInstructions} onChange={e => setBot({ ...bot, extraInstructions: e.target.value })}
          placeholder="Si preguntan por precio, siempre redirigir a ventas. No mencionar competidores..." rows={3} />
      </FieldGroup>
      <div style={{ background: "#F8FAFF", borderRadius: 12, padding: "4px 16px" }}>
        <Toggle checked={bot.useEmojis !== false} onChange={v => setBot({ ...bot, useEmojis: v })}
          label="Usar emojis" desc="Añade emojis a las respuestas para un tono más amigable" />
        <Toggle checked={bot.shortAnswers !== false} onChange={v => setBot({ ...bot, shortAnswers: v })}
          label="Respuestas cortas" desc="Limitar a máximo 3 oraciones por respuesta" />
      </div>
    </div>
  );
}

function TabAvanzado({ bot, setBot }) {
  return (
    <div>
      <SectionHeader icon="🔧" title="Configuración Avanzada" />
      <Grid2>
        <FieldGroup label="Modelo de IA">
          <Select value={bot.aiModel || "claude-haiku-4-5-20251001"} onChange={e => setBot({ ...bot, aiModel: e.target.value })}
            options={[
              { value: "claude-haiku-4-5-20251001", label: "Claude Haiku (Rápido)" },
              { value: "claude-sonnet-4-6", label: "Claude Sonnet (Balanceado)" },
              { value: "claude-opus-4-6", label: "Claude Opus (Más capaz)" },
            ]} />
        </FieldGroup>
        <FieldGroup label="Temperatura (creatividad)">
          <Select value={String(bot.temperature ?? "0.7")} onChange={e => setBot({ ...bot, temperature: parseFloat(e.target.value) })}
            options={[
              { value: "0.3", label: "0.3 — Muy preciso" },
              { value: "0.5", label: "0.5 — Preciso" },
              { value: "0.7", label: "0.7 — Balanceado" },
              { value: "0.9", label: "0.9 — Creativo" },
              { value: "1.0", label: "1.0 — Muy creativo" },
            ]} />
        </FieldGroup>
        <FieldGroup label="Máximo de tokens por respuesta">
          <Select value={String(bot.maxTokens ?? "1024")} onChange={e => setBot({ ...bot, maxTokens: parseInt(e.target.value) })}
            options={[
              { value: "512", label: "512 — Muy corto" },
              { value: "1024", label: "1024 — Corto" },
              { value: "2048", label: "2048 — Medio" },
              { value: "4096", label: "4096 — Largo" },
            ]} />
        </FieldGroup>
        <FieldGroup label="Estado del Bot">
          <Select value={bot.status || "ACTIVO"} onChange={e => setBot({ ...bot, status: e.target.value })}
            options={[
              { value: "ACTIVO", label: "✅ Activo" },
              { value: "INACTIVO", label: "⏸ Inactivo" },
            ]} />
        </FieldGroup>
      </Grid2>
      <FieldGroup label="Anthropic API Key (para este bot)">
        <Input value={bot.anthropicKey} onChange={e => setBot({ ...bot, anthropicKey: e.target.value })}
          placeholder="sk-ant-... (deja vacío para usar la clave global)" type="password" />
      </FieldGroup>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{title}</h2>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function BotSettingsPage() {
  const { id }          = useParams();
  const router          = useRouter();
  const [bot, setBot]   = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Read ?connect=1 from URL without useSearchParams (avoids Suspense requirement)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("connect") === "1") setActiveTab("whatsapp");
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bots/${id}`)
      .then(r => r.json())
      .then(d => { setBot(d.bot || null); setLoading(false); })
      .catch(() => { setError("No se pudo cargar el bot"); setLoading(false); });
  }, [id]);

  const save = async () => {
    if (!bot) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bot),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Error al guardar: " + e.message);
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: MUTED, fontSize: 15 }}>
      Cargando bot...
    </div>
  );

  if (!bot) return (
    <div style={{ textAlign: "center", padding: 64 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Bot no encontrado</div>
      <button onClick={() => router.push("/dashboard/bots")} style={{ marginTop: 20, padding: "10px 24px", background: BLUE, color: WHITE, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
        ← Volver a Mis Bots
      </button>
    </div>
  );

  const initials = (bot.agentName || bot.name || "B").slice(0, 2).toUpperCase();

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/dashboard/bots")} style={{
            padding: "8px 14px", background: WHITE, border: "1.5px solid #E2E8F0",
            borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: MUTED, fontFamily: "inherit",
          }}>← Volver</button>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: BLUE_MID, border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: BLUE }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em", marginBottom: 2 }}>
              {bot.agentName || bot.name}
            </h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 100,
                background: bot.status === "ACTIVO" ? "#F0FDF4" : "#F1F5F9",
                color: bot.status === "ACTIVO" ? GREEN : "#94A3B8",
              }}>● {bot.status || "ACTIVO"}</span>
              <span style={{ fontSize: 12, color: MUTED }}>{bot.businessName || "Mi negocio"}</span>
              {bot.displayPhone && (
                <span style={{
                  fontSize: 12, fontWeight: 700, color: "#15803D",
                  background: "#F0FDF4", border: "1px solid #86EFAC",
                  padding: "2px 10px", borderRadius: 100,
                }}>📱 {bot.displayPhone}</span>
              )}
              {!bot.displayPhone && bot.phoneNumberId && (
                <span style={{ fontSize: 11, color: MUTED }}>ID: {bot.phoneNumberId}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href={`/dashboard/knowledge?bot=${id}`} style={{
            padding: "9px 18px", background: BLUE_LIGHT, borderRadius: 10, fontSize: 13,
            fontWeight: 700, color: BLUE, textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          }}>📚 Base de Conocimiento</a>
          <button onClick={save} disabled={saving} style={{
            padding: "9px 24px", background: saved ? "#16A34A" : BLUE, borderRadius: 10, fontSize: 14,
            fontWeight: 700, color: WHITE, border: "none", cursor: saving ? "default" : "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)", transition: "all 0.2s", fontFamily: "inherit",
          }}>
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 14, color: "#DC2626" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }}>
        {/* Sidebar tabs */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "13px 16px", background: activeTab === tab.id ? BLUE_LIGHT : WHITE,
                border: "none", borderBottom: "1px solid #F1F5F9",
                color: activeTab === tab.id ? BLUE : MUTED,
                fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px", marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
              ESTADÍSTICAS
            </div>
            {[
              { label: "Mensajes", value: bot.messageCount || 0 },
              { label: "Conversaciones", value: bot.conversationCount || 0 },
              { label: "Creado", value: bot.createdAt ? new Date(bot.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : "hoy" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F8FAFF" }}>
                <span style={{ fontSize: 13, color: MUTED }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "28px", overflow: "auto" }}>
          {activeTab === "general"    && <TabGeneral    bot={bot} setBot={setBot} />}
          {activeTab === "negocio"    && <TabNegocio    bot={bot} setBot={setBot} />}
          {activeTab === "whatsapp"   && <TabWhatsApp   bot={bot} setBot={setBot} autoConnect={activeTab === "whatsapp" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("connect") === "1"} />}
          {activeTab === "flujo"      && <TabFlujo      bot={bot} setBot={setBot} />}
          {activeTab === "respuestas" && <TabRespuestas bot={bot} setBot={setBot} />}
          {activeTab === "avanzado"   && <TabAvanzado   bot={bot} setBot={setBot} />}
        </div>
      </div>
    </div>
  );
}
