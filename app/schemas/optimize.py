"""Pydantic schemas for the revenue optimization API."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    """Request body for POST /optimize."""

    hotel_name: Optional[str] = Field(default="", description="Name of the hotel")
    hotel_location: Optional[str] = Field(default="", description="Location of the hotel (city, Thailand)")
    current_adr: Optional[str] = Field(default="", description="Current Average Daily Rate in ฿")
    historical_occupancy: Optional[str] = Field(default="", description="Historical occupancy rate, e.g. '75%'")
    target_revpar: Optional[str] = Field(default="", description="Target RevPAR in ฿")
    additional_context: Optional[str] = Field(
        default="", description="Optional context: upcoming events, renovations, etc."
    )
    provider: Literal["anthropic", "gemini"] = Field(
        default="anthropic",
        description="LLM provider: 'anthropic' (Claude Haiku/Sonnet) or 'gemini' (Google Gemini Flash/Pro)",
    )


class OptimizeResponse(BaseModel):
    """Response body for POST /optimize."""

    hotel_name: str
    hotel_location: str
    query_type: str
    provider: str = Field(default="anthropic", description="LLM provider used for this run")
    error_message: Optional[str] = None
    market_analysis: Optional[str] = None
    demand_forecast: Optional[str] = None
    pricing_strategy: Optional[str] = None
    revenue_plan: Optional[str] = None
    execution_times: dict = Field(default_factory=dict)
    model_used: dict = Field(default_factory=dict)
