"""Unified LLM provider abstraction for Anthropic Claude and Google Gemini.

Allows the multi-agent revenue pipeline to call either provider
transparently. The provider is selected at request time based on
the ``provider`` field in ``OptimizeRequest``.

Uses:
- anthropic SDK for Claude (Haiku / Sonnet)
- google-genai SDK (new) for Gemini (Flash / Pro)
"""

from __future__ import annotations

from typing import Literal

import anthropic
from google import genai
from google.genai import types as genai_types

from app.core.config import settings
from app.core.logging import logger

# ──────────────────────────────────────────────
# Provider type
# ──────────────────────────────────────────────

ProviderName = Literal["anthropic", "gemini"]

# ──────────────────────────────────────────────
# Lazy-initialised singleton clients
# ──────────────────────────────────────────────

_anthropic_client: anthropic.AsyncAnthropic | None = None
_gemini_client: genai.Client | None = None


def _get_anthropic_client() -> anthropic.AsyncAnthropic:
    """Return (and lazily create) the shared Anthropic async client."""
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _anthropic_client


def _get_gemini_client() -> genai.Client:
    """Return (and lazily create) the shared Gemini client."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _gemini_client


# ──────────────────────────────────────────────
# Per-node model resolution
# ──────────────────────────────────────────────

_NODE_MODEL_MAP: dict[str, dict[str, str]] = {
    "anthropic": {
        "router": settings.REVENUE_ROUTER_MODEL,
        "market_analyst": settings.REVENUE_ANALYST_MODEL,
        "demand_forecaster": settings.REVENUE_FORECASTER_MODEL,
        "pricing_strategist": settings.REVENUE_STRATEGIST_MODEL,
        "revenue_manager": settings.REVENUE_MANAGER_MODEL,
    },
    "gemini": {
        "router": settings.GEMINI_ROUTER_MODEL,
        "market_analyst": settings.GEMINI_ANALYST_MODEL,
        "demand_forecaster": settings.GEMINI_FORECASTER_MODEL,
        "pricing_strategist": settings.GEMINI_STRATEGIST_MODEL,
        "revenue_manager": settings.GEMINI_MANAGER_MODEL,
    },
}


def get_model_for_node(provider: ProviderName, node_role: str) -> str:
    """Return the configured model ID for a given provider + node role."""
    return _NODE_MODEL_MAP.get(provider, {}).get(node_role, "")


# ──────────────────────────────────────────────
# Unified async call
# ──────────────────────────────────────────────


async def call_llm(
    *,
    system: str,
    user: str,
    model: str,
    provider: ProviderName = "anthropic",
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> str:
    """Call the specified LLM provider with system + user messages.

    Args:
        system: System / instruction prompt.
        user: User turn message.
        model: Model identifier string appropriate for the provider.
        provider: "anthropic" or "gemini".
        max_tokens: Maximum tokens to generate.

    Returns:
        str: Plain-text response from the model.
    """
    logger.debug("llm_provider_call", provider=provider, model=model, max_tokens=max_tokens)

    if provider == "anthropic":
        return await _call_anthropic(system=system, user=user, model=model, max_tokens=max_tokens)
    elif provider == "gemini":
        return await _call_gemini(system=system, user=user, model=model, max_tokens=max_tokens, json_mode=json_mode)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider!r}. Must be 'anthropic' or 'gemini'.")


# ──────────────────────────────────────────────
# Provider implementations
# ──────────────────────────────────────────────


async def _call_anthropic(*, system: str, user: str, model: str, max_tokens: int) -> str:
    """Async call to Anthropic Messages API."""
    client = _get_anthropic_client()
    message = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


async def _call_gemini(*, system: str, user: str, model: str, max_tokens: int, json_mode: bool = False) -> str:
    """Async call to Google Gemini via the new google-genai SDK.

    The new SDK uses ``client.aio.models.generate_content`` for async requests.
    System instruction is passed via ``GenerateContentConfig``.
    """
    client = _get_gemini_client()
    config = genai_types.GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=max_tokens,
        temperature=0.3,
        response_mime_type="application/json" if json_mode else None,
    )
    response = await client.aio.models.generate_content(
        model=model,
        contents=user,
        config=config,
    )
    return response.text
