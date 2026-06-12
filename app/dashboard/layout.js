"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BotProvider, useBotContext } from "@/lib/bot-context";

// ── AgentFlow Logo SVG ────────────────────────────────────
function AgentLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="#0F172A"/>
      <path d="M18 6L26 26H10L18 6Z" fill="url(#logoGrad)" opacity="0.95"/>
      <ellipse cx="15" cy="23" rx="5" ry="4" fill="none" stroke="#22D3EE" strokeWidth="1.8"/>
      <circle cx="13.5" cy="23" r="0.8" fill="#22D3EE"/>
      <circle cx="15.5" cy="23" r="0.8" fill="#22D3EE"/>
      <line x1="22" y1="18" x2="27" y2="18" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="22" y1="21" x2="26" y2="21" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="22" y1="24" x2="25" y2="24" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="logoGrad" x1="18" y1="6" x2="18" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF"/>
          <stop offset="1" stopColor="#93C5FD"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Dynamic <title> + favicon ─────────────────────────────
function DynamicHead() {
  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(cfg => {
      if (cfg.siteName) document.title = cfg.siteName;
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = `/api/favicon?t=${Date.now()}`;
    }).catch(() => {});
  }, []);
  return null;
}

// ── Design tokens ─────────────────────────────────────────
const T = {
  blue:    "#2563EB",
  blueL:   "#EFF6FF",
  blueM:   "#DBEAFE",
  text:    "#0F172A",
  muted:   "#64748B",
  border:  "#E2E8F0",
  bg:      "#F8FAFF",
  white:   "#FFFFFF",
  green:   "#10B981",
  red:     "#EF4444",
  surface: "#F1F5F9",
};

// ── Nav structure ─────────────────────────────────────────
const GROUPS = [
  {
    label: "WORKSPACE",
    items: [
      { icon: "⊞", label: "Dashboard",  href: "/dashboard" },
      { icon: "📊", label: "Analytics",  href: "/dashboard/analytics" },
    ],
  },
  {
    label: "AUTOMATIZACIÓN",
    items: [
      { icon: "🤖", label: "Mis Bots",   href: "/dashboard/bots" },
    ],
    extra: "catalogos",
  },
  {
    label: "TIENDA",
    items: [],
    extra: "tienda",
  },
  {
    label: "CLIENTES",
    items: [
      { icon: "👥", label: "Contactos",  href: "/dashboard/contactos" },
      { icon: "📅", label: "Citas",      href: "/dashboard/citas" },
    ],
  },
  {
    label: "CONFIGURACIÓN",
    items: [],
    extra: "config",
  },
];

const CATALOGOS_CHILDREN = [
  { icon: "🖼️", label: "Ver Catálogo",    href: "/dashboard/catalogos" },
  { icon: "📤", label: "Subir Contenido", href: "/dashboard/catalogos/contenido" },
  { icon: "🌐", label: "Desde Sitio Web", href: "/dashboard/catalogos/sitio-web" },
];

const TIENDA_CHILDREN = [
  { icon: "🏪", label: "Mis Productos", href: "/dashboard/tienda" },
  { icon: "💳", label: "Pagos",         href: "/dashboard/pagos" },
];

const CONFIG_CHILDREN = [
  { icon: "👤", label: "Cuenta",      href: "/dashboard/configuracion/cuenta" },
  { icon: "🔌", label: "Conexiones",  href: "/dashboard/configuracion/conexiones" },
  { icon: "🤖", label: "Agentes",     href: "/dashboard/configuracion/agentes" },
];

