"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

function AgentLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="#0F172A"/>
      <path d="M18 6L26 26H10L18 6Z" fill="url(#lg3)" opacity="0.95"/>
      <ellipse cx="15" cy="23" rx="5" ry="4" fill="none" stroke="#22D3EE" strokeWidth="1.8"/>
      <circle cx="13.5" cy="23" r="0.8" fill="#22D3EE"/>
      <circle cx="15.5" cy="23" r="0.8" fill="#22D3EE"/>
      <line x1="22" y1="18" x2="27" y2="18" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="22" y1="21" x2="26" y2="21" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="22" y1="24" x2="25" y2="24" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="lg3" x1="18" y1="6" x2="18" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF"/>
          <stop offset="1" stopColor="#93C5FD"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm]   = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError("La contraseña debe tener mínimo 6 caracteres."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error al crear cuenta."); setLoading(false); return; }
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (result?.ok) router.push("/onboarding");
    else setError("Cuenta creada. Inicia sesión manualmente.");
  };

  const inputBase = {
    width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0",
    borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none",
    fontFamily: "inherit", background: "#FAFBFF", boxSizing: "border-box",
    transition: "all 0.15s",
  };
  const onFocus = e => { e.target.style.borderColor = "#93C5FD"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; e.target.style.background = "#fff"; };
  const onBlur  = e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#FAFBFF"; };

  const FEATURES = [
    { icon: "🤖", text: "Agentes de IA en minutos" },
    { icon: "📱", text: "Integración con WhatsApp" },
    { icon: "📊", text: "Analytics en tiempo real" },
    { icon: "🔒", text: "Datos seguros y protegidos" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Geist', system-ui, -apple-system, sans-serif" }}>

      {/* ── Left: Form ── */}
      <div style={{ flex: 1, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", minWidth: 0 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.07)" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
              <AgentLogo size={38} />
              <span style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>
                Agent<span style={{ color: "#2563EB" }}>Flow</span>
              </span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Crea tu cuenta gratis
              </h1>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Sin tarjeta de crédito · Plan FREE incluido</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Nombre completo</label>
                <input type="text" value={form.name} onChange={set("name")} placeholder="Juan Pérez" style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>
              {/* Email */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="tu@email.com" required style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>
              {/* Password */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                    placeholder="Mínimo 6 caracteres" required style={{ ...inputBase, paddingRight: 42 }}
                    onFocus={onFocus} onBlur={onBlur} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94A3B8", padding: 0,
                  }}>{showPw ? "🙈" : "👁"}</button>
                </div>
                {/* Strength hint */}
                {form.password.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: form.password.length > i * 3 ? (form.password.length >= 12 ? "#10B981" : form.password.length >= 6 ? "#F59E0B" : "#EF4444") : "#E2E8F0",
             