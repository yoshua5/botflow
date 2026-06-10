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
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError("La contrasena debe tener minimo 6 caracteres."); return; }
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
    else setError("Cuenta creada. Inicia sesion manualmente.");
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
    { icon: "Robot", text: "Agentes de IA en minutos" },
    { icon: "Phone", text: "Integracion con WhatsApp" },
    { icon: "Chart", text: "Analytics en tiempo real" },
    { icon: "Lock",  text: "Datos seguros y protegidos" },
  ];

  const pwLen = form.password.length;
  const pwStrength = pwLen >= 12 ? "Fuerte" : pwLen >= 6 ? "Media" : "Debil";
  const pwColor    = pwLen >= 12 ? "#10B981" : pwLen >= 6 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <div style={{ flex: 1, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", minWidth: 0 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.07)" }}>
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
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Sin tarjeta de credito - Plan FREE incluido</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Nombre completo</label>
                <input type="text" value={form.name} onChange={set("name")} placeholder="Juan Perez" style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Correo electronico</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="tu@email.com" required style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Contrasena</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                    placeholder="Minimo 6 caracteres" required style={{ ...inputBase, paddingRight: 42 }}
                    onFocus={onFocus} onBlur={onBlur} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94A3B8", padding: 0,
                  }}>{showPw ? "Hide" : "Show"}</button>
                </div>
                {pwLen > 0 && (
                  <div style={{ marginTop: 6, display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: pwLen > i * 3 ? pwColor : "#E2E8F0",
                        transition: "background 0.2s",
                      }} />
                    ))}
                    <span style={{ fontSize: 11, color: pwColor, marginLeft: 4, whiteSpace: "nowrap" }}>{pwStrength}</span>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 8, fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 4, padding: "13px", background: loading ? "#93C5FD" : "#2563EB",
                color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s",
                boxShadow: loading ? "none" : "0 3px 10px rgba(37,99,235,0.3)",
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1D4ED8"; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#2563EB"; }}>
                {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
              </button>

              <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", margin: "2px 0 0" }}>
                Al registrarte aceptas nuestros Terminos y Privacidad
              </p>
            </form>
          </div>
          <p style={{ marginTop: 18, textAlign: "center", color: "#64748B", fontSize: 13 }}>
            Ya tienes cuenta?{" "}
            <a href="/sign-in" style={{ color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>Iniciar sesion</a>
          </p>
        </div>
      </div>

      <div style={{
        flex: 1, background: "linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 56px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "10%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "5%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.35)", borderRadius: 20, marginBottom: 28 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22D3EE", boxShadow: "0 0 8px #22D3EE" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#93C5FD" }}>Plataforma de IA para negocios</span>
          </div>

          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Automatiza tu atencion al cliente con agentes IA
          </h2>

          <p style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.65, margin: "0 0 36px" }}>
            Crea agentes inteligentes en minutos. Sin codigo, sin complicaciones. Disponibles 24/7 en WhatsApp y mas canales.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, color: "#93C5FD", fontWeight: 700 }}>
                  {f.icon.charAt(0)}
                </div>
                <span style={{ fontSize: 14, color: "#CBD5E1", fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 28 }}>
            {[["500+", "Empresas"], ["98%", "Satisfaccion"], ["24/7", "Disponible"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#60A5FA", letterSpacing: "-0.02em" }}>{n}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