// ── Nav Item ──────────────────────────────────────────────
function NavItem({ icon, label, href, active, collapsed, depth = 0 }) {
  return (
    <a href={href} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: collapsed ? "9px 14px" : depth > 0 ? "7px 10px 7px 14px" : "9px 12px",
      borderRadius: 8,
      background: active ? T.blueL : "transparent",
      color: active ? T.blue : T.muted,
      textDecoration: "none",
      fontWeight: active ? 700 : 500,
      fontSize: depth > 0 ? 13 : 14,
      transition: "all 0.12s",
      justifyContent: collapsed ? "center" : "flex-start",
      borderLeft: active && !collapsed ? `3px solid ${T.blue}` : "3px solid transparent",
      marginLeft: depth > 0 ? 8 : 0,
      position: "relative",
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#F0F4FF"; e.currentTarget.style.color = T.text; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; } }}>
      <span style={{ fontSize: depth > 0 ? 14 : 16, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      {!collapsed && <span style={{ lineHeight: 1.2 }}>{label}</span>}
    </a>
  );
}


// ── Bot Selector ──────────────────────────────────────────
function BotSelector({ collapsed }) {
  const { bots, selectedBot, setSelectedBot } = useBotContext();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!bots.length) return null;

  const initials = (b) => (b.name || b.phone_number_id || "B")[0].toUpperCase();
  const color = (b) => {
    const colors = ["#2563EB","#7C3AED","#DB2777","#D97706","#059669","#0891B2"];
    let h = 0;
    for (const c of (b.id || "")) h = ((h << 5) - h) + c.charCodeAt(0);
    return colors[Math.abs(h) % colors.length];
  };

  return (
    <div ref={ref} style={{ padding: "8px 8px 0", position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 8,
        padding: collapsed ? "8px 0" : "8px 10px",
        background: open ? "#EFF6FF" : "#F8FAFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 10, cursor: "pointer",
        justifyContent: collapsed ? "center" : "flex-start",
        transition: "all 0.12s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "#F8FAFF"; }}>
        {selectedBot ? (
          <>
            <div style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: color(selectedBot),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
            }}>{initials(selectedBot)}</div>
            {!collapsed && <>
              <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedBot.name || selectedBot.phone_number_id || "Bot"}
              </span>
              <span style={{ fontSize: 9, color: T.muted }}>▾</span>
            </>}
          </>
        ) : (
          <>
            <span style={{ fontSize: 16 }}>🤖</span>
            {!collapsed && <span style={{ fontSize: 13, color: T.muted }}>Seleccionar bot</span>}
          </>
        )}
      </button>
      {open && !collapsed && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 8, right: 8,
          background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden",
        }}>
          {bots.map(b => (
            <button key={b.id} onClick={() => { setSelectedBot(b); setOpen(false); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", border: "none", cursor: "pointer", textAlign: "left",
              background: selectedBot?.id === b.id ? "#EFF6FF" : "#fff",
              borderBottom: "1px solid #F1F5F9",
              transition: "background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#F8FAFF"}
              onMouseLeave={e => e.currentTarget.style.background = selectedBot?.id === b.id ? "#EFF6FF" : "#fff"}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: color(b), display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff",
              }}>{initials(b)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.name || "Bot sin nombre"}
                </div>
                {b.phone_number_id && <div style={{ fontSize: 11, color: T.muted }}>{b.phone_number_id}</div>}
              </div>
              {selectedBot?.id === b.id && <span style={{ fontSize: 14, color: "#2563EB" }}>✓</span>}
            </button>
          ))}
          <a href="/dashboard/create" style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
            textDecoration: "none", color: "#2563EB", fontWeight: 700, fontSize: 13,
            background: "#F8FAFF",
          }}>
            <span style={{ fontSize: 16 }}>+</span> Nuevo bot
          </a>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────
