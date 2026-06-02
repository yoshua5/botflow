"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const DEFAULTS = {
  heroTitle: "Crea tu Bot de WhatsApp con el poder de la IA",
  heroDesc: "Solo describe tu idea y nuestra IA se encarga del resto. Sin código, sin complicaciones.",
  plan1Name: "Starter",  plan1Price: "Gratis", plan1Desc: "Para probar y lanzar tu primer bot",
  plan2Name: "Pro",      plan2Price: "$29",    plan2Desc: "Para negocios en crecimiento",
  plan3Name: "Business", plan3Price: "$79",    plan3Desc: "Para equipos y agencias",
  plan1Features: ["1 bot activo","500 mensajes/mes","Soporte por email","Plantillas básicas"],
  plan2Features: ["5 bots activos","10,000 mensajes/mes","Soporte prioritario","Analíticas avanzadas","Integraciones CRM"],
  plan3Features: ["Bots ilimitados","Mensajes ilimitados","Soporte dedicado","API personalizada","White label"],
};

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [data, setData]     = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (email !== "yoshualeisorek17@gmail.com") {
        router.push("/dashboard");
      } else {
        fetch("/api/landing").then(r => r.json()).then(res => {
          if (res && Object.keys(res).length > 0) setData({ ...DEFAULTS, ...res });
        });
      }
    }
  }, [isLoaded, user, router]);

  const set = (field, value) => setData(d => ({ ...d, [field]: value }));

  const save = async () => {
    setSaving(true);
    await fetch("/api/landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Reusable input components ──────────────────────────
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box",
    border: "2px solid #CBD5E1", fontSize: 14, color: "#0F172A", background: "#FFFFFF",
    outline: "none", fontFamily: "inherit",
  };

  const Field = ({ label, field, multiline }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>{label}</label>
      {multiline
        ? <textarea value={data[field]} onChange={e => set(field, e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
        : <input    value={data[field]} onChange={e => set(field, e.target.value)} style={inputStyle} />}
    </div>
  );

  // ── Feature bullet editor ──────────────────────────────
  const FeaturesEditor = ({ planKey }) => {
    const features = data[planKey] || [];

    const updateItem = (i, val) => {
      const updated = features.map((f, idx) => idx === i ? val : f);
      set(planKey, updated);
    };
    const removeItem = (i) => set(planKey, features.filter((_, idx) => idx !== i));
    const addItem    = ()   => set(planKey, [...features, ""]);

    return (
      <div style={{ marginTop: 4 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>
          ✓ Bullet Points
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "#2563EB", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
              <input
                value={f}
                onChange={e => updateItem(i, e.target.value)}
                placeholder={`Beneficio ${i + 1}`}
                style={{ ...inputStyle, flex: 1, padding: "8px 10px" }}
              />
              <button
                onClick={() => removeItem(i)}
                title="Eliminar"
                style={{
                  width: 30, height: 30, border: "none", borderRadius: 6,
                  background: "#FEE2E2", color: "#DC2626", cursor: "pointer",
                  fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >×</button>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          style={{
            marginTop: 10, padding: "7px 14px", background: "#EFF6FF",
            border: "1.5px dashed #93C5FD", borderRadius: 8, color: "#2563EB",
            fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%",
          }}
        >
          + Añadir bullet
        </button>
      </div>
    );
  };

  if (!isLoaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", fontSize: 16, color: "#64748B" }}>
      Verificando acceso...
    </div>
  );

  const plans = [
    { label: "Plan 1 — Gratuito",  nameF:"plan1Name", priceF:"plan1Price", descF:"plan1Desc", featF:"plan1Features", accent:"#F8FAFF", border:"#CBD5E1" },
    { label: "Plan 2 — Pro ⭐",    nameF:"plan2Name", priceF:"plan2Price", descF:"plan2Desc", featF:"plan2Features", accent:"#EFF6FF", border:"#93C5FD" },
    { label: "Plan 3 — Business",  nameF:"plan3Name", priceF:"plan3Price", descF:"plan3Desc", featF:"plan3Features", accent:"#F8FAFF", border:"#CBD5E1" },
  ];

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              boxShadow: "0 4px 12px rgba(124,58,237,0.35)",
            }}>👑</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
              Super Admin
            </h1>
          </div>
          <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
            Edita textos, precios y bullets de la Landing Page. Los cambios se aplican al instante.
          </p>
        </div>
        <button
          onClick={save} disabled={saving}
          style={{
            padding: "11px 28px",
            background: saved ? "#16A34A" : "linear-gradient(135deg,#2563EB,#1D4ED8)",
            color: "#FFF", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
            transition: "all 0.3s", whiteSpace: "nowrap",
          }}
        >
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar Cambios"}
        </button>
      </div>

      {/* Hero Section */}
      <div style={{ background: "#FFF", borderRadius: 16, padding: "28px 28px 20px", border: "1.5px solid #E2E8F0", marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>🖼️</span>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>Hero Section (Inicio)</h2>
        </div>
        <Field label="Título Principal" field="heroTitle" />
        <Field label="Descripción Corta" field="heroDesc" multiline />
      </div>

      {/* Pricing Section */}
      <div style={{ background: "#FFF", borderRadius: 16, padding: "28px 28px 28px", border: "1.5px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>💰</span>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>Precios y Planes</h2>
        </div>
        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 24, marginTop: 0 }}>
          Precios visibles al público. Los bullets se muestran como checkmarks en la tarjeta.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {plans.map(p => (
            <div key={p.label} style={{ background: p.accent, borderRadius: 12, padding: "16px 14px", border: `2px solid ${p.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                {p.label}
              </div>
              <Field label="Nombre"      field={p.nameF}  />
              <Field label="Precio"      field={p.priceF} />
              <Field label="Descripción" field={p.descF} multiline />
              <FeaturesEditor planKey={p.featF} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
