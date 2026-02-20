"""Pricing Strategist node — recommends optimal ADR and rate strategy."""

import time

from app.schemas.revenue import AgentState
from app.services.llm_provider import (
    call_llm,
    get_model_for_node,
)

SYSTEM_PROMPT = """You are a hotel pricing strategist specializing in the Thai market.
Using demand forecasts and market data:
1. Recommend optimal ADR adjustments by segment (FIT, corporate, OTA, direct)
2. Define rate fencing strategy (length of stay, advance purchase restrictions)
3. Suggest promotional periods and discount levels for Agoda/Booking.com/Line Travel
4. Identify upsell and ancillary revenue opportunities

Express all monetary values in Thai Baht (฿ / THB). Do not use USD or other currencies.
Output structured markdown with specific price points in ฿."""


async def run(state: AgentState) -> AgentState:
    """Develop a pricing strategy based on demand forecast and market data."""
    start = time.time()
    provider = state.get("provider", "anthropic")
    model = get_model_for_node(provider, "pricing_strategist")

    user_message = f"""Hotel: {state['hotel_name']} in {state['hotel_location']}
Current ADR: {state['current_adr']} | Target RevPAR: {state['target_revpar']}

Market Analysis:
{state.get('market_analysis', 'N/A')}

Demand Forecast:
{state.get('demand_forecast', 'N/A')}

Develop a comprehensive pricing strategy."""

    result = await call_llm(system=SYSTEM_PROMPT, user=user_message, model=model, provider=provider)

    return {
        **state,
        "pricing_strategy": result,
        "execution_times": {**state.get("execution_times", {}), "pricing_strategist": round(time.time() - start, 2)},
        "model_used": {**state.get("model_used", {}), "pricing_strategist": f"{provider}/{model}"},
    }
