"""Revenue optimization schemas and state definitions."""

from typing import (
    Literal,
    Optional,
    TypedDict,
)


class AgentState(TypedDict):
    """State definition for the revenue optimization multi-agent pipeline."""

    # Input fields
    raw_input: dict
    hotel_name: str
    hotel_location: str
    current_adr: str
    historical_occupancy: str
    target_revpar: str
    additional_context: str

    # LLM provider selection — propagated through all nodes
    provider: Literal["anthropic", "gemini"]

    # Routing
    query_type: Literal["valid", "irrelevant", "booking", "insufficient"]
    error_message: Optional[str]

    # Agent outputs
    market_analysis: Optional[str]
    demand_forecast: Optional[str]
    pricing_strategy: Optional[str]
    revenue_plan: Optional[str]

    # Metadata
    execution_times: dict
    model_used: dict
