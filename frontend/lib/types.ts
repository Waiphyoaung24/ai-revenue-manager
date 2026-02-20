export type LLMProvider = "anthropic" | "gemini";

export interface OptimizeRequest {
  hotel_name: string;
  hotel_location: string;
  current_adr: string;
  historical_occupancy: string;
  target_revpar: string;
  additional_context: string;
  provider: LLMProvider;
}

export interface OptimizeResponse {
  hotel_name: string;
  hotel_location: string;
  query_type: "valid" | "irrelevant" | "booking" | "insufficient";
  provider: LLMProvider;
  error_message: string | null;
  market_analysis: string | null;
  demand_forecast: string | null;
  pricing_strategy: string | null;
  revenue_plan: string | null;
  execution_times: Record<string, number>;
  model_used: Record<string, string>;
}

export type NodeName =
  | "router"
  | "market_analyst"
  | "demand_forecaster"
  | "pricing_strategist"
  | "revenue_manager";

export type StreamEvent =
  | { type: "node"; node: NodeName; data: string }
  | { type: "result"; result: OptimizeResponse };

export type NodeStatus = "pending" | "active" | "done" | "error";

export interface PipelineNode {
  id: NodeName;
  label: string;
  shortLabel: string;
  model: string;
  status: NodeStatus;
  data: string | null;
}

export type OptimizePhase = "idle" | "streaming" | "complete" | "error";

export interface OptimizeState {
  phase: OptimizePhase;
  nodes: PipelineNode[];
  result: OptimizeResponse | null;
  error: string | null;
  activeTab: NodeName | null;
}

export type OptimizeAction =
  | { type: "START" }
  | { type: "NODE_ACTIVE"; node: NodeName }
  | { type: "NODE_DONE"; node: NodeName; data: string }
  | { type: "COMPLETE"; result: OptimizeResponse }
  | { type: "ERROR"; error: string }
  | { type: "RESET" }
  | { type: "SET_TAB"; tab: NodeName }
  | { type: "SET_PROVIDER"; provider: LLMProvider };
