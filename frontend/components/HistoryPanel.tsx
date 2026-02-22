"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchHistory, OptimizationHistoryItem } from "@/lib/chatApi";

type HistoryTab = "market_analysis" | "demand_forecast" | "pricing_strategy" | "revenue_plan";

const TABS: { id: HistoryTab; label: string }[] = [
  { id: "market_analysis", label: "Market" },
  { id: "demand_forecast", label: "Demand" },
  { id: "pricing_strategy", label: "Pricing" },
  { id: "revenue_plan", label: "Plan" },
];

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="font-display" style={{ fontSize: "14px", color: "var(--gold)", margin: "12px 0 4px" }}>
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="font-display" style={{ fontSize: "16px", color: "var(--text-primary)", margin: "4px 0" }}>
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("* ") || line.startsWith("- ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--gold)", flexShrink: 0 }}>·</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} style={{ height: "4px" }} />;
        return (
          <p key={i} style={{ fontSize: "12px", lineHeight: "1.6", color: "var(--text-primary)", margin: 0 }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HistoryPanel() {
  const [items, setItems] = useState<OptimizationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OptimizationHistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<HistoryTab>("revenue_plan");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 10;

  const loadPage = useCallback(async (offset: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHistory(PAGE_SIZE, offset);
      if (offset === 0) {
        setItems(res.items);
      } else {
        setItems(prev => [...prev, ...res.items]);
      }
      setHasMore(res.items.length === PAGE_SIZE);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPage(next * PAGE_SIZE);
  };

  const queryTypeColor = (qt: string) => {
    switch (qt) {
      case "valid": return "var(--gold)";
      case "irrelevant": return "#ef4444";
      case "insufficient": return "#f59e0b";
      default: return "var(--text-muted)";
    }
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>

      {/* ── Left: record list ── */}
      <div style={{
        width: selected ? "220px" : "100%",
        flexShrink: 0,
        borderRight: selected ? "1px solid var(--border-subtle)" : "none",
        overflowY: "auto",
        transition: "width 0.3s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="font-data" style={{ fontSize: "9px", color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "3px" }}>
            Analysis History
          </p>
          <h2 className="font-display" style={{ fontSize: "16px", color: "var(--text-primary)", margin: 0 }}>
            Past Optimizations
          </h2>
        </div>

        {/* List */}
        <div style={{ padding: "8px 0" }}>
          {loading && items.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
              <span style={{ width: "16px", height: "16px", border: "2px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : error ? (
            <p style={{ padding: "20px 16px", fontSize: "12px", color: "#ef4444" }}>{error}</p>
          ) : items.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                No optimizations yet. Run an analysis to see results here.
              </p>
            </div>
          ) : (
            <>
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { setSelected(item); setActiveTab("revenue_plan"); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    background: selected?.id === item.id ? "var(--bg-card)" : "transparent",
                    border: "none",
                    borderLeft: selected?.id === item.id ? "2px solid var(--gold)" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.hotel_name || "Unnamed"}
                    </span>
                    <span style={{
                      fontSize: "9px",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      background: "var(--bg-base)",
                      color: queryTypeColor(item.query_type),
                      border: `1px solid ${queryTypeColor(item.query_type)}40`,
                      flexShrink: 0,
                    }}>
                      {item.query_type}
                    </span>
                  </div>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "0 0 2px" }}>
                    {item.hotel_location || "—"}
                  </p>
                  <p className="font-data" style={{ fontSize: "9px", color: "var(--text-muted)", margin: 0 }}>
                    {formatDate(item.created_at)}
                  </p>
                </motion.button>
              ))}

              {hasMore && (
                <div style={{ padding: "12px 16px" }}>
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Right: detail view ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 }}
          >
            {/* Detail header */}
            <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <button
                  onClick={() => setSelected(null)}
                  title="Back"
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "5px", padding: "4px 7px", fontSize: "10px", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0, marginTop: "2px" }}
                >
                  ←
                </button>
                <div>
                  <h3 className="font-display" style={{ fontSize: "15px", color: "var(--text-primary)", margin: "0 0 2px" }}>
                    {selected.hotel_name}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    {selected.hotel_location} · {selected.provider} · {formatDate(selected.created_at)}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "4px", marginTop: "14px", flexWrap: "wrap" }}>
                {TABS.filter(t => selected[t.id]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer",
                      background: activeTab === t.id ? "var(--gold)" : "var(--bg-card)",
                      color: activeTab === t.id ? "#0a0a0a" : "var(--text-secondary)",
                      border: `1px solid ${activeTab === t.id ? "var(--gold)" : "var(--border)"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}

                {/* Execution times */}
                {Object.keys(selected.execution_times).length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                    {Object.entries(selected.execution_times).map(([node, t]) => (
                      <span key={node} className="font-data" style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                        {node.split("_")[0]}:{typeof t === "number" ? t.toFixed(1) : t}s
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {selected[activeTab] ? (
                    <MarkdownContent content={selected[activeTab] as string} />
                  ) : (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No data for this section.</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
