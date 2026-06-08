"use client";
import { useState, useEffect } from "react";

const BG   = "#0D0D0D";
const CARD  = "#111111";
const BORDER= "#222222";
const MUTED = "#666666";

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
  if (!type || type.startsWith("image/")) return "#A78BFA";
  if (type === "Sitio Web")  return "#34D399";
  if (type.includes("pdf"))  return "#F87171";
  if (type.includes("word")) return "#60A5FA";
  return "#FBBF24";
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
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Catálogo</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>Todo el contenido que conoce tu bot</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            style={{ background: "#1A1A1A", border: `1px solid ${BORDER}`, color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 13, width: 200, outline: "none" }}
          />
          <button onClick={load} style={{ background: "#1A1A1A", border: `1px solid ${BORDER}`, color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 16 }}>↻</button>
          <a href="/dashboard/catalogos/contenido" style={{ background: "#2563EB", color: "#fff", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>+ Subir</a>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: "20px 32px 0", display: "flex", gap: 8 }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
            background: filter === f.id ? "#2563EB" : "#1A1A1A",
            color: filter === f.id ? "#fff" : MUTED,
          }}>{f.label}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, color: MUTED, alignSelf: "center" }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      <div style={{ padding: "20px 32px 40px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: MUTED }}>Cargando catálogo...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Catálogo vacío</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>Sube imágenes, documentos o extrae contenido de tu sitio web</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a href="/dashboard/catalogos/contenido" style={{ background: "#2563EB", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>📸 Subir Contenido</a>
              <a href="/dashboard/catalogos/sitio-web" style={{ background: "#1A1A1A", border: `1px solid ${BORDER}`, color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>🌐 Desde Sitio Web</a>
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
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Preview */}
      <div style={{ height: 140, background: "#181818", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {isImage ? (
          <img src={`/api/knowledge/image/${file.id}`} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 48 }}>
            {file.type === "Sitio Web" ? "🌐" : label === "PDF" ? "📄" : label === "DOC" ? "📝" : label === "CSV" || label === "XLS" ? "📊" : "📁"}
          </span>
        )}
        {/* Type badge */}
        <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color, border: `1px solid ${color}`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{label}</span>
        {/* Status dot */}
        {file.status && (
          <span style={{ position: "absolute", top: 8, left: 8, width: 8, height: 8, borderRadius: "50%", background: file.status === "PROCESADO" ? "#22C55E" : file.status === "ERROR" ? "#EF4444" : "#F59E0B" }} />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>{file.name}</div>

        {editing ? (
          <div>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              rows={2}
              style={{ width: "100%", background: "#1A1A1A", border: "1px solid #333", color: "#fff", borderRadius: 6, padding: "6px 8px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={saveDesc} disabled={saving} style={{ flex: 1, background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "4px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{saving ? "..." : "Guardar"}</button>
              <button onClick={() => { setEditing(false); setDesc(file.description || ""); }} style={{ flex: 1, background: "#1A1A1A", color: "#888", border: "1px solid #333", borderRadius: 6, padding: "4px", fontSize: 11, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: MUTED, cursor: "pointer", minHeight: 32 }} onClick={() => setEditing(true)} title="Click para editar descripción">
            {file.description || <span style={{ color: "#444", fontStyle: "italic" }}>+ Agregar descripción</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "0 14px 12px", display: "flex", gap: 6 }}>
        <button onClick={() => setEditing(e => !e)} style={{ flex: 1, background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#888", borderRadius: 8, padding: "6px", fontSize: 12, cursor: "pointer" }}>✏️ Editar</button>
        <button onClick={onDelete} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#EF4444", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>🗑</button>
      </div>
    </div>
  );
}
