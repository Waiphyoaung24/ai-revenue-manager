"""Unit tests for revenue agent nodes."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture
def base_state():
    return {
        "raw_input": {},
        "hotel_name": "Centara Grand",
        "hotel_location": "Bangkok, Thailand",
        "current_adr": "4500",
        "historical_occupancy": "72%",
        "target_revpar": "3500",
        "additional_context": "Songkran season upcoming",
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
async def test_router_marks_valid(base_state):
    """Router must set query_type to 'valid' when all fields are present."""
    mock_response = '{"query_type": "valid", "error_message": null}'
    with patch("app.core.langgraph.revenue_nodes.router.call_claude", new=AsyncMock(return_value=mock_response)):
        from app.core.langgraph.revenue_nodes.router import run
        result = await run(base_state)
    assert result["query_type"] == "valid"
    assert result["error_message"] is None
    assert "router" in result["execution_times"]
    assert "router" in result["model_used"]


@pytest.mark.asyncio
async def test_router_marks_insufficient_when_fields_missing():
    """Router must set query_type to 'insufficient' when required fields are empty."""
    state = {
        "raw_input": {},
        "hotel_name": "",
        "hotel_location": "",
        "current_adr": "",
        "historical_occupancy": "",
        "target_revpar": "",
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
    mock_response = '{"query_type": "insufficient", "error_message": "Missing hotel name and ADR"}'
    with patch("app.core.langgraph.revenue_nodes.router.call_claude", new=AsyncMock(return_value=mock_response)):
        from app.core.langgraph.revenue_nodes.router import run
        result = await run(state)
    assert result["query_type"] == "insufficient"
    assert result["error_message"] is not None


@pytest.mark.asyncio
async def test_market_analyst_populates_analysis(base_state):
    """Market analyst node must populate market_analysis field."""
    mock_text = "## Market Analysis\nBangkok shows strong demand in Q1 (฿4,500 ADR competitive)."
    with patch("app.core.langgraph.revenue_nodes.market_analyst.call_claude", new=AsyncMock(return_value=mock_text)):
        from app.core.langgraph.revenue_nodes.market_analyst import run
        result = await run(base_state)
    assert result["market_analysis"] == mock_text
    assert "market_analyst" in result["execution_times"]
    assert "market_analyst" in result["model_used"]


@pytest.mark.asyncio
async def test_demand_forecaster_populates_forecast(base_state):
    """Demand forecaster must populate demand_forecast field."""
    state = {**base_state, "market_analysis": "Strong Bangkok demand."}
    mock_text = "## Demand Forecast\nOccupancy will peak at 85% during Songkran."
    with patch(
        "app.core.langgraph.revenue_nodes.demand_forecaster.call_claude", new=AsyncMock(return_value=mock_text)
    ):
        from app.core.langgraph.revenue_nodes.demand_forecaster import run
        result = await run(state)
    assert result["demand_forecast"] == mock_text
    assert "demand_forecaster" in result["model_used"]


@pytest.mark.asyncio
async def test_pricing_strategist_populates_strategy(base_state):
    """Pricing strategist must populate pricing_strategy field."""
    state = {**base_state, "market_analysis": "Strong demand.", "demand_forecast": "High occupancy expected."}
    mock_text = "## Pricing Strategy\nRaise ADR by 15% to ฿5,175 during peak."
    with patch(
        "app.core.langgraph.revenue_nodes.pricing_strategist.call_claude", new=AsyncMock(return_value=mock_text)
    ):
        from app.core.langgraph.revenue_nodes.pricing_strategist import run
        result = await run(state)
    assert result["pricing_strategy"] == mock_text
    assert "pricing_strategist" in result["model_used"]


@pytest.mark.asyncio
async def test_revenue_manager_populates_plan(base_state):
    """Revenue manager must populate revenue_plan field."""
    state = {
        **base_state,
        "market_analysis": "Strong demand.",
        "demand_forecast": "High occupancy.",
        "pricing_strategy": "Raise ADR.",
    }
    mock_text = "## Revenue Plan\n* Raise ADR by ฿700\n* Target 85% occupancy"
    with patch(
        "app.core.langgraph.revenue_nodes.revenue_manager.call_claude", new=AsyncMock(return_value=mock_text)
    ):
        from app.core.langgraph.revenue_nodes.revenue_manager import run
        result = await run(state)
    assert result["revenue_plan"] == mock_text
    assert "revenue_manager" in result["execution_times"]
