"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const SUPER_ADMIN_EMAIL = "yoshualeisorek17@gmail.com";

const NAV = [
  { label: "Dashboard",   href: "/dashboard/super-admin",               exact: true },
  { label: "Usuarios",    href: "/dashboard/super-admin/users" },
  { label: "Bots",        href: "/dashboard/super-admin/bots" },
  { label: "Planes",      href: "/dashboard/super-admin/plans" },
  { label: "Anuncios",    href: "/dashboard/super-admin/announcements" },
  { label: "Facturación", href: "/dashboard/super-admin/billing" },
  { label: "Landing CMS", href: "/dashboard/super-admin/landing-cms" },
];

const ICONS = {
  "Dashboard":   "⊞",
  "Usuarios":    "👥",
  "Bots":        "🤖",
  "Planes":      "💎",
  "Anuncios":    "📢",
  "Facturación": "💳",
  "Landing CMS": "🌐",
};

function AgentLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="#0F172A"/>
      <path d="M18 6L26 26H10L18 6Z" fill="url(#saLogoGrad)" opacity="0.95"/>
      <ellipse cx="15" cy="23" rx="5" ry="4" fill="none" stroke="#22D3EE" strokeWidth="1.8"/>
      <circle cx="13.5" cy="23" r="0.8" fill="#22D3EE"/>
      <circle cx="15.5" cy="23" r="0.8" fill="#22D3EE"/>
      <line x1="22" y1="18" x2="27" y2="18" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="22" y1="21" x2="26" y2="21" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="22" y1="24" x2="25" y2="24" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="saLogoGrad" x1="18" y1="6" x2="18" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF"/>
          <stop offset="1" stopColor="#93C5FD"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function SuperAdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.email !== SUPER_ADMIN_EMAIL) router.replace("/dashboard");
  }, [session, status, router]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQ.length < 2) { setSearchResults([]); return; }
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQ)}`);
        const d = await r.json();
        setSearchResults(d.results || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  if (status === "loading" || !session || session.user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div style={{ position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#F8FAFF",zIndex:9999 }}>
        <div style={{ textAlign:"center" }}>
          <AgentLogo size={48} />
          <div style={{ fontSize:14,color:"#64748B",marginTop:16,fontWeight:500 }}>Verificando acceso...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed",inset:0,display:"flex",background:"#F8FAFF",color:"#0F172A",fontFamily:"Inter,-apple-system,sans-serif",zIndex:999,overflow:"hidden" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width:220,flexShrink:0,display:"flex",flexDirection:"column",
        background:"#FFFFFF",borderRight:"1px solid #E2E8F0",
      }}>
        {/* Logo */}
        <div style={{ padding:"16px 20px 14px",borderBottom:"1px solid #E2E8F0" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <AgentLogo size={34} />
            <div>
              <div style={{ fontWeight:700,fontSize:13,color:"#0F172A",letterSpacing:-.2 }}>Super Admin</div>
              <div style={{ fontSize:10,color:"#2563EB",fontWeight:700,letterSpacing:.6 }}>AGENTFLOW</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:"10px 8px",overflowY:"auto" }}>
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display:"flex",alignItems:"center",gap:9,padding:"8px 12px",
                borderRadius:8,marginBottom:1,textDecoration:"none",
                fontSize:13,fontWeight:active?600:400,transition:"all .1s",
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#2563EB" : "#64748B",
                borderLeft: `3px solid ${active ? "#2563EB" : "transparent"}`,
              }}
              onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background="#F8FAFF"; e.currentTarget.style.color="#0F172A"; }}}
              onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}}
              >
                <span style={{ fontSize:14 }}>{ICONS[item.label]}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back */}
        <div style={{ padding:"10px 8px",borderTop:"1px solid #E2E8F0" }}>
          <Link href="/dashboard" style={{
            display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
            borderRadius:8,textDecoration:"none",fontSize:12,
            color:"#94A3B8",transition:"color .1s",
          }}
          onMouseEnter={e=>e.currentTarget.style.color="#0F172A"}
          onMouseLeave={e=>e.currentTarget.style.color="#94A3B8"}
          >
            <span>←</span> Volver al Dashboard
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          height:56,flexShrink:0,display:"flex",alignItems:"center",
          padding:"0 20px",gap:14,
          background:"#FFFFFF",borderBottom:"1px solid #E2E8F0",
        }}>
          {/* Search */}
          <div style={{ flex:1,maxWidth:360,position:"relative" }}>
            <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#94A3B8",fontSize:12,pointerEvents:"none" }}>🔍</span>
            <input
              value={searchQ}
              onChange={e=>{ setSearchQ(e.target.value); setShowSearch(true); }}
              onFocus={()=>setShowSearch(true)}
              onBlur={()=>setTimeout(()=>setShowSearch(false),200)}
              placeholder="Buscar usuarios, bots..."
              style={{
                width:"100%",background:"#F1F5F9",
                border:"1px solid #E2E8F0",borderRadius:8,
                padding:"7px 12px 7px 32px",color:"#0F172A",fontSize:13,
                outline:"none",boxSizing:"border-box",transition:"border-color .15s",
              }}
              onFocusCapture={e=>{ e.target.style.borderColor="#2563EB"; e.target.style.background="#fff"; }}
              onBlurCapture={e=>{ e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F1F5F9"; }}
            />
            {showSearch && searchResults.length > 0 && (
              <div style={{
                position:"absolute",top:"calc(100% + 6px)",left:0,right:0,
                background:"#fff",border:"1px solid #E2E8F0",
                borderRadius:10,zIndex:100,overflow:"hidden",
                boxShadow:"0 8px 24px rgba(0,0,0,.08)",
              }}>
                {searchResults.map(r => (
                  <Link key={r.id} href={r.href} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                    textDecoration:"none",color:"#0F172A",
                    borderBottom:"1px solid #F1F5F9",transition:"background .1s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFF"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <span style={{ fontSize:14 }}>{r.type==="user"?"👤":"🤖"}</span>
                    <div>
                      <div style={{ fontSize:13,fontWeight:500 }}>{r.label}</div>
                      <div style={{ fontSize:11,color:"#64748B" }}>{r.sublabel}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:10 }}>
            <div style={{
              background:"#EFF6FF",border:"1px solid #BFDBFE",
              borderRadius:6,padding:"4px 11px",
              fontSize:10,fontWeight:800,color:"#2563EB",letterSpacing:.8,
            }}>SUPER ADMIN</div>
            <div style={{
              width:32,height:32,
              background:"linear-gradient(135deg,#2563EB,#7C3AED)",
              borderRadius:"50%",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:13,fontWeight:700,
              color:"#fff",flexShrink:0,
            }}>
              {session.user.email[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1,overflow:"auto",padding:"24px 28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
