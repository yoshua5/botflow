"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const T = {
  blue:   "#2563EB",
  blueL:  "#EFF6FF",
  blueM:  "#DBEAFE",
  text:   "#0F172A",
  muted:  "#64748B",
  border: "#E2E8F0",
  bg:     "#F8FAFF",
  white:  "#FFFFFF",
  green:  "#10B981",
  red:    "#EF4444",
  surf:   "#F1F5F9",
  yellow: "#F59E0B",
};

// ── KPI Card ──────────────────────────────────────────────
function KPICard({ icon, label, value, sub, trend, color }) {
  const up    = trend > 0;
  const tColor = up ? T.green : T.red;
  const tBg    = up ? "#F0FDF4" : "#FEF2F2";
  return (
    <div style={{
      background: T.white, borderRadius: 14, padding: "20px 22px",
      border: `1px solid ${T.border}`, transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, background: `${color || T.blue}18`,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 700, color: tColor, background: tBg, padding: "3px 8px", borderRadius: 6 }}>
            {up ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ── Bot Status Card ───────────────────────────────────────
function BotCard({ bot }) {
  const active = bot.status === "ACTIVO";
  return (
    <Link href={`/dashboard/bots/${bot.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: T.white, borderRadius: 14, padding: "18px 20px",
        border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Health dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: active ? "#F0FDF4" : "#FEF2F2",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>🤖</div>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 10, height: 10, borderRadius: "50%",
                background: active ? T.green : T.red,
                border: "2px solid white",
              }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>
                {bot.agentName || bot.name}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>
                {bot.businessName || "Mi negocio"}
              </div>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "3px 8px", borderRadius: 6,
            background: active ? "#F0FDF4" : "#FEF2F2",
            color: active ? T.green : T.red,
          }}>
            {active ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 12, borderTop: `1px solid ${T.surf}` }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{(bot.messageCount || 0).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.muted }}>Mensajes</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{(bot.conversationCount || 0).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.muted }}>Conversaciones</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Quick Action Button ───────────────────────────────────
function QuickAction({ icon, label, href, color }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
        padding: "14px 10px", borderRadius: 12, background: T.white,
        border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.18s", minWidth: 80,
      }}
        onMouseEnter={e => { e.currentTarget.style.background = T.blueL; e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
      </div>
    </Link>
  );
}

// ── Activity Item ─────────────────────────────────────────
function ActivityItem({ icon, text, time, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.surf}` }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: `${color || T.blue}18`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{text}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{time}</div>
      </div>
    </div>
  );
}

// ── Onboarding Checklist ──────────────────────────────────
function OnboardingChecklist({ hasBots }) {
  const steps = [
    { done: true,    icon: "✅", label: "Creaste tu cuenta", href: null },
    { done: hasBots, icon: "🤖", label: "Crea tu primer bot", href: "/dashboard/create" },
    { done: false,   icon: "📱", label: "Conecta WhatsApp",   href: "/dashboard/configuracion/conexiones" },
    { done: false,   icon: "💬", label: "Envía tu primer mensaje", href: null },
  ];
  const completed = steps.filter(s => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  return (
    <div style={{ background: T.white, borderRadius: 14, padding: "22px 24px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Primeros pasos</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{completed} de {steps.length} completados</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.blue }}>{pct}%</div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 6, background: T.surf, borderRadius: 6, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: T.blue, borderRadius: 6, transition: "width 0.5s ease" }} />
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            background: s.done ? T.green : T.surf,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: s.done ? T.white : T.muted, fontWeight: 700,
          }}>
            {s.done ? "✓" : i + 1}
          </div>
          {s.href && !s.done ? (
            <Link href={s.href} style={{ fontSize: 13, color: T.blue, fontWeight: 600, textDecoration: "none" }}>
              {s.label} →
            </Link>
          {s.href && !s.done ? (
            <Link href={s.href} style={{ fontSize: 13, color: T.blue, fontWeight: 600, textDecoration: "none" }}>
              {s.label} →
            </Link>
          ) : (
            <span style={{ fontSize: 13, color: s.done ? T.muted : T.text, fontWeight: s.done ? 400 : 500 }}>
              {s.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard Page ─────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [bots, setBots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Buenos dias");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos dias" : h < 18 ? "Buenas tardes" : "Buenas noches");
    fetch("/api/bots").then(r => r.json()).then(d => { setBots(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalMsgs  = bots.reduce((s, b) => s + (b.messageCount || 0), 0);
  const totalConvs = bots.reduce((s, b) => s + (b.conversationCount || 0), 0);
  const activeBots = bots.filter(b => b.status === "ACTIVO").length;
  const name = session?.user?.name?.split(" ")[0] || "ahi";

  const KPIs = [
    { icon: "🤖", label: "Agentes activos",    value: activeBots,                     sub: `de ${bots.length} total`,           trend: 12,  color: "#2563EB" },
    { icon: "💬", label: "Mensajes totales",    value: totalMsgs.toLocaleString(),     sub: "ultimos 30 dias",                   trend: 23,  color: "#10B981" },
    { icon: "🗣️", label: "Conversaciones",      value: totalConvs.toLocaleString(),    sub: "sesiones unicas",                   trend: 8,   color: "#F59E0B" },
    { icon: "⚡", label: "Tiempo de respuesta", value: "< 2s",                         sub: "promedio",                          trend: -5,  color: "#8B5CF6" },
  ];

  const QUICK_ACTIONS = [
    { icon: "➕", label: "Nuevo Bot",    href: "/dashboard/create" },
    { icon: "📊", label: "Analytics",   href: "/dashboard/analytics" },
    { icon: "👥", label: "Contactos",   href: "/dashboard/contactos" },
    { icon: "📅", label: "Citas",       href: "/dashboard/citas" },
    { icon: "⚙️", label: "Config",      href: "/dashboard/configuracion/cuenta" },
  ];

  const ACTIVITY = [
    { icon: "💬", text: "Nueva conversacion iniciada en bot principal",   time: "hace 2 min",    color: "#2563EB" },
    { icon: "📅", text: "Cita agendada para manana a las 10:00 AM",       time: "hace 15 min",   color: "#10B981" },
    { icon: "🤖", text: "Bot Ventas IA activado correctamente",           time: "hace 1 hora",   color: "#8B5CF6" },
    { icon: "⚡", text: "Webhook de WhatsApp conectado exitosamente",     time: "hace 3 horas",  color: "#F59E0B" },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1300, margin: "0 auto" }}>

      {/* Welcome Banner */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: "-0.02em", marginBottom: 4 }}>
          {greeting}, {name}!
        </h1>
        <p style={{ fontSize: 14, color: T.muted }}>
          Aqui tienes un resumen de tu actividad hoy
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {KPIs.map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {/* Quick Actions */}
      <div style={{ background: T.white, borderRadius: 14, padding: "20px 22px", border: `1px solid ${T.border}`, marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Acciones rapidas</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {QUICK_ACTIONS.map((a, i) => <QuickAction key={i} {...a} />)}
        </div>
      </div>

      {/* Two-column: Bots + Right panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

        {/* Bots Grid */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Tus Agentes</span>
            <a href="/dashboard/create" style={{ fontSize: 13, color: T.blue, fontWeight: 600, textDecoration: "none" }}>+ Nuevo</a>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted }}>Cargando agentes...</div>
          ) : bots.length === 0 ? (
            <div style={{ background: T.white, borderRadius: 14, padding: "40px 24px", textAlign: "center", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>Aun no tienes agentes</div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Crea tu primer agente y empieza a automatizar</div>
              <a href="/dashboard/create" style={{ padding: "10px 22px", background: T.blue, color: T.white, borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                Crear primer agente
              </a>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
              {bots.map(bot => <BotCard key={bot.id} bot={bot} />)}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Activity Feed */}
          <div style={{ background: T.white, borderRadius: 14, padding: "22px 24px", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16 }}>Actividad reciente</div>
            {ACTIVITY.map((a, i) => <ActivityItem key={i} {...a} />)}
          </div>

          {/* Onboarding */}
          <OnboardingChecklist hasBots={bots.length > 0} />
        </div>
      </div>
    </div>
  );
}
