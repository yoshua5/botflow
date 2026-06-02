"use client";
import { useState, useRef, useEffect, useCallback, useReducer } from "react";
import { } from "next/navigation";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const PAGE_SIZE = 6;

// ── Helpers ───────────────────────────────────────────────
function getFileIcon(type, name) {
  if (type?.startsWith("image/"))      return { icon: "🖼️", color: "#F5F3FF", border: "#C4B5FD" };
  if (type === "Sitio Web")            return { icon: "🌐", color: "#F5F3FF", border: "#A78BFA" };
  if (type?.includes("pdf"))           return { icon: "📄", color: "#FEF2F2", border: "#FCA5A5" };
  if (type?.includes("word") || name?.endsWith(".docx")) return { icon: "📝", color: "#EFF6FF", border: "#93C5FD" };
  if (type?.includes("excel") || name?.endsWith(".xlsx")) return { icon: "📊", color: "#F0FDF4", border: "#86EFAC" };
  if (type?.includes("csv"))           return { icon: "📊", color: "#F0FDF4", border: "#86EFAC" };
  return { icon: "📁", color: "#F8FAFF", border: "#CBD5E1" };
}

function friendlyType(type, name) {
  if (!type) return name?.split(".").pop()?.toUpperCase() || "—";
  if (type === "Sitio Web") return "Sitio Web";
  if (type.startsWith("image/")) return "Imagen " + type.split("/")[1].toUpperCase();
  if (type.includes("pdf")) return "PDF";
  if (type.includes("word") || name?.endsWith(".docx")) return "Word";
  if (type.includes("excel") || name?.endsWith(".xlsx")) return "Excel";
  if (type.includes("csv")) return "CSV";
  if (type.includes("plain")) return "TXT";
  return type.split("/")[1]?.toUpperCase() || type;
}

