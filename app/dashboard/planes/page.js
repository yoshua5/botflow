"use client";
import { useState, useEffect } from "react";
import { } from "next/navigation";

const BLUE    = "#2563EB";
const BLUE_L  = "#EFF6FF";
const BLUE_M  = "#DBEAFE";
const PURPLE  = "#7C3AED";
const PURPLE_L= "#F5F3FF";
const TEXT    = "#0F172A";
const MUTED   = "#64748B";
const WHITE   = "#FFFFFF";
const GREEN   = "#16A34A";
const RED     = "#DC2626";

const PLANS = [
  { id:"free",name:"Free",price:0,interval:null,color:"#64748B",colorLight:"#F8FAFF",colorBorder:"#E2E8F0",badge:null,features:["1 bot","100 mensajes / mes","3 archivos Knowledge Base","Chat de prueba"],limits:"1 bot · 100 msgs/mes" },
  { id:"starter",name:"Starter",price:29,interval:"mes",color:BLUE,colorLight:BLUE_L,colorBorder:"#BFDBFE",badge:null,features:["3 bots","2,000 mensajes / mes","20 archivos Knowledge Base","WhatsApp Business real","Analytics básicos","Soporte por email"],limits:"3 bots · 2,000 msgs/mes" },
  { id:"pro",name:"Pro",price:79,interval:"mes",color:PURPLE,colorLight:PURPLE_L,colorBorder:"#DDD6FE",badge:"Más popular",features:["10 bots","10,000 mensajes / mes","100 archivos Knowledge Base","WhatsApp Business real","Analytics avanzados","Soporte prioritario","Acceso anticipado a funciones"],limits:"10 bots · 10,000 msgs/mes" },
  { id:"enterprise",name:"Enterprise",price:199,interval:"mes",color:TEXT,colorLight:"#F8FAFF",colorBorder:"#CBD5E1",badge:null,features:["Bots ilimitados","Mensajes ilimitados","Knowledge Base ilimitado","WhatsApp Business real","Analytics completos","Soporte dedicado 24/7","Onboarding personalizado","SLA garantizado"],limits:"Bots y msgs ilimitados" },
];

function PlanCard({ plan, currentPlanId, onUpgrade, onPortal, loading }) {
  const isCurrent = plan.id === currentPlanId;
  const isFree = plan.id === "free";
  const isDowngrade = PLANS.findIndex(p=>p.id===plan.id) < PLANS.findIndex(p=>p.id===currentPlanId);
  return (
    <div style={{ background:WHITE, borderRadius:18, border:isCurrent?`2px solid ${plan.color}`:"1.5px solid #E2E8F0", padding:"28px 24px", display:"flex", flexDirection:"column", position:"relative", transition:"all 0.2s", boxShadow:isCurrent?`0 0 0 4px ${plan.color}22`:"none" }}
      onMouseEnter={e=>{ if(!isCurrent){e.currentTarget.style.borderColor=plan.color+"80";e.currentTarget.style.boxShadow=`0 4px 24px ${plan.color}18`;} }}
      onMouseLeave={e=>{ if(!isCurrent){e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.boxShadow="none";} }}>
      {plan.badge&&(<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:PURPLE,color:WHITE,fontSize:11,fontWeight:800,padding:"4px 14px",borderRadius:100,whiteSpace:"nowrap"}}>⭐ {plan.badge}</div>)}
      {isCurrent&&(<div style={{position:"absolute",top:14,right:14,background:plan.colorLight,border:`1px solid ${plan.colorBorder}`,color:plan.color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100}}>TU PLAN</div>)}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:900,color:plan.color,marginBottom:6}}>{plan.name}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:4}}>
          {isFree?(<span style={{fontSize:32,fontWeight:900,color:TEXT}}>Gratis</span>):(<><span style={{fontSize:11,fontWeight:700,color:MUTED,alignSelf:"flex-start",marginTop:8}}>USD</span><span style={{fontSize:38,fontWeight:900,color:TEXT,letterSpacing:"-0.03em"}}>${plan.price}</span><span style={{fontSize:13,color:MUTED}}>/{plan.interval}</span></>)}
        </div>
        <div style={{fontSize:12,color:MUTED}}>{plan.limits}</div>
      </div>
      <div style={{height:1,background:"#F1F5F9",marginBottom:16}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:9,marginBottom:24}}>
        {plan.features.map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:13,color:TEXT}}><span style={{color:plan.color,fontWeight:700,fontSize:14,flexShrink:0}}>✓</span>{f}</div>))}
      </div>
      {isCurrent?(<button disabled style={{width:"100%",padding:"11px",background:plan.colorLight,border:`1.5px solid ${plan.colorBorder}`,borderRadius:10,fontSize:14,fontWeight:700,color:plan.color,cursor:"default",fontFamily:"inherit"}}>✓ Plan actual</button>)
      :isFree?(<button disabled style={{width:"100%",padding:"11px",background:"#F8FAFF",border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:14,fontWeight:600,color:MUTED,cursor:"default",fontFamily:"inherit"}}>Incluido</button>)
      :isDowngrade?(<button onClick={()=>onPortal()} disabled={loading} style={{width:"100%",padding:"11px",background:WHITE,border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:14,fontWeight:600,color:MUTED,cursor:"pointer",fontFamily:"inherit"}}>Cambiar a {plan.name}</button>)
      :(<button onClick={()=>onUpgrade(plan.id)} disabled={loading} style={{width:"100%",padding:"11px",background:loading?"#E2E8F0":plan.color,border:"none",borderRadius:10,fontSize:14,fontWeight:700,color:loading?MUTED:WHITE,cursor:loading?"default":"pointer",fontFamily:"inherit",transition:"all 0.2s",boxShadow:loading?"none":`0 2px 10px ${plan.color}44`}}>{loading?"Procesando...":`Actualizar a ${plan.name}`}</button>)}
    </div>
  );
}

