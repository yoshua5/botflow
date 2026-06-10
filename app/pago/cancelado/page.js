
"use client";
export default function CanceladoPage() {
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F8FAFF" }}>
      <div style={{ background:"#fff",borderRadius:20,padding:48,maxWidth:420,textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
        <div style={{ fontSize:64,marginBottom:16 }}></div>
        <h1 style={{ margin:"0 0 8px",fontSize:24,fontWeight:900,color:"#0F172A" }}>Pago Cancelado</h1>
        <p style={{ color:"#64748B",fontSize:15 }}>El pago fue cancelado. Puedes volver a intentarlo en cualquier momento.</p>
      </div>
    </div>
  );
}
