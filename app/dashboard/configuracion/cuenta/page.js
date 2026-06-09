"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const BL = "#2563EB", BLL = "#EFF6FF", TX = "#0F172A", MT = "#64748B", WH = "#FFFFFF";
const BD = "#E2E8F0", SL = "#F8FAFC", GR = "#10B981", RD = "#EF4444";

function Card({ children, style = {} }) {
  return (
    <div style={{ background: WH, borderRadius: 16, border: `1px solid ${BD}`, padding: "28px 32px", ...style }}>
      {children}
    </div>
  );
}
function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TX }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: "0 0 0 30px", fontSize: 13, color: MT }}>{subtitle}</p>}
    </div>
  );
}
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "6px 0 0", fontSize: 12, color: MT }}>{hint}</p>}
    </div>
  );
}
function Input({ value, onChange, placeholder, type = "text", disabled }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ position: "relative" }}>
      <input
        type={isPass && !show ? "password" : "text"}
        value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{
          width: "100%", padding: "10px 14px", paddingRight: isPass ? 42 : 14,
          border: `1.5px solid ${BD}`, borderRadius: 10, fontSize: 14, color: TX,
          background: disabled ? SL : WH, outline: "none", boxSizing: "border-box",
          fontFamily: "inherit", transition: "border-color 0.2s",
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = "#93C5FD"; }}
        onBlur={e => e.target.style.borderColor = BD}
      />
      {isPass && (
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MT, fontSize: 16 }}>
          {show ? "🙈" : "👁️"}
        </button>
      )}
    </div>
  );
}
function SaveBtn({ loading, saved, onClick, label = "Guardar cambios" }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{
        padding: "10px 24px", background: saved ? GR : BL, color: WH,
        border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
        cursor: loading ? "wait" : "pointer", transition: "all 0.2s",
        display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1,
      }}>
      {loading ? "⏳ Guardando..." : saved ? "✅ Guardado" : label}
    </button>
  );
}

