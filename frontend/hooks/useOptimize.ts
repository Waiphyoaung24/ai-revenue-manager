"use client";

import { useReducer, useRef, useCallback } from "react";
import { streamOptimize } from "@/lib/api";
import {
  OptimizeState,
  OptimizeAction,
  OptimizeRequest,
  PipelineNode,
  NodeName,
  LLMProvider,
} from "@/lib/types";

// Model labels per provider — shown in the pipeline node cards
const PROVIDER_MODEL_LABELS: Record<LLMProvider, Record<NodeName, string>> = {
  anthropic: {
    router: "Haiku",
    market_analyst: "Haiku",
    demand_forecaster: "Sonnet",
    pricing_strategist: "Sonnet",
    revenue_manager: "Haiku",
  },
  gemini: {
    router: "G3 Flash",
    market_analyst: "G3 Flash",
    demand_forecaster: "G3 Flash",
    pricing_strategist: "G3 Flash",
    revenue_manager: "G3 Flash",
  },
};

function buildPipelineNodes(provider: LLMProvider = "anthropic"): PipelineNode[] {
  const labels = PROVIDER_MODEL_LABELS[provider];
  return [
    { id: "router", label: "Query Router", shortLabel: "Router", model: labels.router, status: "pending", data: null },
    { id: "market_analyst", label: "Market Analyst", shortLabel: "Market", model: labels.market_analyst, status: "pending", data: null },
    { id: "demand_forecaster", label: "Demand Forecaster", shortLabel: "Demand", model: labels.demand_forecaster, status: "pending", data: null },
    { id: "pricing_strategist", label: "Pricing Strategist", shortLabel: "Pricing", model: labels.pricing_strategist, status: "pending", data: null },
    { id: "revenue_manager", label: "Revenue Manager", shortLabel: "Manager", model: labels.revenue_manager, status: "pending", data: null },
  ];
}

const initialState: OptimizeState = {
  phase: "idle",
  nodes: buildPipelineNodes("anthropic"),
  result: null,
  error: null,
  activeTab: null,
};

function reducer(state: OptimizeState, action: OptimizeAction): OptimizeState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        phase: "streaming",
        result: null,
        error: null,
        activeTab: null,
        // Keep current node labels (provider already reflected before START)
        nodes: state.nodes.map((n) => ({ ...n, status: "pending", data: null })),
      };
    case "NODE_ACTIVE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.node ? { ...n, status: "active" } : n
        ),
      };
    case "NODE_DONE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.node ? { ...n, status: "done", data: action.data } : n
        ),
        activeTab: action.node,
      };
    case "COMPLETE":
      return { ...state, phase: "complete", result: action.result };
    case "ERROR":
      return {
        ...state,
        phase: "error",
        error: action.error,
        nodes: state.nodes.map((n) =>
          n.status === "active" ? { ...n, status: "error" } : n
        ),
      };
    case "RESET":
      return { ...initialState, nodes: buildPipelineNodes("anthropic") };
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_PROVIDER":
      // Update node model labels when provider changes (only in idle state)
      return {
        ...state,
        nodes: buildPipelineNodes(action.provider),
      };
    default:
      return state;
  }
}

const NODE_ORDER: NodeName[] = [
  "router",
  "market_analyst",
  "demand_forecaster",
  "pricing_strategist",
  "revenue_manager",
];

export function useOptimize() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (req: OptimizeRequest) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    dispatch({ type: "START" });

    try {
      for await (const event of streamOptimize(req, ctrl.signal)) {
        if (event.type === "result") {
          dispatch({ type: "COMPLETE", result: event.result });
          continue;
        }
        const node = event.node as NodeName;
        if (!NODE_ORDER.includes(node)) continue;

        dispatch({ type: "NODE_ACTIVE", node });
        // Brief visual pause before marking done
        await new Promise((r) => setTimeout(r, 400));
        dispatch({ type: "NODE_DONE", node, data: event.data });
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      dispatch({
        type: "ERROR",
        error: (err as Error).message ?? "Unknown error occurred",
      });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  const setTab = useCallback((tab: NodeName) => {
    dispatch({ type: "SET_TAB", tab });
  }, []);

  const setProvider = useCallback((provider: LLMProvider) => {
    dispatch({ type: "SET_PROVIDER", provider });
  }, []);

  return { state, run, reset, setTab, setProvider };
}
