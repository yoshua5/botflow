"use client";
import { useState, useEffect } from "react";

const DEFAULT_SECTIONS = {
  hero: {
    headline: "Automatiza tu negocio con IA",
    subheadline: "Crea agentes de WhatsApp que responden, venden y gestionan citas las 24 horas.",
    ctaText: "Empieza Gratis",
    ctaUrl: "/sign-up",
  },
  stats: [
    { label:"Empresas activas", value:"500+" },
    { label:"Mensajes procesados", value:"1M+" },
    { label:"Tiempo de respuesta", value:"< 2s" },
    { label:"Disponibilidad", value:"99.9%" },
    { label:"Satisfacción clientes", value:"4.9/5" },
  ],
  pricing: {
    starter: { price:"29", desc:"Para emprendedores" },
    pro:     { price:"79", desc:"Para negocios en crecimiento" },
    enterprise: { price:"199", desc:"Para empresas" },
  },
  cta: {
    headline: "¿Listo para automatizar tu negocio?",
    subheadline: "Únete a cientos de empresas que ya usan AgentFlow",
  },
};

export default function LandingCMSPage() {
  const [config, setConfig]   = useState(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [tab, setTab]         = useState("hero");

  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(()=>setToast(null), 3000); };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/landing");
        const d = await r.json();
        if (d && Object.keys(d).length > 0) setConfig({ ...DEFAULT_SECTIONS, ...d });
      } catch(e) {}
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/landing", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(config) });
      const d = await r.json();
      if (d.ok || d.success) showToast("Landing actualizada ✅ (los cambios se verán en producción)");
      else showToast("Error al guardar", false);
    } catch(e) { showToast("Error: " + e.message, false); }
    setSaving(false);
  };

  const setNested = (path, value) => {
    const parts = path.split(".");
    setConfig(c => {
      const copy = JSON.parse(JSON.stringify(c));
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const Field = ({ label, path, type="text", rows=1 }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>{label}</label>
      {rows > 1
        ? <textarea rows={rows} value={path.split(".").reduce((o,k)=>o?.[k], config)||""} onChange={e=>setNested(path, e.target.value)}
            style={{ width:"100%",background:"#0A0A0F",border:"1px solid #2D2D44",borderRadius:7,padding:"8px 12px",color:"#E2E8F0",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box" }} />
        : <input type={type} value={path.split(".").reduce((o,k)=>o?.[k], config)||""} onChange={e=>setNested(path, e.target.value)}
            style={{ width:"100%",background:"#0A0A0F",border:"1px solid #2D2D44",borderRadius:7,padding:"8px 12px",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box" }} />
      }
    </div>
  );

  const TABS = [["hero","🏠 Hero"],["stats","📊 Stats"],["pricing","💎 Precios"],["cta","📣 CTA"]];

  return (
    <div>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"#22C55E":"#EF4444",color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600 }}>{toast.ok?"✅":"❌"} {toast.msg}</div>}

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#fff",margin:0 }}>Landing Page CMS</h1>
          <div style={{ fontSize:13,color:"#475569",marginTop:4 }}>Edita el contenido del sitio en tiempo real</div>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <a href="/" target="_blank" rel="noreferrer" style={{ padding:"9px 16px",background:"#1A1A2E",border:"1px solid #2D2D44",borderRadius:8,color:"#94A3B8",fontSize:13,textDecoration:"none",fontWeight:600 }}>
            👁️ Ver Landing
          </a>
          <button onClick={save} disabled={saving} style={{ padding:"9px 18px",background:"#6366F1",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer" }}>
            {saving ? "Guardando..." : "💾 Guardar cambios"}
          </button>
        </div>
      </div>

      <div style={{ display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #1E1E2E" }}>
        {TABS.map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            padding:"10px 16px",background:"transparent",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",
            color: tab===key?"#6366F1":"#475569",
            borderBottom: tab===key?"2px solid #6366F1":"2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ background:"#111118",border:"1px solid #1E1E2E",borderRadius:12,padding:24 }}>
        {tab === "hero" && (
          <div>
            <Field label="Headline principal" path="hero.headline" />
            <Field label="Subtítulo" path="hero.subheadline" rows={3} />
            <Field label="Texto del botón CTA" path="hero.ctaText" />
            <Field label="URL del botón CTA" path="hero.ctaUrl" />
          </div>
        )}

        {tab === "stats" && (
          <div>
            <div style={{ fontSize:13,color:"#475569",marginBottom:16 }}>Estadísticas mostradas en la barra de prueba social</div>
            {(config.stats||[]).map((s,i)=>(
              <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10,padding:12,background:"#0A0A0F",borderRadius:8 }}>
                <div>
                  <label style={{ fontSize:11,color:"#475569",fontWeight:700,display:"block",marginBottom:4 }}>Label</label>
                  <input value={s.label} onChange={e=>setConfig(c=>{ const stats=[...c.stats]; stats[i]={...stats[i],label:e.target.value}; return {...c,stats}; })}
                    style={{ width:"100%",background:"#111118",border:"1px solid #2D2D44",borderRadius:6,padding:"6px 10px",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize:11,color:"#475569",fontWeight:700,display:"block",marginBottom:4 }}>Valor</label>
                  <input value={s.value} onChange={e=>setConfig(c=>{ const stats=[...c.stats]; stats[i]={...stats[i],value:e.target.value}; return {...c,stats}; })}
                    style={{ width:"100%",background:"#111118",border:"1px solid #2D2D44",borderRadius:6,padding:"6px 10px",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "pricing" && (
          <div>
            {["starter","pro","enterprise"].map(plan=>(
              <div key={plan} style={{ marginBottom:20,padding:16,background:"#0A0A0F",borderRadius:10 }}>
                <div style={{ fontWeight:700,color:"#fff",marginBottom:10,textTransform:"capitalize" }}>{plan}</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  <div>
                    <label style={{ fontSize:11,color:"#475569",fontWeight:700,display:"block",marginBottom:4 }}>Precio (USD/mes)</label>
                    <input value={config.pricing?.[plan]?.price||""} onChange={e=>setNested(`pricing.${plan}.price`,e.target.value)}
                      style={{ width:"100%",background:"#111118",border:"1px solid #2D2D44",borderRadius:6,padding:"6px 10px",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize:11,color:"#475569",fontWeight:700,display:"block",marginBottom:4 }}>Descripción</label>
                    <input value={config.pricing?.[plan]?.desc||""} onChange={e=>setNested(`pricing.${plan}.desc`,e.target.value)}
                      style={{ width:"100%",background:"#111118",border:"1px solid #2D2D44",borderRadius:6,padding:"6px 10px",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "cta" && (
          <div>
            <Field label="Headline del CTA final" path="cta.headline" />
            <Field label="Subtítulo del CTA" path="cta.subheadline" rows={2} />
          </div>
        )}
      </div>

      <div style={{ marginTop:16,background:"#F59E0B11",border:"1px solid #F59E0B33",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#F59E0B" }}>
        💡 Los cambios se guardan en la base de datos y la landing los carga automáticamente en el próximo request.
      </div>
    </div>
  );
}