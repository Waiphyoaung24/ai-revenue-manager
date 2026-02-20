"""Demand Forecaster node — forecasts occupancy and RevPAR trajectory."""

import time

from app.schemas.revenue import AgentState
from app.services.llm_provider import (
    call_llm,
    get_model_for_node,
)

SYSTEM_PROMPT = """You are a hotel demand forecasting specialist with deep expertise in Thai tourism patterns.
Using market analysis and hotel data:
1. Forecast occupancy trends for next 30/60/90 days
2. Identify demand drivers (Songkran, Loy Krathong, Chinese New Year, MICE events, OTA trends)
3. Predict RevPAR trajectory
4. Flag risk periods (low season, competitor promotions)

Express all monetary values in Thai Baht (฿ / THB). Do not use USD or other currencies.
Output structured markdown with clear sections."""


async def run(state: AgentState) -> AgentState:
    """Forecast demand based on market analysis and hotel data."""
    start = time.time()
    provider = state.get("provider", "anthropic")
    model = get_model_for_node(provider, "demand_forecaster")

    user_message = f"""Hotel: {state['hotel_name']} in {state['hotel_location']}
Current ADR: {state['current_adr']} | Occupancy: {state['historical_occupancy']}
Target RevPAR: {state['target_revpar']}

Market Analysis:
{state.get('market_analysis', 'No market analysis available.')}

Provide a detailed demand forecast."""

    result = await call_llm(system=SYSTEM_PROMPT, user=user_message, model=model, provider=provider)

    return {
        **state,
        "demand_forecast": result,
        "execution_times": {**state.get("execution_times", {}), "demand_forecaster": round(time.time() - start, 2)},
        "model_used": {**state.get("model_used", {}), "demand_forecaster": f"{provider}/{model}"},
    }
