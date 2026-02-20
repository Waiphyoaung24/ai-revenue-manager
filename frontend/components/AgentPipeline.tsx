"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PipelineNode, NodeStatus, NodeName, OptimizeResponse, OptimizePhase } from "@/lib/types";

interface Props {
  nodes: PipelineNode[];
  activeTab: string | null;
  onNodeClick: (id: string) => void;
  result: OptimizeResponse | null;
  phase: OptimizePhase;
}

const STATUS_CONFIG: Record<NodeStatus, {
  dotColor: string;
  borderColor: string;
  bg: string;
  textColor: string;
  badge: string;
  badgeBg: string;
}> = {
  pending: {
    dotColor: "var(--border-active)",
    borderColor: "var(--border-subtle)",
    bg: "transparent",
    textColor: "var(--text-muted)",
    badge: "pending",
    badgeBg: "var(--border)",
  },
  active: {
    dotColor: "var(--status-active-dot)",
    borderColor: "var(--status-active-border)",
    bg: "var(--status-active-bg)",
    textColor: "var(--status-active-text)",
    badge: "running",
    badgeBg: "var(--status-active-border)",
  },
  done: {
    dotColor: "var(--status-done-dot)",
    borderColor: "var(--status-done-border)",
    bg: "var(--status-done-bg)",
    textColor: "var(--text-primary)",
    badge: "done",
    badgeBg: "var(--status-done-border)",
  },
  error: {
    dotColor: "var(--status-error-dot)",
    borderColor: "var(--status-error-border)",
    bg: "var(--status-error-bg)",
    textColor: "var(--status-error-text)",
    badge: "error",
    badgeBg: "var(--status-error-border)",
  },
};

const NODE_ICONS: Record<NodeName, React.ReactNode> = {
  router: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M6 1l1 3h3l-2.5 2 1 3L6 7.5 3.5 9l1-3L2 4h3L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  market_analyst: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M1 9l3-4 2.5 2L9 3.5m0 0h-2m2 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  demand_forecaster: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="7" width="2" height="4" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="5" y="4" width="2" height="7" rx="0.5" fill="currentColor" opacity="0.8"/>
      <rect x="9" y="1" width="2" height="10" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  pricing_strategist: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2 6h8M6 2l-2.5 4h5L6 2zM3.5 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  revenue_manager: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 7.5c0-.8.6-1.5 1.5-1.5s1.5-.7 1.5-1.5M6 4.5V4m0 7v-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
};

