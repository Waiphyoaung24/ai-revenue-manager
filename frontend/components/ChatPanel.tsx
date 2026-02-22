"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage, streamChat, fetchMessages, clearMessages } from "@/lib/chatApi";

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing messages on mount
  useEffect(() => {
    fetchMessages()
      .then(setMessages)
      .catch(() => { /* silently ignore — session may not be ready */ })
      .finally(() => setLoadingHistory(false));
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamingText("");

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let fullResponse = "";
    try {
      for await (const chunk of streamChat(nextMessages, ctrl.signal)) {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: fullResponse },
      ]);
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message ?? "Chat failed");
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }, [input, messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = async () => {
    try {
      await clearMessages();
      setMessages([]);
    } catch {
      // ignore
    }
  };

  const allMessages: ChatMessage[] = streaming
    ? [...messages, { role: "assistant", content: streamingText }]
    : messages;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px 0" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        <div>
          <p className="font-data" style={{ fontSize: "9px", color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "3px" }}>
            AI Concierge
          </p>
          <h2 className="font-display" style={{ fontSize: "16px", color: "var(--text-primary)", margin: 0 }}>
            Revenue Advisor
          </h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            title="Clear chat"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "5px 10px",
              fontSize: "10px",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {loadingHistory ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
            <span style={{ width: "16px", height: "16px", border: "2px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : allMessages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", opacity: 0.7 }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round">
                <path d="M15 3H3a1 1 0 00-1 1v8a1 1 0 001 1h4l2 2 2-2h4a1 1 0 001-1V4a1 1 0 00-1-1z"/>
              </svg>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", margin: 0, maxWidth: "200px" }}>
              Ask me anything about hotel revenue strategy, pricing, or market analysis.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {allMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, var(--gold), var(--gold-dim))"
                      : "var(--bg-card)",
                    border: msg.role === "user" ? "none" : "1px solid var(--border)",
                    color: msg.role === "user" ? "#0a0a0a" : "var(--text-primary)",
                    fontSize: "13px",
                    lineHeight: "1.55",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                  {/* Streaming cursor */}
                  {streaming && i === allMessages.length - 1 && msg.role === "assistant" && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      style={{ display: "inline-block", width: "8px", height: "13px", background: "var(--gold)", borderRadius: "1px", marginLeft: "3px", verticalAlign: "middle" }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: "11px", color: "#ef4444", textAlign: "center", margin: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 20px 0",
        borderTop: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          gap: "10px",
          alignItems: "flex-end",
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "10px 12px",
          transition: "border-color 0.15s",
        }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about revenue strategy... (Enter to send)"
            disabled={streaming}
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "DM Sans, sans-serif",
              resize: "none",
              lineHeight: "1.5",
              maxHeight: "100px",
              overflowY: "auto",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            title="Send (Enter)"
            style={{
              background: input.trim() && !streaming ? "var(--gold)" : "var(--border)",
              border: "none",
              borderRadius: "6px",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            {streaming ? (
              <span style={{ width: "12px", height: "12px", border: "2px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={input.trim() ? "#0a0a0a" : "var(--text-muted)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 7L2 2l2.5 5L2 12z"/>
              </svg>
            )}
          </button>
        </div>
        <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", textAlign: "right" }}>
          Shift+Enter for new line
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
