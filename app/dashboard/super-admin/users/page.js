"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PLAN_COLORS = { free:"#64748B", starter:"#2563EB", pro:"#7C3AED", enterprise:"#F59E0B" };
const STATUS_COLORS = { active:"#22C55E", inactive:"#EF4444", trialing:"#F59E0B", canceled:"#EF4444", past_due:"#F97316", suspended:"#EF4444" };

function Badge({ label, color }) {
  return <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${color}22`,color }}>{label}</span>;
}

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [selected, setSelected] = useState(null);
  const [toast, setToast]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(()=>setToast(null), 3000); };

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
    const r = await fetch("/api/admin/users", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ userId, action, data }) });
    const d = await r.json();
    if (d.ok) { showToast(`Acción "${action}" ejecutada`); fetchUsers(); }
    else showToast(d.error || "Error", false);
    setActionLoading(false);
  };

  const filters = [
    { key:"all", label:"Todos" },
    { key:"paid", label:"Pagando" },
    { key:"trial", label:"Trial" },
    { key:"free", label:"Free" },
    { key:"expired", label:"Expirados" },
    { key:"no_bots", label:"Sin Bots" },
  ];

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"#22C55E":"#EF4444",color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
          {toast.ok?"✅":"❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#fff",margin:0 }}>Gestión de Usuarios</h1>
          <div style={{ fontSize:13,color:"#475569",marginTop:4 }}>{users.length} usuarios</div>
        </div>
      </div>

      {/* Filters + Search */}
      <div style={{ display:"flex",gap:12,marginBottom:20,flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#475569" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            style={{ width:"100%",background:"#111118",border:"1px solid #2D2D44",borderRadius:8,padding:"9px 12px 9px 36px",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {filters.map(f => (
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              padding:"8px 14px",borderRadius:8,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",
              background: filter===f.key ? "#6366F1" : "#111118",
              borderColor: filter===f.key ? "#6366F1" : "#2D2D44",
              color: filter===f.key ? "#fff" : "#64748B",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#111118",border:"1px solid #1E1E2E",borderRadius:12,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #1E1E2E" }}>
              {["Usuario","Plan","Bots","Estado","Registro",""].map(h => (
                <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding:40,textAlign:"center",color:"#334155" }}>Cargando...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} style={{ padding:40,textAlign:"center",color:"#334155" }}>No hay usuarios</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom:"1px solid #0F0F1A" }}
                onMouseEnter={e=>e.currentTarget.style.background="#13131E"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0 }}>
                      {(u.email||"?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600,color:"#E2E8F0" }}>{u.name || u.email.split("@")[0]}</div>
                      <div style={{ fontSize:11,color:"#475569" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <Badge label={u.plan?.toUpperCase() || "FREE"} color={PLAN_COLORS[u.plan]||"#64748B"} />
                </td>
                <td style={{ padding:"12px 16px",color:"#94A3B8",fontWeight:600 }}>{u.botCount || 0}</td>
                <td style={{ padding:"12px 16px" }}>
                  <Badge label={u.subStatus||"inactive"} color={STATUS_COLORS[u.subStatus]||"#475569"} />
                </td>
                <td style={{ padding:"12px 16px",color:"#475569" }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("es") : "—"}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                    <Link href={`/dashboard/super-admin/users/${u.id}`} style={{
                      padding:"5px 10px",background:"#1A1A2E",border:"1px solid #2D2D44",borderRadius:6,color:"#818CF8",fontSize:11,fontWeight:600,textDecoration:"none",
                    }}>Ver</Link>
                    <button onClick={()=>doAction(u.id, u.subStatus==="suspended"?"reactivate":"suspend")}
                      disabled={actionLoading}
                      style={{ padding:"5px 10px",background:"#1A1A2E",border:"1px solid #2D2D44",borderRadius:6,color:u.subStatus==="suspended"?"#22C55E":"#F59E0B",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      {u.subStatus==="suspended"?"Activar":"Suspender"}
                    </button>
                    <select onChange={e => { if(e.target.value) doAction(u.id,"change_plan",{ plan:e.target.value }); e.target.value=""; }}
                      defaultValue=""
                      style={{ padding:"5px 8px",background:"#1A1A2E",border:"1px solid #2D2D44",borderRadius:6,color:"#94A3B8",fontSize:11,cursor:"pointer" }}>
                      <option value="">Plan...</option>
                      {["free","starter","pro","enterprise"].map(p => <option key={p} value={p}>{p}</option>)}
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