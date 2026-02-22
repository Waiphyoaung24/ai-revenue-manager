"""SQLModel table for persisting optimization pipeline results.

Each row represents one completed run of the revenue optimization pipeline,
tied to the authenticated user via ``user_id``.
"""

from datetime import datetime, UTC
from typing import Optional

from sqlmodel import Field, SQLModel


class OptimizationRecord(SQLModel, table=True):
    """Stores every completed optimize invocation for a user.

    Attributes:
        id: Auto-increment primary key.
        user_id: FK to the ``user`` table.
        hotel_name: Name of the analysed hotel.
        hotel_location: Location string.
        provider: LLM provider used (``anthropic`` or ``gemini``).
        query_type: Router classification (``valid``, ``irrelevant``, etc.).
        error_message: Router error text if query was not valid.
        market_analysis: Output of the market analyst node.
        demand_forecast: Output of the demand forecaster node.
        pricing_strategy: Output of the pricing strategist node.
        revenue_plan: Output of the revenue manager node.
        execution_times_json: JSON-encoded dict of per-node execution times.
        model_used_json: JSON-encoded dict of per-node model names.
        created_at: UTC timestamp of when the record was created.
    """

    __tablename__ = "optimization_records"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")

    # Request fields
    hotel_name: str = Field(default="")
    hotel_location: str = Field(default="")
    provider: str = Field(default="anthropic")

    # Router output
    query_type: str = Field(default="valid")
    error_message: Optional[str] = Field(default=None)

    # Agent outputs (can be large markdown blobs)
    market_analysis: Optional[str] = Field(default=None)
    demand_forecast: Optional[str] = Field(default=None)
    pricing_strategy: Optional[str] = Field(default=None)
    revenue_plan: Optional[str] = Field(default=None)

    # Serialised dicts stored as JSON strings
    execution_times_json: str = Field(default="{}")
    model_used_json: str = Field(default="{}")

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
