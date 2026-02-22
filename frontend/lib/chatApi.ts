/**
 * Frontend API client for history and optimization endpoints.
 *
 * All endpoints require a session bearer token from auth.ts.
 */

import { getSessionToken } from "./auth";

const BASE = "";

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
