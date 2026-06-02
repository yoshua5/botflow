"use client";
import { useState } from "react";

const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID   = "#DBEAFE";
const TEXT       = "#0F172A";
const MUTED      = "#64748B";
const WHITE      = "#FFFFFF";

const TONE_OPTIONS = [
  { value: "amigable",    label: "Amigable",    icon: "😊", desc: "Cercano y casual" },
  { value: "profesional", label: "Profesional", icon: "💼", desc: "Formal y serio" },
  { value: "energético",  label: "Energético",  icon: "⚡", desc: "Dinámico y entusiasta" },
  { value: "empático",    label: "Empático",    icon: "💚", desc: "Comprensivo y cálido" },
  { value: "directo",     label: "Directo",     icon: "🎯", desc: "Conciso y al grano" },
];

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>
      {children}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
    </label>
  );
}
function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0",
        borderRadius: 10, fontSize: 14, color: TEXT, outline: "none",
        fontFamily: "inherit", background: WHITE, boxSizing: "border-box", transition: "border-color 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = "#93C5FD"}
      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}
function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0",
        borderRadius: 10, fontSize: 14, color: TEXT, outline: "none",
        fontFamily: "inherit", background: WHITE, boxSizing: "border-box",
        resize: "vertical", transition: "border-color 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = "#93C5FD"}
      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}
function FieldGroup({ label, children, required }) {
  return <div style={{ marginBottom: 16 }}><Label required={required}>{label}</Label>{children}</div>;
}
function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────
// Phase 1: Nombre + URL
// ─────────────────────────────────────────────────────────
function PhaseUrl({ onSubmit, loading, error }) {
  const [url, setUrl]   = useState("");
  const [name, setName] = useState("");

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, marginBottom: 8 }}>Crear tu agente de WhatsApp</h1>
      <p style={{ fontSize: 15, color: MUTED, marginBottom: 40, lineHeight: 1.6 }}>
        Pega la URL de tu sitio web y Claude llenará todo automáticamente.
        Solo confirmas lo que esté mal.
      </p>

      <div style={{ background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "28px 32px", textAlign: "left", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <FieldGroup label="Nombre de tu negocio" required>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Peluquería El Estilo" />
        </FieldGroup>

        <div style={{ marginBottom: 20 }}>
          <Label>Sitio web (opcional pero recomendado)</Label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>🌐</span>
            <input
              type="url" value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && onSubmit(name.trim(), url.trim())}
              placeholder="https://minegocio.com"
              style={{
                width: "100%", padding: "10px 14px 10px 36px", border: "1.5px solid #E2E8F0",
                borderRadius: 10, fontSize: 14, color: TEXT, outline: "none",
                fontFamily: "inherit", background: WHITE, boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>
            Con URL → Claude lee tu contenido y llena el formulario solo.
            Sin URL → lo llenarás manualmente (solo toma 2 minutos).
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 13, color: "#DC2626", marginBottom: 16 }}>
            ❌ {error}
          </div>
        )}

        <button
          onClick={() => name.trim() && onSubmit(name.trim(), url.trim())}
          disabled={!name.trim() || loading}
          style={{
            width: "100%", padding: "13px",
            background: (!name.trim() || loading) ? MUTED : BLUE,
            border: "none", borderRadius: 11, fontSize: 15, fontWeight: 700,
            color: WHITE, cursor: (!name.trim() || loading) ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "background 0.2s",
          }}>
          {loading
            ? (url.trim() ? "🔍 Analizando tu sitio..." : "⏳ Preparando formulario...")
            : (url.trim() ? "🚀 Analizar y continuar" : "Continuar sin sitio web →")}
        </button>
      </div>

      <p style={{ fontSize: 12, color: MUTED, marginTop: 20 }}>
        ¿Ya tienes un bot?{" "}
        <a href="/dashboard/bots" style={{ color: BLUE, textDecoration: "none", fontWeight: 600 }}>Ver mis bots</a>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Phase 2: Review + confirm form
