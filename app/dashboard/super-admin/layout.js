"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const SUPER_ADMIN_EMAIL = "yoshualeisorek17@gmail.com";

const NAV = [
  { label: "Dashboard",   href: "/dashboard/super-admin",              icon: "◈", exact: true },
  { label: "Usuarios",    href: "/dashboard/super-admin/users",        icon: "⊕" },
  { label: "Bots",        href: "/dashboard/super-admin/bots",         icon: "◉" },
  { label: "Planes",      href: "/dashboard/super-admin/plans",        icon: "◆" },
  { label: "Anuncios",    href: "/dashboard/super-admin/announcements",icon: "◎" },
  { label: "Facturación", href: "/dashboard/super-admin/billing",      icon: "◐" },
  { label: "Landing CMS", href: "/dashboard/super-admin/landing-cms",  icon: "◑" },
];

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
      <div style={{ position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#0D0D14",zIndex:9999 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:56,height:56,margin:"0 auto 16px",background:"linear-gradient(135deg,#7C3AED,#4F46E5)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>⚡</div>
          <div style={{ fontSize:15,color:"#94A3B8",fontWeight:500 }}>Verificando acceso...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed",inset:0,display:"flex",background:"#0D0D14",color:"#CBD5E1",fontFamily:"Inter,-apple-system,sans-serif",zIndex:999,overflow:"hidden" }}>
      
      {/* Sidebar */}
      <aside style={{
        width:220,flexShrink:0,display:"flex",flexDirection:"column",
        background:"linear-gradient(180deg,#13131F 0%,#0F0F1A 100%)",
        borderRight:"1px solid rgba(99,102,241,.12)",
      }}>
        {/* Logo */}
        <div style={{ padding:"18px 16px 14px",borderBottom:"1px solid rgba(99,102,241,.1)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{
              width:34,height:34,borderRadius:10,
              background:"linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,boxShadow:"0 4px 12px rgba(124,58,237,.4)",
            }}>⚡</div>
            <div>
              <div style={{ fontWeight:700,fontSize:13,color:"#F1F5F9",letterSpacing:-.2 }}>Super Admin</div>
              <div style={{ fontSize:10,color:"#6366F1",fontWeight:600,letterSpacing:.5 }}>AGENTFLOW CONTROL</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:"10px 8px",overflowY:"auto" }}>
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                borderRadius:8,marginBottom:1,textDecoration:"none",
                fontSize:13,fontWeight:active?600:400,transition:"all .12s",
                background: active ? "rgba(99,102,241,.18)" : "transparent",
                color: active ? "#A5B4FC" : "#64748B",
                borderLeft: `3px solid ${active ? "#6366F1" : "transparent"}`,
              }}
              onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background="rgba(99,102,241,.07)"; e.currentTarget.style.color="#94A3B8"; }}}
              onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}}
              >
                <span style={{ fontSize:12,opacity:.9 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back */}
        <div style={{ padding:"10px 8px",borderTop:"1px solid rgba(99,102,241,.1)" }}>
          <Link href="/dashboard" style={{
            display:"flex",alignItems:"center",gap:8,padding:"9px 12px",
            borderRadius:8,textDecoration:"none",fontSize:12,
            color:"#475569",transition:"color .12s",
          }}
          onMouseEnter={e=>e.currentTarget.style.color="#94A3B8"}
          onMouseLeave={e=>e.currentTarget.style.color="#475569"}
          >
            <span style={{ fontSize:14 }}>←</span> Volver al Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
        
        {/* Topbar */}
        <header style={{
          height:54,flexShrink:0,display:"flex",alignItems:"center",
          padding:"0 20px",gap:14,
          background:"rgba(13,13,20,.9)",
          borderBottom:"1px solid rgba(99,102,241,.1)",
          backdropFilter:"blur(8px)",
        }}>
          {/* Search */}
          <div style={{ flex:1,maxWidth:380,position:"relative" }}>
            <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#475569",fontSize:12,pointerEvents:"none" }}>🔍</span>
            <input
              value={searchQ}
              onChange={e=>{ setSearchQ(e.target.value); setShowSearch(true); }}
              onFocus={()=>setShowSearch(true)}
              onBlur={()=>setTimeout(()=>setShowSearch(false),200)}
              placeholder="Buscar usuarios, bots, planes..."
              style={{
                width:"100%",background:"rgba(255,255,255,.04)",
                border:"1px solid rgba(99,102,241,.15)",borderRadius:8,
                padding:"7px 12px 7px 32px",color:"#CBD5E1",fontSize:12,
                outline:"none",boxSizing:"border-box",transition:"border-color .15s",
              }}
              onFocusCapture={e=>e.target.style.borderColor="rgba(99,102,241,.5)"}
              onBlurCapture={e=>e.target.style.borderColor="rgba(99,102,241,.15)"}
            />
            {showSearch && searchResults.length > 0 && (
              <div style={{
                position:"absolute",top:"calc(100% + 6px)",left:0,right:0,
                background:"#1A1A2E",border:"1px solid rgba(99,102,241,.2)",
                borderRadius:10,zIndex:100,overflow:"hidden",
                boxShadow:"0 8px 32px rgba(0,0,0,.5)",
              }}>
                {searchResults.map(r => (
                  <Link key={r.id} href={r.href} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                    textDecoration:"none",color:"#CBD5E1",
                    borderBottom:"1px solid rgba(99,102,241,.08)",transition:"background .1s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,.1)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <span style={{ fontSize:13 }}>{r.type==="user"?"👤":"🤖"}</span>
                    <div>
                      <div style={{ fontSize:12,fontWeight:500 }}>{r.label}</div>
                      <div style={{ fontSize:11,color:"#475569" }}>{r.sublabel}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:10 }}>
            <div style={{
              background:"linear-gradient(135deg,#7C3AED,#4F46E5)",
              borderRadius:6,padding:"3px 10px",
              fontSize:10,fontWeight:800,color:"#fff",letterSpacing:1,
              boxShadow:"0 2px 8px rgba(124,58,237,.35)",
            }}>SUPER ADMIN</div>
            <div style={{
              width:30,height:30,
              background:"linear-gradient(135deg,#6366F1,#8B5CF6)",
              borderRadius:"50%",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:12,fontWeight:700,
              color:"#fff",flexShrink:0,
            }}>
              {session.user.email[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1,overflow:"auto",padding:"20px 24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