function Sidebar({ collapsed }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const email = session?.user?.email || "";
  const isSuperAdmin = email === "yoshualeisorek17@gmail.com";
  const isCatalogosActive = pathname.startsWith("/dashboard/catalogos");
  const isConfigActive    = pathname.startsWith("/dashboard/configuracion");
  const isTiendaActive    = pathname.startsWith("/dashboard/tienda") || pathname.startsWith("/dashboard/pagos");
  const [catalogosOpen, setCatalogosOpen] = useState(isCatalogosActive);
  const [configOpen,    setConfigOpen]    = useState(isConfigActive);
  const [tiendaOpen,    setTiendaOpen]    = useState(isTiendaActive);
  const [planName, setPlanName]  = useState("FREE");
  const [siteName, setSiteName]  = useState("");

  useEffect(() => {
    fetch("/api/config").then(r=>r.json()).then(c=>{ if(c.siteName) setSiteName(c.siteName); }).catch(()=>{});
    fetch("/api/subscription").then(r=>r.json()).then(d=>setPlanName(d.plan||"FREE")).catch(()=>{});
  }, []);

  const isFree = planName === "FREE" || planName === "FREE PLAN" || planName === "...";

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      minHeight: "100vh",
      background: T.white,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.22s ease",
      flexShrink: 0, position: "fixed",
      top: 0, left: 0, bottom: 0, zIndex: 50,
      overflow: "hidden",
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: "16px 12px 12px", borderBottom: `1px solid ${T.surface}` }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flexShrink: 0 }}><AgentLogo size={36} /></div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                {siteName || <span>Agent<span style={{ color: T.blue }}>Flow</span></span>}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", marginTop: 2,
                color: isFree ? T.blue : "#8B5CF6",
                background: isFree ? T.blueL : "#F3E8FF",
                padding: "1px 6px", borderRadius: 4, display: "inline-block",
              }}>
                {isFree ? "FREE" : planName}
              </div>
            </div>
          )}
        </a>
      </div>

      {/* ── Create New Bot CTA ── */}
      <div style={{ padding: "10px 10px 0" }}>
        <a href="/dashboard/create" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: collapsed ? "9px 0" : "10px 14px",
          background: T.blue, borderRadius: 10, textDecoration: "none",
          color: T.white, fontWeight: 700, fontSize: 13,
          justifyContent: collapsed ? "center" : "flex-start",
          boxShadow: "0 2px 8px rgba(37,99,235,0.28)",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.28)"; }}>
          <span style={{ fontSize: 15, fontWeight: 900 }}>+</span>
          {!collapsed && <span>Nuevo Bot</span>}
        </a>
      </div>

      {/* ── Bot selector ── */}
      <BotSelector collapsed={collapsed} />

      {/* ── Nav groups ── */}
      <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
        {GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginTop: gi > 0 ? 8 : 4 }}>
            {/* Group label */}
            {!collapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", padding: "6px 12px 4px", textTransform: "uppercase" }}>
                {group.label}
              </div>
            )}
            {collapsed && gi > 0 && <div style={{ height: 1, background: T.surface, margin: "4px 8px 4px" }} />}

            {/* Regular items */}
            {group.items.map(item => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <NavItem key={item.href} {...item} active={active} collapsed={collapsed} />
              );
            })}

            {/* Catálogos dropdown */}
            {group.extra === "catalogos" && (
              <div>
                <button onClick={() => setCatalogosOpen(o => !o)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: collapsed ? "9px 14px" : "9px 12px",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  background: isCatalogosActive ? T.blueL : "transparent",
                  color: isCatalogosActive ? T.blue : T.muted,
                  fontWeight: isCatalogosActive ? 700 : 500,
                  fontSize: 14, transition: "all 0.12s",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderLeft: isCatalogosActive && !collapsed ? `3px solid ${T.blue}` : "3px solid transparent",
                }}
                  onMouseEnter={e => { if (!isCatalogosActive) { e.currentTarget.style.background = "#F0F4FF"; e.currentTarget.style.color = T.text; } }}
                  onMouseLeave={e => { if (!isCatalogosActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; } }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📂</span>
                  {!collapsed && <>
                    <span style={{ flex: 1, textAlign: "left" }}>Catálogos</span>
                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: catalogosOpen ? "rotate(180deg)" : "none", color: "#94A3B8" }}>▾</span>
                  </>}
                </button>
                {catalogosOpen && !collapsed && (
                  <div style={{ paddingLeft: 8, marginTop: 2 }}>
                    {CATALOGOS_CHILDREN.map(child => {
                      const a = pathname === child.href || pathname.startsWith(child.href + "/");
                      return <NavItem key={child.href} {...child} active={a} collapsed={false} depth={1} />;
                    })}
                  </div>
                )}
              </div>
            )}


            {/* Tienda dropdown */}
            {group.extra === "tienda" && (
              <div>
                <button onClick={() => setTiendaOpen(o => !o)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: collapsed ? "9px 14px" : "9px 12px",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  background: isTiendaActive ? T.blueL : "transparent",
                  color: isTiendaActive ? T.blue : T.muted,
                  fontWeight: isTiendaActive ? 700 : 500,
                  fontSize: 14, transition: "all 0.12s",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderLeft: isTiendaActive && !collapsed ? `3px solid ${T.blue}` : "3px solid transparent",
                }}
                  onMouseEnter={e => { if (!isTiendaActive) { e.currentTarget.style.background = "#F0F4FF"; e.currentTarget.style.color = T.text; } }}
                  onMouseLeave={e => { if (!isTiendaActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; } }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>&#127987;&#65039;</span>
                  {!collapsed && <>
                    <span style={{ flex: 1, textAlign: "left" }}>Tienda</span>
                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: tiendaOpen ? "rotate(180deg)" : "none", color: "#94A3B8" }}>&or;</span>
                  </>}
                </button>
                {tiendaOpen && !collapsed && (
                  <div style={{ paddingLeft: 8, marginTop: 2 }}>
                    {TIENDA_CHILDREN.map(child => {
                      const a = pathname === child.href || pathname.startsWith(child.href + "/");
                      return <NavItem key={child.href} {...child} active={a} collapsed={false} depth={1} />;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Config dropdown */}
            {group.extra === "config" && (
              <div>
                <button onClick={() => setConfigOpen(o => !o)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: collapsed ? "9px 14px" : "9px 12px",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  background: isConfigActive ? T.blueL : "transparent",
                  color: isConfigActive ? T.blue : T.muted,
                  fontWeight: isConfigActive ? 700 : 500,
                  fontSize: 14, transition: "all 0.12s",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderLeft: isConfigActive && !collapsed ? `3px solid ${T.blue}` : "3px solid transparent",
                }}
                  onMouseEnter={e => { if (!isConfigActive) { e.currentTarget.style.background = "#F0F4FF"; e.currentTarget.style.color = T.text; } }}
                  onMouseLeave={e => { if (!isConfigActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; } }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚙️</span>
                  {!collapsed && <>
                    <span style={{ flex: 1, textAlign: "left" }}>Configuración</span>
                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: configOpen ? "rotate(180deg)" : "none", color: "#94A3B8" }}>▾</span>
                  </>}
                </button>
                {configOpen && !collapsed && (
                  <div style={{ paddingLeft: 8, marginTop: 2 }}>
                    {CONFIG_CHILDREN.map(child => {
                      const a = pathname === child.href;
                      return <NavItem key={child.href} {...child} active={a} collapsed={false} depth={1} />;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Super Admin */}
        {isSuperAdmin && (
          <div style={{ marginTop: 8 }}>
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", padding: "6px 12px 4px", textTransform: "uppercase" }}>ADMIN</div>}
            <NavItem icon="👑" label="Super Admin" href="/dashboard/super-admin" active={pathname.startsWith("/dashboard/super-admin")} collapsed={collapsed} />
          </div>
        )}
      </nav>

      {/* ── Bottom: help + account ── */}
      <div style={{ padding: "8px 8px 12px", borderTop: `1px solid ${T.surface}` }}>
        <NavItem icon="❓" label="Ayuda" href="#" active={false} collapsed={collapsed} />
        <div style={{ height: 1, background: T.surface, margin: "4px 4px" }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: collapsed ? "6px 8px" : "8px 10px",
          borderRadius: 8, cursor: "pointer",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          title="Cerrar sesión"
          onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: T.blue,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: T.white, flexShrink: 0,
          }}>
            {email?.charAt(0).toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session?.user?.name || email.split("@")[0]}
              </div>
              <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 600 }}>Cerrar sesión</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Top Bar ───────────────────────────────────────────────
// ── Notification Bell ────────────────────────────────────
function NotificationBell() {
  const [open, setOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]     = useState(0);
  const ref = useRef(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/notifications");
      if (!r.ok) return;
      const d = await r.json();
      setNotifications(d.notifications || []);
      setUnread(d.unread || 0);
    } catch {}
  }, []);

  useEffect(() => { fetchNotifs(); const t = setInterval(fetchNotifs, 30000); return () => clearInterval(t); }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ markAllRead: true }) });
    fetchNotifs();
  };

  const TYPE_COLORS = { info:"#6366F1", update:"#22C55E", important:"#F59E0B", critical:"#EF4444" };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: 36, height: 36, borderRadius: 8, background: T.white, border: `1.5px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, position: "relative",
        transition: "all 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = T.blueL; e.currentTarget.style.borderColor = "#93C5FD"; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.borderColor = T.border; }}>
        🔔
        {unread > 0 && (
          <span style={{ position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#EF4444",border:"2px solid white",fontSize:9,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,width:340,background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:200,overflow:"hidden" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ fontWeight:700,fontSize:14,color:"#0F172A" }}>Notificaciones</div>
            {unread > 0 && <button onClick={markAllRead} style={{ fontSize:11,color:"#2563EB",background:"none",border:"none",cursor:"pointer",fontWeight:600 }}>Marcar todo leído</button>}
          </div>
          {notifications.length === 0 && (
            <div style={{ padding:32,textAlign:"center",color:"#94A3B8",fontSize:13 }}>
              <div style={{ fontSize:32,marginBottom:8 }}>🔔</div>
              Sin notificaciones
            </div>
          )}
          <div style={{ maxHeight:320,overflowY:"auto" }}>
            {notifications.map(n => (
              <div key={n.id} style={{ padding:"12px 16px",borderBottom:"1px solid #F8FAFF",background:n.is_read?"transparent":"#F8FAFF" }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:TYPE_COLORS[n.type]||"#6366F1",marginTop:4,flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:600,fontSize:13,color:"#0F172A",marginBottom:2 }}>{n.title}</div>
                    <div style={{ fontSize:12,color:"#64748B",lineHeight:1.4 }}>{n.message}</div>
                    <div style={{ fontSize:11,color:"#94A3B8",marginTop:4 }}>{new Date(n.created_at).toLocaleDateString("es")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({ sidebarWidth, collapsed, setCollapsed }) {
  const { data: session } = useSession();
  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || "Usuario";
  const email = session?.user?.email || "";

  return (
    <header style={{
      position: "fixed", top: 0, left: sidebarWidth, right: 0, height: 60, zIndex: 40,
      background: T.white, borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", padding: "0 20px 0 16px", gap: 12,
      transition: "left 0.22s ease",
    }}>
      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(c => !c)} style={{
        width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${T.border}`,
        background: T.white, cursor: "pointer", fontSize: 14, color: T.muted,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        transition: "all 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = T.blueL; e.currentTarget.style.borderColor = "#93C5FD"; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.borderColor = T.border; }}
        title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}>
        {collapsed ? "☰" : "☰"}
      </button>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8", pointerEvents: "none" }}>🔍</span>
        <input
          placeholder="Buscar bots, contactos, actividad..."
          style={{
            width: "100%", padding: "8px 12px 8px 34px",
            background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 8,
            fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onFocus={e => { e.target.style.borderColor = "#93C5FD"; e.target.style.background = T.white; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.background = T.surface; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {/* Notification bell - functional */}
        <NotificationBell />

        {/* User info */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "4px 12px 4px 8px", borderRadius: 9,
          border: `1.5px solid ${T.border}`, background: T.white,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: T.blue,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: T.white, flexShrink: 0,
          }}>
            {email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: 11, color: T.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Chat Widget ───────────────────────────────────────────
function ChatWidget() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([{ role: "bot", text: "¡Hola! Soy tu agente virtual. Escríbeme algo para ver cómo respondo. 👋" }]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef   = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const msg = text.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      setMessages(m => [...m, { role: "bot", text: data.reply || "Sin respuesta." }]);
    } catch {
      setMessages(m => [...m, { role: "bot", text: "❌ Error al conectar." }]);
    }
    setLoading(false);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Tu navegador no soporta voz. Usa Chrome."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.lang = "es-MX"; r.interimResults = false; r.maxAlternatives = 1;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => send(e.results[0][0].transcript);
    recognitionRef.current = r;
    r.start();
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 28, right: 28, width: 52, height: 52,
        borderRadius: "50%", background: T.blue, border: "none", cursor: "pointer",
        zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, color: T.white, boxShadow: "0 6px 24px rgba(37,99,235,0.4)",
        transition: "all 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Probar agente">
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 28, width: 360, height: 500,
          background: T.white, borderRadius: 20, zIndex: 299,
          boxShadow: "0 24px 60px rgba(0,0,0,0.16)", border: `1.5px solid ${T.border}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "chatIn 0.18s ease",
        }}>
          <div style={{ background: T.blue, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Chat de Prueba</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Respuestas reales con IA</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "9px 13px",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? T.blue : T.surface,
                  color: m.role === "user" ? T.white : T.text,
                  fontSize: 13, lineHeight: 1.5,
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex" }}>
                <div style={{ padding: "10px 14px", background: T.surface, borderRadius: "14px 14px 14px 4px", fontSize: 18 }}>
                  <span style={{ animation: "pulse 1s infinite" }}>●</span>
                  <span style={{ animation: "pulse 1s infinite 0.2s" }}>●</span>
                  <span style={{ animation: "pulse 1s infinite 0.4s" }}>●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Escribe un mensaje..."
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`,
                fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text, background: T.surface,
              }}
              onFocus={e => { e.target.style.borderColor = "#93C5FD"; e.target.style.background = T.white; }}
              onBlur={e => { e.target.style.borderColor = T.border; e.target.style.background = T.surface; }}
            />
            <button onClick={startVoice} style={{
              width: 36, height: 36, borderRadius: 9, border: `1.5px solid ${T.border}`,
              background: listening ? "#FEF2F2" : T.white, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }} title="Entrada de voz">
              {listening ? "\u23F9" : "\uD83C\uDFA4"}
            </button>
            <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{
              width: 36, height: 36, borderRadius: 9, background: T.blue, border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0,
            }}>
              <span style={{ color: T.white, fontSize: 14 }}>{"\u27A4"}</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatIn { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:none } }
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
      `}</style>
    </>
  );
}

// ── Dashboard Layout ──────────────────────────────────────
export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <BotProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFF", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <DynamicHead />
        <Sidebar collapsed={collapsed} />
        <div style={{ flex: 1, marginLeft: sidebarWidth, transition: "margin-left 0.22s ease" }}>
          <TopBar sidebarWidth={sidebarWidth} collapsed={collapsed} setCollapsed={setCollapsed} />
          <main style={{ marginTop: 60, minHeight: "calc(100vh - 60px)" }}>
            {children}
          </main>
        </div>
        <ChatWidget />
      </div>
    </BotProvider>
  );
}
