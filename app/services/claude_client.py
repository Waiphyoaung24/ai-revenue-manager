"""Claude async client for revenue optimization agents."""

import anthropic

from app.core.config import settings
from app.core.logging import logger

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def call_claude(
    system: str,
    user: str,
    model: str = "claude-haiku-4-5-20251001",
    max_tokens: int = 2048,
) -> str:
    """Call the Claude API with the given system and user messages.

    Args:
        system: The system prompt.
        user: The user message.
        model: The Claude model ID to use.
        max_tokens: Maximum tokens to generate.

    Returns:
        str: The text response from Claude.
    """
    logger.debug("claude_client_call", model=model, max_tokens=max_tokens)
    message = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text
