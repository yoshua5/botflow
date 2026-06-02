"use client";
import { useState, useEffect } from "react";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

// ── Navbar ────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid #E2E8F0" : "none",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em" }}>Bot<span style={{ color: BLUE }}>flow</span></span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Cómo funciona", "Beneficios", "Precios"].map(item => (
            <a key={item} href="#" style={{ fontSize: 14, fontWeight: 500, color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = TEXT}
              onMouseLeave={e => e.target.style.color = MUTED}>{item}</a>
          ))}
          <a href="/sign-in" style={{ fontSize: 14, fontWeight: 500, color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = TEXT}
            onMouseLeave={e => e.target.style.color = MUTED}>
            Iniciar sesión
          </a>
          <a href="/sign-up" style={{
            padding: "8px 20px", background: BLUE, borderRadius: 8, fontSize: 14, fontWeight: 600,
            color: WHITE, textDecoration: "none", boxShadow: "0 1px 3px rgba(37,99,235,0.3)",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.boxShadow = "0 1px 3px rgba(37,99,235,0.3)"; }}>
            Empieza Gratis
          </a>
        </div>
      </div>
    </nav>
  );
}

// ── Hero Chat Mockup ──────────────────────────────────────
const CHAT_MSGS = [
  { from: "user", text: "Hola! Estoy interesado en un departamento en Madrid." },
  { from: "bot", text: "¡Perfecto! Tengo 3 opciones ideales. ¿Buscas con terraza?" },
  { from: "user", text: "Sí, con terraza y cerca del metro." },
  { from: "bot", text: "Encontré 2 opciones perfectas. ¿Te agendo una visita hoy?" },
];