function NodeRow({
  node,
  index,
  isLast,
  isSelected,
  onClick,
  executionTime,
}: {
  node: PipelineNode;
  index: number;
  isLast: boolean;
  isSelected: boolean;
  onClick: () => void;
  executionTime?: number;
}) {
  const cfg = STATUS_CONFIG[node.status];
  const clickable = node.status === "done" || node.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", alignItems: "stretch", gap: "0" }}
    >
      {/* Spine */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        width: "28px", flexShrink: 0, paddingTop: "12px",
      }}>
        {/* Dot */}
        <motion.div
          animate={node.status === "active" ? {
            scale: [1, 1.6, 1],
            opacity: [1, 0.5, 1],
          } : node.status === "done" ? { scale: 1, opacity: 1 } : {}}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          style={{
            width: "8px", height: "8px",
            borderRadius: "50%",
            background: cfg.dotColor,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {node.status === "active" && (
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: "-2px",
                borderRadius: "50%",
                background: "var(--status-active-dot)",
              }}
            />
          )}
        </motion.div>

        {/* Line */}
        {!isLast && (
          <div style={{
            width: "1px",
            flex: 1,
            marginTop: "4px",
            background: node.status === "done"
              ? `linear-gradient(to bottom, var(--gold-dim), var(--border-subtle))`
              : "var(--border-subtle)",
            opacity: node.status === "pending" ? 0.4 : 1,
          }} />
        )}
      </div>

      {/* Card */}
      <motion.div
        onClick={clickable ? onClick : undefined}
        whileHover={clickable ? { x: 2 } : {}}
        transition={{ duration: 0.15 }}
        style={{
          flex: 1,
          margin: "4px 0 8px 8px",
          padding: "10px 12px",
          borderRadius: "8px",
          cursor: clickable ? "pointer" : "default",
          background: isSelected
            ? "rgba(201,168,76,0.05)"
            : node.status === "pending" ? "transparent" : cfg.bg,
          border: `1px solid ${isSelected ? "rgba(201,168,76,0.25)" : cfg.borderColor}`,
          transition: "background 0.2s, border-color 0.2s",
          userSelect: "none",
          minWidth: 0,
        }}
      >
        {/* Row 1: icon + name + model badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{
            color: node.status === "pending" ? "var(--text-muted)" : cfg.textColor,
            opacity: node.status === "pending" ? 0.5 : 1,
            display: "flex", alignItems: "center", flexShrink: 0,
          }}>
            {NODE_ICONS[node.id as NodeName]}
          </span>
          <span style={{
            fontSize: "11px",
            fontWeight: 500,
            color: node.status === "pending" ? "var(--text-muted)" : "var(--text-primary)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {node.label}
          </span>
          <span className="font-data" style={{
            fontSize: "8px",
            padding: "2px 5px",
            borderRadius: "3px",
            background: "var(--bg-base)",
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
            flexShrink: 0,
            border: "1px solid var(--border-subtle)",
          }}>
            {node.model}
          </span>
        </div>

        {/* Row 2: status line */}
        <div style={{ marginTop: "6px" }}>
          {node.status === "active" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="font-data"
                style={{ fontSize: "9px", color: "var(--status-active-text)", letterSpacing: "0.04em" }}
              >
                ● PROCESSING
              </motion.span>
            </motion.div>
          )}

          {node.status === "done" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {node.data && (
                <p style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  marginRight: "6px",
                }}>
                  {node.data.replace(/^[#*\-\s]+/, "").substring(0, 55)}…
                </p>
              )}
              {executionTime !== undefined && (
                <span className="font-data" style={{
                  fontSize: "9px",
                  color: "var(--gold-dim)",
                  flexShrink: 0,
                  letterSpacing: "0.03em",
                }}>
                  {executionTime.toFixed(1)}s
                </span>
              )}
            </div>
          )}

          {node.status === "error" && (
            <p className="font-data" style={{ fontSize: "9px", color: "var(--status-error-text)", letterSpacing: "0.04em" }}>
              ✕ FAILED
            </p>
          )}

          {node.status === "pending" && (
            <p className="font-data" style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.04em" }}>
              — WAITING
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AgentPipeline({ nodes, activeTab, onNodeClick, result, phase }: Props) {
  const completedCount = nodes.filter(n => n.status === "done").length;
  const totalCount = nodes.length;
  const progressPct = (completedCount / totalCount) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "28px 16px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: "20px", paddingLeft: "4px" }}>
        <p className="font-data" style={{
          fontSize: "9px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--gold-dim)",
          marginBottom: "4px",
        }}>
          Agent Pipeline
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span className="font-display" style={{
            fontSize: "18px",
            color: "var(--text-primary)",
            fontWeight: 500,
          }}>
            {completedCount}
            <span style={{ color: "var(--text-muted)", fontWeight: 300 }}>/{totalCount}</span>
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {phase === "streaming" ? "running" : phase === "complete" ? "complete" : "agents"}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: "10px",
          height: "2px",
          background: "var(--border-subtle)",
          borderRadius: "2px",
          overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "100%",
              background: phase === "complete"
                ? `linear-gradient(to right, var(--gold-dim), var(--gold))`
                : "var(--status-active-dot)",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>

      {/* Node list */}
      <div style={{ flex: 1 }}>
        {nodes.map((node, i) => (
          <NodeRow
            key={node.id}
            node={node}
            index={i}
            isLast={i === nodes.length - 1}
            isSelected={activeTab === node.id}
            onClick={() => onNodeClick(node.id)}
            executionTime={result?.execution_times[node.id]}
          />
        ))}
      </div>

      {/* Footer — model info */}
      <AnimatePresence>
        {result && phase === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <p className="font-data" style={{
              fontSize: "9px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              Models Used
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {Object.entries(result.model_used).map(([node, model]) => (
                <div key={node} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {node.replace(/_/g, " ")}
                  </span>
                  <span className="font-data" style={{
                    fontSize: "9px",
                    color: "var(--gold-dim)",
                    maxWidth: "110px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                  }}>
                    {model.split("/").pop()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
