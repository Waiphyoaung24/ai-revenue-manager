"use client";

import { motion } from "framer-motion";
import { LLMProvider } from "@/lib/types";

interface Props {
  value: LLMProvider;
  onChange: (provider: LLMProvider) => void;
  disabled?: boolean;
}

interface ProviderConfig {
  id: LLMProvider;
  name: string;
  tagline: string;
  models: string[];
  color: string;
  dimColor: string;
  borderColor: string;
  locked?: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "anthropic",
    name: "Claude",
    tagline: "Anthropic",
    models: ["Haiku", "Sonnet"],
    color: "#c9a84c",
    dimColor: "rgba(201,168,76,0.07)",
    borderColor: "rgba(201,168,76,0.25)",
    locked: true,
  },
  {
    id: "gemini",
    name: "Gemini",
    tagline: "Google",
    models: ["Flash", "Pro"],
    color: "#4285f4",
    dimColor: "rgba(66,133,244,0.07)",
    borderColor: "rgba(66,133,244,0.25)",
  },
];

export default function ProviderSelector({ value, onChange, disabled = false }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {PROVIDERS.map((p) => {
        const isLocked = p.locked === true;
        const isSelected = value === p.id && !isLocked;
        const isClickable = !disabled && !isLocked;

        return (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => isClickable && onChange(p.id)}
            disabled={disabled || isLocked}
            whileHover={isClickable ? { scale: 1.01 } : {}}
            whileTap={isClickable ? { scale: 0.98 } : {}}
            title={isLocked ? "Claude integration coming soon" : undefined}
            style={{
              padding: "10px 12px",
              borderRadius: "7px",
              cursor: isLocked ? "not-allowed" : disabled ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.38 : disabled ? 0.5 : 1,
              background: isSelected ? p.dimColor : "var(--bg-input)",
              border: `1px solid ${isSelected ? p.borderColor : "var(--border)"}`,
              textAlign: "left",
              transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
              position: "relative",
              overflow: "hidden",
              boxShadow: isSelected ? `0 0 0 1px ${p.borderColor}` : "none",
              filter: isLocked ? "grayscale(0.4)" : "none",
            }}
          >
            {/* Top: name + lock/check indicator */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2px",
            }}>
              <span style={{
                fontSize: "12px",
                fontWeight: 600,
                color: isLocked ? "var(--text-muted)" : isSelected ? p.color : "var(--text-secondary)",
                letterSpacing: "0.01em",
              }}>
                {p.name}
              </span>

              {isLocked ? (
                /* Lock icon */
                <div style={{
                  width: "14px", height: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  color: "var(--text-dim)",
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect x="1.5" y="4.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M3 4.5V3a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
              ) : isSelected ? (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  style={{
                    width: "14px", height: "14px",
                    borderRadius: "50%",
                    background: p.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l1.5 1.5L6.5 2.5" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              ) : (
                <div style={{
                  width: "14px", height: "14px",
                  borderRadius: "50%",
                  border: "1px solid var(--border-active)",
                  flexShrink: 0,
                }} />
              )}
            </div>

            {/* Tagline */}
            <p style={{
              fontSize: "9px",
              color: "var(--text-muted)",
              marginBottom: "6px",
              letterSpacing: "0.04em",
            }}>
              by {p.tagline}
            </p>

            {/* Model badges + soon pill */}
            <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
              {p.models.map((m) => (
                <span key={m} className="font-data" style={{
                  fontSize: "8px",
                  padding: "2px 5px",
                  borderRadius: "3px",
                  background: "var(--bg-base)",
                  color: isLocked ? "var(--text-dim)" : isSelected ? p.color : "var(--text-muted)",
                  border: `1px solid ${isSelected ? p.borderColor : "var(--border-subtle)"}`,
                  letterSpacing: "0.04em",
                }}>
                  {m}
                </span>
              ))}
              {isLocked && (
                <span className="font-data" style={{
                  fontSize: "8px",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginLeft: "auto",
                }}>
                  Soon
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
