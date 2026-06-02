"use client";
import { useState, useEffect, useRef } from "react";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

const SUB_TABS = [
  { id: "general",   icon: "⚙️", label: "General" },
  { id: "negocio",   icon: "🏢", label: "Mi Negocio" },
  { id: "whatsapp",  icon: "💬", label: "WhatsApp" },
  { id: "respuestas",icon: "🗨️", label: "Respuestas" },
  { id: "citas",     icon: "📅", label: "Citas" },
  { id: "avanzado",  icon: "🔧", label: "Avanzado" },
];

const TIPS = {
  general:   "Establece el nombre y objetivo principal para que el bot se presente correctamente a tus clientes.",
  negocio:   "Describe tu negocio a detalle y sube imágenes de productos, flyers o tu catálogo. El bot las usará en sus respuestas.",
  whatsapp:  "Pega tus credenciales de Meta para activar la conexión en tiempo real con WhatsApp Business.",
  respuestas:"Configura el tono de voz de tu bot en esta sección para que se alinee con tu marca.",
  citas:     "Conecta Google Calendar para que el bot vea horarios disponibles y agende citas automáticamente. Google Sheets guarda cada cita como fila.",
  avanzado:  "Ajusta parámetros avanzados como el modelo de IA, temperatura y límites de tokens.",
};

// ── Field components ──────────────────────────────────────
function Label({ children }) {
  return <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>{children}</label>;
}
function Input({ value, onChange, placeholder, type = "text", readOnly }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ position: "relative" }}>
      <input
        type={isPassword && !show ? "password" : "text"}
        value={value} onChange={onChange} placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: "100%", padding: "10px 14px", paddingRight: isPassword ? 40 : 14,
          background: readOnly ? "#F8FAFF" : WHITE,
          border: "1.5px solid #E2E8F0", borderRadius: 10,
          fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
          boxSizing: "border-box", transition: "border-color 0.2s",
          cursor: readOnly ? "default" : "text",
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = "#93C5FD"; }}
        onBlur={e => e.target.style.borderColor = "#E2E8F0"}
      />
      {isPassword && (
        <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: MUTED }}>
          {show ? "🙈" : "👁️"}
        </button>
      )}
    </div>
  );
}
function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", padding: "10px 14px", background: WHITE,
        border: "1.5px solid #E2E8F0", borderRadius: 10,
        fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
        resize: "vertical", boxSizing: "border-box", transition: "border-color 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = "#93C5FD"}
      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} style={{
      width: "100%", padding: "10px 14px", background: WHITE,
      border: "1.5px solid #E2E8F0", borderRadius: 10,
      fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
      cursor: "pointer", appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 14px) center",
      paddingRight: 36,
    }}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
        background: checked ? BLUE : "#CBD5E1", border: "none", cursor: "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 2, left: checked ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: WHITE,
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)", transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}
function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}
function FieldGroup({ label, children }) {
  return <div style={{ marginBottom: 20 }}><Label>{label}</Label>{children}</div>;
}

