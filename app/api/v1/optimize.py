"""Revenue optimization API endpoints."""

import json

from fastapi import (
    APIRouter,
    HTTPException,
    Request,
)
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.langgraph.revenue_graph import optimization_graph
from app.core.limiter import limiter
from app.core.logging import logger
from app.schemas.optimize import (
    OptimizeRequest,
    OptimizeResponse,
)

router = APIRouter()


def _build_initial_state(request: OptimizeRequest) -> dict:
    """Build the initial AgentState from an OptimizeRequest."""
    return {
        "raw_input": request.model_dump(),
        "hotel_name": request.hotel_name or "",
        "hotel_location": request.hotel_location or "",
        "current_adr": request.current_adr or "",
        "historical_occupancy": request.historical_occupancy or "",
        "target_revpar": request.target_revpar or "",
        "additional_context": request.additional_context or "",
        # Provider is propagated through all nodes
        "provider": request.provider,
        "query_type": "valid",
        "error_message": None,
        "market_analysis": None,
        "demand_forecast": None,
        "pricing_strategy": None,
        "revenue_plan": None,
        "execution_times": {},
        "model_used": {},
    }


@router.post("/optimize", response_model=OptimizeResponse)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS.get("optimize", ["10 per minute"])[0])
async def optimize(
    request: Request,
    optimize_request: OptimizeRequest,
) -> OptimizeResponse:
    """Run the multi-agent revenue optimization pipeline.

    Args:
        request: FastAPI request (for rate limiting).
        optimize_request: Hotel details, context, and provider selection.

    Returns:
        OptimizeResponse: Full analysis from all agent nodes.
    """
    logger.info(
        "optimize_request_received",
        hotel_name=optimize_request.hotel_name,
        hotel_location=optimize_request.hotel_location,
        provider=optimize_request.provider,
    )
    try:
        initial_state = _build_initial_state(optimize_request)
        result = await optimization_graph.ainvoke(initial_state)
        logger.info(
            "optimize_request_completed",
            hotel_name=optimize_request.hotel_name,
            query_type=result.get("query_type"),
            provider=optimize_request.provider,
        )
        return OptimizeResponse(**result)
    except Exception as e:
        logger.error("optimize_request_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/stream")
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS.get("optimize_stream", ["10 per minute"])[0])
async def optimize_stream(
    request: Request,
    optimize_request: OptimizeRequest,
) -> StreamingResponse:
    """Stream the multi-agent revenue optimization pipeline events.

    Yields SSE events as each agent node completes.

    Args:
        request: FastAPI request (for rate limiting).
        optimize_request: Hotel details, context, and provider selection.

    Returns:
        StreamingResponse: SSE stream of agent events.
    """
    logger.info(
        "optimize_stream_request_received",
        hotel_name=optimize_request.hotel_name,
        provider=optimize_request.provider,
    )
    initial_state = _build_initial_state(optimize_request)

    _NODE_DATA_FIELD = {
        "router": "query_type",
        "market_analyst": "market_analysis",
        "demand_forecaster": "demand_forecast",
        "pricing_strategist": "pricing_strategy",
        "revenue_manager": "revenue_plan",
    }

    async def event_generator():
        """Yield SSE events as each agent node completes."""
        final_state: dict = dict(initial_state)
        try:
            async for event in optimization_graph.astream_events(initial_state, version="v2"):
                if event["event"] == "on_chain_end" and event.get("name") in {
                    "router",
                    "market_analyst",
                    "demand_forecaster",
                    "pricing_strategist",
                    "revenue_manager",
                }:
                    node_name = event.get("name")
                    output = event.get("data", {}).get("output", {})
                    if isinstance(output, dict):
                        final_state.update(output)
                    field = _NODE_DATA_FIELD.get(node_name, "")
                    data = output.get(field, "") if isinstance(output, dict) else str(output)
                    payload = {
                        "node": node_name,
                        "data": data or "",
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
            # Emit the complete result so the client doesn't need a second request
            result_payload = {
                "type": "result",
                "result": OptimizeResponse(**final_state).model_dump(),
            }
            yield f"data: {json.dumps(result_payload)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error("optimize_stream_failed", error=str(e), exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )
