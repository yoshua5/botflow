"use client";
import { useState, useEffect } from "react";

const T = {
  blue:   "#2563EB",
  blueL:  "#EFF6FF",
  blueM:  "#DBEAFE",
  text:   "#0F172A",
  muted:  "#64748B",
  white:  "#FFFFFF",
  border: "#E2E8F0",
  surf:   "#F8FAFF",
};

function AgentLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="#0F172A"/>
      <path d="M18 6L26 26H10L18 6Z" fill="url(#lg1)" opacity="0.95"/>
      <ellipse cx="15" cy="23" rx="5" ry="4" fill="none" stroke="#22D3EE" strokeWidth="1.8"/>
      <circle cx="13.5" cy="23" r="0.8" fill="#22D3EE"/>
      <circle cx="15.5" cy="23" r="0.8" fill="#22D3EE"/>
      <line x1="22" y1="18" x2="27" y2="18" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="22" y1="21" x2="26" y2="21" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="22" y1="24" x2="25" y2="24" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="lg1" x1="18" y1="6" x2="18" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF"/>
          <stop offset="1" stopColor="#93C5FD"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

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
      backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? `1px solid ${T.border}` : "none",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
          <AgentLogo size={34} />
          <span style={{ fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: "-0.03em" }}>
            Agent<span style={{ color: T.blue }}>Flow</span>
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {[["Cómo funciona","#como-funciona"], ["Funciones","#funciones"], ["Precios","#precios"]].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 14, fontWeight: 500, color: T.muted, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = T.text}
              onMouseLeave={e => e.target.style.color = T.muted}>{label}</a>
          ))}
          <a href="/sign-in" style={{ fontSize: 14, fontWeight: 500, color: T.muted, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = T.text}
            onMouseLeave={e => e.target.style.color = T.muted}>
            Iniciar sesión
          </a>
          <a href="/sign-up" style={{
            padding: "9px 22px", background: T.blue, borderRadius: 9, fontSize: 14, fontWeight: 700,
            color: T.white, textDecoration: "none", boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.3)"; }}>
            Empieza Gratis
          </a>
        </div>
      </div>
    </nav>
  );
}

// ── Hero Chat Mockup ──────────────────────────────────────
const CHAT_MSGS = [
  { from: "user", text: "Hola! Me interesa agendar una cita." },
  { from: "bot",  text: "¡Con gusto! ¿Para cuál servicio?" },
  { from: "user", text: "Consultoría de negocios." },
  { from: "bot",  text: "Perfecto. Tengo disponibilidad mañana a las 10am y 3pm. ¿Cuál te funciona? 📅" },
];

