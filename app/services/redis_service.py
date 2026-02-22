"""Redis caching service for the revenue optimization pipeline.

Provides async get/set with SHA-256-based cache keys and configurable TTL.
Falls back gracefully if Redis is unavailable (returns None on get, no-op on set).
"""

import hashlib
import json
import os
from typing import Any, Optional

import redis.asyncio as aioredis

from app.core.logging import logger

# Read config at module level so tests can patch os.getenv
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))  # 1 hour default


class RedisService:
    """Async Redis client wrapper for caching optimization results.

    Attributes:
        _client: The underlying async Redis client, or None if unavailable.
    """

    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None

    async def _get_client(self) -> Optional[aioredis.Redis]:
        """Lazily initialise and return the Redis client.

        Returns:
            An async Redis client, or None if the connection failed.
        """
        if self._client is not None:
            return self._client
        try:
            self._client = await aioredis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await self._client.ping()
            logger.info("redis_connected", url=REDIS_URL)
        except Exception as exc:  # pragma: no cover
            logger.warning("redis_unavailable", error=str(exc))
            self._client = None
        return self._client

    @staticmethod
    def build_cache_key(payload: dict) -> str:
        """Derive a deterministic cache key from request fields.

        Args:
            payload: A dict (typically OptimizeRequest.model_dump()).

        Returns:
            A hex string prefixed with ``optimize:``.
        """
        # Sort keys so the hash is stable regardless of dict insertion order
        serialised = json.dumps(payload, sort_keys=True)
        digest = hashlib.sha256(serialised.encode()).hexdigest()
        return f"optimize:{digest}"

    async def get(self, key: str) -> Optional[dict]:
        """Retrieve a cached JSON value.

        Args:
            key: The cache key returned by :meth:`build_cache_key`.

        Returns:
            Parsed dict if cache hit, else None.
        """
        client = await self._get_client()
        if client is None:
            return None
        try:
            raw = await client.get(key)
            if raw is None:
                logger.debug("cache_miss", key=key)
                return None
            logger.info("cache_hit", key=key)
            return json.loads(raw)
        except Exception as exc:  # pragma: no cover
            logger.warning("cache_get_error", key=key, error=str(exc))
            return None

    async def set(self, key: str, value: dict, ttl: int = CACHE_TTL_SECONDS) -> None:
        """Store a value as JSON with a TTL.

        Args:
            key: Cache key.
            value: A JSON-serialisable dict to persist.
            ttl: Time-to-live in seconds (default ``CACHE_TTL_SECONDS``).
        """
        client = await self._get_client()
        if client is None:
            return
        try:
            await client.setex(key, ttl, json.dumps(value))
            logger.info("cache_set", key=key, ttl=ttl)
        except Exception as exc:  # pragma: no cover
            logger.warning("cache_set_error", key=key, error=str(exc))

    async def close(self) -> None:
        """Close the underlying Redis connection."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None


# Module-level singleton — imported by optimize.py
redis_service = RedisService()
