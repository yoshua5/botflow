"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PLAN_COLORS  = { free:"#64748B", starter:"#2563EB", pro:"#7C3AED", enterprise:"#D97706" };
const STATUS_COLORS = { active:"#10B981", inactive:"#64748B", trialing:"#F59E0B", canceled:"#EF4444", past_due:"#F97316", suspended:"#EF4444" };

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,
      background:`${color}15`,color,border:`1px solid ${color}30`,
      letterSpacing:.2,display:"inline-block",
    }}>{label?.toUpperCase()}</span>
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

  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(()=>setToast(null),3000); };

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
      const r = await fetch("/api/admin/users",{ method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,action,data}) });
      const d = await r.json();
      if(d.ok){ showToast(`Acción "${action}" ejecutada`); fetchUsers(); }
      else showToast(d.error||"Error",false);
    } catch { showToast("Error de conexión",false); }
    setActionLoading(false);
  };

  const filters = [
    {key:"all",label:"Todos"},{key:"paid",label:"Pagando"},{key:"trial",label:"Trial"},
    {key:"free",label:"Free"},{key:"expired",label:"Expirados"},{key:"no_bots",label:"Sin Bots"},
  ];

  const avatarColors = ["#2563EB","#7C3AED","#10B981","#F59E0B","#EF4444","#06B6D4"];

  return (
    <div style={{ maxWidth:1100 }}>
      {toast && (
        <div style={{
          position:"fixed",top:20,right:20,zIndex:9999,
          background:toast.ok?"#10B981":"#EF4444",
          color:"#fff",padding:"11px 18px",borderRadius:10,
          fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.15)",
        }}>
          {toast.ok?"✓":"✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24,display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:"#2563EB",letterSpacing:1,marginBottom:4 }}>ADMINISTRACIÓN</div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#0F172A",margin:0 }}>Gestión de Usuarios</h1>
        </div>
        <div style={{ background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:600,color:"#2563EB" }}>
          {users.length} {users.length===1?"usuario":"usuarios"}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#94A3B8",fontSize:12,pointerEvents:"none" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            style={{
              width:"100%",background:"#fff",border:"1px solid #E2E8F0",borderRadius:8,
              padding:"8px 12px 8px 32px",color:"#0F172A",fontSize:13,outline:"none",boxSizing:"border-box",
            }}
          />
        </div>
        <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
          {filters.map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              padding:"7px 14px",borderRadius:8,border:"1px solid",fontSize:12,
              fontWeight:600,cursor:"pointer",transition:"all .1s",
              background: filter===f.key ? "#2563EB" : "#fff",
              borderColor: filter===f.key ? "#2563EB" : "#E2E8F0",
              color: filter===f.key ? "#fff" : "#64748B",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,.06)" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #F1F5F9",background:"#F8FAFF" }}>
              {["Usuario","Plan","Bots","Estado","Registro","Acciones"].map(h=>(
                <th key={h} style={{
                  padding:"11px 16px",textAlign:"left",
                  fontSize:11,fontWeight:700,color:"#64748B",
                  textTransform:"uppercase",letterSpacing:.7,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding:40,textAlign:"center",color:"#94A3B8",fontSize:13 }}>Cargando usuarios...</td></tr>
            )}
            {!loading && users.length===0 && (
              <tr>
                <td colSpan={6}>
                  <div style={{ padding:"60px 20px",textAlign:"center" }}>
                    <div style={{ fontSize:36,marginBottom:12,opacity:.3 }}>👥</div>
                    <div style={{ fontSize:14,fontWeight:600,color:"#475569",marginBottom:4 }}>No hay usuarios</div>
                    <div style={{ fontSize:12,color:"#94A3B8" }}>Los usuarios aparecerán aquí cuando se registren.</div>
                  </div>
                </td>
              </tr>
            )}
            {users.map((u,i)=>(
              <tr key={u.id} style={{ borderBottom:"1px solid #F8FAFF",transition:"background .1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFF"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{
                      width:34,height:34,borderRadius:10,flexShrink:0,
                      background:avatarColors[i%avatarColors.length],
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:13,fontWeight:700,color:"#fff",
                    }}>
                      {(u.name||u.email||"?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600,color:"#0F172A",fontSize:13 }}>{u.name||u.email?.split("@")[0]||"—"}</div>
                      <div style={{ fontSize:11,color:"#94A3B8",marginTop:1 }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <Badge label={u.plan||"free"} color={PLAN_COLORS[u.plan]||"#64748B"} />
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontWeight:700,color:"#0F172A",fontSize:15 }}>{u.botCount||0}</span>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <Badge label={u.subStatus||"inactive"} color={STATUS_COLORS[u.subStatus]||"#64748B"} />
                </td>
                <td style={{ padding:"12px 16px",color:"#64748B",fontSize:12 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"2-digit"}) : "—"}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex",gap:5,alignItems:"center" }}>
                    <Link href={`/dashboard/super-admin/users/${u.id}`} style={{
                      padding:"5px 11px",background:"#EFF6FF",border:"1px solid #BFDBFE",
                      borderRadius:6,color:"#2563EB",fontSize:11,fontWeight:600,textDecoration:"none",
                    }}>Ver →</Link>
                    <button onClick={()=>doAction(u.id,u.subStatus==="suspended"?"reactivate":"suspend")} disabled={actionLoading} style={{
                      padding:"5px 11px",border:"1px solid",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",
                      background: u.subStatus==="suspended" ? "#F0FDF4" : "#FFFBEB",
                      borderColor: u.subStatus==="suspended" ? "#BBF7D0" : "#FDE68A",
                      color: u.subStatus==="suspended" ? "#10B981" : "#D97706",
                    }}>
                      {u.subStatus==="suspended"?"Activar":"Suspender"}
                    </button>
                    <select onChange={e=>{ if(e.target.value) doAction(u.id,"change_plan",{plan:e.target.value}); e.target.value=""; }} defaultValue=""
                      style={{ padding:"5px 8px",background:"#fff",border:"1px solid #E2E8F0",borderRadius:6,color:"#64748B",fontSize:11,cursor:"pointer" }}>
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
