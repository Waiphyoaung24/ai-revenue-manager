"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginAndCreateSession, register, createSession } from "@/lib/auth";

interface Props {
  onAuthenticated: () => void;
}

type AuthMode = "login" | "register";

// NEX APEX brand tokens
const BRAND = {
  bg: "#0e1418",
  surface: "#162029",
  surface2: "#1d2d39",
  cyan: "#94fcff",
  mauve: "#b9afbb",
  white: "#f0f1ef",
  text: "#c8ccc6",
  dim: "#6e7a84",
  border: "rgba(148,252,255,0.10)",
  borderFocus: "rgba(148,252,255,0.45)",
  red: "#c63518",
};

export default function AuthGate({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: BRAND.bg,
    border: `1px solid ${BRAND.border}`,
    borderRadius: "4px",
    color: BRAND.white,
    fontSize: "14px",
    fontFamily: "var(--font-body), 'Rajdhani', sans-serif",
    outline: "none",
    transition: "border-color 200ms cubic-bezier(.22,.61,.36,1), box-shadow 200ms",
    letterSpacing: "0.01em",
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
        background: "rgba(14,20,24,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      {/* Cyan halo behind card */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(148,252,255,0.10) 0%, rgba(148,252,255,0) 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          position: "relative",
          background: BRAND.surface,
          border: `1px solid ${BRAND.border}`,
          borderRadius: "12px",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 0 60px rgba(148,252,255,0.08), 0 30px 80px -30px rgba(0,0,0,0.7)",
        }}
      >
        {/* Logo — NEX APEX */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: `1px solid ${BRAND.borderFocus}`,
              background: "rgba(148,252,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: "drop-shadow(0 0 12px rgba(148,252,255,0.2))",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M14 3 L25 24 L3 24 Z" stroke={BRAND.cyan} strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M14 10 L20 22 L8 22 Z" fill={BRAND.cyan} fillOpacity="0.85" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span
              style={{
                fontFamily: "var(--font-display), 'Orbitron', sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: BRAND.white,
                textTransform: "uppercase",
              }}
            >
              NEX<span style={{ color: BRAND.cyan }}>·</span>APEX
            </span>
            <span
              style={{
                fontFamily: "var(--font-body), 'Rajdhani', sans-serif",
                fontSize: "11px",
                color: BRAND.dim,
                letterSpacing: "0.06em",
              }}
            >
              Revenue Intelligence
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            background: BRAND.bg,
            borderRadius: "6px",
            padding: "3px",
            marginBottom: "24px",
            border: `1px solid ${BRAND.border}`,
          }}
        >
          {(["login", "register"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "var(--font-display), 'Orbitron', sans-serif",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 200ms cubic-bezier(.22,.61,.36,1)",
                background: mode === m ? BRAND.surface2 : "transparent",
                color: mode === m ? BRAND.cyan : BRAND.dim,
                border: mode === m ? `1px solid ${BRAND.border}` : "1px solid transparent",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              htmlFor="auth-email"
              style={{
                display: "block",
                fontFamily: "var(--font-display), 'Orbitron', sans-serif",
                fontSize: "10px",
                color: BRAND.cyan,
                marginBottom: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@hotel.com"
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = BRAND.borderFocus;
                e.target.style.boxShadow = `0 0 0 3px rgba(148,252,255,0.08)`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = BRAND.border;
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              style={{
                display: "block",
                fontFamily: "var(--font-display), 'Orbitron', sans-serif",
                fontSize: "10px",
                color: BRAND.cyan,
                marginBottom: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = BRAND.borderFocus;
                e.target.style.boxShadow = `0 0 0 3px rgba(148,252,255,0.08)`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = BRAND.border;
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: "12px",
                  color: BRAND.red,
                  margin: 0,
                  fontFamily: "var(--font-body), 'Rajdhani', sans-serif",
                  background: "rgba(198,53,24,0.08)",
                  border: "1px solid rgba(198,53,24,0.25)",
                  padding: "8px 12px",
                  borderRadius: "4px",
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
            style={{
              padding: "13px",
              background: loading ? "rgba(148,252,255,0.4)" : BRAND.cyan,
              color: BRAND.bg,
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-display), 'Orbitron', sans-serif",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginTop: "8px",
              boxShadow: loading ? "none" : "0 0 28px rgba(148,252,255,0.3)",
              transition: "box-shadow 200ms ease-out",
            }}
          >
            {loading && (
              <span
                style={{
                  width: "13px",
                  height: "13px",
                  border: "2px solid currentColor",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            )}
            {loading ? "Authenticating" : mode === "login" ? "Sign In" : "Create Account"}
          </motion.button>
        </form>

        <p
          style={{
            marginTop: "24px",
            fontFamily: "var(--font-display), 'Orbitron', sans-serif",
            fontSize: "9px",
            color: BRAND.dim,
            textAlign: "center",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Secure Session · JWT Authenticated
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