// ─────────────────────────────────────────────────────────
function PhaseReview({ form, setForm, onSubmit, saving, saveError, wasScraped, onBack }) {
  const set  = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const tone = form.tone || "amigable";
  const tag  = (field) => wasScraped && form[field] ? " ✨" : "";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: MUTED, fontFamily: "inherit", padding: 0 }}>
          ← Volver
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, marginTop: 8, marginBottom: 4 }}>
          {wasScraped ? "✅ Sitio analizado — revisa y confirma" : "📝 Configura tu agente"}
        </h1>
        <p style={{ fontSize: 14, color: MUTED }}>
          {wasScraped
            ? "Claude llenó los campos automáticamente desde tu sitio web. Revisa, corrige lo que necesites y crea el bot."
            : "Completa la información de tu negocio para crear el agente."}
        </p>
      </div>

      {wasScraped && (
        <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 12, padding: "12px 18px", marginBottom: 24, fontSize: 13, color: "#15803D", fontWeight: 600 }}>
          🌐 Campos marcados con ✨ fueron llenados automáticamente desde tu sitio web. Puedes editarlos.
        </div>
      )}

      <div style={{ background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "28px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>

        {/* Sección: Negocio */}
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>🏢 Información del Negocio</div>

        <Grid2>
          <FieldGroup label="Nombre del negocio" required>
            <Input value={form.businessName || ""} onChange={e => set("businessName", e.target.value)} placeholder="Peluquería El Estilo" />
          </FieldGroup>
          <FieldGroup label={`Nombre del agente${tag("agentName")}`} required>
            <Input value={form.agentName || ""} onChange={e => set("agentName", e.target.value)} placeholder="Sofia, Max, Ana..." />
          </FieldGroup>
        </Grid2>

        <FieldGroup label={`Descripción del negocio${tag("businessDesc")}`} required>
          <Textarea value={form.businessDesc || ""} onChange={e => set("businessDesc", e.target.value)}
            placeholder="¿A qué se dedica tu negocio? Descríbelo en 1-2 oraciones." rows={2} />
        </FieldGroup>

        <FieldGroup label={`Perfil detallado${tag("businessProfile")}`}>
          <Textarea value={form.businessProfile || ""} onChange={e => set("businessProfile", e.target.value)}
            placeholder="Descripción completa: qué ofreces, qué te diferencia, tus valores..." rows={4} />
        </FieldGroup>

        <Grid2>
          <FieldGroup label={`Servicios / Productos${tag("services")}`}>
            <Textarea value={form.services || ""} onChange={e => set("services", e.target.value)}
              placeholder="Corte de cabello, tinte, barba..." rows={2} />
          </FieldGroup>
          <div>
            <FieldGroup label={`Horario${tag("hours")}`}>
              <Input value={form.hours || ""} onChange={e => set("hours", e.target.value)} placeholder="Lun–Vie 9am–6pm" />
            </FieldGroup>
            <FieldGroup label={`Ubicación${tag("location")}`}>
              <Input value={form.location || ""} onChange={e => set("location", e.target.value)} placeholder="Ciudad de México, CDMX" />
            </FieldGroup>
          </div>
        </Grid2>

        <Grid2>
          <FieldGroup label={`Dirección completa${tag("fullAddress")}`}>
            <Input value={form.fullAddress || ""} onChange={e => set("fullAddress", e.target.value)} placeholder="Calle, número, colonia, ciudad" />
          </FieldGroup>
          <FieldGroup label={`Teléfono${tag("phone")}`}>
            <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="+52 55 1234 5678" />
          </FieldGroup>
        </Grid2>

        <Grid2>
          <FieldGroup label="Sitio web">
            <Input value={form.website || ""} onChange={e => set("website", e.target.value)} placeholder="https://minegocio.com" />
          </FieldGroup>
          <FieldGroup label={`Email de contacto${tag("contactEmail")}`}>
            <Input value={form.contactEmail || ""} onChange={e => set("contactEmail", e.target.value)} placeholder="hola@minegocio.com" />
          </FieldGroup>
        </Grid2>

        <div style={{ borderTop: "1px solid #F1F5F9", margin: "8px 0 20px" }} />

        {/* Sección: Personalidad */}
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>🗨️ Personalidad del Agente</div>

        <div style={{ marginBottom: 20 }}>
          <Label>{`Tono de voz${tag("tone")}`}</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {TONE_OPTIONS.map(t => (
              <button key={t.value} onClick={() => set("tone", t.value)} style={{
                padding: "11px 6px", borderRadius: 11, textAlign: "center",
                background: tone === t.value ? BLUE_MID : WHITE,
                border: `1.5px solid ${tone === t.value ? BLUE : "#E2E8F0"}`,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>{t.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: tone === t.value ? BLUE : TEXT }}>{t.label}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <FieldGroup label="Mensaje de bienvenida">
          <Textarea value={form.greeting || ""} onChange={e => set("greeting", e.target.value)}
            placeholder={`¡Hola! Soy ${form.agentName || "tu asistente"}, ¿en qué te puedo ayudar hoy?`} rows={2} />
        </FieldGroup>

        <FieldGroup label={`Instrucciones especiales${tag("extraInstructions")}`}>
          <Textarea value={form.extraInstructions || ""} onChange={e => set("extraInstructions", e.target.value)}
            placeholder="Si preguntan por precios, dirigir a ventas. No mencionar a la competencia..." rows={3} />
        </FieldGroup>
      </div>

      {saveError && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: 16 }}>
          ❌ {saveError}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button onClick={onBack} style={{
          padding: "12px 22px", background: WHITE, border: "1.5px solid #E2E8F0",
          borderRadius: 11, fontSize: 14, fontWeight: 600, color: MUTED,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          ← Volver
        </button>
        <button
          onClick={onSubmit}
          disabled={saving || !form.businessName?.trim() || !form.agentName?.trim() || !form.businessDesc?.trim()}
          style={{
            padding: "12px 28px",
            background: saving ? MUTED : BLUE,
            border: "none", borderRadius: 11, fontSize: 15, fontWeight: 700,
            color: WHITE, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            transition: "all 0.2s",
            opacity: (!form.businessName?.trim() || !form.agentName?.trim() || !form.businessDesc?.trim()) ? 0.6 : 1,
          }}>
          {saving ? "⏳ Creando bot..." : "✅ Crear agente de WhatsApp"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Phase 3: Done
// ─────────────────────────────────────────────────────────
function PhaseDone({ botName, botId }) {
  const connectUrl = botId ? `/dashboard/bots/${botId}?connect=1` : "/dashboard/bots";
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, marginBottom: 12 }}>¡Bot creado!</h1>
      <p style={{ fontSize: 15, color: MUTED, marginBottom: 8, lineHeight: 1.6 }}>
        <strong>{botName}</strong> está listo.
      </p>
      <p style={{ fontSize: 14, color: MUTED, marginBottom: 32, lineHeight: 1.6 }}>
        Ahora solo conecta tu número de WhatsApp con un clic — Facebook te guía automáticamente, sin pegar tokens ni IDs.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a href={connectUrl} style={{
          padding: "13px 28px", background: "#25D366", borderRadius: 11,
          fontSize: 15, fontWeight: 700, color: WHITE, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 8,
          boxShadow: "0 2px 12px rgba(37,211,102,0.35)",
        }}>
          <span style={{ fontSize: 18 }}>📲</span> Conectar WhatsApp con Facebook
        </a>
      </div>
      <a href="/dashboard/bots" style={{ display: "block", marginTop: 16, fontSize: 13, color: MUTED, textDecoration: "none" }}>
        Hacerlo después →
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────
export default function CreateBotPage() {
  const [phase,      setPhase]      = useState("url");
  const [loading,    setLoading]    = useState(false);
  const [urlError,   setUrlError]   = useState(null);
  const [wasScraped, setWasScraped] = useState(false);
  const [form,       setForm]       = useState({
    businessName: "", agentName: "", businessDesc: "", businessProfile: "",
    services: "", hours: "", location: "", fullAddress: "", phone: "",
    website: "", contactEmail: "", tone: "amigable", greeting: "", extraInstructions: "",
  });
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState(null);
  const [createdBotName, setCreatedBotName] = useState("");
  const [createdBotId,   setCreatedBotId]   = useState("");

  // ── Step 1: submit URL ───────────────────────────────────
  const handleUrlSubmit = async (name, url) => {
    setLoading(true);
    setUrlError(null);
    const base = { ...form, businessName: name, website: url || "" };

    if (!url) {
      setForm(base);
      setWasScraped(false);
      setPhase("review");
      setLoading(false);
      return;
    }

    try {
      const res  = await fetch("/api/settings/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.error === "missing_key") {
        setUrlError("No hay Anthropic API Key configurada — llena el formulario manualmente o configúrala en Settings.");
        setForm(base);
        setWasScraped(false);
        setPhase("review");
        setLoading(false);
        return;
      }
      if (data.error) {
        setUrlError(`No pude leer el sitio (${data.error}). Llena el formulario manualmente.`);
        setForm(base);
        setWasScraped(false);
        setPhase("review");
        setLoading(false);
        return;
      }

      const f = data.fields || {};
      setForm({
        ...base,
        businessDesc:     f.businessDesc     || "",
        businessProfile:  f.businessProfile  || "",
        services:         f.services         || "",
        hours:            f.hours            || "",
        location:         f.location         || "",
        fullAddress:      f.fullAddress      || "",
        phone:            f.phone            || "",
        contactEmail:     f.contactEmail     || "",
        agentName:        f.agentName        || "",
        tone:             f.tone             || "amigable",
        extraInstructions: f.extraInstructions || "",
      });
      setWasScraped(true);
    } catch (e) {
      setUrlError("Error de conexión. Llena el formulario manualmente.");
      setForm(base);
      setWasScraped(false);
    }
    setPhase("review");
    setLoading(false);
  };

  // ── Step 2: create bot ───────────────────────────────────
  const handleCreate = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res  = await fetch("/api/create-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 9,
          userAnswer: form.extraInstructions || "N/A",
          answers: form,
          _autofill: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || (!data.success && !data.bot)) throw new Error(data.error || "Error al crear el bot");
      setCreatedBotName(form.agentName || form.businessName || "Tu bot");
      setCreatedBotId(data.bot?.id || "");
      setPhase("done");
    } catch (err) {
      setSaveError(err.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      {phase === "url"    && (
        <PhaseUrl onSubmit={handleUrlSubmit} loading={loading} error={urlError} />
      )}
      {phase === "review" && (
        <PhaseReview
          form={form} setForm={setForm}
          onSubmit={handleCreate}
          saving={saving} saveError={saveError}
          wasScraped={wasScraped}
          onBack={() => setPhase("url")}
        />
      )}
      {phase === "done"   && <PhaseDone botName={createdBotName} botId={createdBotId} />}
    </div>
  );
}
