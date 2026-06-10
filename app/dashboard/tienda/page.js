
"use client";
import { useState, useEffect, useCallback } from "react";

const BL="#2563EB",BLL="#EFF6FF",TX="#0F172A",MT="#64748B",WH="#FFFFFF",BD="#E2E8F0",RD="#EF4444",GR="#10B981",AM="#F59E0B";
const TYPE_COLORS = { service:"#7C3AED",product:"#2563EB",package:"#059669" };
const TYPE_LABELS = { service:"Servicio",product:"Producto",package:"Paquete" };
const TYPE_ICONS  = { service:"",product:"",package:"" };
const STATUS_COLOR = { active:GR, inactive:MT, draft:AM };

function toast(msg, ok=true) {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;background:${ok?"#10B981":"#EF4444"};color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.15)`;
  el.textContent = (ok ? "" : "") + " " + msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

function Badge({ label, color }) {
  return <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:color+"22",color }}>{label}</span>;
}

function ImgUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false);
  async function pick(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      onChange([...(images||[]), { url: dataUrl, caption: file.name }]);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }
  return (
    <div>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:8 }}>
        {(images||[]).map((img,i) => (
          <div key={i} style={{ position:"relative",width:64,height:64,borderRadius:8,overflow:"hidden",border:`1.5px solid ${BD}` }}>
            <img src={img.url} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />
            <button onClick={()=>onChange((images||[]).filter((_,j)=>j!==i))}
              style={{ position:"absolute",top:2,right:2,background:"rgba(239,68,68,.9)",border:"none",borderRadius:4,color:"#fff",fontSize:10,cursor:"pointer",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center" }}>x</button>
          </div>
        ))}
        <label style={{ width:64,height:64,borderRadius:8,border:`2px dashed ${BD}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:2,background:"#F8FAFF" }}>
          <span style={{ fontSize:20 }}>{uploading?"...":""}</span>
          <span style={{ fontSize:10,color:MT }}>Agregar</span>
          <input type="file" accept="image/*" style={{ display:"none" }} onChange={pick} />
        </label>
      </div>
    </div>
  );
}

