"use client";
import { useState, useEffect } from "react";
import { useBotContext } from "@/lib/bot-context";

const BL="#2563EB",BLL="#EFF6FF",TX="#0F172A",MT="#64748B",WH="#FFFFFF",BD="#E2E8F0",BG="#F8FAFF";
const STATUS_CFG = {
  pendiente:  { label:"Pendiente",  bg:"#FFFBEB", color:"#D97706", chip:"#FEF3C7", border:"#FDE68A" },
  confirmada: { label:"Confirmada", bg:"#F0FDF4", color:"#16A34A", chip:"#DCFCE7", border:"#BBF7D0" },
  cancelada:  { label:"Cancelada",  bg:"#FEF2F2", color:"#DC2626", chip:"#FEE2E2", border:"#FECACA" },
};
const MONTHS=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_S=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAYS_L=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DAYS_AVAIL=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function slugify(s){return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")||"campo";}
function uniqueKey(label,existing){let k=slugify(label)||"campo",n=2;while(existing.includes(k)){k=`${slugify(label)||"campo"}_${n++}`;}return k;}
function getCalDays(yr,mo){const first=new Date(yr,mo,1).getDay(),dim=new Date(yr,mo+1,0).getDate(),days=[];for(let i=0;i<first;i++)days.push(null);for(let i=1;i<=dim;i++)days.push(i);while(days.length%7!==0)days.push(null);return days;}
function apptDate(appt){const dateFields=["fecha","date","dia","fecha_cita","fecha_hora"];for(const f of dateFields){if(appt.data?.[f]){const d=new Date(appt.data[f]);if(!isNaN(d))return d;}}return new Date(appt.created_at);}

function FieldRow({field,idx,total,onChange,onDelete,onMove}){
  return(
    <tr style={{borderBottom:`1px solid ${BD}`}}>
      <td style={{padding:"10px 12px",width:56}}>
        <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}>
          <button disabled={idx===0} onClick={()=>onMove(idx,-1)} style={{background:"none",border:"none",cursor:idx===0?"default":"pointer",color:idx===0?BD:MT,fontSize:12,padding:"1px 4px",lineHeight:1}}>▲</button>
          <span style={{fontSize:12,color:MT,fontWeight:700}}>{idx+1}</span>
          <button disabled={idx===total-1} onClick={()=>onMove(idx,1)} style={{background:"none",border:"none",cursor:idx===total-1?"default":"pointer",color:idx===total-1?BD:MT,fontSize:12,padding:"1px 4px",lineHeight:1}}>▼</button>
        </div>
      </td>
      <td style={{padding:"10px 8px"}}>
        <input value={field.field_label} onChange={e=>onChange(idx,"field_label",e.target.value)} placeholder="Ej: Nombre completo"
          style={{width:"100%",background:BG,border:`1.5px solid ${BD}`,borderRadius:8,padding:"7px 10px",fontSize:13,color:TX,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD}/>
      </td>
      <td style={{padding:"10px 8px"}}>
        <input value={field.question} onChange={e=>onChange(idx,"question",e.target.value)} placeholder="Ej: ¿Cuál es tu nombre?"
          style={{width:"100%",background:BG,border:`1.5px solid ${BD}`,borderRadius:8,padding:"7px 10px",fontSize:13,color:TX,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD}/>
      </td>
      <td style={{padding:"10px 12px",width:80,textAlign:"center"}}>
        <button onClick={()=>onChange(idx,"required",!field.required)} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:field.required?BLL:BG,color:field.required?BL:MT,outline:`1.5px solid ${field.required?"#BFDBFE":BD}`}}>{field.required?"Sí":"No"}</button>
      </td>
      <td style={{padding:"10px 12px",width:44,textAlign:"center"}}>
        <button onClick={()=>onDelete(idx)} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"5px 9px",cursor:"pointer",fontSize:13}}>🗑</button>
      </td>
    </tr>
  );
}

