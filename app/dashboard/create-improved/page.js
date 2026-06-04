"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const GREEN = "#10B981";

// ─────────────────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>
      {children}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 14px",
        border: "1.5px solid #E2E8F0",
        borderRadius: 10,
        fontSize: 14,
        color: TEXT,
        outline: "none",
        fontFamily: "inherit",
        background: WHITE,
        boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={e => (e.target.style.borderColor = "#93C5FD")}
      onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        padding: "10px 14px",
        border: "1.5px solid #E2E8F0",
        borderRadius: 10,
        fontSize: 14,
        color: TEXT,
        outline: "none",
        fontFamily: "inherit",
        background: WHITE,
        boxSizing: "border-box",
        resize: "vertical",
        transition: "border-color 0.2s",
      }}
      onFocus={e => (e.target.style.borderColor = "#93C5FD")}
      onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
    />
  );
}

function FieldGroup({ label, children, required }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && <Label required={required}>{label}</Label>}
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────
// Phases
// ─────────────────────────────────────────────────────────

const PHASES = [
  { id: 1, icon: "🏢", label: "Negocio", title: "Información del Negocio" },
  { id: 2, icon: "🎨", label: "Identidad", title: "Personalidad del Agente" },
  { id: 3, icon: "🎯", label: "Objetivo", title: "¿Qué debe hacer?" },
  { id: 4, icon: "📚", label: "Conocimiento", title: "Base de Conocimiento" },
  { id: 5, icon: "✅", label: "Resumen", title: "Confirmar y Crear" },
];

const TONE_OPTIONS = [
  { value: "amigable", label: "😊 Amigable", desc: "Cercano y casual" },
  { value: "profesional", label: "💼 Profesional", desc: "Formal y serio" },
  { value: "energético", label: "⚡ Energético", desc: "Dinámico y entusiasta" },
  { value: "empático", label: "💚 Empático", desc: "Comprensivo y cálido" },
  { value: "directo", label: "🎯 Directo", desc: "Conciso y al grano" },
];

const OBJECTIVE_TYPES = [
  { value: "venta", label: "💰 Venta", desc: "Convertir y realizar ventas" },
  { value: "soporte", label: "🆘 Soporte", desc: "Resolver preguntas y dudas" },
  { value: "atencion", label: "📞 Atención", desc: "Agendar citas y consultas" },
  { value: "recopilacion", label: "📝 Recopilación", desc: "Recolectar información" },
];

