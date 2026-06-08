"use client";
import { useState, useEffect } from "react";

export default function ContactosPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(new Set());

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/contacts");
      const d = await r.json();
      setContacts(d.contacts || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.botName.toLowerCase().includes(search.toLowerCase())
  );

  function toggleAll(e) {
    if (e.target.checked) setSelected(new Set(filtered.map(c => c.phone)));
    else setSelected(new Set());
  }

  function toggleOne(phone) {
    const s = new Set(selected);
    s.has(phone) ? s.delete(phone) : s.add(phone);
    setSelected(s);
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-MX", {
      month: "numeric", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Directorio de Contactos</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Export button */}
          <button
            onClick={() => {
              const rows = [["Nombre","Teléfono","Agente","Última Actividad","Estado"]];
              filtered.forEach(c => rows.push([c.name, c.phone, c.botName, fmtDate(c.lastActivity), c.active ? "Activo" : "Inactivo"]));
              const csv = rows.map(r => r.join(",")).join("\n");
              const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
              a.download = "contactos.csv"; a.click();
            }}
            style={{ background: "#1A1A1A", border: "1px solid #333", color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 18 }}
            title="Exportar CSV"
          >⬇</button>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            style={{ background: "#1A1A1A", border: "1px solid #333", color: "#fff", borderRadius: 10, padding: "8px 16px", fontSize: 14, width: 200, outline: "none" }}
          />

          {/* Refresh */}
          <button
            onClick={load}
            style={{ background: "#F97316", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Actualizar"
          >↻</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ margin: "24px 32px", background: "#111", borderRadius: 16, overflow: "hidden", border: "1px solid #222" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              <th style={{ padding: "14px 16px", textAlign: "left", width: 40 }}>
                <input type="checkbox" onChange={toggleAll} checked={selected.size === filtered.length && filtered.length > 0} />
              </th>
              {["Contacto","Canal","Agente Captador","Última Actividad","Estado","Acciones"].map(h => (
                <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, color: "#888", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#555" }}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#555" }}>
                {contacts.length === 0 ? "Aún no hay contactos. Cuando alguien escriba al bot aparecerá aquí." : "Sin resultados para tu búsqueda."}
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.phone} style={{ borderBottom: "1px solid #1A1A1A", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#161616"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px" }}>
                  <input type="checkbox" checked={selected.has(c.phone)} onChange={() => toggleOne(c.phone)} />
                </td>

                {/* Contacto */}
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name !== c.phone ? c.name : formatPhone(c.phone)}</div>
                  {c.name !== c.phone && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{formatPhone(c.phone)}</div>}
                </td>

                {/* Canal */}
                <td style={{ padding: "14px 16px" }}>
                  <span title="WhatsApp" style={{ fontSize: 22 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </span>
                </td>

                {/* Agente */}
                <td style={{ padding: "14px 16px", fontSize: 14, color: "#ccc" }}>{c.botName}</td>

                {/* Última actividad */}
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#888" }}>{fmtDate(c.lastActivity)}</td>

                {/* Estado */}
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: c.active ? "#14532D" : "#1C1C1C",
                    color:      c.active ? "#4ADE80" : "#555",
                    border:     c.active ? "1px solid #166534" : "1px solid #333",
                  }}>
                    {c.active ? "Activo" : "Inactivo"}
                  </span>
                </td>

                {/* Acciones */}
                <td style={{ padding: "14px 16px" }}>
                  <button
                    onClick={() => window.open(`https://wa.me/${c.phone.replace(/\D/g,"")}`, "_blank")}
                    style={{ background: "#1A1A1A", border: "1px solid #333", color: "#A78BFA", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Abrir en WhatsApp"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Count */}
      {!loading && contacts.length > 0 && (
        <div style={{ padding: "0 32px 24px", color: "#555", fontSize: 13 }}>
          {filtered.length} contacto{filtered.length !== 1 ? "s" : ""}{search ? " encontrado" + (filtered.length !== 1 ? "s" : "") : " en total"}
          {selected.size > 0 && ` · ${selected.size} seleccionado${selected.size !== 1 ? "s" : ""}`}
        </div>
      )}
    </div>
  );
}

function formatPhone(phone) {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("52")) return `+52 (${d.slice(2,5)}) ${d.slice(5,8)}-${d.slice(8)}`;
  if (d.length === 11 && d.startsWith("1")) return `+1 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return `+${d}`;
}
