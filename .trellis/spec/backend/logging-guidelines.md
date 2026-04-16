# Logging Guidelines

> How logging is done in this project.

---

## Overview

MemexFlow uses **structlog** for structured JSON logging. All log entries include contextual fields so logs are searchable and filterable.

---

## Setup

```python
import structlog

logger = structlog.get_logger()
```

Each module gets its own logger via `structlog.get_logger()`. Logger is bound with context at the job/request level.

---

## Log Levels

| Level | When to use | Example |
|-------|-------------|---------|
| `DEBUG` | Detailed trace for development | `logger.debug("Parsing page", page_num=3, total=12)` |
| `INFO` | Normal operations worth recording | `logger.info("Candidate ingested", candidate_id=id, channel="url")` |
| `WARNING` | Recoverable issues, degraded behavior | `logger.warning("PDF parse partial failure", pages_failed=2)` |
| `ERROR` | Operation failed, needs attention | `logger.error("LLM call failed", model="claude", attempt=3)` |

### Rules

- **INFO** is the default production level
- **DEBUG** is enabled per-module via config, never globally in production
- **WARNING** means something is wrong but the system continues
- **ERROR** means the current operation failed

---

## Structured Logging

### Always use keyword arguments

```python
# GOOD — structured, searchable
logger.info("Brief generated",
    project_id=project_id,
    brief_type="weekly",
    source_count=len(sources),
    duration_ms=elapsed,
)

# BAD — unstructured string
logger.info(f"Generated weekly brief for project {project_id} with {len(sources)} sources in {elapsed}ms")
```

### Bind context at job/request level

```python
# At the start of a job, bind common context
job_logger = logger.bind(
    job_type="ingest",
    candidate_id=candidate_id,
    project_id=project_id,
)
job_logger.info("Job started")
# ... all subsequent logs include candidate_id and project_id
job_logger.info("Job completed", claims_extracted=5)
```

---

## What to Log

### Always log

- Job start/completion with duration
- Candidate ingestion (channel, source_uri, project)
- Memory creation/update (memory_type, project)
- LLM calls (model, token count, latency)
- Brief generation (type, source count, rubric result)
- Signal scan results (new signals found, project)
- Errors with full context

### Log at DEBUG level

- Individual parsing steps
- Embedding generation details
- Retrieval scores and rankings
- Intermediate extraction results

---

## What NOT to Log

### Never log

- **User credentials** — API keys, tokens, passwords
- **Full content bodies** — raw article text, PDF contents (log titles/URIs instead)
- **Embedding vectors** — too large, no diagnostic value
- **PII** — email addresses, personal notes content
- **Supabase connection strings**

### Sanitize before logging

```python
# GOOD
logger.info("Processing URL", url=source_uri, title=title[:100])

# BAD
logger.info("Processing content", full_html=response.text)
```

---

## Job Logging Pattern

Every background job should follow this pattern:

```python
async def run_job(job_id: str, **params) -> None:
    log = logger.bind(job_id=job_id, job_type="ingest", **params)
    log.info("Job started")
    start = time.monotonic()

    try:
        result = await do_work(**params)
        elapsed = int((time.monotonic() - start) * 1000)
        log.info("Job completed", duration_ms=elapsed, **result.summary())
    except MemexFlowError as e:
        elapsed = int((time.monotonic() - start) * 1000)
        log.error("Job failed", duration_ms=elapsed, error=str(e), **e.context)
        raise
```
