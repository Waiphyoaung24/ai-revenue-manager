"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OptimizeRequest, LLMProvider } from "@/lib/types";
import ProviderSelector from "./ProviderSelector";

interface Props {
  onSubmit: (req: OptimizeRequest) => void;
  isLoading: boolean;
  onReset: () => void;
  onProviderChange?: (provider: LLMProvider) => void;
}

type TextFieldKey = Exclude<keyof OptimizeRequest, "provider">;

const inputStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export default function HotelInputForm({ onSubmit, isLoading, onReset, onProviderChange }: Props) {
  const [form, setForm] = useState<OptimizeRequest>({
    hotel_name: "",
    hotel_location: "",
    current_adr: "",
    historical_occupancy: "",
    target_revpar: "",
    additional_context: "",
    provider: "gemini",
  });

  const handleProviderChange = (provider: LLMProvider) => {
    setForm((p) => ({ ...p, provider }));
    onProviderChange?.(provider);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isValid = Boolean(form.hotel_name && form.hotel_location && form.current_adr);

  const set = (key: TextFieldKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "28px 24px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "28px" }}>
        <p className="font-data" style={{
          fontSize: "9px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--gold-dim)",
          marginBottom: "10px",
        }}>
          Hotel Configuration
        </p>
        <h1 className="font-display" style={{
          fontSize: "28px",
          fontWeight: 600,
          lineHeight: 1.15,
          color: "var(--text-primary)",
          letterSpacing: "0.01em",
        }}>
          Revenue
          <br />
          <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Optimizer</span>
        </h1>
        <p style={{
          marginTop: "10px",
          fontSize: "12px",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}>
          Multi-agent AI analysis for the Thai hospitality market.
          Enter hotel data to generate your revenue strategy.
        </p>
      </div>

      {/* ── Gold divider ── */}
      <div style={{
        height: "1px",
        background: "linear-gradient(to right, var(--gold-dim), transparent)",
        marginBottom: "24px",
        opacity: 0.5,
      }} />

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Hotel name */}
        <FieldGroup label="Hotel Name" style={{ marginBottom: "14px" }}>
          <input
            type="text"
            value={form.hotel_name}
            onChange={set("hotel_name")}
            placeholder="Mandarin Oriental Bangkok"
            disabled={isLoading}
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </FieldGroup>

        {/* Location */}
        <FieldGroup label="Location" style={{ marginBottom: "14px" }}>
          <input
            type="text"
            value={form.hotel_location}
            onChange={set("hotel_location")}
            placeholder="Bangkok, Thailand"
            disabled={isLoading}
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </FieldGroup>

        {/* Metrics row — 3 compact fields */}
        <div style={{ marginBottom: "14px" }}>
          <p style={{
            fontSize: "10px",
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Key Metrics
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "8px" }}>
            <MetricField
              label="ADR (฿)"
              placeholder="12,000"
              value={form.current_adr}
              onChange={set("current_adr")}
              disabled={isLoading}
              hint="Avg Daily Rate"
            />
            <MetricField
              label="Occupancy"
              placeholder="68%"
              value={form.historical_occupancy}
              onChange={set("historical_occupancy")}
              disabled={isLoading}
              hint="12-month avg"
            />
            <MetricField
              label="RevPAR (฿)"
              placeholder="9,000"
              value={form.target_revpar}
              onChange={set("target_revpar")}
              disabled={isLoading}
              hint="Target"
            />
          </div>
        </div>

        {/* Context */}
        <FieldGroup label="Additional Context" optional style={{ marginBottom: "20px" }}>
          <textarea
            value={form.additional_context}
            onChange={set("additional_context")}
            placeholder="Heritage property, high-end segment, upcoming Songkran season, competing with new properties..."
            rows={3}
            disabled={isLoading}
            style={{
              ...inputStyle,
              resize: "none",
              lineHeight: 1.5,
              fontFamily: "inherit",
            }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </FieldGroup>

        {/* ── Provider selector ── */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{
            fontSize: "10px",
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            AI Provider
          </p>
          <ProviderSelector
            value={form.provider}
            onChange={handleProviderChange}
            disabled={isLoading}
          />
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: "8px" }}>
          <motion.button
            type="submit"
            disabled={!isValid || isLoading}
            whileHover={isValid && !isLoading ? { scale: 1.01 } : {}}
            whileTap={isValid && !isLoading ? { scale: 0.99 } : {}}
            style={{
              flex: 1,
              padding: "11px 20px",
              borderRadius: "7px",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              cursor: isValid && !isLoading ? "pointer" : "not-allowed",
              opacity: !isValid || isLoading ? 0.45 : 1,
              background: isLoading
                ? "linear-gradient(135deg, var(--gold-dim), var(--gold))"
                : "linear-gradient(135deg, var(--gold), var(--gold-bright))",
              color: "#0a0a0a",
              border: "none",
              transition: "opacity 0.15s, transform 0.1s",
              boxShadow: isValid && !isLoading ? "0 2px 16px rgba(201,168,76,0.2)" : "none",
            }}
          >
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{
                  display: "inline-block",
                  width: "11px", height: "11px",
                  border: "2px solid rgba(0,0,0,0.4)",
                  borderTopColor: "#0a0a0a",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }} />
                Analyzing...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l1.5 4.5H14l-3.75 2.75L11.75 13 7 10.25 2.25 13l1.5-4.75L0 5.5h5.5L7 1z" fill="#0a0a0a" opacity="0.8"/>
                </svg>
                Run Analysis
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {isLoading && (
              <motion.button
                type="button"
                onClick={onReset}
                initial={{ opacity: 0, scale: 0.85, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.85, width: 0 }}
                style={{
                  padding: "11px 14px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  cursor: "pointer",
                  background: "transparent",
                  border: "1px solid var(--border-active)",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                Cancel
              </motion.button>
            )}
          </AnimatePresence>
        </div>

      </form>

      {/* ── Footer ── */}
      <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
        <p className="font-data" style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.04em" }}>
          Powered by LangGraph · Claude Haiku & Sonnet · Gemini Flash & Pro
        </p>
      </div>

    </div>
  );
}

/* ── Sub-components ── */

function FieldGroup({ label, children, optional, style }: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <label style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        letterSpacing: "0.03em",
        marginBottom: "6px",
      }}>
        {label}
        {optional && (
          <span style={{ color: "var(--text-muted)", marginLeft: "5px", fontWeight: 400 }}>optional</span>
        )}
      </label>
      {children}
    </div>
  );
}

function MetricField({ label, placeholder, value, onChange, disabled, hint }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  hint: string;
}) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: "10px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        marginBottom: "5px",
        letterSpacing: "0.02em",
      }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="font-data"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: "5px",
          padding: "8px 10px",
          fontSize: "12px",
          color: "var(--gold-bright)",
          width: "100%",
          outline: "none",
          transition: "border-color 0.15s",
          letterSpacing: "0.02em",
        }}
        onFocus={focusStyle}
        onBlur={blurStyle}
      />
      <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "3px" }}>{hint}</p>
    </div>
  );
}

/* Focus/blur handlers */
const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "var(--border-focus)";
  e.target.style.boxShadow = "0 0 0 2px rgba(201,168,76,0.06)";
};

const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "var(--border)";
  e.target.style.boxShadow = "none";
};
