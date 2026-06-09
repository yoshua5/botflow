"use client";
import { useState, useEffect } from "react";

const BG     = "#F8FAFF";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";
const TEXT   = "#0F172A";
const BLUE   = "#2563EB";
const BLUE_L = "#EFF6FF";

const STATUS_CONFIG = {
  pendiente:  { label: "Pendiente",  bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  confirmada: { label: "Confirmada", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  cancelada:  { label: "Cancelada",  bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
};

// ── helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "campo";
}

function uniqueKey(label, existing) {
  let base = slugify(label) || "campo";
  let key = base, n = 2;
  while (existing.includes(key)) { key = `${base}_${n++}`; }
  return key;
}

// ── Field editor row ─────────────────────────────────────────────────────────
function FieldRow({ field, idx, total, onChange, onDelete, onMove }) {
  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      {/* Order */}
      <td style={{ padding: "10px 12px", width: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <button disabled={idx === 0} onClick={() => onMove(idx, -1)}
            style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? BORDER : MUTED, fontSize: 12, padding: "1px 4px", lineHeight: 1 }}>▲</button>
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 700 }}>{idx + 1}</span>
          <button disabled={idx === total - 1} onClick={() => onMove(idx, 1)}
            style={{ background: "none", border: "none", cursor: idx === total - 1 ? "default" : "pointer", color: idx === total - 1 ? BORDER : MUTED, fontSize: 12, padding: "1px 4px", lineHeight: 1 }}>▼</button>
        </div>
      </td>
      {/* Label */}
      <td style={{ padding: "10px 8px" }}>
        <input value={field.field_label}
          onChange={e => onChange(idx, "field_label", e.target.value)}
          placeholder="Ej: Nombre completo"
          style={{ width: "100%", background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "#93C5FD"}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
      </td>
      {/* Question */}
      <td style={{ padding: "10px 8px" }}>
        <input value={field.question}
          onChange={e => onChange(idx, "question", e.target.value)}
          placeholder="Ej: ¿Cuál es tu nombre completo?"
          style={{ width: "100%", background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "#93C5FD"}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
      </td>
      {/* Required */}
      <td style={{ padding: "10px 12px", width: 80, textAlign: "center" }}>
        <button onClick={() => onChange(idx, "required", !field.required)} style={{
          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
          border: "none", cursor: "pointer",
          background: field.required ? BLUE_L : BG,
          color: field.required ? BLUE : MUTED,
          border: `1.5px solid ${field.required ? "#BFDBFE" : BORDER}`,
        }}>
          {field.required ? "Sí" : "No"}
        </button>
      </td>
      {/* Delete */}
      <td style={{ padding: "10px 12px", width: 48, textAlign: "center" }}>
        <button onClick={() => onDelete(idx)} style={{
          background: "#FEF2F2", border: "1.5px solid #FECACA", color: "#DC2626",
          borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontSize: 14,
        }}>🗑</button>
      </td>
    </tr>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CitasPage() {
  const [tab, setTab]               = useState("campos");
  const [fields, setFields]         = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Load fields ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/citas/fields")
      .then(r => r.json())
      .then(d => { setFields(d.fields || []); setLoadingFields(false); })
      .catch(() => setLoadingFields(false));
  }, []);

  // ── Load appointments when tab switches ──────────────────────────────────
  useEffect(() => {
    if (tab === "citas") loadAppointments();
  }, [tab]);

  async function loadAppointments() {
    setLoadingAppts(true);
    try {
      const r = await fetch("/api/citas");
      const d = await r.json();
      setAppointments(d.appointments || []);
    } catch {}
    setLoadingAppts(false);
  }

  // ── Field editor actions ─────────────────────────────────────────────────
  function addField() {
    const existing = fields.map(f => f.field_key);
    const key = uniqueKey("campo", existing);
    setFields(prev => [...prev, {
      id: "new_" + Date.now(),
      field_key: key,
      field_label: "",
      question: "",
      required: true,
      field_order: prev.length,
    }]);
    setSaved(false);
  }

  function updateField(idx, prop, val) {
    setFields(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [prop]: val };
      if (prop === "field_label") {
        const existing = prev.filter((_, i) => i !== idx).map(f => f.field_key);
        next[idx].field_key = uniqueKey(val, existing);
        if (!next[idx].question || next[idx].question === `¿Cuál es tu ${prev[idx].field_label}?`) {
          next[idx].question = val ? `¿Cuál es tu ${val.toLowerCase()}?` : "";
        }
      }
      return next;
    });
    setSaved(false);
  }

  function deleteField(idx) {
    setFields(prev => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function moveField(idx, dir) {
    const next = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next);
    setSaved(false);
  }

  async function saveFields() {
    setSaving(true);
    try {
      const r = await fetch("/api/citas/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (r.ok) setSaved(true);
    } catch {}
    setSaving(false);
  }

  // ── Appointment actions ──────────────────────────────────────────────────
  async function updateStatus(id, status) {
    await fetch("/api/citas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  async function deleteAppointment(id) {
    if (!confirm("¿Eliminar esta cita?")) return;
    await fetch(`/api/citas?id=${id}`, { method: "DELETE" });
    setAppointments(prev => prev.filter(a => a.id !== id));
  }

  function exportCSV() {
    const headers = ["Contacto", "Teléfono", ...fields.map(f => f.field_label), "Estado", "Fecha"];
    const rows = filteredAppts.map(a => [
      a.contact_name || a.from_phone,
      a.from_phone,
      ...fields.map(f => a.data?.[f.field_key] || ""),
      STATUS_CONFIG[a.status]?.label || a.status,
      new Date(a.created_at).toLocaleDateString("es-MX"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "citas.csv"; a.click();
  }

  const filteredAppts = appointments.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (a.contact_name || "").toLowerCase().includes(q) || a.from_phone.includes(q) ||
      Object.values(a.data || {}).some(v => String(v).toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const pendingCount = appointments.filter(a => a.status === "pendiente").length;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "32px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Agendamiento de Citas</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: MUTED }}>El bot recopila la información que necesitas automáticamente</p>
          </div>
          {pendingCount > 0 && (
            <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "#D97706", fontWeight: 700 }}>
              ⏳ {pendingCount} cita{pendingCount !== 1 ? "s" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 24, borderBottom: `2px solid ${BORDER}` }}>
          {[
            { id: "campos", label: "📋 Configurar Campos" },
            { id: "citas",  label: `📅 Citas${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
              border: "none", background: "none",
              color: tab === t.id ? BLUE : MUTED,
              borderBottom: `2px solid ${tab === t.id ? BLUE : "transparent"}`,
              marginBottom: -2, transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── TAB: CAMPOS ───────────────────────────────────────────────────── */}
      {tab === "campos" && (
        <div style={{ padding: "24px 32px 40px" }}>
          {/* Info banner */}
          <div style={{ background: BLUE_L, border: `1.5px solid #BFDBFE`, borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.6 }}>
              <strong>¿Cómo funciona?</strong> Cuando un usuario escriba algo como <em>"quiero una cita"</em>, <em>"agendar"</em> o <em>"reservar"</em>, el bot automáticamente le irá pidiendo cada campo de esta lista, uno por uno. Al terminar, la cita aparece en la pestaña <strong>Citas</strong>.
            </div>
          </div>

          <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            {/* Table header */}
            <div style={{ padding: "16px 20px", borderBottom: `1.5px solid ${BORDER}`, background: BG, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
                {fields.length} campo{fields.length !== 1 ? "s" : ""} configurado{fields.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {saved && <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 600, alignSelf: "center" }}>✅ Guardado</span>}
                <button onClick={addField} style={{
                  background: BG, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 8,
                  padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>+ Agregar campo</button>
                <button onClick={saveFields} disabled={saving} style={{
                  background: BLUE, color: "#fff", border: "none", borderRadius: 8,
                  padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: saving ? 0.7 : 1, boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
                }}>
                  {saving ? "Guardando..." : "💾 Guardar cambios"}
                </button>
              </div>
            </div>

            {loadingFields ? (
              <div style={{ padding: 48, textAlign: "center", color: MUTED }}>Cargando campos...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: BG }}>
                      <th style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", width: 60 }}>#</th>
                      <th style={{ padding: "10px 8px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>Nombre del campo <span style={{ color: "#94A3B8", fontWeight: 400, textTransform: "none", fontSize: 11 }}>(columna en tu tabla)</span></th>
                      <th style={{ padding: "10px 8px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>Pregunta del bot <span style={{ color: "#94A3B8", fontWeight: 400, textTransform: "none", fontSize: 11 }}>(lo que el bot le dice al usuario)</span></th>
                      <th style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", width: 80 }}>Obligatorio</th>
                      <th style={{ width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 14 }}>
                        No hay campos. Haz clic en <strong>+ Agregar campo</strong> para empezar.
                      </td></tr>
                    ) : fields.map((f, i) => (
                      <FieldRow key={f.id || i} field={f} idx={i} total={fields.length}
                        onChange={updateField} onDelete={deleteField} onMove={moveField} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {fields.length > 0 && (
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, background: BG, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                {saved && <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 600, alignSelf: "center" }}>✅ Guardado</span>}
                <button onClick={addField} style={{ background: BG, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Agregar campo</button>
                <button onClick={saveFields} disabled={saving} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Guardando..." : "💾 Guardar cambios"}
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {fields.length > 0 && (
            <div style={{ marginTop: 24, background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>👁 Vista previa — Así verá el usuario la conversación</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 440 }}>
                <div style={{ alignSelf: "flex-start", background: "#F1F5F9", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 13, color: TEXT }}>
                  ¡Hola! Voy a ayudarte a agendar tu cita. Necesito algunos datos 📋
                </div>
                {fields.slice(0, 3).map((f, i) => (
                  <div key={i} style={{ alignSelf: "flex-start", background: "#F1F5F9", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 13, color: TEXT }}>
                    {f.question || `¿${f.field_label}?`}
                    {!f.required && <span style={{ fontSize: 11, color: MUTED, marginLeft: 6 }}>(opcional)</span>}
                  </div>
                ))}
                {fields.length > 3 && <div style={{ fontSize: 12, color: MUTED, paddingLeft: 4 }}>... y {fields.length - 3} pregunta{fields.length - 3 !== 1 ? "s" : ""} más</div>}
                <div style={{ alignSelf: "flex-start", background: "#F1F5F9", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 13, color: TEXT }}>
                  ¡Listo! Tu cita ha sido agendada. Te confirmaremos en breve. ✅
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CITAS ────────────────────────────────────────────────────── */}
      {tab === "citas" && (
        <div style={{ padding: "24px 32px 40px" }}>
          {/* Controls */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cita..."
                style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "8px 12px 8px 32px", fontSize: 13, width: 220, outline: "none", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "#93C5FD"} onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
            {["all","pendiente","confirmada","cancelada"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${statusFilter === s ? BLUE : BORDER}`,
                background: statusFilter === s ? BLUE_L : CARD,
                color: statusFilter === s ? BLUE : MUTED,
              }}>
                {s === "all" ? "Todas" : STATUS_CONFIG[s]?.label}
                <span style={{ marginLeft: 6, fontSize: 12 }}>({s === "all" ? appointments.length : appointments.filter(a => a.status === s).length})</span>
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <button onClick={exportCSV} style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>⬇ CSV</button>
              <button onClick={loadAppointments} style={{ background: CARD, border: `1.5px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 16 }}>↻</button>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: BG, borderBottom: `1.5px solid ${BORDER}` }}>
                    <th style={TH}>Contacto</th>
                    {fields.map(f => <th key={f.field_key} style={TH}>{f.field_label}</th>)}
                    <th style={TH}>Estado</th>
                    <th style={TH}>Fecha</th>
                    <th style={TH}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAppts ? (
                    <tr><td colSpan={fields.length + 4} style={{ padding: 48, textAlign: "center", color: MUTED }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>Cargando citas...
                    </td></tr>
                  ) : filteredAppts.length === 0 ? (
                    <tr><td colSpan={fields.length + 4} style={{ padding: 60, textAlign: "center" }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>📅</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
                        {search || statusFilter !== "all" ? "Sin resultados" : "Aún no hay citas"}
                      </div>
                      <div style={{ fontSize: 13, color: MUTED }}>
                        {search || statusFilter !== "all" ? "Prueba con otro filtro" : "Cuando alguien agende una cita aparecerá aquí"}
                      </div>
                    </td></tr>
                  ) : filteredAppts.map((appt, i) => {
                    const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pendiente;
                    return (
                      <tr key={appt.id} style={{ borderBottom: i < filteredAppts.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = BG}
                        onMouseLeave={e => e.currentTarget.style.background = CARD}>
                        <td style={TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: BLUE_L, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: BLUE, flexShrink: 0 }}>
                              {(appt.contact_name || appt.from_phone)[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{appt.contact_name || appt.from_phone}</div>
                              <div style={{ fontSize: 11, color: MUTED }}>{appt.from_phone}</div>
                            </div>
                          </div>
                        </td>
                        {fields.map(f => (
                          <td key={f.field_key} style={TD}>
                            <span style={{ fontSize: 13, color: appt.data?.[f.field_key] ? TEXT : MUTED, fontStyle: appt.data?.[f.field_key] ? "normal" : "italic" }}>
                              {appt.data?.[f.field_key] || "—"}
                            </span>
                          </td>
                        ))}
                        <td style={TD}>
                          <select value={appt.status} onChange={e => updateStatus(appt.id, e.target.value)} style={{
                            padding: "4px 8px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            border: `1.5px solid ${sc.border}`, background: sc.bg, color: sc.color, outline: "none",
                          }}>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                        </td>
                        <td style={TD}>
                          <span style={{ fontSize: 13, color: MUTED }}>
                            {new Date(appt.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </td>
                        <td style={TD}>
                          <button onClick={() => deleteAppointment(appt.id)} style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", color: "#DC2626", borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontSize: 13 }}>🗑</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TH = { padding: "11px 14px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left", whiteSpace: "nowrap" };
const TD = { padding: "13px 14px", verticalAlign: "middle" };
