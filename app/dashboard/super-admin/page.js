"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function KPI({ label, value, sub, icon, color, href }) {
  const card = (
    <div style={{
      background:"#FFFFFF", border:"1px solid #1E1E2E", borderRadius:12, padding:"20px 24px",
      cursor: href ? "pointer" : "default",
      transition:"border-color .2s",
    }}
    onMouseEnter={e => href && (e.currentTarget.style.borderColor="#2563EB")}
    onMouseLeave={e => href && (e.currentTarget.style.borderColor="#0F172A")}
    >
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12 }}>
        <div style={{ fontSize:22 }}>{icon}</div>
        <div style={{ fontSize:11,fontWeight:600,color:color||"#2563EB",background:`${color||"#2563EB"}22`,padding:"2px 8px",borderRadius:20 }}>
          {sub}
        </div>
      </div>
      <div style={{ fontSize:32,fontWeight:800,color:"#0F172A",lineHeight:1 }}>{value ?? "—"}</div>
      <div style={{ fontSize:12,color:"#64748B",marginTop:6 }}>{label}</div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration:"none" }}>{card}</Link> : card;
}

function ActivityItem({ type, label, time }) {
  const icons = { user:"👤", bot:"🤖", payment:"💳", upgrade:"⬆️", failed:"❌", broadcast:"📢" };
  const colors = { user:"#22C55E", bot:"#2563EB", payment:"#10B981", upgrade:"#F59E0B", failed:"#EF4444", broadcast:"#8B5CF6" };
  return (
    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #1A1A2E" }}>
      <div style={{ width:32,height:32,borderRadius:8,background:`${colors[type]||"#64748B"}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>
        {icons[type]||"•"}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,color:"#0F172A",fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:11,color:"#94A3B8" }}>{time}</div>
      </div>
    </div>
  );
}

function MiniChart({ data, color }) {
  if (!data || data.length === 0) return <div style={{ color:"#94A3B8",fontSize:12 }}>Sin datos</div>;
  const max = Math.max(...data.map(d=>d.count), 1);
  return (
    <div style={{ display:"flex",alignItems:"flex-end",gap:2,height:40 }}>
      {data.slice(-20).map((d,i) => (
        <div key={i} title={`${d.date}: ${d.count}`}
          style={{ flex:1,background:color||"#2563EB",borderRadius:"2px 2px 0 0",opacity:.7+.3*(d.count/max),
            height:`${Math.max(4, (d.count/max)*40)}px`, minWidth:4 }} />
      ))}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/metrics");
      const d = await r.json();
      setMetrics(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMetrics(); const t = setInterval(fetchMetrics, 30000); return () => clearInterval(t); }, [fetchMetrics]);

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"60vh" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40,marginBottom:12,animation:"spin 1s linear infinite" }}>⚡</div>
        <div style={{ color:"#64748B" }}>Cargando métricas...</div>
      </div>
    </div>
  );

  const m = metrics || {};
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es", { hour:"2-digit", minute:"2-digit" });

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:"#0F172A",margin:0 }}>Control Center</h1>
          <div style={{ fontSize:13,color:"#64748B",marginTop:4 }}>AgentFlow Super Admin · Actualizado {timeStr}</div>
        </div>
        <button onClick={fetchMetrics} style={{ background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:8,padding:"8px 16px",color:"#2563EB",fontSize:13,cursor:"pointer" }}>
          ↻ Actualizar
        </button>
      </div>

      {/* KPI Grid — row 1: users */}
      <div style={{ fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:1,marginBottom:10,textTransform:"uppercase" }}>Usuarios</div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24 }}>
        <KPI icon="👥" label="Total Usuarios"   value={m.totalUsers}    sub="total"   color="#2563EB" href="/dashboard/super-admin/users" />
        <KPI icon="✅" label="Activos"          value={m.activeUsers}   sub="activos" color="#22C55E" href="/dashboard/super-admin/users?filter=active" />
        <KPI icon="🧪" label="Trial"            value={m.trialUsers}    sub="trial"   color="#F59E0B" href="/dashboard/super-admin/users?filter=trial" />
        <KPI icon="💎" label="Pagando"          value={m.paidUsers}     sub="paid"    color="#8B5CF6" href="/dashboard/super-admin/users?filter=paid" />
        <KPI icon="⏸️" label="Expirados"        value={m.expiredUsers}  sub="exp."    color="#EF4444" href="/dashboard/super-admin/users?filter=expired" />
        <KPI icon="🆓" label="Plan Free"        value={m.freeUsers}     sub="free"    color="#64748B" href="/dashboard/super-admin/users?filter=free" />
      </div>

      {/* KPI Grid — row 2: platform */}
      <div style={{ fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:1,marginBottom:10,textTransform:"uppercase" }}>Plataforma</div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24 }}>
        <KPI icon="🤖" label="Total Bots"       value={m.totalBots}     sub="bots"    color="#06B6D4" href="/dashboard/super-admin/bots" />
        <KPI icon="🟢" label="Bots Activos"     value={m.activeBots}    sub="activos" color="#22C55E" href="/dashboard/super-admin/bots" />
        <KPI icon="💬" label="Conversaciones"   value={m.conversationsProcessed} sub="total" color="#2563EB" />
        <KPI icon="📨" label="Mensajes"         value={m.messagesProcessed} sub="total" color="#8B5CF6" />
        <KPI icon="📅" label="Nuevos Hoy"       value={m.newUsersToday} sub="hoy"     color="#22C55E" />
        <KPI icon="📆" label="Nuevos Esta Semana" value={m.newUsersWeek} sub="semana" color="#F59E0B" />
      </div>

      {/* Charts + Activity */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 380px",gap:20,marginBottom:24 }}>
        {/* Growth chart */}
        <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
            <div style={{ fontWeight:700,fontSize:15,color:"#0F172A" }}>Crecimiento de Usuarios (30 días)</div>
            <div style={{ fontSize:12,color:"#64748B" }}>+{m.newUsersMonth} este mes</div>
          </div>
          <MiniChart data={m.growth || []} color="#2563EB" />
          {(m.growth||[]).length === 0 && (
            <div style={{ height:40,display:"flex",alignItems:"center",justifyContent:"center",color:"#94A3B8",fontSize:12 }}>
              Sin datos de crecimiento aún
            </div>
          )}
        </div>

        {/* Plan distribution */}
        <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24 }}>
          <div style={{ fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:16 }}>Distribución de Planes</div>
          {Object.entries(m.planDistribution || { free:0, starter:0, pro:0, enterprise:0 }).map(([plan,count]) => {
            const colors2 = { free:"#64748B", starter:"#2563EB", pro:"#7C3AED", enterprise:"#0F172A" };
            const labels2 = { free:"Free", starter:"Starter", pro:"Pro", enterprise:"Enterprise" };
            const total = m.totalUsers || 1;
            const pct = Math.round((count/total)*100);
            return (
              <div key={plan} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12,color:"#64748B",fontWeight:600 }}>{labels2[plan]||plan}</span>
                  <span style={{ fontSize:12,color:"#64748B" }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height:6,background:"#F8FAFF",borderRadius:3 }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:colors2[plan]||"#2563EB",borderRadius:3,transition:"width .5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
        <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24 }}>
          <div style={{ fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:4 }}>Bots Recientes</div>
          <div style={{ fontSize:12,color:"#64748B",marginBottom:16 }}>Últimos bots creados</div>
          {(m.recentBots || []).length === 0 && <div style={{ color:"#94A3B8",fontSize:13 }}>Sin actividad reciente</div>}
          {(m.recentBots || []).map(b => (
            <ActivityItem key={b.id} type="bot" label={`Bot "${b.name}" creado`} time={new Date(b.created_at).toLocaleDateString("es")} />
          ))}
        </div>
        <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24 }}>
          <div style={{ fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:4 }}>Suscripciones Recientes</div>
          <div style={{ fontSize:12,color:"#64748B",marginBottom:16 }}>Últimos cambios de plan</div>
          {(m.recentSubscriptions || []).length === 0 && <div style={{ color:"#94A3B8",fontSize:13 }}>Sin actividad reciente</div>}
          {(m.recentSubscriptions || []).map((s,i) => (
            <ActivityItem key={i} type={s.status==="active"?"payment":"failed"} label={`Plan ${s.plan} · ${s.status}`} time={new Date(s.updated_at).toLocaleDateString("es")} />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop:24,background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24 }}>
        <div style={{ fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:16 }}>Acciones Rápidas</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
          {[
            { label:"Ver Usuarios",     href:"/dashboard/super-admin/users",         icon:"👥" },
            { label:"Gestionar Bots",   href:"/dashboard/super-admin/bots",          icon:"🤖" },
            { label:"Enviar Anuncio",   href:"/dashboard/super-admin/announcements", icon:"📢" },
            { label:"Editar Planes",    href:"/dashboard/super-admin/plans",         icon:"💎" },
            { label:"Facturación",      href:"/dashboard/super-admin/billing",       icon:"💳" },
            { label:"Editar Landing",   href:"/dashboard/super-admin/landing-cms",   icon:"🌐" },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{
              display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:"#F8FAFF",
              border:"1px solid #2D2D44",borderRadius:8,textDecoration:"none",color:"#64748B",fontSize:13,fontWeight:500,
            }}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}