"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

// ── Dynamic <title> + <link rel="icon"> from config ──────
function DynamicHead() {
  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(cfg => {
      if (cfg.siteName) document.title = cfg.siteName;
      // Update favicon link tag
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = `/api/favicon?t=${Date.now()}`;
    }).catch(() => {});
  }, []);
  return null;
}

const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

const NAV_ITEMS = [
  { icon: "▦",  label: "Dashboard",    href: "/dashboard" },
  { icon: "🤖", label: "My Bots",      href: "/dashboard/bots" },
  { icon: "📊", label: "Analytics",    href: "/dashboard/analytics" },
  { icon: "📚", label: "Conocimientos",href: "/dashboard/knowledge" },
];

function Sidebar({ collapsed }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const email = session?.user?.email;
  const isSuperAdmin = email === "yoshualeisorek17@gmail.com";

  // Fetch real subscription plan from server
  const [planName, setPlanName] = useState("...");
  useEffect(() => {
    if (!session) return;
    fetch("/api/subscription")
      .then(r => r.json())
      .then(d => setPlanName(d.plan || "FREE PLAN"))
      .catch(() => setPlanName("FREE PLAN"));
  }, [session]);

  const isFree = planName === "FREE PLAN" || planName === "...";
  const planColor = isFree ? BLUE : "#8B5CF6";
  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      minHeight: "100vh",
      background: WHITE,
      borderRight: "1px solid #E2E8F0",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s ease",
      flexShrink: 0,
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 8px", borderBottom: "1px solid #F1F5F9" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💬</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Bot<span style={{ color: BLUE }}>flow</span></div>
              <div style={{ fontSize: 10, fontWeight: 700, color: planColor, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
                {planName}
              </div>
            </div>
          )}
        </a>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <a key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "10px" : "10px 12px",
              borderRadius: 10,
              background: active ? BLUE_LIGHT : "transparent",
              color: active ? BLUE : MUTED,
              textDecoration: "none",
              fontWeight: active ? 700 : 500,
              fontSize: 14,
              transition: "all 0.15s",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#F8FAFF"; e.currentTarget.style.color = TEXT; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = MUTED; } }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: "8px", borderTop: "1px solid #F1F5F9" }}>
        <a href="/dashboard/create" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: collapsed ? "10px" : "12px 16px",
          background: BLUE, borderRadius: 12, textDecoration: "none",
          color: WHITE, fontWeight: 700, fontSize: 14,
          marginBottom: 8, justifyContent: collapsed ? "center" : "flex-start",
          boxShadow: "0 2px 8px rgba(37,99,235,0.3)", transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; }}
          onMouseLeave={e => { e.currentTarget.style.background = BLUE; }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>+</span>
          {!collapsed && <span>Create New Bot</span>}
        </a>
        
        {isSuperAdmin && (
          <a href="/dashboard/admin" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: collapsed ? "10px" : "10px 16px",
            background: "#1E293B", borderRadius: 12, textDecoration: "none",
            color: WHITE, fontWeight: 700, fontSize: 13,
            marginBottom: 8, justifyContent: collapsed ? "center" : "flex-start",
            transition: "background 0.2s",
          }} onMouseEnter={e => e.currentTarget.style.background = "#0F172A"} onMouseLeave={e => e.currentTarget.style.background = "#1E293B"}>
            <span style={{ fontSize: 16 }}>👑</span>
            {!collapsed && <span>Super Admin</span>}
          </a>
        )}

        {[
          { icon: "❓", label: "Help Center", href: "#" },
          { icon: "👤", label: "Account", href: "#" },
        ].map(item => (
          <a key={item.label} href={item.href} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "8px" : "8px 12px",
            borderRadius: 8, color: MUTED, textDecoration: "none",
            fontSize: 14, transition: "all 0.15s",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.background = "#F8FAFF"; }}
            onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </div>
    </aside>
  );
}

