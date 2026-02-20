"""Revenue Manager node — synthesizes all analyses into an actionable revenue plan."""

import time

from app.schemas.revenue import AgentState
from app.services.llm_provider import (
    call_llm,
    get_model_for_node,
)

SYSTEM_PROMPT = """You are the head of revenue management for a Thai hotel group.
Synthesize all analyses into an actionable plan:
1. Executive Summary (3 bullet points)
2. Week-by-Week Action Plan (4 weeks)
3. KPIs to track (ADR in ฿, Occupancy %, RevPAR in ฿)
4. Risk mitigation steps

Express all monetary values in Thai Baht (฿ / THB). Do not use USD or other currencies.
Be concise, specific, and actionable. Output structured markdown."""


async def run(state: AgentState) -> AgentState:
    """Create the final revenue management plan from all agent outputs."""
    start = time.time()
    provider = state.get("provider", "anthropic")
    model = get_model_for_node(provider, "revenue_manager")

    user_message = f"""Hotel: {state['hotel_name']} in {state['hotel_location']}
Current ADR: {state['current_adr']} | Target RevPAR: {state['target_revpar']}

Market Analysis: {state.get('market_analysis', 'N/A')}
Demand Forecast: {state.get('demand_forecast', 'N/A')}
Pricing Strategy: {state.get('pricing_strategy', 'N/A')}

Create the final revenue management plan."""

    result = await call_llm(system=SYSTEM_PROMPT, user=user_message, model=model, provider=provider)

    return {
        **state,
        "revenue_plan": result,
        "execution_times": {**state.get("execution_times", {}), "revenue_manager": round(time.time() - start, 2)},
        "model_used": {**state.get("model_used", {}), "revenue_manager": f"{provider}/{model}"},
    }
