"""LLM API wrappers for the AI worker.

Uses Google Gemini via AI Studio API key.
Model tier strategy (per PRD):
- Ingestion (URL → clean text): gemini-3-flash-preview (fast)
- Extraction (text → claims): gemini-3-flash-preview (balanced)
- Briefing (memories → brief): gemini-3-flash-preview (balanced)
"""

import json
import os
import httpx

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


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
) -> str:
    """Call Google Gemini API."""
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

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    candidates = data.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        if parts:
            return parts[0].get("text", "")

    raise ValueError("Empty response from Gemini")


async def call_llm(
    prompt: str,
    system: str | None = None,
    model: str = "gemini-3-flash-preview",
    max_tokens: int = 4096,
) -> str:
    """Generic LLM call — currently backed by Gemini."""
    return await call_gemini(prompt=prompt, system=system, model=model, max_tokens=max_tokens)


async def generate_embedding(text: str, model: str = "text-embedding-004") -> list[float]:
    """Generate embedding vector using Gemini embedding model."""
    api_key = _get_api_key()

    url = f"{GEMINI_BASE}/{model}:embedContent?key={api_key}"
    payload = {"model": f"models/{model}", "content": {"parts": [{"text": text}]}}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    return data.get("embedding", {}).get("values", [])
