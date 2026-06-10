
"use client";
import { useState, useEffect } from "react";

const BL="#2563EB",BLL="#EFF6FF",TX="#0F172A",MT="#64748B",WH="#FFFFFF",BD="#E2E8F0",GR="#10B981",RD="#EF4444",AM="#F59E0B";

const STATUS_COLORS = { paid:GR, pending:AM, failed:RD, refunded:MT };
const STATUS_LABELS = { paid:"Pagado", pending:"Pendiente", failed:"Fallido", refunded:"Reembolsado" };

function Badge({ status }) {
  return <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:STATUS_COLORS[status]+"22",color:STATUS_COLORS[status] }}>{STATUS_LABELS[status]||status}</span>;
}

function ConnectCard({ connect, onOnboard, onDashboard, loading }) {
  if (!connect) return (
    <div style={{ background:WH,border:`1.5px solid ${BD}`,borderRadius:16,padding:32,textAlign:"center" }}>
      <div style={{ fontSize:48,marginBottom:12 }}></div>
      <h3 style={{ margin:"0 0 8px",fontSize:18,fontWeight:800,color:TX }}>Conecta tu cuenta de pagos</h3>
      <p style={{ margin:"0 0 24px",color:MT,fontSize:14 }}>Conecta Stripe para recibir pagos de tus clientes directamente en tu cuenta bancaria.</p>
      <ul style={{ textAlign:"left",display:"inline-block",margin:"0 0 24px",fontSize:13,color:MT,lineHeight:1.8 }}>
        <li> Verificacion de identidad segura</li>
        <li> Depositos automaticos a tu banco</li>
        <li> Panel de pagos y retiros</li>
        <li> Sin complicaciones</li>
      </ul>
      <br />
      <button onClick={onOnboard} disabled={loading}
        style={{ padding:"12px 32px",background:loading?"#E2E8F0":BL,color:loading?MT:WH,border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:loading?"none":`0 4px 16px ${BL}44` }}>
        {loading?"Cargando...":"Conectar Stripe"}
      </button>
    </div>
  );

  const statusInfo = {
    active:    { color:GR, icon:"", text:"Activo  listo para recibir pagos" },
    pending:   { color:AM, icon:"", text:"Pendiente  completa tu configuracion" },
    restricted:{ color:RD, icon:"", text:"Restringido  informacion adicional requerida" },
  }[connect.status] || { color:MT, icon:"", text:"Estado desconocido" };

  return (
    <div style={{ background:WH,border:`2px solid ${statusInfo.color}44`,borderRadius:16,padding:28 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12 }}>
        <div>
          <h3 style={{ margin:"0 0 4px",fontSize:17,fontWeight:800,color:TX }}>Cuenta de Pagos Stripe</h3>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ color:statusInfo.color,fontSize:18 }}>{statusInfo.icon}</span>
            <span style={{ fontSize:13,fontWeight:600,color:statusInfo.color }}>{statusInfo.text}</span>
          </div>
          {connect.email && <p style={{ margin:"8px 0 0",fontSize:13,color:MT }}>{connect.email}</p>}
        </div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {connect.status === "pending" && (
            <button onClick={onOnboard} disabled={loading}
              style={{ padding:"9px 18px",background:AM,color:WH,border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer" }}>
              Completar Setup
            </button>
          )}
          {connect.status === "active" && (
            <button onClick={onDashboard} disabled={loading}
              style={{ padding:"9px 18px",background:BL,color:WH,border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer" }}>
              Ver Panel Stripe
            </button>
          )}
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:20 }}>
        {[
          ["Cargos habilitados", connect.chargesEnabled ? "" : "", connect.chargesEnabled ? GR : RD],
          ["Retiros habilitados", connect.payoutsEnabled ? "" : "", connect.payoutsEnabled ? GR : RD],
          ["Datos enviados",      connect.detailsSubmitted ? "" : "", connect.detailsSubmitted ? GR : AM],
        ].map(([label, icon, color]) => (
          <div key={label} style={{ padding:"12px 16px",background:"#F8FAFF",borderRadius:10,border:`1px solid ${BD}` }}>
            <span style={{ fontSize:18,color }}>{icon}</span>
            <div style={{ fontSize:12,color:MT,marginTop:4,fontWeight:600 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PagosPage() {
  const [connect, setConnect]   = useState(null);
  const [orders,  setOrders]    = useState([]);
  const [loading, setLoading]   = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [tab, setTab]           = useState("overview");

  useEffect(()=>{
    // Check URL params
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected")) window.history.replaceState({}, "", "/dashboard/pagos");
    if (p.get("refresh")) window.history.replaceState({}, "", "/dashboard/pagos");
    loadAll();
  },[]);

  async function loadAll() {
    setLoading(true);
    const [cs, or] = await Promise.all([
      fetch("/api/stripe/connect/status").then(r=>r.json()).catch(()=>({})),
      fetch("/api/catalog/orders").then(r=>r.json()).catch(()=>({})),
    ]);
    setConnect(cs.connected ? cs : null);
    setOrders(or.orders || []);
    setLoading(false);
  }

  async function handleOnboard() {
    setOnboarding(true);
    const r = await fetch("/api/stripe/connect/onboard", { method:"POST" });
    const d = await r.json();
    setOnboarding(false);
    if (d.url) window.location.href = d.url;
    else alert(d.error || "Error al conectar");
  }

  async function handleDashboard() {
    setOnboarding(true);
    const r = await fetch("/api/stripe/connect/dashboard", { method:"POST" });
    const d = await r.json();
    setOnboarding(false);
    if (d.url) window.open(d.url, "_blank");
    else alert(d.error || "Error");
  }

  const paid = orders.filter(o=>o.status==="paid");
  const totalRevenue = paid.reduce((s,o)=>s+(o.seller_payout||0),0);
  const totalFees    = paid.reduce((s,o)=>s+(o.platform_fee||0),0);

  const TABS = [["overview","Resumen"],["orders","Ordenes"],["setup","Configuracion"]];

  return (
    <div style={{ maxWidth:1000 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0,fontSize:26,fontWeight:900,color:TX,letterSpacing:"-0.03em" }}>Pagos</h1>
        <p style={{ margin:"4px 0 0",fontSize:14,color:MT }}>Recibe pagos de tus clientes y gestiona tu historial</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,marginBottom:24,background:"#F1F5F9",borderRadius:10,padding:4,width:"fit-content" }}>
        {TABS.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 18px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
              background:tab===k?WH:transparent,color:tab===k?TX:MT,boxShadow:tab===k?"0 1px 4px rgba(0,0,0,.08)":"none",transition:"all .15s" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:"center",padding:60,color:MT }}>Cargando...</div>
      ) : (
        <>
          {tab === "overview" && (
            <div>
              {/* KPIs */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24 }}>
                {[
                  ["Ingresos Totales", `$${totalRevenue.toLocaleString("es-MX",{minimumFractionDigits:2})}`, GR],
                  ["Ordenes Pagadas",  paid.length.toString(), BL],
                  ["Ordenes Totales",  orders.length.toString(), MT],
                ].map(([label, val, color])=>(
                  <div key={label} style={{ background:WH,borderRadius:14,border:`1.5px solid ${BD}`,padding:"18px 20px" }}>
                    <div style={{ fontSize:12,fontWeight:700,color:MT,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:28,fontWeight:900,color:TX,letterSpacing:"-0.02em" }}>{val}</div>
                  </div>
                ))}
              </div>
              <ConnectCard connect={connect} onOnboard={handleOnboard} onDashboard={handleDashboard} loading={onboarding} />
            </div>
          )}

          {tab === "orders" && (
            <div style={{ background:WH,borderRadius:16,border:`1.5px solid ${BD}`,overflow:"hidden" }}>
              <div style={{ padding:"16px 20px",borderBottom:`1px solid #F1F5F9` }}>
                <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:TX }}>Historial de Ordenes</h3>
              </div>
              {orders.length === 0 ? (
                <div style={{ padding:48,textAlign:"center",color:MT }}>
                  <div style={{ fontSize:36,marginBottom:8 }}></div>
                  <p style={{ margin:0 }}>Aun no tienes ordenes. Los pagos de tu catalogo apareceran aqui.</p>
                </div>
              ) : (
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F8FAFF" }}>
                      {["Cliente","Producto","Total","Comision","Tu Pago","Estado","Fecha"].map(h=>(
                        <th key={h} style={{ padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:MT,textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o=>(
                      <tr key={o.id} style={{ borderTop:"1px solid #F1F5F9" }}>
                        <td style={{ padding:"12px 16px",fontSize:13,color:TX,fontWeight:600 }}>{o.customer_name||o.customer_phone||""}</td>
                        <td style={{ padding:"12px 16px",fontSize:13,color:MT }}>{o.catalog_items?.name||""}</td>
                        <td style={{ padding:"12px 16px",fontSize:13,fontWeight:700,color:TX }}>${parseFloat(o.total_amount||0).toFixed(2)} {o.currency}</td>
                        <td style={{ padding:"12px 16px",fontSize:12,color:RD }}>{o.platform_fee>0?`-$${o.platform_fee.toFixed(2)}`:""}</td>
                        <td style={{ padding:"12px 16px",fontSize:13,fontWeight:700,color:GR }}>${parseFloat(o.seller_payout||0).toFixed(2)}</td>
                        <td style={{ padding:"12px 16px" }}><Badge status={o.status}/></td>
                        <td style={{ padding:"12px 16px",fontSize:12,color:MT }}>{new Date(o.created_at).toLocaleDateString("es-MX")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "setup" && (
            <ConnectCard connect={connect} onOnboard={handleOnboard} onDashboard={handleDashboard} loading={onboarding} />
          )}
        </>
      )}
    </div>
  );
}
