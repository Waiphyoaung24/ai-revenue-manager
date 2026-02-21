"""Router node — classifies hotel revenue optimization inputs."""

import json
import time

from app.core.logging import logger
from app.schemas.revenue import AgentState
from app.services.llm_provider import (
    call_llm,
    get_model_for_node,
)

SYSTEM_PROMPT = """You are an input classifier for a hotel revenue optimization system operating in Thailand.

Classify the request into one of:
- "valid": has hotel name, location, ADR, and occupancy
- "irrelevant": unrelated to hotel revenue (e.g., booking rooms, restaurant queries)
- "booking": attempting to make a hotel reservation
- "insufficient": missing key fields (hotel name, ADR, or occupancy)

Respond ONLY with valid JSON: {"query_type": "<type>", "error_message": "<message or null>"}"""


async def run(state: AgentState) -> AgentState:
    """Classify the input and route to the appropriate next node."""
    start = time.time()
    provider = state.get("provider", "anthropic")
    model = get_model_for_node(provider, "router")

    user_message = f"""Hotel Name: {state['hotel_name']}
Location: {state['hotel_location']}
Current ADR: {state['current_adr']}
Historical Occupancy: {state['historical_occupancy']}
Target RevPAR: {state['target_revpar']}
Additional Context: {state.get('additional_context', '')}

Classify this input."""

    raw = await call_llm(
        system=SYSTEM_PROMPT,
        user=user_message,
        model=model,
        provider=provider,
        max_tokens=2048,
        json_mode=True,
    )

    try:
        # Strip markdown code fences if present (some models wrap JSON in ```json)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        parsed = json.loads(cleaned)
        query_type = parsed.get("query_type", "insufficient")
        error_message = parsed.get("error_message")
    except (json.JSONDecodeError, KeyError):
        logger.warning("router_json_parse_failed", raw=raw, provider=provider)
        query_type = "insufficient"
        error_message = "Could not classify input."

    return {
        **state,
        "query_type": query_type,
        "error_message": error_message,
        "execution_times": {**state.get("execution_times", {}), "router": round(time.time() - start, 2)},
        "model_used": {**state.get("model_used", {}), "router": f"{provider}/{model}"},
    }
