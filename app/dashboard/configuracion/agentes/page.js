"use client";
import { useState, useEffect, useRef } from "react";

const BL="#2563EB",BLL="#EFF6FF",TX="#0F172A",MT="#64748B",WH="#FFFFFF",BD="#E2E8F0",SL="#F8FAFC";
const GR="#10B981",GRL="#ECFDF5";

function Card({children,style={}}) { return <div style={{background:WH,borderRadius:16,border:`1px solid ${BD}`,padding:"24px 28px",...style}}>{children}</div>; }
function SectionTitle({icon,title,subtitle}) {
  return <div style={{marginBottom:20}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
      <span style={{fontSize:18}}>{icon}</span>
      <h2 style={{margin:0,fontSize:17,fontWeight:700,color:TX}}>{title}</h2>
    </div>
    {subtitle&&<p style={{margin:"0 0 0 26px",fontSize:13,color:MT}}>{subtitle}</p>}
  </div>;
}
function Select({value,onChange,options}) {
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:10,fontSize:14,color:TX,background:WH,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select>;
}
function Toggle({on,onChange,label,hint}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
    <div>
      <div style={{fontSize:14,fontWeight:600,color:TX}}>{label}</div>
      {hint&&<div style={{fontSize:12,color:MT,marginTop:2}}>{hint}</div>}
    </div>
    <button onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:12,background:on?BL:BD,border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:on?22:3,width:18,height:18,borderRadius:"50%",background:WH,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}} />
    </button>
  </div>;
}
function Textarea({value,onChange,placeholder,rows=3}) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${BD}`,borderRadius:10,fontSize:14,color:TX,background:WH,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}
    onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD}
  />;
}

const BOT_GREET_DEFAULT = "Hola {{nombre}}, bienvenido. Soy el asistente virtual de {{negocio}}. ¿En qué te puedo ayudar hoy?";
const BOT_BYE_DEFAULT = "Fue un placer atenderte. Si necesitas algo más, no dudes en escribirnos. ¡Hasta pronto! 👋";

// Simulate bot response for preview
function simulateResponse(cfg, userMsg) {
  const greet = cfg.greeting || BOT_GREET_DEFAULT;
  const bye = cfg.farewell || BOT_BYE_DEFAULT;
  const lower = userMsg.toLowerCase();
  if (["hola","hi","buenas","buenos días","buenos dias","hey"].some(w=>lower.includes(w)))
    return addTone(greet.replace("{{nombre}}","").replace("{{negocio}}","tu empresa").trim(), cfg);
  if (["adios","adiós","bye","gracias chau","hasta luego"].some(w=>lower.includes(w)))
    return addTone(bye, cfg);
  if (lower.includes("precio") || lower.includes("costo") || lower.includes("cuánto"))
    return addTone("Te voy a proporcionar información sobre nuestros precios. " + (cfg.useEmojis?"💰 ":"") + "Contamos con diferentes opciones según tus necesidades. ¿Podrías indicarme qué producto o servicio te interesa?", cfg);
  if (lower.includes("hora") || lower.includes("horario"))
    return addTone("Nuestro horario de atención es " + (cfg.workingHours || "Lunes a Viernes de 9:00 a 18:00") + ". " + (cfg.useEmojis?"🕘 ":"") + "¿Hay algo más en lo que pueda ayudarte?", cfg);
  return addTone("Entiendo tu consulta. " + (cfg.useEmojis?"😊 ":"") + "Permíteme ayudarte con eso. ¿Podrías darme más detalles para poder asistirte mejor?", cfg);
}
function addTone(msg, cfg) {
  if (cfg.tone === "formal" || cfg.tone === "corporativo") return msg.replace("😊","").replace("👋","").replace("💰","").trim();
  if (cfg.tone === "casual") return msg + (cfg.useEmojis?" 🙂":"");
  return msg;
}

export default function AgentesPage() {
  const [cfg, setCfg] = useState({
    enabled: true, responseDelay: "0", language: "es", accent: "mx", tone: "amigable",
    greeting: BOT_GREET_DEFAULT, farewell: BOT_BYE_DEFAULT,
    formality: "medio", useEmojis: true, shortAnswers: false,
    workingHours: "Lunes a Viernes 9:00–18:00", transferToHuman: false,
  });
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewInput, setPreviewInput] = useState("");
  const [chat, setChat] = useState([{ from: "bot", text: "¡Hola! Soy tu agente virtual. Escríbeme algo para ver cómo respondo. 👋" }]);
  const chatRef = useRef();

  useEffect(() => {
    fetch("/api/config").then(r=>r.json()).then(d=>{
      setCfg(c=>({
        ...c,
        enabled: d.agentEnabled !== false,
        responseDelay: String(d.responseDelay ?? "0"),
        language: d.language || "es",
        accent: d.accent || "mx",
        tone: d.tone || "amigable",
        greeting: d.greeting || BOT_GREET_DEFAULT,
        farewell: d.farewell || BOT_BYE_DEFAULT,
        formality: d.formality || "medio",
        useEmojis: d.useEmojis !== false,
        shortAnswers: d.shortAnswers || false,
        workingHours: d.hours || "Lunes a Viernes 9:00–18:00",
        transferToHuman: d.transferToHuman || false,
      }));
      setLoading(false);
    });
  }, []);

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; },[chat]);

  function sendPreview() {
    if (!previewInput.trim()) return;
    const msg = previewInput.trim();
    setPreviewInput("");
    setChat(c=>[...c,{from:"user",text:msg}]);
    const delay = parseInt(cfg.responseDelay)||0;
    setTimeout(()=>{
      const resp = simulateResponse(cfg, msg);
      setChat(c=>[...c,{from:"bot",text:resp}]);
    }, delay*1000 + 400);
  }

  async function save() {
    setSaving(true); setSaved(false);
    await fetch("/api/config",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        agentEnabled: cfg.enabled, responseDelay: parseInt(cfg.responseDelay)||0,
        language: cfg.language, accent: cfg.accent, tone: cfg.tone,
        greeting: cfg.greeting, farewell: cfg.farewell, formality: cfg.formality,
        useEmojis: cfg.useEmojis, shortAnswers: cfg.shortAnswers,
        hours: cfg.workingHours, transferToHuman: cfg.transferToHuman,
      }),
    });
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000);
  }

  const set = key => val => setCfg(c=>({...c,[key]:val}));

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:28,display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:TX}}>Agentes</h1>
          <p style={{margin:"6px 0 0",color:MT,fontSize:14}}>Controla el comportamiento, personalidad y respuestas de tu agente IA.</p>
        </div>
        <button onClick={save} disabled={saving} style={{padding:"10px 24px",background:saved?GR:BL,color:WH,border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:saving?"wait":"pointer",transition:"background 0.2s"}}>
          {saving?"⏳ Guardando...":saved?"✅ Guardado":"💾 Guardar cambios"}
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:24,alignItems:"start"}}>
        {/* Left — config panels */}
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* State + Delay */}
          <Card>
            <SectionTitle icon="⚡" title="Estado y Velocidad" />
            <Toggle on={cfg.enabled} onChange={set("enabled")} label="Agente activo" hint="Cuando está apagado, el bot no responderá ningún mensaje." />
            <div style={{borderTop:`1px solid ${BD}`,margin:"12px 0"}} />
            <div style={{marginBottom:6}}>
              <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:8}}>⏱️ Tiempo de espera antes de responder</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["0","Inmediato"],["2","2 seg"],["5","5 seg"],["10","10 seg"]].map(([v,l])=>(
                  <button key={v} onClick={()=>set("responseDelay")(v)} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${cfg.responseDelay===v?BL:BD}`,background:cfg.responseDelay===v?BLL:WH,color:cfg.responseDelay===v?BL:MT,fontSize:13,fontWeight:cfg.responseDelay===v?700:400,cursor:"pointer",transition:"all 0.15s"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Personality */}
          <Card>
            <SectionTitle icon="🌍" title="Personalidad del Agente" subtitle="Define el idioma, acento y tono de tu agente." />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:6}}>Idioma</label>
                <Select value={cfg.language} onChange={set("language")} options={[
                  {value:"es",label:"🇲🇽 Español"},{value:"en",label:"🇺🇸 Inglés"},{value:"fr",label:"🇫🇷 Francés"},
                  {value:"de",label:"🇩🇪 Alemán"},{value:"pt",label:"🇧🇷 Portugués"},{value:"other",label:"Otro"},
                ]} />
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:6}}>Acento / Región</label>
                <Select value={cfg.accent} onChange={set("accent")} options={[
                  {value:"mx",label:"🇲🇽 México"},{value:"es",label:"🇪🇸 España"},{value:"ar",label:"🇦🇷 Argentina"},
                  {value:"co",label:"🇨🇴 Colombia"},{value:"us",label:"🇺🇸 Estados Unidos"},{value:"uk",label:"🇬🇧 Reino Unido"},{value:"other",label:"Otro"},
                ]} />
              </div>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:8}}>Tono de Comunicación</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["amigable","😊 Amigable"],["profesional","💼 Profesional"],["formal","🎩 Formal"],["casual","🤙 Casual"],["corporativo","🏛️ Corporativo"],["vendedor","💰 Vendedor"],["soporte","🛠️ Soporte"],["personalizado","✏️ Personalizado"]].map(([v,l])=>(
                  <button key={v} onClick={()=>set("tone")(v)} style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${cfg.tone===v?BL:BD}`,background:cfg.tone===v?BLL:WH,color:cfg.tone===v?BL:MT,fontSize:12,fontWeight:cfg.tone===v?700:400,cursor:"pointer",transition:"all 0.15s"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Behavior */}
          <Card>
            <SectionTitle icon="🧠" title="Comportamiento del Agente" />
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:6}}>Saludo inicial</label>
              <Textarea value={cfg.greeting} onChange={set("greeting")} placeholder={BOT_GREET_DEFAULT} rows={2} />
              <p style={{margin:"4px 0 0",fontSize:11,color:MT}}>Usa {'{{nombre}}'} para el nombre del cliente y {'{{negocio}}'} para tu empresa.</p>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:6}}>Despedida</label>
              <Textarea value={cfg.farewell} onChange={set("farewell")} placeholder={BOT_BYE_DEFAULT} rows={2} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:6}}>Longitud de respuestas</label>
                <Select value={cfg.shortAnswers?"corta":"normal"} onChange={v=>set("shortAnswers")(v==="corta")} options={[{value:"normal",label:"Normal"},{value:"corta",label:"Concisa / Corta"},{value:"larga",label:"Detallada / Larga"}]} />
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:6}}>Horario de atención</label>
                <input value={cfg.workingHours} onChange={e=>set("workingHours")(e.target.value)} placeholder="Lun–Vie 9:00–18:00"
                  style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:10,fontSize:13,color:TX,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
                  onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD}
                />
              </div>
            </div>
            <div style={{borderTop:`1px solid ${BD}`,paddingTop:16}}>
              <Toggle on={cfg.useEmojis} onChange={set("useEmojis")} label="Usar emojis en respuestas" hint="Hace las conversaciones más amigables y expresivas." />
              <Toggle on={cfg.transferToHuman} onChange={set("transferToHuman")} label="Transferir a humano cuando sea necesario" hint="El bot avisará al equipo cuando no pueda resolver la consulta." />
            </div>
          </Card>
        </div>

        {/* Right — Live Preview */}
        <div style={{position:"sticky",top:24}}>
          <Card style={{padding:"20px 20px 16px"}}>
            <SectionTitle icon="👁️" title="Vista Previa en Vivo" subtitle="Escribe para ver cómo responderá tu agente." />
            {/* Phone mockup */}
            <div style={{background:"#1C1C1E",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
              {/* Header */}
              <div style={{background:"#128C7E",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
                <div>
                  <div style={{color:WH,fontWeight:700,fontSize:14}}>Agente Virtual</div>
                  <div style={{color:"rgba(255,255,255,0.75)",fontSize:11}}>{cfg.enabled?"En línea":"Desconectado"}</div>
                </div>
              </div>
              {/* Chat area */}
              <div ref={chatRef} style={{background:"#ECE5DD",padding:"12px",height:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
                {chat.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"80%",padding:"8px 12px",borderRadius:m.from==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.from==="user"?"#DCF8C6":"#FFFFFF",fontSize:13,color:TX,lineHeight:1.5,boxShadow:"0 1px 2px rgba(0,0,0,0.1)"}}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              {/* Input */}
              <div style={{background:"#F0F0F0",padding:"10px 12px",display:"flex",gap:8}}>
                <input value={previewInput} onChange={e=>setPreviewInput(e.target.value)} placeholder="Escribe un mensaje..." onKeyDown={e=>e.key==="Enter"&&sendPreview()}
                  style={{flex:1,padding:"8px 12px",border:"none",borderRadius:20,fontSize:13,color:TX,outline:"none",fontFamily:"inherit"}} />
                <button onClick={sendPreview} style={{width:36,height:36,borderRadius:"50%",background:"#128C7E",border:"none",cursor:"pointer",color:WH,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>➤</button>
              </div>
            </div>
            <p style={{margin:"10px 0 0",fontSize:11,color:MT,textAlign:"center"}}>Simulación aproximada · Las respuestas reales usan IA</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
