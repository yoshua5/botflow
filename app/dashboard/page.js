"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const GREEN = "#10B981";

function StatCard({ icon, label, value, sub, trend }) {
  return (
    <div style={{
      background: WHITE,
      borderRadius: 12,
      padding: "20px",
      border: "1px solid #E5E7EB",
      transition: "all 0.3s ease",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: BLUE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
          {icon}
        </div>
        {trend && (
          <div style={{ fontSize: 12, fontWeight: 600, color: trend > 0 ? GREEN : "#EF4444", background: trend > 0 ? "#F0FDF4" : "#FEF2F2", padding: "4px 8px", borderRadius: 6 }}>
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function BotCard({ bot }) {
  return (
    <Link href={`/dashboard/bots/${bot.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: WHITE,
        borderRadius: 12,
        padding: "20px",
        border: "1px solid #E5E7EB",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}>
        {/* Header with Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
              {bot.agentName || bot.name}
            </div>
            <div style={{ fontSize: 13, color: MUTED }}>
              {bot.businessName || "Mi negocio"}
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 6,
            background: bot.status === "ACTIVO" ? "#F0FDF4" : "#FEF2F2",
            color: bot.status === "ACTIVO" ? GREEN : "#EF4444",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {bot.status === "ACTIVO" ? "Activo" : "Inactivo"}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
              {(bot.messageCount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>Mensajes</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
              {(bot.conversationCount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>Conversaciones</div>
          </div>
        </div>
      </div>
    </Link>
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
  const connectedCount = bots.filter(b => b.phoneNumberId).length;
  const totalMessages = analytics?.totalMessages || 0;
  const totalConversations = analytics?.totalConversations || 0;

  return (
    <div style={{ padding: "40px 0" }}>
      {/* Hero Section */}
      <div style={{
        background: `linear-gradient(135deg, ${BLUE} 0%, #1E40AF 100%)`,
        borderRadius: 16,
        padding: "48px 40px",
        color: WHITE,
        marginBottom: 48,
      }}>
        <div style={{ maxWidth: 600 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Bienvenido a Botflow
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", marginBottom: 28, lineHeight: 1.6 }}>
            Gestiona todos tus bots de WhatsApp en un solo lugar. Crea, configura y monitorea agentes de IA en minutos.
          </p>
          <Link href="/dashboard/create-improved">
            <button style={{
              padding: "12px 28px",
              background: WHITE,
              color: BLUE,
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              <span>+</span> Crear nuevo bot
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 20 }}>
          Tu actividad
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          <StatCard icon="🤖" label="Bots Activos" value={activeCount} sub={`de ${bots.length} total`} />
          <StatCard icon="💬" label="Mensajes" value={totalMessages.toLocaleString()} sub="Todos los tiempos" />
          <StatCard icon="👥" label="Conversaciones" value={totalConversations.toLocaleString()} sub="Únicas" />
          <StatCard icon="📱" label="Conectados" value={connectedCount} sub="100% de cobertura" />
        </div>
      </div>

      {/* Bots Section */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 20 }}>
          Tus bots
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: MUTED }}>
            Cargando bots...
          </div>
        ) : bots.length === 0 ? (
          <div style={{
            background: BLUE_LIGHT,
            borderRadius: 12,
            padding: "40px 20px",
            textAlign: "center",
            border: `2px dashed ${BLUE}`,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 12 }}>
              No tienes bots creados aún
            </div>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>
              Crea tu primer bot para comenzar a gestionar tus agentes de WhatsApp
            </div>
            <Link href="/dashboard/create-improved">
              <button style={{
                padding: "10px 24px",
                background: BLUE,
                color: WHITE,
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1)";
                }}>
                + Crear Bot
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {bots.map(bot => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
