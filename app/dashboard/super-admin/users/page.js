"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PLAN_COLORS = { free:"#64748B", starter:"#3B82F6", pro:"#8B5CF6", enterprise:"#F59E0B" };
const STATUS_COLORS = { active:"#22C55E", inactive:"#64748B", trialing:"#F59E0B", canceled:"#EF4444", past_due:"#F97316", suspended:"#EF4444" };

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,
      background:`${color}1A`,color,border:`1px solid ${color}30`,
      letterSpacing:.3,
    }}>{label?.toUpperCase()}</span>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={6}>
        <div style={{ padding:"60px 20px",textAlign:"center" }}>
          <div style={{ fontSize:40,marginBottom:12,opacity:.4 }}>👥</div>
          <div style={{ fontSize:14,fontWeight:600,color:"#475569",marginBottom:6 }}>No hay usuarios</div>
          <div style={{ fontSize:12,color:"#334155" }}>Los usuarios aparecerán aquí una vez que se registren.</div>
        </div>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [toast, setToast]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok });
    setTimeout(()=>setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&filter=${filter}`);
      const d = await r.json();
      setUsers(d.users || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const doAction = async (userId, action, data={}) => {
    setActionLoading(true);
    try {
      const r = await fetch("/api/admin/users", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userId, action, data }),
      });
      const d = await r.json();
      if (d.ok) { showToast(`Acción "${action}" ejecutada`); fetchUsers(); }
      else showToast(d.error || "Error", false);
    } catch { showToast("Error de conexión", false); }
    setActionLoading(false);
  };

  const filters = [
    { key:"all",    label:"Todos" },
    { key:"paid",   label:"Pagando" },
    { key:"trial",  label:"Trial" },
    { key:"free",   label:"Free" },
    { key:"expired",label:"Expirados" },
    { key:"no_bots",label:"Sin Bots" },
  ];

  return (
    <div style={{ maxWidth:1100 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",top:20,right:20,zIndex:9999,
          background:toast.ok?"#16A34A":"#DC2626",
          color:"#fff",padding:"12px 18px",borderRadius:10,
          fontSize:13,fontWeight:600,
          boxShadow:`0 8px 24px rgba(0,0,0,.4)`,
          animation:"fadeIn .2s ease",
        }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:"#6366F1",letterSpacing:1,marginBottom:6 }}>ADMINISTRACIÓN</div>
            <h1 style={{ fontSize:24,fontWeight:800,color:"#F1F5F9",margin:0,letterSpacing:-.3 }}>Gestión de Usuarios</h1>
          </div>
          <div style={{
            background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",
            borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:600,color:"#818CF8",
          }}>
            {users.length} {users.length === 1 ? "usuario" : "usuarios"}
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#475569",fontSize:12,pointerEvents:"none" }}>🔍</span>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            style={{
              width:"100%",background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(99,102,241,.15)",borderRadius:8,
              padding:"8px 12px 8px 32px",color:"#CBD5E1",fontSize:12,
              outline:"none",boxSizing:"border-box",
            }}
          />
        </div>
        <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
          {filters.map(f => (
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              padding:"7px 14px",borderRadius:8,border:"1px solid",fontSize:11,
              fontWeight:600,cursor:"pointer",transition:"all .12s",
              background: filter===f.key ? "#6366F1" : "rgba(255,255,255,.04)",
              borderColor: filter===f.key ? "#6366F1" : "rgba(99,102,241,.15)",
              color: filter===f.key ? "#fff" : "#64748B",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background:"rgba(17,17,28,.8)",
        border:"1px solid rgba(99,102,241,.12)",
        borderRadius:12,overflow:"hidden",
        boxShadow:"0 4px 24px rgba(0,0,0,.3)",
      }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(99,102,241,.12)" }}>
              {["Usuario","Plan","Bots","Estado","Registro","Acciones"].map(h => (
                <th key={h} style={{
                  padding:"11px 16px",textAlign:"left",
                  fontSize:10,fontWeight:700,color:"#475569",
                  textTransform:"uppercase",letterSpacing:.8,
                  background:"rgba(99,102,241,.04)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding:40,textAlign:"center",color:"#334155",fontSize:13 }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    <span style={{ animation:"spin 1s linear infinite",display:"inline-block" }}>⟳</span>
                    Cargando usuarios...
                  </div>
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && <EmptyState />}
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom:"1px solid rgba(99,102,241,.06)",transition:"background .1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,.05)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{
                      width:34,height:34,borderRadius:10,flexShrink:0,
                      background:`linear-gradient(135deg,${["#6366F1","#8B5CF6","#3B82F6","#EC4899"][i%4]},${["#4F46E5","#7C3AED","#2563EB","#DB2777"][i%4]})`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:13,fontWeight:700,color:"#fff",
                    }}>
                      {(u.name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600,color:"#E2E8F0",fontSize:13 }}>
                        {u.name || u.email?.split("@")[0] || "—"}
                      </div>
                      <div style={{ fontSize:11,color:"#475569",marginTop:1 }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <Badge label={u.plan || "free"} color={PLAN_COLORS[u.plan] || "#64748B"} />
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ color:"#94A3B8",fontWeight:700,fontSize:14 }}>{u.botCount || 0}</span>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <Badge label={u.subStatus || "inactive"} color={STATUS_COLORS[u.subStatus] || "#475569"} />
                </td>
                <td style={{ padding:"12px 16px",color:"#475569",fontSize:12 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"2-digit"}) : "—"}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex",gap:5,alignItems:"center" }}>
                    <Link href={`/dashboard/super-admin/users/${u.id}`} style={{
                      padding:"5px 11px",
                      background:"rgba(99,102,241,.15)",
                      border:"1px solid rgba(99,102,241,.3)",
                      borderRadius:6,color:"#818CF8",fontSize:11,
                      fontWeight:600,textDecoration:"none",transition:"all .12s",
                    }}>Ver →</Link>
                    <button
                      onClick={()=>doAction(u.id, u.subStatus==="suspended"?"reactivate":"suspend")}
                      disabled={actionLoading}
                      style={{
                        padding:"5px 11px",
                        background: u.subStatus==="suspended" ? "rgba(34,197,94,.12)" : "rgba(245,158,11,.1)",
                        border:`1px solid ${u.subStatus==="suspended"?"rgba(34,197,94,.3)":"rgba(245,158,11,.3)"}`,
                        borderRadius:6,
                        color: u.subStatus==="suspended" ? "#22C55E" : "#F59E0B",
                        fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .12s",
                      }}>
                      {u.subStatus==="suspended" ? "Activar" : "Suspender"}
                    </button>
                    <select
                      onChange={e=>{ if(e.target.value) doAction(u.id,"change_plan",{ plan:e.target.value }); e.target.value=""; }}
                      defaultValue=""
                      style={{
                        padding:"5px 8px",
                        background:"rgba(255,255,255,.04)",
                        border:"1px solid rgba(99,102,241,.15)",
                        borderRadius:6,color:"#64748B",fontSize:11,cursor:"pointer",
                      }}>
                      <option value="">Plan...</option>
                      {["free","starter","pro","enterprise"].map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
