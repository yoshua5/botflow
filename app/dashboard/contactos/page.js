"use client";
import { useState, useEffect } from "react";

const BG     = "#F8FAFF";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";
const TEXT   = "#0F172A";
const BLUE   = "#2563EB";
const BLUE_L = "#EFF6FF";

function WAIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function ContactosPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(new Set());

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/contacts");
      if (r.ok) { const d = await r.json(); setContacts(d.contacts || []); }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = contacts.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.botName?.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(phone) {
    const s = new Set(selected);
    s.has(phone) ? s.delete(phone) : s.add(phone);
    setSelected(s);
  }

  function exportCSV() {
    const rows = [["Nombre","Teléfono","Agente Captador","Última Actividad","Estado"]];
    filtered.forEach(c => rows.push([
      c.name || c.phone, c.phone, c.botName || "—",
      c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("es-MX") : "—",
      c.active ? "Activo" : "Inactivo",
    ]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "contactos.csv";
    a.click();
  }

  const activeCount = contacts.filter(c => c.active).length;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "32px 32px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Directorio de Contactos</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: MUTED }}>
            {contacts.length} contacto{contacts.length !== 1 ? "s" : ""}
            {activeCount > 0 && <span style={{ marginLeft: 8, color: "#16A34A", fontWeight: 600 }}>· {activeCount} activos hoy</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar contacto..."
              style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "8px 12px 8px 32px", fontSize: 13, width: 220, outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>
          <button onClick={exportCSV} title="Exportar CSV" style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>⬇ CSV</button>
          <button onClick={load} style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 16 }}>↻</button>
        </div>
      </div>

      {/* Stats row */}
      {contacts.length > 0 && (
        <div style={{ padding: "0 32px 20px", display: "flex", gap: 12 }}>
          {[
            { label: "Total contactos", value: contacts.length, color: BLUE, bg: BLUE_L },
            { label: "Activos hoy",     value: activeCount,     color: "#16A34A", bg: "#F0FDF4" },
            { label: "Inactivos",       value: contacts.length - activeCount, color: MUTED, bg: BG },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: "14px 20px", minWidth: 130 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ padding: "0 32px 40px" }}>
        <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 180px 160px 100px 80px", padding: "12px 20px", borderBottom: `1.5px solid ${BORDER}`, background: BG }}>
            <div><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(c => c.phone)) : new Set())} style={{ cursor: "pointer" }} /></div>
            {["Contacto","Canal","Agente Captador","Última Actividad","Estado","Acciones"].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
              Cargando contactos...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
                {search ? "Sin resultados" : "Aún no hay contactos"}
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>
                {search ? "Prueba con otro término de búsqueda" : "Cuando alguien escriba al bot aparecerá aquí"}
              </div>
            </div>
          ) : (
            filtered.map((c, i) => (
              <div key={c.phone} style={{
                display: "grid", gridTemplateColumns: "44px 1fr 80px 180px 160px 100px 80px",
                padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none",
                background: selected.has(c.phone) ? BLUE_L : CARD,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => { if (!selected.has(c.phone)) e.currentTarget.style.background = BG; }}
                onMouseLeave={e => { if (!selected.has(c.phone)) e.currentTarget.style.background = CARD; }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input type="checkbox" checked={selected.has(c.phone)} onChange={() => toggleSelect(c.phone)} style={{ cursor: "pointer" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: BLUE_L, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: BLUE, flexShrink: 0 }}>
                    {(c.name || c.phone)[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{c.name || c.phone}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{c.phone}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}><WAIcon /></div>
                <div style={{ display: "flex", alignItems: "center", fontSize: 13, color: MUTED, fontWeight: 500 }}>{c.botName || "—"}</div>
                <div style={{ display: "flex", alignItems: "center", fontSize: 13, color: MUTED }}>
                  {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: c.active ? "#F0FDF4" : BG,
                    color: c.active ? "#16A34A" : MUTED,
                    border: `1.5px solid ${c.active ? "#BBF7D0" : BORDER}`,
                  }}>
                    {c.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noreferrer" title="Abrir en WhatsApp"
                    style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
                    <WAIcon /> Abrir
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
