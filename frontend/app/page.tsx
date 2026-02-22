"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HotelInputForm from "@/components/HotelInputForm";
import AgentPipeline from "@/components/AgentPipeline";
import ResultsPanel from "@/components/ResultsPanel";
import ChatPanel from "@/components/ChatPanel";
import HistoryPanel from "@/components/HistoryPanel";
import AuthGate from "@/components/AuthGate";
import { useOptimize } from "@/hooks/useOptimize";
import { NodeName, LLMProvider } from "@/lib/types";
import { isAuthenticated, clearTokens } from "@/lib/auth";

type MobilePanel = "input" | "pipeline" | "results" | "chat" | "history";

export default function Home() {
  const { state, run, reset, setTab, setProvider } = useOptimize();
  const [activeProvider, setActiveProvider] = useState<LLMProvider>("gemini");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("input");
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setAuthChecked(true);
  }, []);

  const handleProviderChange = (provider: LLMProvider) => {
    setActiveProvider(provider);
    setProvider(provider);
  };

  const isActive = state.phase === "streaming";
  const isComplete = state.phase === "complete";
  const totalTime = isComplete && state.result
    ? Object.values(state.result.execution_times).reduce((a, b) => a + b, 0)
    : null;

  const handleRun = (req: Parameters<typeof run>[0]) => {
    run(req);
    setMobilePanel("results");
  };

  const handleLogout = () => {
    clearTokens();
    setAuthed(false);
    reset();
  };

  if (!authChecked) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative", zIndex: 1 }}>

      {/* Auth gate overlay */}
      <AnimatePresence>
        {!authed && (
          <AuthGate onAuthenticated={() => setAuthed(true)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 20px",
          height: "var(--header-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "26px", height: "26px",
            background: "var(--gold)",
            borderRadius: "5px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 12V7m0 0V2m0 5h10M12 2v5m0 5v-5" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="font-display" style={{ fontSize: "14px", color: "var(--text-primary)", letterSpacing: "0.01em" }}>
              Revenue Intelligence
            </span>
            <span className="font-data" style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: "10px" }}>
              v1.0
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProvider}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "3px 10px", borderRadius: "20px", fontSize: "10px", letterSpacing: "0.06em",
                border: `1px solid ${activeProvider === "gemini" ? "var(--gemini-border)" : "rgba(201,168,76,0.2)"}`,
                color: activeProvider === "gemini" ? "var(--gemini)" : "var(--gold)",
                background: activeProvider === "gemini" ? "var(--gemini-dim)" : "var(--gold-muted)",
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: activeProvider === "gemini" ? "var(--gemini)" : "var(--gold)", flexShrink: 0 }} />
              <span className="font-data">{activeProvider === "gemini" ? "Gemini" : "Claude"}</span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {totalTime !== null && (
              <motion.div
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "3px 10px", borderRadius: "20px", fontSize: "10px",
                  border: "1px solid var(--status-done-border)",
                  color: "var(--gold)", background: "var(--status-done-bg)",
                }}
              >
                <span className="font-data">{totalTime.toFixed(1)}s total</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ width: "5px", height: "5px", borderRadius: "50%", background: authed ? "#4ade80" : "#f59e0b" }}
            />
            <span className="font-data" style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {authed ? "Live" : "Auth"}
            </span>
          </div>

          {authed && (
            <button
              onClick={handleLogout}
              className="header-logout-btn"
              style={{
                background: "transparent", border: "1px solid var(--border)",
                borderRadius: "5px", padding: "3px 8px", fontSize: "10px",
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </motion.header>

      {/* Desktop view tabs */}
      {authed && (
        <div className="desktop-tab-bar">
          {([
            { id: "optimize", label: "Optimize" },
            { id: "chat", label: "AI Advisor" },
            { id: "history", label: "History" },
          ] as { id: string; label: string }[]).map(tab => {
            const isActive2 = (tab.id === "optimize" && !["chat", "history"].includes(mobilePanel)) || mobilePanel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "optimize") setMobilePanel("input");
                  else setMobilePanel(tab.id as MobilePanel);
                }}
                style={{
                  padding: "10px 20px", background: "transparent", border: "none",
                  borderBottom: `2px solid ${isActive2 ? "var(--gold)" : "transparent"}`,
                  color: isActive2 ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "12px", cursor: "pointer", letterSpacing: "0.02em", transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main content areas */}
      <AnimatePresence mode="wait">
        {mobilePanel === "chat" ? (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ height: "calc(100vh - var(--header-h) - var(--mobile-nav-h, 56px))", display: "flex", flexDirection: "column" }}
          >
            <ChatPanel />
          </motion.div>
        ) : mobilePanel === "history" ? (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ height: "calc(100vh - var(--header-h) - var(--mobile-nav-h, 56px))", overflow: "hidden" }}
          >
            <HistoryPanel />
          </motion.div>
        ) : (
          <motion.div key="optimize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "contents" }}>
            <div className="app-layout">

              <motion.aside
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`panel-input ${mobilePanel === "input" ? "panel-active" : ""}`}
                style={{ borderRight: "1px solid var(--border-subtle)", overflowY: "auto", display: "flex", flexDirection: "column" }}
              >
                <HotelInputForm onSubmit={handleRun} isLoading={isActive} onReset={reset} onProviderChange={handleProviderChange} />
              </motion.aside>

              <motion.aside
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`panel-pipeline ${mobilePanel === "pipeline" ? "panel-active" : ""}`}
                style={{ borderRight: "1px solid var(--border-subtle)", overflowY: "auto", display: "flex", flexDirection: "column" }}
              >
                <AgentPipeline
                  nodes={state.nodes} activeTab={state.activeTab}
                  onNodeClick={(id) => setTab(id as NodeName)}
                  result={state.result} phase={state.phase}
                />
              </motion.aside>

              <motion.main
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`panel-results ${mobilePanel === "results" ? "panel-active" : ""}`}
                style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}
              >
                <ResultsPanel
                  nodes={state.nodes} activeTab={state.activeTab}
                  result={state.result} onTabClick={setTab}
                  phase={state.phase} error={state.error}
                />
              </motion.main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav">
        {([
          { id: "input" as MobilePanel, label: "Configure",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="2.5"/><path d="M5 6h8M5 9h8M5 12h5"/></svg> },
          { id: "pipeline" as MobilePanel, label: "Pipeline",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="9" cy="4" r="2"/><circle cx="9" cy="14" r="2"/><path d="M9 6v6"/><circle cx="4" cy="9" r="1.5"/><path d="M5.5 9H7"/><circle cx="14" cy="9" r="1.5"/><path d="M11 9h1.5"/></svg> },
          { id: "results" as MobilePanel, label: "Results",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l4-5 3 3 3-4 3 2"/><path d="M3 3v12h12"/></svg> },
          { id: "chat" as MobilePanel, label: "Chat",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M15 3H3a1 1 0 00-1 1v8a1 1 0 001 1h4l2 2 2-2h4a1 1 0 001-1V4a1 1 0 00-1-1z"/></svg> },
          { id: "history" as MobilePanel, label: "History",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l3 2"/></svg> },
        ] as const).map((tab) => (
          <button key={tab.id} className={`mobile-nav-btn ${mobilePanel === tab.id ? "active" : ""}`} onClick={() => setMobilePanel(tab.id)}>
            {tab.icon}
            {tab.label}
            {tab.id === "results" && isActive && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                style={{ position: "absolute", top: "8px", right: "calc(50% - 14px)", width: "5px", height: "5px", borderRadius: "50%", background: "var(--status-active-dot)" }}
              />
            )}
          </button>
        ))}
      </nav>

      <style>{`
        .desktop-tab-bar {
          display: none;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-base);
          position: sticky;
          top: var(--header-h);
          z-index: 90;
        }
        @media (min-width: 768px) {
          .desktop-tab-bar { display: flex; }
          .header-logout-btn { display: block; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
