"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const SUPER_ADMIN_EMAIL = "yoshualeisorek17@gmail.com";

const NAV = [
  { label: "Dashboard",      href: "/dashboard/super-admin",                icon: "📊" },
  { label: "Usuarios",       href: "/dashboard/super-admin/users",           icon: "👥" },
  { label: "Bots",           href: "/dashboard/super-admin/bots",            icon: "🤖" },
  { label: "Planes",         href: "/dashboard/super-admin/plans",           icon: "💎" },
  { label: "Anuncios",       href: "/dashboard/super-admin/announcements",   icon: "📢" },
  { label: "Facturación",    href: "/dashboard/super-admin/billing",         icon: "💳" },
  { label: "Landing CMS",    href: "/dashboard/super-admin/landing-cms",     icon: "🌐" },
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
    if (!session || session.user.email !== SUPER_ADMIN_EMAIL) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQ.length < 2) { setSearchResults([]); return; }
      const r = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQ)}`);
      const d = await r.json();
      setSearchResults(d.results || []);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  if (status === "loading" || !session || session.user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0A0A0F",color:"#fff" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48,marginBottom:16 }}>🔐</div>
          <div style={{ fontSize:18,opacity:.7 }}>Verificando acceso...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex",height:"100vh",background:"#0A0A0F",color:"#E2E8F0",fontFamily:"Inter,-apple-system,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width:240,background:"#111118",borderRight:"1px solid #1E1E2E",display:"flex",flexDirection:"column",flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"20px 20px 16px",borderBottom:"1px solid #1E1E2E" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:32,height:32,background:"linear-gradient(135deg,#7C3AED,#2563EB)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚡</div>
            <div>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff" }}>Super Admin</div>
              <div style={{ fontSize:11,color:"#6366F1",fontWeight:600 }}>AgentFlow Control</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:"12px 8px",overflowY:"auto" }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard/super-admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{
                display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,marginBottom:2,
                textDecoration:"none",fontSize:13,fontWeight:active?600:400,
                background: active ? "rgba(99,102,241,.15)" : "transparent",
                color: active ? "#818CF8" : "#94A3B8",
                borderLeft: active ? "2px solid #6366F1" : "2px solid transparent",
                transition:"all .15s",
              }}>
                <span style={{ fontSize:16 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to app */}
        <div style={{ padding:"12px 8px",borderTop:"1px solid #1E1E2E" }}>
          <Link href="/dashboard" style={{
            display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
            textDecoration:"none",fontSize:12,color:"#475569",
          }}>
            <span>←</span> Volver al Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        {/* Topbar */}
        <header style={{ height:56,background:"#111118",borderBottom:"1px solid #1E1E2E",display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0 }}>
          {/* Global search */}
          <div style={{ flex:1,maxWidth:420,position:"relative" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#475569",fontSize:14 }}>🔍</span>
              <input
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(()=>setShowSearch(false), 200)}
                placeholder="Buscar usuarios, bots, planes..."
                style={{ width:"100%",background:"#0A0A0F",border:"1px solid #1E1E2E",borderRadius:8,padding:"8px 12px 8px 36px",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box" }}
              />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#1A1A2E",border:"1px solid #2D2D44",borderRadius:8,zIndex:100,overflow:"hidden" }}>
                {searchResults.map(r => (
                  <Link key={r.id} href={r.href} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",textDecoration:"none",color:"#E2E8F0",borderBottom:"1px solid #2D2D44" }}>
                    <span style={{ fontSize:14 }}>{r.type==="user"?"👤":"🤖"}</span>
                    <div>
                      <div style={{ fontSize:13,fontWeight:500 }}>{r.label}</div>
                      <div style={{ fontSize:11,color:"#475569" }}>{r.sublabel}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ background:"#7C3AED",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:.5 }}>SUPER ADMIN</div>
            <div style={{ width:32,height:32,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff" }}>
              {session.user.email[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1,overflow:"auto",padding:24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}