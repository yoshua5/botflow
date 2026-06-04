"use client";
import { useState, useEffect } from "react";

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const GREEN = "#10B981";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

export default function WhatsAppOneClick({ botId, onConnected }) {
  const [status, setStatus] = useState("idle"); // idle, connecting, connected, error
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [error, setError] = useState(null);

  // Cargar estado existente
  useEffect(() => {
    fetch(`/api/bots/${botId}/whatsapp`)
      .then(r => r.json())
      .then(data => {
        if (data.phoneNumber) {
          setStatus("connected");
          setPhoneNumber(data.phoneNumber);
        }
      })
      .catch(() => {});
  }, [botId]);

  const handleConnect = async () => {
    setStatus("connecting");
    setError(null);

    try {
      // Step 1: Crear el link de conexión Facebook/Instagram
      const initRes = await fetch("/api/whatsapp/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId }),
      });

      const initData = await initRes.json();
      if (!initData.authUrl) throw new Error("No se pudo generar el enlace");

      // Step 2: Abrir popup de Facebook (usuario inicia sesión)
      const popup = window.open(initData.authUrl, "facebook-auth", "width=500,height=600");

      // Step 3: Escuchar el callback
      const checkInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/bots/${botId}/whatsapp/status`);
          const statusData = await statusRes.json();

          if (statusData.connected) {
            setStatus("connected");
            setPhoneNumber(statusData.phoneNumber);
            onConnected?.(statusData);
            clearInterval(checkInterval);
            popup?.close();
          }
        } catch (e) {
          // Esperando...
        }
      }, 1000);

      // Timeout después de 2 minutos
      setTimeout(() => {
        clearInterval(checkInterval);
        if (status === "connecting") {
          setStatus("error");
          setError("Conexión cancelada. Intenta de nuevo.");
        }
      }, 120000);
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`/api/bots/${botId}/whatsapp`, {
        method: "DELETE",
      });
      setStatus("idle");
      setPhoneNumber(null);
    } catch (e) {
      setError("Error al desconectar");
    }
  };

  // ─────────────────────────────────────────────────────────
  // CONNECTED STATE
  // ─────────────────────────────────────────────────────────
  if (status === "connected" && phoneNumber) {
    return (
      <div style={{
        background: "#F0FDF4",
        border: "1px solid #86EFAC",
        borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: GREEN, marginBottom: 4 }}>
              ✅ WhatsApp Conectado
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>
              📱 {phoneNumber}
            </div>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
              Tu bot está listo para recibir mensajes en WhatsApp. Los clientes pueden contactarte directamente.
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              padding: "8px 12px",
              background: WHITE,
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: MUTED,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#F3F4F6";
              e.currentTarget.style.borderColor = "#D1D5DB";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = WHITE;
              e.currentTarget.style.borderColor = "#E5E7EB";
            }}>
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // CONNECTING STATE
  // ─────────────────────────────────────────────────────────
  if (status === "connecting") {
    return (
      <div style={{
        background: BLUE_LIGHT,
        border: `1px solid #93C5FD`,
        borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `3px solid ${BLUE}`,
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
          }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: BLUE, marginBottom: 4 }}>
              Conectando...
            </div>
            <div style={{ fontSize: 12, color: MUTED }}>
              Completa el login en Facebook para autorizar WhatsApp
            </div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div style={{
        background: "#FEF2F2",
        border: "1px solid #FCA5A5",
        borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>
              ❌ Error de conexión
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>
              {error || "Algo salió mal. Intenta de nuevo."}
            </div>
          </div>
          <button
            onClick={() => setStatus("idle")}
            style={{
              padding: "8px 12px",
              background: WHITE,
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: MUTED,
              cursor: "pointer",
            }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // IDLE STATE - MAIN BUTTON
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      background: BLUE_LIGHT,
      border: `1px solid #93C5FD`,
      borderRadius: 12,
      padding: "20px",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: BLUE, marginBottom: 12 }}>
          📱 Conectar WhatsApp en 1 click
        </div>
        <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px 0", lineHeight: 1.5 }}>
          Autoriza a Botflow para gestionar tu número de WhatsApp Business. Solo necesitamos acceso a tu cuenta.
        </p>
        <button
          onClick={handleConnect}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: BLUE,
            color: WHITE,
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#1D4ED8";
            e.currentTarget.style.transform = "scale(1.01)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = BLUE;
            e.currentTarget.style.transform = "scale(1)";
          }}>
          🔐 Iniciar sesión con Facebook
        </button>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 12, textAlign: "center" }}>
          ✓ Seguro y encriptado  •  ✓ Solo lectura  •  ✓ Sin spam
        </div>
      </div>
    </div>
  );
}
