"""LLM API wrappers for the AI worker.

Uses Google Gemini via AI Studio API key.
Default model: gemini-2.5-flash (fast, available, good quality)
Embeddings: sentence-transformers/all-MiniLM-L6-v2 (local, 384-dim)
"""

import json
import os
import httpx
from sentence_transformers import SentenceTransformer
from .logging import logger

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

# Lazy-load embedding model (singleton pattern)
_embedding_model: SentenceTransformer | None = None


def _get_api_key() -> str:
    """Get API key from environment (lazy load)."""
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError("GEMINI_API_KEY must be set")
    return key


async def call_gemini(
    prompt: str,
    system: str | None = None,
    model: str = "gemini-2.5-flash",
    max_tokens: int = 4096,
    max_retries: int = 3,
) -> str:
    """Call Google Gemini API with retry on transient errors."""
    api_key = _get_api_key()

    contents = []
    if system:
        contents.append({"role": "user", "parts": [{"text": system}]})
        contents.append({"role": "model", "parts": [{"text": "Understood."}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.3,
        },
    }

    url = f"{GEMINI_BASE}/{model}:generateContent?key={api_key}"

    last_error = None
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 503:
                    wait_time = 2 ** (attempt + 1)
                    logger.warning("gemini_503_retry", attempt=attempt + 1, wait=wait_time)
                    import asyncio
                    await asyncio.sleep(wait_time)
                    continue
                resp.raise_for_status()
                data = resp.json()

            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")

            raise ValueError("Empty response from Gemini")
        except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
            last_error = e
            if attempt < max_retries - 1:
                wait_time = 2 ** (attempt + 1)
                logger.warning("gemini_retry", attempt=attempt + 1, error=str(e), wait=wait_time)
                import asyncio
                await asyncio.sleep(wait_time)

    raise last_error


async def call_llm(
    prompt: str,
    system: str | None = None,
    model: str = "gemini-3-flash-preview",
    max_tokens: int = 4096,
) -> str:
    """Generic LLM call — currently backed by Gemini.

    Falls back to gemini-2.5-flash if the primary model returns 503.
    """
    try:
        return await call_gemini(prompt=prompt, system=system, model=model, max_tokens=max_tokens)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 503 and model != "gemini-2.5-flash":
            logger.warning("llm_fallback", original_model=model, reason="503")
            return await call_gemini(prompt=prompt, system=system, model="gemini-2.5-flash", max_tokens=max_tokens)
        raise


def _get_embedding_model() -> SentenceTransformer:
    """Get or initialize the embedding model (singleton)."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _embedding_model


async def generate_embedding(text: str) -> list[float]:
    """Generate embedding vector using local sentence-transformers model.

    Uses all-MiniLM-L6-v2 which produces 384-dimensional vectors.
    This is a lightweight model optimized for semantic similarity.
    """
    model = _get_embedding_model()
    # encode() returns numpy array, convert to list
    embedding = model.encode(text, convert_to_tensor=False)
    return embedding.tolist()
