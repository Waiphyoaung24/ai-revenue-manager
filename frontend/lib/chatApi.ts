/**
 * Frontend API client for the /chatbot endpoints.
 *
 * All endpoints require a session bearer token from auth.ts.
 */

import { getSessionToken } from "./auth";

const BASE = "";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Fetch all messages for the current session. */
export async function fetchMessages(): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE}/api/v1/chatbot/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? "Failed to fetch messages");
  }
  const data = await res.json();
  // Backend returns { messages: [...] }
  return data.messages ?? [];
}

/** Clear chat history for the current session. */
export async function clearMessages(): Promise<void> {
  const res = await fetch(`${BASE}/api/v1/chatbot/messages`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? "Failed to clear messages");
  }
}

/**
 * Stream a chat response. Yields text chunks as they arrive.
 *
 * The backend SSE format is:
 *   data: { content: "...", done: false }\n\n
 *   data: { content: "", done: true }\n\n
 */
export async function* streamChat(
  messages: ChatMessage[],
  signal?: AbortSignal
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/api/v1/chatbot/chat/stream`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(payload);
          if (parsed.done) return;
          if (parsed.content) yield parsed.content as string;
        } catch {
          // skip malformed frame
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── History endpoint ──────────────────────────────────────────────────────────

export interface OptimizationHistoryItem {
  id: number;
  hotel_name: string;
  hotel_location: string;
  provider: string;
  query_type: string;
  error_message: string | null;
  market_analysis: string | null;
  demand_forecast: string | null;
  pricing_strategy: string | null;
  revenue_plan: string | null;
  execution_times: Record<string, number>;
  model_used: Record<string, string>;
  created_at: string;
}

export interface HistoryResponse {
  items: OptimizationHistoryItem[];
  count: number;
  offset: number;
  limit: number;
}

function historyHeaders(): HeadersInit {
  const token = getSessionToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Fetch paginated optimization history for the current user. */
export async function fetchHistory(limit = 20, offset = 0): Promise<HistoryResponse> {
  const res = await fetch(
    `${BASE}/api/v1/history?limit=${limit}&offset=${offset}`,
    { headers: historyHeaders() }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? "Failed to fetch history");
  }
  return res.json();
}
