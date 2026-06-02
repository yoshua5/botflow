"use client";
import { useState, useEffect } from "react";

const BLUE = "#2563EB";
const GREEN = "#16A34A";
const WHITE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES   = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];

function pad(n) { return String(n).padStart(2,"0"); }

function formatTime(slot, slotMinutes) {
  const [h, m] = slot.split(":").map(Number);
  const endMin = h * 60 + m + slotMinutes;
  const eh = Math.floor(endMin / 60);
  const em = endMin % 60;
  return `${pad(h)}:${pad(m)} – ${pad(eh)}:${pad(em)}`;
}

export default function BookingPage() {
  const [step, setStep] = useState("calendar"); // calendar | form | success
  const [bizConfig, setBizConfig] = useState(null);
  const [slots, setSlots] = useState({});
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-based

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [fromPhone, setFromPhone] = useState("");

  // Load config and slots
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromPhone(params.get("from") || "");

    fetch("/api/booking-config")
      .then(r => r.json())
      .then(c => {
        if (!c.enabled) { setError("Las citas no están habilitadas."); setLoading(false); return; }
        setBizConfig(c);
        loadSlots(now.getFullYear(), now.getMonth());
      })
      .catch(() => { setError("Error cargando la configuración."); setLoading(false); });
  }, []);

  const loadSlots = async (y, m) => {
    setLoading(true);
    try {
      const monthStr = `${y}-${pad(m + 1)}`;
      const res = await fetch(`/api/booking-slots?month=${monthStr}`);
      const data = await res.json();
      setSlots(data.availableByDate || {});
      setSlotMinutes(data.slotMinutes || 60);
    } catch {}
    setLoading(false);
  };

  const changeMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDate(null);
    setSelectedSlot(null);
    loadSlots(y, m);
  };

  // Build calendar grid
  const buildGrid = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const handleDayClick = (d) => {
    if (!d) return;
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
    if (!slots[dateStr]) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        fecha: selectedDate,
        hora: selectedSlot,
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, from: fromPhone }),
      });
      const result = await res.json();
      if (result.success || result.results) {
        setStep("success");
      } else {
        alert("Error: " + (result.error || "No se pudo agendar. Intenta de nuevo."));
      }
    } catch (e) {
      alert("Error de red. Intenta de nuevo.");
    }
    setSubmitting(false);
  };

  const canSubmit = () => {
    if (!selectedDate || !selectedSlot) return false;
    if (!bizConfig?.fields) return true;
    return bizConfig.fields.filter(f => f.required).every(f => formData[f.key]?.trim());
  };

  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const grid = buildGrid();
  const daySlots = selectedDate ? (slots[selectedDate] || []) : [];

  // ── Reminder label ─────────────────────────────────────────
  const reminderLabel = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} minutos`;
    if (mins === 60) return "1 hora";
    if (mins < 1440) return `${mins / 60} horas`;
    if (mins === 1440) return "24 horas (1 día)";
    return `${mins / 1440} días`;
  };

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF", padding: 24 }}>
        <div style={{ textAlign: "center", color: MUTED }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 16 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (loading && !bizConfig) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF" }}>
        <div style={{ textAlign: "center", color: MUTED }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p>Cargando calendario...</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0FDF4", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: GREEN, marginBottom: 8 }}>¡Cita confirmada!</h1>
          <p style={{ fontSize: 16, color: TEXT, marginBottom: 6 }}>
            <strong>{selectedDate}</strong> a las <strong>{selectedSlot}</strong>
          </p>
          {bizConfig?.reminderMinutes && (
            <p style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>
              ⏰ Te recordaremos <strong>{reminderLabel(bizConfig.reminderMinutes)}</strong> antes de tu cita.
            </p>
          )}
          <p style={{ fontSize: 14, color: MUTED, marginTop: 16 }}>
            Recibirás una confirmación por WhatsApp. Puedes cerrar esta ventana.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: WHITE, borderBottom: "1px solid #E2E8F0", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>Agendar cita</div>
          <div style={{ fontSize: 12, color: MUTED }}>{bizConfig?.businessName}</div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>

        {step === "calendar" && (
          <>
            {/* Month nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => changeMonth(-1)} style={{ padding: "8px 16px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 18, cursor: "pointer" }}>‹</button>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>{MONTHS_ES[viewMonth]} {viewYear}</h2>
              <button onClick={() => changeMonth(1)}  style={{ padding: "8px 16px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 18, cursor: "pointer" }}>›</button>
            </div>

            {/* Day labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
              {DAYS_ES.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: MUTED, padding: "4px 0" }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 24 }}>
              {grid.map((d, i) => {
                if (!d) return <div key={i} />;
                const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
                const hasSlots = !!slots[dateStr];
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const isPast = dateStr < todayStr;

                return (
                  <button key={i} onClick={() => handleDayClick(d)} disabled={!hasSlots || isPast}
                    style={{
                      aspectRatio: "1", borderRadius: 10, border: isSelected ? `2px solid ${BLUE}` : isToday ? `2px solid #93C5FD` : "2px solid transparent",
                      background: isSelected ? BLUE : hasSlots && !isPast ? WHITE : "transparent",
                      color: isSelected ? WHITE : isPast || !hasSlots ? "#CBD5E1" : TEXT,
                      fontSize: 14, fontWeight: hasSlots ? 700 : 400,
                      cursor: hasSlots && !isPast ? "pointer" : "default",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      boxShadow: hasSlots && !isPast && !isSelected ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s",
                      position: "relative",
                    }}
                  >
                    {d}
                    {hasSlots && !isPast && !isSelected && (
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: GREEN, position: "absolute", bottom: 4 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {loading && <div style={{ textAlign: "center", color: MUTED, fontSize: 13 }}>Cargando horarios...</div>}

            {/* Time slots */}
            {selectedDate && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 12 }}>
                  Horarios disponibles — {selectedDate.split("-").reverse().join("/")}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {daySlots.map(slot => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: "12px 8px", borderRadius: 10, textAlign: "center",
                        border: selectedSlot === slot ? `2px solid ${BLUE}` : "1.5px solid #E2E8F0",
                        background: selectedSlot === slot ? "#EFF6FF" : WHITE,
                        color: selectedSlot === slot ? BLUE : TEXT,
                        fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}>
                      {formatTime(slot, slotMinutes)}
                    </button>
                  ))}
                </div>

                {selectedSlot && (
                  <button onClick={() => setStep("form")}
                    style={{ width: "100%", padding: "14px", background: BLUE, border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, color: WHITE, cursor: "pointer", fontFamily: "inherit" }}>
                    Continuar →
                  </button>
                )}
              </div>
            )}

            {!selectedDate && !loading && (
              <p style={{ textAlign: "center", fontSize: 13, color: MUTED }}>
                🟢 Días con disponibilidad · Toca un día para ver horarios
              </p>
            )}
          </>
        )}

        {step === "form" && bizConfig && (
          <>
            {/* Summary */}
            <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 4 }}>📅 Tu cita seleccionada</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{selectedDate?.split("-").reverse().join("/")} · {selectedSlot}</div>
              {bizConfig.reminderMinutes && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>⏰ Recordatorio {reminderLabel(bizConfig.reminderMinutes)} antes</div>
              )}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 16 }}>Tus datos</h3>

            {/* Dynamic fields from config */}
            {(bizConfig.fields || []).filter(f => !["fecha","hora"].includes(f.key)).map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>
                  {field.label} {field.required && <span style={{ color: "#EF4444" }}>*</span>}
                </label>
                <input
                  type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : "text"}
                  value={formData[field.key] || ""}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder || field.label}
                  style={{
                    width: "100%", padding: "12px 14px", border: "1.5px solid #E2E8F0",
                    borderRadius: 10, fontSize: 15, color: TEXT, fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box", background: WHITE,
                  }}
                  onFocus={e => e.target.style.borderColor = "#93C5FD"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>
            ))}

            {/* If no fields configured, ask for name */}
            {(!bizConfig.fields || bizConfig.fields.length === 0) && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>Nombre <span style={{ color: "#EF4444" }}>*</span></label>
                <input type="text" value={formData.nombre || ""} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Tu nombre completo"
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 15, color: TEXT, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: WHITE }}
                  onFocus={e => e.target.style.borderColor = "#93C5FD"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep("calendar")} style={{ flex: 1, padding: "13px", background: WHITE, border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: 15, fontWeight: 700, color: MUTED, cursor: "pointer", fontFamily: "inherit" }}>
                ← Cambiar fecha
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit() || submitting}
                style={{ flex: 2, padding: "13px", background: canSubmit() && !submitting ? BLUE : "#CBD5E1", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: WHITE, cursor: canSubmit() && !submitting ? "pointer" : "default", fontFamily: "inherit" }}>
                {submitting ? "⏳ Agendando..." : "✅ Confirmar cita"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
