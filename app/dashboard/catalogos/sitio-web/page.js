"use client";
import { useState } from "react";

const BG     = "#F8FAFF";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";
const TEXT   = "#0F172A";
const BLUE   = "#2563EB";
const BLUE_L = "#EFF6FF";

export default function SitioWebPage() {
  const [url, setUrl]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [items, setItems]       = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  async function scrape() {
    if (!url.trim()) return;
    setLoading(true); setError(""); setItems(null); setSelected(new Set()); setSaved(false);
    try {
      const r = await fetch("/api/settings/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "No se pudo extraer el sitio"); setLoading(false); return; }
      const result = [];
      if (d.businessName || d.description || d.products?.length) {
        result.push({ id: "text-" + Date.now(), type: "Sitio Web", name: d.businessName || new URL(url.trim()).hostname, content: JSON.stringify(d, null, 2), preview: null, isText: true, description: d.description || "" });
      }
      (d.images || []).forEach((img, i) => {
        result.push({ id: "img-" + i, type: "image", name: img.name || img.alt || `imagen-${i + 1}`, src: img.src || img.url, description: img.description || img.alt || "", isText: false });
      });
      setItems(result);
      setSelected(new Set(result.map(r => r.id)));
    } catch (e) { setError("Error de red: " + e.message); }
    setLoading(false);
  }

  function toggleSelect(id) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  async function saveSelected() {
    const toSave = items.filter(i => selected.has(i.id));
    if (!toSave.length) return;
    setSaving(true);
    let ok = 0, fail = 0;
    for (const item of toSave) {
      try {
        if (item.isText) {
          const blob = new Blob([item.content], { type: "text/plain" });
          const fd = new FormData();
          fd.append("file", blob, item.name + ".txt");
          fd.append("description", item.description);
          fd.append("fileType", "Sitio Web");
          const r = await fetch("/api/knowledge", { method: "POST", body: fd });
          r.ok ? ok++ : fail++;
        } else if (item.src) {
          const imgRes = await fetch(`/api/scrape-image?url=${encodeURIComponent(item.src)}`).catch(() => null);
          if (imgRes?.ok) {
            const blob = await imgRes.blob();
            const fd = new FormData();
            const ext = item.src.split(".").pop()?.split("?")[0] || "jpg";
            fd.append("file", blob, item.name + "." + ext);
            fd.append("description", item.description);
            const r = await fetch("/api/knowledge", { method: "POST", body: fd });
            r.ok ? ok++ : fail++;
          } else {
            const blob = new Blob([`Imagen: ${item.name}\nURL: ${item.src}\nDescripción: ${item.description}`], { type: "text/plain" });
            const fd = new FormData();
            fd.append("file", blob, item.name + ".txt");
            fd.append("description", item.description);
            await fetch("/api/knowledge", { method: "POST", body: fd });
            ok++;
          }
        }
      } catch { fail++; }
    }
    setSaving(false);
    setSaved(true);
    setItems(prev => prev?.map(i => selected.has(i.id) ? { ...i, savedOk: true } : i));
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ padding: "32px 32px 0" }}>
        <a href="/dashboard/catalogos" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8 }}>← Catálogo</a>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Extraer desde Sitio Web</h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: MUTED }}>Pega la URL de tu negocio y extraemos automáticamente el contenido</p>
      </div>

      <div style={{ padding: "24px 32px 40px" }}>
        {/* URL input */}
        <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: TEXT, display: "block", marginBottom: 10 }}>URL del sitio web</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && scrape()}
              placeholder="https://tuempresa.com"
              style={{ flex: 1, background: BG, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
            <button onClick={scrape} disabled={loading || !url.trim()} style={{
              background: BLUE, color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer",
              opacity: loading || !url.trim() ? 0.6 : 1, boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
            }}>
              {loading ? "⏳ Extrayendo..." : "🔍 Extraer"}
            </button>
          </div>
          {error && <div style={{ marginTop: 10, fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px" }}>❌ {error}</div>}
          <div style={{ marginTop: 10, fontSize: 12, color: MUTED }}>Extrae: nombre del negocio, descripción, productos, servicios e imágenes</div>
        </div>

        {loading && (
          <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: 48, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: TEXT }}>Analizando sitio web...</div>
            <div style={{ fontSize: 13, color: MUTED }}>Esto puede tomar unos segundos</div>
          </div>
        )}

        {items !== null && !loading && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>
                {items.length} elementos encontrados
                {selected.size > 0 && <span style={{ color: BLUE, marginLeft: 8, fontSize: 13 }}>· {selected.size} seleccionados</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSelected(new Set(items.map(i => i.id)))} style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Seleccionar todo</button>
                <button onClick={() => setSelected(new Set())} style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Deseleccionar</button>
                {!saved && (
                  <button onClick={saveSelected} disabled={saving || !selected.size} style={{
                    background: BLUE, color: "#fff", border: "none", borderRadius: 8,
                    padding: "6px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    opacity: saving || !selected.size ? 0.6 : 1,
                  }}>
                    {saving ? "Guardando..." : `⬆ Agregar al catálogo (${selected.size})`}
                  </button>
                )}
                {saved && (
                  <a href="/dashboard/catalogos" style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", color: "#16A34A", borderRadius: 8, padding: "6px 18px", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                    ✅ Ver catálogo →
                  </a>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {items.map(item => (
                <div key={item.id} onClick={() => toggleSelect(item.id)} style={{
                  background: CARD, border: `2px solid ${selected.has(item.id) ? BLUE : BORDER}`,
                  borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all 0.15s",
                  opacity: item.savedOk ? 0.5 : 1, boxShadow: selected.has(item.id) ? "0 0 0 3px #BFDBFE" : "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ height: 120, background: BLUE_L, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {item.src ? (
                      <img src={item.src} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                    ) : (
                      <span style={{ fontSize: 40 }}>{item.type === "Sitio Web" ? "🌐" : "📄"}</span>
                    )}
                    <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", border: `2px solid ${selected.has(item.id) ? BLUE : BORDER}`, background: selected.has(item.id) ? BLUE : CARD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                      {selected.has(item.id) ? "✓" : ""}
                    </div>
                    {item.savedOk && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✅</div>}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 11, color: MUTED, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>}
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{item.type === "Sitio Web" ? "Contenido web" : item.src ? "Imagen" : "Documento"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items !== null && !loading && items.length === 0 && (
          <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: 48, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>😕</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: TEXT }}>No se encontró contenido</div>
            <div style={{ fontSize: 13, color: MUTED }}>Verifica que la URL sea pública y accesible, o sube el contenido manualmente.</div>
            <a href="/dashboard/catalogos/contenido" style={{ display: "inline-block", marginTop: 20, background: BLUE, color: "#fff", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>📸 Subir manualmente</a>
          </div>
        )}
      </div>
    </div>
  );
}
