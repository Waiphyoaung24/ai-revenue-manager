"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginAndCreateSession, register, createSession, setUserToken } from "@/lib/auth";

interface Props {
  onAuthenticated: () => void;
}

type AuthMode = "login" | "register";

export default function AuthGate({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontFamily: "DM Sans, sans-serif",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await loginAndCreateSession(email, password);
      } else {
        const reg = await register(email, password);
        // After register, create a session using the returned user token
        await createSession(reg.token.access_token);
      }
      onAuthenticated();
    } catch (err: unknown) {
      setError((err as Error).message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "36px 32px",
          width: "100%",
          maxWidth: "380px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "var(--gold)",
            borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 12V7m0 0V2m0 5h10M12 2v5m0 5v-5" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: "15px", color: "var(--text-primary)" }}>
            Revenue Intelligence
          </span>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "flex",
          background: "var(--bg-base)",
          borderRadius: "8px",
          padding: "3px",
          marginBottom: "24px",
          border: "1px solid var(--border)",
        }}>
          {(["login", "register"] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              style={{
                flex: 1,
                padding: "7px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                background: mode === m ? "var(--bg-card)" : "transparent",
                color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                border: mode === m ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", letterSpacing: "0.04em" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@hotel.com"
              required
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--gold-dim)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", letterSpacing: "0.04em" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--gold-dim)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              padding: "11px",
              background: loading ? "var(--gold-dim)" : "var(--gold)",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "7px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
            }}
          >
            {loading && (
              <span style={{
                width: "13px", height: "13px",
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }} />
            )}
            {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Create Account"}
          </motion.button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "10px", color: "var(--text-muted)", textAlign: "center" }}>
          Secure session • JWT authenticated
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
