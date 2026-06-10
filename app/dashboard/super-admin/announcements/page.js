"use client";
import { useState, useEffect, useCallback } from "react";

const PRIORITIES = [
  { key:"info",      label:"Info",      color:"#2563EB" },
  { key:"update",    label:"Update",    color:"#22C55E" },
  { key:"important", label:"Importante",color:"#F59E0B" },
  { key:"critical",  label:"Crítico",   color:"#EF4444" },
];
const SEGMENTS = [
  { key:"all",      label:"Todos los usuarios" },
  { key:"paid",     label:"Usuarios de pago" },
  { key:"trial",    label:"Trial" },
  { key:"free",     label:"Plan Free" },
  { key:"expired",  label:"Expirados" },
];
const CHANNELS = [
  { key:"in_app",    label:"🔔 In-App" },
  { key:"email",     label:"📧 Email" },
  { key:"whatsapp",  label:"💬 WhatsApp" },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending]   = useState(null);
  const [toast, setToast]       = useState(null);
  const [form, setForm]         = useState({ title:"", message:"", cta_text:"", cta_url:"", priority:"info", channels:["in_app"], target_segment:"all" });

  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(()=>setToast(null), 3000); };

  const fetchAnn = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/announcements");
    const d = await r.json();
    setAnnouncements(d.announcements || []);
    setLoading(false);
  }, []);

  useEffect(()=>{ fetchAnn(); }, [fetchAnn]);

  const create = async () => {
    if (!form.title || !form.message) { showToast("Título y mensaje requeridos", false); return; }
    const r = await fetch("/api/admin/announcements", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"create", ...form }) });
    const d = await r.json();
    if (d.announcement) { showToast("Anuncio creado"); setCreating(false); fetchAnn(); setForm({ title:"", message:"", cta_text:"", cta_url:"", priority:"info", channels:["in_app"], target_segment:"all" }); }
    else showToast(d.error||"Error", false);
  };

  const sendNow = async (id) => {
    setSending(id);
    const r = await fetch("/api/admin/announcements", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"send", announcementId: id }) });
    const d = await r.json();
    if (d.ok) showToast(`Enviado a ${d.sent} usuarios ✅`);
    else showToast(d.error||"Error", false);
    setSending(null);
    fetchAnn();
  };

  const deleteAnn = async (id) => {
    await fetch("/api/admin/announcements", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"delete", announcementId: id }) });
    showToast("Eliminado");
    fetchAnn();
  };

  const priorityInfo = (key) => PRIORITIES.find(p=>p.key===key) || PRIORITIES[0];
  const STATUS_COLORS = { draft:"#64748B", scheduled:"#F59E0B", sent:"#22C55E", archived:"#94A3B8" };

  const toggleChannel = (ch) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c=>c!==ch) : [...f.channels, ch],
    }));
  };

  return (
    <div>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"#22C55E":"#EF4444",color:"#0F172A",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600 }}>{toast.ok?"✅":"❌"} {toast.msg}</div>}

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#0F172A",margin:0 }}>Centro de Anuncios</h1>
          <div style={{ fontSize:13,color:"#64748B",marginTop:4 }}>Envía comunicaciones a tus usuarios</div>
        </div>
        <button onClick={()=>setCreating(true)} style={{ padding:"9px 18px",background:"#2563EB",border:"none",borderRadius:8,color:"#0F172A",fontSize:13,fontWeight:600,cursor:"pointer" }}>
          + Nuevo Anuncio
        </button>
      </div>

      {/* Create modal */}
      {creating && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"#FFFFFF",border:"1px solid #2D2D44",borderRadius:16,padding:32,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto" }}>
            <h3 style={{ color:"#0F172A",margin:"0 0 24px",fontSize:18 }}>Crear Anuncio</h3>

            {[["title","Título","text"],["message","Mensaje","textarea"],["cta_text","Texto del botón CTA","text"],["cta_url","URL del CTA","text"]].map(([k,label,type])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>{label}</label>
                {type==="textarea"
                  ? <textarea rows={3} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                      style={{ width:"100%",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:7,padding:"8px 12px",color:"#0F172A",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box" }} />
                  : <input type={type} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                      style={{ width:"100%",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:7,padding:"8px 12px",color:"#0F172A",fontSize:13,outline:"none",boxSizing:"border-box" }} />
                }
              </div>
            ))}

            {/* Priority */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:8 }}>Prioridad</label>
              <div style={{ display:"flex",gap:8 }}>
                {PRIORITIES.map(p=>(
                  <button key={p.key} onClick={()=>setForm(f=>({...f,priority:p.key}))} style={{
                    padding:"6px 12px",borderRadius:6,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",
                    background: form.priority===p.key ? `${p.color}22` : "#F8FAFF",
                    borderColor: form.priority===p.key ? p.color : "#0F172A",
                    color: form.priority===p.key ? p.color : "#64748B",
                  }}>{p.label}</button>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:8 }}>Canales</label>
              <div style={{ display:"flex",gap:8 }}>
                {CHANNELS.map(c=>(
                  <button key={c.key} onClick={()=>toggleChannel(c.key)} style={{
                    padding:"6px 12px",borderRadius:6,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",
                    background: form.channels.includes(c.key) ? "#6366F122" : "#F8FAFF",
                    borderColor: form.channels.includes(c.key) ? "#2563EB" : "#0F172A",
                    color: form.channels.includes(c.key) ? "#2563EB" : "#64748B",
                  }}>{c.label}</button>
                ))}
              </div>
            </div>

            {/* Segment */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>Segmento destino</label>
              <select value={form.target_segment} onChange={e=>setForm(f=>({...f,target_segment:e.target.value}))}
                style={{ width:"100%",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:7,padding:"8px 12px",color:"#0F172A",fontSize:13,outline:"none" }}>
                {SEGMENTS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div style={{ display:"flex",gap:10 }}>
              <button onClick={create} style={{ flex:1,padding:"10px",background:"#2563EB",border:"none",borderRadius:8,color:"#0F172A",fontSize:14,fontWeight:700,cursor:"pointer" }}>
                Crear Anuncio
              </button>
              <button onClick={()=>setCreating(false)} style={{ padding:"10px 16px",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:8,color:"#64748B",fontSize:13,cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {loading && <div style={{ color:"#64748B",textAlign:"center",padding:40 }}>Cargando...</div>}
        {!loading && announcements.length === 0 && (
          <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:60,textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>📢</div>
            <div style={{ color:"#64748B" }}>No hay anuncios aún. ¡Crea el primero!</div>
          </div>
        )}
        {announcements.map(a => {
          const pi = priorityInfo(a.priority);
          return (
            <div key={a.id} style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:20 }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${pi.color}22`,color:pi.color }}>{pi.label}</span>
                    <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${STATUS_COLORS[a.status]||"#64748B"}22`,color:STATUS_COLORS[a.status]||"#64748B" }}>{a.status}</span>
                    <span style={{ fontSize:11,color:"#94A3B8" }}>{new Date(a.created_at).toLocaleDateString("es")}</span>
                  </div>
                  <div style={{ fontWeight:700,color:"#0F172A",fontSize:15,marginBottom:4 }}>{a.title}</div>
                  <div style={{ fontSize:13,color:"#64748B",lineHeight:1.5 }}>{a.message}</div>
                  {a.delivery_stats?.sent > 0 && (
                    <div style={{ fontSize:11,color:"#22C55E",marginTop:8 }}>✅ Enviado a {a.delivery_stats.sent} usuarios</div>
                  )}
                </div>
                <div style={{ display:"flex",gap:8,flexShrink:0 }}>
                  {a.status !== "sent" && (
                    <button onClick={()=>sendNow(a.id)} disabled={sending===a.id}
                      style={{ padding:"7px 14px",background:"#22C55E",border:"none",borderRadius:7,color:"#0F172A",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                      {sending===a.id?"Enviando...":"▶ Enviar Ahora"}
                    </button>
                  )}
                  <button onClick={()=>deleteAnn(a.id)}
                    style={{ padding:"7px 10px",background:"#F8FAFF",border:"1px solid #EF444422",borderRadius:7,color:"#EF4444",fontSize:12,cursor:"pointer" }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}