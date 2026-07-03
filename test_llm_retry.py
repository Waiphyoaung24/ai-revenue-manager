"""Check that _is_retryable classifies transient vs permanent LLM errors correctly."""

import anthropic
from google.genai import errors as genai_errors

from app.services.llm_provider import _is_retryable


def test_is_retryable():
    # Retryable: 5xx, 429, connection errors
    assert _is_retryable(genai_errors.ServerError(503, {})) is True
    assert _is_retryable(genai_errors.ServerError(500, {})) is True
    assert _is_retryable(genai_errors.ClientError(429, {})) is True
    assert _is_retryable(anthropic.APIConnectionError(request=None)) is True

    # NOT retryable: bad key / bad model / bad request
    assert _is_retryable(genai_errors.ClientError(400, {})) is False
    assert _is_retryable(genai_errors.ClientError(404, {})) is False
    assert _is_retryable(genai_errors.ClientError(403, {})) is False
    assert _is_retryable(ValueError("nonsense")) is False


if __name__ == "__main__":
    test_is_retryable()
    print("ok")
