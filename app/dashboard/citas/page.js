"use client";
import { useState, useEffect, useCallback } from "react";

const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID   = "#DBEAFE";
const TEXT       = "#0F172A";
const MUTED      = "#64748B";
const WHITE      = "#FFFFFF";
const GREEN      = "#16A34A";
const GREEN_BG   = "#F0FDF4";
const GREEN_BD   = "#86EFAC";
const RED        = "#DC2626";
const RED_BG     = "#FEF2F2";
const RED_BD     = "#FCA5A5";
const YELLOW_BG  = "#FFFBEB";
const YELLOW_BD  = "#FDE68A";
const YELLOW     = "#92400E";

function Label({ children }) {
  return <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>{children}</label>;
}
function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#93C5FD"}
      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}
function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "10px 14px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#93C5FD"}
      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} style={{
      width: "100%", padding: "10px 14px", background: WHITE, border: "1.5px solid #E2E8F0",
      borderRadius: 10, fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
      cursor: "pointer", appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 14px) center", paddingRight: 36,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Toggle({ checked, onChange, label, desc }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 12, position: "relative",
        background: checked ? BLUE : "#CBD5E1", border: "none", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
      }}>
        <span style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: WHITE, boxShadow: "0 1px 4px rgba(0,0,0,0.15)", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

