"""Unit tests for AgentState schema."""

import typing


def test_agent_state_has_required_keys():
    """AgentState TypedDict must have all required fields."""
    from app.schemas.revenue import AgentState

    hints = typing.get_type_hints(AgentState)
    required = {
        "raw_input",
        "hotel_name",
        "hotel_location",
        "current_adr",
        "historical_occupancy",
        "target_revpar",
        "additional_context",
        "query_type",
        "error_message",
        "market_analysis",
        "demand_forecast",
        "pricing_strategy",
        "revenue_plan",
        "execution_times",
        "model_used",
    }
    assert required.issubset(hints.keys())


def test_agent_state_instantiates():
    """A minimal AgentState dict must be constructible."""
    from app.schemas.revenue import AgentState

    state: AgentState = {
        "raw_input": {},
        "hotel_name": "Centara Grand",
        "hotel_location": "Bangkok",
        "current_adr": "4500",
        "historical_occupancy": "72%",
        "target_revpar": "3500",
        "additional_context": "",
        "query_type": "valid",
        "error_message": None,
        "market_analysis": None,
        "demand_forecast": None,
        "pricing_strategy": None,
        "revenue_plan": None,
        "execution_times": {},
        "model_used": {},
    }
    assert state["hotel_name"] == "Centara Grand"
    assert state["hotel_location"] == "Bangkok"
