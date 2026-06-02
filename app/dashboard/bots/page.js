"use client";
import { useState, useEffect } from "react";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_MID = "#DBEAFE";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

function BotRow({ bot, onDelete, onToggle }) {
  const [active, setActive] = useState(bot.status === "ACTIVO");
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const newStatus = active ? "INACTIVO" : "ACTIVO";
    try {
      await fetch("/api/bots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bot.id, status: newStatus }),
      });
      setActive(!active);
      onToggle && onToggle(bot.id, newStatus);
    } catch (e) {}
    setToggling(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch("/api/bots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bot.id }),
      });
      onDelete(bot.id);
    } catch {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const initials = (bot.agentName || bot.name || "B").slice(0, 2).toUpperCase();
  const createdDate = bot.createdAt
    ? new Date(bot.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div style={{
      background: WHITE, borderRadius: 14, padding: "18px 22px",
      border: "1.5px solid #E2E8F0", display: "flex", alignItems: "center",
      gap: 16, transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}>

      <div style={{
        width: 52, height: 52, borderRadius: 14, background: BLUE_MID,
        border: "1px solid #BFDBFE", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 18, fontWeight: 800, color: BLUE, flexShrink: 0,
      }}>{initials}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{bot.agentName || bot.name}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 100,
            background: active ? "#F0FDF4" : "#F1F5F9",
            color: active ? "#16A34A" : "#94A3B8",
          }}>● {active ? "ACTIVO" : "INACTIVO"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
            {bot.businessName || "Mi negocio"} · Creado el {createdDate}
          </p>
          {bot.displayPhone ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#F0FDF4", border: "1px solid #86EFAC", padding: "1px 8px", borderRadius: 100 }}>
              📱 {bot.displayPhone}
            </span>
          ) : bot.phoneNumberId ? (
            <span style={{ fontSize: 11, color: MUTED, background: "#F1F5F9", padding: "1px 8px", borderRadius: 100 }}>
              📱 ID: {bot.phoneNumberId.slice(-6)}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "#F59E0B", background: "#FFFBEB", border: "1px solid #FDE68A", padding: "1px 8px", borderRadius: 100 }}>
              ⚠️ Sin número
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 28, flexShrink: 0 }}>
        {[
          { label: "Mensajes", val: (bot.messageCount || 0).toLocaleString() },
          { label: "Conversaciones", val: (bot.conversationCount || 0).toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{s.val}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <a href={`/dashboard/bots/${bot.id}`} style={{
          padding: "7px 16px", background: BLUE, borderRadius: 8, fontSize: 13,
          fontWeight: 700, color: WHITE, textDecoration: "none",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
          onMouseLeave={e => e.currentTarget.style.background = BLUE}>
          Gestionar
        </a>
        <a href={`/dashboard/knowledge?bot=${bot.id}`} style={{
          padding: "7px 14px", background: BLUE_LIGHT, borderRadius: 8, fontSize: 13,
          fontWeight: 700, color: BLUE, textDecoration: "none",
        }}>📚</a>

        {/* Toggle activar/desactivar */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={active ? "Desactivar bot" : "Activar bot"}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 8, border: "1.5px solid",
            borderColor: active ? "#BBF7D0" : "#E2E8F0",
            background: active ? "#F0FDF4" : "#F8FAFC",
            cursor: toggling ? "not-allowed" : "pointer",
            fontSize: 12, fontWeight: 700,
            color: active ? "#16A34A" : "#94A3B8",
            transition: "all 0.2s", flexShrink: 0,
          }}
          onMouseEnter={e => { if (!toggling) e.currentTarget.style.opacity = "0.75"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {/* Toggle pill */}
          <div style={{
            width: 32, height: 18, borderRadius: 9, position: "relative",
            background: active ? "#16A34A" : "#CBD5E1",
            transition: "background 0.2s", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 2,
              left: active ? 16 : 2,
              width: 14, height: 14, borderRadius: "50%",
              background: "#fff", transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </div>
          {toggling ? "..." : active ? "On" : "Off"}
        </button>

        {showConfirm ? (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={handleDelete} disabled={deleting} style={{
              padding: "7px 12px", background: "#FEF2F2", border: "1.5px solid #FECACA",
              borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#DC2626",
              cursor: deleting ? "default" : "pointer",
            }}>{deleting ? "..." : "Confirmar"}</button>
            <button onClick={() => setShowConfirm(false)} style={{
              padding: "7px 10px", background: WHITE, border: "1.5px solid #E2E8F0",
              borderRadius: 8, fontSize: 12, color: MUTED, cursor: "pointer",
            }}>No</button>
          </div>
        ) : (
          <button onClick={() => setShowConfirm(true)} style={{
            padding: "7px 12px", background: WHITE, border: "1.5px solid #E2E8F0",
            borderRadius: 8, fontSize: 13, color: "#EF4444", cursor: "pointer",
            fontWeight: 600,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = WHITE; }}>
            🗑
          </button>
        )}
      </div>
    </div>
  );
}

export default function BotsPage() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    fetch("/api/bots")
      .then(r => r.json())
      .then(d => { setBots(d.bots || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setBots(prev => prev.filter(b => b.id !== id));
  const handleToggle = (id, newStatus) => setBots(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

  const filtered = bots.filter(b => {
    const name = (b.agentName || b.name || "").toLowerCase();
    const biz = (b.businessName || "").toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || biz.includes(search.toLowerCase());
    const matchFilter = filter === "todos"
      || (filter === "activo" && b.status === "ACTIVO")
      || (filter === "inactivo" && b.status === "INACTIVO");
    return matchSearch && matchFilter;
  });

  const activeCount = bots.filter(b => b.status === "ACTIVO").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em", marginBottom: 4 }}>My Bots</h1>
          <p style={{ fontSize: 15, color: MUTED }}>
            {loading ? "Cargando..." : `${bots.length} bot${bots.length !== 1 ? "s" : ""} en tu workspace · ${activeCount} activo${activeCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <a href="/dashboard/create" style={{
          padding: "10px 20px", background: BLUE, borderRadius: 10, fontSize: 14,
          fontWeight: 700, color: WHITE, textDecoration: "none",
          boxShadow: "0 2px 8px rgba(37,99,235,0.3)", display: "flex", alignItems: "center", gap: 6,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
          onMouseLeave={e => e.currentTarget.style.background = BLUE}>
          <span style={{ fontSize: 18 }}>+</span> Nuevo Bot
        </a>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94A3B8" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar bots..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = "#93C5FD"}
            onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
        </div>
        <div style={{ display: "flex", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
          {[["todos", "Todos"], ["activo", "Activos"], ["inactivo", "Inactivos"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: "8px 16px", background: filter === val ? BLUE_LIGHT : "transparent",
              border: "none", borderRight: val !== "inactivo" ? "1px solid #E2E8F0" : "none",
              fontSize: 13, fontWeight: filter === val ? 700 : 500,
              color: filter === val ? BLUE : MUTED, cursor: "pointer", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "48px", color: MUTED, background: WHITE, borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
            Cargando bots...
          </div>
        )}
        {!loading && bots.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", background: WHITE, borderRadius: 14, border: "1.5px dashed #E2E8F0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Aún no tienes bots</div>
            <p style={{ color: MUTED, marginBottom: 24 }}>Crea tu primer agente de WhatsApp con IA en menos de 2 minutos.</p>
            <a href="/dashboard/create" style={{
              padding: "11px 24px", background: BLUE, borderRadius: 10, fontSize: 14,
              fontWeight: 700, color: WHITE, textDecoration: "none",
            }}>+ Crear mi primer bot</a>
          </div>
        )}
        {!loading && filtered.length === 0 && bots.length > 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: MUTED, background: WHITE, borderRadius: 14, border: "1.5px dashed #E2E8F0" }}>
            No hay bots que coincidan con tu búsqueda.
          </div>
        )}
        {filtered.map(bot => (
          <BotRow key={bot.id} bot={bot} onDelete={handleDelete} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
