"""Job handlers for the AI worker.

Each handler processes a specific job type:
- echo: Test job (returns input as output)
- ingestion: URL → clean text extraction
- extraction: Text → structured claims/memories
- briefing: Memories → research brief
- signal: Keyword/topic matching
"""

import json
from typing import Any

from ..utils.llm import call_claude, call_openai, generate_embedding
from ..utils.logging import logger


async def handle_echo(input_data: dict[str, Any]) -> dict[str, Any]:
    """Test job handler - echoes input back."""
    return {"echo": input_data}


async def handle_ingestion(input_data: dict[str, Any]) -> dict[str, Any]:
    """Ingestion job - extracts clean text from URL content.

    Input: {"url": "...", "raw_content": "..."}
    Output: {"title": "...", "content": "...", "summary": "..."}
    """
    url = input_data.get("url", "")
    raw_content = input_data.get("raw_content", "")

    if not raw_content:
        raise ValueError("raw_content is required")

    prompt = f"""Extract the main content from the following web page.
Remove all navigation, ads, footers, and boilerplate.
Return the title and clean article content.

URL: {url}

Raw content:
{raw_content[:10000]}

Return JSON with keys: title, content, summary (1-2 sentence summary)"""

    response = await call_claude(
        prompt=prompt,
        system="You are a content extraction assistant. Always respond with valid JSON.",
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
    )

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        result = {"title": "", "content": response, "summary": ""}

    logger.info("ingestion_complete", url=url, title=result.get("title", ""))
    return result


async def handle_extraction(input_data: dict[str, Any]) -> dict[str, Any]:
    """Extraction job - extracts structured claims from content.

    Input: {"content": "...", "capture_id": "..."}
    Output: {"memories": [{"content": "...", "memory_type": "claim", "confidence": 0.9}]}
    """
    content = input_data.get("content", "")
    capture_id = input_data.get("capture_id", "")

    if not content:
        raise ValueError("content is required")

    prompt = f"""Analyze the following content and extract key knowledge claims.
For each claim, identify:
1. The claim itself (factual statement or insight)
2. Type: claim, insight, entity, or summary
3. Confidence level (0.0-1.0)

Content:
{content[:8000]}

Return JSON array of objects with keys: content, memory_type, confidence"""

    response = await call_claude(
        prompt=prompt,
        system="You are a knowledge extraction assistant. Extract verifiable claims. Always respond with valid JSON array.",
        model="claude-sonnet-4-6-20250514",
        max_tokens=4096,
    )

    try:
        # Try to parse as JSON array
        memories = json.loads(response)
        if not isinstance(memories, list):
            memories = [memories]
    except json.JSONDecodeError:
        memories = [{"content": response, "memory_type": "note", "confidence": 0.5}]

    # Generate embeddings for each memory
    for memory in memories:
        text = memory.get("content", "")
        if text:
            try:
                embedding = await generate_embedding(text)
                memory["embedding"] = embedding[:10]  # Store first 10 dims as placeholder
            except Exception as e:
                logger.warning("embedding_failed", error=str(e))

    logger.info(
        "extraction_complete",
        capture_id=capture_id,
        memory_count=len(memories),
    )
    return {"memories": memories}


async def handle_briefing(input_data: dict[str, Any]) -> dict[str, Any]:
    """Briefing job - generates a research brief from memories.

    Input: {"project_id": "...", "memories": [...]}
    Output: {"title": "...", "content": "..."}
    """
    project_id = input_data.get("project_id", "")
    memories = input_data.get("memories", [])

    if not memories:
        raise ValueError("memories are required")

    memory_texts = "\n".join(
        f"- [{m.get('memory_type', 'note')}] {m.get('content', '')}"
        for m in memories[:50]  # Limit to 50 memories
    )

    prompt = f"""Generate a research brief based on the following memories from a research project.
Structure the brief as:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points)
3. Evidence Gaps (what's missing)
4. Recommendations (next steps)

Memories:
{memory_texts}

Return the brief in markdown format."""

    response = await call_claude(
        prompt=prompt,
        system="You are a research assistant. Write clear, evidence-based briefs. Use markdown formatting.",
        model="claude-sonnet-4-6-20250514",
        max_tokens=4096,
    )

    logger.info("briefing_complete", project_id=project_id)
    return {"title": f"Research Brief - {project_id}", "content": response}


# Job type to handler mapping
JOB_HANDLERS = {
    "echo": handle_echo,
    "ingestion": handle_ingestion,
    "extraction": handle_extraction,
    "briefing": handle_briefing,
}
