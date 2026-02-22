import { OptimizeRequest, NodeName, StreamEvent } from "./types";
import { getSessionToken } from "./auth";

const BASE = "";

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function* streamOptimize(
  req: OptimizeRequest,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${BASE}/api/v1/optimize/stream`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(req),
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
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.type === "result") {
            yield { type: "result", result: parsed.result } as StreamEvent;
          } else {
            yield { type: "node", node: parsed.node as NodeName, data: parsed.data as string } as StreamEvent;
          }
        } catch {
          // skip malformed SSE frames
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