export default function CitasPage(){
  const { selectedBot } = useBotContext();
  const today=new Date();
  const [yr,setYr]=useState(today.getFullYear());
  const [mo,setMo]=useState(today.getMonth());
  const [viewMode,setViewMode]=useState("calendar");
  const [selDay,setSelDay]=useState(null);
  const [popupPos,setPopupPos]=useState({x:0,y:0});
  const [showConfig,setShowConfig]=useState(false);
  const [cfgTab,setCfgTab]=useState("campos");
  const [detailAppt,setDetailAppt]=useState(null);

  const [fields,setFields]=useState([]);
  const [loadingF,setLoadingF]=useState(true);
  const [savingF,setSavingF]=useState(false);
  const [savedF,setSavedF]=useState(false);

  const [avail,setAvail]=useState({available_days:[1,2,3,4,5],start_time:"09:00",end_time:"18:00",slot_minutes:60,notes:""});
  const [savingA,setSavingA]=useState(false);
  const [savedA,setSavedA]=useState(false);

  const [appointments,setAppointments]=useState([]);
  const [loadingAppts,setLoadingAppts]=useState(true);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [cancelModal,setCancelModal]=useState(null);
  const [notifying,setNotifying]=useState(null);

  const botQs = selectedBot ? `?bot_id=${selectedBot.id}` : "";

  useEffect(()=>{
    const bq = selectedBot ? `?bot_id=${selectedBot.id}` : "";
    fetch(`/api/citas/fields${bq}`).then(r=>r.json()).then(d=>{setFields(d.fields||[]);setLoadingF(false);}).catch(()=>setLoadingF(false));
    fetch(`/api/citas/config${bq}`).then(r=>r.json()).then(d=>{if(d.config)setAvail(d.config);}).catch(()=>{});
    loadAppointments(selectedBot?.id);
  },[selectedBot]);

  async function loadAppointments(botId){
    setLoadingAppts(true);
    try{const bq=botId?`?bot_id=${botId}`:"";const r=await fetch(`/api/citas${bq}`);const d=await r.json();setAppointments(d.appointments||[]);}catch{}
    setLoadingAppts(false);
  }

  const calDays=getCalDays(yr,mo);
  const apptsByDay={};
  appointments.forEach(appt=>{
    const d=apptDate(appt);
    const key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if(!apptsByDay[key])apptsByDay[key]=[];
    apptsByDay[key].push(appt);
  });

  function handleDayClick(day,e){
    if(!day)return;
    const key=`${yr}-${mo}-${day}`;
    const dayAppts=apptsByDay[key]||[];
    const rect=e.currentTarget.getBoundingClientRect();
    const vpW=window.innerWidth,vpH=window.innerHeight;
    let x=rect.left,y=rect.bottom+8;
    if(x+300>vpW-16)x=vpW-316;
    if(y+380>vpH)y=rect.top-388;
    setPopupPos({x,y});
    setSelDay({day,appts:dayAppts,yr,mo});
  }

  function prevMonth(){if(mo===0){setYr(y=>y-1);setMo(11);}else setMo(m=>m-1);setSelDay(null);}
  function nextMonth(){if(mo===11){setYr(y=>y+1);setMo(0);}else setMo(m=>m+1);setSelDay(null);}

  function addField(){const existing=fields.map(f=>f.field_key);setFields(prev=>[...prev,{id:"new_"+Date.now(),field_key:uniqueKey("campo",existing),field_label:"",question:"",required:true,field_order:prev.length}]);setSavedF(false);}
  function updateField(idx,prop,val){setFields(prev=>{const n=[...prev];n[idx]={...n[idx],[prop]:val};if(prop==="field_label"){n[idx].field_key=uniqueKey(val,prev.filter((_,i)=>i!==idx).map(f=>f.field_key));if(!n[idx].question||n[idx].question===`¿Cuál es tu ${prev[idx].field_label}?`)n[idx].question=val?`¿Cuál es tu ${val.toLowerCase()}?`:"";}return n;});setSavedF(false);}
  function deleteField(idx){setFields(prev=>prev.filter((_,i)=>i!==idx));setSavedF(false);}
  function moveField(idx,dir){const n=[...fields],t=idx+dir;if(t<0||t>=n.length)return;[n[idx],n[t]]=[n[t],n[idx]];setFields(n);setSavedF(false);}

  async function saveFields(){setSavingF(true);setSavedF(false);try{const r=await fetch("/api/citas/fields",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fields, bot_id: selectedBot?.id || null})});const d=await r.json();if(r.ok){setSavedF(true);}else{alert("Error: "+d.error);}}catch(e){alert("Error: "+e.message);}setSavingF(false);}
  function toggleDay(d){setAvail(a=>({...a,available_days:a.available_days.includes(d)?a.available_days.filter(x=>x!==d):[...a.available_days,d].sort()}));setSavedA(false);}
  async function saveAvail(){setSavingA(true);setSavedA(false);try{const r=await fetch("/api/citas/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...avail, bot_id: selectedBot?.id || null})});if(r.ok)setSavedA(true);else{const d=await r.json();alert("Error: "+d.error);}}catch(e){alert("Error: "+e.message);}setSavingA(false);}

  async function updateStatus(id,status,cancel_reason){
    if(status==="cancelada"&&!cancel_reason){setCancelModal({id,reason:""});return;}
    setNotifying(id);
    try{
      const r=await fetch(`/api/citas/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,cancel_reason})});
      const d=await r.json();
      if(!r.ok){alert("Error: "+(d.error||r.status));setNotifying(null);return;}
      setAppointments(prev=>prev.map(a=>a.id===id?{...a,status}:a));
      if(selDay)setSelDay(sd=>({...sd,appts:sd.appts.map(a=>a.id===id?{...a,status}:a)}));
      if(detailAppt?.id===id)setDetailAppt(a=>({...a,status}));
      if(d.notification&&!d.notification.sent){
        if(d.notification.reason==="missing_credentials")alert("⚠️ Estado actualizado, sin notificación WhatsApp (faltan credenciales).");
        else if(d.notification.reason==="wa_error")alert("⚠️ Estado actualizado, pero WhatsApp rechazó el mensaje.");
      }
    }catch(e){alert("Error: "+e.message);}
    setNotifying(null);
  }
  async function confirmCancel(){if(!cancelModal)return;await updateStatus(cancelModal.id,"cancelada",cancelModal.reason);setCancelModal(null);}
  async function deleteAppt(id){if(!confirm("¿Eliminar esta cita?"))return;await fetch(`/api/citas?id=${id}`,{method:"DELETE"});setAppointments(prev=>prev.filter(a=>a.id!==id));if(selDay)setSelDay(sd=>({...sd,appts:sd.appts.filter(a=>a.id!==id)}));if(detailAppt?.id===id)setDetailAppt(null);}

  const pendingCount=appointments.filter(a=>a.status==="pendiente").length;
  const filteredAppts=appointments.filter(a=>{
    const ms=statusFilter==="all"||a.status===statusFilter;
    const q=search.toLowerCase();
    const mq=!q||(a.contact_name||"").toLowerCase().includes(q)||a.from_phone.includes(q)||Object.values(a.data||{}).some(v=>String(v).toLowerCase().includes(q));
    return ms&&mq;
  });

  function exportCSV(){const h=["Contacto","Teléfono",...fields.map(f=>f.field_label),"Estado","Fecha"];const rows=filteredAppts.map(a=>[a.contact_name||a.from_phone,a.from_phone,...fields.map(f=>a.data?.[f.field_key]||""),STATUS_CFG[a.status]?.label||a.status,new Date(a.created_at).toLocaleDateString("es-MX")]);const csv=[h,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");const el=document.createElement("a");el.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);el.download="citas.csv";el.click();}

  return(
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",color:TX,minHeight:"100vh"}}>

      {/* ── Cancel modal ── */}
      {cancelModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:WH,borderRadius:16,padding:32,width:440,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:700,color:TX}}>Cancelar cita</h3>
            <p style={{margin:"0 0 16px",fontSize:14,color:MT}}>Escribe el motivo. El cliente recibirá una notificación por WhatsApp.</p>
            <textarea value={cancelModal.reason} onChange={e=>setCancelModal(m=>({...m,reason:e.target.value}))} placeholder="Motivo de cancelación..." rows={4}
              style={{width:"100%",boxSizing:"border-box",background:BG,border:`1.5px solid ${BD}`,borderRadius:10,padding:"10px 12px",fontSize:14,color:TX,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
            <div style={{display:"flex",gap:12,marginTop:20,justifyContent:"flex-end"}}>
              <button onClick={()=>setCancelModal(null)} style={{padding:"9px 20px",borderRadius:10,border:`1.5px solid ${BD}`,background:BG,color:MT,fontWeight:600,cursor:"pointer",fontSize:14}}>Cancelar</button>
              <button onClick={confirmCancel} style={{padding:"9px 20px",borderRadius:10,border:"none",background:"#DC2626",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>Enviar cancelación</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail modal ── */}
      {detailAppt&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:WH,borderRadius:20,width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.22)"}}>
            <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${BD}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:BLL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:BL}}>
                  {(detailAppt.contact_name||detailAppt.from_phone)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:TX}}>{detailAppt.contact_name||detailAppt.from_phone}</div>
                  <div style={{fontSize:12,color:MT}}>{detailAppt.from_phone}</div>
                </div>
              </div>
              <button onClick={()=>setDetailAppt(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:MT,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:24}}>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:MT,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Estado</div>
                <select value={detailAppt.status} onChange={e=>updateStatus(detailAppt.id,e.target.value)} disabled={notifying===detailAppt.id}
                  style={{padding:"8px 14px",borderRadius:20,fontSize:13,fontWeight:700,border:`1.5px solid ${STATUS_CFG[detailAppt.status]?.border||BD}`,background:STATUS_CFG[detailAppt.status]?.bg||BG,color:STATUS_CFG[detailAppt.status]?.color||MT,cursor:"pointer",outline:"none"}}>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              {fields.length>0&&(
                <div style={{background:BG,borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:MT,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Información de la cita</div>
                  {fields.map(f=>(
                    <div key={f.field_key} style={{display:"flex",gap:8,marginBottom:10}}>
                      <span style={{fontSize:13,color:MT,fontWeight:600,minWidth:120,flexShrink:0}}>{f.field_label}:</span>
                      <span style={{fontSize:13,color:detailAppt.data?.[f.field_key]?TX:MT,fontStyle:detailAppt.data?.[f.field_key]?"normal":"italic"}}>{detailAppt.data?.[f.field_key]||"—"}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:12,color:MT,marginBottom:20}}>Agendado el {new Date(detailAppt.created_at).toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
              <button onClick={()=>deleteAppt(detailAppt.id)} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",color:"#DC2626",borderRadius:10,padding:"9px 18px",cursor:"pointer",fontSize:13,fontWeight:700,width:"100%"}}>🗑 Eliminar cita</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Config modal ── */}
      {showConfig&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:WH,borderRadius:20,width:"100%",maxWidth:760,maxHeight:"92vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>
            <div style={{padding:"20px 28px",borderBottom:`1px solid ${BD}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:WH,zIndex:1}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:800,color:TX}}>⚙️ Configuración del Agendamiento</h2>
              <button onClick={()=>setShowConfig(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:MT,lineHeight:1}}>×</button>
            </div>
            <div style={{display:"flex",borderBottom:`1px solid ${BD}`}}>
              {[["campos","📋 Campos del formulario"],["disponibilidad","📆 Disponibilidad"]].map(([id,label])=>(
                <button key={id} onClick={()=>setCfgTab(id)} style={{padding:"12px 24px",fontWeight:700,fontSize:14,cursor:"pointer",border:"none",background:"none",color:cfgTab===id?BL:MT,borderBottom:`2px solid ${cfgTab===id?BL:"transparent"}`,marginBottom:-1,transition:"all 0.15s"}}>{label}</button>
              ))}
            </div>
            <div style={{padding:28}}>
              {cfgTab==="campos"&&(
                <div>
                  <div style={{background:BLL,border:"1.5px solid #BFDBFE",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:18}}>💡</span>
                    <div style={{fontSize:13,color:"#1E40AF",lineHeight:1.6}}>Cuando alguien escriba <em>"quiero una cita"</em> o <em>"agendar"</em>, el bot le pedirá estos campos uno por uno.</div>
                  </div>
                  <div style={{background:WH,border:`1.5px solid ${BD}`,borderRadius:14,overflow:"hidden"}}>
                    <div style={{padding:"12px 18px",borderBottom:`1px solid ${BD}`,background:BG,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,fontWeight:700,color:TX}}>{fields.length} campo{fields.length!==1?"s":""}</span>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        {savedF&&<span style={{fontSize:13,color:"#16A34A",fontWeight:600}}>✅ Guardado</span>}
                        <button onClick={addField} style={{background:BG,border:`1.5px solid ${BD}`,color:TX,borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Agregar campo</button>
                        <button onClick={saveFields} disabled={savingF} style={{background:BL,color:"#fff",border:"none",borderRadius:8,padding:"6px 16px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:savingF?0.7:1}}>{savingF?"Guardando...":"💾 Guardar"}</button>
                      </div>
                    </div>
                    {loadingF?(
                      <div style={{padding:40,textAlign:"center",color:MT}}>Cargando...</div>
                    ):(
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{background:BG}}>
                              <th style={TH}>#</th>
                              <th style={{...TH,textAlign:"left"}}>Nombre del campo</th>
                              <th style={{...TH,textAlign:"left"}}>Pregunta del bot</th>
                              <th style={TH}>Obligatorio</th>
                              <th style={{width:44}}/>
                            </tr>
                          </thead>
                          <tbody>
                            {fields.length===0?(
                              <tr><td colSpan={5} style={{padding:36,textAlign:"center",color:MT,fontSize:14}}>Sin campos. Haz clic en <strong>+ Agregar campo</strong>.</td></tr>
                            ):fields.map((f,i)=>(
                              <FieldRow key={f.id||i} field={f} idx={i} total={fields.length} onChange={updateField} onDelete={deleteField} onMove={moveField}/>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {fields.length>0&&(
                    <div style={{marginTop:20,background:WH,border:`1.5px solid ${BD}`,borderRadius:14,padding:20}}>
                      <div style={{fontSize:13,fontWeight:700,color:TX,marginBottom:14}}>👁 Vista previa — conversación del bot</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:420}}>
                        <Bubble>¡Hola! Voy a ayudarte a agendar tu cita 📋</Bubble>
                        {fields.slice(0,3).map((f,i)=><Bubble key={i}>{f.question||`¿${f.field_label}?`}</Bubble>)}
                        {fields.length>3&&<div style={{fontSize:12,color:MT,paddingLeft:4}}>... y {fields.length-3} pregunta{fields.length-3!==1?"s":""} más</div>}
                        <Bubble>¡Listo! Tu cita ha sido registrada. Te confirmamos en breve ✅</Bubble>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {cfgTab==="disponibilidad"&&(
                <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:600}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:TX,marginBottom:4}}>Días disponibles</div>
                    <div style={{fontSize:13,color:MT,marginBottom:12}}>El bot informará al usuario cuándo puedes atenderle</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {DAYS_AVAIL.map((d,i)=>{
                        const on=avail.available_days?.includes(i);
                        return(
                          <button key={i} onClick={()=>toggleDay(i)} style={{padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",background:on?BL:BG,color:on?"#fff":MT,outline:`1.5px solid ${on?"#2563EB":BD}`,transition:"all 0.15s"}}>{d}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:TX,marginBottom:4}}>Horario de atención</div>
                    <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",marginTop:10}}>
                      <label style={{display:"flex",flexDirection:"column",gap:6,fontSize:13,color:MT,fontWeight:600}}>Hora inicio<input type="time" value={avail.start_time} onChange={e=>{setAvail(a=>({...a,start_time:e.target.value}));setSavedA(false);}} style={{background:BG,border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:TX,outline:"none",width:130}}/></label>
                      <span style={{fontSize:18,color:MT,marginTop:18}}>→</span>
                      <label style={{display:"flex",flexDirection:"column",gap:6,fontSize:13,color:MT,fontWeight:600}}>Hora fin<input type="time" value={avail.end_time} onChange={e=>{setAvail(a=>({...a,end_time:e.target.value}));setSavedA(false);}} style={{background:BG,border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:TX,outline:"none",width:130}}/></label>
                      <label style={{display:"flex",flexDirection:"column",gap:6,fontSize:13,color:MT,fontWeight:600}}>Duración por cita<select value={avail.slot_minutes} onChange={e=>{setAvail(a=>({...a,slot_minutes:Number(e.target.value)}));setSavedA(false);}} style={{background:BG,border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:TX,outline:"none",width:150}}>{[15,30,45,60,90,120].map(m=><option key={m} value={m}>{m} min</option>)}</select></label>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:TX,marginBottom:4}}>Notas <span style={{fontWeight:400,color:MT,fontSize:12}}>(opcionales)</span></div>
                    <textarea value={avail.notes} onChange={e=>{setAvail(a=>({...a,notes:e.target.value}));setSavedA(false);}} rows={3} placeholder="Ej: Estamos en Av. Principal #123. Recuerda llegar 5 min antes."
                      style={{width:"100%",background:BG,border:`1.5px solid ${BD}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:TX,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <button onClick={saveAvail} disabled={savingA} style={{background:BL,color:"#fff",border:"none",borderRadius:10,padding:"10px 28px",fontWeight:700,fontSize:14,cursor:"pointer",opacity:savingA?0.7:1}}>{savingA?"Guardando...":"💾 Guardar disponibilidad"}</button>
                    {savedA&&<span style={{fontSize:13,color:"#16A34A",fontWeight:600}}>✅ Guardado</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{padding:"28px 28px 0"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:900,margin:0,letterSpacing:"-0.02em"}}>Agendamiento de Citas</h1>
            <p style={{margin:"4px 0 0",fontSize:14,color:MT}}>El bot recopila la información automáticamente por WhatsApp</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            {pendingCount>0&&<div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:10,padding:"7px 14px",fontSize:13,color:"#D97706",fontWeight:700}}>⏳ {pendingCount} pendiente{pendingCount!==1?"s":""}</div>}
            <button onClick={exportCSV} style={{background:WH,border:`1.5px solid ${BD}`,color:MT,borderRadius:10,padding:"8px 13px",cursor:"pointer",fontSize:13,fontWeight:600}}>⬇ CSV</button>
            <button onClick={loadAppointments} style={{background:WH,border:`1.5px solid ${BD}`,color:MT,borderRadius:10,padding:"8px 13px",cursor:"pointer",fontSize:15}} title="Actualizar">↻</button>
            <button onClick={()=>setShowConfig(true)} style={{background:WH,border:`1.5px solid ${BD}`,color:TX,borderRadius:10,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚙️ Configurar</button>
          </div>
        </div>

        {/* Month nav + view toggle */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,paddingBottom:16,borderBottom:`1px solid ${BD}`}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={prevMonth} style={{background:WH,border:`1.5px solid ${BD}`,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",color:MT}}>‹</button>
            <h2 style={{margin:0,fontSize:18,fontWeight:800,color:TX,minWidth:180,textAlign:"center"}}>{MONTHS[mo]} {yr}</h2>
            <button onClick={nextMonth} style={{background:WH,border:`1.5px solid ${BD}`,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",color:MT}}>›</button>
            <button onClick={()=>{setYr(today.getFullYear());setMo(today.getMonth());setSelDay(null);}} style={{marginLeft:6,background:WH,border:`1.5px solid ${BD}`,borderRadius:8,padding:"5px 13px",fontSize:13,cursor:"pointer",color:MT,fontWeight:600}}>Hoy</button>
          </div>
          <div style={{display:"flex",gap:3,background:"#F1F5F9",borderRadius:10,padding:3}}>
            {[["calendar","📅 Calendario"],["list","📋 Lista"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setViewMode(id);setSelDay(null);}} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:viewMode===id?WH:"transparent",color:viewMode===id?TX:MT,boxShadow:viewMode===id?"0 1px 4px rgba(0,0,0,.08)":"none",transition:"all .15s"}}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar view ── */}
      {viewMode==="calendar"&&(
        <div style={{padding:"12px 28px 40px",position:"relative"}}>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:2}}>
            {DAYS_S.map(d=>(
              <div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:12,fontWeight:700,color:MT,letterSpacing:"0.04em"}}>{d}</div>
            ))}
          </div>
          {/* Grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,background:BD,border:`1px solid ${BD}`,borderRadius:12,overflow:"hidden"}}>
            {calDays.map((day,idx)=>{
              const key=day?`${yr}-${mo}-${day}`:null;
              const dayAppts=key?(apptsByDay[key]||[]):[];
              const isToday=day&&today.getDate()===day&&today.getMonth()===mo&&today.getFullYear()===yr;
              const isSel=selDay&&selDay.day===day&&selDay.mo===mo&&selDay.yr===yr;
              return(
                <div key={idx} onClick={e=>handleDayClick(day,e)}
                  style={{background:day?(isSel?BLL:WH):"#F8FAFF",minHeight:90,padding:"6px 6px 4px",cursor:day?"pointer":"default",transition:"background 0.1s",
                    borderBottom:idx<calDays.length-7?`1px solid ${BD}`:"none"}}
                  onMouseEnter={e=>{if(day&&!isSel)e.currentTarget.style.background="#F8FAFF";}}
                  onMouseLeave={e=>{if(day&&!isSel)e.currentTarget.style.background=WH;}}>
                  {day&&(
                    <>
                      <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:3,
                        background:isToday?BL:"transparent",color:isToday?WH:TX,fontSize:13,fontWeight:isToday?800:400}}>
                        {day}
                      </div>
                      {dayAppts.slice(0,3).map(appt=>{
                        const sc=STATUS_CFG[appt.status]||STATUS_CFG.pendiente;
                        return(
                          <div key={appt.id} style={{fontSize:11,fontWeight:600,borderRadius:4,padding:"2px 5px",marginBottom:2,background:sc.chip,color:sc.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {appt.contact_name||appt.from_phone}
                          </div>
                        );
                      })}
                      {dayAppts.length>3&&<div style={{fontSize:10,color:MT,fontWeight:600,paddingLeft:2}}>+{dayAppts.length-3} más</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{display:"flex",gap:16,marginTop:12,flexWrap:"wrap"}}>
            {Object.entries(STATUS_CFG).map(([k,v])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:3,background:v.chip,border:`1px solid ${v.border}`}}/>
                <span style={{fontSize:12,color:MT,fontWeight:600}}>{v.label}</span>
              </div>
            ))}
            <span style={{fontSize:12,color:MT,marginLeft:"auto"}}>{appointments.length} cita{appointments.length!==1?"s":""} en total</span>
          </div>

          {/* ── Day popup ── */}
          {selDay&&(
            <>
              <div style={{position:"fixed",inset:0,zIndex:500}} onClick={()=>setSelDay(null)}/>
              <div style={{position:"fixed",left:popupPos.x,top:popupPos.y,zIndex:600,background:WH,borderRadius:14,width:300,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",border:`1px solid ${BD}`,overflow:"hidden"}}>
                {/* Popup header */}
                <div style={{padding:"14px 16px 12px",borderBottom:`1px solid ${BD}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:TX}}>{DAYS_L[new Date(selDay.yr,selDay.mo,selDay.day).getDay()]}</div>
                    <div style={{fontSize:13,color:MT}}>{selDay.day} de {MONTHS[selDay.mo]} {selDay.yr}</div>
                  </div>
                  <button onClick={()=>setSelDay(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:MT,lineHeight:1,marginTop:-2}}>×</button>
                </div>
                {/* Appointments list */}
                <div style={{maxHeight:320,overflow:"auto"}}>
                  {selDay.appts.length===0?(
                    <div style={{padding:24,textAlign:"center",color:MT,fontSize:13}}>
                      <div style={{fontSize:28,marginBottom:6}}>📅</div>
                      Sin citas este día
                    </div>
                  ):selDay.appts.map(appt=>{
                    const sc=STATUS_CFG[appt.status]||STATUS_CFG.pendiente;
                    return(
                      <div key={appt.id} style={{padding:"11px 16px",borderBottom:`1px solid #F1F5F9`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:sc.color,flexShrink:0}}/>
                            <span style={{fontSize:13,fontWeight:700,color:TX,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{appt.contact_name||appt.from_phone}</span>
                          </div>
                          {fields.slice(0,2).map(f=>appt.data?.[f.field_key]&&(
                            <div key={f.field_key} style={{fontSize:11,color:MT,marginLeft:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.field_label}: {appt.data[f.field_key]}</div>
                          ))}
                          <div style={{marginLeft:14,marginTop:4}}>
                            <select value={appt.status} onChange={e=>updateStatus(appt.id,e.target.value)} disabled={notifying===appt.id}
                              style={{fontSize:11,fontWeight:700,border:`1px solid ${sc.border}`,background:sc.bg,color:sc.color,borderRadius:12,padding:"2px 8px",cursor:"pointer",outline:"none"}}>
                              <option value="pendiente">Pendiente</option>
                              <option value="confirmada">Confirmada</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          </div>
                        </div>
                        <button onClick={()=>{setSelDay(null);setDetailAppt(appt);}} style={{background:"#F1F5F9",border:"none",borderRadius:7,padding:"4px 10px",cursor:"pointer",fontSize:11,color:MT,fontWeight:600,flexShrink:0,marginTop:2}}>Ver →</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── List view ── */}
      {viewMode==="list"&&(
        <div style={{padding:"20px 28px 40px"}}>
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#94A3B8"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
                style={{background:WH,border:`1.5px solid ${BD}`,color:TX,borderRadius:10,padding:"8px 12px 8px 32px",fontSize:13,width:200,outline:"none",fontFamily:"inherit"}}
                onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD}/>
            </div>
            {["all","pendiente","confirmada","cancelada"].map(s=>(
              <button key={s} onClick={()=>setStatusFilter(s)} style={{padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer",border:`1.5px solid ${statusFilter===s?BL:BD}`,background:statusFilter===s?BLL:WH,color:statusFilter===s?BL:MT}}>
                {s==="all"?"Todas":STATUS_CFG[s]?.label}
                <span style={{marginLeft:5,fontSize:12}}>({s==="all"?appointments.length:appointments.filter(a=>a.status===s).length})</span>
              </button>
            ))}
          </div>
          <div style={{background:WH,border:`1.5px solid ${BD}`,borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
                <thead>
                  <tr style={{background:BG,borderBottom:`1.5px solid ${BD}`}}>
                    <th style={TH}>Contacto</th>
                    {fields.map(f=><th key={f.field_key} style={TH}>{f.field_label}</th>)}
                    <th style={TH}>Estado</th>
                    <th style={TH}>Fecha</th>
                    <th style={{width:44}}/>
                  </tr>
                </thead>
                <tbody>
                  {loadingAppts?(
                    <tr><td colSpan={fields.length+4} style={{padding:48,textAlign:"center",color:MT}}>Cargando...</td></tr>
                  ):filteredAppts.length===0?(
                    <tr><td colSpan={fields.length+4} style={{padding:56,textAlign:"center"}}>
                      <div style={{fontSize:40,marginBottom:10}}>📅</div>
                      <div style={{fontSize:15,fontWeight:700,color:TX,marginBottom:4}}>{search||statusFilter!=="all"?"Sin resultados":"Aún no hay citas"}</div>
                      <div style={{fontSize:13,color:MT}}>{search||statusFilter!=="all"?"Prueba con otro filtro":"Cuando alguien agende por WhatsApp aparecerá aquí"}</div>
                    </td></tr>
                  ):filteredAppts.map((appt,i)=>{
                    const sc=STATUS_CFG[appt.status]||STATUS_CFG.pendiente;
                    return(
                      <tr key={appt.id} style={{borderBottom:i<filteredAppts.length-1?`1px solid ${BD}`:"none",cursor:"pointer",transition:"background 0.12s"}}
                        onClick={()=>setDetailAppt(appt)}
                        onMouseEnter={e=>e.currentTarget.style.background=BG} onMouseLeave={e=>e.currentTarget.style.background=WH}>
                        <td style={TD}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:BLL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:BL,flexShrink:0}}>
                              {(appt.contact_name||appt.from_phone)[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:TX}}>{appt.contact_name||appt.from_phone}</div>
                              <div style={{fontSize:11,color:MT}}>{appt.from_phone}</div>
                            </div>
                          </div>
                        </td>
                        {fields.map(f=>(
                          <td key={f.field_key} style={TD}><span style={{fontSize:13,color:appt.data?.[f.field_key]?TX:MT,fontStyle:appt.data?.[f.field_key]?"normal":"italic"}}>{appt.data?.[f.field_key]||"—"}</span></td>
                        ))}
                        <td style={TD} onClick={e=>e.stopPropagation()}>
                          <select value={appt.status} onChange={e=>updateStatus(appt.id,e.target.value)} disabled={notifying===appt.id}
                            style={{padding:"4px 8px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",border:`1.5px solid ${sc.border}`,background:sc.bg,color:sc.color,outline:"none",opacity:notifying===appt.id?0.6:1}}>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                        </td>
                        <td style={TD}><span style={{fontSize:13,color:MT}}>{new Date(appt.created_at).toLocaleDateString("es-MX",{day:"2-digit",month:"short"})}</span></td>
                        <td style={TD} onClick={e=>e.stopPropagation()}><button onClick={()=>deleteAppt(appt.id)} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"5px 9px",cursor:"pointer",fontSize:12}}>🗑</button></td>
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

function Bubble({children}){return <div style={{alignSelf:"flex-start",background:"#F1F5F9",borderRadius:"14px 14px 14px 4px",padding:"10px 14px",fontSize:13,color:TX,lineHeight:1.5}}>{children}</div>;}
const TH={padding:"11px 14px",fontSize:11,fontWeight:700,color:MT,textTransform:"uppercase",letterSpacing:"0.06em",textAlign:"left",whiteSpace:"nowrap"};
const TD={padding:"13px 14px",verticalAlign:"middle"};
