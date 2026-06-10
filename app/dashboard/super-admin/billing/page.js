"use client";
import { useState, useEffect } from "react";

export default function BillingPage() {
  const [stripe, setStripe]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/stripe");
        const d = await r.json();
        setStripe(d);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const openPortal = async () => {
    const r = await fetch("/api/billing/portal", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ returnUrl: window.location.href }) });
    const d = await r.json();
    if (d.url) window.open(d.url, "_blank");
  };

  const metrics = [
    { label:"Estado",     value: stripe?.connected ? "✅ Conectado" : "❌ Desconectado", color: stripe?.connected ? "#22C55E" : "#EF4444" },
    { label:"Cuenta",     value: stripe?.account?.email || "—", color:"#64748B" },
    { label:"País",       value: stripe?.account?.country || "—", color:"#64748B" },
    { label:"Moneda",     value: stripe?.account?.currency?.toUpperCase() || "—", color:"#64748B" },
  ];

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22,fontWeight:800,color:"#0F172A",margin:0 }}>Facturación & Stripe</h1>
        <div style={{ fontSize:13,color:"#64748B",marginTop:4 }}>Gestión de pagos, suscripciones y facturación</div>
      </div>

      {/* Stripe status */}
      <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24,marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
          <div style={{ width:40,height:40,background:"#635BFF22",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>💳</div>
          <div>
            <div style={{ fontWeight:700,color:"#0F172A",fontSize:16 }}>Stripe</div>
            <div style={{ fontSize:12,color:"#64748B" }}>Procesador de pagos</div>
          </div>
          <div style={{ marginLeft:"auto" }}>
            <span style={{ fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,
              background: stripe?.connected ? "#22C55E22" : "#EF444422",
              color: stripe?.connected ? "#22C55E" : "#EF4444" }}>
              {loading ? "Cargando..." : stripe?.connected ? "Conectado" : "No configurado"}
            </span>
          </div>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:20 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background:"#F8FAFF",borderRadius:8,padding:"14px 16px" }}>
              <div style={{ fontSize:11,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:14,color:m.color,fontWeight:600 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {stripe?.account?.availableBalance?.map((b,i) => (
          <div key={i} style={{ background:"#F8FAFF",borderRadius:8,padding:"14px 16px",marginBottom:8 }}>
            <div style={{ fontSize:11,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",marginBottom:4 }}>Balance Disponible ({b.currency?.toUpperCase()})</div>
            <div style={{ fontSize:20,color:"#22C55E",fontWeight:800 }}>${b.amount?.toLocaleString()}</div>
          </div>
        ))}

        {!stripe?.connected && (
          <div style={{ background:"#F59E0B11",border:"1px solid #F59E0B33",borderRadius:10,padding:16 }}>
            <div style={{ fontWeight:600,color:"#F59E0B",marginBottom:4 }}>⚠️ Stripe no configurado</div>
            <div style={{ fontSize:13,color:"#64748B" }}>
              Agrega <code style={{ background:"#F8FAFF",padding:"1px 6px",borderRadius:4,fontSize:11 }}>STRIPE_SECRET_KEY</code> a las variables de entorno en Vercel para activar pagos.
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24,marginBottom:20 }}>
        <div style={{ fontWeight:700,color:"#0F172A",fontSize:15,marginBottom:16 }}>Acciones Rápidas</div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
          <button onClick={openPortal} style={{ padding:"9px 18px",background:"#635BFF",border:"none",borderRadius:8,color:"#0F172A",fontSize:13,fontWeight:600,cursor:"pointer" }}>
            🔗 Abrir Portal de Stripe
          </button>
          <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer"
            style={{ padding:"9px 18px",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:8,color:"#64748B",fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-block" }}>
            ↗ Stripe Dashboard
          </a>
        </div>
      </div>

      {/* Webhook info */}
      <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24 }}>
        <div style={{ fontWeight:700,color:"#0F172A",fontSize:15,marginBottom:12 }}>Webhook de Stripe</div>
        <div style={{ fontSize:13,color:"#64748B",marginBottom:12 }}>
          Configura este endpoint en tu Stripe Dashboard → Webhooks para procesar pagos automáticamente:
        </div>
        <div style={{ background:"#F8FAFF",borderRadius:8,padding:"12px 16px",fontFamily:"monospace",fontSize:13,color:"#2563EB",wordBreak:"break-all" }}>
          {typeof window !== "undefined" ? window.location.origin : "https://botflow-nine.vercel.app"}/api/billing/webhook
        </div>
        <div style={{ fontSize:12,color:"#64748B",marginTop:12 }}>
          Eventos a escuchar: <code>customer.subscription.created</code>, <code>customer.subscription.updated</code>, <code>customer.subscription.deleted</code>, <code>invoice.payment_succeeded</code>, <code>invoice.payment_failed</code>
        </div>
      </div>
    </div>
  );
}