"use client";
import { useState, useEffect, useCallback } from "react";

const DEFAULT_PLAN = { id:"", name:"", price:0, interval:"month", color:"#2563EB", badge:"", limits:{ bots:1, messagesPerMonth:1000, knowledgeFiles:10, analytics:false, whatsapp:false }, features:[] };

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(DEFAULT_PLAN);
  const [toast, setToast]     = useState(null);
  const [saving, setSaving]   = useState(false);

  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(()=>setToast(null), 3000); };

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/plans");
    const d = await r.json();
    setPlans(d.plans || []);
    setLoading(false);
  }, []);

  useEffect(()=>{ fetchPlans(); }, [fetchPlans]);

  const save = async () => {
    setSaving(true);
    const method = editing === "new" ? "POST" : "PATCH";
    const body = editing === "new" ? form : { ...form, id: editing };
    const r = await fetch("/api/admin/plans", { method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.plan || d.ok) { showToast("Plan guardado"); fetchPlans(); setEditing(null); }
    else showToast(d.error||"Error", false);
    setSaving(false);
  };

  const deletePlan = async (id) => {
    if (!confirm("¿Eliminar plan?")) return;
    await fetch(`/api/admin/plans?id=${id}`, { method:"DELETE" });
    showToast("Plan eliminado");
    fetchPlans();
  };

  const PLAN_COLORS = { free:"#64748B", starter:"#2563EB", pro:"#7C3AED", enterprise:"#F59E0B" };

  return (
    <div>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"#22C55E":"#EF4444",color:"#0F172A",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600 }}>{toast.ok?"✅":"❌"} {toast.msg}</div>}

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#0F172A",margin:0 }}>Gestión de Planes</h1>
          <div style={{ fontSize:13,color:"#64748B",marginTop:4 }}>Crea y modifica los planes de AgentFlow</div>
        </div>
        <button onClick={()=>{ setForm(DEFAULT_PLAN); setEditing("new"); }}
          style={{ padding:"9px 18px",background:"#2563EB",border:"none",borderRadius:8,color:"#0F172A",fontSize:13,fontWeight:600,cursor:"pointer" }}>
          + Nuevo Plan
        </button>
      </div>

      {/* Plan cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginBottom:24 }}>
        {loading && <div style={{ color:"#64748B" }}>Cargando...</div>}
        {plans.map(p => (
          <div key={p.id} style={{ background:"#FFFFFF",border:`1px solid ${PLAN_COLORS[p.id]||"#0F172A"}44`,borderRadius:12,padding:20 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:16,color:"#0F172A" }}>{p.name}</div>
                {p.badge && <div style={{ fontSize:10,fontWeight:700,color:PLAN_COLORS[p.id]||"#2563EB",textTransform:"uppercase" }}>{p.badge}</div>}
              </div>
              <div style={{ fontSize:22,fontWeight:800,color:PLAN_COLORS[p.id]||"#2563EB" }}>${p.price}</div>
            </div>
            <div style={{ fontSize:12,color:"#64748B",marginBottom:12 }}>/{p.interval||"mes"}</div>
            <div style={{ fontSize:11,color:"#64748B",lineHeight:1.8 }}>
              <div>Bots: {p.limits?.bots === -1 ? "∞" : p.limits?.bots}</div>
              <div>Mensajes: {p.limits?.messagesPerMonth === -1 ? "∞" : (p.limits?.messagesPerMonth||0).toLocaleString()}/mes</div>
              <div>WhatsApp: {p.limits?.whatsapp ? "✅" : "❌"}</div>
              <div>Analytics: {p.limits?.analytics ? "✅" : "❌"}</div>
            </div>
            <div style={{ display:"flex",gap:8,marginTop:16 }}>
              <button onClick={()=>{ setForm({ ...DEFAULT_PLAN, ...p, limits: { ...DEFAULT_PLAN.limits, ...p.limits } }); setEditing(p.id); }}
                style={{ flex:1,padding:"7px",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:7,color:"#2563EB",fontSize:12,fontWeight:600,cursor:"pointer" }}>
                ✏️ Editar
              </button>
              <button onClick={()=>deletePlan(p.id)}
                style={{ padding:"7px 12px",background:"#F8FAFF",border:"1px solid #EF444422",borderRadius:7,color:"#EF4444",fontSize:12,cursor:"pointer" }}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"#FFFFFF",border:"1px solid #2D2D44",borderRadius:16,padding:32,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto" }}>
            <h3 style={{ color:"#0F172A",margin:"0 0 24px" }}>{editing==="new"?"Nuevo Plan":"Editar Plan"}</h3>
            {[
              ["id","ID (ej: starter)","text"],
              ["name","Nombre","text"],
              ["price","Precio ($)","number"],
              ["interval","Intervalo (month/year)","text"],
              ["color","Color (hex)","text"],
              ["badge","Badge (ej: Más popular)","text"],
            ].map(([k,label,type])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>{label}</label>
                <input type={type} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:type==="number"?Number(e.target.value):e.target.value}))}
                  style={{ width:"100%",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:7,padding:"8px 12px",color:"#0F172A",fontSize:13,outline:"none",boxSizing:"border-box" }} />
              </div>
            ))}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
              {[["bots","Bots","number"],["messagesPerMonth","Mensajes/mes","number"],["knowledgeFiles","Archivos KB","number"]].map(([k,label,type])=>(
                <div key={k}>
                  <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>{label}</label>
                  <input type={type} value={form.limits?.[k]||0} onChange={e=>setForm(f=>({...f,limits:{...f.limits,[k]:Number(e.target.value)}}))}
                    style={{ width:"100%",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:7,padding:"8px 12px",color:"#0F172A",fontSize:13,outline:"none",boxSizing:"border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:16,marginBottom:20 }}>
              {[["analytics","Analytics"],["whatsapp","WhatsApp"]].map(([k,label])=>(
                <label key={k} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#64748B" }}>
                  <input type="checkbox" checked={!!form.limits?.[k]} onChange={e=>setForm(f=>({...f,limits:{...f.limits,[k]:e.target.checked}}))} />
                  {label}
                </label>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={save} disabled={saving} style={{ flex:1,padding:"10px",background:"#2563EB",border:"none",borderRadius:8,color:"#0F172A",fontSize:14,fontWeight:700,cursor:"pointer" }}>
                {saving?"Guardando...":"Guardar Plan"}
              </button>
              <button onClick={()=>setEditing(null)} style={{ padding:"10px 16px",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:8,color:"#64748B",fontSize:13,cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}