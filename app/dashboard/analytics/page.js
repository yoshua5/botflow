"use client";
import { useState, useEffect, useCallback } from "react";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

function BarChart({ dailyCounts }) {
  // Last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("es-ES", { weekday: "short" });
    days.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1, 3), count: dailyCounts[key] || 0 });
  }
  const max = Math.max(...days.map(d => d.count), 1);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 160, padding: "0 8px" }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{d.count > 0 ? d.count : ""}</div>
          <div style={{
            width: "100%", background: i === 6 ? BLUE : BLUE_MID, borderRadius: "6px 6px 0 0",
            height: `${(d.count / max) * 120}px`, minHeight: d.count > 0 ? 4 : 0,
            transition: "height 0.4s ease",
          }} />
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const fetchData = useCallback(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setLastUpdated(new Date()); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalMessages = data?.totalMessages || 0;
  const totalConversations = data?.totalConversations || 0;
  const dailyCounts = data?.dailyCounts || {};
  const recentMessages = data?.recentMessages || [];

  // Calculate today's messages
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = dailyCounts[today] || 0;

  // Bot name usage from recent messages (same bot, different names over time)
  const botUsage = {};
  recentMessages.forEach(m => {
    if (m.botName) botUsage[m.botName] = (botUsage[m.botName] || 0) + 1;
  });
  const topBots = Object.entries(botUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / recentMessages.length) * 100) || 0 }));

  const clearAnalytics = async () => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 5000); return; }
    setConfirmClear(false);
    // Clear local state immediately so UI feels instant
    setData({ totalMessages: 0, totalConversations: 0, dailyCounts: {}, recentMessages: [] });
    const r = await fetch("/api/analytics", { method: "DELETE" });
    if (r.ok) { showToast("Historial limpiado "); fetchData(); }
    else { showToast("Error al limpiar", false); fetchData(); }
  };

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"#10B981":"#EF4444",color:"#fff",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.15)" }}>
          {toast.ok ? "" : ""} {toast.msg}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em", marginBottom: 4 }}>Analytics</h1>
          <p style={{ fontSize: 15, color: MUTED }}>
            Datos en tiempo real  {lastUpdated ? `Actualizado ${timeAgo(lastUpdated.toISOString())}` : "Cargando..."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchData} style={{ padding: "8px 16px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: MUTED, cursor: "pointer" }}> Actualizar</button>
          <button onClick={clearAnalytics} style={{ padding: "8px 16px", background: confirmClear ? "#DC2626" : "#FEF2F2", border: confirmClear ? "1.5px solid #DC2626" : "1.5px solid #FCA5A5", borderRadius: 10, fontSize: 13, fontWeight: 600, color: confirmClear ? "#FFFFFF" : "#DC2626", cursor: "pointer", transition: "all 0.2s" }}>
            {confirmClear ? "Confirmar? Haz clic de nuevo" : " Limpiar historial"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Mensajes totales", value: totalMessages.toLocaleString(), icon: "", sub: `${todayCount} hoy` },
          { label: "Conversaciones", value: totalConversations.toLocaleString(), icon: "", sub: "nicas" },
          { label: "Mensajes hoy", value: todayCount.toLocaleString(), icon: "", sub: today },
          { label: "Bots activos", value: totalMessages > 0 ? "1" : "", icon: "", sub: "configurado" },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: WHITE, borderRadius: 14, padding: "18px 20px",
            border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{kpi.icon}</div>
            </div>
            <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em" }}>{loading ? "..." : kpi.value}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 24 }}>
        {/* Bar chart */}
        <div style={{ background: WHITE, borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>Mensajes por da</h3>
            <span style={{ fontSize: 12, color: MUTED }}>ltimos 7 das</span>
          </div>
          {loading ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>Cargando...</div>
          ) : totalMessages === 0 ? (
            <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: MUTED }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}></div>
              <p style={{ fontSize: 13 }}>An no hay mensajes registrados</p>
            </div>
          ) : (
            <BarChart dailyCounts={dailyCounts} />
          )}
        </div>

        {/* Top bots */}
        <div style={{ background: WHITE, borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "22px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Historial de nombres</h3>
            <p style={{ fontSize: 11, color: MUTED }}>Nombres que tuvo tu bot en conversaciones pasadas</p>
          </div>
          {topBots.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 13, textAlign: "center", paddingTop: 40 }}>Sin datos an</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topBots.map((b, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{b.name}</span>
                    <span style={{ fontSize: 12, color: MUTED }}>{b.count} msgs</span>
                  </div>
                  <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${b.pct}%`, height: "100%", background: i === 0 ? BLUE : i === 1 ? "#60A5FA" : "#93C5FD", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent messages */}
      <div style={{ background: WHITE, borderRadius: 16, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>Mensajes Recientes</h3>
          <span style={{ fontSize: 12, color: MUTED }}>ltimos {recentMessages.length} mensajes</span>
        </div>
        {recentMessages.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: MUTED }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            <p>Los mensajes de WhatsApp aparecern aqu en tiempo real.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFF" }}>
                {["Usuario", "Bot", "Mensaje", "Tiempo"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentMessages.ma