function ItemModal({ item, categories, onSave, onClose }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState(item || { name:"",description:"",price:"",currency:"MXN",type:"service",category_id:"",images:[],tags:"",status:"active",sku:"",inventory:"" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  async function save() {
    if (!form.name) { toast("Nombre requerido", false); return; }
    setSaving(true);
    const body = { ...form, tags: form.tags ? form.tags.split(",").map(t=>t.trim()).filter(Boolean) : [], price: form.price||null, inventory: form.inventory||null, sku: form.sku||null, category_id: form.category_id||null };
    const url  = isEdit ? `/api/catalog/items/${item.id}` : "/api/catalog/items";
    const meth = isEdit ? "PATCH" : "POST";
    const r = await fetch(url, { method:meth, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { toast(d.error||"Error", false); return; }
    toast(isEdit ? "Item actualizado" : "Item creado");
    onSave(d.item);
  }

  const inp = (k, label, type="text", placeholder="") => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12,fontWeight:600,color:TX,display:"block",marginBottom:4 }}>{label}</label>
      <input type={type} value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={placeholder}
        style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:13,color:TX,background:WH,outline:"none",boxSizing:"border-box" }}
        onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD} />
    </div>
  );

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:WH,borderRadius:16,padding:28,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:800,color:TX }}>{isEdit?"Editar":"Crear"} Item</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:MT }}>x</button>
        </div>

        {/* Type selector */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:600,color:TX,display:"block",marginBottom:6 }}>Tipo</label>
          <div style={{ display:"flex",gap:8 }}>
            {Object.entries(TYPE_LABELS).map(([k,v])=>(
              <button key={k} onClick={()=>set("type",k)} style={{ padding:"7px 14px",borderRadius:8,border:"1.5px solid",cursor:"pointer",fontSize:13,fontWeight:600,
                background:form.type===k?TYPE_COLORS[k]+"22":WH, borderColor:form.type===k?TYPE_COLORS[k]:BD, color:form.type===k?TYPE_COLORS[k]:MT }}>
                {TYPE_ICONS[k]} {v}
              </button>
            ))}
          </div>
        </div>

        {inp("name","Nombre *","text","Ej: Corte de cabello")}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:600,color:TX,display:"block",marginBottom:4 }}>Descripcion</label>
          <textarea rows={3} value={form.description||""} onChange={e=>set("description",e.target.value)} placeholder="Describe el servicio o producto..."
            style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:13,color:TX,resize:"vertical",outline:"none",boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD} />
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {inp("price","Precio","number","0.00")}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,fontWeight:600,color:TX,display:"block",marginBottom:4 }}>Moneda</label>
            <select value={form.currency||"MXN"} onChange={e=>set("currency",e.target.value)}
              style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:13,color:TX,outline:"none" }}>
              {["MXN","USD","EUR","COP","ARS"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:600,color:TX,display:"block",marginBottom:4 }}>Categoria</label>
          <select value={form.category_id||""} onChange={e=>set("category_id",e.target.value)}
            style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:13,color:TX,outline:"none" }}>
            <option value="">Sin categoria</option>
            {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {inp("sku","SKU (opcional)")}
        {inp("inventory","Inventario (opcional)","number")}
        {inp("tags","Etiquetas (separadas por coma)","text","ej: promo, popular")}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:600,color:TX,display:"block",marginBottom:4 }}>Estado</label>
          <select value={form.status||"active"} onChange={e=>set("status",e.target.value)}
            style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:13,color:TX,outline:"none" }}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="draft">Borrador</option>
          </select>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12,fontWeight:600,color:TX,display:"block",marginBottom:6 }}>Imagenes</label>
          <ImgUploader images={form.images||[]} onChange={v=>set("images",v)} />
        </div>

        <div style={{ display:"flex",gap:10 }}>
          <button onClick={save} disabled={saving}
            style={{ flex:1,padding:"11px",background:saving?"#E2E8F0":BL,color:saving?MT:WH,border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer" }}>
            {saving?"Guardando...": isEdit ? "Actualizar" : "Crear Item"}
          </button>
          <button onClick={onClose} style={{ padding:"11px 20px",background:"#F8FAFF",border:`1.5px solid ${BD}`,borderRadius:10,fontSize:13,color:MT,cursor:"pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryManager({ categories, onSave, onDelete }) {
  const [name, setName] = useState(""); const [saving, setSaving] = useState(false);
  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    const r = await fetch("/api/catalog/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name: name.trim(), icon:"tag" }) });
    const d = await r.json();
    setSaving(false);
    if (d.category) { setName(""); onSave(d.category); toast("Categoria creada"); }
    else toast(d.error||"Error", false);
  }
  return (
    <div style={{ background:WH,border:`1.5px solid ${BD}`,borderRadius:12,padding:20,marginBottom:20 }}>
      <h3 style={{ margin:"0 0 14px",fontSize:15,fontWeight:700,color:TX }}>Categorias</h3>
      <div style={{ display:"flex",gap:8,marginBottom:12 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nueva categoria..."
          style={{ flex:1,padding:"8px 12px",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:13,outline:"none" }}
          onKeyDown={e=>e.key==="Enter"&&add()} />
        <button onClick={add} disabled={saving}
          style={{ padding:"8px 16px",background:BL,color:WH,border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" }}>
          {saving?"...":"+ Agregar"}
        </button>
      </div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
        {categories.map(c=>(
          <div key={c.id} style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:"#F8FAFF",border:`1.5px solid ${BD}`,borderRadius:20,fontSize:13 }}>
            <span style={{ color:TX,fontWeight:600 }}>{c.name}</span>
            <button onClick={()=>onDelete(c.id)} style={{ background:"none",border:"none",color:RD,cursor:"pointer",fontSize:14,lineHeight:1,padding:0 }}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TiendaPage() {
  const [items, setItems]       = useState([]);
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterType, setFilter] = useState("all");
  const [modal, setModal]       = useState(null); // null | "create" | item
  const [showCats, setShowCats] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [ir, cr] = await Promise.all([
      fetch("/api/catalog/items").then(r=>r.json()),
      fetch("/api/catalog/categories").then(r=>r.json()),
    ]);
    setItems(ir.items || []);
    setCats(cr.categories || []);
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  async function deleteItem(id) {
    if (!confirm("Eliminar este item?")) return;
    const r = await fetch(`/api/catalog/items/${id}`, { method:"DELETE" });
    if (r.ok) { setItems(i=>i.filter(x=>x.id!==id)); toast("Item eliminado"); }
    else toast("Error al eliminar", false);
  }

  async function toggleStatus(item) {
    const newStatus = item.status === "active" ? "inactive" : "active";
    const r = await fetch(`/api/catalog/items/${item.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status:newStatus }) });
    const d = await r.json();
    if (d.item) setItems(i=>i.map(x=>x.id===item.id?d.item:x));
  }

  async function deleteCategory(id) {
    await fetch("/api/catalog/categories", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id }) });
    setCats(c=>c.filter(x=>x.id!==id));
    toast("Categoria eliminada");
  }

  let visible = items;
  if (filterType !== "all") visible = visible.filter(i=>i.type===filterType);
  if (search) {
    const lq = search.toLowerCase();
    visible = visible.filter(i=>i.name?.toLowerCase().includes(lq)||i.description?.toLowerCase().includes(lq));
  }

  const counts = { all:items.length, service:items.filter(i=>i.type==="service").length, product:items.filter(i=>i.type==="product").length, package:items.filter(i=>i.type==="package").length };

  return (
    <div style={{ maxWidth:1100 }}>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0,fontSize:26,fontWeight:900,color:TX,letterSpacing:"-0.03em" }}>Tienda</h1>
          <p style={{ margin:"4px 0 0",fontSize:14,color:MT }}>Gestiona tus productos, servicios y paquetes</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>setShowCats(s=>!s)}
            style={{ padding:"9px 16px",background:"#F8FAFF",border:`1.5px solid ${BD}`,borderRadius:10,fontSize:13,fontWeight:600,color:MT,cursor:"pointer" }}>
            Categorias
          </button>
          <button onClick={()=>setModal("create")}
            style={{ padding:"9px 18px",background:BL,color:WH,border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 2px 10px ${BL}44` }}>
            + Nuevo Item
          </button>
        </div>
      </div>

      {/* Category Manager */}
      {showCats && <CategoryManager categories={cats} onSave={c=>setCats(cs=>[...cs,c])} onDelete={deleteCategory} />}

      {/* Filters + Search */}
      <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:220 }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:MT,fontSize:15 }}></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o descripcion..."
            style={{ width:"100%",padding:"9px 12px 9px 36px",border:`1.5px solid ${BD}`,borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor="#93C5FD"} onBlur={e=>e.target.style.borderColor=BD} />
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {[["all","Todos"],["service","Servicios"],["product","Productos"],["package","Paquetes"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)}
              style={{ padding:"8px 14px",borderRadius:8,border:"1.5px solid",cursor:"pointer",fontSize:13,fontWeight:600,
                background:filterType===k?BL:WH,borderColor:filterType===k?BL:BD,color:filterType===k?WH:MT }}>
              {l} <span style={{ fontSize:11,opacity:.7 }}>({counts[k]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div style={{ textAlign:"center",padding:60,color:MT }}>Cargando catalogo...</div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign:"center",padding:60,background:WH,borderRadius:16,border:`1.5px solid ${BD}` }}>
          <div style={{ fontSize:48,marginBottom:12 }}></div>
          <p style={{ color:MT,fontSize:15,margin:0 }}>{items.length===0?"Agrega tu primer producto, servicio o paquete.":"Sin resultados para esta busqueda."}</p>
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
          {visible.map(item => {
            const img = item.images?.[0];
            const tc  = TYPE_COLORS[item.type] || BL;
            return (
              <div key={item.id} style={{ background:WH,borderRadius:14,border:`1.5px solid ${BD}`,overflow:"hidden",transition:"box-shadow .2s" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 20px rgba(37,99,235,.1)`}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                {/* Image */}
                <div style={{ height:160,background:"#F1F5F9",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  {img ? <img src={img.url} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt={item.name} />
                       : <span style={{ fontSize:40,opacity:.3 }}>{TYPE_ICONS[item.type]}</span>}
                </div>
                {/* Body */}
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex",gap:6,marginBottom:8,flexWrap:"wrap" }}>
                    <Badge label={TYPE_LABELS[item.type]||item.type} color={tc} />
                    <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:STATUS_COLOR[item.status]+"22",color:STATUS_COLOR[item.status] }}>{item.status}</span>
                    {item.catalog_categories?.name && <Badge label={item.catalog_categories.name} color={MT} />}
                  </div>
                  <h3 style={{ margin:"0 0 4px",fontSize:15,fontWeight:700,color:TX }}>{item.name}</h3>
                  {item.description && <p style={{ margin:"0 0 10px",fontSize:13,color:MT,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{item.description}</p>}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:18,fontWeight:900,color:TX }}>{item.price ? `${parseFloat(item.price).toLocaleString("es-MX",{minimumFractionDigits:2})} ${item.currency}` : <span style={{color:MT,fontSize:13}}>Sin precio</span>}</span>
                  </div>
                  {/* Actions */}
                  <div style={{ display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid #F1F5F9` }}>
                    <button onClick={()=>setModal(item)} style={{ flex:1,padding:"7px",background:"#F8FAFF",border:`1.5px solid ${BD}`,borderRadius:8,fontSize:12,fontWeight:600,color:TX,cursor:"pointer" }}>
                      Editar
                    </button>
                    <button onClick={()=>toggleStatus(item)}
                      style={{ padding:"7px 12px",background:item.status==="active"?"#FEF2F2":"#F0FDF4",border:"1.5px solid",borderColor:item.status==="active"?RD+"44":GR+"44",borderRadius:8,fontSize:12,fontWeight:600,color:item.status==="active"?RD:GR,cursor:"pointer" }}>
                      {item.status==="active"?"Desactivar":"Activar"}
                    </button>
                    <button onClick={()=>deleteItem(item.id)} style={{ padding:"7px 10px",background:"#FEF2F2",border:`1.5px solid ${RD}22`,borderRadius:8,fontSize:12,color:RD,cursor:"pointer" }}>
                      
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Modal */}
      {(modal === "create" || (modal && modal.id)) && (
        <ItemModal
          item={modal === "create" ? null : modal}
          categories={cats}
          onSave={saved => {
            if (modal === "create") setItems(i=>[saved,...i]);
            else setItems(i=>i.map(x=>x.id===saved.id?saved:x));
            setModal(null);
          }}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}