function TopBar({ sidebarWidth }) {
  const { data: session } = useSession();
  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || "Usuario";
  const email = session?.user?.email || "";

  return (
    <header style={{
      position: "fixed", top: 0, left: sidebarWidth, right: 0, height: 60, zIndex: 40,
      background: WHITE, borderBottom: "1px solid #E2E8F0",
      display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
      transition: "left 0.25s ease",
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94A3B8" }}>🔍</span>
        <input
          placeholder="Search bots or activity..."
          style={{
            width: "100%", padding: "8px 12px 8px 36px",
            background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 10,
            fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#93C5FD"}
          onBlur={e => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {/* Notifications */}
        <button style={{ width: 36, height: 36, borderRadius: 9, background: "#F8FAFF", border: "1.5px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, position: "relative" }}>
          🔔
          <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#EF4444", border: "1.5px solid white" }} />
        </button>
        {/* User card + Clerk UserButton */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 4px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: WHITE }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{displayName}</div>
            <div style={{ fontSize: 11, color: MUTED, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#2563EB",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Sign out"
          >
            {email?.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Floating Chat Test Widget ──────────────────────────────
function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "¡Hola! Soy tu bot. Escríbeme o habla para probarlo 👋" }
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "bot", text: data.reply || "Sin respuesta." }]);
    } catch {
      setMessages(m => [...m, { role: "bot", text: "❌ Error al conectar con el bot." }]);
    }
    setLoading(false);
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SpeechRecognition();
    r.lang = "es-MX";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart  = () => setListening(true);
    r.onend    = () => setListening(false);
    r.onerror  = () => setListening(false);
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      send(transcript);
    };
    recognitionRef.current = r;
    r.start();
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 28, right: 28, width: 54, height: 54,
        borderRadius: "50%", background: open ? "#1D4ED8" : BLUE,
        border: "none", cursor: "pointer", zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, color: WHITE, boxShadow: "0 6px 24px rgba(37,99,235,0.45)",
        transition: "all 0.2s",
      }}
        title="Probar bot"
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        {open ? "✕" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 94, right: 28, width: 360, height: 500,
          background: WHITE, borderRadius: 20, zIndex: 299,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1.5px solid #E2E8F0",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "chatIn 0.2s ease",
        }}>
          {/* Header */}
          <div style={{ background: BLUE, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: WHITE }}>Chat de Prueba</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Escribe o usa el micrófono 🎤</div>
            </div>
            <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? BLUE : "#F1F5F9",
                  color: m.role === "user" ? WHITE : TEXT,
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "9px 14px", background: "#F1F5F9", borderRadius: "14px 14px 14px 4px", fontSize: 18 }}>
                  <span style={{ animation: "pulse 1s infinite" }}>●</span><span style={{ animation: "pulse 1s infinite 0.2s" }}>●</span><span style={{ animation: "pulse 1s infinite 0.4s" }}>●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8, alignItems: "center" }}>
            {/* Mic button */}
            <button onClick={startVoice} title={listening ? "Detener" : "Hablar"} style={{
              width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
              background: listening ? "#EF4444" : "#F1F5F9", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, transition: "all 0.2s",
              boxShadow: listening ? "0 0 0 4px rgba(239,68,68,0.25)" : "none",
            }}>
              {listening ? "⏹" : "🎤"}
            </button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder={listening ? "Escuchando..." : "Escribe un mensaje..."}
              disabled={loading || listening}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 12,
                border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none",
                fontFamily: "inherit", background: listening ? "#FFF1F1" : WHITE,
                color: TEXT, transition: "all 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />

            <button onClick={() => send(input)} disabled={!input.trim() || loading} style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: input.trim() && !loading ? BLUE : "#E2E8F0",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: WHITE, flexShrink: 0, transition: "all 0.2s",
            }}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>
    </>
  );
}

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 64 : 240;

  const checkingOnboarding = false; // Onboarding redirect handled at sign-up only

  // Show blank while checking onboarding to avoid flash
  if (checkingOnboarding) {
    return <div style={{ minHeight: "100vh", background: "#F8FAFF" }} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFF", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <DynamicHead />
      <Sidebar collapsed={collapsed} />
      <div style={{ marginLeft: sidebarWidth, flex: 1, transition: "margin-left 0.25s ease" }}>
        <TopBar sidebarWidth={sidebarWidth} />
        <main style={{ marginTop: 60, padding: "32px 28px", minHeight: "calc(100vh - 60px)" }}>
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
                                                                     