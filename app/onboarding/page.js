"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Data ─────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { value: "restaurante", emoji: "🍽️", label: "Restaurante / Food" },
  { value: "salud", emoji: "🏥", label: "Clínica / Salud" },
  { value: "belleza", emoji: "💅", label: "Belleza / Spa" },
  { value: "ecommerce", emoji: "🛍️", label: "Tienda / E-commerce" },
  { value: "legal", emoji: "⚖️", label: "Despacho Legal" },
  { value: "inmobiliaria", emoji: "🏠", label: "Inmobiliaria" },
  { value: "educacion", emoji: "📚", label: "Educación" },
  { value: "otro", emoji: "✨", label: "Otro" },
];

const TONES = [
  { value: "amigable", emoji: "😊", label: "Amigable", desc: "Cercano y casual" },
  { value: "profesional", emoji: "💼", label: "Profesional", desc: "Formal y serio" },
  { value: "energético", emoji: "⚡", label: "Energético", desc: "Dinámico y entusiasta" },
  { value: "empático", emoji: "🤝", label: "Empático", desc: "Cálido y comprensivo" },
];

const PLANS = [
  {
    id: "free", name: "Gratis", price: "$0", period: "para siempre",
    features: ["1 bot activo", "100 mensajes/mes", "Número de prueba"],
  },
  {
    id: "pro", name: "Pro", price: "$29", period: "/ mes", popular: true,
    features: ["5 bots", "5,000 mensajes/mes", "Tu propio número", "Analytics"],
  },
  {
    id: "enterprise", name: "Business", price: "$99", period: "/ mes",
    features: ["Bots ilimitados", "Mensajes ilimitados", "Múltiples números"],
  },
];

const STEPS = ["Tu negocio", "Servicios", "WhatsApp", "Plan", "¡Listo!"];

// ─── Shared styles ────────────────────────────────────────
const fieldLabel = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#374151", marginBottom: 6,
};

const fieldInput = {
  width: "100%", padding: "11px 14px", fontSize: 14,
  border: "1.5px solid #E5E7EB", borderRadius: 10,
  outline: "none", fontFamily: "inherit", color: "#111827",
  background: "#fff", boxSizing: "border-box", transition: "border-color 0.2s",
};

const fieldTextarea = {
  ...fieldInput, resize: "none",
};

function Btn({ children, onClick, disabled, secondary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 20px", borderRadius: 10, fontFamily: "inherit",
        fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        border: secondary ? "1.5px solid #E5E7EB" : "none",
        background: secondary ? "#fff" : disabled ? "#E5E7EB" : "#16A34A",
        color: secondary ? "#6B7280" : disabled ? "#9CA3AF" : "#fff",
        transition: "all 0.15s",
        boxShadow: (!secondary && !disabled) ? "0 1px 4px rgba(22,163,74,0.3)" : "none",
      }}
      onMouseEnter={e => {
        if (!disabled && !secondary) e.currentTarget.style.background = "#15803D";
        if (secondary) e.currentTarget.style.background = "#F9FAFB";
      }}
      onMouseLeave={e => {
        if (!disabled && !secondary) e.currentTarget.style.background = "#16A34A";
        if (secondary) e.currentTarget.style.background = "#fff";
      }}
    >
      {children}
    </button>
  );
}