export default function PlanesPage() {
  const [sub,setSub] = useState(null);
  const [loading,setLoading] = useState(false);
  const [loadingSub,setLoadingSub] = useState(true);
  const [msg,setMsg] = useState(null);
  const [showCancel,setShowCancel] = useState(false);

  useEffect(()=>{
    if((typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("success") : null)) setMsg({type:"success",text:"¡Pago exitoso! Tu plan ha sido activado. 🎉"});
    if((typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("canceled") : null)) setMsg({type:"info",text:"Proceso cancelado. Tu plan no fue modificado."});
  },[]);

  useEffect(()=>{
    fetch("/api/subscription").then(r=>r.json()).then(d=>{setSub(d);setLoadingSub(false);}).catch(()=>setLoadingSub(false));
  },[]);

  const handleUpgrade = async (planId) => {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch("/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId})});
      const data = await res.json();
      if(data.url) window.location.href=data.url;
      else setMsg({type:"error",text:data.error||"Error al iniciar el checkout"});
    } catch(e){ setMsg({type:"error",text:"Error: "+e.message}); }
    setLoading(false);
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal",{method:"POST"});
      const data = await res.json();
      if(data.url) window.location.href=data.url;
      else setMsg({type:"error",text:data.error||"Error abriendo portal"});
    } catch(e){ setMsg({type:"error",text:"Error: "+e.message}); }
    setLoading(false);
  };

  const currentPlanId = sub?.plan||"free";
  const isFree = currentPlanId==="free";
  const isActive = sub?.status==="active";
  const willCancel = sub?.cancelAtPeriodEnd;
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"}) : null;

  return (
    <div style={{maxWidth:1040,margin:"0 auto"}}>
      <div style={{marginBottom:32}}>
        <h1 style={{fontSize:30,fontWeight:900,color:TEXT,letterSpacing:"-0.03em",marginBottom:8}}>Planes y Suscripción</h1>
        <p style={{fontSize:15,color:MUTED}}>Elige el plan que se adapta a tu negocio. Cancela cuando quieras.</p>
      </div>

      {msg&&(<div style={{background:msg.type==="success"?"#F0FDF4":msg.type==="error"?"#FEF2F2":BLUE_L,border:`1.5px solid ${msg.type==="success"?"#86EFAC":msg.type==="error"?"#FCA5A5":"#BFDBFE"}`,borderRadius:12,padding:"14px 18px",marginBottom:24,fontSize:14,fontWeight:600,color:msg.type==="success"?GREEN:msg.type==="error"?RED:BLUE,display:"flex",alignItems:"center",gap:8}}>
        {msg.type==="success"?"✅":msg.type==="error"?"❌":"ℹ️"}{msg.text}
        <button onClick={()=>setMsg(null)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:14,color:MUTED}}>✕</button>
      </div>)}

      {!loadingSub&&!isFree&&(<div style={{background:WHITE,border:"1.5px solid #E2E8F0",borderRadius:16,padding:"20px 24px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:BLUE_M,border:"1px solid #93C5FD",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💳</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:TEXT}}>Plan {sub?.planName}
              <span style={{marginLeft:10,fontSize:11,padding:"3px 9px",borderRadius:100,fontWeight:700,background:isActive&&!willCancel?"#F0FDF4":"#FFF7ED",color:isActive&&!willCancel?GREEN:"#B45309"}}>
                {willCancel?"Cancela al final del periodo":isActive?"● Activo":sub?.status||"Inactivo"}
              </span>
            </div>
            <div style={{fontSize:13,color:MUTED,marginTop:2}}>${sub?.amount||0} USD/mes{periodEnd&&(!willCancel?` · Próxima renovación: ${periodEnd}`:` · Activo hasta: ${periodEnd}`)}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {sub?.lastInvoiceDate&&(<button onClick={()=>window.open("/api/stripe/receipt","_blank")} style={{padding:"8px 16px",background:BLUE_L,border:"1.5px solid #BFDBFE",borderRadius:9,fontSize:13,fontWeight:700,color:BLUE,cursor:"pointer",fontFamily:"inherit"}}>🧾 Ver recibo</button>)}
          <button onClick={handlePortal} disabled={loading} style={{padding:"8px 16px",background:WHITE,border:"1.5px solid #E2E8F0",borderRadius:9,fontSize:13,fontWeight:600,color:MUTED,cursor:"pointer",fontFamily:"inherit"}}>⚙️ Gestionar</button>
          {!willCancel&&isActive&&(<button onClick={()=>setShowCancel(true)} style={{padding:"8px 16px",background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:9,fontSize:13,fontWeight:700,color:RED,cursor:"pointer",fontFamily:"inherit"}}>Cancelar plan</button>)}
        </div>
      </div>)}

      {showCancel&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24}}>
        <div style={{background:WHITE,borderRadius:20,padding:"32px",maxWidth:420,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>
          <div style={{fontSize:36,marginBottom:16,textAlign:"center"}}>⚠️</div>
          <h3 style={{fontSize:20,fontWeight:800,color:TEXT,textAlign:"center",marginBottom:10}}>¿Cancelar suscripción?</h3>
          <p style={{fontSize:14,color:MUTED,textAlign:"center",lineHeight:1.6,marginBottom:24}}>Tu plan seguirá activo hasta el {periodEnd||"final del periodo"}. Después pasarás al plan gratuito.</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowCancel(false)} style={{flex:1,padding:"11px",background:WHITE,border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:14,fontWeight:600,color:MUTED,cursor:"pointer",fontFamily:"inherit"}}>No, mantener</button>
            <button onClick={async()=>{setShowCancel(false);await handlePortal();}} style={{flex:1,padding:"11px",background:RED,border:"none",borderRadius:10,fontSize:14,fontWeight:700,color:WHITE,cursor:"pointer",fontFamily:"inherit"}}>Cancelar plan</button>
          </div>
        </div>
      </div>)}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18,marginBottom:32}}>
        {PLANS.map(plan=>(<PlanCard key={plan.id} plan={plan} currentPlanId={currentPlanId} onUpgrade={handleUpgrade} onPortal={handlePortal} loading={loading}/>))}
      </div>

      <div style={{background:WHITE,border:"1.5px solid #E2E8F0",borderRadius:16,padding:"24px 28px"}}>
        <div style={{fontSize:15,fontWeight:800,color:TEXT,marginBottom:16}}>Preguntas frecuentes</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[
            {q:"¿Puedo cancelar en cualquier momento?",a:"Sí. Un clic en «Cancelar plan» y listo. Mantienes acceso hasta el final del periodo pagado."},
            {q:"¿Hay cargos ocultos?",a:"No. El precio que ves es el precio final, en USD. Sin costos de activación ni comisiones por mensaje."},
            {q:"¿Qué pasa al llegar al límite de mensajes?",a:"El bot dejará de responder hasta el siguiente mes o hasta que actualices tu plan."},
            {q:"¿Puedo cambiar de plan?",a:"Sí. Los cambios se aplican de inmediato y los créditos no usados se prorratean automáticamente."},
          ].map((item,i)=>(<div key={i} style={{padding:"14px 0",borderBottom:i<2?"1px solid #F1F5F9":"none"}}>
            <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:6}}>{item.q}</div>
            <div style={{fontSize:13,color:MUTED,lineHeight:1.55}}>{item.a}</div>
          </div>))}
        </div>
      </div>
    </div>
  );
}

// requires in Next.js 13+
