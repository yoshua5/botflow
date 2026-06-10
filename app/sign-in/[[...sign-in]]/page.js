"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

function AgentLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="#0F172A"/>
      <path d="M18 6L26 26H10L18 6Z" fill="url(#lg2)" opacity="0.95"/>
      <ellipse cx="15" cy="23" rx="5" ry="4" fill="none" stroke="#22D3EE" strokeWidth="1.8"/>
      <circle cx="13.5" cy="23" r="0.8" fill="#22D3EE"/>
      <circle cx="15.5" cy="23" r="0.8" fill="#22D3EE"/>
      <line x1="22" y1="18" x2="27" y2="18" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="22" y1="21" x2="26" y2="21" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="22" y1="24" x2="25" y2="24" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="lg2" x1="18" y1="6" x2="18" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF"/>
          <stop offset="1" stopColor="#93C5FD"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Email o contraseña incorrectos. Intenta de nuevo.");
    } else if (result?.ok) {
      router.push("/dashboard");
    }
  };

  const inputBase = {
    width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0",
    borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none",
    fontFamily: "inherit", background: "#FAFBFF", boxSizing: "border-box",
    transition: "all 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F1F5F9",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 20, padding: "40px 40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.08)",
        border: "1px solid #E2E8F0",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <AgentLogo size={38} />
          <span style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>
            Agent<span style={{ color: "#2563EB" }}>Flow</span>
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Bienvenido de nuevo
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Ingresa a tu cuenta de AgentFlow
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
              Correo electrónico
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required style={inputBase}
              onFocus={e => { e.target.style.borderColor = "#93C5FD"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; e.target.style.background = "#FFFFFF"; }}
              onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#FAFBFF"; }}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "s