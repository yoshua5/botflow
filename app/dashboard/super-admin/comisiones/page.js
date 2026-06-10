
"use client";
import { useState, useEffect } from "react";

const TX="#0F172A",MT="#64748B",WH="#FFFFFF",BD="#E2E8F0",BL="#2563EB",BLL="#EFF6FF",GR="#10B981",RD="#EF4444";

function toast(msg, ok=true) {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;background:${ok?"#10B981":"#EF4444"};color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

const STATUS_COLORS = { active:GR, pending:"#F59E0B", restricted:RD, rejected:RD };

export default function ComisionesPage() {
  const [commission, setCommission] = useState({ mode:"none", enabled:false, fixed_amount:0, percentage:0, currency:"MXN" });
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(()=>{
    Promise.all([
      fetch("/api/admin/commission").then(r=>r.json()),
      fetch("/api/admin/connect-accounts").then(r=>r.json()),
    ]).then(([c, a]) => {
      if (c.commission) setCommission(c.commission);
      setAccounts(a.accounts || []);
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/admin/commission", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(commission) });
    const d = await r.json();
    setSaving(false);
    if (d.commission) { setCommission(d.commission); toast("Comision guardada"); }
    else toast(d.error||"Error", false);
  }

  const set = (k,v) => setCommission(c=>({...c,[k]:v}));

  const previewFee = (amount=100) => {
    if (!commission.enabled) return 0;
    let fee = 0;
    if (commission.mode==="percentage"||commission.mode==="both") fee += amount*(commission.percentage/100);
    if (commission.mode==="fixed"||commission.mode==="both") fee += parseFloat(commission.fixed_amount)||0;
    return fee.toFixed(2);
  };

  return (
    <div style={{ maxWidth:900 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0,fontSize:22,fontWeight:900,color:TX }}>Comisiones</h1>
        <p style={{ margin:"4px 0 0",fontSize:14,color:MT }}>Configura la comision de la plataforma sobre ventas del catalogo</p>
      </div>

      {loading ? <div style={{ color:MT,padding:40,textAlign:"center" }}>Cargando...</div> : (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 360px",gap:24,alignItems:"start" }}>
          {/* Left: Config */}
          <div>
            <div style={{ background:WH,border:`1.5px solid ${BD}`,borderRadius:16,padding:28,marginBottom:20 }}>
              <h2 style={{ margin:"0 0 20px",fontSize:16,fontWeight:700,color:TX }}>Configuracion de Comision</h2>

              {/* Enable toggle */}
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,padding:"12px 16px",background:"#F8FAFF",borderRadius:10 }}>
                <div>
                  <div style={{ fontWeight:600,color:TX,fontSize:14 }}>Habilitar comision</div>
                  <div style={{ color:MT,fontSize:12 }}>La plataforma cobrara una comision sobre cada venta del catalogo</div>
                </div>
                <button onClick={()=>set("enabled",!commission.enabled)} style={{
                  width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",transition:"all .2s",position:"relative",
                  background:commission.enabled?BL:"#CBD5E1" }}>
                  <div style={{ position:"absolute",top:3,left:commission.enabled?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s" }} />
                </button>
              </div>

              {/* Mode */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:8 }}>Tipo de comision</label>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8 }}>
                  {[["none","Sin comision",""],["fixed","Fijo","$5 por venta"],["percentage","Porcentaje","5% de la venta"],["both","Fijo + %","$2 + 3%"]].map(([k,l,hint])=>(
                    <button key={k} onClick={()=>set("mode",k)} style={{
                      padding:"10px 14px",borderRadius:9,border:"1.5px solid",cursor:"pointer",textAlign:"left",
                      background:commission.mode===k?BLL:WH, borderColor:commission.mode===k?BL:BD }}>
                      <div style={{ fontSize:13,fontWeight:700,color:commission.mode===k?BL:TX }}>{l}</div>
                      {hint && <div style={{ fontSize:11,color:MT,marginTop:2 }}>{hint}</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amounts */}
              {(commission.mode==="fixed"||commission.mode==="both") && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:4 }}>Monto fijo ({commission.currency})</label>
                  <input type="number" value={commission.fixed_amount||0} onChange={e=>set("fixed_amount",e.target.value)} step="0.01" min="0"
                    style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box" }} />
                </div>
              )}
              {(commission.mode==="percentage"||commission.mode==="both") && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:13,fontWeight:600,color:TX,display:"block",marginBottom:4 }}>Porcentaje (%)</label>
                  <input type="number" value={commission.percentage||0} onChange={e=>set("percentage",e.target.value)} step="0.01" min="0" max="100"
                    style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box" }} />
                </div>
              )}

              <button onClick={save} disabled={saving}
                style={{ width:"100%",padding:"11px",background:saving?"#E2E8F0":BL,color:saving?MT:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",marginTop:8 }}>
                {saving?"Guardando...":"Guardar Configuracion"}
              </button>
            </div>
          </div>

          {/* Right: Preview + Stats */}
          <div>
            <div style={{ background:WH,border:`1.5px solid ${BD}`,borderRadius:14,padding:20,marginBottom:16 }}>
              <h3 style={{ margin:"0 0 12px",fontSize:14,fontWeight:700,color:TX }}>Vista Previa</h3>
              <div style={{ fontSize:13,color:MT,marginBottom:8 }}>Para una venta de $100:</div>
              <div style={{ fontSize:22,fontWeight:900,color:commission.enabled?BL:MT }}>
                {commission.enabled && commission.mode!=="none" ? `$${previewFee(100)} ${commission.currency}` : "Sin comision"}
              </div>
              {commission.enabled && (
                <div style={{ fontSize:12,color:MT,marginTop:4 }}>
                  El vendedor recibe: ${(100-parseFloat(previewFee(100))).toFixed(2)}
                </div>
              )}
            </div>

            <div style={{ background:WH,border:`1.5px solid ${BD}`,borderRadius:14,padding:20 }}>
              <h3 style={{ margin:"0 0 12px",fontSize:14,fontWeight:700,color:TX }}>Cuentas Connect ({accounts.length})</h3>
              {accounts.length === 0 ? (
                <p style={{ color:MT,fontSize:13,margin:0 }}>Ningun usuario ha conectado Stripe aun.</p>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {accounts.slice(0,10).map(a=>(
                    <div key={a.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#F8FAFF",borderRadius:8 }}>
                      <div>
                        <div style={{ fontSize:12,fontWeight:600,color:TX }}>{a.email||a.user_id.slice(0,12)}</div>
                        <div style={{ fontSize:11,color:MT }}>{a.stripe_account_id}</div>
                      </div>
                      <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:STATUS_COLORS[a.status]+"22",color:STATUS_COLORS[a.status]||MT }}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
