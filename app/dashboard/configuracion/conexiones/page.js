"use client";
import { useState, useEffect, useRef } from "react";

const BL = "#2563EB", BLL = "#EFF6FF", TX = "#0F172A", MT = "#64748B", WH = "#FFFFFF";
const BD = "#E2E8F0", GR = "#10B981", GRL = "#ECFDF5", RD = "#EF4444", RDL = "#FEF2F2";
const YL = "#F59E0B", YLL = "#FFFBEB", SL = "#F8FAFC";

function Card({ children, style = {} }) {
  return <div style={{ background: WH, borderRadius: 16, border: `1px solid ${BD}`, padding: "28px 32px", ...style }}>{children}</div>;
}
function Badge({ status }) {
  const cfg = {
    connected:    { bg: GRL, color: GR,  dot: GR,  label: "Conectado" },
    disconnected: { bg: RDL, color: RD,  dot: RD,  label: "Desconectado" },
    pending:      { bg: YLL, color: YL,  dot: YL,  label: "Pendiente" },
  }[status] || { bg: "#F1F5F9", color: MT, dot: MT, label: "Desconocido" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: cfg.bg, fontSize: 12, fontWeight: 700, color: cfg.color }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function StepWizard({ onDone, onCancel }) {
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState({ phoneId: "", token: "", verifyToken: "" });
  const [saving, setSaving] = useState(false);

  const steps = [
    { n: 1, title: "Configura tu App de Meta" },
    { n: 2, title: "Ingresa tus credenciales" },
    { n: 3, title: "Confirmar conexión" },
  ];

  async function connect() {
    if (!fields.phoneId || !fields.token) { alert("Completa todos los campos"); return; }
    setSaving(true);
    const r = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumberId: fields.phoneId, accessToken: fields.token, verifyToken: fields.verifyToken || "botflow_verify" }) });
    if (r.ok) { onDone(); } else { alert("Error al guardar. Verifica tus credenciales."); setSaving(false); }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", gap: 0, marginBottom: 32, position: "relative" }}>
        <div style={{ position: "absolute", top: 16, left: "8%", right: "8%", height: 2, background: BD, zIndex: 0 }} />
        {steps.map(s => (
          <div key={s.n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= s.n ? BL : WH, border: `2px solid ${step >= s.n ? BL : BD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: step >= s.n ? WH : MT, transition: "all 0.2s" }}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span style={{ fontSize: 12, color: step >= s.n ? BL : MT, fontWeight: step === s.n ? 700 : 400, textAlign: "center" }}>{s.title}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: TX }}>Paso 1: Configura tu App de Meta</h3>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: TX, lineHeight: 1.6 }}>
            <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: BL }}>developers.facebook.com</a> e inicia sesión.</li>
            <li>Crea o selecciona una app de tipo <strong>Business</strong>.</li>
            <li>En el panel izquierdo, selecciona <strong>WhatsApp → Configuración</strong>.</li>
            <li>Agrega un número de teléfono de prueba o uno verificado de negocio.</li>
            <li>Copia tu <strong>Phone Number ID</strong> y <strong>Access Token</strong> (permanente).</li>
            <li>Configura el Webhook con la URL: <code style={{ background: SL, padding: "2px 6px", borderRadius: 4, fontSize: 12, color: TX }}>https://botflow-nine.vercel.app/api/webhook</code></li>
          </ol>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button onClick={() => setStep(2)} style={{ padding: "10px 24px", background: BL, color: WH, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Siguiente →</button>
            <button onClick={onCancel} style={{ padding: "10px 20px", background: "none", border: `1.5px solid ${BD}`, borderRadius: 10, fontSize: 14, color: MT, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: TX }}>Paso 2: Ingresa tus credenciales</h3>
          {[
            { key: "phoneId", label: "Phone Number ID", ph: "Ej: 1234567890123456", hint: "Lo encuentras en WhatsApp → Configuración → Phone Number ID" },
            { key: "token",   label: "Access Token (permanente)", ph: "EAAxxxxx...", hint: "Usa un token permanente, no temporal, para evitar desconexiones" },
            { key: "verifyToken", label: "Verify Token (opcional)", ph: "botflow_verify", hint: "Token personalizado para verificar el webhook" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>{f.label}</label>
              <input value={fields[f.key]} onChange={e => setFields(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.ph}
                style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${BD}`, borderRadius: 10, fontSize: 14, color: TX, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "#93C5FD"} onBlur={e => e.target.style.borderColor = BD}
              />
              <p style={{ margin: "5px 0 0", fontSize: 12, color: MT }}>{f.hint}</p>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => setStep(1)} style={{ padding: "10px 20px", background: "none", border: `1.5px solid ${BD}`, borderRadius: 10, fontSize: 14, color: MT, cursor: "pointer" }}>← Atrás</button>
            <button onClick={() => { if (!fields.phoneId || !fields.token) { alert("Phone ID y Token son requeridos"); return; } setStep(3); }} style={{ padding: "10px 24px", background: BL, color: WH, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Siguiente →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: TX }}>Paso 3: Confirmar conexión</h3>
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {[["Phone Number ID", fields.phoneId], ["Access Token", fields.token.substring(0, 12) + "•••••••"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: MT }}>{k}</span>
                <span style={{ fontWeight: 600, color: TX, fontFamily: "monospace" }}>{v || "—"}</span>
              </div>
            ))}
          </div>
          <div style={{ background: GRL, border: `1px solid ${GR}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#065F46" }}>
            ✅ Tu bot comenzará a responder mensajes en WhatsApp inmediatamente después de conectar.
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setStep(2)} style={{ padding: "10px 20px", background: "none", border: `1.5px solid ${BD}`, borderRadius: 10, fontSize: 14, color: MT, cursor: "pointer" }}>← Atrás</button>
            <button onClick={connect} disabled={saving} style={{ padding: "10px 28px", background: GR, color: WH, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "⏳ Conectando..." : "✅ Conectar WhatsApp"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WaProfileCard({ connected }) {
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imgData, setImgData] = useState(null);

  useEffect(() => {
    if (!connected) return;
    fetch("/api/whatsapp/profile")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setProfile(d); });
  }, [connected]);

  function onFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Solo imágenes (JPG, PNG)"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Máximo 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target.result;
      setPreview(result);
      const base64 = result.split(",")[1];
      setImgData({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }

  async function savePhoto() {
    if (!imgData) return;
    setUploading(true);
    const r = await fetch("/api/whatsapp/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: imgData.base64, mimeType: imgData.mimeType }),
    });
    const d = await r.json();
    setUploading(false);
    if (r.ok) {
      alert("✅ Foto de perfil actualizada en WhatsApp");
      setPreview(null);
      setImgData(null);
      // Reload profile
      fetch("/api/whatsapp/profile").then(r2 => r2.ok ? r2.json() : null).then(d2 => { if (d2 && !d2.error) setProfile(d2); });
    } else {
      alert("❌ " + (d.error || "Error desconocido"));
    }
  }

  if (!connected) return null;

  const currentPic = preview || profile?.profile_picture_url;

  return (
    <Card style={{ marginTop: 20 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: TX }}>Perfil de WhatsApp</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: MT }}>Cambia la foto de perfil que ven tus clientes en WhatsApp.</p>
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        {/* Avatar */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ width: 96, height: 96, borderRadius: "50%", background: currentPic ? "transparent" : "#25D366", border: `3px dashed ${preview ? BL : BD}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative", transition: "border-color 0.2s" }}
          title="Haz clic para cambiar la foto"
        >
          {currentPic
            ? <img src={currentPic} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 36 }}>💬</span>
          }
          <div style={{ position: "absolute", bottom: 0, right: 0, background: BL, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✏️</div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={onFile} />

        <div style={{ flex: 1 }}>
          {preview && (
            <div style={{ background: BLL, border: `1px solid #BFDBFE`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: BL }}>
              Nueva foto seleccionada. Haz clic en Guardar para aplicarla.
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => fileRef.current?.click()} style={{ padding: "9px 18px", background: SL, border: `1.5px solid ${BD}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: TX, cursor: "pointer" }}>
              🖼️ Elegir foto
            </button>
            {preview && (
              <>
                <button onClick={savePhoto} disabled={uploading} style={{ padding: "9px 20px", background: GR, color: WH, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? "⏳ Subiendo..." : "💾 Guardar foto"}
                </button>
                <button onClick={() => { setPreview(null); setImgData(null); }} style={{ padding: "9px 14px", background: RDL, color: RD, border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                  ✕ Cancelar
                </button>
              </>
            )}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: MT }}>JPG o PNG · Máx. 5 MB · Recomendado: 640×640 px</p>
        </div>
      </div>
    </Card>
  );
}

export default function ConexionesPage() {
  const [bot, setBot] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bots").then(r => r.json()).then(d => {
      const bots = d.bots || [];
      setBot(bots[0] || null);
      setLoading(false);
    });
  }, []);

  const waStatus = bot?.phoneNumberId ? "connected" : "disconnected";

  async function disconnect() {
    if (!confirm("¿Desconectar WhatsApp? El bot dejará de responder.")) return;
    setDisconnecting(true);
    await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumberId: "", accessToken: "" }) });
    setBot(b => ({ ...b, phoneNumberId: null, displayPhone: null }));
    setDisconnecting(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: TX }}>Conexiones</h1>
        <p style={{ margin: "6px 0 0", color: MT, fontSize: 14 }}>Gestiona las integraciones de tu bot con plataformas externas.</p>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>💬</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TX }}>WhatsApp Business</h2>
                {!loading && <Badge status={waStatus} />}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: MT, maxWidth: 480 }}>
                Conecta tu cuenta de WhatsApp Business a través de la API de Meta para enviar y recibir mensajes con tu bot.
              </p>
              {bot?.phoneNumberId && (
                <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 13 }}>
                  <span style={{ color: MT }}>📞 Número: <strong style={{ color: TX }}>{bot.displayPhone || bot.phoneNumberId}</strong></span>
                  <span style={{ color: MT }}>🆔 Phone ID: <strong style={{ color: TX, fontFamily: "monospace" }}>{bot.phoneNumberId}</strong></span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button onClick={() => setShowWizard(w => !w)} style={{ padding: "9px 18px", background: BLL, color: BL, border: `1.5px solid #BFDBFE`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {showWizard ? "✕ Cerrar" : "⚙️ Configurar"}
            </button>
            {bot?.phoneNumberId && (
              <button onClick={disconnect} disabled={disconnecting} style={{ padding: "9px 18px", background: RDL, color: RD, border: `1.5px solid #FECACA`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: disconnecting ? "wait" : "pointer" }}>
                {disconnecting ? "..." : "🔌 Desconectar"}
              </button>
            )}
          </div>
        </div>

        {showWizard && (
          <StepWizard
            onDone={() => { setShowWizard(false); window.location.reload(); }}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </Card>

      <WaProfileCard connected={!!bot?.phoneNumberId} />

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {[
          { icon: "📅", name: "Google Calendar", desc: "Sincroniza citas automáticamente", soon: true },
          { icon: "📊", name: "Google Sheets", desc: "Exporta conversaciones y datos", soon: true },
          { icon: "🛒", name: "Shopify", desc: "Conecta tu tienda en línea", soon: true },
        ].map(item => (
          <div key={item.name} style={{ background: WH, borderRadius: 14, border: `1px solid ${BD}`, padding: "20px", opacity: 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TX }}>{item.name}</div>
                {item.soon && <span style={{ fontSize: 11, background: YLL, color: YL, borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>Próximamente</span>}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: MT }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
