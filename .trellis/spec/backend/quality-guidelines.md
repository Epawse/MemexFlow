# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

MemexFlow backend (Python worker) uses:
- **Ruff** for linting and formatting
- **mypy** (strict mode) for type checking
- **pytest** for testing
- **Pydantic v2** for data validation

---

## Forbidden Patterns

### 1. `Any` type annotations
Never use `Any`. If you can't type it precisely, use a `Protocol` or `TypeVar`.

### 2. Bare `except Exception`
Always catch specific exception types. Never silently swallow errors.

```python
# FORBIDDEN
try:
    process()
except Exception:
    pass
```

### 3. Mutable default arguments

```python
# FORBIDDEN
def process(items: list[str] = []):
    ...

# CORRECT
def process(items: list[str] | None = None):
    items = items or []
```

### 4. f-string SQL queries
Never interpolate user input into SQL. Always use parameterized queries or the Supabase client.

### 5. Global mutable state
No module-level mutable variables. Use dependency injection or config objects.

### 6. `import *`
Never use wildcard imports. Always import explicitly.

### 7. Hardcoded API keys or secrets
All secrets go in environment variables. Never commit `.env` files.

---

## Required Patterns

### 1. Type annotations on all public functions

```python
async def extract_claims(content: str, *, max_claims: int = 10) -> list[Claim]:
    ...
```

### 2. Pydantic models for all data boundaries

```python
from pydantic import BaseModel

class CandidateCreate(BaseModel):
    source_uri: str
    channel_type: str
    project_id: str
    title: str | None = None
```

### 3. Keyword-only arguments for optional parameters

```python
# GOOD — prevents positional argument confusion
def search(query: str, *, project_id: str | None = None, limit: int = 10) -> list[Memory]:
    ...
```

### 4. Docstrings on public classes and complex functions

```python
class BriefWriter:
    """Generates research briefs from project memories.

    Uses retrieval + LLM to produce evidence-backed briefs
    that satisfy the configured rubric.
    """
```

---

## Testing Requirements

### Test structure

```
tests/
├── unit/                 # Fast, no external deps
│   ├── test_models.py
│   ├── test_candidate.py
│   └── test_citation.py
├── integration/          # Requires Supabase/LLM
│   ├── test_ingest.py
│   └── test_retrieval.py
└── conftest.py           # Shared fixtures
```

### Requirements

- **Unit tests** for all core business logic (models, extraction, citation assembly)
- **Integration tests** for database queries and job pipelines
- LLM-dependent tests should use recorded responses (VCR/cassettes), not live calls
- Target: **80%+ coverage on `core/` and `db/`**

### Test naming

```python
def test_extract_claims_returns_empty_for_short_content():
    ...

def test_ingest_job_marks_candidate_failed_on_parse_error():
    ...
```

---

## Code Review Checklist

- [ ] Type annotations on all public functions
- [ ] No `Any` types
- [ ] Pydantic models at data boundaries
- [ ] Structured logging (no f-string log messages)
- [ ] Errors raised with context, caught at job boundary
- [ ] No hardcoded secrets
- [ ] SQL uses parameterized queries
- [ ] New database columns have proper types, constraints, and indexes
- [ ] Tests added for new logic
- [ ] `ruff check` and `mypy` pass

---

## Commands

```bash
# Lint
ruff check worker/

# Format
ruff format worker/

# Type check
mypy worker/src/

# Test
pytest tests/ -v

# Test with coverage
pytest tests/ --cov=worker/src --cov-report=term-missing
```