function ChatMockup() {
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setVisible(v => v < CHAT_MSGS.length ? v + 1 : 1), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ background: WHITE, borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", overflow: "hidden", width: "100%", maxWidth: 360 }}>
      <div style={{ background: "#128C7E", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: WHITE }}>Bot Inmobiliario Pro</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>En línea 24/7</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 14px", background: "#ECE5DD", minHeight: 160, display: "flex", flexDirection: "column", gap: 10 }}>
        {CHAT_MSGS.slice(0, visible).map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", animation: "fadeInMsg 0.35s ease" }}>
            <div style={{
              maxWidth: "80%", padding: "8px 12px",
              borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.from === "user" ? "#DCF8C6" : WHITE,
              fontSize: 13, color: TEXT, lineHeight: 1.5,
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}>{msg.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────
function Hero({ data }) {
  return (
    <section style={{
      background: "linear-gradient(160deg, #EFF6FF 0%, #F8FAFF 55%, #F0FDF4 100%)",
      paddingTop: 120, paddingBottom: 80,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: BLUE_MID, border: `1px solid #93C5FD`, marginBottom: 24 }}>
            <span style={{ fontSize: 12 }}>✨</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, letterSpacing: "0.05em", textTransform: "uppercase" }}>Nueva Era de Automatización</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px,4vw,54px)", fontWeight: 900, color: TEXT, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
            {data?.heroTitle || "Crea tu Bot de WhatsApp con el poder de la IA"}
          </h1>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            {data?.heroDesc || "Solo describe tu idea y nuestra IA se encarga del resto. Sin código, sin complicaciones, y listo en minutos para atender a tus clientes."}
          </p>
          <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
            <a href="/sign-up" style={{
              padding: "13px 28px", background: BLUE, borderRadius: 10, fontSize: 15, fontWeight: 700,
              color: WHITE, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,99,235,0.35)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = "none"; }}>
              Empieza Gratis
            </a>
            <a href="#como-funciona" style={{
              padding: "13px 24px", background: WHITE, borderRadius: 10, fontSize: 15, fontWeight: 600,
              color: TEXT, textDecoration: "none", border: "1.5px solid #E2E8F0",
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#94A3B8"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: BLUE }}>▶</span>
              Ver demo
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex" }}>
              {["#93C5FD","#6EE7B7","#FCA5A5"].map((bg, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: bg, border: "2px solid white", marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                  {["👨","👩","🧑"][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: MUTED }}><strong style={{ color: TEXT }}>+2,000 bots</strong> creados este mes</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
          <ChatMockup />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 }}>
            <div style={{ background: WHITE, borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em" }}>98%</div>
              <div style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginTop: 2 }}>Precisión en respuestas</div>
            </div>
            <div style={{ background: BLUE, borderRadius: 14, padding: "16px 18px", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>⚡</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: WHITE }}>Listo en &lt; 5 min</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInMsg { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`}</style>
    </section>
  );
}

// ── Cómo Funciona ─────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: "✏️", num: "1", title: "Describe tu idea", desc: "Escribe qué quieres que haga tu bot: vender, agendar citas o soporte técnico." },
    { icon: "💬", num: "2", title: "La IA te pregunta", desc: "Nuestra IA te hará un par de preguntas para pulir los detalles y el tono del bot." },
    { icon: "🚀", num: "3", title: "¡Listo para usar!", desc: "Conectamos tu bot a WhatsApp y empieza a recibir mensajes de inmediato." },
  ];
  return (
    <section id="como-funciona" style={{ background: WHITE, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, color: TEXT, letterSpacing: "-0.02em", marginBottom: 12 }}>Cómo funciona</h2>
          <p style={{ fontSize: 16, color: MUTED, maxWidth: 480, margin: "0 auto" }}>Nuestro proceso de creación es tan natural como hablar con un asistente humano.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "36px 24px", background: "#FAFBFF", borderRadius: 20, border: "1px solid #EEF2FF", transition: "all 0.25s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.1)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 20px" }}>{s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>{s.num}.</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Benefits ──────────────────────────────────────────────
function Benefits() {
  const items = [
    { icon: "⏱️", title: "Ahorro de tiempo masivo", desc: "Automatiza tareas repetitivas y deja que tu equipo se enfoque en cerrar ventas complejas." },
    { icon: "💬", title: "Respuesta inmediata 24/7", desc: "No pierdas un solo lead por falta de atención. Tus clientes recibirán respuestas en segundos." },
    { icon: "🔗", title: "Fácil integración", desc: "Conéctate con tu CRM, Google Sheets o cualquier herramienta que ya uses de forma nativa." },
  ];
  return (
    <section style={{ background: "#F8FAFF", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{
            borderRadius: 24, overflow: "hidden", aspectRatio: "4/3",
            background: "linear-gradient(135deg, #0F172A 0%, #1e3a5f 50%, #0C1A3A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
          }}>
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🤖</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {["📊","📈","💡","🔄","⚡","🎯"].map((e,i) => (
                  <div key={i} style={{ width: 44, height: 44, background: "rgba(37,99,235,0.25)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "1px solid rgba(37,99,235,0.3)" }}>{e}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            position: "absolute", bottom: -20, left: -20,
            background: BLUE, borderRadius: 16, padding: "18px 22px", maxWidth: 260,
            boxShadow: "0 12px 40px rgba(37,99,235,0.4)",
          }}>
            <p style={{ fontSize: 13, color: WHITE, fontWeight: 600, lineHeight: 1.6, marginBottom: 8 }}>
              "Botflow redujo nuestro tiempo de respuesta en un 90%"
            </p>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>— Carlos R., CEO de InmoQuick</span>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 36 }}>
            Diseñado para que tu<br />negocio nunca duerma
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: BLUE_MID, border: `1px solid #93C5FD44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────
function Pricing({ data }) {
  const plans = [
    { name: data?.plan1Name || "Starter",  price: data?.plan1Price || "Gratis", desc: data?.plan1Desc || "Para probar y lanzar tu primer bot",   features: data?.plan1Features || ["1 bot activo","500 mensajes/mes","Soporte por email","Plantillas básicas"],                                          cta: "Empezar gratis",   highlight: false },
    { name: data?.plan2Name || "Pro",      price: data?.plan2Price || "$29",    period: "/mes", desc: data?.plan2Desc || "Para negocios en crecimiento",    features: data?.plan2Features || ["5 bots activos","10,000 mensajes/mes","Soporte prioritario","Analíticas avanzadas","Integraciones CRM"], cta: "Elegir Pro",       highlight: true  },
    { name: data?.plan3Name || "Business", price: data?.plan3Price || "$79",    period: "/mes", desc: data?.plan3Desc || "Para equipos y agencias",          features: data?.plan3Features || ["Bots ilimitados","Mensajes ilimitados","Soporte dedicado","API personalizada","White label"],              cta: "Contactar ventas", highlight: false },
  ];
  return (
    <section id="precios" style={{ background: WHITE, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, color: TEXT, letterSpacing: "-0.02em", marginBottom: 12 }}>Precios simples y transparentes</h2>
          <p style={{ fontSize: 16, color: MUTED }}>Sin tarifas ocultas. Cancela cuando quieras.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, alignItems: "start" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              borderRadius: 20, padding: "32px 28px",
              background: plan.highlight ? BLUE : WHITE,
              border: plan.highlight ? "none" : "1.5px solid #E2E8F0",
              boxShadow: plan.highlight ? "0 20px 60px rgba(37,99,235,0.3)" : "0 2px 12px rgba(0,0,0,0.04)",
              transform: plan.highlight ? "scale(1.03)" : "none",
              position: "relative", overflow: "hidden", transition: "all 0.25s",
            }}
              onMouseEnter={e => { if (!plan.highlight) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; } }}
              onMouseLeave={e => { if (!plan.highlight) { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; } }}>
              {plan.highlight && <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: WHITE }}>MÁS POPULAR</div>}
              <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? "rgba(255,255,255,0.75)" : MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 6 }}>
                <span style={{ fontSize: 38, fontWeight: 900, color: plan.highlight ? WHITE : TEXT, letterSpacing: "-0.02em" }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.6)" : MUTED }}>{plan.period}</span>}
              </div>
              <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.65)" : MUTED, marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: plan.highlight ? "#93C5FD" : BLUE, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.85)" : TEXT }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="/sign-up" style={{
                display: "block", textAlign: "center", padding: "12px", borderRadius: 10,
                background: plan.highlight ? WHITE : BLUE,
                color: plan.highlight ? BLUE : WHITE,
                fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "opacity 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────
