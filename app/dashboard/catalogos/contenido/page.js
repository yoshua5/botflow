"use client";
import { useState, useRef } from "react";

const BG     = "#F8FAFF";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";
const TEXT   = "#0F172A";
const BLUE   = "#2563EB";

const ACCEPTED = ".pdf,.doc,.docx,.txt,.csv,.md,.png,.jpg,.jpeg,.webp,.gif,.xlsx";

export default function SubirContenidoPage() {
  const [files, setFiles]         = useState([]);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults]     = useState([]);
  const inputRef = useRef();

  function addFiles(newFiles) {
    const arr = Array.from(newFiles).map(f => ({
      file: f,
      id: Math.random().toString(36).slice(2),
      name: f.name,
      description: "",
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      type: f.type,
    }));
    setFiles(prev => [...prev, ...arr]);
  }

  function removeFile(id) { setFiles(prev => prev.filter(f => f.id !== id)); }
  function updateDesc(id, val) { setFiles(prev => prev.map(f => f.id === id ? { ...f, description: val } : f)); }
  function updateName(id, val) { setFiles(prev => prev.map(f => f.id === id ? { ...f, name: val } : f)); }

  async function uploadAll() {
    if (!files.length) return;
    setUploading(true);
    const res = [];
    for (const item of files) {
      try {
        const fd = new FormData();
        fd.append("file", item.file, item.name);
        fd.append("description", item.description);
        const r = await fetch("/api/knowledge", { method: "POST", body: fd });
        const d = await r.json();
        res.push({ name: item.name, status: r.ok ? "ok" : "error", msg: d.error });
      } catch (e) {
        res.push({ name: item.name, status: "error", msg: e.message });
      }
    }
    setResults(res);
    setFiles([]);
    setUploading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "32px 32px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <a href="/dashboard/catalogos" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8 }}>← Catálogo</a>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Subir Contenido</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: MUTED }}>Imágenes, PDFs, Word, CSV y más</p>
        </div>
        {files.length > 0 && (
          <button onClick={uploadAll} disabled={uploading} style={{
            background: BLUE, color: "#fff", border: "none", borderRadius: 12,
            padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            opacity: uploading ? 0.7 : 1, boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
          }}>
            {uploading ? "Subiendo..." : `⬆ Subir ${files.length} archivo${files.length !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      <div style={{ padding: "24px 32px 40px" }}>
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? BLUE : BORDER}`,
            borderRadius: 16, padding: "48px 24px",
            textAlign: "center", cursor: "pointer",
            background: dragging ? "#EFF6FF" : CARD,
            transition: "all 0.2s", marginBottom: 24,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>📁</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: dragging ? BLUE : TEXT }}>
            {dragging ? "Suelta aquí" : "Arrastra archivos o haz clic para seleccionar"}
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>PNG, JPG, PDF, Word, CSV, TXT, Excel · Máx 10 MB c/u</div>
          <input ref={inputRef} type="file" multiple accept={ACCEPTED} style={{ display: "none" }}
            onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
        </div>

        {/* Quick buttons */}
        {files.length === 0 && results.length === 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { icon: "🖼️", label: "Imágenes de productos", accept: ".png,.jpg,.jpeg,.webp" },
              { icon: "📄", label: "Catálogo PDF",          accept: ".pdf" },
              { icon: "📝", label: "Documento Word",        accept: ".doc,.docx" },
              { icon: "📊", label: "Lista de precios CSV",  accept: ".csv,.xlsx" },
            ].map(q => (
              <button key={q.label} onClick={() => { inputRef.current.accept = q.accept; inputRef.current.click(); inputRef.current.accept = ACCEPTED; }}
                style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, fontWeight: 500, transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT; }}>
                <span>{q.icon}</span>{q.label}
              </button>
            ))}
            <a href="/dashboard/catalogos/sitio-web"
              style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontWeight: 500, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <span>🌐</span>Extraer de sitio web
            </a>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {files.map(item => (
              <div key={item.id} style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: 16, display: "flex", gap: 16, alignItems: "flex-start", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", background: BG, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${BORDER}` }}>
                  {item.preview ? (
                    <img src={item.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 32 }}>
                      {item.type.includes("pdf") ? "📄" : item.type.includes("word") ? "📝" : item.type.includes("csv") || item.type.includes("excel") ? "📊" : "📁"}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={item.name} onChange={e => updateName(item.id, e.target.value)}
                    style={{ background: BG, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 8, padding: "7px 10px", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit" }}
                    placeholder="Nombre del archivo"
                    onFocus={e => e.target.style.borderColor = "#93C5FD"}
                    onBlur={e => e.target.style.borderColor = BORDER}
                  />
                  <input
                    value={item.description} onChange={e => updateDesc(item.id, e.target.value)}
                    style={{ background: BG, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 8, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                    placeholder="Descripción (opcional) — el bot usará esto para entender el contenido"
                    onFocus={e => e.target.style.borderColor = "#93C5FD"}
                    onBlur={e => e.target.style.borderColor = BORDER}
                  />
                  <div style={{ fontSize: 12, color: MUTED }}>{(item.file.size / 1024).toFixed(0)} KB · {item.type || "archivo"}</div>
                </div>
                <button onClick={() => removeFile(item.id)} style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", color: "#DC2626", cursor: "pointer", fontSize: 16, padding: "6px 10px", borderRadius: 8 }}>✕</button>
              </div>
            ))}

            <button onClick={uploadAll} disabled={uploading} style={{
              background: BLUE, color: "#fff", border: "none", borderRadius: 12,
              padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4,
              opacity: uploading ? 0.7 : 1, boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
            }}>
              {uploading ? "⏳ Subiendo archivos..." : `⬆ Subir ${files.length} archivo${files.length !== 1 ? "s" : ""} al catálogo`}
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>
                ✅ {results.filter(r => r.status === "ok").length} subidos
                {results.filter(r => r.status === "error").length > 0 && <span style={{ color: "#DC2626", marginLeft: 8 }}>· {results.filter(r => r.status === "error").length} errores</span>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setResults([])} style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>Subir más</button>
                <a href="/dashboard/catalogos" style={{ background: BLUE, color: "#fff", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Ver Catálogo →</a>
              </div>
            </div>
            {results.map((r, i) => (
              <div key={i} style={{ background: r.status === "ok" ? "#F0FDF4" : "#FEF2F2", border: `1.5px solid ${r.status === "ok" ? "#BBF7D0" : "#FECACA"}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span>{r.status === "ok" ? "✅" : "❌"}</span>
                <span style={{ flex: 1, fontSize: 13, color: TEXT }}>{r.name}</span>
                {r.msg && <span style={{ fontSize: 12, color: "#DC2626" }}>{r.msg}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
