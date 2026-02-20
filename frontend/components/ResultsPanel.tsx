"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PipelineNode, NodeName, OptimizeResponse, OptimizePhase } from "@/lib/types";
import React from "react";

interface Props {
  nodes: PipelineNode[];
  activeTab: NodeName | null;
  result: OptimizeResponse | null;
  onTabClick: (id: NodeName) => void;
  phase: OptimizePhase;
  error: string | null;
}

/* ─────────────────────────────────────────────
   Proper Markdown Renderer
   Handles: # ## ###, **bold**, *italic*, `code`,
   ~~strike~~, ---, bullet lists, numbered lists,
   > blockquotes, mixed inline formatting
───────────────────────────────────────────── */

function parseInline(text: string): React.ReactNode[] {
  // Parse inline markdown: **bold**, *italic*, `code`, ~~strike~~
  const parts: React.ReactNode[] = [];
  // Pattern matches: **...**, *...*, `...`, ~~...~~
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|~~(.+?)~~)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1].startsWith("**")) {
      parts.push(
        <strong key={match.index} style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {match[2]}
        </strong>
      );
    } else if (match[1].startsWith("*")) {
      parts.push(
        <em key={match.index} style={{ fontStyle: "italic", color: "var(--text-primary)", opacity: 0.9 }}>
          {match[3]}
        </em>
      );
    } else if (match[1].startsWith("`")) {
      parts.push(
        <code key={match.index} className="font-data" style={{
          fontSize: "11px",
          padding: "1px 5px",
          borderRadius: "3px",
          background: "var(--bg-elevated)",
          color: "var(--gold)",
          border: "1px solid var(--border)",
          letterSpacing: "0.02em",
        }}>
          {match[4]}
        </code>
      );
    } else if (match[1].startsWith("~~")) {
      parts.push(
        <span key={match.index} style={{ textDecoration: "line-through", opacity: 0.6 }}>
          {match[5]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <div key={i} style={{
          height: "1px",
          background: "linear-gradient(to right, var(--gold-dim), transparent)",
          margin: "16px 0",
          opacity: 0.4,
        }} />
      );
      i++;
      continue;
    }

    // H1
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-display" style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginTop: elements.length > 0 ? "20px" : 0,
          marginBottom: "8px",
          lineHeight: 1.2,
        }}>
          {parseInline(trimmed.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // H2
    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--gold)",
          marginTop: elements.length > 0 ? "18px" : 0,
          marginBottom: "6px",
          letterSpacing: "0.02em",
          textTransform: "uppercase" as const,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span style={{
            display: "inline-block",
            width: "12px",
            height: "1px",
            background: "var(--gold-dim)",
            flexShrink: 0,
          }} />
          {parseInline(trimmed.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // H3
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginTop: "12px",
          marginBottom: "4px",
          letterSpacing: "0.01em",
        }}>
          {parseInline(trimmed.slice(4))}
        </h4>
      );
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <div key={i} style={{
          borderLeft: "2px solid var(--gold-dim)",
          paddingLeft: "12px",
          margin: "8px 0",
          opacity: 0.85,
        }}>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>
            {parseInline(trimmed.slice(2))}
          </p>
        </div>
      );
      i++;
      continue;
    }

    // Bullet list item
    if (/^[*\-]\s/.test(trimmed)) {
      // Collect consecutive bullet items
      const items: string[] = [];
      while (i < lines.length && /^[*\-]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {items.map((item, j) => (
            <li key={j} style={{
              display: "flex",
              gap: "8px",
              marginBottom: "4px",
              fontSize: "13px",
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}>
              <span style={{
                color: "var(--gold)",
                flexShrink: 0,
                marginTop: "1px",
                fontSize: "10px",
              }}>◆</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(trimmed)) {
      const items: { num: string; text: string }[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const m = lines[i].trim().match(/^(\d+)\.\s(.*)/);
        if (m) items.push({ num: m[1], text: m[2] });
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {items.map((item, j) => (
            <li key={j} style={{
              display: "flex",
              gap: "10px",
              marginBottom: "5px",
              fontSize: "13px",
              color: "var(--text-primary)",
              lineHeight: 1.5,
              alignItems: "flex-start",
            }}>
              <span className="font-data" style={{
                color: "var(--gold-dim)",
                flexShrink: 0,
                minWidth: "16px",
                fontSize: "10px",
                paddingTop: "2px",
              }}>{item.num}.</span>
              <span>{parseInline(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (trimmed === "") {
      elements.push(<div key={i} style={{ height: "6px" }} />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{
        fontSize: "13px",
        color: "var(--text-primary)",
        lineHeight: 1.6,
        marginBottom: "4px",
        opacity: 0.9,
      }}>
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div style={{ lineHeight: 1.6 }}>{elements}</div>;
}

/* ─────────────────────────────────────────────
   Tab button
───────────────────────────────────────────── */

const NODE_LABELS: Record<NodeName, { short: string; icon: string }> = {
  router: { short: "Router", icon: "⊛" },
  market_analyst: { short: "Market", icon: "◈" },
  demand_forecaster: { short: "Demand", icon: "◉" },
  pricing_strategist: { short: "Pricing", icon: "◆" },
  revenue_manager: { short: "Revenue", icon: "✦" },
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */

export default function ResultsPanel({ nodes, activeTab, result, onTabClick, phase, error }: Props) {
  const doneTabs = nodes.filter((n) => n.status === "done" || n.status === "active");
  const activeNode = nodes.find((n) => n.id === activeTab);

  /* ── Idle ── */
  if (phase === "idle") {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        gap: "24px",
      }}>
        {/* Decorative icon */}
        <div style={{
          width: "64px", height: "64px",
          borderRadius: "50%",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--bg-panel)",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        <div style={{ textAlign: "center" }}>
          <p className="font-display" style={{
            fontSize: "20px",
            color: "var(--text-secondary)",
            fontWeight: 400,
            fontStyle: "italic",
            marginBottom: "8px",
          }}>
            Awaiting analysis
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, maxWidth: "280px" }}>
            Configure your hotel parameters on the left and run analysis to see AI-generated revenue insights here.
          </p>
        </div>

        {/* Placeholder agent labels */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px" }}>
          {["Market Analysis", "Demand Forecast", "Pricing Strategy", "Revenue Plan"].map((label) => (
            <span key={label} style={{
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "10px",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-dim)",
              letterSpacing: "0.03em",
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === "error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ padding: "32px" }}
      >
        <div style={{
          padding: "20px",
          borderRadius: "10px",
          background: "var(--status-error-bg)",
          border: "1px solid var(--status-error-border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px" }}>⚠</span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--status-error-text)" }}>
              Analysis Failed
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{error}</p>
        </div>
      </motion.div>
    );
  }

  /* ── Streaming / Complete ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Tab bar ── */}
      {doneTabs.length > 0 && (
        <div style={{
          padding: "16px 24px 0",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          gap: "4px",
          flexWrap: "wrap",
          flexShrink: 0,
        }}>
          {doneTabs.map((node) => {
            const isActive = activeTab === node.id;
            const cfg = NODE_LABELS[node.id as NodeName];
            return (
              <motion.button
                key={node.id}
                onClick={() => onTabClick(node.id as NodeName)}
                whileHover={{ y: -1 }}
                style={{
                  padding: "6px 14px 10px",
                  borderRadius: "6px 6px 0 0",
                  fontSize: "11px",
                  fontWeight: isActive ? 500 : 400,
                  cursor: "pointer",
                  position: "relative",
                  background: isActive ? "var(--bg-base)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  border: `1px solid ${isActive ? "var(--border-subtle)" : "transparent"}`,
                  borderBottomColor: isActive ? "var(--bg-base)" : "transparent",
                  marginBottom: "-1px",
                  transition: "color 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span style={{
                  fontSize: "9px",
                  color: isActive ? "var(--gold)" : "var(--text-dim)",
                }}>
                  {cfg?.icon}
                </span>
                {cfg?.short || node.shortLabel}
                {node.status === "active" && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{
                      display: "inline-block",
                      width: "4px", height: "4px",
                      borderRadius: "50%",
                      background: "var(--status-active-dot)",
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <AnimatePresence mode="wait">
          {activeNode ? (
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Router node ── */}
              {activeNode.id === "router" ? (
                <RouterOutput result={result} nodeData={activeNode.data} status={activeNode.status} />
              ) : activeNode.status === "active" && !activeNode.data ? (
                /* Streaming state */
                <StreamingIndicator label={activeNode.label} />
              ) : activeNode.data ? (
                /* Content */
                <div>
                  {/* Node header */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}>
                    <div>
                      <h2 className="font-display" style={{
                        fontSize: "22px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        letterSpacing: "0.01em",
                      }}>
                        {activeNode.label}
                      </h2>
                      {result?.hotel_name && (
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {result.hotel_name} · {result.hotel_location}
                        </p>
                      )}
                    </div>
                    {result?.execution_times[activeNode.id] && (
                      <span className="font-data" style={{
                        fontSize: "11px",
                        color: "var(--gold-dim)",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        background: "var(--status-done-bg)",
                        border: "1px solid var(--status-done-border)",
                      }}>
                        {result.execution_times[activeNode.id].toFixed(2)}s
                      </span>
                    )}
                  </div>

                  {/* Gold divider */}
                  <div style={{
                    height: "1px",
                    background: "linear-gradient(to right, var(--gold-dim), transparent)",
                    marginBottom: "20px",
                    opacity: 0.4,
                  }} />

                  {/* Markdown content */}
                  <MarkdownContent content={activeNode.data} />
                </div>
              ) : null}
            </motion.div>
          ) : phase === "streaming" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="waiting"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                gap: "16px",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                style={{
                  width: "32px", height: "32px",
                  borderRadius: "50%",
                  border: "1.5px solid var(--border-active)",
                  borderTopColor: "var(--gold)",
                }}
              />
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Running pipeline...
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Execution summary ── */}
        <AnimatePresence>
          {phase === "complete" && result && Object.keys(result.execution_times).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                marginTop: "32px",
                padding: "16px 20px",
                borderRadius: "10px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="font-data" style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Performance Summary
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "8px 24px",
              }}>
                {Object.entries(result.execution_times).map(([node, time]) => (
                  <div key={node} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {node.replace(/_/g, " ")}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {/* Mini bar */}
                      <div style={{
                        width: "40px", height: "2px",
                        background: "var(--border)",
                        borderRadius: "1px",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          background: "var(--gold)",
                          width: `${Math.min((time / Math.max(...Object.values(result.execution_times))) * 100, 100)}%`,
                          borderRadius: "1px",
                        }} />
                      </div>
                      <span className="font-data" style={{ fontSize: "11px", color: "var(--gold)" }}>
                        {typeof time === "number" ? `${time.toFixed(2)}s` : String(time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total pipeline time</span>
                <span className="font-data" style={{
                  fontSize: "12px",
                  color: "var(--gold-bright)",
                  fontWeight: 500,
                }}>
                  {Object.values(result.execution_times)
                    .reduce((a, b) => a + (typeof b === "number" ? b : 0), 0)
                    .toFixed(2)}s
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Router output ── */
function RouterOutput({ result, nodeData, status }: {
  result: OptimizeResponse | null;
  nodeData: string | null;
  status: string;
}) {
  if (status === "active" && !result) {
    return <StreamingIndicator label="Query Router" />;
  }

  const queryType = result?.query_type;
  const isValid = queryType === "valid";

  const typeColors: Record<string, { color: string; bg: string; border: string }> = {
    valid: { color: "var(--status-done-dot)", bg: "var(--status-done-bg)", border: "var(--status-done-border)" },
    insufficient: { color: "var(--gold)", bg: "var(--gold-muted)", border: "var(--border-focus)" },
    irrelevant: { color: "var(--status-error-text)", bg: "var(--status-error-bg)", border: "var(--status-error-border)" },
    booking: { color: "#fb923c", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.2)" },
  };

  const tc = queryType ? typeColors[queryType] || typeColors.insufficient : typeColors.insufficient;

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
      }}>
        <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)" }}>
          Query Router
        </h2>
        {queryType && (
          <span className="font-data" style={{
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tc.color,
            background: tc.bg,
            border: `1px solid ${tc.border}`,
          }}>
            {queryType}
          </span>
        )}
      </div>

      {result ? (
        <div style={{
          padding: "16px 20px",
          borderRadius: "10px",
          background: "var(--bg-panel)",
          border: `1px solid ${tc.border}`,
        }}>
          <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "8px" }}>
            {isValid
              ? `Input classified as valid. Routing to market analysis pipeline for ${result.hotel_name}.`
              : result.error_message || "Query could not be classified as a valid revenue optimization request."}
          </p>
          {isValid && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
              {["Market Analysis", "Demand Forecast", "Pricing Strategy", "Revenue Plan"].map((step) => (
                <span key={step} style={{
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "var(--status-done-bg)",
                  color: "var(--gold-dim)",
                  border: "1px solid var(--status-done-border)",
                  letterSpacing: "0.02em",
                }}>
                  {step}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : nodeData ? (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{nodeData}</p>
      ) : null}
    </div>
  );
}

/* ── Streaming indicator ── */
function StreamingIndicator({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      padding: "8px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          style={{
            width: "14px", height: "14px",
            borderRadius: "50%",
            border: "2px solid var(--border-active)",
            borderTopColor: "var(--status-active-dot)",
          }}
        />
        <span style={{ fontSize: "13px", color: "var(--status-active-text)" }}>
          Processing {label.toLowerCase()}...
        </span>
      </div>
      {/* Skeleton lines */}
      {[90, 75, 82, 60].map((w, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          style={{
            height: "10px",
            width: `${w}%`,
            borderRadius: "4px",
          }}
          className="shimmer"
        />
      ))}
    </div>
  );
}
