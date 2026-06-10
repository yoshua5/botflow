"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser]   = useState(null);
  const [bots, setBots]   = useState([]);
  const [notes, setNotes] = useState([]);
  const [sub, setSub]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [tab, setTab]     = useState("overview");
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(()=>setToast(null), 3000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ur, br, nr] = await Promise.all([
        fetch(`/api/admin/users?search=${id}&limit=200`).then(r=>r.json()),
        fetch(`/api/admin/bots`).then(r=>r.json()),
        fetch(`/api/admin/notes?userId=${id}`).then(r=>r.json()),
      ]);
      const found = (ur.users||[]).find(u=>u.id===id);
      setUser(found || null);
      setBots((br.bots||[]).filter(b=>b.user_id===id));
      setNotes(nr.notes||[]);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const doUserAction = async (action, data={}) => {
    setActionLoading(true);
    const r = await fetch("/api/admin/users", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ userId: id, action, data }) });
    const d = await r.json();
    if (d.ok) { showToast(`Acción "${action}" ejecutada`); fetchAll(); }
    else showToast(d.error||"Error", false);
    setActionLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const r = await fetch("/api/admin/notes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ userId: id, content: newNote }) });
    const d = await r.json();
    if (d.note) { setNewNote(""); fetchAll(); showToast("Nota guardada"); }
  };

  const deleteNote = async (noteId) => {
    await fetch(`/api/admin/notes?id=${noteId}`, { method:"DELETE" });
    fetchAll();
  };

  const togglePinNote = async (noteId, pinned) => {
    await fetch("/api/admin/notes", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: noteId, is_pinned: !pinned }) });
    fetchAll();
  };

  if (loading) return <div style={{ color:"#64748B",padding:40,textAlign:"center" }}>Cargando usuario...</div>;
  if (!user)   return (
    <div style={{ textAlign:"center",padding:60 }}>
      <div style={{ fontSize:40,marginBottom:12 }}>❓</div>
      <div style={{ color:"#64748B" }}>Usuario no encontrado</div>
      <Link href="/dashboard/super-admin/users" style={{ color:"#2563EB",marginTop:8,display:"block" }}>← Volver</Link>
    </div>
  );

  const PLAN_COLORS = { free:"#64748B", starter:"#2563EB", pro:"#7C3AED", enterprise:"#F59E0B" };

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"#22C55E":"#EF4444",color:"#0F172A",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
          {toast.ok?"✅":"❌"} {toast.msg}
        </div>
      )}

      {/* Back */}
      <Link href="/dashboard/super-admin/users" style={{ color:"#64748B",fontSize:13,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6,marginBottom:20 }}>
        ← Todos los usuarios
      </Link>

      {/* User header */}
      <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:24,marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
          <div style={{ width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#0F172A",flexShrink:0 }}>
            {(user.email||"?")[0].toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:"#0F172A" }}>{user.name || user.email.split("@")[0]}</h2>
            <div style={{ fontSize:13,color:"#64748B",marginTop:2 }}>{user.email}</div>
            <div style={{ display:"flex",gap:8,marginTop:8,flexWrap:"wrap" }}>
              <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${PLAN_COLORS[user.plan]||"#64748B"}22`,color:PLAN_COLORS[user.plan]||"#64748B" }}>
                {user.plan?.toUpperCase()||"FREE"}
              </span>
              <span style={{ fontSize:11,color:"#64748B" }}>Registrado {user.created_at ? new Date(user.created_at).toLocaleDateString("es") : "—"}</span>
              <span style={{ fontSize:11,color:"#64748B" }}>{bots.length} bots</span>
            </div>
          </div>
          {/* Quick actions */}
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <select onChange={e=>{ if(e.target.value) doUserAction("change_plan",{ plan:e.target.value }); e.target.value=""; }} defaultValue=""
              style={{ padding:"8px 12px",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:8,color:"#64748B",fontSize:12,cursor:"pointer" }}>
              <option value="">Cambiar plan...</option>
              {["free","starter","pro","enterprise"].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={()=>doUserAction(user.subStatus==="suspended"?"reactivate":"suspend")} disabled={actionLoading}
              style={{ padding:"8px 14px",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:8,color:"#F59E0B",fontSize:12,fontWeight:600,cursor:"pointer" }}>
              {user.subStatus==="suspended"?"✅ Activar":"⏸️ Suspender"}
            </button>
            <button onClick={()=>{ if(confirm("¿Eliminar usuario?")) doUserAction("delete"); }}
              style={{ padding:"8px 14px",background:"#F8FAFF",border:"1px solid #EF444422",borderRadius:8,color:"#EF4444",fontSize:12,fontWeight:600,cursor:"pointer" }}>
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #1E1E2E",paddingBottom:0 }}>
        {[["overview","📊 Overview"],["bots","🤖 Bots"],["notes","📝 Notas"]].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{
            padding:"10px 16px",background:"transparent",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",
            color: tab===key ? "#2563EB" : "#64748B",
            borderBottom: tab===key ? "2px solid #6366F1" : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
          {[
            ["ID", id],
            ["Email", user.email],
            ["Nombre", user.name||"—"],
            ["Plan", user.plan||"free"],
            ["Estado suscripción", user.subStatus||"inactive"],
            ["Bots creados", bots.length],
            ["Registro", user.created_at ? new Date(user.created_at).toLocaleString("es") : "—"],
            ["Último acceso", user.last_login ? new Date(user.last_login).toLocaleString("es") : "—"],
          ].map(([k,v]) => (
            <div key={k} style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:10,padding:"16px 20px" }}>
              <div style={{ fontSize:11,color:"#64748B",fontWeight:700,textTransform:"uppercase",marginBottom:4 }}>{k}</div>
              <div style={{ fontSize:14,color:"#0F172A",wordBreak:"break-all" }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bots tab */}
      {tab === "bots" && (
        <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,overflow:"hidden" }}>
          {bots.length === 0 && <div style={{ padding:40,textAlign:"center",color:"#94A3B8" }}>Este usuario no tiene bots</div>}
          {bots.map(b => (
            <div key={b.id} style={{ display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderBottom:"1px solid #0F0F1A" }}>
              <div style={{ width:36,height:36,borderRadius:8,background:"#F8FAFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🤖</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600,color:"#0F172A" }}>{b.name}</div>
                <div style={{ fontSize:11,color:"#64748B" }}>@{b.handle} · {b.status}</div>
              </div>
              <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:b.status==="active"?"#22C55E22":"#EF444422",color:b.status==="active"?"#22C55E":"#EF4444" }}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Notes tab */}
      {tab === "notes" && (
        <div>
          {/* Add note */}
          <div style={{ background:"#FFFFFF",border:"1px solid #1E1E2E",borderRadius:12,padding:20,marginBottom:16 }}>
            <div style={{ fontSize:13,fontWeight:600,color:"#64748B",marginBottom:10 }}>Nueva Nota Interna</div>
            <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} rows={3}
              placeholder="Escribe una nota sobre este usuario..."
              style={{ width:"100%",background:"#F8FAFF",border:"1px solid #2D2D44",borderRadius:8,padding:12,color:"#0F172A",fontSize:13,resize:"vertical",outline:"none",boxSizing:"border-box" }} />
            <button onClick={addNote} style={{ marginTop:8,padding:"8px 18px",background:"#2563EB",border:"none",borderRadius:8,color:"#0F172A",fontSize:13,fontWeight:600,cursor:"pointer" }}>
              Guardar Nota
            </button>
          </div>
          {/* Notes list */}
          {notes.length === 0 && <div style={{ color:"#94A3B8",fontSize:13,padding:20 }}>Sin notas</div>}
          {notes.map(n => (
            <div key={n.id} style={{ background:"#FFFFFF",border:`1px solid ${n.is_pinned?"#F59E0B44":"#0F172A"}`,borderRadius:10,padding:16,marginBottom:10,position:"relative" }}>
              {n.is_pinned && <div style={{ position:"absolute",top:10,right:10,fontSize:12 }}>📌</div>}
              <div style={{ fontSize:13,color:"#0F172A",lineHeight:1.6 }}>{n.content}</div>
              <div style={{ display:"flex",gap:8,marginTop:10,alignItems:"center" }}>
                <span style={{ fontSize:11,color:"#94A3B8" }}>{new Date(n.created_at).toLocaleString("es")}</span>
                <button onClick={()=>togglePinNote(n.id, n.is_pinned)} style={{ padding:"3px 8px",background:"transparent",border:"1px solid #2D2D44",borderRadius:5,color:"#F59E0B",fontSize:11,cursor:"pointer" }}>
                  {n.is_pinned?"Desfijar":"Fijar"}
                </button>
                <button onClick={()=>deleteNote(n.id)} style={{ padding:"3px 8px",background:"transparent",border:"1px solid #EF444422",borderRadius:5,color:"#EF4444",fontSize:11,cursor:"pointer" }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}