function CTASection() {
  return (
    <section style={{ padding: "60px 24px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)",
          borderRadius: 28, padding: "64px 48px", textAlign: "center",
          boxShadow: "0 40px 100px rgba(15,23,42,0.15)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(37,99,235,0.2)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(37,211,102,0.08)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ fontSize: "clamp(24px,3vw,38px)", fontWeight: 900, color: WHITE, letterSpacing: "-0.02em", marginBottom: 14 }}>
              ¿Listo para transformar tu WhatsApp?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 32, lineHeight: 1.65 }}>
              Únete a miles de empresas que ya están escalando sus ventas con IA.<br />No requiere tarjeta de crédito.
            </p>
            <a href="/sign-up" style={{
              display: "inline-block", padding: "14px 36px", background: BLUE, borderRadius: 12,
              fontSize: 15, fontWeight: 700, color: WHITE, textDecoration: "none",
              boxShadow: "0 4px 20px rgba(37,99,235,0.5)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.5)"; }}>
              Empieza Gratis Ahora
            </a>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 14 }}>Configuración en menos de 5 minutos</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: "Producto", links: ["Funcionalidades", "Integraciones", "Precios", "Casos de éxito"] },
    { title: "Recursos", links: ["Blog", "Documentación", "Soporte", "API"] },
    { title: "Legal", links: ["Privacidad", "Términos", "Cookies"] },
  ];
  return (
    <footer style={{ background: WHITE, borderTop: "1px solid #F1F5F9", padding: "52px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💬</div>
              <span style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>Bot<span style={{ color: BLUE }}>flow</span></span>
            </a>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, maxWidth: 220 }}>Potenciando negocios con inteligencia artificial conversacional.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {["𝕏", "in"].map((s, i) => (
                <a key={i} href="#" style={{ width: 32, height: 32, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: MUTED, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = BLUE_MID; e.currentTarget.style.color = BLUE; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = MUTED; }}>{s}</a>
              ))}
            </div>
          </div>
          {cols.map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16, letterSpacing: "0.02em" }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(link => (
                  <a key={link} href="#" style={{ fontSize: 13, color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = BLUE}
                    onMouseLeave={e => e.target.style.color = MUTED}>{link}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#CBD5E1" }}>© 2024 Botflow. Todos los derechos reservados. · Hecho con ❤️ para el mundo</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/landing").then(r => r.json()).then(res => {
      if (res && Object.keys(res).length > 0) setData(res);
    }).catch(() => {});
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: WHITE }}>
      <Navbar />
      <Hero data={data} />
      <HowItWorks />
      <Benefits />
      <Pricing data={data} />
      <CTASection />
      <Footer />
    </main>
  );
}
