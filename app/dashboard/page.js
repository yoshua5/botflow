"use client";
import { useState, useEffect } from "react";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 16, padding: "20px 22px",
      border: "1.5px solid #E2E8F0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.1)"; e.currentTarget.style.borderColor = "#93C5FD"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function BotCard({ bot }) {
  const isActive = bot.status === "ACTIVO";
  const initials = (bot.agentName || bot.name || "B").slice(0, 2).toUpperCase();
  return (
    <div style={{
      background: WHITE, borderRadius: 16, padding: "18px 20px",
      border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.1)"; e.currentTarget.style.borderColor = "#93C5FD"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: BLUE_MID, border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: BLUE, flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bot.agentName || bot.name}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            padding: "2px 8px", borderRadius: 100,
            background: isActive ? "#F0FDF4" : "#F1F5F9",
            color: isActive ? "#16A34A" : "#94A3B8", flexShrink: 0,
          }}>● {bot.status}</span>
        </div>
        <p style={{ fontSize: 13, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {bot.businessName} · {(bot.messageCount || 0)} mensajes
        </p>
      </div>
      <a href="/dashboard/settings" style={{ padding: "6px 14px", background: BLUE_LIGHT, borderRadius: 8, fontSize: 12, fontWeight: 700, color: BLUE, textDecoration: "none", flexShrink: 0 }}>Gestionar</a>
    </div>
  );
}

export default function DashboardPage() {
  const [bots, setBots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bots").then(r => r.json()),
      fetch("/api/analytics").then(r => r.json()),
    ]).then(([botsData, analyticsData]) => {
      setBots(botsData.bots || []);
      setAnalytics(analyticsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeCount = bots.filter(b => b.status === "ACTIVO").length;
  const totalMessages = analytics?.totalMessages || 0;
  const totalConversations = analytics?.totalConversations || 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayMessages = analytics?.dailyCounts?.[today] || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em", marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 15, color: MUTED }}>Bienvenido a Botflow — todos tus bots en un solo lugar</p>
        </div>
        <a href="/dashboard/create" style={{
          padding: "10px 20px", background: BLUE, borderRadius: 10, fontSize: 14,
          fontWeight: 700, color: WHITE, textDecoration: "none",
          boxShadow: "0 2px 8px rgba(37,99,235,0.3)", display: "flex", alignItems: "center", gap: 6,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
          onMouseLeave={e => e.currentTarget.style.background = BLUE}>
          <span style={{ fontSize: 18 }}>+</span> Nuevo Bot
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon="🤖" label="Bots totales" value={loading ? "..." : bots.length.toString()} sub={`${activeCount} activos`} />
        <StatCard icon="💬" label="Mensajes totales" value={loading ? "..." : totalMessages.toLocaleString()} sub="desde siempre" />
        <StatCard icon="👥" label="Conversaciones" value={loading ? "..." : totalConversations.toLocaleString()} sub="únicas" />
        <StatCard icon="📅" label="Mensajes hoy" value={loading ? "..." : todayMessages.toLocaleString()} sub={today} />
      </div>

      {/* Bots grid */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Tus Bots</h2>
          <a href="/dashboard/bots" style={{ fontSize: 13, fontWeight: 600, color: BLUE, textDecoration: "none" }}>Ver todos →</a>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: MUTED, background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
            Cargando...
          </div>
        ) : bots.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", background: WHITE, borderRadius: 16, border: "1.5px dashed #E2E8F0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Aún no tienes bots</div>
            <p style={{ color: MUTED, marginBottom: 20 }}>Crea tu primer agente de WhatsApp en minutos.</p>
            <a href="/dashboard/create" style={{ padding: "10px 22px", background: BLUE, borderRadius: 10, fontSize: 14, fontWeight: 700, color: WHITE, textDecoration: "none" }}>+ Crear mi primer bot</a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {bots.slice(0, 6).map(bot => <BotCard key={bot.id} bot={bot} />)}
          </div>
        )}
      </div>
    </div>
  );
}
