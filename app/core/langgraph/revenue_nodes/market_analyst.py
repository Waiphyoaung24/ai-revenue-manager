"""Market Analyst node — analyzes competitive positioning and market conditions."""

import time

from app.schemas.revenue import AgentState
from app.services.llm_provider import (
    call_llm,
    get_model_for_node,
)

SYSTEM_PROMPT = """You are a hotel market analyst specializing in the Thai hospitality market.
Given hotel details, analyze:
1. Competitive positioning based on location and ADR
2. Demand pattern indicators (Songkran, high season Nov-Feb, MICE events)
3. Market opportunities and threats
4. External factors (seasonality, Agoda/Booking.com trends, economic conditions)

Express all monetary values in Thai Baht (฿ / THB). Do not use USD or other currencies.
Be specific and data-driven. Output structured markdown."""


async def run(state: AgentState) -> AgentState:
    """Analyze market conditions for the hotel."""
    start = time.time()
    provider = state.get("provider", "anthropic")
    model = get_model_for_node(provider, "market_analyst")

    user_message = f"""Hotel: {state['hotel_name']} in {state['hotel_location']}
Current ADR: {state['current_adr']}
Historical Occupancy: {state['historical_occupancy']}
Target RevPAR: {state['target_revpar']}
Context: {state.get('additional_context', 'None provided')}

Provide a thorough market analysis."""

    result = await call_llm(system=SYSTEM_PROMPT, user=user_message, model=model, provider=provider)

    return {
        **state,
        "market_analysis": result,
        "execution_times": {**state.get("execution_times", {}), "market_analyst": round(time.time() - start, 2)},
        "model_used": {**state.get("model_used", {}), "market_analyst": f"{provider}/{model}"},
    }
