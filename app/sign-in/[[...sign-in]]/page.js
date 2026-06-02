import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 60%, #DBEAFE 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💬</div>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
          Bot<span style={{ color: "#2563EB" }}>flow</span>
        </span>
      </div>

      <SignIn
        appearance={{
          elements: {
            card: { boxShadow: "0 20px 60px rgba(37,99,235,0.1)", borderRadius: "16px", border: "1.5px solid #E2E8F0" },
            headerTitle: { color: "#0F172A", fontWeight: 700 },
            headerSubtitle: { color: "#64748B" },
            formButtonPrimary: { background: "#2563EB", borderRadius: "10px", fontWeight: 600, fontSize: "14px" },
            footerActionLink: { color: "#2563EB" },
          },
          variables: {
            colorPrimary: "#2563EB",
            borderRadius: "10px",
          },
        }}
      />
    </div>
  );
}
