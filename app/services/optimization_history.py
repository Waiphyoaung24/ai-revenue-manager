"""Service for persisting and querying optimization records.

Wraps raw SQLModel/SQLAlchemy operations so endpoints stay thin.
"""

import json
from typing import List, Optional

from sqlmodel import Session, select

from app.core.logging import logger
from app.models.optimization import OptimizationRecord
from app.schemas.optimize import OptimizeResponse
from app.services.database import database_service


class OptimizationHistoryService:
    """CRUD operations for :class:`~app.models.optimization.OptimizationRecord`."""

    def save(
        self,
        user_id: int,
        hotel_name: str,
        hotel_location: str,
        provider: str,
        response: OptimizeResponse,
    ) -> OptimizationRecord:
        """Persist a completed optimization run.

        Args:
            user_id: ID of the authenticated user.
            hotel_name: Hotel name from the request.
            hotel_location: Hotel location from the request.
            provider: LLM provider string (``anthropic`` or ``gemini``).
            response: The full :class:`~app.schemas.optimize.OptimizeResponse`.

        Returns:
            The newly created :class:`~app.models.optimization.OptimizationRecord`.
        """
        record = OptimizationRecord(
            user_id=user_id,
            hotel_name=hotel_name,
            hotel_location=hotel_location,
            provider=provider,
            query_type=response.query_type,
            error_message=response.error_message,
            market_analysis=response.market_analysis,
            demand_forecast=response.demand_forecast,
            pricing_strategy=response.pricing_strategy,
            revenue_plan=response.revenue_plan,
            execution_times_json=json.dumps(response.execution_times),
            model_used_json=json.dumps(response.model_used),
        )
        with Session(database_service.engine) as session:
            session.add(record)
            session.commit()
            session.refresh(record)
            logger.info(
                "optimization_saved",
                record_id=record.id,
                user_id=user_id,
                hotel_name=hotel_name,
            )
        return record

    def list_for_user(
        self,
        user_id: int,
        limit: int = 20,
        offset: int = 0,
    ) -> List[OptimizationRecord]:
        """Return paginated optimization records for a user, newest first.

        Args:
            user_id: Authenticated user's ID.
            limit: Maximum number of records to return (default 20).
            offset: Number of records to skip for pagination (default 0).

        Returns:
            List of :class:`~app.models.optimization.OptimizationRecord` rows.
        """
        with Session(database_service.engine) as session:
            statement = (
                select(OptimizationRecord)
                .where(OptimizationRecord.user_id == user_id)
                .order_by(OptimizationRecord.created_at.desc())  # type: ignore[arg-type]
                .offset(offset)
                .limit(limit)
            )
            return list(session.exec(statement).all())

    def get_by_id(
        self,
        record_id: int,
        user_id: int,
    ) -> Optional[OptimizationRecord]:
        """Fetch a single record, enforcing ownership.

        Args:
            record_id: Primary key of the record.
            user_id: Must match the record's ``user_id`` (ownership check).

        Returns:
            The record or None if not found / not owned by this user.
        """
        with Session(database_service.engine) as session:
            record = session.get(OptimizationRecord, record_id)
            if record is None or record.user_id != user_id:
                return None
            return record


# Module-level singleton
optimization_history_service = OptimizationHistoryService()
