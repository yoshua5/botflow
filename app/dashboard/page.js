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
          ) : (
            <span style={{ fontSize: 13, color: s.done ? T.muted : T.text, fontWeight: s.done ? 