function ChatMockup() {
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setVisible(v => v < CHAT_MSGS.length ? v + 1 : 1), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ background: T.white, borderRadius: 22, boxShadow: "0 24px 64px rgba(0,0,0,0.12)", overflow: "hidden", width: "100%", maxWidth: 360 }}>
      <div style={{ background: "#128C7E", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>AgentFlow Bot</div>
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
              background: msg.from === "user" ? "#DCF8C6" : T.white,
              fontSize: 13, color: T.text, lineHeight: 1.5,
              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
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
    <section style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F8FAFF 55%, #F0FDF4 100%)", paddingTop: 120, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: T.blueM, border: `1px solid #93C5FD`, marginBottom: 24 }}>
            <span style={{ fontSize: 12 }}>✨</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.blue, letterSpacing: "0.05em", textTransform: "uppercase" }}>Agentes IA de nueva generación</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px,4vw,54px)", fontWeight: 900, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
            {data?.heroTitle || "Automatiza tu negocio con Agentes de IA"}
          </h1>
          <p style={{ fontSize: 17, color: T.muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            {data?.heroDesc || "Crea agentes inteligentes en minutos que atienden, agendan y venden por ti en WhatsApp, Instagram y web. Sin código, disponibles 24/7."}
          </p>
          <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
            <a href="/sign-up" style={{
              padding: "13px 28px", background: T.blue, borderRadius: 10, fontSize: 15, fontWeight: 700,
              color: T.white, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,99,235,0.35)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.35)"; }}>
              Empieza Gratis
            </a>
            <a href="#como-funciona" style={{
              padding: "13px 24px", background: T.white, borderRadius: 10, fontSize: 15, fontWeight: 600,
              color: T.text, textDecoration: "none", border: `1.5px solid ${T.border}`,
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#94A3B8"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.blueM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: T.blue }}>▶</span>
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
            <span style={{ fontSize: 13, color: T.muted }}><strong style={{ color: T.text }}>+500 empresas</strong> ya usan AgentFlow</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
          <ChatMockup />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 }}>
            <div style={{ background: T.white, borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>98%</div>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginTop: 2 }}>Precisión en respuestas</div>
            </div>
            <div style={{ background: T.blue, borderRadius: 14, padding: "16px 18px", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>⚡</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Listo en &lt; 5 min</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInMsg { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`}</style>
    </section>
  );
}

// ── Social Proof Bar ──────────────────────────────────────
function SocialProof() {
  const stats = [
    { n: "500+", label: "Empresas activas" },
    { n: "2M+",  label: "Mensajes procesados" },
    { n: "98%",  label: "Satisfacción clientes" },
    { n: "24/7", label: "Disponibilidad" },
    { n: "<5min", label: "Tiempo de setup" },
  ];
  return (
    <section style={{ background: T.text, padding: "24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#60A5FA", letterSpacing: "-0.02em" }}>{s.n}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Cómo Funciona ─────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: "✏️", num: "1", title: "Describe tu idea", desc: "Escribe qué quieres que haga tu agente: vender, agendar citas o soporte técnico." },
    { icon: "💬", num: "2", title: "La IA te configura", desc: "AgentFlow te hará preguntas precisas para pulir el tono y la personalidad del agente." },
    { icon: "🚀", num: "3", title: "¡Listo para usar!", desc: "Conecta a WhatsApp en 1 clic y empieza a recibir mensajes de inmediato." },
  ];
  return (
    <section id="como-funciona" style={{ background: T.white, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: T.blue, letterSpacing: "0.08em", textTransform: "uppercase", background: T.blueL, padding: "4px 14px", borderRadius: 100, marginBottom: 14 }}>Proceso simple</div>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, color: T.text, letterSpacing: "-0.02em", marginBottom: 12 }}>Cómo funciona AgentFlow</h2>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: "0 auto" }}>Nuestro proceso de creación es tan natural como hablar con un asistente.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "36px 24px", background: "#FAFBFF", borderRadius: 20, border: `1px solid ${T.border}`, transition: "all 0.25s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.1)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: T.blueM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 20px" }}>{s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>{s.num}.</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features Grid ─────────────────────────────────────────
function Features() {
  const feats = [
    { icon: "🤖", title: "Agentes con IA",          desc: "GPT-4 detrás de cada agente. Aprende de tu negocio y mejora con el tiempo." },
    { icon: "📱", title: "WhatsApp nativo",          desc: "API oficial de Meta. Sin riesgos de baneo, cumplimiento total de políticas." },
    { icon: "📅", title: "Gestión de citas",         desc: "Tu agente agenda, confirma y recuerda citas automáticamente." },
    { icon: "🗂️", title: "Base de conocimiento",     desc: "Sube PDFs, URLs o texto y tu agente aprende a responder con precisión." },
    { icon: "📊", title: "Analytics en tiempo real", desc: "Mide conversaciones, tiempo de respuesta y tasa de conversión." },
    { icon: "🔌", title: "Integraciones fáciles",    desc: "Conecta con CRM, Google Sheets, Calendly y más sin código." },
  ];
  return (
    <section id="funciones" style={{ background: T.surf, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: T.blue, letterSpacing: "0.08em", textTransform: "uppercase", background: T.blueL, padding: "4px 14px", borderRadius: 100, marginBottom: 14 }}>Todo incluido</div>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, color: T.text, letterSpacing: "-0.02em", marginBottom: 12 }}>Funciones que marcan la diferencia</h2>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: "0 auto" }}>Cada herramienta diseñada para hacer crecer tu negocio en piloto automático.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {feats.map((f, i) => (
            <div key={i} style={{
              background: T.white, borderRadius: 16, padding: "28px 24px",
              border: `1px solid ${T.border}`, transition: "all 0.22s", cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,99,235,0.1)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "#93C5FD"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = T.border; }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: T.blueL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    { name: "Carlos Rodríguez", role: "CEO · InmoQuick",   text: "AgentFlow redujo nuestro tiempo de respuesta en un 90%. Ahora atendemos 3x más leads sin contratar más personal.",          avatar: "👨‍💼" },
    { name: "Sofía García",      role: "Directora · MedApp", text: "El bot agenda citas sólo. Nuestros pacientes aman la rapidez y disponibilidad 24/7. Increíble herramienta.",                  avatar: "👩‍⚕️" },
    { name: "Marcos Jiménez",    role: "Fundador · ShopBot", text: "Pasamos de perder ventas por falta de atención a cerrar el 40% más de pedidos en el primer mes con AgentFlow.",               avatar: "👨‍💻" },
  ];
  return (
    <section style={{ background: T.white, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: T.blue, letterSpacing: "0.08em", textTransform: "uppercase", background: T.blueL, padding: "4px 14px", borderRadius: 100, marginBottom: 14 }}>Testimonios</div>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, color: T.text, letterSpacing: "-0.02em", marginBottom: 12 }}>Lo que dicen nuestros clientes</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{
              background: "#FAFBFF", borderRadius: 16, padding: "28px 24px",
              border: `1px solid ${T.border}`, transition: "all 0.22s",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,99,235,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                {"★★★★★".split("").map((s, j) => <span key={j} style={{ color: "#F59E0B", fontSize: 15 }}>{s}</span>)}
              </div>
              <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.blueL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────
function Pricing({ data }) {
  const plans = [
    { name: data?.plan1Name || "Starter",  price: data?.plan1Price || "Gratis", desc: data?.plan1Desc || "Para probar y lanzar tu primer agente",   features: data?.plan1Features || ["1 agente activo","500 mensajes/mes","Soporte por email","Plantillas básicas"],                                             cta: "Empezar gratis",   highlight: false },
    { name: data?.plan2Name || "Pro",      price: data?.plan2Price || "$29",    period: "/mes", desc: data?.plan2Desc || "Para negocios en crecimiento",    features: data?.plan2Features || ["5 agentes activos","10,000 mensajes/mes","Soporte prioritario","Analíticas avanzadas","Integraciones CRM"],      cta: "Elegir Pro",       highlight: true  },
    { name: data?.plan3Name || "Business", price: data?.plan3Price || "$79",    period: "/mes", desc: data?.plan3Desc || "Para equipos y agencias",          features: data?.plan3Features || ["Agentes ilimitados","Mensajes ilimitados","Soporte dedicado","API personalizada","White label"],                  cta: "Contactar ventas", highlight: false },
  ];
  return (
    <section id="precios" style={{ background: T.surf, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: T.blue, letterSpacing: "0.08em", textTransform: "uppercase", background: T.blueL, padding: "4px 14px", borderRadius: 100, marginBottom: 14 }}>Precios</div>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, color: T.text, letterSpacing: "-0.02em", marginBottom: 12 }}>Simples y transparentes</h2>
          <p style={{ fontSize: 16, color: T.muted }}>Sin tarifas ocultas. Cancela cuando quieras.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, alignItems: "start" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              borderRadius: 20, padding: "32px 28px",
              background: plan.highlight ? T.blue : T.white,
              border: plan.highlight ? "none" : `1.5px solid ${T.border}`,
              boxShadow: plan.highlight ? "0 20px 60px rgba(37,99,235,0.3)" : "0 2px 12px rgba(0,0,0,0.04)",
              transform: plan.highlight ? "scale(1.03)" : "none",
              position: "relative", overflow: "hidden", transition: "all 0.25s",
            }}
              onMouseEnter={e => { if (!plan.highlight) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; } }}
              onMouseLeave={e => { if (!plan.highlight) { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; } }}>
              {plan.highlight && <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: T.white }}>MÁS POPULAR</div>}
              <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? "rgba(255,255,255,0.75)" : T.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 6 }}>
                <span style={{ fontSize: 38, fontWeight: 900, color: plan.highlight ? T.white : T.text, letterSpacing: "-0.02em" }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.6)" : T.muted }}>{plan.period}</span>}
              </div>
              <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.65)" : T.muted, marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: plan.highlight ? "#93C5FD" : T.blue, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.85)" : T.text }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="/sign-up" style={{
                display: "block", textAlign: "center", padding: "12px", borderRadius: 10,
                background: plan.highlight ? T.white : T.blue,
                color: plan.highlight ? T.blue : T.white,
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
          <div style={{ position: "absolute", top: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "clamp(26px,3vw,42px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: 16 }}>
              Listo para automatizar tu negocio?
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
              Unete a cientos de empresas que ya usan AgentFlow para crecer sin limites.
            </p>
            <a href="/sign-up" style={{
              display: "inline-block", padding: "15px 40px", background: "#FFFFFF",
              borderRadius: 12, fontSize: 16, fontWeight: 800, color: "#2563EB",
              textDecoration: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.28)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)"; }}>
              Empieza Gratis Ahora
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#0F172A", padding: "48px 24px 32px", color: "rgba(255,255,255,0.5)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32, marginBottom: 40 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <AgentLogo size={30} />
              <span style={{ fontSize: 17, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
                Agent<span style={{ color: "#60A5FA" }}>Flow</span>
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>
              Plataforma de agentes de IA para automatizar la atencion al cliente en WhatsApp y mas canales.
            </p>
          </div>
          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            {[
              { title: "Producto", links: ["Como funciona", "Funciones", "Precios", "Blog"] },
              { title: "Empresa",  links: ["Nosotros", "Terminos", "Privacidad", "Contacto"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = "#FFFFFF"}
                      onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12 }}>2025 AgentFlow. Todos los derechos reservados.</span>
          <span style={{ fontSize: 12 }}>Hecho con para negocios que quieren crecer</span>
        </div>
      </div>
    </footer>
  );
}

// ── Landing Page ──────────────────────────────────────────
export default function LandingPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/landing").then(r => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: T.white }}>
      <Navbar />
      <Hero data={data} />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing data={data} />
      <CTASection />
      <Footer />
    </div>
  );
}
