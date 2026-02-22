"""Revenue optimization API endpoints.

Changes vs. original:
- JWT authentication added via ``get_current_session`` dependency.
- Redis cache lookup before invoking the LangGraph pipeline (GET) and
  cache write after completion (SET).
- Completed results are persisted to PostgreSQL via
  :class:`~app.services.optimization_history.OptimizationHistoryService`.
"""

import json

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)
from fastapi.responses import StreamingResponse

from app.api.v1.auth import get_current_session
from app.core.config import settings
from app.core.langgraph.revenue_graph import optimization_graph
from app.core.limiter import limiter
from app.core.logging import logger
from app.models.session import Session
from app.schemas.optimize import (
    OptimizeRequest,
    OptimizeResponse,
)
from app.services.optimization_history import optimization_history_service
from app.services.redis_service import redis_service

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
    session: Session = Depends(get_current_session),
) -> OptimizeResponse:
    """Run the multi-agent revenue optimization pipeline.

    Requires a valid JWT session token (``Authorization: Bearer <token>``).
    Results are cached in Redis for 1 hour and persisted to PostgreSQL.

    Args:
        request: FastAPI request (for rate limiting).
        optimize_request: Hotel details, context, and provider selection.
        session: Injected authenticated session (JWT-gated).

    Returns:
        OptimizeResponse: Full analysis from all agent nodes.
    """
    logger.info(
        "optimize_request_received",
        hotel_name=optimize_request.hotel_name,
        hotel_location=optimize_request.hotel_location,
        provider=optimize_request.provider,
        session_id=session.id,
        user_id=session.user_id,
    )

    # ── 1. Redis cache lookup ─────────────────────────────────────────────────
    cache_key = redis_service.build_cache_key(optimize_request.model_dump())
    cached = await redis_service.get(cache_key)
    if cached is not None:
        logger.info("optimize_cache_hit", cache_key=cache_key, user_id=session.user_id)
        return OptimizeResponse(**cached)

    # ── 2. Run the LangGraph pipeline ─────────────────────────────────────────
    try:
        initial_state = _build_initial_state(optimize_request)
        result = await optimization_graph.ainvoke(initial_state)
        response = OptimizeResponse(**result)

        logger.info(
            "optimize_request_completed",
            hotel_name=optimize_request.hotel_name,
            query_type=result.get("query_type"),
            provider=optimize_request.provider,
        )

        # ── 3. Persist to PostgreSQL ──────────────────────────────────────────
        try:
            optimization_history_service.save(
                user_id=session.user_id,
                hotel_name=optimize_request.hotel_name or "",
                hotel_location=optimize_request.hotel_location or "",
                provider=optimize_request.provider,
                response=response,
            )
        except Exception as db_err:
            # Non-fatal: log but don't fail the request
            logger.error("optimize_db_save_failed", error=str(db_err), exc_info=True)

        # ── 4. Write to Redis cache ───────────────────────────────────────────
        await redis_service.set(cache_key, response.model_dump())

        return response

    except Exception as e:
        logger.error("optimize_request_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/stream")
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS.get("optimize_stream", ["10 per minute"])[0])
async def optimize_stream(
    request: Request,
    optimize_request: OptimizeRequest,
    session: Session = Depends(get_current_session),
) -> StreamingResponse:
    """Stream the multi-agent revenue optimization pipeline events.

    Requires a valid JWT session token. Yields SSE events as each agent node
    completes, then saves the result to PostgreSQL and Redis.

    Args:
        request: FastAPI request (for rate limiting).
        optimize_request: Hotel details, context, and provider selection.
        session: Injected authenticated session (JWT-gated).

    Returns:
        StreamingResponse: SSE stream of agent events.
    """
    logger.info(
        "optimize_stream_request_received",
        hotel_name=optimize_request.hotel_name,
        provider=optimize_request.provider,
        session_id=session.id,
        user_id=session.user_id,
    )

    # ── 1. Redis cache lookup — emit result immediately if cached ─────────────
    cache_key = redis_service.build_cache_key(optimize_request.model_dump())
    cached = await redis_service.get(cache_key)
    if cached is not None:
        logger.info("optimize_stream_cache_hit", cache_key=cache_key)

        async def _cached_generator():
            # Replay all node events from the cached result
            _node_field_map = {
                "router": "query_type",
                "market_analyst": "market_analysis",
                "demand_forecaster": "demand_forecast",
                "pricing_strategist": "pricing_strategy",
                "revenue_manager": "revenue_plan",
            }
            for node, field in _node_field_map.items():
                payload = {"node": node, "data": cached.get(field, "") or ""}
                yield f"data: {json.dumps(payload)}\n\n"
            result_payload = {"type": "result", "result": cached}
            yield f"data: {json.dumps(result_payload)}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            _cached_generator(),
            media_type="text/event-stream",
            headers={"X-Accel-Buffering": "no"},
        )

    # ── 2. Live streaming pipeline ────────────────────────────────────────────
    initial_state = _build_initial_state(optimize_request)

    _NODE_DATA_FIELD = {
        "router": "query_type",
        "market_analyst": "market_analysis",
        "demand_forecaster": "demand_forecast",
        "pricing_strategist": "pricing_strategy",
        "revenue_manager": "revenue_plan",
    }

    # Capture user_id for closure (avoids potential session expiry mid-stream)
    _user_id = session.user_id

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

            # Build final response object
            response = OptimizeResponse(**final_state)
            result_payload = {
                "type": "result",
                "result": response.model_dump(),
            }
            yield f"data: {json.dumps(result_payload)}\n\n"
            yield "data: [DONE]\n\n"

            # ── 3. Persist + cache after stream ends ──────────────────────────
            try:
                optimization_history_service.save(
                    user_id=_user_id,
                    hotel_name=optimize_request.hotel_name or "",
                    hotel_location=optimize_request.hotel_location or "",
                    provider=optimize_request.provider,
                    response=response,
                )
            except Exception as db_err:
                logger.error("optimize_stream_db_save_failed", error=str(db_err), exc_info=True)

            await redis_service.set(cache_key, response.model_dump())

        except Exception as e:
            logger.error("optimize_stream_failed", error=str(e), exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )
