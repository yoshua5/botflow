"use client";
import { useState } from "react";

const STEPS = [
  {
    num: "01",
    icon: "📱",
    title: "Crea una cuenta en Meta Business",
    desc: "Ve a business.facebook.com y crea una cuenta gratuita con tu correo. Solo necesitas unos minutos.",
    link: { label: "Ir a Meta Business →", url: "https://business.facebook.com" },
  },
  {
    num: "02",
    icon: "✅",
    title: "Activa WhatsApp Business API",
    desc: "Dentro de Meta Business, ve a \"Configuración\" → \"WhatsApp\" → \"Empezar\". Agrega tu número de teléfono y verifícalo con un código SMS.",
    tip: "Usa un número que NO tenga WhatsApp instalado actualmente.",
  },
  {
    num: "03",
    icon: "🔑",
    title: "Obtén tu Token de acceso",
    desc: "En Meta for Developers (developers.facebook.com), crea una app, agrega el producto \"WhatsApp\" y copia tu Token de acceso permanente.",
    link: { label: "Ir a Meta for Developers →", url: "https://developers.facebook.com" },
  },
  {
    num: "04",
    icon: "🤖",
    title: "Pégalo en Botflow",
    desc: "Vuelve a tu panel de Botflow, pega el token y el Phone Number ID. Nosotros conectamos todo automáticamente.",
    tip: "El Phone Number ID lo encuentras en la sección de WhatsApp de tu app en Meta.",
  },
];

export default function Conectar() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText("https://botflow.app/conectar");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "system-ui, sans-serif", padding: "0 24px 80px" }}>

      {/* Navbar */}
      <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 28, paddingBottom: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💬</div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", color: "#fff" }}>Bot<span style={{ color: "#75ff9e" }}>flow</span></span>
        </a>
        <a href="/onboarding" style={{ fontSize: 13, color: "rgba(220,228,224,0.45)", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color = "#75ff9e"} onMouseLeave={e => e.target.style.color = "rgba(220,228,224,0.45)"}>
          ← Volver al onboarding
        </a>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 56 }}>

        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: "rgba(117,255,158,0.07)", border: "1px solid rgba(117,255,158,0.18)", marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#75ff9e", letterSpacing: "0.1em", textTransform: "uppercase" }}>Guía de conexión</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
            Conecta tu{" "}
            <span style={{ background: "linear-gradient(135deg,#25D366,#75ff9e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              WhatsApp Business
            </span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(220,228,224,0.55)", lineHeight: 1.7, maxWidth: 540 }}>
            Sigue estos 4 pasos para conectar tu número de WhatsApp a tu agente de IA. Todo es gratuito por parte de Meta.
          </p>
        </div>

        {/* Estimated time banner */}
        <div style={{ background: "rgba(117,255,158,0.05)", border: "1px solid rgba(117,255,158,0.15)", borderRadius: 14, padding: "14px 20px", marginBottom: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⏱️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Tiempo estimado: 15–20 minutos</div>
            <div style={{ fontSize: 13, color: "rgba(220,228,224,0.5)" }}>Solo necesitas hacerlo una vez. Después es automático.</div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s, i) => (
            <StepCard key={i} step={s} />
          ))}
        </div>

        {/* Help box */}
        <div style={{ marginTop: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>¿Necesitas ayuda?</div>
          <p style={{ fontSize: 14, color: "rgba(220,228,224,0.5)", lineHeight: 1.6, marginBottom: 16 }}>
            Si tienes problemas en cualquier paso, nuestro equipo te puede guiar por WhatsApp en menos de 1 hora.
          </p>
          <a href="https://wa.me/5215500000000?text=Hola%2C%20necesito%20ayuda%20para%20conectar%20mi%20WhatsApp%20Business%20a%20Botflow"
            target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 10, color: "#25D366", fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,211,102,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(37,211,102,0.12)"; }}>
            💬 Hablar con soporte por WhatsApp
          </a>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/onboarding" style={{ flex: 1, minWidth: 200, padding: "14px", background: "linear-gradient(135deg,#75ff9e,#25D366)", border: "none", borderRadius: 13, color: "#003918", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", textAlign: "center", boxShadow: "0 0 24px rgba(117,255,158,0.3)", display: "block" }}>
            ← Volver a mi agente
          </a>
          <button onClick={copy} style={{ flex: 1, minWidth: 200, padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, color: "rgba(220,228,224,0.7)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {copied ? "✓ ¡Copiado!" : "🔗 Copiar enlace de esta guía"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "20px 22px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(117,255,158,0.08)", border: "1px solid rgba(117,255,158,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {step.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#75ff9e", letterSpacing: "0.08em", marginBottom: 2 }}>PASO {step.num}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{step.title}</div>
        </div>
        <span style={{ fontSize: 18, color: "rgba(220,228,224,0.3)", transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>⌄</span>
      </button>

      {open && (
        <div style={{ padding: "0 22px 20px 80px" }}>
          <p style={{ fontSize: 14.5, color: "rgba(220,228,224,0.62)", lineHeight: 1.7, marginBottom: step.tip || step.link ? 14 : 0 }}>
            {step.desc}
          </p>
          {step.tip && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.15)", borderRadius: 9, marginBottom: step.link ? 12 : 0 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: 13, color: "rgba(255,220,100,0.8)", lineHeight: 1.5 }}>{step.tip}</span>
            </div>
          )}
          {step.link && (
            <a href={step.link.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#75ff9e", textDecoration: "none", padding: "8px 14px", background: "rgba(117,255,158,0.07)", border: "1px solid rgba(117,255,158,0.18)", borderRadius: 8, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(117,255,158,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(117,255,158,0.07)"}>
              {step.link.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
