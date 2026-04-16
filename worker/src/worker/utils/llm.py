"""LLM API wrappers for the AI worker.

Model tier strategy (per PRD):
- Ingestion (URL → clean text): Cheap (Haiku / GPT-4o-mini)
- Extraction (text → claims): Mid (Sonnet / GPT-4o)
- Briefing (memories → brief): Strong (Sonnet-4.6 / GPT-4o)
- Recall (query → answer): Mid (Sonnet) + embedding search
"""

import os
from typing import Optional
from anthropic import Anthropic
from openai import OpenAI


def get_anthropic_client() -> Anthropic:
    return Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def get_openai_client() -> OpenAI:
    return OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


async def call_claude(
    prompt: str,
    system: Optional[str] = None,
    model: str = "claude-sonnet-4-6-20250514",
    max_tokens: int = 4096,
) -> str:
    """Call Claude API with the given prompt."""
    client = get_anthropic_client()
    kwargs: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        kwargs["system"] = system

    response = client.messages.create(**kwargs)
    return response.content[0].text


async def call_openai(
    prompt: str,
    system: Optional[str] = None,
    model: str = "gpt-4o",
    max_tokens: int = 4096,
) -> str:
    """Call OpenAI API with the given prompt."""
    client = get_openai_client()
    kwargs: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [],
    }
    if system:
        kwargs["messages"].append({"role": "system", "content": system})
    kwargs["messages"].append({"role": "user", "content": prompt})

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


async def generate_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """Generate embedding vector for the given text."""
    client = get_openai_client()
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding
