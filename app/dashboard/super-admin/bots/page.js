"use client";
import { useState, useEffect, useCallback } from "react";

export default function BotsPage() {
  const [bots, setBots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState(null);

  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(()=>setToast(null), 3000); };

  const fetchBots = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/bots?search=${encodeURIComponent(search)}`);
    const d = await r.json();
    setBots(d.bots || []);
    setLoading(false);
  }, [search]);

  useEffect(()=>{ fetchBots(); }, [fetchBots]);

  const doAction = async (botId, action) => {
    const r = await fetch("/api/admin/bots", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ botId, action }) });
    const d = await r.json();
    if (d.ok) { showToast(`Bot ${action}d`); fetchBots(); }
    else showToast(d.error||"Error", false);
  };

  return (
    <div>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"#22C55E":"#EF4444",color:"#0F172A",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600 }}>{toast.ok?"✅":"❌"} {toast.msg}</div>}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#0F172A",margin:0 }}>Gestión de Bots</h1>
          <div style={{ fontSize:13,color:"#64748B",marginTop:4 }}>{bots.length} bots en la plataforma</div>
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar bots..."
          style={{ padding:"9px 14px",background:"#FFFFFF",border:"1px solid #2D2D44",borderRadius:8,color:"#0F172A",fontSize:13,outline:"none",width:300 }} />
      </div>
      <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #1E1E2E" }}>
              {["Bot","Usuario","Estado","WhatsApp","Creado","Acciones"].map(h=>(
                <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ padding:40,textAlign:"center",color:"#94A3B8" }}>Cargando...</td></tr>}
            {!loading && bots.length === 0 && <tr><td colSpan={6} style={{ padding:40,textAlign:"center",color:"#94A3B8" }}>No hay bots</td></tr>}
            {bots.map(b=>(
              <tr key={b.id} style={{ borderBottom:"1px solid #0F0F1A" }}
                onMouseEnter={e=>e.currentTarget.style.background="#13131E"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontWeight:600,color:"#0F172A" }}>{b.name}</div>
                  <div style={{ fontSize:11,color:"#64748B" }}>@{b.handle}</div>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontSize:12,color:"#64748B" }}>{b.userEmail}</div>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:b.status==="active"?"#22C55E22":"#EF444422",color:b.status==="active"?"#22C55E":"#EF4444" }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding:"12px 16px",color:"#64748B",fontSize:12 }}>
                  {b.phone_number_id ? "✅ Conectado" : "❌ No"}
                </td>
                <td style={{ padding:"12px 16px",color:"#64748B",fontSize:12 }}>
                  {b.created_at ? new Date(b.created_at).toLocaleDateString("es") : "—"}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>doAction(b.id, b.status==="active"?"disable":"enable")}
                      style={{ padding:"5px 10px",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:6,color:b.status==="active"?"#F59E0B":"#22C55E",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      {b.status==="active"?"⏸️":"▶️"}
                    </button>
                    <button onClick={()=>{ if(confirm("¿Eliminar bot?")) doAction(b.id,"delete"); }}
                      style={{ padding:"5px 10px",background:"#F8FAFF",border:"1px solid #EF444422",borderRadius:6,color:"#EF4444",fontSize:11,cursor:"pointer" }}>
                      🗑️
                    </button>
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