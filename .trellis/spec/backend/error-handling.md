# Error Handling

> How errors are handled in this project.

---

## Overview

MemexFlow Python worker uses a structured error hierarchy. Errors are categorized by domain, logged with context, and translated into appropriate responses at API boundaries.

---

## Error Types

### Base exception hierarchy

```python
class MemexFlowError(Exception):
    """Base exception for all MemexFlow errors."""
    def __init__(self, message: str, *, context: dict | None = None):
        super().__init__(message)
        self.context = context or {}


class ChannelError(MemexFlowError):
    """Error during content ingestion from a channel."""
    pass

class ParseError(ChannelError):
    """Failed to parse content from source."""
    pass

class ExtractionError(MemexFlowError):
    """Failed to extract claims/evidence from content."""
    pass

class DatabaseError(MemexFlowError):
    """Database operation failed."""
    pass

class RetrievalError(MemexFlowError):
    """Search/retrieval operation failed."""
    pass

class LLMError(MemexFlowError):
    """LLM API call failed."""
    pass

class RateLimitError(LLMError):
    """LLM rate limit exceeded."""
    pass

class ValidationError(MemexFlowError):
    """Input validation failed."""
    pass
```

---

## Error Handling Patterns

### Pattern 1: Catch at job boundaries, not in business logic

```python
# GOOD — job catches and logs, business logic raises
async def run_ingest_job(candidate_id: str) -> None:
    try:
        candidate = await fetch_candidate(candidate_id)
        content = await parse_content(candidate.source_uri)
        claims = await extract_claims(content)
        await store_extraction(candidate_id, claims)
    except ChannelError as e:
        logger.warning("Ingestion failed", candidate_id=candidate_id, error=str(e), **e.context)
        await mark_candidate_failed(candidate_id, reason=str(e))
    except LLMError as e:
        logger.error("LLM call failed during ingestion", candidate_id=candidate_id, error=str(e))
        raise  # Retry-eligible

# BAD — try/except inside every function
async def parse_content(uri: str) -> str:
    try:
        resp = await fetch(uri)
        return extract_text(resp)
    except Exception:
        return ""  # Silent swallowing
```

### Pattern 2: Use context dict for structured error info

```python
raise ParseError(
    f"Failed to parse PDF: {filename}",
    context={"filename": filename, "page_count": page_count, "error_type": "corrupted"}
)
```

### Pattern 3: Retry with backoff for transient errors

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    retry=retry_if_exception_type((RateLimitError, ConnectionError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
)
async def call_llm(prompt: str) -> str:
    ...
```

---

## API Error Responses

For any REST/Edge Function endpoints, use a consistent error envelope:

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Project ID is required",
        "details": {}
    }
}
```

### Error codes

| Code | HTTP Status | When |
|------|-------------|------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Duplicate or state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `LLM_UNAVAILABLE` | 503 | LLM provider down |

---

## Common Mistakes

### 1. Catching `Exception` and swallowing it
Never use bare `except Exception: pass`. Always log or re-raise.

### 2. Returning None instead of raising
If a function can't produce a valid result, raise an exception. Don't return `None` and force callers to check.

### 3. Mixing error handling with business logic
Keep try/except at the orchestration layer (jobs, API handlers). Core logic should raise, not catch.

### 4. Not including context in errors
Always pass structured context so logs are useful. `"Parse failed"` is useless; `"Parse failed for url=X, status=403"` is actionable.

### 5. Retrying non-transient errors
Only retry `RateLimitError`, `ConnectionError`, and timeouts. Don't retry `ValidationError` or `ParseError`.
