"""Job handlers for the AI worker.

Each handler processes a specific job type:
- echo: Test job (returns input as output)
- ingestion: URL → clean text extraction
- extraction: Text → structured claims/memories
- briefing: Memories → research brief
"""

import json
from typing import Any

import httpx

from ..utils.llm import call_llm, generate_embedding
from ..utils.logging import logger
from ..utils.supabase import get_supabase


async def handle_echo(input_data: dict[str, Any]) -> dict[str, Any]:
    return {"echo": input_data}


async def handle_ingestion(input_data: dict[str, Any]) -> dict[str, Any]:
    """Ingestion job - fetch URL content and extract clean text.

    Input: {"url": "...", "capture_id": "..."}
    Output: {"title": "...", "content": "...", "summary": "..."}
    """
    url = input_data.get("url", "")
    capture_id = input_data.get("capture_id", "")
    supabase = get_supabase()

    if not url:
        raise ValueError("url is required")

    raw_content = ""
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(
                f"https://r.jina.ai/{url}",
                headers={"Accept": "text/plain"},
            )
            if resp.status_code == 200:
                raw_content = resp.text
    except Exception as e:
        logger.warning("jina_fetch_failed", url=url, error=str(e))

    if not raw_content:
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                raw_content = resp.text
        except Exception as e:
            raise ValueError(f"Failed to fetch URL content: {e}") from e

    prompt = f"""Extract the main content from the following web page.
Remove all navigation, ads, footers, and boilerplate.
Return the title and clean article content.

URL: {url}

Raw content:
{raw_content[:15000]}

Return JSON with keys: title, content, summary (1-2 sentence summary)"""

    response = await call_llm(
        prompt=prompt,
        system="You are a content extraction assistant. Always respond with valid JSON.",
        max_tokens=4096,
    )

    try:
        json_str = response
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
        result = json.loads(json_str)
    except (json.JSONDecodeError, IndexError):
        result = {"title": url, "content": response, "summary": ""}

    title = result.get("title", "")
    content = result.get("content", "")
    summary = result.get("summary", "")

    if capture_id:
        capture_result = (supabase.table("captures")
                         .select("project_id")
                         .eq("id", capture_id)
                         .execute())
        capture_project_id = ""
        if capture_result.data:
            capture_project_id = capture_result.data[0].get("project_id") or ""

        (supabase.table("captures")
         .update({
             "title": title,
             "content": content[:50000],
             "metadata": json.dumps({"summary": summary, "url": url}),
             "updated_at": "now()",
         })
         .eq("id", capture_id)
         .execute())

        (supabase.table("jobs")
         .insert({
             "user_id": input_data.get("user_id", ""),
             "type": "extraction",
             "status": "pending",
             "input": json.dumps({
                 "content": content[:8000],
                 "capture_id": capture_id,
                 "user_id": input_data.get("user_id", ""),
                 "project_id": capture_project_id,
             }),
         })
         .execute())

    logger.info("ingestion_complete", url=url, title=title, capture_id=capture_id)
    return result


async def handle_extraction(input_data: dict[str, Any]) -> dict[str, Any]:
    """Extraction job - extracts structured claims from content and creates Memory rows.

    Input: {"content": "...", "capture_id": "...", "user_id": "...", "project_id": "..."}
    Output: {"memories_created": N}
    """
    content = input_data.get("content", "")
    capture_id = input_data.get("capture_id", "")
    user_id = input_data.get("user_id", "")
    project_id = input_data.get("project_id", "")

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

    response = await call_llm(
        prompt=prompt,
        system="You are a knowledge extraction assistant. Extract verifiable claims. Always respond with valid JSON array.",
        max_tokens=4096,
    )

    try:
        memories = json.loads(response)
        if not isinstance(memories, list):
            memories = [memories]
    except json.JSONDecodeError:
        memories = [{"content": response, "memory_type": "note", "confidence": 0.5}]

    supabase = get_supabase()
    created_count = 0

    for memory in memories:
        text = memory.get("content", "")
        if not text or len(text.strip()) < 10:
            continue

        embedding = None
        try:
            embedding = await generate_embedding(text)
        except Exception as e:
            logger.warning("embedding_failed", error=str(e))

        memory_row = {
            "user_id": user_id,
            "project_id": project_id or None,
            "capture_id": capture_id or None,
            "content": text,
            "summary": memory.get("content", text)[:500],
            "metadata": json.dumps({
                "memory_type": memory.get("memory_type", "claim"),
                "confidence": memory.get("confidence", 0.7),
            }),
        }

        result = supabase.table("memories").insert(memory_row).execute()
        if result.data:
            memory_id = result.data[0]["id"]
            if embedding:
                supabase.table("memories").update({
                    "embedding": embedding,
                }).eq("id", memory_id).execute()
            created_count += 1

    logger.info(
        "extraction_complete",
        capture_id=capture_id,
        memories_created=created_count,
    )
    return {"memories_created": created_count}


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
        for m in memories[:50]
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

    response = await call_llm(
        prompt=prompt,
        system="You are a research assistant. Write clear, evidence-based briefs. Use markdown formatting.",
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
