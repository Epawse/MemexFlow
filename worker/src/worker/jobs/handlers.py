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
    """Briefing job - generates a research brief from project memories.

    Input: {"project_id": "...", "user_id": "...", "brief_id": "..."}
    Output: {"title": "...", "content": "...", "cited_memory_ids": [...]}
    """
    project_id = input_data.get("project_id", "")
    user_id = input_data.get("user_id", "")
    brief_id = input_data.get("brief_id", "")
    supabase = get_supabase()

    if not project_id:
        raise ValueError("project_id is required")

    # Fetch project memories from Supabase
    result = (
        supabase.table("memories")
        .select("id, content, summary, metadata, created_at")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    memories = result.data or []

    if not memories:
        raise ValueError("No memories found for this project")

    # Build numbered memory list for citation markers [M1], [M2], etc.
    memory_texts = ""
    memory_ids: list[str] = []
    for i, m in enumerate(memories[:50], 1):
        meta = m.get("metadata", {})
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except (json.JSONDecodeError, TypeError):
                meta = {}
        confidence = meta.get("confidence", 0.5)
        memory_type = meta.get("memory_type", "note")
        summary = m.get("summary", "") or m.get("content", "")[:200]
        memory_texts += f"[M{i}] [{memory_type}] Confidence: {confidence} | {summary}\n"
        memory_ids.append(m["id"])

    prompt = f"""Generate a research brief based on the following memories from a research project.

Structure:
1. Executive Summary (2-3 sentences)
2. Key Findings (with citations [M1], [M2], etc.)
3. Evidence & Sources (details for each cited memory)
4. Evidence Gaps (what's missing)
5. Recommendations (next steps)

Memories:
{memory_texts}

Return JSON with keys: title, content_markdown, cited_memory_ids
- title: a concise brief title
- content_markdown: the full brief in markdown with inline [M1] citations
- cited_memory_ids: array of memory IDs that were cited (use the IDs from the memory list)"""

    response = await call_llm(
        prompt=prompt,
        system="You are a research assistant. Write clear, evidence-based briefs with proper citations. Always respond with valid JSON.",
        max_tokens=4096,
    )

    # Parse LLM response
    try:
        json_str = response
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
        brief_result = json.loads(json_str)
    except (json.JSONDecodeError, IndexError):
        brief_result = {
            "title": "Research Brief",
            "content_markdown": response,
            "cited_memory_ids": memory_ids[:5],
        }

    title = brief_result.get("title", "Research Brief")
    content = brief_result.get("content_markdown", response)
    cited_ids = brief_result.get("cited_memory_ids", [])

    # Validate cited IDs against actual memory IDs
    valid_cited_ids = [mid for mid in cited_ids if mid in memory_ids]

    # Update the brief row
    if brief_id:
        supabase.table("briefs").update({
            "title": title,
            "content": content,
            "status": "completed",
            "updated_at": "now()",
        }).eq("id", brief_id).execute()

        # Insert citation links
        if valid_cited_ids:
            brief_memories_rows = [
                {"brief_id": brief_id, "memory_id": mid}
                for mid in valid_cited_ids
            ]
            supabase.table("brief_memories").insert(brief_memories_rows).execute()

    logger.info(
        "briefing_complete",
        project_id=project_id,
        brief_id=brief_id,
        memories_count=len(memories),
        cited_count=len(valid_cited_ids),
    )
    return {
        "title": title,
        "content": content,
        "cited_memory_ids": valid_cited_ids,
    }


async def handle_signal(input_data: dict[str, Any]) -> dict[str, Any]:
    """Signal job — checks a signal rule against memories for keyword matches.

    Input: {"signal_rule_id": "...", "user_id": "..."}
    Output: {"matches_found": N}
    """
    signal_rule_id = input_data.get("signal_rule_id", "")
    user_id = input_data.get("user_id", "")
    supabase = get_supabase()

    if not signal_rule_id:
        raise ValueError("signal_rule_id is required")

    # Fetch the signal rule
    rule_result = (
        supabase.table("signal_rules")
        .select("*")
        .eq("id", signal_rule_id)
        .execute()
    )
    if not rule_result.data:
        raise ValueError(f"Signal rule {signal_rule_id} not found")

    rule = rule_result.data[0]
    query = rule.get("query", "")
    match_type = rule.get("match_type", "keyword")
    project_id = rule.get("project_id")

    if not query:
        raise ValueError("Signal rule has no query")

    # Search memories for keyword matches
    memories_result = (
        supabase.table("memories")
        .select("id, content, summary")
        .eq("user_id", user_id)
        .execute()
    )
    memories = memories_result.data or []

    # Filter by project if specified
    if project_id:
        project_memories = (
            supabase.table("memories")
            .select("id, content, summary")
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .execute()
        )
        memories = project_memories.data or []

    # Find matches
    matches: list[dict[str, str]] = []
    query_lower = query.lower()

    for memory in memories:
        text = (memory.get("content") or "") + " " + (memory.get("summary") or "")
        text_lower = text.lower()

        if match_type == "keyword" and query_lower in text_lower:
            # Extract matched snippet (up to 100 chars around the match)
            idx = text_lower.find(query_lower)
            start = max(0, idx - 40)
            end = min(len(text), idx + len(query) + 60)
            snippet = text[start:end].strip()
            if start > 0:
                snippet = "..." + snippet
            if end < len(text):
                snippet = snippet + "..."

            matches.append({
                "memory_id": memory["id"],
                "matched_text": snippet,
            })

    # Check for existing matches (avoid duplicates)
    existing_result = (
        supabase.table("signal_matches")
        .select("memory_id")
        .eq("signal_rule_id", signal_rule_id)
        .execute()
    )
    existing_memory_ids = {m["memory_id"] for m in (existing_result.data or [])}

    # Insert new matches only
    new_matches = [m for m in matches if m["memory_id"] not in existing_memory_ids]

    if new_matches:
        match_rows = [
            {
                "user_id": user_id,
                "signal_rule_id": signal_rule_id,
                "memory_id": m["memory_id"],
                "matched_text": m["matched_text"],
            }
            for m in new_matches
        ]
        supabase.table("signal_matches").insert(match_rows).execute()

    # Update last_checked_at
    supabase.table("signal_rules").update({
        "last_checked_at": "now()",
    }).eq("id", signal_rule_id).execute()

    logger.info(
        "signal_complete",
        signal_rule_id=signal_rule_id,
        total_matches=len(matches),
        new_matches=len(new_matches),
    )
    return {"matches_found": len(new_matches)}


# Job type to handler mapping
JOB_HANDLERS = {
    "echo": handle_echo,
    "ingestion": handle_ingestion,
    "extraction": handle_extraction,
    "briefing": handle_briefing,
    "signal": handle_signal,
}
