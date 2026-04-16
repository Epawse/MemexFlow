# Directory Structure

> How backend code is organized in this project.

---

## Overview

MemexFlow backend consists of two parts:

1. **Supabase** — managed Postgres DB, Auth, Storage, Edge Functions
2. **Python AI Worker** — ingestion, extraction, summarization, retrieval, briefing jobs

The Python worker is the main backend codebase. Supabase schema and edge functions live in a separate directory.

---

## Directory Layout

```
worker/
├── src/
│   ├── agents/              # Agent specs (signal_analyst, brief_writer, etc.)
│   │   ├── __init__.py
│   │   ├── base.py          # Base agent class
│   │   ├── signal_analyst.py
│   │   ├── claim_extractor.py
│   │   └── brief_writer.py
│   ├── channels/            # Capture & signal channel adapters
│   │   ├── __init__.py
│   │   ├── base.py          # Base channel interface
│   │   ├── url.py
│   │   ├── pdf.py
│   │   ├── rss.py
│   │   └── github_releases.py
│   ├── core/                # Core domain models and business logic
│   │   ├── __init__.py
│   │   ├── models.py        # Pydantic domain models
│   │   ├── candidate.py     # Candidate processing pipeline
│   │   ├── memory.py        # Memory store operations
│   │   └── project.py       # Project context management
│   ├── db/                  # Database access layer
│   │   ├── __init__.py
│   │   ├── client.py        # Supabase client singleton
│   │   ├── queries/         # Query modules by domain
│   │   │   ├── candidates.py
│   │   │   ├── memories.py
│   │   │   ├── projects.py
│   │   │   └── briefs.py
│   │   └── migrations/      # SQL migration files (if needed beyond Supabase)
│   ├── retrieval/           # Search and retrieval layer
│   │   ├── __init__.py
│   │   ├── lexical.py       # Full-text search
│   │   ├── vector.py        # pgvector similarity search
│   │   ├── hybrid.py        # Combined retrieval
│   │   └── citation.py      # Citation assembly
│   ├── jobs/                # Background job definitions
│   │   ├── __init__.py
│   │   ├── ingest.py        # Content ingestion pipeline
│   │   ├── extract.py       # Claim/evidence extraction
│   │   ├── summarize.py     # AI summarization
│   │   ├── brief.py         # Brief generation
│   │   ├── signal_scan.py   # Signal monitoring
│   │   └── recall.py        # Recall planning
│   ├── services/            # Orchestration and external service wrappers
│   │   ├── __init__.py
│   │   ├── llm.py           # LLM client abstraction
│   │   ├── embedding.py     # Embedding generation
│   │   └── storage.py       # Blob storage operations
│   └── config.py            # App configuration (env-based)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── supabase/                # Supabase project config
│   ├── migrations/          # SQL migrations
│   ├── functions/           # Edge functions (TypeScript)
│   └── config.toml
├── pyproject.toml
├── .env.example
└── README.md
```

---

## Module Organization

### Rules

1. **One responsibility per module** — each file handles one domain concern
2. **channels/** adapts external sources into the unified `Candidate` model
3. **core/** contains pure business logic with no I/O dependencies
4. **db/** is the only module that talks to Supabase/Postgres
5. **jobs/** orchestrates multi-step workflows by composing core + db + services
6. **agents/** defines agent specs (system prompt, tools, skills) — not raw prompts scattered in code

### Adding a new feature

1. Define domain models in `core/models.py`
2. Add database queries in `db/queries/`
3. Add business logic in `core/`
4. If it's a background task, add a job in `jobs/`
5. If it's a new input channel, add an adapter in `channels/`

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `snake_case.py` | `signal_analyst.py` |
| Classes | `PascalCase` | `BriefWriter` |
| Functions | `snake_case` | `extract_claims()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Private | Leading underscore | `_parse_content()` |
| Test files | `test_<module>.py` | `test_candidate.py` |

---

## Examples

- Channel adapter: `worker/src/channels/url.py`
- Domain model: `worker/src/core/models.py`
- Database query: `worker/src/db/queries/candidates.py`
- Background job: `worker/src/jobs/ingest.py`
