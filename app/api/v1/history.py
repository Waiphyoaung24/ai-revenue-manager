"""GET /history — paginated list of past optimization runs for the current user."""

import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.core.limiter import limiter
from app.core.logging import logger
from app.models.optimization import OptimizationRecord
from app.models.user import User
from app.schemas.optimize import OptimizeResponse
from app.services.optimization_history import optimization_history_service

router = APIRouter()


def _record_to_response(record: OptimizationRecord) -> Dict[str, Any]:
    """Serialize an OptimizationRecord to a JSON-friendly dict.

    Args:
        record: The DB record to serialize.

    Returns:
        A dict suitable for the API response.
    """
    return {
        "id": record.id,
        "hotel_name": record.hotel_name,
        "hotel_location": record.hotel_location,
        "provider": record.provider,
        "query_type": record.query_type,
        "error_message": record.error_message,
        "market_analysis": record.market_analysis,
        "demand_forecast": record.demand_forecast,
        "pricing_strategy": record.pricing_strategy,
        "revenue_plan": record.revenue_plan,
        "execution_times": json.loads(record.execution_times_json or "{}"),
        "model_used": json.loads(record.model_used_json or "{}"),
        "created_at": record.created_at.isoformat(),
    }


@router.get("/history")
@limiter.limit("30 per minute")
async def get_optimization_history(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100, description="Records per page"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return paginated optimization history for the authenticated user.

    Args:
        request: FastAPI request (for rate limiting).
        limit: Number of records per page (1–100).
        offset: How many records to skip.
        current_user: Injected authenticated user.

    Returns:
        A dict with ``items`` list and ``total`` count.
    """
    try:
        records = optimization_history_service.list_for_user(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
        )
        items = [_record_to_response(r) for r in records]
        logger.info(
            "history_retrieved",
            user_id=current_user.id,
            count=len(items),
            offset=offset,
        )
        return {"items": items, "count": len(items), "offset": offset, "limit": limit}
    except Exception as e:
        logger.error("history_retrieval_failed", user_id=current_user.id, error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{record_id}")
async def get_optimization_detail(
    record_id: int,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return a single optimization record by ID (ownership enforced).

    Args:
        record_id: The primary key of the OptimizationRecord.
        current_user: Injected authenticated user.

    Returns:
        The serialized record dict.

    Raises:
        HTTPException 404 if not found or not owned by this user.
    """
    record = optimization_history_service.get_by_id(record_id, current_user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="Optimization record not found")
    return _record_to_response(record)