// Phase 1: Negocio
function Phase1({ form, setForm, onNext }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!form.businessName?.trim()) {
      setError("El nombre del negocio es obligatorio");
      return;
    }

    setLoading(true);
    setError(null);

    if (form.website?.trim()) {
      try {
        const res = await fetch("/api/settings/autofill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: form.website.trim() }),
        });
        const data = await res.json();
        if (data.fields) {
          setForm(prev => ({ ...prev, ...data.fields }));
        }
      } catch (e) {
        console.error("Autofill error:", e);
      }
    }
    setLoading(false);
    onNext();
  };

  return (
    <div>
      <FieldGroup label="Nombre de tu negocio" required>
        <Input
          value={form.businessName || ""}
          onChange={e => setForm({ ...form, businessName: e.target.value })}
          placeholder="Ej: Peluquería El Estilo"
        />
      </FieldGroup>

      <FieldGroup label="Sitio web (opcional pero recomendado)">
        <Input
          value={form.website || ""}
          onChange={e => setForm({ ...form, website: e.target.value })}
          placeholder="https://minegocio.com"
          type="url"
        />
        <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
          💡 Con sitio web, Claude llena la información automáticamente
        </div>
      </FieldGroup>

      <FieldGroup label="Descripción del negocio" required>
        <Textarea
          value={form.businessDesc || ""}
          onChange={e => setForm({ ...form, businessDesc: e.target.value })}
          placeholder="¿A qué se dedica tu negocio? Descríbelo en 1-2 oraciones."
          rows={2}
        />
      </FieldGroup>

      {error && (
        <div style={{ padding: "12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 13, color: "#DC2626", marginBottom: 20 }}>
          ❌ {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!form.businessName?.trim() || loading}
        style={{
          width: "100%",
          padding: "12px",
          background: !form.businessName?.trim() || loading ? MUTED : BLUE,
          color: WHITE,
          border: "none",
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 700,
          cursor: !form.businessName?.trim() || loading ? "not-allowed" : "pointer",
          opacity: !form.businessName?.trim() ? 0.6 : 1,
          transition: "all 0.2s",
        }}>
        {loading ? "🔍 Procesando..." : "Siguiente →"}
      </button>
    </div>
  );
}

// Phase 2: Identidad
function Phase2({ form, setForm, onNext, onBack }) {
  return (
    <div>
      <FieldGroup label="Nombre del agente" required>
        <Input
          value={form.agentName || ""}
          onChange={e => setForm({ ...form, agentName: e.target.value })}
          placeholder="Ej: Sofia, Max, Ana"
        />
      </FieldGroup>

      <FieldGroup label="Tono de voz" required>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {TONE_OPTIONS.map(tone => (
            <button
              key={tone.value}
              onClick={() => setForm({ ...form, tone: tone.value })}
              style={{
                padding: "12px 8px",
                background: form.tone === tone.value ? BLUE_MID : WHITE,
                border: `2px solid ${form.tone === tone.value ? BLUE : "#E2E8F0"}`,
                borderRadius: 10,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{tone.label.split(" ")[0]}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: form.tone === tone.value ? BLUE : TEXT }}>
                {tone.label.split(" ").slice(1).join(" ")}
              </div>
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Mensaje de bienvenida">
        <Textarea
          value={form.greeting || ""}
          onChange={e => setForm({ ...form, greeting: e.target.value })}
          placeholder={`¡Hola! Soy ${form.agentName || "tu asistente"}, ¿en qué te puedo ayudar hoy?`}
          rows={2}
        />
      </FieldGroup>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "12px",
            background: WHITE,
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: MUTED,
            cursor: "pointer",
          }}>
          ← Volver
        </button>
        <button
          onClick={onNext}
          disabled={!form.agentName?.trim()}
          style={{
            flex: 1,
            padding: "12px",
            background: !form.agentName?.trim() ? MUTED : BLUE,
            color: WHITE,
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: !form.agentName?.trim() ? "not-allowed" : "pointer",
            opacity: !form.agentName?.trim() ? 0.6 : 1,
          }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// Phase 3: Objetivo
function Phase3({ form, setForm, onNext, onBack }) {
  const [selectedData, setSelectedData] = useState(form.collectData || []);

  const dataOptions = [
    { value: "nombre", label: "📝 Nombre" },
    { value: "email", label: "📧 Email" },
    { value: "telefono", label: "📱 Teléfono" },
    { value: "direccion", label: "📍 Dirección" },
    { value: "empresa", label: "🏢 Empresa" },
    { value: "consulta", label: "❓ Consulta/Duda" },
  ];

  const toggleData = val => {
    setSelectedData(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const handleNext = () => {
    setForm(prev => ({ ...prev, collectData: selectedData }));
    onNext();
  };

  return (
    <div>
      <FieldGroup label="¿Cuál es el objetivo principal?" required>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {OBJECTIVE_TYPES.map(obj => (
            <button
              key={obj.value}
              onClick={() => setForm({ ...form, objective: obj.value })}
              style={{
                padding: "16px",
                background: form.objective === obj.value ? BLUE_MID : WHITE,
                border: `2px solid ${form.objective === obj.value ? BLUE : "#E2E8F0"}`,
                borderRadius: 10,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{obj.label}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{obj.desc}</div>
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="¿Qué información necesitas recolectar?">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {dataOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleData(opt.value)}
              style={{
                padding: "12px",
                background: selectedData.includes(opt.value) ? BLUE_MID : WHITE,
                border: `2px solid ${selectedData.includes(opt.value) ? BLUE : "#E2E8F0"}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                color: selectedData.includes(opt.value) ? BLUE : TEXT,
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Acción principal que debe realizar">
        <Input
          value={form.mainAction || ""}
          onChange={e => setForm({ ...form, mainAction: e.target.value })}
          placeholder="Ej: Enviar cotización, Agendar cita, Recibir pedido"
        />
      </FieldGroup>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "12px",
            background: WHITE,
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: MUTED,
            cursor: "pointer",
          }}>
          ← Volver
        </button>
        <button
          onClick={handleNext}
          style={{
            flex: 1,
            padding: "12px",
            background: BLUE,
            color: WHITE,
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// Phase 4: Conocimiento
function Phase4({ form, setForm, onNext, onBack }) {
  const [fileMessage, setFileMessage] = useState("");

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setFileMessage("📤 Procesando documentos...");

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("files", file));

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setFileMessage("✅ Documentos cargados correctamente");
        setForm(prev => ({
          ...prev,
          knowledge: {
            ...(prev.knowledge || {}),
            documents: data.documents || [],
          },
        }));
      }
    } catch (err) {
      setFileMessage("❌ Error al procesar documentos");
    }
  };

  return (
    <div>
      <FieldGroup label="Políticas y horarios">
        <Textarea
          value={form.policies || ""}
          onChange={e => setForm({ ...form, policies: e.target.value })}
          placeholder="Políticas de devolución, horarios, días de descanso, etc."
          rows={3}
        />
      </FieldGroup>

      <FieldGroup label="Sube documentos (PDF, Word, Excel)">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileUpload}
          style={{
            width: "100%",
            padding: "20px",
            border: "2px dashed #E2E8F0",
            borderRadius: 10,
            background: WHITE,
            cursor: "pointer",
            fontSize: 14,
          }}
        />
        {fileMessage && (
          <div style={{ fontSize: 12, marginTop: 8, color: fileMessage.includes("✅") ? GREEN : "#EF4444" }}>
            {fileMessage}
          </div>
        )}
      </FieldGroup>

      <FieldGroup label="Redes sociales y enlaces">
        <Grid2>
          <div>
            <Label>Instagram</Label>
            <Input
              value={form.instagram || ""}
              onChange={e => setForm({ ...form, instagram: e.target.value })}
              placeholder="@minegocio"
            />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input
              value={form.facebook || ""}
              onChange={e => setForm({ ...form, facebook: e.target.value })}
              placeholder="facebook.com/minegocio"
            />
          </div>
        </Grid2>
      </FieldGroup>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "12px",
            background: WHITE,
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: MUTED,
            cursor: "pointer",
          }}>
          ← Volver
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: "12px",
            background: BLUE,
            color: WHITE,
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// Phase 5: Resumen y creación
function Phase5({ form, onBack, onSubmit, loading }) {
  return (
    <div>
      <div style={{ background: BLUE_LIGHT, border: `1px solid ${BLUE_MID}`, borderRadius: 12, padding: "20px", marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: BLUE, marginBottom: 12 }}>
          ✨ Tu bot está listo para crear
        </div>
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
          Después de crear, podrás conectar tu número de WhatsApp con un solo click desde el dashboard.
        </p>
      </div>

      {/* Summary */}
      <div style={{ background: WHITE, border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px", marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Resumen de tu bot:</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
          <div>
            <div style={{ color: MUTED, marginBottom: 2 }}>Negocio</div>
            <div style={{ fontWeight: 600, color: TEXT }}>{form.businessName}</div>
          </div>
          <div>
            <div style={{ color: MUTED, marginBottom: 2 }}>Agente</div>
            <div style={{ fontWeight: 600, color: TEXT }}>{form.agentName}</div>
          </div>
          <div>
            <div style={{ color: MUTED, marginBottom: 2 }}>Tono</div>
            <div style={{ fontWeight: 600, color: TEXT }}>
              {TONE_OPTIONS.find(t => t.value === form.tone)?.label.split(" ").slice(1).join(" ")}
            </div>
          </div>
          <div>
            <div style={{ color: MUTED, marginBottom: 2 }}>Objetivo</div>
            <div style={{ fontWeight: 600, color: TEXT }}>
              {OBJECTIVE_TYPES.find(o => o.value === form.objective)?.label.split(" ").slice(1).join(" ")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "12px",
            background: WHITE,
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: MUTED,
            cursor: "pointer",
          }}>
          ← Volver
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px",
            background: loading ? MUTED : GREEN,
            color: WHITE,
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "⏳ Creando bot..." : "🚀 Crear mi bot"}
        </button>
      </div>
    </div>
  );
}

// Main component
export default function CreateBotPageImproved() {
  const router = useRouter();
  const [phase, setPhase] = useState(1);
  const [form, setForm] = useState({
    businessName: "",
    businessDesc: "",
    agentName: "",
    website: "",
    tone: "amigable",
    objective: "",
    greeting: "",
    mainAction: "",
    collectData: [],
    policies: "",
    instagram: "",
    facebook: "",
  });
  const [loading, setLoading] = useState(false);

  const handleCreateBot = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 9,
          userAnswer: form.mainAction || "N/A",
          answers: form,
          _autofill: true,
        }),
      });
      const data = await res.json();
      if (data.success || data.bot) {
        router.push(`/dashboard/bots/${data.bot?.id || "list"}`);
      }
    } catch (e) {
      console.error("Error creating bot:", e);
    }
    setLoading(false);
  };

  const currentPhaseData = PHASES[phase - 1];

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", background: "#F9FAFB" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {PHASES.map((p, i) => (
              <div key={p.id} style={{ flex: 1 }}>
                <div style={{
                  height: 6,
                  background: phase >= p.id ? BLUE : "#E5E7EB",
                  borderRadius: 3,
                  transition: "background 0.3s",
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                {currentPhaseData.icon} {currentPhaseData.title}
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                Paso {phase} de 5
              </div>
            </div>
          </div>
        </div>

        {/* Form container */}
        <div style={{ background: WHITE, borderRadius: 16, padding: "32px", border: "1px solid #E5E7EB" }}>
          {phase === 1 && <Phase1 form={form} setForm={setForm} onNext={() => setPhase(2)} />}
          {phase === 2 && <Phase2 form={form} setForm={setForm} onNext={() => setPhase(3)} onBack={() => setPhase(1)} />}
          {phase === 3 && <Phase3 form={form} setForm={setForm} onNext={() => setPhase(4)} onBack={() => setPhase(2)} />}
          {phase === 4 && <Phase4 form={form} setForm={setForm} onNext={() => setPhase(5)} onBack={() => setPhase(3)} />}
          {phase === 5 && <Phase5 form={form} onBack={() => setPhase(4)} onSubmit={handleCreateBot} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