const STATUS_CONFIG = {
  PROCESADO:  { label: "Listo",         color: "#16A34A", bg: "#F0FDF4", dot: "#16A34A" },
  PROCESANDO: { label: "Procesando...", color: "#D97706", bg: "#FFF7ED", dot: "#F59E0B" },
  ERROR:      { label: "Error",         color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
};

const ACCEPTED = ".pdf,.doc,.docx,.txt,.csv,.md,.png,.jpg,.jpeg,.xlsx";

const FILTERS = [
  { id: "all",   label: "Todos",      icon: "📂" },
  { id: "image", label: "Imágenes",   icon: "🖼️" },
  { id: "doc",   label: "Documentos", icon: "📄" },
  { id: "web",   label: "Sitios Web", icon: "🌐" },
];

function filterFiles(files, filter) {
  if (filter === "image") return files.filter(f => f.type?.startsWith("image/") || f.isImage);
  if (filter === "doc")   return files.filter(f => !f.type?.startsWith("image/") && !f.isImage && f.type !== "Sitio Web");
  if (filter === "web")   return files.filter(f => f.type === "Sitio Web");
  return files;
}

// ── Toast ─────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 90, right: 32, display: "flex", flexDirection: "column", gap: 8, zIndex: 999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: t.type === "error" ? "#FEF2F2" : t.type === "success" ? "#F0FDF4" : WHITE,
          border: `1.5px solid ${t.type === "error" ? "#FCA5A5" : t.type === "success" ? "#86EFAC" : "#E2E8F0"}`,
          color: t.type === "error" ? "#DC2626" : t.type === "success" ? "#16A34A" : TEXT,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 8,
          animation: "slideIn 0.25s ease",
        }}>
          <span>{t.type === "error" ? "❌" : t.type === "success" ? "✅" : "ℹ️"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Image preview modal ───────────────────────────────────
function ImageModal({ file, onClose, onDescriptionSaved, onToast }) {
  if (!file) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: WHITE, borderRadius: 20, overflow: "hidden", maxWidth: 700, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🖼️</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{file.name}</span>
            <span style={{ fontSize: 11, padding: "2px 8px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 100, color: "#16A34A", fontWeight: 700 }}>📲 Envíable por WhatsApp</span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer", fontSize: 14, color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ background: "#F8FAFF", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280, padding: 24 }}>
          <img src={`/api/knowledge/image/${file.id}`} alt={file.name}
            style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
        </div>
        {/* Description section */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #F1F5F9", background: "#FAFBFF" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <span>🏷️</span> Descripción para el bot
            <span style={{ fontWeight: 400, color: MUTED, fontSize: 11 }}>— El bot usará esto para enviar la imagen correcta</span>
          </div>
          <DescriptionEditor file={file} onSaved={onDescriptionSaved} onToast={onToast} />
        </div>
        <div style={{ padding: "10px 20px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: MUTED }}>{file.size} · {file.date}</span>
          <span style={{ fontSize: 12, color: MUTED }}>El bot enviará esta imagen cuando la pidan por WhatsApp</span>
        </div>
      </div>
    </div>
  );
}

// ── Description editor inline ─────────────────────────────
function DescriptionEditor({ file, onSaved, onToast }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(file.description || "");
  const [saving, setSaving]   = useState(false);
  const inputRef              = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: file.id, description: value }),
      });
      if (res.ok) {
        onSaved(file.id, value);
        onToast("Descripción guardada", "success");
        setEditing(false);
      } else {
        onToast("Error al guardar", "error");
      }
    } catch {
      onToast("Error de conexión", "error");
    }
    setSaving(false);
  };

  const cancel = () => { setValue(file.description || ""); setEditing(false); };

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
        <span style={{
          fontSize: 11, color: value ? "#8B5CF6" : MUTED, fontStyle: value ? "normal" : "italic",
          maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {value || "Sin descripción — haz clic para agregar"}
        </span>
        <button onClick={() => setEditing(true)} style={{
          flexShrink: 0, width: 20, height: 20, borderRadius: 5, background: "transparent",
          border: "1px solid #DDD6FE", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 10, color: "#8B5CF6", padding: 0,
        }} title="Editar descripción">✏️</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }} onClick={e => e.stopPropagation()}>
      <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        placeholder="ej: foto del menú, logo, producto X..."
        style={{ fontSize: 11, padding: "3px 7px", borderRadius: 6, border: "1.5px solid #8B5CF6", outline: "none", fontFamily: "inherit", width: 200, color: TEXT }} />
      <button onClick={save} disabled={saving} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "#8B5CF6", border: "none", color: WHITE, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        {saving ? "…" : "✓"}
      </button>
      <button onClick={cancel} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 5, background: "#F1F5F9", border: "none", color: MUTED, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function KnowledgePage() {
  const botIdParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("bot") : null;

  const [files, setFiles]           = useState([]);
  const [page, setPage]             = useState(1);
  const [filter, setFilter]         = useState("all");
  const [dragging, setDragging]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [scrapeUrl, setScrapeUrl]   = useState("");
  const [scraping, setScraping]     = useState(false);
  const [toasts, setToasts]         = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [bots, setBots]             = useState([]);
  const [currentBot, setCurrentBot] = useState(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  // Load bots list & resolve current bot name
  useEffect(() => {
    fetch("/api/bots").then(r => r.json()).then(d => {
      const list = d.bots || [];
      setBots(list);
      if (botIdParam) {
        const found = list.find(b => b.id === botIdParam);
        setCurrentBot(found || null);
      }
    }).catch(() => {});
  }, [botIdParam]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setFiles(data.files || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadFiles();
    pollRef.current = setInterval(loadFiles, 3000);
    return () => clearInterval(pollRef.current);
  }, [loadFiles]);

  const filtered   = filterFiles(files, filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start      = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end        = Math.min(page * PAGE_SIZE, filtered.length);

  const handleFiles = async (fileList) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      setUploadProgress(`Subiendo ${i + 1}/${arr.length}: ${file.name}`);
      const fd = new FormData();
      fd.append("file", file);
      if (botIdParam) fd.append("botId", botIdParam);
      try {
        const res = await fetch("/api/knowledge", { method: "POST", body: fd });
        if (res.ok) successCount++;
        else addToast(`Error subiendo ${file.name}`, "error");
      } catch {
        addToast(`Error de conexión con ${file.name}`, "error");
      }
    }

    setUploading(false);
    setUploadProgress("");
    setPage(1);
    setFilter("all");
    await loadFiles();
    if (successCount > 0) addToast(`${successCount} archivo${successCount > 1 ? "s" : ""} subido${successCount > 1 ? "s" : ""} correctamente`, "success");
  };

  const deleteFile = async (id) => {
    await fetch("/api/knowledge", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadFiles();
    if (paged.length === 1 && page > 1) setPage(page - 1);
    addToast("Archivo eliminado", "info");
  };

  const updateDescription = useCallback((id, description) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, description } : f));
  }, []);

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      if (res.ok) {
        setScrapeUrl("");
        setPage(1);
        await loadFiles();
        addToast("Sitio web escaneado correctamente", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Error al escanear el sitio", "error");
      }
    } catch {
      addToast("Error de conexión al escanear", "error");
    }
    setScraping(false);
  };

  // Stats
  const processedCount = files.filter(f => f.status === "PROCESADO").length;
  const processingCount = files.filter(f => f.status === "PROCESANDO").length;
  const imageCount = files.filter(f => f.isImage || f.type?.startsWith("image/")).length;
  const docCount   = files.filter(f => !f.isImage && !f.type?.startsWith("image/") && f.type !== "Sitio Web").length;
  const webCount   = files.filter(f => f.type === "Sitio Web").length;

  const filterCount = (id) => {
    if (id === "all") return files.length;
    if (id === "image") return imageCount;
    if (id === "doc") return docCount;
    if (id === "web") return webCount;
    return 0;
  };

  return (
    <div>
      <Toast toasts={toasts} />
      <ImageModal file={previewFile} onClose={() => setPreviewFile(null)} onDescriptionSaved={updateDescription} onToast={addToast} />

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <a href="/dashboard/bots" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>Mis Bots</a>
        {currentBot && (<><span style={{ color: "#CBD5E1" }}>›</span>
          <a href={`/dashboard/bots/${botIdParam}`} style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>{currentBot.agentName || currentBot.name}</a></>)}
        <span style={{ color: "#CBD5E1" }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: BLUE }}>Base de Conocimientos</span>
      </div>

      {/* Bot context banner */}
      {currentBot && (
        <div style={{
          background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 12,
          padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DBEAFE", border: "1px solid #93C5FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: BLUE }}>
              {(currentBot.agentName || currentBot.name || "B").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                Archivos de <span style={{ color: BLUE }}>{currentBot.agentName || currentBot.name}</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED }}>Los archivos que subas aquí serán usados solo por este bot</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/dashboard/knowledge" style={{ padding: "6px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>
              Ver todos los archivos
            </a>
            <a href={`/dashboard/bots/${botIdParam}`} style={{ padding: "6px 14px", background: BLUE, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: WHITE, textDecoration: "none" }}>
              ← Volver al bot
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {currentBot ? `Conocimiento: ${currentBot.agentName || currentBot.name}` : "Base de Conocimientos"}
          </h1>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, maxWidth: 540 }}>
            {currentBot
              ? `Archivos asignados a ${currentBot.agentName || currentBot.name}. Solo este bot usará estos documentos.`
              : "Sube documentos, listas de precios, flyers e imágenes. El bot responderá con esa información y enviará las imágenes por WhatsApp."}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {processingCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#FFF7ED", border: "1px solid #FCD34D", borderRadius: 100 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>Procesando {processingCount}...</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 100 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: processedCount > 0 ? "#16A34A" : "#94A3B8", boxShadow: processedCount > 0 ? "0 0 6px #16A34A" : "none" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{processedCount} activos en el bot</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {files.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "🖼️", label: "Imágenes", value: imageCount, sub: "Enviables por WhatsApp", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
            { icon: "📄", label: "Documentos", value: docCount, sub: "PDFs, Word, CSV…", color: BLUE, bg: BLUE_LIGHT, border: "#BFDBFE" },
            { icon: "🌐", label: "Sitios Web", value: webCount, sub: "Páginas escaneadas", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: WHITE, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginTop: 1 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload + Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, marginBottom: 24 }}>
        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            background: dragging ? BLUE_LIGHT : WHITE,
            border: `2px dashed ${dragging ? BLUE : uploading ? "#F59E0B" : "#CBD5E1"}`,
            borderRadius: 16, padding: "40px 32px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            transition: "all 0.2s", cursor: uploading ? "wait" : "pointer", minHeight: 200,
          }}>
          <input ref={inputRef} type="file" multiple accept={ACCEPTED} style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)} />
          {uploading ? (
            <>
              <div style={{ fontSize: 38 }}>⏳</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Subiendo archivos...</div>
              <div style={{ fontSize: 13, color: MUTED }}>{uploadProgress}</div>
              <div style={{ width: 200, height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", background: BLUE, borderRadius: 2, animation: "progress 1.5s ease infinite" }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 62, height: 62, borderRadius: "50%", background: BLUE_LIGHT, border: `1.5px solid #93C5FD`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>☁️</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 4 }}>Subir Archivos</div>
                <div style={{ fontSize: 13, color: MUTED }}>Arrastra y suelta o haz clic para explorar</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {[["📄","PDF"], ["📝","DOCX"], ["📃","TXT / CSV"], ["🖼️","Imágenes"]].map(([icon, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 100, fontSize: 12, color: MUTED, fontWeight: 600 }}>
                    <span>{icon}</span>{label}
                  </div>
                ))}
              </div>
              <button onClick={e => { e.stopPropagation(); inputRef.current?.click(); }} style={{
                padding: "10px 24px", background: BLUE, border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, color: WHITE, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
              }}>
                <span style={{ fontSize: 16 }}>+</span> Seleccionar Archivos
              </button>
            </>
          )}
        </div>

        {/* Info card */}
        <div style={{ background: BLUE, borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: WHITE }}>¿Cómo funciona?</h3>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.65 }}>
            Tu bot usará estos archivos para responder preguntas y enviar imágenes automáticamente por WhatsApp.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              "🖼️  Las imágenes se envían por WhatsApp.",
              "📄  Extrae texto de PDFs y Word.",
              "🌐  Aprende de tu sitio web.",
              "✅  Respuestas basadas en tus datos.",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Website Scraper */}
      <div style={{ background: WHITE, borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#F5F3FF", border: "1.5px solid #C4B5FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🌐</div>
        <div style={{ flexGrow: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Escanear Sitio Web</h3>
          <p style={{ fontSize: 13, color: MUTED }}>Ingresa tu página web y el bot extraerá todo su contenido automáticamente.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="url" placeholder="https://tu-sitio-web.com" value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)} disabled={scraping}
            onKeyDown={e => e.key === "Enter" && handleScrape()}
            style={{ width: 280, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} style={{
            padding: "10px 20px", background: scraping || !scrapeUrl.trim() ? "#CBD5E1" : BLUE,
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, color: WHITE,
            cursor: scraping || !scrapeUrl.trim() ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.2s",
          }}>
            {scraping ? "Escaneando..." : "Escanear"}
          </button>
        </div>
      </div>

      {/* Files table */}
      <div style={{ background: WHITE, borderRadius: 16, border: "1.5px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {/* Table header with filter tabs */}
        <div style={{ padding: "14px 22px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {FILTERS.map(f => {
              const cnt = filterCount(f.id);
              const active = filter === f.id;
              return (
                <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? BLUE_MID : "transparent", fontFamily: "inherit",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? BLUE : MUTED, transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8FAFF"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  <span>{f.icon}</span>
                  {f.label}
                  {cnt > 0 && (
                    <span style={{ background: active ? BLUE : "#E2E8F0", color: active ? WHITE : MUTED, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 100 }}>{cnt}</span>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={loadFiles} style={{ width: 32, height: 32, borderRadius: 8, background: "#F8FAFF", border: "1.5px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: MUTED, transition: "all 0.15s" }}
            title="Recargar"
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.color = BLUE; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = MUTED; }}>
            ↻
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "52px", textAlign: "center", color: MUTED }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>{filter === "all" ? "📂" : FILTERS.find(f => f.id === filter)?.icon || "📂"}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: TEXT }}>
              {filter === "all" ? "No hay archivos aún" : `No hay ${FILTERS.find(f => f.id === filter)?.label?.toLowerCase()} aún`}
            </div>
            <div style={{ fontSize: 13 }}>
              {filter === "all" ? "Sube tu primer archivo para que el bot aprenda de él" : "Sube archivos de este tipo usando el área de arriba"}
            </div>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFF" }}>
                  {["ARCHIVO", "TIPO", "TAMAÑO", "FECHA", "ESTADO", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((file) => {
                  const fi = getFileIcon(file.type, file.name);
                  const sc = STATUS_CONFIG[file.status] || STATUS_CONFIG.PROCESADO;
                  const isImg = file.isImage || file.type?.startsWith("image/");
                  const isProcessing = file.status === "PROCESANDO";
                  return (
                    <tr key={file.id} style={{ borderTop: "1px solid #F1F5F9", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAFBFF"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Icon / thumbnail */}
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: fi.color, border: `1px solid ${fi.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden", cursor: isImg && file.status === "PROCESADO" ? "pointer" : "default" }}
                            onClick={() => isImg && file.status === "PROCESADO" && setPreviewFile(file)}>
                            {isImg && file.status === "PROCESADO" ? (
                              <img src={`/api/knowledge/image/${file.id}`} alt={file.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={e => { e.target.style.display = "none"; e.target.parentNode.textContent = "🖼️"; }} />
                            ) : (
                              fi.icon
                            )}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{file.name}</span>
                              {isImg && file.status === "PROCESADO" && (
                                <span style={{ fontSize: 10, padding: "2px 7px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 100, color: "#16A34A", fontWeight: 700, whiteSpace: "nowrap" }}>📲 WhatsApp</span>
                              )}
                            </div>
                            {isImg && file.status === "PROCESADO" ? (
                            <DescriptionEditor file={file} onSaved={updateDescription} onToast={addToast} />
                          ) : (
                            file.preview && <div style={{ fontSize: 11, color: MUTED, marginTop: 1, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.preview}</div>
                          )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: fi.color, border: `1px solid ${fi.border}`, color: TEXT }}>
                          {friendlyType(file.type, file.name)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px", fontSize: 12, color: MUTED }}>{file.size}</td>
                      <td style={{ padding: "12px 18px", fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>{file.date}</td>
                      <td style={{ padding: "12px 18px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100,
                          background: sc.bg, color: sc.color, display: "inline-flex", alignItems: "center", gap: 5,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", animation: isProcessing ? "pulse 1.5s infinite" : "none" }} />
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {isImg && file.status === "PROCESADO" && (
                            <button onClick={() => setPreviewFile(file)} style={{ width: 28, height: 28, borderRadius: 7, background: "#F5F3FF", border: "1px solid #C4B5FD", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, color: "#8B5CF6", transition: "all 0.15s" }}
                              title="Vista previa"
                              onMouseEnter={e => e.currentTarget.style.background = "#EDE9FE"}
                              onMouseLeave={e => e.currentTarget.style.background = "#F5F3FF"}>
                              👁
                            </button>
                          )}
                          <button onClick={() => deleteFile(file.id)} style={{ width: 28, height: 28, borderRadius: 7, background: "#FEF2F2", border: "1px solid #FCA5A5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, color: "#DC2626", transition: "all 0.15s" }}
                            title="Eliminar"
                            onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                            onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ padding: "12px 22px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: MUTED }}>
                {filtered.length > 0 ? `Mostrando ${start}–${end} de ${filtered.length} archivo${filtered.length > 1 ? "s" : ""}` : "Sin archivos"}
                {processedCount > 0 && filter === "all" && ` · ${processedCount} activos en el bot`}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 16px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: page === 1 ? "#CBD5E1" : TEXT, cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (page > 1) { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.color = BLUE; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = page === 1 ? "#CBD5E1" : TEXT; }}>
                  Anterior
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  style={{ padding: "6px 16px", background: page < totalPages ? BLUE : "#F1F5F9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: page < totalPages ? WHITE : "#94A3B8", cursor: page < totalPages ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.background = "#1D4ED8"; }}
                  onMouseLeave={e => { if (page < totalPages) e.currentTarget.style.background = BLUE; }}>
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating + button */}
      <button onClick={() => inputRef.current?.click()} title="Subir archivo" style={{
        position: "fixed", bottom: 32, right: 32, width: 52, height: 52, borderRadius: "50%",
        background: BLUE, border: "none", cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 24, color: WHITE, fontWeight: 700,
        boxShadow: "0 6px 24px rgba(37,99,235,0.4)", transition: "all 0.2s", zIndex: 200,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
        +
      </button>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes progress { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes slideIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
    </div>
  );
}

// requires in Next.js 13+