const STATUS_CONFIG = {
  "Pendiente":  { label: "Pendiente",  bg: YELLOW_BG, color: YELLOW,  border: YELLOW_BD, dot: "#F59E0B" },
  "Confirmada": { label: "Confirmada", bg: GREEN_BG,  color: GREEN,   border: GREEN_BD,  dot: GREEN    },
  "Cancelada":  { label: "Cancelada",  bg: RED_BG,    color: RED,     border: RED_BD,    dot: RED      },
};
function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG["Pendiente"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: s.color, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

const DEFAULT_FIELDS = [
  { id: "nombre",          label: "Nombre",         key: "nombre",          required: true,  type: "text"  },
  { id: "apellido",        label: "Apellido",        key: "apellido",        required: false, type: "text"  },
  { id: "telefono",        label: "Teléfono",        key: "telefono",        required: true,  type: "tel"   },
  { id: "email",           label: "Email",           key: "email",           required: false, type: "email" },
  { id: "fecha_preferida", label: "Fecha preferida", key: "fecha_preferida", required: true,  type: "date"  },
  { id: "hora_preferida",  label: "Hora preferida",  key: "hora_preferida",  required: true,  type: "time"  },
];
const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ═══════════════════════════════════════════════════════════
// AGENDA TAB
// ═══════════════════════════════════════════════════════════
function TabAgenda({ aptConfig }) {
  const [data,        setData]       = useState({ rows: [], headers: [] });
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState("");
  const [search,      setSearch]     = useState("");
  const [statusFilter,setStatusFilter] = useState("Todas");
  const [modal,       setModal]      = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [toast,       setToast]      = useState("");

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/appointments");
      const json = await res.json();
      if (json.error && !json.rows) setError(json.error);
      else setData({ rows: [], headers: [], ...json });
    } catch { setError("No se pudieron cargar las citas."); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (row, status) => {
    setActionLoading(a => ({ ...a, [row._rowIndex]: status }));
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: row._rowIndex, status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ Cita marcada como ${status}`);
        await load();
        if (modal?._rowIndex === row._rowIndex) setModal(null);
      } else {
        showToast(`❌ Error: ${json.error}`, false);
      }
    } catch { showToast("❌ Error de red", false); }
    setActionLoading(a => ({ ...a, [row._rowIndex]: null }));
  };

  const deleteRow = async (row) => {
    setActionLoading(a => ({ ...a, [row._rowIndex]: "delete" }));
    try {
      const res = await fetch("/api/appointments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: row._rowIndex }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("🗑️ Cita eliminada");
        setDeleteModal(null);
        setModal(null);
        await load();
      } else {
        showToast(`❌ Error: ${json.error}`, false);
      }
    } catch { showToast("❌ Error de red", false); }
    setActionLoading(a => ({ ...a, [row._rowIndex]: null }));
  };

  const setupHeaders = async () => {
    try {
      const res  = await fetch("/api/appointments", { method: "PUT" });
      const json = await res.json();
      if (json.success) { showToast("✅ Encabezados configurados"); await load(); }
      else showToast(`❌ ${json.error}`, false);
    } catch { showToast("❌ Error de red", false); }
  };

  const getRowStatus = (row) => row["Estado"] || "Pendiente";

  const allRows = data.rows || [];
  const hasEstado = (data.headers || []).includes("Estado");

  // Apply filters
  let filtered = allRows.filter(row => {
    if (search.trim()) {
      const found = Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
      if (!found) return false;
    }
    if (statusFilter !== "Todas") {
      return getRowStatus(row) === statusFilter;
    }
    return true;
  });

  // Count by status
  const counts = {
    Todas:      allRows.length,
    Pendiente:  allRows.filter(r => getRowStatus(r) === "Pendiente").length,
    Confirmada: allRows.filter(r => getRowStatus(r) === "Confirmada").length,
    Cancelada:  allRows.filter(r => getRowStatus(r) === "Cancelada").length,
  };

  const visibleHeaders = data.headers.filter(h => h !== "Estado" && h !== "_rowIndex");

  if (!aptConfig.sheetsId || !aptConfig.googleCredentials) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Google Sheets no configurado</div>
        <div style={{ fontSize: 14, color: MUTED }}>Ve a la pestaña <strong>Configuración</strong> para conectar tu hoja.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 24, zIndex: 2000, padding: "12px 20px", background: toast.ok !== false ? "#1E293B" : RED, color: WHITE, borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", animation: "slideIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total",      value: counts.Todas,      icon: "📅", color: BLUE,    bg: BLUE_LIGHT },
          { label: "Pendientes", value: counts.Pendiente,  icon: "⏳", color: YELLOW,  bg: YELLOW_BG  },
          { label: "Confirmadas",value: counts.Confirmada, icon: "✅", color: GREEN,   bg: GREEN_BG   },
          { label: "Canceladas", value: counts.Cancelada,  icon: "❌", color: RED,     bg: RED_BG     },
        ].map(s => (
          <div key={s.label} style={{ background: WHITE, borderRadius: 12, padding: "16px 18px", border: "1.5px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setStatusFilter(s.label === "Total" ? "Todas" : s.label.slice(0,-1)+"a")}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {/* Status tabs */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 3, gap: 2 }}>
          {["Todas", "Pendiente", "Confirmada", "Cancelada"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              fontWeight: statusFilter === s ? 700 : 500, fontFamily: "inherit",
              background: statusFilter === s ? WHITE : "transparent",
              color: statusFilter === s ? TEXT : MUTED,
              boxShadow: statusFilter === s ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>{s}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: MUTED }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            style={{ width: "100%", padding: "8px 10px 8px 32px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 9, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        {/* Refresh */}
        <button onClick={load} title="Actualizar" style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid #E2E8F0", background: WHITE, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🔄</button>

        {/* Setup headers button */}
        {!hasEstado && allRows.length > 0 && (
          <button onClick={setupHeaders} title="Agregar columna Estado" style={{ padding: "7px 14px", background: YELLOW_BG, border: `1px solid ${YELLOW_BD}`, borderRadius: 9, fontSize: 12, fontWeight: 600, color: YELLOW, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            ⚠️ Configurar encabezados
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: MUTED, fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>Cargando citas...
        </div>
      ) : error ? (
        <div style={{ background: RED_BG, border: `1px solid ${RED_BD}`, borderRadius: 12, padding: "16px 20px", color: RED, fontSize: 14 }}>
          ❌ {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#F8FAFF", borderRadius: 14, border: "1.5px dashed #CBD5E1" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>{allRows.length === 0 ? "📭" : "🔍"}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
            {allRows.length === 0 ? "No hay citas aún" : "Sin resultados"}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            {allRows.length === 0 ? "Las citas agendadas por WhatsApp aparecerán aquí." : "Cambia el filtro o la búsqueda."}
          </div>
        </div>
      ) : (
        <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFF", borderBottom: "1.5px solid #E2E8F0" }}>
                  <th style={thStyle}>#</th>
                  {visibleHeaders.map(h => <th key={h} style={thStyle}>{h}</th>)}
                  <th style={thStyle}>Estado</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const status  = getRowStatus(row);
                  const loading = actionLoading[row._rowIndex];
                  return (
                    <tr key={row._rowIndex} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFF"}
                      onMouseLeave={e => e.currentTarget.style.background = WHITE}>
                      <td style={tdStyle}><span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{i + 1}</span></td>
                      {visibleHeaders.map(h => (
                        <td key={h} style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row[h] || <span style={{ color: "#CBD5E1" }}>—</span>}
                        </td>
                      ))}
                      <td style={tdStyle}><StatusBadge status={status} /></td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {/* Ver detalle */}
                          <button onClick={() => setModal(row)} style={btnStyle("#F1F5F9", TEXT)}>Ver</button>
                          {/* Confirm / Revert */}
                          {status === "Pendiente" && (
                            <button onClick={() => updateStatus(row, "Confirmada")} disabled={!!loading}
                              style={btnStyle(GREEN_BG, GREEN, GREEN_BD)}>
                              {loading === "Confirmada" ? "..." : "✅"}
                            </button>
                          )}
                          {status === "Confirmada" && (
                            <button onClick={() => updateStatus(row, "Pendiente")} disabled={!!loading}
                              style={btnStyle(YELLOW_BG, YELLOW, YELLOW_BD)}>
                              {loading === "Pendiente" ? "..." : "↩️"}
                            </button>
                          )}
                          {/* Cancel */}
                          {status !== "Cancelada" && (
                            <button onClick={() => updateStatus(row, "Cancelada")} disabled={!!loading}
                              style={btnStyle(RED_BG, RED, RED_BD)}>
                              {loading === "Cancelada" ? "..." : "✕"}
                            </button>
                          )}
                          {/* Delete */}
                          <button onClick={() => setDeleteModal(row)} disabled={!!loading}
                            style={{ ...btnStyle(RED_BG, RED, RED_BD), fontWeight: 700 }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #F1F5F9", fontSize: 12, color: MUTED }}>
            {filtered.length} de {allRows.length} cita{allRows.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal && (
        <div onClick={() => setModal(null)} style={overlayStyle}>
          <div onClick={e => e.stopPropagation()} style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>📅 Detalle de la cita</div>
                <div style={{ marginTop: 6 }}><StatusBadge status={getRowStatus(modal)} /></div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 15 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[...visibleHeaders, "Estado"].map(h => (
                <div key={h} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                  <div style={{ fontSize: 13, color: TEXT, background: "#F8FAFF", borderRadius: 8, padding: "8px 12px", border: "1px solid #E2E8F0" }}>
                    {modal[h] || <span style={{ color: "#CBD5E1" }}>Sin datos</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons inside modal */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {getRowStatus(modal) === "Pendiente" && (
                <button onClick={() => updateStatus(modal, "Confirmada")}
                  style={{ flex: 1, padding: "10px", background: GREEN_BG, border: `1.5px solid ${GREEN_BD}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: GREEN, cursor: "pointer", fontFamily: "inherit" }}>
                  ✅ Confirmar cita
                </button>
              )}
              {getRowStatus(modal) === "Confirmada" && (
                <button onClick={() => updateStatus(modal, "Pendiente")}
                  style={{ flex: 1, padding: "10px", background: YELLOW_BG, border: `1.5px solid ${YELLOW_BD}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: YELLOW, cursor: "pointer", fontFamily: "inherit" }}>
                  ↩️ Marcar pendiente
                </button>
              )}
              {getRowStatus(modal) !== "Cancelada" && (
                <button onClick={() => updateStatus(modal, "Cancelada")}
                  style={{ padding: "10px 16px", background: RED_BG, border: `1.5px solid ${RED_BD}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: RED, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancelar
                </button>
              )}
              <button onClick={() => { setDeleteModal(modal); setModal(null); }}
                style={{ padding: "10px 14px", background: RED_BG, border: `1.5px solid ${RED_BD}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: RED, cursor: "pointer", fontFamily: "inherit" }}>
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div onClick={() => setDeleteModal(null)} style={overlayStyle}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalStyle, maxWidth: 400 }}>
            <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 8 }}>¿Eliminar esta cita?</div>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>
                Esta acción también la borrará de Google Sheets y no se puede deshacer.
              </div>
              {deleteModal["Nombre"] && (
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginTop: 8 }}>
                  {deleteModal["Nombre"]} {deleteModal["Apellido"] || ""}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteModal(null)} style={{ flex: 1, padding: "11px", background: "#F1F5F9", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button onClick={() => deleteRow(deleteModal)} disabled={!!actionLoading[deleteModal._rowIndex]}
                style={{ flex: 1, padding: "11px", background: RED, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit" }}>
                {actionLoading[deleteModal._rowIndex] === "delete" ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const thStyle = { padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" };
const tdStyle = { padding: "13px 14px", fontSize: 13, color: TEXT };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 };
const modalStyle = { background: WHITE, borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "80vh", overflowY: "auto" };
function btnStyle(bg, color, border) {
  return { padding: "5px 11px", background: bg, border: `1px solid ${border || "#E2E8F0"}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" };
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// WEEKLY CALENDAR GRID
// ═══════════════════════════════════════════════════════════
const DAYS_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function WeeklyCalendarGrid({ apt, setAptField }) {
  const slotDuration = apt.slotDuration || 60;

  // Parse start/end hours (stored as "HH:MM" or integer)
  const parseHour = (v, def) => {
    if (!v) return def;
    if (typeof v === "number") return v;
    const [h] = String(v).split(":").map(Number);
    return isNaN(h) ? def : h;
  };
  const startH = parseHour(apt.startHour, 9);
  const endH   = parseHour(apt.endHour,   18);

  // Build time slot labels
  const slots = [];
  const totalMins = (endH - startH) * 60;
  for (let m = 0; m < totalMins; m += slotDuration) {
    const h  = startH + Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }

  // weeklySlots: { "0": ["09:00","10:00"], "1": [...], ... }
  const weeklySlots = apt.weeklySlots || {};

  const isOn = (day, slot) => (weeklySlots[day] || []).includes(slot);

  const toggle = (day, slot) => {
    const cur = weeklySlots[day] || [];
    const next = cur.includes(slot) ? cur.filter(s => s !== slot) : [...cur, slot].sort();
    setAptField({ weeklySlots: { ...weeklySlots, [day]: next } });
  };

  const toggleDay = (day) => {
    const cur = weeklySlots[day] || [];
    const next = cur.length === slots.length ? [] : [...slots];
    setAptField({ weeklySlots: { ...weeklySlots, [day]: next } });
  };

  const toggleSlot = (slot) => {
    const allOn = [0,1,2,3,4,5,6].every(d => isOn(d, slot));
    const next = { ...weeklySlots };
    [0,1,2,3,4,5,6].forEach(d => {
      const cur = next[d] || [];
      next[d] = allOn ? cur.filter(s => s !== slot) : [...cur.filter(s => s !== slot), slot].sort();
    });
    setAptField({ weeklySlots: next });
  };

  const totalActive = Object.values(weeklySlots).reduce((acc, arr) => acc + (arr || []).length, 0);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: BLUE }} /> Disponible
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MUTED }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: "#F1F5F9", border: "1px solid #E2E8F0" }} /> No disponible
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: BLUE }}>
          {totalActive} slot{totalActive !== 1 ? "s" : ""} activo{totalActive !== 1 ? "s" : ""}
        </div>
      </div>

      {slots.length === 0 ? (
        <div style={{ textAlign: "center", color: MUTED, fontSize: 13, padding: "24px 0" }}>
          Configura las horas de inicio y fin en los campos de arriba para ver el calendario.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 420 }}>
            <thead>
              <tr>
                {/* Empty top-left corner */}
                <th style={{ width: 54, padding: "6px 4px" }} />
                {DAYS_LABELS.map((d, i) => {
                  const daySlots = weeklySlots[i] || [];
                  const allOn = daySlots.length === slots.length;
                  const someOn = daySlots.length > 0 && !allOn;
                  return (
                    <th key={i} style={{ padding: "0 3px 6px" }}>
                      <button onClick={() => toggleDay(i)} style={{
                        width: "100%", padding: "7px 4px", borderRadius: 8, cursor: "pointer",
                        background: allOn ? BLUE : someOn ? BLUE_MID : "#F8FAFF",
                        border: allOn ? `1.5px solid ${BLUE}` : someOn ? `1.5px solid #93C5FD` : "1.5px solid #E2E8F0",
                        color: allOn ? WHITE : someOn ? BLUE : MUTED,
                        fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
                      }}>
                        {d}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const allOn = [0,1,2,3,4,5,6].every(d => isOn(d, slot));
                return (
                  <tr key={slot}>
                    {/* Time label — click to toggle all days for this hour */}
                    <td style={{ padding: "2px 6px 2px 0", verticalAlign: "middle" }}>
                      <button onClick={() => toggleSlot(slot)} style={{
                        width: "100%", padding: "5px 6px", borderRadius: 6, cursor: "pointer",
                        background: allOn ? "#EFF6FF" : "transparent",
                        border: "none", fontSize: 11, fontWeight: 700,
                        color: allOn ? BLUE : MUTED, fontFamily: "inherit", textAlign: "right",
                        whiteSpace: "nowrap",
                      }}>
                        {slot}
                      </button>
                    </td>
                    {[0,1,2,3,4,5,6].map(day => {
                      const on = isOn(day, slot);
                      return (
                        <td key={day} style={{ padding: "2px 3px", verticalAlign: "middle" }}>
                          <button onClick={() => toggle(day, slot)} style={{
                            width: "100%", height: 34, borderRadius: 7, cursor: "pointer",
                            background: on ? BLUE : "#F8FAFF",
                            border: on ? `1.5px solid ${BLUE}` : "1.5px solid #E2E8F0",
                            transition: "all 0.12s", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = BLUE_MID; }}
                            onMouseLeave={e => { if (!on) e.currentTarget.style.background = "#F8FAFF"; }}
                          >
                            {on && <span style={{ color: WHITE, fontSize: 13, lineHeight: 1 }}>✓</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick time range config */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 4 }}>Hora inicio del día</label>
          <input type="time" value={apt.startHour || "09:00"} onChange={e => setAptField({ startHour: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: TEXT, fontFamily: "inherit", outline: "none", background: WHITE, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 4 }}>Hora fin del día</label>
          <input type="time" value={apt.endHour || "18:00"} onChange={e => setAptField({ endHour: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: TEXT, fontFamily: "inherit", outline: "none", background: WHITE, boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
        💡 Cambia las horas o duración arriba para regenerar el grid. Clic en un día para activar/desactivar todo el día. Clic en la hora para activar/desactivar esa hora en toda la semana.
      </div>
    </div>
  );
}

// CONFIG TAB
// ═══════════════════════════════════════════════════════════
function TabConfig({ config, onSaved }) {
  const [apt,      setApt]      = useState(config?.appointments || {});
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState("");
  const [showCreds,setShowCreds] = useState(false);

  const fields   = apt.fields   || DEFAULT_FIELDS;
  const workDays = apt.workDays || [1, 2, 3, 4, 5];

  const setAptField = (patch) => setApt(a => ({ ...a, ...patch }));
  const addField    = () => { const id = `campo_${Date.now()}`; setAptField({ fields: [...fields, { id, label: "", key: id, required: false, type: "text" }] }); };
  const removeField = id => setAptField({ fields: fields.filter(f => f.id !== id) });
  const updateField = (id, patch) => setAptField({ fields: fields.map(f => f.id === id ? { ...f, ...patch } : f) });
  const moveField   = (idx, dir) => {
    const arr = [...fields]; const t = idx + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[idx], arr[t]] = [arr[t], arr[idx]];
    setAptField({ fields: arr });
  };
  const toggleWorkDay = d => {
    const u = workDays.includes(d) ? workDays.filter(x => x !== d) : [...workDays, d].sort();
    setAptField({ workDays: u });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res  = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appointments: apt }) });
      const data = await res.json();
      setToast(data.success ? "✅ Guardado" : "❌ Error al guardar");
      if (data.success) onSaved?.();
    } catch { setToast("❌ Error de red"); }
    setSaving(false);
    setTimeout(() => setToast(""), 3000);
  };

  const calConnected   = !!(apt.calendarId && apt.googleCredentials);
  const sheetConnected = !!(apt.sheetsId && apt.googleCredentials);

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Enable */}
      <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "16px 20px", marginBottom: 18 }}>
        <Toggle checked={apt.enabled || false} onChange={v => setAptField({ enabled: v })}
          label="Sistema de citas activo"
          desc="El bot recopilará datos y agendará citas automáticamente por WhatsApp" />
        <div style={{ height: 1, background: "#F1F5F9", margin: "4px 0 10px" }} />
        <Toggle checked={apt.sendConfirmation !== false} onChange={v => setAptField({ sendConfirmation: v })}
          label="📱 Confirmación automática por WhatsApp"
          desc="Al agendar, el cliente recibe un mensaje con fecha y hora de su cita" />
      </div>

      {/* Fields */}
      <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Datos a recopilar del cliente</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>El bot pide estos campos uno por uno</div>
          </div>
          <button onClick={addField} style={{ padding: "8px 14px", background: BLUE, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit" }}>+ Campo</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fields.map((f, idx) => (
            <div key={f.id} style={{ background: "#F8FAFF", borderRadius: 12, padding: "12px 14px", border: "1.5px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
                <button onClick={() => moveField(idx, -1)} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: 11, color: idx === 0 ? "#E2E8F0" : MUTED }}>▲</button>
                <button onClick={() => moveField(idx, 1)} disabled={idx === fields.length-1} style={{ background: "none", border: "none", cursor: idx === fields.length-1 ? "not-allowed" : "pointer", fontSize: 11, color: idx === fields.length-1 ? "#E2E8F0" : MUTED }}>▼</button>
              </div>
              <input value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} placeholder="Etiqueta"
                style={{ flex: 2, padding: "7px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit", background: WHITE }} />
              <select value={f.type || "text"} onChange={e => updateField(f.id, { type: e.target.value })}
                style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit", background: WHITE, cursor: "pointer" }}>
                {["text","tel","email","date","time","number"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => updateField(f.id, { required: !f.required })} style={{
                padding: "5px 10px", borderRadius: 7, border: `1px solid ${f.required ? BLUE_MID : "#E2E8F0"}`,
                background: f.required ? BLUE_LIGHT : WHITE, fontSize: 11, fontWeight: 700,
                color: f.required ? BLUE : MUTED, cursor: "pointer", flexShrink: 0,
              }}>
                {f.required ? "★ Req." : "☆ Opc."}
              </button>
              <button onClick={() => removeField(f.id)} style={{ background: RED_BG, border: `1px solid ${RED_BD}`, borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: RED, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Google Calendar */}
      <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "20px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Google Calendar</div>
            <div style={{ fontSize: 12, color: MUTED }}>Crea eventos automáticamente</div>
          </div>
          {calConnected && <span style={{ fontSize: 12, fontWeight: 600, color: GREEN, background: GREEN_BG, border: `1px solid ${GREEN_BD}`, padding: "3px 10px", borderRadius: 8 }}>● Conectado</span>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label>Calendar ID</Label>
          <Input value={apt.calendarId || ""} onChange={e => setAptField({ calendarId: e.target.value })} placeholder="tu@email.com" />
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Comparte el calendario con: <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>botflow-citas@watbot-497518.iam.gserviceaccount.com</code></div>
        </div>
        <div>
          <Label>Zona horaria</Label>
          <Select value={apt.timezone || "America/Mexico_City"} onChange={e => setAptField({ timezone: e.target.value })}
            options={[
              { value: "America/Mexico_City", label: "México (CDMX)" },
              { value: "America/Monterrey",   label: "México (Monterrey)" },
              { value: "America/Bogota",      label: "Colombia" },
              { value: "America/Lima",        label: "Perú" },
              { value: "America/Santiago",    label: "Chile" },
              { value: "America/Argentina/Buenos_Aires", label: "Argentina" },
              { value: "Europe/Madrid",       label: "España" },
            ]}
          />
        </div>
      </div>

      {/* Google Sheets */}
      <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "20px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Google Sheets</div>
            <div style={{ fontSize: 12, color: MUTED }}>Cada cita se guarda como fila</div>
          </div>
          {sheetConnected && <span style={{ fontSize: 12, fontWeight: 600, color: GREEN, background: GREEN_BG, border: `1px solid ${GREEN_BD}`, padding: "3px 10px", borderRadius: 8 }}>● Conectado</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <div>
            <Label>Spreadsheet ID</Label>
            <Input value={apt.sheetsId || ""} onChange={e => setAptField({ sheetsId: e.target.value })} placeholder="1hTYcX..." />
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>URL: /spreadsheets/d/<strong>ID</strong>/edit</div>
          </div>
          <div>
            <Label>Pestaña</Label>
            <Input value={apt.sheetsTab || "Citas"} onChange={e => setAptField({ sheetsTab: e.target.value })} placeholder="Citas" />
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>🔑 Credenciales Google</div>
            <div style={{ fontSize: 12, color: MUTED }}>JSON de cuenta de servicio</div>
          </div>
          <button onClick={() => setShowCreds(!showCreds)} style={{ padding: "6px 12px", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: MUTED, cursor: "pointer", fontFamily: "inherit" }}>
            {showCreds ? "🙈 Ocultar" : "👁️ Mostrar"}
          </button>
        </div>
        {apt.googleCredentials && !showCreds
          ? <div style={{ padding: "10px 14px", background: GREEN_BG, border: `1px solid ${GREEN_BD}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: GREEN }}>● Credenciales configuradas</div>
          : showCreds
            ? <Textarea value={apt.googleCredentials || ""} onChange={e => setAptField({ googleCredentials: e.target.value })} placeholder='{"type":"service_account",...}' rows={5} />
            : <div style={{ padding: "10px 14px", background: YELLOW_BG, border: `1px solid ${YELLOW_BD}`, borderRadius: 10, fontSize: 13, color: YELLOW }}>⚠️ Sin credenciales — haz clic en "Mostrar" para pegar el JSON</div>}
      </div>

      {/* Schedule — Visual Calendar Grid */}
      <div style={{ background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "20px", marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 2 }}>🗓️ Disponibilidad semanal</div>
            <div style={{ fontSize: 11, color: MUTED }}>Haz clic en las celdas para activar/desactivar horarios. Clic en el día para seleccionar todo.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>Duración:</label>
            <select
              value={String(apt.slotDuration || 60)}
              onChange={e => setAptField({ slotDuration: Number(e.target.value) })}
              style={{ padding: "6px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 12, color: TEXT, fontFamily: "inherit", cursor: "pointer" }}
            >
              {[["15","15 min"],["30","30 min"],["45","45 min"],["60","1 hora"],["90","1h 30m"],["120","2 horas"]].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <WeeklyCalendarGrid apt={apt} setAptField={setAptField} />
      </div>

      {/* ── Recordatorio ─────────────────────────────────────── */}
      <div style={{ background: GREEN_BG, border: `1.5px solid ${GREEN_BD}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          ⏰ Recordatorio automático por WhatsApp
        </div>
        <div style={{ fontSize: 11, color: "#166534", marginBottom: 12 }}>
          El bot enviará automáticamente un mensaje de recordatorio al cliente antes de su cita.
        </div>
        <Select
          value={String(apt.reminderMinutes || 0)}
          onChange={e => setAptField({ reminderMinutes: Number(e.target.value) })}
          options={[
            { value: "0",    label: "Sin recordatorio" },
            { value: "30",   label: "⏰ 30 minutos antes" },
            { value: "60",   label: "⏰ 1 hora antes" },
            { value: "120",  label: "⏰ 2 horas antes" },
            { value: "240",  label: "⏰ 4 horas antes" },
            { value: "720",  label: "⏰ 12 horas antes" },
            { value: "1440", label: "⏰ 24 horas antes (1 día)" },
            { value: "2880", label: "⏰ 48 horas antes (2 días)" },
          ]}
        />
        {apt.reminderMinutes > 0 && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,255,255,0.6)", borderRadius: 8, fontSize: 12, color: "#15803D" }}>
            📱 Mensaje de ejemplo: <em>"Hola [Nombre], te recordamos que tienes una cita en [negocio] el [fecha] a las [hora]. ¡Te esperamos! 🙏"</em>
          </div>
        )}
      </div>

      {/* ── Calendario de reservas para clientes ─────────────── */}
      <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          🗓️ Calendario de reservas para clientes
        </div>
        <div style={{ fontSize: 11, color: "#3B82F6", marginBottom: 12, lineHeight: 1.5 }}>
          Tus clientes pueden elegir su fecha y hora en esta página. El bot puede enviarles este link automáticamente.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <code style={{
            flex: 1, fontSize: 12, color: "#1D4ED8", background: "rgba(255,255,255,0.7)",
            padding: "8px 12px", borderRadius: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {typeof window !== "undefined" ? `${window.location.origin}/booking` : "https://botflow-eight.vercel.app/booking"}
          </code>
          <button
            onClick={() => { const url = typeof window !== "undefined" ? `${window.location.origin}/booking` : ""; navigator.clipboard.writeText(url); }}
            style={{ padding: "8px 14px", background: BLUE, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: WHITE, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            Copiar
          </button>
          <a href="/booking" target="_blank" rel="noreferrer"
            style={{ padding: "8px 14px", background: WHITE, border: "1.5px solid #BFDBFE", borderRadius: 8, fontSize: 12, fontWeight: 700, color: BLUE, cursor: "pointer", textDecoration: "none", flexShrink: 0 }}>
            Ver →
          </a>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        {toast && <div style={{ fontSize: 13, fontWeight: 600, color: toast.startsWith("✅") ? GREEN : RED }}>{toast}</div>}
        <button onClick={save} disabled={saving} style={{
          padding: "12px 28px", background: saving ? "#93C5FD" : BLUE, border: "none", borderRadius: 12,
          fontSize: 14, fontWeight: 700, color: WHITE, cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "inherit", boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
        }}>
          {saving ? "⏳ Guardando..." : "💾 Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function CitasPage() {
  const [tab,    setTab]    = useState("agenda");
  const [config, setConfig] = useState(null);

  const loadConfig = useCallback(async () => {
    try {
      const res  = await fetch("/api/config");
      const data = await res.json();
      setConfig(data);
    } catch {}
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const aptConfig = config?.appointments || {};

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: BLUE_MID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📅</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0 }}>Gestión de Citas</h1>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            {aptConfig.enabled ? "Sistema activo — el bot agenda citas automáticamente" : "Sistema inactivo — actívalo en Configuración"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: aptConfig.enabled ? GREEN_BG : "#F1F5F9", border: `1px solid ${aptConfig.enabled ? GREEN_BD : "#E2E8F0"}`, borderRadius: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: aptConfig.enabled ? GREEN : "#CBD5E1" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: aptConfig.enabled ? GREEN : MUTED }}>
            {aptConfig.enabled ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "#F1F5F9", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {[{ id: "agenda", icon: "📅", label: "Agenda" }, { id: "config", icon: "⚙️", label: "Configuración" }].map(t => (
          <button key={t.id} data-tab={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer",
            background: tab === t.id ? WHITE : "transparent",
            color: tab === t.id ? BLUE : MUTED,
            fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
            fontFamily: "inherit", transition: "all 0.2s",
            boxShadow: tab === t.id ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {!config ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>Cargando...
        </div>
      ) : tab === "agenda" ? (
        <TabAgenda aptConfig={aptConfig} />
      ) : (
        <TabConfig config={config} onSaved={loadConfig}