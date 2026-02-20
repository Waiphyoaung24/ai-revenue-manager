"""Unit tests for the revenue optimization LangGraph StateGraph."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture
def valid_state():
    return {
        "raw_input": {},
        "hotel_name": "Mandarin Oriental",
        "hotel_location": "Bangkok, Thailand",
        "current_adr": "12000",
        "historical_occupancy": "68%",
        "target_revpar": "9000",
        "additional_context": "Heritage property, high-end segment",
        "query_type": "valid",
        "error_message": None,
        "market_analysis": None,
        "demand_forecast": None,
        "pricing_strategy": None,
        "revenue_plan": None,
        "execution_times": {},
        "model_used": {},
    }


@pytest.mark.asyncio
async def test_graph_routes_valid_through_all_nodes(valid_state):
    """Full graph must populate all output fields for a valid input."""
    from app.core.langgraph.revenue_graph import build_revenue_graph

    graph = build_revenue_graph()

    with (
        patch(
            "app.core.langgraph.revenue_nodes.router.call_claude",
            new=AsyncMock(return_value='{"query_type": "valid", "error_message": null}'),
        ),
        patch(
            "app.core.langgraph.revenue_nodes.market_analyst.call_claude",
            new=AsyncMock(return_value="## Market\nStrong luxury demand in Bangkok."),
        ),
        patch(
            "app.core.langgraph.revenue_nodes.demand_forecaster.call_claude",
            new=AsyncMock(return_value="## Demand\nPeak occupancy 80% in Dec-Feb."),
        ),
        patch(
            "app.core.langgraph.revenue_nodes.pricing_strategist.call_claude",
            new=AsyncMock(return_value="## Pricing\nRaise ADR to ฿13,500."),
        ),
        patch(
            "app.core.langgraph.revenue_nodes.revenue_manager.call_claude",
            new=AsyncMock(return_value="## Plan\nWeek 1: Adjust rack rates."),
        ),
    ):
        result = await graph.ainvoke(valid_state)

    assert result["revenue_plan"] == "## Plan\nWeek 1: Adjust rack rates."
    assert result["query_type"] == "valid"
    assert result["market_analysis"] is not None
    assert result["demand_forecast"] is not None
    assert result["pricing_strategy"] is not None
    assert len(result["execution_times"]) == 5


@pytest.mark.asyncio
async def test_graph_stops_at_irrelevant(valid_state):
    """Graph must not call any analysis nodes for irrelevant queries."""
    from app.core.langgraph.revenue_graph import build_revenue_graph

    graph = build_revenue_graph()

    with (
        patch(
            "app.core.langgraph.revenue_nodes.router.call_claude",
            new=AsyncMock(return_value='{"query_type": "irrelevant", "error_message": "Not a revenue query"}'),
        ),
        patch(
            "app.core.langgraph.revenue_nodes.market_analyst.call_claude",
            new=AsyncMock(return_value="Should not be called"),
        ) as mock_market,
    ):
        state = {**valid_state, "hotel_name": "", "hotel_location": "", "additional_context": "Book me a room"}
        result = await graph.ainvoke(state)
        mock_market.assert_not_called()

    assert result["query_type"] == "irrelevant"
    assert result["revenue_plan"] is None


@pytest.mark.asyncio
async def test_graph_stops_at_insufficient(valid_state):
    """Graph must terminate early when input is insufficient."""
    from app.core.langgraph.revenue_graph import build_revenue_graph

    graph = build_revenue_graph()

    with patch(
        "app.core.langgraph.revenue_nodes.router.call_claude",
        new=AsyncMock(return_value='{"query_type": "insufficient", "error_message": "Missing ADR"}'),
    ):
        state = {**valid_state, "current_adr": "", "historical_occupancy": ""}
        result = await graph.ainvoke(state)

    assert result["query_type"] == "insufficient"
    assert result["revenue_plan"] is None