export default function CuentaPage() {
  const { data: session } = useSession();
  const [biz, setBiz] = useState({ businessName: "", siteName: "", website: "", faviconBase64: "", faviconMimeType: "" });
  const [user, setUser] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [plan, setPlan] = useState(null);
  const [savingBiz, setSavingBiz] = useState(false), [savedBiz, setSavedBiz] = useState(false);
  const [savingUser, setSavingUser] = useState(false), [savedUser, setSavedUser] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!session) return;
    setUser(u => ({ ...u, name: session.user?.name || "", email: session.user?.email || "" }));
    fetch("/api/config").then(r => r.json()).then(cfg => {
      setBiz({ businessName: cfg.businessName || "", siteName: cfg.siteName || "", website: cfg.website || "", faviconBase64: cfg.faviconBase64 || "", faviconMimeType: cfg.faviconMimeType || "" });
      if (cfg.faviconBase64) setLogoPreview(`data:${cfg.faviconMimeType || "image/png"};base64,${cfg.faviconBase64}`);
    });
    fetch("/api/subscription").then(r => r.json()).then(d => { setPlan(d); setLoadingPlan(false); });
  }, [session]);

  function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(",")[1];
      const mime = file.type;
      setLogoPreview(dataUrl);
      setBiz(b => ({ ...b, faviconBase64: base64, faviconMimeType: mime }));
    };
    reader.readAsDataURL(file);
  }

  async function saveBiz() {
    setSavingBiz(true); setSavedBiz(false);
    await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: biz.businessName, siteName: biz.siteName || biz.businessName, website: biz.website, faviconBase64: biz.faviconBase64, faviconMimeType: biz.faviconMimeType }) });
    setSavingBiz(false); setSavedBiz(true); setTimeout(() => setSavedBiz(false), 3000);
  }

  async function saveUser() {
    if (user.password && user.password !== user.confirmPassword) { alert("Las contraseñas no coinciden"); return; }
    if (user.password && user.password.length < 6) { alert("La contraseña debe tener al menos 6 caracteres"); return; }
    setSavingUser(true); setSavedUser(false);
    const body = { name: user.name };
    if (user.password) body.password = user.password;
    const r = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { alert(d.error || "Error al guardar"); setSavingUser(false); return; }
    setSavingUser(false); setSavedUser(true); setUser(u => ({ ...u, password: "", confirmPassword: "" }));
    setTimeout(() => setSavedUser(false), 3000);
  }

  const renewDate = plan?.currentPeriodEnd ? new Date(plan.currentPeriodEnd * 1000).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const statusColor = plan?.status === "active" ? GR : plan?.status === "trialing" ? "#F59E0B" : MT;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: TX }}>Cuenta</h1>
        <p style={{ margin: "6px 0 0", color: MT, fontSize: 14 }}>Gestiona tu información personal, de negocio y tu plan.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Business info */}
          <Card>
            <SectionTitle icon="🏢" title="Información del Negocio" subtitle="Estos datos aparecerán en el perfil de tu agente." />
            <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 80, height: 80, borderRadius: 16, border: `2px dashed ${BD}`, background: SL, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                  {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28 }}>🖼️</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
                <button onClick={() => fileRef.current?.click()} style={{ marginTop: 8, fontSize: 12, color: BL, background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "block", textAlign: "center" }}>Subir logo</button>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Nombre del negocio">
                  <Input value={biz.businessName} onChange={e => setBiz(b => ({ ...b, businessName: e.target.value }))} placeholder="Ej: Mi Empresa S.A." />
                </Field>
                <Field label="Nombre de la app / plataforma" hint="Aparece en el navegador y en el sidebar.">
                  <Input value={biz.siteName} onChange={e => setBiz(b => ({ ...b, siteName: e.target.value }))} placeholder="Ej: Agentflow" />
                </Field>
                <Field label="Sitio web">
                  <Input value={biz.website} onChange={e => setBiz(b => ({ ...b, website: e.target.value }))} placeholder="https://miempresa.com" />
                </Field>
              </div>
            </div>
            <SaveBtn loading={savingBiz} saved={savedBiz} onClick={saveBiz} />
          </Card>

          {/* User info */}
          <Card>
            <SectionTitle icon="👤" title="Información del Usuario" subtitle="Actualiza tu nombre y contraseña de acceso." />
            <Field label="Nombre completo">
              <Input value={user.name} onChange={e => setUser(u => ({ ...u, name: e.target.value }))} placeholder="Tu nombre" />
            </Field>
            <Field label="Correo electrónico" hint="Para cambiar el correo contacta soporte.">
              <Input value={user.email} disabled />
            </Field>
            <div style={{ borderTop: `1px solid ${BD}`, margin: "20px 0" }} />
            <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: TX }}>Cambiar contraseña</p>
            <Field label="Nueva contraseña">
              <Input value={user.password} onChange={e => setUser(u => ({ ...u, password: e.target.value }))} placeholder="Mínimo 6 caracteres" type="password" />
            </Field>
            <Field label="Confirmar contraseña">
              <Input value={user.confirmPassword} onChange={e => setUser(u => ({ ...u, confirmPassword: e.target.value }))} placeholder="Repetir contraseña" type="password" />
            </Field>
            <SaveBtn loading={savingUser} saved={savedUser} onClick={saveUser} />
          </Card>
        </div>

        {/* Right column — Plan card */}
        <div>
          <Card style={{ position: "sticky", top: 24 }}>
            <SectionTitle icon="💳" title="Plan actual" />
            {loadingPlan ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: MT }}>Cargando...</div>
            ) : (
              <>
                <div style={{ background: BLL, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: BL, marginBottom: 4 }}>{plan?.planName || "Free"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: statusColor, fontWeight: 600, textTransform: "capitalize" }}>{plan?.status === "active" ? "Activo" : plan?.status === "trialing" ? "Prueba" : "Inactivo"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {[
                    ["📅", "Renovación", renewDate],
                    ["🤖", "Bots incluidos", plan?.limits?.bots ?? "—"],
                    ["💬", "Conversaciones / mes", plan?.limits?.messagesPerMonth?.toLocaleString() ?? "—"],
                    ["💵", "Monto", plan?.amount ? `$${(plan.amount / 100).toFixed(2)} ${(plan.currency || "usd").toUpperCase()}` : "Gratis"],
                  ].map(([ico, lbl, val]) => (
                    <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: MT }}>{ico} {lbl}</span>
                      <span style={{ fontWeight: 600, color: TX }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href="/dashboard/pricing" style={{ display: "block", textAlign: "center", padding: "11px", background: BL, color: WH, borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                    ⚡ Actualizar Plan
                  </a>
                  {plan?.status === "active" && (
                    <button onClick={async () => {
                      if (!confirm("¿Cancelar tu plan? Seguirás teniendo acceso hasta el fin del período.")) return;
                      const r = await fetch("/api/subscription/cancel", { method: "POST" });
                      const d = await r.json();
                      if (d.success) { alert("Plan cancelado. Sigue activo hasta " + renewDate); }
                    }} style={{ padding: "10px", background: "none", border: `1.5px solid ${BD}`, borderRadius: 10, color: RD, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      Cancelar Plan
                    </button>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
