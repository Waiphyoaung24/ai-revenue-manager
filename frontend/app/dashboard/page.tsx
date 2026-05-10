"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HotelInputForm from "@/components/HotelInputForm";
import AgentPipeline from "@/components/AgentPipeline";
import ResultsPanel from "@/components/ResultsPanel";
import HistoryPanel from "@/components/HistoryPanel";
import AuthGate from "@/components/AuthGate";
import { useOptimize } from "@/hooks/useOptimize";
import { NodeName, LLMProvider } from "@/lib/types";
import { isAuthenticated, clearTokens } from "@/lib/auth";

type MobilePanel = "input" | "pipeline" | "results" | "history";

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
    <div className="dash-shell">
      <AnimatePresence>
        {!authed && <AuthGate onAuthenticated={() => setAuthed(true)} />}
      </AnimatePresence>

      <motion.header
        className="dash-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="dash-brand">
          <span className="dash-brand-mark">
            NEX<span className="dash-brand-mark-sep">·</span>APEX
          </span>
          <span aria-hidden="true" className="dash-brand-divider" />
          <div className="dash-brand-meta">
            <span className="font-display dash-brand-title">Revenue Intelligence</span>
            <span className="font-data dash-brand-version">v1.0</span>
          </div>
        </div>

        <div className="dash-header-right">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProvider}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`dash-chip ${activeProvider === "gemini" ? "dash-chip--gemini" : "dash-chip--claude"}`}
            >
              <span className="dash-chip-dot" />
              <span className="font-data">{activeProvider === "gemini" ? "Gemini" : "Claude"}</span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {totalTime !== null && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="dash-chip dash-chip--time"
              >
                <span className="font-data">{totalTime.toFixed(1)}s total</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="dash-status">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className={`dash-status-dot ${authed ? "dash-status-dot--live" : "dash-status-dot--auth"}`}
            />
            <span className="font-data dash-status-label">{authed ? "Live" : "Auth"}</span>
          </div>

          {authed && (
            <button onClick={handleLogout} className="dash-logout-btn">
              Sign out
            </button>
          )}
        </div>
      </motion.header>

      {authed && (
        <div className="desktop-tab-bar">
          {([
            { id: "optimize", label: "Optimize" },
            { id: "history", label: "History" },
          ] as { id: string; label: string }[]).map(tab => {
            const isActive2 = (tab.id === "optimize" && mobilePanel !== "history") || mobilePanel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "optimize") setMobilePanel("input");
                  else setMobilePanel(tab.id as MobilePanel);
                }}
                className={`dash-tab ${isActive2 ? "dash-tab--active" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {mobilePanel === "history" ? (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="dash-history-pane"
          >
            <HistoryPanel />
          </motion.div>
        ) : (
          <motion.div
            key="optimize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "contents" }}
          >
            <div className="app-layout">
              <motion.aside
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`panel-input dash-panel dash-panel--bordered ${mobilePanel === "input" ? "panel-active" : ""}`}
              >
                <HotelInputForm onSubmit={handleRun} isLoading={isActive} onReset={reset} onProviderChange={handleProviderChange} />
              </motion.aside>

              <motion.aside
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`panel-pipeline dash-panel dash-panel--bordered ${mobilePanel === "pipeline" ? "panel-active" : ""}`}
              >
                <AgentPipeline
                  nodes={state.nodes}
                  activeTab={state.activeTab}
                  onNodeClick={(id) => setTab(id as NodeName)}
                  result={state.result}
                  phase={state.phase}
                />
              </motion.aside>

              <motion.main
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`panel-results dash-panel ${mobilePanel === "results" ? "panel-active" : ""}`}
              >
                <ResultsPanel
                  nodes={state.nodes}
                  activeTab={state.activeTab}
                  result={state.result}
                  onTabClick={setTab}
                  phase={state.phase}
                  error={state.error}
                />
              </motion.main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="mobile-nav">
        {([
          { id: "input" as MobilePanel, label: "Configure",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="2.5"/><path d="M5 6h8M5 9h8M5 12h5"/></svg> },
          { id: "pipeline" as MobilePanel, label: "Pipeline",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="9" cy="4" r="2"/><circle cx="9" cy="14" r="2"/><path d="M9 6v6"/><circle cx="4" cy="9" r="1.5"/><path d="M5.5 9H7"/><circle cx="14" cy="9" r="1.5"/><path d="M11 9h1.5"/></svg> },
          { id: "results" as MobilePanel, label: "Results",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l4-5 3 3 3-4 3 2"/><path d="M3 3v12h12"/></svg> },
          { id: "history" as MobilePanel, label: "History",
            icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l3 2"/></svg> },
        ] as const).map((tab) => (
          <button key={tab.id} className={`mobile-nav-btn ${mobilePanel === tab.id ? "active" : ""}`} onClick={() => setMobilePanel(tab.id)}>
            {tab.icon}
            {tab.label}
            {tab.id === "results" && isActive && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="dash-results-pulse"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
