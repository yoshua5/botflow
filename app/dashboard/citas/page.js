"use client";
import { useState, useEffect } from "react";

const BG     = "#F8FAFF";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";
const TEXT   = "#0F172A";
const BLUE   = "#2563EB";
const BLUE_L = "#EFF6FF";

const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const STATUS_CONFIG = {
  pendiente:  { label:"Pendiente",  bg:"#FFFBEB", color:"#D97706", border:"#FDE68A" },
  confirmada: { label:"Confirmada", bg:"#F0FDF4", color:"#16A34A", border:"#BBF7D0" },
  cancelada:  { label:"Cancelada",  bg:"#FEF2F2", color:"#DC2626", border:"#FECACA" },
};

function slugify(s){ return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")||"campo"; }
function uniqueKey(label,existing){ let k=slugify(label)||"campo",n=2; while(existing.includes(k)){k=`${slugify(label)||"campo"}_${n++}`;} return k; }

function FieldRow({ field, idx, total, onChange, onDelete, onMove }) {
  return (
    <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
      <td style={{ padding:"10px 12px", width:60 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2, alignItems:"center" }}>
          <button disabled={idx===0} onClick={()=>onMove(idx,-1)} style={{ background:"none",border:"none",cursor:idx===0?"default":"pointer",color:idx===0?BORDER:MUTED,fontSize:12,padding:"1px 4px",lineHeight:1 }}>▲</button>
          <span style={{ fontSize:12,color:MUTED,fontWeight:700 }}>{idx+1}</span>
          <button disabled={idx===total-1} onClick={()=>onMove(idx,1)} style={{ background:"none",border:"none",cursor:idx===total-1?"default":"pointer",color:idx===total-1?BORDER:MUTED,fontSize:12,padding:"1px 4px",lineHeight:1 }}>▼</button>
        </div>
      </td>
      <td style={{ padding:"10px 8px" }}>
        <input value={field.field_label} onChange={e=>onChange(idx,"field_label",e.target.value)} placeholder="Ej: Nombre completo"
          style={{ width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"7px 10px",fontSize:13,color:TEXT,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}
          onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BORDER} />
      </td>
      <td style={{ padding:"10px 8px" }}>
        <input value={field.question} onChange={e=>onChange(idx,"question",e.target.value)} placeholder="Ej: ¿Cuál es tu nombre?"
          style={{ width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"7px 10px",fontSize:13,color:TEXT,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}
          onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BORDER} />
      </td>
      <td style={{ padding:"10px 12px",width:80,textAlign:"center" }}>
        <button onClick={()=>onChange(idx,"required",!field.required)} style={{
          padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",
          background:field.required?BLUE_L:BG, color:field.required?BLUE:MUTED,
          outline:`1.5px solid ${field.required?"#BFDBFE":BORDER}`,
        }}>{field.required?"Sí":"No"}</button>
      </td>
      <td style={{ padding:"10px 12px",width:48,textAlign:"center" }}>
        <button onClick={()=>onDelete(idx)} style={{ background:"#FEF2F2",border:"1.5px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"5px 9px",cursor:"pointer",fontSize:14 }}>🗑</button>
      </td>
    </tr>
  );
}

export default function CitasPage() {
  const [tab,setTab] = useState("campos");

  // ── Fields state ─────────────────────────────────────────────────
  const [fields,setFields]   = useState([]);
  const [loadingF,setLoadingF] = useState(true);
  const [savingF,setSavingF] = useState(false);
  const [savedF,setSavedF]   = useState(false);

  // ── Availability state ───────────────────────────────────────────
  const [avail,setAvail]     = useState({ available_days:[1,2,3,4,5], start_time:"09:00", end_time:"18:00", slot_minutes:60, notes:"" });
  const [savingA,setSavingA] = useState(false);
  const [savedA,setSavedA]   = useState(false);

  // ── Appointments state ───────────────────────────────────────────
  const [appointments,setAppointments] = useState([]);
  const [loadingA,setLoadingA] = useState(false);
  const [search,setSearch]   = useState("");
  const [statusFilter,setStatusFilter] = useState("all");
  const [cancelModal,setCancelModal]   = useState(null);
  const [notifying,setNotifying]       = useState(null);

  // Load fields + availability on mount
  useEffect(()=>{
    fetch("/api/citas/fields").then(r=>r.json()).then(d=>{ setFields(d.fields||[]); setLoadingF(false); }).catch(()=>setLoadingF(false));
    fetch("/api/citas/config").then(r=>r.json()).then(d=>{ if(d.config) setAvail(d.config); }).catch(()=>{});
  },[]);

  useEffect(()=>{ if(tab==="citas") loadAppointments(); },[tab]);

  async function loadAppointments(){
    setLoadingA(true);
    try{ const r=await fetch("/api/citas"); const d=await r.json(); setAppointments(d.appointments||[]); }catch{}
    setLoadingA(false);
  }

  // ── Field actions ────────────────────────────────────────────────
  function addField(){
    const existing=fields.map(f=>f.field_key);
    setFields(prev=>[...prev,{ id:"new_"+Date.now(), field_key:uniqueKey("campo",existing), field_label:"", question:"", required:true, field_order:prev.length }]);
    setSavedF(false);
  }
  function updateField(idx,prop,val){
    setFields(prev=>{ const n=[...prev]; n[idx]={...n[idx],[prop]:val};
      if(prop==="field_label"){ n[idx].field_key=uniqueKey(val,prev.filter((_,i)=>i!==idx).map(f=>f.field_key));
        if(!n[idx].question||n[idx].question===`¿Cuál es tu ${prev[idx].field_label}?`) n[idx].question=val?`¿Cuál es tu ${val.toLowerCase()}?`:""; }
      return n; }); setSavedF(false);
  }
  function deleteField(idx){ setFields(prev=>prev.filter((_,i)=>i!==idx)); setSavedF(false); }
  function moveField(idx,dir){ const n=[...fields],t=idx+dir; if(t<0||t>=n.length)return; [n[idx],n[t]]=[n[t],n[idx]]; setFields(n); setSavedF(false); }

  async function saveFields(){
    setSavingF(true); setSavedF(false);
    try{
      const r=await fetch("/api/citas/fields",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fields}) });
      const d=await r.json();
      if(r.ok){ setSavedF(true); } else { alert("Error: "+d.error); }
    }catch(e){ alert("Error: "+e.message); }
    setSavingF(false);
  }

  // ── Availability actions ─────────────────────────────────────────
  function toggleDay(d){ setAvail(a=>({ ...a, available_days: a.available_days.includes(d)?a.available_days.filter(x=>x!==d):[...a.available_days,d].sort() })); setSavedA(false); }
  async function saveAvail(){
    setSavingA(true); setSavedA(false);
    try{
      const r=await fetch("/api/citas/config",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(avail) });
      if(r.ok) setSavedA(true); else { const d=await r.json(); alert("Error: "+d.error); }
    }catch(e){ alert("Error: "+e.message); }
    setSavingA(false);
  }

  // ── Appointment actions ──────────────────────────────────────────
  async function updateStatus(id, status, cancel_reason) {
    if (status === "cancelada" && !cancel_reason) {
      setCancelModal({ id, reason: "" });
      return;
    }
    setNotifying(id);
    try {
      const r = await fetch(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancel_reason }),
      });
      const d = await r.json();
      if (!r.ok) { alert("Error: " + (d.error || r.status)); setNotifying(null); return; }
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (d.notification) {
        if (d.notification.sent) {
          // success — no alert needed, status change is visible
        } else if (d.notification.reason === "missing_credentials") {
          alert(`⚠️ Estado actualizado, pero no se pudo enviar notificación WhatsApp.\nFalta: ${d.notification.missing?.join(", ")}.\nVerifica el token de acceso en Configuración del bot.`);
        } else if (d.notification.reason === "wa_error") {
          alert(`⚠️ Estado actualizado, pero WhatsApp rechazó el mensaje.\nError: ${d.notification.error?.substring(0, 200)}`);
        }
      }
    } catch(e) { alert("Error: " + e.message); }
    setNotifying(null);
  }
  async function confirmCancel() {
    if (!cancelModal) return;
    await updateStatus(cancelModal.id, "cancelada", cancelModal.reason);
    setCancelModal(null);
  }
  async function deleteAppt(id){
    if(!confirm("¿Eliminar esta cita?")) return;
    await fetch(`/api/citas?id=${id}`,{ method:"DELETE" });
    setAppointments(prev=>prev.filter(a=>a.id!==id));
  }
  function exportCSV(){
    const h=["Contacto","Teléfono",...fields.map(f=>f.field_label),"Estado","Fecha"];
    const rows=filteredAppts.map(a=>[a.contact_name||a.from_phone,a.from_phone,...fields.map(f=>a.data?.[f.field_key]||""),STATUS_CONFIG[a.status]?.label||a.status,new Date(a.created_at).toLocaleDateString("es-MX")]);
    const csv=[h,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const el=document.createElement("a"); el.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); el.download="citas.csv"; el.click();
  }

  const filteredAppts=appointments.filter(a=>{
    const ms=statusFilter==="all"||a.status===statusFilter;
    const q=search.toLowerCase();
    const mq=!q||(a.contact_name||"").toLowerCase().includes(q)||a.from_phone.includes(q)||Object.values(a.data||{}).some(v=>String(v).toLowerCase().includes(q));
    return ms&&mq;
  });
  const pendingCount=appointments.filter(a=>a.status==="pendiente").length;

  // ── Cancel Modal ─────────────────────────────────────────────────────────
  const CancelModal = cancelModal && (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:CARD,borderRadius:16,padding:32,width:440,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin:"0 0 8px",fontSize:18,fontWeight:700,color:TEXT }}>Cancelar cita</h3>
        <p style={{ margin:"0 0 16px",fontSize:14,color:MUTED }}>Escribe el motivo de la cancelación. El cliente recibirá una notificación por WhatsApp.</p>
        <textarea
          value={cancelModal.reason}
          onChange={e=>setCancelModal(m=>({...m,reason:e.target.value}))}
          placeholder="Ej: No hay disponibilidad en la fecha solicitada..."
          rows={4}
          style={{ width:"100%",boxSizing:"border-box",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"10px 12px",fontSize:14,color:TEXT,outline:"none",resize:"vertical",fontFamily:"inherit" }}
          onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BORDER}
        />
        <div style={{ display:"flex",gap:12,marginTop:20,justifyContent:"flex-end" }}>
          <button onClick={()=>setCancelModal(null)} style={{ padding:"9px 20px",borderRadius:10,border:`1.5px solid ${BORDER}`,background:BG,color:MUTED,fontWeight:600,cursor:"pointer",fontSize:14 }}>Cancelar</button>
          <button onClick={confirmCancel} style={{ padding:"9px 20px",borderRadius:10,border:"none",background:"#DC2626",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 }}>Enviar cancelación</button>
        </div>
      </div>
    </div>
  );


  return (
    <div style={{ minHeight:"100vh",background:BG,color:TEXT,fontFamily:"system-ui,-apple-system,sans-serif" }}>
      {CancelModal}
      {/* Header */}
      <div style={{ padding:"32px 32px 0" }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16 }}>
          <div>
            <h1 style={{ fontSize:24,fontWeight:800,margin:0,letterSpacing:"-0.02em" }}>Agendamiento de Citas</h1>
            <p style={{ margin:"4px 0 0",fontSize:14,color:MUTED }}>El bot recopila la información automáticamente por WhatsApp</p>
          </div>
          {pendingCount>0&&<div style={{ background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:10,padding:"8px 16px",fontSize:13,color:"#D97706",fontWeight:700 }}>⏳ {pendingCount} pendiente{pendingCount!==1?"s":""}</div>}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:0,marginTop:24,borderBottom:`2px solid ${BORDER}` }}>
          {[
            { id:"campos", label:"📋 Campos del Formulario" },
            { id:"disponibilidad", label:"📆 Disponibilidad" },
            { id:"citas",  label:`📅 Citas Recibidas${pendingCount>0?` (${pendingCount})`:""}` },
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"10px 20px",fontWeight:700,fontSize:14,cursor:"pointer",border:"none",background:"none",color:tab===t.id?BLUE:MUTED,borderBottom:`2px solid ${tab===t.id?BLUE:"transparent"}`,marginBottom:-2,transition:"all 0.15s" }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── TAB: CAMPOS ─────────────────────────────────────────────── */}
      {tab==="campos"&&(
        <div style={{ padding:"24px 32px 40px" }}>
          <div style={{ background:BLUE_L,border:"1.5px solid #BFDBFE",borderRadius:12,padding:"14px 18px",marginBottom:24,display:"flex",gap:12,alignItems:"flex-start" }}>
            <span style={{ fontSize:20 }}>💡</span>
            <div style={{ fontSize:13,color:"#1E40AF",lineHeight:1.6 }}>
              <strong>¿Cómo funciona?</strong> Cuando alguien escriba <em>"quiero una cita"</em>, <em>"agendar"</em> o <em>"reservar"</em>, el bot le pedirá cada campo uno por uno. Al terminar, la cita aparece en la pestaña <strong>Citas Recibidas</strong>.
            </div>
          </div>

          <div style={{ background:CARD,border:`1.5px solid ${BORDER}`,borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ padding:"14px 20px",borderBottom:`1.5px solid ${BORDER}`,background:BG,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:13,fontWeight:700,color:TEXT }}>{fields.length} campo{fields.length!==1?"s":""}</span>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                {savedF&&<span style={{ fontSize:13,color:"#16A34A",fontWeight:600 }}>✅ Guardado</span>}
                <button onClick={addField} style={{ background:BG,border:`1.5px solid ${BORDER}`,color:TEXT,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer" }}>+ Agregar campo</button>
                <button onClick={saveFields} disabled={savingF} style={{ background:BLUE,color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:savingF?0.7:1,boxShadow:"0 2px 6px rgba(37,99,235,0.2)" }}>
                  {savingF?"Guardando...":"💾 Guardar cambios"}
                </button>
              </div>
            </div>

            {loadingF?(
              <div style={{ padding:48,textAlign:"center",color:MUTED }}>Cargando...</div>
            ):(
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:BG }}>
                      <th style={TH}>#</th>
                      <th style={{ ...TH,textAlign:"left" }}>Nombre del campo <span style={{ color:"#94A3B8",fontWeight:400,textTransform:"none",fontSize:11 }}>(columna en tu tabla)</span></th>
                      <th style={{ ...TH,textAlign:"left" }}>Pregunta del bot <span style={{ color:"#94A3B8",fontWeight:400,textTransform:"none",fontSize:11 }}>(lo que le dice al usuario)</span></th>
                      <th style={TH}>Obligatorio</th>
                      <th style={{ width:48 }}/>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.length===0?(
                      <tr><td colSpan={5} style={{ padding:40,textAlign:"center",color:MUTED,fontSize:14 }}>Sin campos. Haz clic en <strong>+ Agregar campo</strong>.</td></tr>
                    ):fields.map((f,i)=>(
                      <FieldRow key={f.id||i} field={f} idx={i} total={fields.length} onChange={updateField} onDelete={deleteField} onMove={moveField}/>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {fields.length>0&&(
              <div style={{ padding:"12px 20px",borderTop:`1px solid ${BORDER}`,background:BG,display:"flex",justifyContent:"flex-end",gap:10 }}>
                {savedF&&<span style={{ fontSize:13,color:"#16A34A",fontWeight:600,alignSelf:"center" }}>✅ Guardado</span>}
                <button onClick={addField} style={{ background:BG,border:`1.5px solid ${BORDER}`,color:TEXT,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer" }}>+ Agregar campo</button>
                <button onClick={saveFields} disabled={savingF} style={{ background:BLUE,color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:savingF?0.7:1 }}>{savingF?"Guardando...":"💾 Guardar cambios"}</button>
              </div>
            )}
          </div>

          {/* Chat preview */}
          {fields.length>0&&(
            <div style={{ marginTop:24,background:CARD,border:`1.5px solid ${BORDER}`,borderRadius:16,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:13,fontWeight:700,color:TEXT,marginBottom:16 }}>👁 Vista previa — Así verá el usuario la conversación</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10,maxWidth:440 }}>
                <Bubble>¡Hola! Voy a ayudarte a agendar tu cita 📋</Bubble>
                {fields.slice(0,3).map((f,i)=><Bubble key={i}>{f.question||`¿${f.field_label}?`}{!f.required&&<span style={{ fontSize:11,color:MUTED,marginLeft:6 }}>(opcional)</span>}</Bubble>)}
                {fields.length>3&&<div style={{ fontSize:12,color:MUTED,paddingLeft:4 }}>... y {fields.length-3} pregunta{fields.length-3!==1?"s":""} más</div>}
                <Bubble>¡Listo! Tu cita ha sido registrada. Te confirmamos en breve ✅</Bubble>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DISPONIBILIDAD ──────────────────────────────────────── */}
      {tab==="disponibilidad"&&(
        <div style={{ padding:"24px 32px 40px",maxWidth:680 }}>
          <div style={{ background:CARD,border:`1.5px solid ${BORDER}`,borderRadius:16,padding:28,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",gap:28 }}>

            {/* Days */}
            <div>
              <div style={{ fontSize:14,fontWeight:700,color:TEXT,marginBottom:4 }}>Días disponibles</div>
              <div style={{ fontSize:13,color:MUTED,marginBottom:14 }}>El bot informará al usuario cuándo puedes atenderle</div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {DAYS.map((d,i)=>{
                  const on=avail.available_days?.includes(i);
                  return(
                    <button key={i} onClick={()=>toggleDay(i)} style={{
                      padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",transition:"all 0.15s",
                      background:on?BLUE:BG, color:on?"#fff":MUTED,
                      outline:`1.5px solid ${on?"#2563EB":BORDER}`,
                    }}>{d}</button>
                  );
                })}
              </div>
            </div>

            {/* Hours */}
            <div>
              <div style={{ fontSize:14,fontWeight:700,color:TEXT,marginBottom:4 }}>Horario de atención</div>
              <div style={{ fontSize:13,color:MUTED,marginBottom:14 }}>Rango de horas en que recibes citas</div>
              <div style={{ display:"flex",gap:16,alignItems:"center",flexWrap:"wrap" }}>
                <label style={{ display:"flex",flexDirection:"column",gap:6,fontSize:13,color:MUTED,fontWeight:600 }}>
                  Hora inicio
                  <input type="time" value={avail.start_time} onChange={e=>{ setAvail(a=>({...a,start_time:e.target.value})); setSavedA(false); }}
                    style={{ background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:TEXT,outline:"none",width:130 }}
                    onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BORDER} />
                </label>
                <span style={{ fontSize:18,color:MUTED,marginTop:20 }}>→</span>
                <label style={{ display:"flex",flexDirection:"column",gap:6,fontSize:13,color:MUTED,fontWeight:600 }}>
                  Hora fin
                  <input type="time" value={avail.end_time} onChange={e=>{ setAvail(a=>({...a,end_time:e.target.value})); setSavedA(false); }}
                    style={{ background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:TEXT,outline:"none",width:130 }}
                    onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BORDER} />
                </label>
                <label style={{ display:"flex",flexDirection:"column",gap:6,fontSize:13,color:MUTED,fontWeight:600 }}>
                  Duración por cita
                  <select value={avail.slot_minutes} onChange={e=>{ setAvail(a=>({...a,slot_minutes:Number(e.target.value)})); setSavedA(false); }}
                    style={{ background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:TEXT,outline:"none",width:150 }}>
                    {[15,30,45,60,90,120].map(m=><option key={m} value={m}>{m} min</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div style={{ fontSize:14,fontWeight:700,color:TEXT,marginBottom:4 }}>Notas adicionales <span style={{ fontSize:12,color:MUTED,fontWeight:400 }}>(opcional)</span></div>
              <div style={{ fontSize:13,color:MUTED,marginBottom:10 }}>El bot las mencionará al confirmar la cita. Ej: "Recuerda llegar 5 min antes"</div>
              <textarea value={avail.notes} onChange={e=>{ setAvail(a=>({...a,notes:e.target.value})); setSavedA(false); }} rows={3}
                placeholder="Ej: Estamos en Av. Principal #123. Recuerda llegar 5 minutos antes."
                style={{ width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:TEXT,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BORDER} />
            </div>

            {/* Save */}
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <button onClick={saveAvail} disabled={savingA} style={{ background:BLUE,color:"#fff",border:"none",borderRadius:10,padding:"10px 28px",fontWeight:700,fontSize:14,cursor:"pointer",opacity:savingA?0.7:1,boxShadow:"0 2px 8px rgba(37,99,235,0.2)" }}>
                {savingA?"Guardando...":"💾 Guardar disponibilidad"}
              </button>
              {savedA&&<span style={{ fontSize:13,color:"#16A34A",fontWeight:600 }}>✅ Guardado</span>}
            </div>

            {/* Preview */}
            {avail.available_days?.length>0&&(
              <div style={{ background:BLUE_L,border:"1.5px solid #BFDBFE",borderRadius:12,padding:"14px 18px" }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#1E40AF",marginBottom:6 }}>Vista previa — mensaje del bot al confirmar disponibilidad</div>
                <div style={{ fontSize:13,color:"#1E40AF",lineHeight:1.7 }}>
                  📅 Nuestro horario es {DAYS.filter((_,i)=>avail.available_days?.includes(i)).join(", ")} de {avail.start_time} a {avail.end_time}. Cada cita tiene una duración de {avail.slot_minutes} min.
                  {avail.notes&&<><br/>{avail.notes}</>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: CITAS RECIBIDAS ─────────────────────────────────────── */}
      {tab==="citas"&&(
        <div style={{ padding:"24px 32px 40px" }}>
          <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#94A3B8" }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
                style={{ background:CARD,border:`1.5px solid ${BORDER}`,color:TEXT,borderRadius:10,padding:"8px 12px 8px 32px",fontSize:13,width:220,outline:"none",fontFamily:"inherit" }}
                onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BORDER} />
            </div>
            {["all","pendiente","confirmada","cancelada"].map(s=>(
              <button key={s} onClick={()=>setStatusFilter(s)} style={{
                padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer",
                border:`1.5px solid ${statusFilter===s?BLUE:BORDER}`,
                background:statusFilter===s?BLUE_L:CARD, color:statusFilter===s?BLUE:MUTED,
              }}>
                {s==="all"?"Todas":STATUS_CONFIG[s]?.label}
                <span style={{ marginLeft:6,fontSize:12 }}>({s==="all"?appointments.length:appointments.filter(a=>a.status===s).length})</span>
              </button>
            ))}
            <div style={{ marginLeft:"auto",display:"flex",gap:10 }}>
              <button onClick={exportCSV} style={{ background:CARD,border:`1.5px solid ${BORDER}`,color:MUTED,borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:600 }}>⬇ CSV</button>
              <button onClick={loadAppointments} style={{ background:CARD,border:`1.5px solid ${BORDER}`,color:MUTED,borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:16 }}>↻</button>
            </div>
          </div>

          <div style={{ background:CARD,border:`1.5px solid ${BORDER}`,borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",minWidth:700 }}>
                <thead>
                  <tr style={{ background:BG,borderBottom:`1.5px solid ${BORDER}` }}>
                    <th style={TH}>Contacto</th>
                    {fields.map(f=><th key={f.field_key} style={TH}>{f.field_label}</th>)}
                    <th style={TH}>Estado</th>
                    <th style={TH}>Fecha</th>
                    <th style={TH}/>
                  </tr>
                </thead>
                <tbody>
                  {loadingA?(
                    <tr><td colSpan={fields.length+4} style={{ padding:48,textAlign:"center",color:MUTED }}><div style={{ fontSize:28,marginBottom:10 }}>⏳</div>Cargando...</td></tr>
                  ):filteredAppts.length===0?(
                    <tr><td colSpan={fields.length+4} style={{ padding:60,textAlign:"center" }}>
                      <div style={{ fontSize:44,marginBottom:12 }}>📅</div>
                      <div style={{ fontSize:16,fontWeight:700,color:TEXT,marginBottom:6 }}>{search||statusFilter!=="all"?"Sin resultados":"Aún no hay citas"}</div>
                      <div style={{ fontSize:13,color:MUTED }}>{search||statusFilter!=="all"?"Prueba con otro filtro":"Cuando alguien agende por WhatsApp aparecerá aquí"}</div>
                    </td></tr>
                  ):filteredAppts.map((appt,i)=>{
                    const sc=STATUS_CONFIG[appt.status]||STATUS_CONFIG.pendiente;
                    return(
                      <tr key={appt.id} style={{ borderBottom:i<filteredAppts.length-1?`1px solid ${BORDER}`:"none",transition:"background 0.15s" }}
                        onMouseEnter={e=>e.currentTarget.style.background=BG} onMouseLeave={e=>e.currentTarget.style.background=CARD}>
                        <td style={TD}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            <div style={{ width:32,height:32,borderRadius:"50%",background:BLUE_L,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:BLUE,flexShrink:0 }}>
                              {(appt.contact_name||appt.from_phone)[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize:13,fontWeight:700,color:TEXT }}>{appt.contact_name||appt.from_phone}</div>
                              <div style={{ fontSize:11,color:MUTED }}>{appt.from_phone}</div>
                            </div>
                          </div>
                        </td>
                        {fields.map(f=>(
                          <td key={f.field_key} style={TD}>
                            <span style={{ fontSize:13,color:appt.data?.[f.field_key]?TEXT:MUTED,fontStyle:appt.data?.[f.field_key]?"normal":"italic" }}>{appt.data?.[f.field_key]||"—"}</span>
                          </td>
                        ))}
                        <td style={TD}>
                          <select value={appt.status} onChange={e=>updateStatus(appt.id,e.target.value)} disabled={notifying===appt.id} style={{ padding:"4px 8px",borderRadius:20,opacity:notifying===appt.id?0.6:1,fontSize:12,fontWeight:700,cursor:"pointer",border:`1.5px solid ${sc.border}`,background:sc.bg,color:sc.color,outline:"none" }}>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                        </td>
                        <td style={TD}><span style={{ fontSize:13,color:MUTED }}>{new Date(appt.created_at).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"})}</span></td>
                        <td style={TD}><button onClick={()=>deleteAppt(appt.id)} style={{ background:"#FEF2F2",border:"1.5px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"5px 9px",cursor:"pointer",fontSize:13 }}>🗑</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ children }){
  return <div style={{ alignSelf:"flex-start",background:"#F1F5F9",borderRadius:"14px 14px 14px 4px",padding:"10px 14px",fontSize:13,color:"#0F172A",lineHeight:1.5 }}>{children}</div>;
}

const TH={ padding:"11px 14px",fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.06em",textAlign:"left",whiteSpace:"nowrap" };
const TD={ padding:"13px 14px",verticalAlign:"middle" };