// ── Tab content ───────────────────────────────────────────
function TabGeneral({ config, setConfig }) {
  const faviconRef = useRef(null);
  const [faviconUploading, setFaviconUploading] = useState(false);

  const handleFavicon = async (file) => {
    if (!file) return;
    setFaviconUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/:(.*?);/)[1];
      setConfig({ ...config, faviconBase64: base64, faviconMimeType: mimeType });
      setFaviconUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚙️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>Información General</h2>
      </div>

      {/* Favicon + Site name */}
      <div style={{ background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span>🌐</span> Apariencia del navegador (tab y favicon)
        </div>
        <Grid2>
          <FieldGroup label="Nombre del sitio (tab del navegador)">
            <Input value={config.siteName || ""} onChange={e => setConfig({ ...config, siteName: e.target.value })} placeholder="Mi Bot — Peluquería El Estilo" />
          </FieldGroup>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>Favicon (ícono del tab)</label>
            <input ref={faviconRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp" style={{ display: "none" }}
              onChange={e => handleFavicon(e.target.files[0])} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {config.faviconBase64 ? (
                <div style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px solid #C4B5FD", overflow: "hidden", background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <img src={`data:${config.faviconMimeType};base64,${config.faviconBase64}`} alt="favicon" style={{ width: 32, height: 32, objectFit: "contain" }} />
                </div>
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: MUTED }}>🤖</div>
              )}
              <div style={{ flex: 1 }}>
                <button onClick={() => faviconRef.current?.click()} disabled={faviconUploading}
                  style={{ padding: "7px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>
                  {faviconUploading ? "⏳ Cargando..." : "Subir ícono"}
                </button>
                {config.faviconBase64 && (
                  <button onClick={() => setConfig({ ...config, faviconBase64: null, faviconMimeType: null })}
                    style={{ marginLeft: 8, padding: "7px 12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 12, color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>Quitar</button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>PNG, JPG, SVG — recomendado 32×32px o 64×64px</div>
          </div>
        </Grid2>
      </div>

      <Grid2>
        <FieldGroup label="Nombre del Bot">
          <Input value={config.agentName || ""} onChange={e => setConfig({ ...config, agentName: e.target.value })} placeholder="Bot Comercial #142" />
        </FieldGroup>
        <FieldGroup label="Idioma del Sistema">
          <Select value={config.language || "es"} onChange={e => setConfig({ ...config, language: e.target.value })}
            options={[{ value: "es", label: "Español (ES)" }, { value: "en", label: "English (EN)" }, { value: "pt", label: "Português (PT)" }]} />
        </FieldGroup>
      </Grid2>
      <FieldGroup label="Nombre del Negocio">
        <Input value={config.businessName || ""} onChange={e => setConfig({ ...config, businessName: e.target.value })} placeholder="Ej: Peluquería El Estilo" />
      </FieldGroup>
      <FieldGroup label="Objetivo Principal">
        <Textarea value={config.businessDesc || ""} onChange={e => setConfig({ ...config, businessDesc: e.target.value })}
          placeholder="Atención al cliente de primer nivel para consultas de precios y disponibilidad de stock en tiempo real." rows={3} />
      </FieldGroup>
      <Grid2>
        <FieldGroup label="Servicios / Productos">
          <Textarea value={config.services || ""} onChange={e => setConfig({ ...config, services: e.target.value })} placeholder="Corte de cabello, tinte, barba..." rows={2} />
        </FieldGroup>
        <FieldGroup label="Horario de Atención">
          <Input value={config.hours || ""} onChange={e => setConfig({ ...config, hours: e.target.value })} placeholder="Lun–Vie 9am–6pm" />
        </FieldGroup>
      </Grid2>
      <Grid2>
        <FieldGroup label="Ubicación">
          <Input value={config.location || ""} onChange={e => setConfig({ ...config, location: e.target.value })} placeholder="Ciudad de México, CDMX" />
        </FieldGroup>
        <FieldGroup label="Sitio Web">
          <Input value={config.website || ""} onChange={e => setConfig({ ...config, website: e.target.value })} placeholder="https://minegocio.com" />
        </FieldGroup>
      </Grid2>
    </div>
  );
}

const TONE_OPTIONS = [
  { value: "amigable", label: "Amigable", icon: "😊", desc: "Cercano y casual" },
  { value: "profesional", label: "Profesional", icon: "💼", desc: "Formal y serio" },
  { value: "energético", label: "Energético", icon: "⚡", desc: "Dinámico y entusiasta" },
  { value: "empático", label: "Empático", icon: "💚", desc: "Comprensivo y cálido" },
  { value: "directo", label: "Directo", icon: "🎯", desc: "Conciso y al grano" },
];

function TabRespuestas({ config, setConfig }) {
  const tones = TONE_OPTIONS;
  const [greet, setGreet] = useState(config.greeting || "");
  const [extra, setExtra] = useState(config.extraInstructions || "");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🗨️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>Personalidad y Respuestas</h2>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label>Tono de Voz</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {tones.map(t => (
            <button key={t.value} onClick={() => setConfig({ ...config, tone: t.value })} style={{
              padding: "12px 8px", borderRadius: 12, textAlign: "center",
              background: config.tone === t.value ? BLUE_MID : WHITE,
              border: config.tone === t.value ? `1.5px solid ${BLUE}` : "1.5px solid #E2E8F0",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={e => { if (config.tone !== t.value) e.currentTarget.style.borderColor = "#93C5FD"; }}
              onMouseLeave={e => { if (config.tone !== t.value) e.currentTarget.style.borderColor = "#E2E8F0"; }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: config.tone === t.value ? BLUE : TEXT }}>{t.label}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <FieldGroup label="Mensaje de Bienvenida">
        <Textarea value={greet} onChange={e => { setGreet(e.target.value); setConfig({ ...config, greeting: e.target.value }); }}
          placeholder="¡Hola! Soy el asistente de [negocio]. ¿En qué puedo ayudarte hoy?" rows={2} />
      </FieldGroup>

      <FieldGroup label="Instrucciones Adicionales">
        <Textarea value={extra} onChange={e => { setExtra(e.target.value); setConfig({ ...config, extraInstructions: e.target.value }); }}
          placeholder="Si preguntan por precio, siempre redirigir a ventas. No mencionar a competidores..." rows={3} />
      </FieldGroup>

      <div style={{ background: "#F8FAFF", borderRadius: 12, padding: "4px 16px" }}>
        <Toggle checked={config.useEmojis !== false} onChange={v => setConfig({ ...config, useEmojis: v })}
          label="Usar emojis" desc="Añade emojis a las respuestas para un tono más amigable" />
        <Toggle checked={config.shortAnswers !== false} onChange={v => setConfig({ ...config, shortAnswers: v })}
          label="Respuestas cortas" desc="Limitar a máximo 3 oraciones por respuesta" />
      </div>
    </div>
  );
}

function TabFAQs({ config, setConfig }) {
  const faqs = config.faqs || [];
  const addFaq = () => setConfig({ ...config, faqs: [...faqs, { question: "", answer: "" }] });
  const updateFaq = (i, field, val) => {
    const updated = faqs.map((f, j) => j === i ? { ...f, [field]: val } : f);
    setConfig({ ...config, faqs: updated });
  };
  const removeFaq = i => setConfig({ ...config, faqs: faqs.filter((_, j) => j !== i) });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📋</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>Respuestas Rápidas (FAQs)</h2>
      </div>
      <p style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>Define respuestas para preguntas frecuentes. El bot las usará como referencia directa.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ background: "#F8FAFF", borderRadius: 12, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, letterSpacing: "0.05em" }}>PREGUNTA {i + 1}</span>
              <button onClick={() => removeFaq(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#EF4444" }}>✕</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <Input value={faq.question} onChange={e => updateFaq(i, "question", e.target.value)} placeholder="Ej: ¿Cuál es el horario de atención?" />
            </div>
            <Textarea value={faq.answer} onChange={e => updateFaq(i, "answer", e.target.value)} placeholder="Respuesta que dará el bot..." rows={2} />
          </div>
        ))}
      </div>
      <button onClick={addFaq} style={{
        width: "100%", padding: "11px", background: WHITE, border: "1.5px dashed #CBD5E1",
        borderRadius: 10, fontSize: 14, fontWeight: 600, color: MUTED, cursor: "pointer",
        fontFamily: "inherit", transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; e.currentTarget.style.background = BLUE_LIGHT; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = MUTED; e.currentTarget.style.background = WHITE; }}>
        + Agregar pregunta frecuente
      </button>
    </div>
  );
}

function EnvBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "5px 10px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, width: "fit-content" }}>
      <span style={{ fontSize: 12 }}>🔒</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D" }}>Configurado via variables de entorno</span>
    </div>
  );
}

function TabWhatsApp({ config, setConfig }) {
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : "https://tu-dominio.com/api/webhook";
  const photoRef = useRef(null);

  // WhatsApp profile state
  const [waProfile, setWaProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileToast, setProfileToast] = useState(null);
  const [newAbout, setNewAbout] = useState("");
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);
  const [newPhotoMime, setNewPhotoMime] = useState(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);

  const isConfigured = config.configured || (config.phoneNumberId && config.accessToken && config.anthropicKey);
  const accessTokenFromEnv = !config.accessToken && config.configured;
  const anthropicKeyFromEnv = !config.anthropicKey && config.configured;

  // Fetch WA profile when credentials are present
  useEffect(() => {
    if (!isConfigured) return;
    setProfileLoading(true);
    fetch("/api/whatsapp-profile")
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setWaProfile(d);
          setNewAbout(d.about || "");
        }
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, [isConfigured]);

  const handlePhotoSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const [meta, b64] = dataUrl.split(",");
      const mime = meta.match(/:(.*?);/)[1];
      setNewPhotoBase64(b64);
      setNewPhotoMime(mime);
      setNewPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const body = { about: newAbout };
      if (newPhotoBase64) {
        body.imageBase64 = newPhotoBase64;
        body.imageMimeType = newPhotoMime;
      }
      const res = await fetch("/api/whatsapp-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setProfileToast({ type: "ok", msg: "✅ Perfil actualizado. Si la foto no aparece, cierra y reabre WhatsApp." });
        // Refresh profile
        const r2 = await fetch("/api/whatsapp-profile");
        const d2 = await r2.json();
        if (!d2.error) { setWaProfile(d2); setNewAbout(d2.about || ""); }
        setNewPhotoBase64(null); setNewPhotoMime(null); setNewPhotoPreview(null);
      } else {
        // Show detailed error from Meta
        const errDetail = data.detail?.error?.error_user_msg || data.detail?.error?.message || data.error || "Error al guardar";
        setProfileToast({ type: "err", msg: "❌ " + errDetail });
        console.error("Profile save error:", data);
      }
    } catch (e) {
      setProfileToast({ type: "err", msg: "❌ Error de red: " + e.message });
    }
    setProfileSaving(false);
    setTimeout(() => setProfileToast(null), 8000);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0FDF4", border: "1px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>Conexión WhatsApp Business</h2>
      </div>

      {/* ── WhatsApp Profile Card ── */}
      <div style={{ background: "#F8FAFF", border: "1.5px solid #DBEAFE", borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>🪪</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Foto y descripción de perfil</div>
            <div style={{ fontSize: 11, color: MUTED }}>Lo que verán tus clientes en WhatsApp al chatear con el bot</div>
          </div>
        </div>

        {!isConfigured ? (
          <div style={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>Configura las credenciales de WhatsApp primero para editar el perfil.</div>
        ) : profileLoading ? (
          <div style={{ fontSize: 13, color: MUTED }}>⏳ Cargando perfil actual...</div>
        ) : (
          <>
            {/* Photo row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              {/* Avatar preview */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {newPhotoPreview || waProfile?.profile_picture_url ? (
                  <img
                    src={newPhotoPreview || waProfile.profile_picture_url}
                    alt="Foto de perfil"
                    style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #DBEAFE" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "2px solid #DBEAFE" }}>🤖</div>
                )}
                {newPhotoPreview && (
                  <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: WHITE }}>✓</div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 6 }}>Foto de perfil del bot</div>
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                  onChange={e => handlePhotoSelect(e.target.files[0])} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => photoRef.current?.click()} style={{ padding: "7px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>
                    📷 Cambiar foto
                  </button>
                  {newPhotoPreview && (
                    <button onClick={() => { setNewPhotoBase64(null); setNewPhotoMime(null); setNewPhotoPreview(null); }}
                      style={{ padding: "7px 12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 12, color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>
                      Quitar
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>JPG, PNG o WebP — máx. 5MB recomendado</div>
              </div>
            </div>

            {/* About text */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Descripción (about)</label>
                <span style={{ fontSize: 11, color: newAbout.length > 139 ? "#DC2626" : MUTED }}>{newAbout.length}/139</span>
              </div>
              <textarea
                value={newAbout}
                onChange={e => setNewAbout(e.target.value.slice(0, 139))}
                placeholder="Ej: 🤖 Bot de atención 24/7 de Peluquería El Estilo. Respondo preguntas, agendo citas y más."
                rows={2}
                style={{ width: "100%", padding: "10px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#93C5FD"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
              />
            </div>

            {/* Display name note */}
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400E" }}>
              ⚠️ <strong>Nombre visible:</strong> El nombre que aparece en WhatsApp (ej. "Bot Wappy") es el nombre oficial de tu cuenta registrado en Meta. Para cambiarlo, ve a{" "}
              <a href="https://business.facebook.com/wa/manage/phone-numbers/" target="_blank" rel="noreferrer" style={{ color: "#B45309", fontWeight: 600 }}>Meta Business Manager → Números de teléfono</a>.
            </div>

            {/* Save button + toast */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <button onClick={saveProfile} disabled={profileSaving}
                  style={{ padding: "9px 20px", background: profileSaving ? MUTED : BLUE, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, color: WHITE, cursor: profileSaving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {profileSaving ? "⏳ Guardando..." : "💾 Guardar perfil"}
                </button>
              </div>
              {profileToast && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: profileToast.type === "ok" ? "#F0FDF4" : "#FEF2F2",
                  border: `1px solid ${profileToast.type === "ok" ? "#86EFAC" : "#FCA5A5"}`,
                  color: profileToast.type === "ok" ? "#16A34A" : "#DC2626",
                  maxWidth: 420,
                }}>
                  {profileToast.msg}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Webhook URL */}
      <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "16px 18px", border: "1px solid #86EFAC", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tu URL de Webhook</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <code style={{ flex: 1, fontSize: 13, color: "#15803D", background: "rgba(255,255,255,0.7)", padding: "8px 12px", borderRadius: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {webhookUrl}
          </code>
          <button onClick={copyUrl} style={{ padding: "8px 14px", background: "#16A34A", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            Copiar
          </button>
        </div>
      </div>

      <Grid2>
        <FieldGroup label="Phone Number ID">
          <Input value={config.phoneNumberId || ""} onChange={e => setConfig({ ...config, phoneNumberId: e.target.value })} placeholder="123456789012345" />
        </FieldGroup>
        <FieldGroup label="Verify Token">
          <Input value={config.verifyToken || ""} onChange={e => setConfig({ ...config, verifyToken: e.target.value })} placeholder="botflow123" />
        </FieldGroup>
      </Grid2>
      <div style={{ marginBottom: 20 }}>
        <Label>Access Token (Meta)</Label>
        <Input value={config.accessToken || ""} onChange={e => setConfig({ ...config, accessToken: e.target.value })} placeholder={accessTokenFromEnv ? "••••••••••••• (configurado)" : "EAABc..."} type="password" />
        {accessTokenFromEnv && <EnvBadge />}
      </div>
      <div style={{ marginBottom: 20 }}>
        <Label>Anthropic API Key</Label>
        <Input value={config.anthropicKey || ""} onChange={e => setConfig({ ...config, anthropicKey: e.target.value })} placeholder={anthropicKeyFromEnv ? "••••••••••••• (configurado)" : "sk-ant-..."} type="password" />
        {anthropicKeyFromEnv && <EnvBadge />}
      </div>

      {/* Voice notes */}
      <div style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🎤</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6D28D9" }}>Notas de Voz (WhatsApp)</div>
            <div style={{ fontSize: 11, color: "#7C3AED" }}>Activa para que el bot entienda mensajes de voz de tus clientes via OpenAI Whisper</div>
          </div>
        </div>
        <Label>OpenAI API Key</Label>
        <Input
          value={config.openaiKey || ""}
          onChange={e => setConfig({ ...config, openaiKey: e.target.value })}
          placeholder={config.openaiKey ? "••••••••••••• (configurado)" : "sk-...  (obtén en platform.openai.com)"}
          type="password"
        />
        {config.openaiKey && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "5px 10px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, width: "fit-content" }}>
            <span style={{ fontSize: 12 }}>🎤</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D" }}>Notas de voz activadas</span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: isConfigured ? "#F0FDF4" : "#FFF7ED", borderRadius: 10, border: `1px solid ${isConfigured ? "#86EFAC" : "#FED7AA"}` }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: isConfigured ? "#16A34A" : "#F59E0B" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: isConfigured ? "#15803D" : "#B45309" }}>
          {isConfigured ? "✓ Bot configurado y listo para recibir mensajes" : "Completa los campos para activar el bot"}
        </span>
      </div>
    </div>
  );
}

// ── Tab Mi Negocio ────────────────────────────────────────
function TabNegocio({ config, setConfig }) {
  const [uploading, setUploading]     = useState({});
  const fileRefs                      = useRef({});
  const [scrapeUrl, setScrapeUrl]     = useState(config.website || "");
  const [scraping, setScraping]       = useState(false);
  const [scrapeMsg, setScrapeMsg]     = useState(null); // {type:"ok"|"error", text}

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeMsg(null);
    try {
      const res  = await fetch("/api/settings/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      const data = await res.json();
      if (data.error === "missing_key") {
        setScrapeMsg({ type: "error", text: "⚠️ Agrega tu Anthropic API Key en la pestaña WhatsApp primero." });
      } else if (data.error) {
        setScrapeMsg({ type: "error", text: "❌ " + data.error });
      } else {
        const f = data.fields;
        // Merge into config — only overwrite empty fields unless value was extracted
        const patch = {};
        if (f.businessProfile) patch.businessProfile = f.businessProfile;
        if (f.businessDesc)    patch.businessDesc    = f.businessDesc;
        if (f.services)        patch.services        = f.services;
        if (f.hours)           patch.hours           = f.hours;
        if (f.fullAddress)     patch.fullAddress     = f.fullAddress;
        if (f.phone)           patch.phone           = f.phone;
        if (f.location)        patch.location        = f.location;
        if (f.pricePolicy)     patch.pricePolicy     = f.pricePolicy;
        if (f.contactEmail)    patch.contactEmail    = f.contactEmail;
        if (f.instagram)       patch.instagram       = f.instagram;
        if (f.facebook)        patch.facebook        = f.facebook;
        if (f.agentName && !config.agentName) patch.agentName = f.agentName;
        if (f.tone && !config.tone)           patch.tone      = f.tone;
        setConfig(prev => ({ ...prev, ...patch }));
        setScrapeMsg({ type: "ok", text: `✅ ¡Listo! Llené ${Object.keys(patch).length} campos automáticamente. Revisa y ajusta lo que necesites, luego guarda.` });
      }
    } catch (e) {
      setScrapeMsg({ type: "error", text: "❌ Error de conexión: " + e.message });
    }
    setScraping(false);
  };

  const catalog = config.catalog || [];

  const addItem = () => setConfig({
    ...config,
    catalog: [...catalog, { id: Date.now(), name: "", description: "", price: "", imageId: null, imageName: null }],
  });

  const updateItem = (id, field, val) =>
    setConfig({ ...config, catalog: catalog.map(c => c.id === id ? { ...c, [field]: val } : c) });

  const removeItem = (id) =>
    setConfig({ ...config, catalog: catalog.filter(c => c.id !== id) });

  const uploadImage = async (itemId, file) => {
    setUploading(u => ({ ...u, [itemId]: true }));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/knowledge", { method: "POST", body: fd });
      const data = await res.json();
      if (data.file) {
        updateItem(itemId, "imageId", data.file.id);
        updateItem(itemId, "imageName", data.file.name);
      }
    } catch {}
    setUploading(u => ({ ...u, [itemId]: false }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>Mi Negocio</h2>
      </div>

      {/* ── Auto-fill from website ── */}
      <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🌐</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#15803D" }}>Auto-llenar desde tu sitio web</div>
            <div style={{ fontSize: 12, color: "#166534" }}>Pega tu URL y Claude extrae descripción, dirección, teléfono, horario, servicios y más — automáticamente.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleScrape()}
            placeholder="https://minegocio.com"
            style={{
              flex: 1, padding: "10px 14px", border: "1.5px solid #86EFAC", borderRadius: 10,
              fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
              background: WHITE, boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "#16A34A"}
            onBlur={e => e.target.style.borderColor = "#86EFAC"}
          />
          <button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} style={{
            padding: "10px 20px", background: scraping ? MUTED : "#16A34A", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 700, color: WHITE,
            cursor: scraping ? "not-allowed" : "pointer", fontFamily: "inherit", flexShrink: 0,
            opacity: (!scrapeUrl.trim() && !scraping) ? 0.6 : 1,
          }}>
            {scraping ? "⏳ Analizando..." : "🔍 Analizar sitio"}
          </button>
        </div>
        {scrapeMsg && (
          <div style={{
            marginTop: 10, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, lineHeight: 1.5,
            background: scrapeMsg.type === "ok" ? "rgba(255,255,255,0.7)" : "#FEF2F2",
            color: scrapeMsg.type === "ok" ? "#15803D" : "#DC2626",
            border: `1px solid ${scrapeMsg.type === "ok" ? "#86EFAC" : "#FCA5A5"}`,
          }}>
            {scrapeMsg.text}
          </div>
        )}
      </div>

      {/* Business profile */}
      <FieldGroup label="Descripción Detallada del Negocio">
        <Textarea
          value={config.businessProfile || ""}
          onChange={e => setConfig({ ...config, businessProfile: e.target.value })}
          placeholder="Describe tu negocio a detalle: qué ofreces, qué te diferencia, cómo atiendes, tus valores, etc. El bot usará esta información para responder con más contexto."
          rows={5}
        />
      </FieldGroup>

      <Grid2>
        <FieldGroup label="Dirección completa">
          <Input value={config.fullAddress || ""} onChange={e => setConfig({ ...config, fullAddress: e.target.value })} placeholder="Calle, número, colonia, ciudad" />
        </FieldGroup>
        <FieldGroup label="Teléfono / WhatsApp">
          <Input value={config.phone || ""} onChange={e => setConfig({ ...config, phone: e.target.value })} placeholder="+52 55 1234 5678" />
        </FieldGroup>
        <FieldGroup label="Sitio Web">
          <Input value={config.website || ""} onChange={e => setConfig({ ...config, website: e.target.value })} placeholder="https://minegocio.com" />
        </FieldGroup>
        <FieldGroup label="Email de contacto">
          <Input value={config.contactEmail || ""} onChange={e => setConfig({ ...config, contactEmail: e.target.value })} placeholder="hola@minegocio.com" />
        </FieldGroup>
      </Grid2>

      {/* Redes Sociales */}
      <div style={{ background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span>📱</span> Redes Sociales
        </div>
        <Grid2>
          <FieldGroup label="Instagram">
            <Input value={config.instagram || ""} onChange={e => setConfig({ ...config, instagram: e.target.value })} placeholder="@minegocio" />
          </FieldGroup>
          <FieldGroup label="Facebook">
            <Input value={config.facebook || ""} onChange={e => setConfig({ ...config, facebook: e.target.value })} placeholder="facebook.com/minegocio" />
          </FieldGroup>
          <FieldGroup label="TikTok">
            <Input value={config.tiktok || ""} onChange={e => setConfig({ ...config, tiktok: e.target.value })} placeholder="@minegocio" />
          </FieldGroup>
          <FieldGroup label="YouTube">
            <Input value={config.youtube || ""} onChange={e => setConfig({ ...config, youtube: e.target.value })} placeholder="youtube.com/@minegocio" />
          </FieldGroup>
        </Grid2>
      </div>

      <FieldGroup label="Política de precios / condiciones">
        <Textarea value={config.pricePolicy || ""} onChange={e => setConfig({ ...config, pricePolicy: e.target.value })} placeholder="Ej: Precios en MXN con IVA incluido. Envío gratis en compras mayores a $500. Pagos en efectivo y tarjeta." rows={2} />
      </FieldGroup>

      {/* Catalog / Products */}
      <div style={{ marginTop: 28, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Catálogo de Productos / Servicios</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Agrega imágenes con descripción. El bot podrá enviarlas por WhatsApp cuando las pidan.</div>
        </div>
        <button onClick={addItem} style={{ padding: "8px 16px", background: BLUE, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          + Agregar
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {catalog.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px", background: "#F8FAFF", borderRadius: 12, border: "1.5px dashed #CBD5E1" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 13, color: MUTED }}>No hay productos aún. Haz clic en "+ Agregar" para empezar.</div>
          </div>
        )}
        {catalog.map((item) => (
          <div key={item.id} style={{ background: "#F8FAFF", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, letterSpacing: "0.05em" }}>PRODUCTO / SERVICIO</span>
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#EF4444" }}>✕ Eliminar</button>
            </div>
            <Grid2>
              <FieldGroup label="Nombre">
                <Input value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} placeholder="Ej: Corte de cabello premium" />
              </FieldGroup>
              <FieldGroup label="Precio">
                <Input value={item.price} onChange={e => updateItem(item.id, "price", e.target.value)} placeholder="Ej: $250 MXN" />
              </FieldGroup>
            </Grid2>
            <FieldGroup label="Descripción">
              <Textarea value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="Describe el producto/servicio en detalle: qué incluye, beneficios, tiempo, etc." rows={2} />
            </FieldGroup>
            {/* Image upload */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>Imagen (opcional)</label>
              <input ref={el => fileRefs.current[item.id] = el} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => e.target.files[0] && uploadImage(item.id, e.target.files[0])} />
              {item.imageId ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", border: "1.5px solid #C4B5FD", flexShrink: 0 }}>
                    <img src={`/api/knowledge/image/${item.imageId}`} alt={item.imageName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{item.imageName}</div>
                    <div style={{ fontSize: 11, color: "#16A34A", marginTop: 2 }}>📲 Envíable por WhatsApp</div>
                  </div>
                  <button onClick={() => { updateItem(item.id, "imageId", null); updateItem(item.id, "imageName", null); }}
                    style={{ padding: "4px 10px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, fontSize: 12, color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>
                    Quitar
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRefs.current[item.id]?.click()} disabled={uploading[item.id]}
                  style={{ padding: "8px 16px", background: WHITE, border: "1.5px dashed #CBD5E1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: uploading[item.id] ? MUTED : TEXT, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                  {uploading[item.id] ? "⏳ Subiendo..." : "🖼️ Subir imagen"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Default appointment fields ────────────────────────────
const DEFAULT_FIELDS = [
  { id: "nombre",           label: "Nombre",           key: "nombre",           required: true,  type: "text"  },
  { id: "apellido",         label: "Apellido",         key: "apellido",         required: false, type: "text"  },
  { id: "telefono",         label: "Teléfono",         key: "telefono",         required: true,  type: "tel"   },
  { id: "email",            label: "Email",            key: "email",            required: false, type: "email" },
  { id: "fecha_preferida",  label: "Fecha preferida",  key: "fecha_preferida",  required: true,  type: "date"  },
  { id: "hora_preferida",   label: "Hora preferida",   key: "hora_preferida",   required: true,  type: "time"  },
];

const WEEKDAY_LABELS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function TabCitas({ config, setConfig }) {
  const apt = config.appointments || {};
  const setApt = (patch) => setConfig({ ...config, appointments: { ...apt, ...patch } });

  const fields    = apt.fields    || DEFAULT_FIELDS;
  const workDays  = apt.workDays  || [1,2,3,4,5];
  const [showCreds, setShowCreds] = useState(false);

  const addField = () => {
    const id = `campo_${Date.now()}`;
    setApt({ fields: [...fields, { id, label: "", key: id, required: false, type: "text" }] });
  };
  const removeField = (id) => setApt({ fields: fields.filter(f => f.id !== id) });
  const updateField = (id, patch) => setApt({ fields: fields.map(f => f.id === id ? { ...f, ...patch } : f) });
  const moveField = (idx, dir) => {
    const arr = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setApt({ fields: arr });
  };
  const toggleWorkDay = (d) => {
    const updated = workDays.includes(d) ? workDays.filter(x => x !== d) : [...workDays, d].sort();
    setApt({ workDays: updated });
  };

  const calConnected  = !!(apt.calendarId && apt.googleCredentials);
  const sheetConnected = !!(apt.sheetsId && apt.googleCredentials);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0FDF4", border: "1px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>Sistema de Citas</h2>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>El bot recopila datos del cliente, verifica horarios en Google Calendar y confirma la cita</p>
        </div>
      </div>

      {/* Master toggle */}
      <div style={{ background: apt.enabled ? "#F0FDF4" : "#F8FAFF", border: `1.5px solid ${apt.enabled ? "#86EFAC" : "#E2E8F0"}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24, transition: "all 0.2s" }}>
        <Toggle
          checked={!!apt.enabled}
          onChange={v => setApt({ enabled: v })}
          label="Activar sistema de citas"
          desc="El bot podrá agendar, verificar disponibilidad y guardar datos del cliente automáticamente"
        />
      </div>

      {/* Main content — only show if enabled */}
      <div style={{ opacity: apt.enabled ? 1 : 0.4, pointerEvents: apt.enabled ? "auto" : "none", transition: "opacity 0.2s" }}>

        {/* ── Custom fields ─────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Campos del formulario</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>El bot pedirá estos datos al cliente en orden. Puedes agregar, quitar y reordenar.</div>
            </div>
            <button onClick={addField} style={{ padding: "7px 14px", background: BLUE, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              + Campo
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fields.map((f, idx) => (
              <div key={f.id} style={{ background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                {/* Order buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveField(idx, -1)} disabled={idx === 0} style={{ width: 20, height: 16, fontSize: 8, background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#CBD5E1" : MUTED, padding: 0, lineHeight: 1 }}>▲</button>
                  <button onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} style={{ width: 20, height: 16, fontSize: 8, background: "none", border: "none", cursor: idx === fields.length - 1 ? "default" : "pointer", color: idx === fields.length - 1 ? "#CBD5E1" : MUTED, padding: 0, lineHeight: 1 }}>▼</button>
                </div>

                {/* Label */}
                <input value={f.label} onChange={e => updateField(f.id, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"") })}
                  placeholder="Ej: Nombre, Teléfono..."
                  style={{ flex: 2, padding: "6px 10px", border: "1.5px solid #E2E8F0", borderRadius: 7, fontSize: 13, color: TEXT, fontFamily: "inherit", outline: "none", background: WHITE }} />

                {/* Type */}
                <select value={f.type} onChange={e => updateField(f.id, { type: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", border: "1.5px solid #E2E8F0", borderRadius: 7, fontSize: 12, color: TEXT, fontFamily: "inherit", background: WHITE }}>
                  {[["text","Texto"],["tel","Teléfono"],["email","Email"],["date","Fecha"],["time","Hora"],["number","Número"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>

                {/* Required toggle */}
                <button onClick={() => updateField(f.id, { required: !f.required })} style={{
                  padding: "4px 10px", borderRadius: 100, border: "none", cursor: "pointer",
                  background: f.required ? "#FFF7ED" : "#F1F5F9",
                  color: f.required ? "#D97706" : MUTED,
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit", flexShrink: 0,
                }}>
                  {f.required ? "⚡ Requerido" : "Opcional"}
                </button>

                <button onClick={() => removeField(f.id)} style={{ width: 26, height: 26, flexShrink: 0, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#DC2626" }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Availability ──────────────────────────── */}
        <div style={{ marginBottom: 28, background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🕐</span> Horario disponible
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 8 }}>DÍAS LABORABLES</label>
            <div style={{ display: "flex", gap: 6 }}>
              {WEEKDAY_LABELS.map((label, d) => (
                <button key={d} onClick={() => toggleWorkDay(d)} style={{
                  width: 38, height: 38, borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: workDays.includes(d) ? BLUE : WHITE,
                  border: `1.5px solid ${workDays.includes(d) ? BLUE : "#E2E8F0"}`,
                  color: workDays.includes(d) ? WHITE : MUTED,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}>{label}</button>
              ))}
            </div>
          </div>
          <Grid2>
            <FieldGroup label="Hora de inicio">
              <input type="time" value={apt.startHour || "09:00"} onChange={e => setApt({ startHour: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: TEXT, fontFamily: "inherit", outline: "none", background: WHITE, boxSizing: "border-box" }} />
            </FieldGroup>
            <FieldGroup label="Hora de cierre">
              <input type="time" value={apt.endHour || "18:00"} onChange={e => setApt({ endHour: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: TEXT, fontFamily: "inherit", outline: "none", background: WHITE, boxSizing: "border-box" }} />
            </FieldGroup>
          </Grid2>
          <FieldGroup label="Duración por cita (minutos)">
            <Select value={String(apt.slotDuration || 60)} onChange={e => setApt({ slotDuration: Number(e.target.value) })}
              options={[["30","30 minutos"],["45","45 minutos"],["60","1 hora"],["90","1 hora 30 min"],["120","2 horas"]].map(([v,l]) => ({ value: v, label: l }))} />
          </FieldGroup>

          {/* Reminder timing */}
          <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              ⏰ Recordatorio automático por WhatsApp
            </div>
            <div style={{ fontSize: 11, color: "#166534", marginBottom: 12 }}>
              El cliente recibirá un mensaje de WhatsApp recordándole su cita con anticipación.
            </div>
            <Select
              value={String(apt.reminderMinutes || 0)}
              onChange={e => setApt({ reminderMinutes: Number(e.target.value) })}
              options={[
                { value: "0",    label: "Sin recordatorio" },
                { value: "30",   label: "30 minutos antes" },
                { value: "60",   label: "1 hora antes" },
                { value: "120",  label: "2 horas antes" },
                { value: "240",  label: "4 horas antes" },
                { value: "720",  label: "12 horas antes" },
                { value: "1440", label: "24 horas antes (1 día)" },
                { value: "2880", label: "48 horas antes (2 días)" },
              ]}
            />
            {apt.reminderMinutes > 0 && (
              <div style={{ fontSize: 11, color: "#15803D", marginTop: 8, padding: "6px 10px", background: "rgba(255,255,255,0.6)", borderRadius: 7 }}>
                📱 El bot enviará: <em>"Hola [Nombre], te recordamos que tienes una cita mañana a las [hora]. ¡Te esperamos!"</em>
              </div>
            )}

            {/* Booking calendar link */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #BBF7D0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                🗓️ Página de calendario para clientes
              </div>
              <div style={{ fontSize: 11, color: "#166534", marginBottom: 8 }}>
                Link público donde tus clientes pueden elegir fecha y hora visualmente.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontSize: 12, color: "#15803D", background: "rgba(255,255,255,0.7)", padding: "7px 10px", borderRadius: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {typeof window !== "undefined" ? `${window.location.origin}/booking` : "https://botflow-eight.vercel.app/booking"}
                </code>
                <button onClick={() => { const url = typeof window !== "undefined" ? `${window.location.origin}/booking` : ""; navigator.clipboard.writeText(url); }}
                  style={{ padding: "7px 12px", background: "#16A34A", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Google credentials (shared) ───────────── */}
        <div style={{ marginBottom: 20, background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔑</span> Credenciales de Google (Service Account)
              </div>
              <div style={{ fontSize: 11, color: "#B45309", marginTop: 3, lineHeight: 1.5 }}>
                Crea un Service Account en <strong>console.cloud.google.com</strong> → activa Calendar API y Sheets API →
                descarga el JSON key → comparte tu calendario y hoja de cálculo con el email del service account.
              </div>
            </div>
            <button onClick={() => setShowCreds(!showCreds)} style={{ padding: "5px 12px", background: WHITE, border: "1px solid #FCD34D", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#92400E", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              {showCreds ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {apt.googleCredentials && !showCreds && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, width: "fit-content" }}>
              <span>✅</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D" }}>Credenciales configuradas</span>
            </div>
          )}
          {showCreds && (
            <Textarea
              value={apt.googleCredentials || ""}
              onChange={e => setApt({ googleCredentials: e.target.value })}
              placeholder={'{\n  "type": "service_account",\n  "client_email": "bot@project.iam.gserviceaccount.com",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",\n  ...\n}'}
              rows={6}
            />
          )}
        </div>

        {/* ── Google Calendar ──────────────────────── */}
        <div style={{ marginBottom: 20, background: WHITE, border: `1.5px solid ${calConnected ? "#86EFAC" : "#E2E8F0"}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: calConnected ? "#F0FDF4" : "#F8FAFF", border: `1px solid ${calConnected ? "#86EFAC" : "#E2E8F0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📆</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Google Calendar</div>
              <div style={{ fontSize: 11, color: calConnected ? "#15803D" : MUTED }}>
                {calConnected ? "✓ Conectado — el bot verificará disponibilidad y creará eventos" : "Sin conectar — agrega Calendar ID para activar"}
              </div>
            </div>
          </div>
          <FieldGroup label="Calendar ID">
            <Input value={apt.calendarId || ""} onChange={e => setApt({ calendarId: e.target.value })}
              placeholder="tu-email@gmail.com  o  xxxxxxxx@group.calendar.google.com" />
          </FieldGroup>
          <FieldGroup label="Zona horaria">
            <Select value={apt.timezone || "America/Mexico_City"} onChange={e => setApt({ timezone: e.target.value })}
              options={[
                { value: "America/Mexico_City", label: "Ciudad de México (UTC-6)" },
                { value: "America/Bogota",       label: "Bogotá / Lima (UTC-5)" },
                { value: "America/Santiago",     label: "Santiago (UTC-4/-3)" },
                { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
                { value: "America/Sao_Paulo",    label: "São Paulo (UTC-3)" },
                { value: "America/New_York",     label: "New York (UTC-5/-4)" },
                { value: "America/Los_Angeles",  label: "Los Ángeles (UTC-8/-7)" },
                { value: "Europe/Madrid",        label: "Madrid (UTC+1/+2)" },
              ]} />
          </FieldGroup>
        </div>

        {/* ── Google Sheets ────────────────────────── */}
        <div style={{ background: WHITE, border: `1.5px solid ${sheetConnected ? "#86EFAC" : "#E2E8F0"}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: sheetConnected ? "#F0FDF4" : "#F8FAFF", border: `1px solid ${sheetConnected ? "#86EFAC" : "#E2E8F0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Google Sheets</div>
              <div style={{ fontSize: 11, color: sheetConnected ? "#15803D" : MUTED }}>
                {sheetConnected ? "✓ Conectado — cada cita se guardará como fila" : "Sin conectar — agrega Spreadsheet ID para activar"}
              </div>
            </div>
          </div>
          <Grid2>
            <FieldGroup label="Spreadsheet ID">
              <Input value={apt.sheetsId || ""} onChange={e => setApt({ sheetsId: e.target.value })}
                placeholder="El ID de la URL: /spreadsheets/d/[ID]/edit" />
            </FieldGroup>
            <FieldGroup label="Nombre de la hoja (tab)">
              <Input value={apt.sheetsTab || ""} onChange={e => setApt({ sheetsTab: e.target.value })} placeholder="Citas" />
            </FieldGroup>
          </Grid2>
          <div style={{ fontSize: 11, color: MUTED, padding: "8px 12px", background: "#F8FAFF", borderRadius: 8, lineHeight: 1.6 }}>
            💡 Los encabezados de columna se crean automáticamente con los campos que configuraste arriba.
            Asegúrate de haber compartido la hoja con el email del service account (con permiso de edición).
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
function parseConfigData(data) {
  return {
    ...data,
    accessToken:  data.accessToken?.startsWith("****")  ? "" : data.accessToken  || "",
    anthropicKey: data.anthropicKey?.startsWith("****") ? "" : data.anthropicKey || "",
    configured: undefined, // computed field, don't store
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab]   = useState("general");
  const [config, setConfig]         = useState({});
  const [saved, setSaved]           = useState(false);   // "ok" | "error" | false
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const originalConfig              = useRef({});

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(data => {
      const parsed = parseConfigData(data);
      setConfig(parsed);
      originalConfig.current = parsed;
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDiscard = () => {
    setConfig(originalConfig.current);
  };

  const handleSave = async () => {
    setSaving(true);
    // Don't send empty password fields (keep existing values in KV)
    const toSave = { ...config };
    delete toSave.configured; // computed field
    if (!toSave.accessToken)  delete toSave.accessToken;
    if (!toSave.anthropicKey) delete toSave.anthropicKey;

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Error al guardar");

      // Reload config from server to confirm what was saved
      const fresh = await fetch("/api/config").then(r => r.json());
      const parsed = parseConfigData(fresh);
      setConfig(parsed);
      originalConfig.current = parsed;

      setSaved("ok");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setSaved("error");
      setTimeout(() => setSaved(false), 4000);
    }
    setSaving(false);
  };

  const currentTip = TIPS[activeTab] || TIPS.general;

  return (
    <div>
      {/* Breadcrumb + header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <a href="/dashboard" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>Mis Bots</a>
            <span style={{ color: "#CBD5E1" }}>›</span>
            <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>Configuración</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em" }}>Configuración y Ajustes</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleDiscard} style={{
            padding: "10px 20px", background: WHITE, border: "1.5px solid #E2E8F0",
            borderRadius: 10, fontSize: 14, fontWeight: 600, color: TEXT,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#94A3B8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }}>
            Descartar
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "10px 20px",
            background: saved === "ok" ? "#16A34A" : saved === "error" ? "#DC2626" : BLUE,
            border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
            color: WHITE, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
            boxShadow: `0 2px 8px rgba(${saved === "ok" ? "22,163,74" : saved === "error" ? "220,38,38" : "37,99,235"},0.3)`,
            transition: "all 0.25s", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.8 : 1,
          }}>
            {saving ? "⏳ Guardando..." : saved === "ok" ? "✓ Guardado" : saved === "error" ? "❌ Error al guardar" : "💾 Guardar Cambios"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: MUTED }}>Cargando configuración...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
          {/* Left: sub-tabs + tip */}
          <div>
            <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden", marginBottom: 16 }}>
              {SUB_TABS.map((tab, i) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  width: "100%", padding: "12px 16px", background: activeTab === tab.id ? BLUE_LIGHT : WHITE,
                  border: "none", borderBottom: i < SUB_TABS.length - 1 ? "1px solid #F1F5F9" : "none",
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  fontFamily: "inherit", transition: "background 0.15s",
                  color: activeTab === tab.id ? BLUE : TEXT,
                  fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 14,
                }}
                  onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = "#F8FAFF"; }}
                  onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = WHITE; }}>
                  <span style={{ fontSize: 16 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: "16px", border: "1px solid #BFDBFE" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>ℹ️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>Tip del Sistema</span>
              </div>
              <p style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.6 }}>{currentTip}</p>
            </div>
          </div>

          {/* Right: tab content */}
          <div style={{ background: WHITE, borderRadius: 16, border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "28px 32px" }}>
              {activeTab === "general"    && <TabGeneral    config={config} setConfig={setConfig} />}
              {activeTab === "negocio"    && <TabNegocio    config={config} setConfig={setConfig} />}
              {activeTab === "whatsapp"   && <TabWhatsApp   config={config} setConfig={setConfig} />}
              {activeTab === "respuestas" && <TabRespuestas config={config} setConfig={setConfig} />}
              {activeTab === "citas"      && <TabCitas      config={config} setConfig={setConfig} />}
              {activeTab === "avanzado"   && <TabFAQs       config={config} setConfig={setConfig} />}
            </div>
            {/* Bottom save bar */}
            <div style={{ borderTop: "1.5px solid #F1F5F9", padding: "16px 32px", background: "#FAFBFF", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={handleDiscard} style={{
                padding: "10px 20px", background: WHITE, border: "1.5px solid #E2E8F0",
                borderRadius: 10, fontSize: 14, fontWeight: 600, color: TEXT,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#94A3B8"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
                Descartar
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "10px 24px",
                background: saved === "ok" ? "#16A34A" : saved === "error" ? "#DC2626" : BLUE,
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                color: WHITE, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                boxShadow: `0 2px 8px rgba(${saved === "ok" ? "22,163,74" : saved === "error" ? "220,38,38" : "37,99,235"},0.3)`,
                transition: "all 0.25s", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.8 : 1,
              }}>
                {saving ? "⏳ Guardando..." : saved === "ok" ? "✓ Guardado" : saved === "error" ? "❌ Error al guardar" : "💾 Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
