"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HotelInputForm from "@/components/HotelInputForm";
import AgentPipeline from "@/components/AgentPipeline";
import ResultsPanel from "@/components/ResultsPanel";
import { useOptimize } from "@/hooks/useOptimize";
import { NodeName, LLMProvider } from "@/lib/types";

export default function Home() {
  const { state, run, reset, setTab, setProvider } = useOptimize();
  const [activeProvider, setActiveProvider] = useState<LLMProvider>("anthropic");

  const handleProviderChange = (provider: LLMProvider) => {
    setActiveProvider(provider);
    setProvider(provider);
  };

  const isActive = state.phase === "streaming";
  const isComplete = state.phase === "complete";
  const totalTime = isComplete && state.result
    ? Object.values(state.result.execution_times).reduce((a, b) => a + b, 0)
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative", zIndex: 1 }}>

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 32px",
          height: "52px",
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
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
            <span className="font-display" style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.01em" }}>
              Revenue Intelligence
            </span>
            <span className="font-data" style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: "10px" }}>
              v1.0
            </span>
          </div>
        </div>

        {/* Right side indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Provider badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProvider}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "10px",
                letterSpacing: "0.06em",
                border: `1px solid ${activeProvider === "gemini" ? "var(--gemini-border)" : "rgba(201,168,76,0.2)"}`,
                color: activeProvider === "gemini" ? "var(--gemini)" : "var(--gold)",
                background: activeProvider === "gemini" ? "var(--gemini-dim)" : "var(--gold-muted)",
              }}
            >
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: activeProvider === "gemini" ? "var(--gemini)" : "var(--gold)",
                flexShrink: 0,
              }} />
              <span className="font-data">{activeProvider === "gemini" ? "Gemini" : "Claude"}</span>
            </motion.div>
          </AnimatePresence>

          {/* Total time when complete */}
          <AnimatePresence>
            {totalTime !== null && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  border: "1px solid var(--status-done-border)",
                  color: "var(--gold)",
                  background: "var(--status-done-bg)",
                }}
              >
                <span className="font-data">{totalTime.toFixed(1)}s total</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* API status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "#4ade80",
              }}
            />
            <span className="font-data" style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Live
            </span>
          </div>
        </div>
      </motion.header>

      {/* ── Main Layout ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "380px 260px 1fr",
        gridTemplateRows: "1fr",
        height: "calc(100vh - 52px)",
        gap: 0,
      }}>

        {/* ── Panel 1: Input Form ── */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderRight: "1px solid var(--border-subtle)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <HotelInputForm
            onSubmit={run}
            isLoading={isActive}
            onReset={reset}
            onProviderChange={handleProviderChange}
          />
        </motion.aside>

        {/* ── Panel 2: Pipeline ── */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            borderRight: "1px solid var(--border-subtle)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AgentPipeline
            nodes={state.nodes}
            activeTab={state.activeTab}
            onNodeClick={(id) => setTab(id as NodeName)}
            result={state.result}
            phase={state.phase}
          />
        </motion.aside>

        {/* ── Panel 3: Results ── */}
        <motion.main
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
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
    </div>
  );
}