// ─── Steps ────────────────────────────────────────────────
function Step1({ data, setData, onNext }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Datos de tu negocio
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Cuéntanos sobre tu empresa para personalizar tu agente.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>Nombre del negocio <span style={{ color: "#EF4444" }}>*</span></label>
        <input
          autoFocus
          value={data.businessName}
          onChange={e => setData({ ...data, businessName: e.target.value })}
          onKeyDown={e => e.key === "Enter" && data.businessName && onNext()}
          placeholder="Ej: Clínica Dental Sonría"
          style={fieldInput}
          onFocus={e => e.target.style.borderColor = "#16A34A"}
          onBlur={e => e.target.style.borderColor = "#E5E7EB"}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={fieldLabel}>Giro o industria</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {BUSINESS_TYPES.map(bt => (
            <button key={bt.value} onClick={() => setData({ ...data, businessType: bt.value })}
              style={{
                padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                background: data.businessType === bt.value ? "#F0FDF4" : "#F9FAFB",
                border: data.businessType === bt.value ? "1.5px solid #16A34A" : "1.5px solid #E5E7EB",
                color: data.businessType === bt.value ? "#15803D" : "#374151",
                fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.15s",
              }}>
              <span>{bt.emoji}</span> {bt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={onNext} disabled={!data.businessName}>Continuar →</Btn>
      </div>
    </div>
  );
}

function Step2({ data, setData, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Servicios y tono
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Tu agente usará esto para responder a tus clientes.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>Servicios o productos que ofreces <span style={{ color: "#EF4444" }}>*</span></label>
        <textarea
          autoFocus
          value={data.services}
          onChange={e => setData({ ...data, services: e.target.value })}
          placeholder="Ej: Consulta general $500, limpieza dental $800. Horario: Lunes a Viernes 9am–7pm."
          rows={4}
          style={fieldTextarea}
          onFocus={e => e.target.style.borderColor = "#16A34A"}
          onBlur={e => e.target.style.borderColor = "#E5E7EB"}
        />
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          Incluye precios, horarios y preguntas frecuentes.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={fieldLabel}>Tono de comunicación</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {TONES.map(t => (
            <button key={t.value} onClick={() => setData({ ...data, tone: t.value })}
              style={{
                padding: "12px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                background: data.tone === t.value ? "#F0FDF4" : "#F9FAFB",
                border: data.tone === t.value ? "1.5px solid #16A34A" : "1.5px solid #E5E7EB",
                color: "#111827", fontFamily: "inherit", transition: "all 0.15s",
              }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{t.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: data.tone === t.value ? "#15803D" : "#111827" }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn secondary onClick={onBack}>← Atrás</Btn>
        <Btn onClick={onNext} disabled={!data.services}>Continuar →</Btn>
      </div>
    </div>
  );
}

function Step3({ data, setData, onNext, onBack }) {
  const [mode, setMode] = useState(data.waMode || "test");
  const pick = (m) => { setMode(m); setData({ ...data, waMode: m }); };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Conecta WhatsApp
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Elige cómo quieres recibir mensajes de tus clientes.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          { id: "test", title: "Número de prueba gratuito", desc: "Listo en segundos. Ideal para empezar.", tag: "Recomendado" },
          { id: "own", title: "Mi propio número", desc: "Requiere cuenta de Meta Business.", tag: "Avanzado" },
        ].map(opt => (
          <button key={opt.id} onClick={() => pick(opt.id)}
            style={{
              padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              background: mode === opt.id ? "#F0FDF4" : "#F9FAFB",
              border: mode === opt.id ? "1.5px solid #16A34A" : "1.5px solid #E5E7EB",
              fontFamily: "inherit", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 14,
            }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${mode === opt.id ? "#16A34A" : "#D1D5DB"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {mode === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{opt.title}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: mode === opt.id ? "#DCFCE7" : "#F3F4F6", color: mode === opt.id ? "#16A34A" : "#6B7280", fontWeight: 600 }}>
                  {opt.tag}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {mode === "test" && (
        <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>📲</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Número asignado: +1 555 669 0045</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Podrás cambiarlo por tu número propio en Configuración.</div>
          </div>
        </div>
      )}

      {mode === "own" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 10, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: "#92400E" }}>
            ⚠️ Necesitas una cuenta activa de Meta Business con WhatsApp Business API habilitada.
          </div>
          <label style={fieldLabel}>Phone Number ID (de Meta)</label>
          <input
            value={data.phoneNumberId || ""}
            onChange={e => setData({ ...data, phoneNumberId: e.target.value })}
            placeholder="Ej: 1155002931023092"
            style={fieldInput}
            onFocus={e => e.target.style.borderColor = "#16A34A"}
            onBlur={e => e.target.style.borderColor = "#E5E7EB"}
          />
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
            Encuéntralo en Meta Developers → tu app → API Setup.
          </p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn secondary onClick={onBack}>← Atrás</Btn>
        <Btn onClick={onNext}>Continuar →</Btn>
      </div>
    </div>
  );
}

function Step4({ data, setData, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Elige tu plan
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Puedes cambiar o cancelar en cualquier momento.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {PLANS.map(plan => (
          <button key={plan.id} onClick={() => setData({ ...data, plan: plan.id })}
            style={{
              padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              background: data.plan === plan.id ? "#F0FDF4" : "#F9FAFB",
              border: data.plan === plan.id ? "1.5px solid #16A34A" : "1.5px solid #E5E7EB",
              fontFamily: "inherit", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
            }}>
            {plan.popular && (
              <span style={{
                position: "absolute", top: -1, right: 16, fontSize: 10,
                background: "#16A34A", color: "#fff", padding: "2px 10px",
                borderRadius: "0 0 8px 8px", fontWeight: 700, letterSpacing: "0.04em",
              }}>MÁS POPULAR</span>
            )}
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${data.plan === plan.id ? "#16A34A" : "#D1D5DB"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {data.plan === plan.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{plan.name}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: data.plan === plan.id ? "#16A34A" : "#111827" }}>{plan.price}</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{plan.period}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                {plan.features.join(" · ")}
              </div>
            </div>
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginBottom: 16 }}>
        Sin tarjeta de crédito para el plan gratuito
      </p>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn secondary onClick={onBack}>← Atrás</Btn>
        <Btn onClick={onNext}>Continuar →</Btn>
      </div>
    </div>
  );
}

function Step5({ data, onFinish, saving }) {
  const planLabel = PLANS.find(p => p.id === data.plan)?.name || "Gratis";
  const toneLabel = TONES.find(t => t.value === data.tone)?.label || data.tone;
  const rows = [
    ["Negocio", data.businessName],
    ["Tipo", BUSINESS_TYPES.find(b => b.value === data.businessType)?.label || "—"],
    ["Tono", toneLabel],
    ["WhatsApp", data.waMode === "own" && data.phoneNumberId ? data.phoneNumberId : "+1 555 669 0045 (prueba)"],
    ["Plan", planLabel],
  ];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        ¡Todo listo! 🎉
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Revisa tu configuración antes de continuar.
      </p>

      <div style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        {rows.map(([label, val], i) => (
          <div key={label} style={{
            display: "flex", gap: 16, padding: "12px 16px",
            borderBottom: i < rows.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <span style={{ fontSize: 13, color: "#6B7280", minWidth: 80 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{val || "—"}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10, padding: "14px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>📲</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>¡Prueba tu bot ahora!</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Envía "Hola" al +1 555 669 0045 en WhatsApp</div>
        </div>
        <a href="https://wa.me/15556690045?text=Hola" target="_blank" rel="noreferrer"
          style={{ padding: "8px 14px", background: "#25D366", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
          Abrir
        </a>
      </div>

      <button onClick={onFinish} disabled={saving}
        style={{
          width: "100%", padding: "13px", borderRadius: 10, border: "none",
          background: saving ? "#D1FAE5" : "#16A34A", color: saving ? "#6B7280" : "#fff",
          fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s",
          boxShadow: saving ? "none" : "0 2px 8px rgba(22,163,74,0.35)",
        }}>
        {saving ? "Guardando..." : "Ir a mi dashboard →"}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    businessName: "", businessType: "", services: "",
    tone: "amigable", waMode: "test", phoneNumberId: "", plan: "free",
  });

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finish = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (e) {}
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 48px" }}>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Agent<span style={{ color: "#16A34A" }}>flow</span></span>
        </a>
        <a href="/sign-in" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>Cerrar sesión</a>
      </div>

      {/* Progress steps */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: i < step ? "#16A34A" : i === step ? "#fff" : "#fff",
                  border: i < step ? "2px solid #16A34A" : i === step ? "2px solid #16A34A" : "2px solid #D1D5DB",
                  color: i < step ? "#fff" : i === step ? "#16A34A" : "#9CA3AF",
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: i === step ? "#16A34A" : i < step ? "#15803D" : "#9CA3AF", whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < step ? "#16A34A" : "#E5E7EB", margin: "0 4px", marginBottom: 16, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 480,
        background: "#fff", border: "1.5px solid #E5E7EB",
        borderRadius: 16, padding: "28px 28px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      }}>
        {step === 0 && <Step1 data={data} setData={setData} onNext={next} />}
        {step === 1 && <Step2 data={data} setData={setData} onNext={next} onBack={back} />}
        {step === 2 && <Step3 data={data} setData={setData} onNext={next} onBack={back} />}
        {step === 3 && <Step4 data={data} setData={setData} onNext={next} onBack={back} />}
        {step === 4 && <Step5 data={data} onFinish={finish} saving={saving} />}
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: "#9CA3AF" }}>
        Agentflow © 2025 · Sin tarjeta de crédito requerida
      </p>
    </div>
  );
}
