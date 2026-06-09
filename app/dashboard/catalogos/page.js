"use client";
import { useState, useEffect } from "react";

const BG     = "#F8FAFF";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";
const TEXT   = "#0F172A";
const BLUE   = "#2563EB";
const BLUE_L = "#EFF6FF";

function typeLabel(type, name) {
  if (!type) return name?.split(".").pop()?.toUpperCase() || "—";
  if (type === "Sitio Web") return "Web";
  if (type.startsWith("image/")) return "IMG";
  if (type.includes("pdf"))  return "PDF";
  if (type.includes("word") || name?.endsWith(".docx")) return "DOC";
  if (type.includes("excel") || name?.endsWith(".xlsx")) return "XLS";
  if (type.includes("csv"))  return "CSV";
  return type.split("/").pop()?.toUpperCase() || "FILE";
}

function typeColor(type) {
  if (!type || type.startsWith("image/")) return "#7C3AED";
  if (type === "Sitio Web")  return "#059669";
  if (type.includes("pdf"))  return "#DC2626";
  if (type.includes("word")) return "#2563EB";
  return "#D97706";
}

function typeBg(type) {
  if (!type || type.startsWith("image/")) return "#F5F3FF";
  if (type === "Sitio Web")  return "#ECFDF5";
  if (type.includes("pdf"))  return "#FEF2F2";
  if (type.includes("word")) return "#EFF6FF";
  return "#FFFBEB";
}

export default function CatalogosPage() {
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/knowledge");
      const d = await r.json();
      setFiles(d.files || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteFile(id) {
    if (!confirm("¿Eliminar este archivo del catálogo?")) return;
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    load();
  }

  const filtered = files.filter(f => {
    const matchFilter =
      filter === "all" ||
      (filter === "img" && f.type?.startsWith("image/")) ||
      (filter === "doc" && !f.type?.startsWith("image/") && f.type !== "Sitio Web") ||
      (filter === "web" && f.type === "Sitio Web");
    const matchSearch = !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTERS = [
    { id: "all", label: "Todo" },
    { id: "img", label: "Imágenes" },
    { id: "doc", label: "Documentos" },
    { id: "web", label: "Sitios Web" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "32px 32px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: TEXT, letterSpacing: "-0.02em" }}>Catálogo</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: MUTED }}>Todo el contenido que conoce tu bot</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "8px 12px 8px 32px", fontSize: 13, width: 200, outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>
          <button onClick={load} style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 16, fontWeight: 600, transition: "all 0.15s" }}>↻</button>
          <a href="/dashboard/catalogos/contenido" style={{ background: BLUE, color: "#fff", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>+ Subir</a>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: "20px 32px 0", display: "flex", gap: 6, alignItems: "center" }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: filter === f.id ? `1.5px solid ${BLUE}` : `1.5px solid ${BORDER}`,
            background: filter === f.id ? BLUE_L : CARD,
            color: filter === f.id ? BLUE : MUTED,
            transition: "all 0.15s",
          }}>{f.label}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, color: MUTED }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      <div style={{ padding: "20px 32px 40px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: MUTED }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Cargando catálogo...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: TEXT }}>Catálogo vacío</div>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 28 }}>Sube imágenes, documentos o extrae contenido de tu sitio web</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a href="/dashboard/catalogos/contenido" style={{ background: BLUE, color: "#fff", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 2px 8px rgba(37,99,235,0.2)" }}>📸 Subir Contenido</a>
              <a href="/dashboard/catalogos/sitio-web" style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "10px 22px", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>🌐 Desde Sitio Web</a>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {filtered.map(file => (
              <FileCard key={file.id} file={file} onDelete={() => deleteFile(file.id)} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileCard({ file, onDelete, onRefresh }) {
  const isImage = file.type?.startsWith("image/") || file.isImage;
  const label   = typeLabel(file.type, file.name);
  const color   = typeColor(file.type);
  const bg      = typeBg(file.type);
  const [editing, setEditing] = useState(false);
  const [desc, setDesc]       = useState(file.description || "");
  const [saving, setSaving]   = useState(false);

  async function saveDesc() {
    setSaving(true);
    await fetch("/api/knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: file.id, description: desc }),
    });
    setSaving(false);
    setEditing(false);
    onRefresh();
  }

  return (
    <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}>
      {/* Preview */}
      <div style={{ height: 140, background: isImage ? "#F8FAFF" : bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {isImage ? (
          <img src={`/api/knowledge/image/${file.id}`} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 52 }}>
            {file.type === "Sitio Web" ? "🌐" : label === "PDF" ? "📄" : label === "DOC" ? "📝" : label === "CSV" || label === "XLS" ? "📊" : "📁"}
          </span>
        )}
        <span style={{ position: "absolute", top: 8, right: 8, background: bg, color, border: `1.5px solid ${color}`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em" }}>{label}</span>
        {file.status && (
          <span style={{ position: "absolute", top: 8, left: 8, width: 8, height: 8, borderRadius: "50%", background: file.status === "PROCESADO" ? "#22C55E" : file.status === "ERROR" ? "#EF4444" : "#F59E0B" }} />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>{file.name}</div>

        {editing ? (
          <div>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              rows={2}
              style={{ width: "100%", background: BG, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 8, padding: "6px 8px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={saveDesc} disabled={saving} style={{ flex: 1, background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "5px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{saving ? "..." : "Guardar"}</button>
              <button onClick={() => { setEditing(false); setDesc(file.description || ""); }} style={{ flex: 1, background: BG, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px", fontSize: 11, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: MUTED, cursor: "pointer", minHeight: 32, lineHeight: 1.5 }} onClick={() => setEditing(true)} title="Click para editar descripción">
            {file.description || <span style={{ color: "#C0CCDA", fontStyle: "italic" }}>+ Agregar descripción</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "0 14px 12px", display: "flex", gap: 6 }}>
        <button onClick={() => setEditing(e => !e)} style={{ flex: 1, background: BG, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "6px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>✏️ Editar</button>
        <button onClick={onDelete} style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", color: "#DC2626", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>🗑</button>
      </div>
    </div>
  );
}
