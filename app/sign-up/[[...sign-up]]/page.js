"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", business: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
    } else if (result?.ok) {
      router.push("/onboarding");
    }
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px", background: "#1a1a2e",
    border: "1.5px solid #2d2d4e", borderRadius: "10px",
    fontSize: "14px", color: "#fff", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d1a", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* LEFT — Form */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "48px 40px", maxWidth: 540,
      }}>
        {/* Logo */}
        <div style={{ width: "100%", maxWidth: 420, marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Bot<span style={{ color: "#f97316" }}>flow</span>
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Crear Cuenta</h1>
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px" }}>Comienza tu prueba gratis</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 7, fontSize: 13, fontWeight: 600, color: "#ccc" }}>Nombre Completo</label>
              <input type="text" value={form.name} onChange={set("name")} placeholder="Juan Pérez"
                style={inputStyle} onFocus={e => e.target.style.borderColor="#f97316"} onBlur={e => e.target.style.borderColor="#2d2d4e"} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 7, fontSize: 13, fontWeight: 600, color: "#ccc" }}>Nombre del Comercio</label>
              <input type="text" value={form.business} onChange={set("business")} placeholder="Ej: Pizza Hut"
                style={inputStyle} onFocus={e => e.target.style.borderColor="#f97316"} onBlur={e => e.target.style.borderColor="#2d2d4e"} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 7, fontSize: 13, fontWeight: 600, color: "#ccc" }}>Número de Teléfono</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...inputStyle, width: "auto", padding: "13px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, cursor: "default" }}>
                  <span>🇺🇸</span><span style={{ color: "#888", fontSize: 13 }}>+1</span>
                </div>
                <input type="tel" value={form.phone} onChange={set("phone")} placeholder="(201) 555-0123"
                  style={{ ...inputStyle, flex: 1 }} onFocus={e => e.target.style.borderColor="#f97316"} onBlur={e => e.target.style.borderColor="#2d2d4e"} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 7, fontSize: 13, fontWeight: 600, color: "#ccc" }}>Email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="tu@email.com" required
                style={inputStyle} onFocus={e => e.target.style.borderColor="#f97316"} onBlur={e => e.target.style.borderColor="#2d2d4e"} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>Contraseña</label>
                <a href="/sign-in" style={{ fontSize: 12, color: "#f97316", textDecoration: "none" }}>¿Olvidaste tu contraseña?</a>
              </div>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••••••" required
                style={inputStyle} onFocus={e => e.target.style.borderColor="#f97316"} onBlur={e => e.target.style.borderColor="#2d2d4e"} />
            </div>

            {error && (
              <div style={{ padding: "11px 14px", background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171", borderRadius: 8, fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: "14px", background: loading ? "#c2580a" : "#f97316",
              color: "white", border: "none", borderRadius: "10px",
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.2s",
            }}>
              {loading ? "Creando cuenta..." : <>Registrarse <span>→</span></>}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center", color: "#666", fontSize: 13 }}>
            ¿Ya tienes cuenta?{" "}
            <a href="/sign-in" style={{ color: "#f97316", fontWeight: 600, textDecoration: "none" }}>Iniciar sesión</a>
          </p>
        </div>
      </div>

      {/* RIGHT — Marketing */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        background: "linear-gradient(135deg, #1a0a2e 0%, #0d0d1a 50%, #0a1a2e 100%)",
        padding: "48px 56px", position: "relative", overflow: "hidden",
      }}>
        {/* Glow effects */}
        <div style={{ position: "absolute", top: "20%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 20, marginBottom: 28 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f97316" }}>Agente IA</span>
          </div>

          <h2 style={{ fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
            Convierte conversaciones en{" "}
            <span style={{ color: "#f97316" }}>ventas automáticamente</span>
          </h2>

          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.6, margin: "0 0 36px" }}>
            Únete a cientos de empresas que ya automatizan su atención al cliente en WhatsApp e Instagram con Botflow.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            {[["500+", "Empresas"], ["98%", "Satisfacción"], ["24/7", "Disponible"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316" }}>{n}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
