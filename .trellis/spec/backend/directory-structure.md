# Directory Structure

> How backend code is organized in this project.

---

## Overview

MemexFlow backend consists of two parts:

1. **Supabase** — managed Postgres DB, Auth, Storage, Edge Functions
2. **Python AI Worker** — ingestion, extraction, summarization, briefing, signal jobs

The Python worker is the main backend codebase. Supabase schema and edge functions live in a separate directory.

> **Legend**: Sections marked **[Current]** reflect the deployed structure.
> Sections marked **[Phase 3]** will be added by the Phase 3 task (candidate confirmation, external signals, recall).
> Sections marked **[Planned]** describe the target architecture but are not yet scheduled.

---

## [Current] Directory Layout

```
worker/
├── src/
│   └── worker/
│       ├── __init__.py
│       ├── main.py               # Polling loop, job dispatch, claim/complete/fail
│       ├── jobs/
│       │   ├── __init__.py
│       │   └── handlers.py       # All job handlers (echo, ingestion, extraction, briefing, signal, signal_scan)
│       ├── channels/             # External signal channel adapters
│       │   ├── __init__.py
│       │   ├── base.py           # BaseChannel abstract class + DiscoveryItem dataclass
│       │   ├── rss.py            # RSS/Atom feed adapter
│       │   └── github_releases.py # GitHub releases adapter
│       ├── services/
│       │   └── __init__.py       # Empty — services not yet split out
│       └── utils/
│           ├── __init__.py
│           ├── llm.py            # LLM client (call_llm, generate_embedding)
│           ├── logging.py        # structlog configuration
│           └── supabase.py       # Supabase client singleton
├── pyproject.toml
├── .env.example
└── .venv/

supabase/
├── migrations/                   # SQL migrations (timestamp-prefixed)
├── schema.sql                    # Auto-generated full schema dump
├── config.toml                   # Supabase project config
└── .temp/                        # Local Supabase state (gitignored)
```

### Key characteristics

- **Monolithic handlers**: All 7 job handlers (echo, ingestion, extraction, briefing, signal, signal_scan, confirm) live in `handlers.py`. Each handler is a plain async function — no class hierarchy.
- **Channel adapters**: External signal scanning uses `channels/` package with `BaseChannel` ABC. RSS and GitHub releases are implemented; new channels add a class and register in `CHANNEL_MAP`.
- **Job dispatch**: `main.py` maps job types to handlers via `TYPE_MAP` and `JOB_HANDLERS` dicts. Jobs are polled from Supabase `jobs` table and claimed atomically.
- **No domain layer**: Business logic (LLM prompts, Supabase queries) is inline in handlers. No `core/`, `db/`, or `retrieval/` packages exist yet.

---

## [Phase 3] Implemented (2026-04-19)

Phase 3B (External Signals) has been implemented. The `channels/` package and `handle_signal_scan` handler are now live.

- **External signal scanning** — `handle_signal_scan` in handlers.py + `channels/` package (RSS, GitHub releases)
- **Candidate confirmation** — `handle_confirm` in handlers.py (Phase 3A)

Remaining:
- **Recall** — `handle_recall` in handlers.py (Phase 3C)

---

## [Planned] Target Architecture

```
worker/
├── src/
│   └── worker/
│       ├── agents/              # Agent specs (signal_analyst, brief_writer, etc.)
│       │   ├── __init__.py
│       │   ├── base.py          # Base agent class
│       │   ├── signal_analyst.py
│       │   ├── claim_extractor.py
│       │   └── brief_writer.py
│       ├── channels/            # Capture & signal channel adapters
│       │   ├── __init__.py
│       │   ├── base.py
│       │   ├── url.py
│       │   ├── pdf.py
│       │   ├── rss.py
│       │   └── github_releases.py
│       ├── core/                # Core domain models and business logic
│       │   ├── __init__.py
│       │   ├── models.py        # Pydantic domain models
│       │   ├── candidate.py     # Candidate processing pipeline
│       │   ├── memory.py        # Memory store operations
│       │   └── project.py       # Project context management
│       ├── db/                  # Database access layer
│       │   ├── __init__.py
│       │   ├── client.py        # Supabase client singleton
│       │   └── queries/         # Query modules by domain
│       │       ├── captures.py
│       │       ├── memories.py
│       │       ├── projects.py
│       │       └── briefs.py
│       ├── retrieval/           # Search and retrieval layer
│       │   ├── __init__.py
│       │   ├── lexical.py       # Full-text search
│       │   ├── vector.py        # pgvector similarity search
│       │   ├── hybrid.py        # Combined retrieval
│       │   └── citation.py      # Citation assembly
│       ├── jobs/                # Background job definitions
│       │   ├── __init__.py
│       │   ├── ingest.py
│       │   ├── extract.py
│       │   ├── summarize.py
│       │   ├── brief.py
│       │   ├── signal_scan.py
│       │   └── recall.py
│       ├── services/            # Orchestration and external service wrappers
│       │   ├── __init__.py
│       │   ├── llm.py
│       │   ├── embedding.py
│       │   └── storage.py
│       └── config.py            # App configuration (env-based)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── pyproject.toml
├── .env.example
└── README.md
```

This architecture is the long-term target but is **not** currently implemented. It will be reached incrementally as handlers grow complex enough to warrant extraction.

---

## Module Organization

### [Current] Rules

1. **All handlers in `handlers.py`** — one file, one async function per job type
2. **`utils/` for shared utilities** — `llm.py`, `logging.py`, `supabase.py`
3. **`main.py` owns the polling loop** — `fetch_pending_jobs` → `claim_job` → `process_job` → `complete_job`/`fail_job`
4. **Supabase calls are inline** — handlers call `supabase.table()` directly (no `db/` layer)

### [Planned] Rules

1. **One responsibility per module** — each file handles one domain concern
2. **channels/** adapts external sources into the unified `Candidate` model
3. **core/** contains pure business logic with no I/O dependencies
4. **db/** is the only module that talks to Supabase/Postgres
5. **jobs/** orchestrates multi-step workflows by composing core + db + services
6. **agents/** defines agent specs (system prompt, tools, skills) — not raw prompts scattered in code

### Adding a new job handler (current)

1. Add async function `handle_<type>(input_data: dict) -> dict` in `handlers.py`
2. Add entry to `JOB_HANDLERS` dict: `"<type>": handle_<type>`
3. Add type mapping in `main.py` `TYPE_MAP` if job type name differs from handler name
4. Update Supabase `jobs` table `type` CHECK constraint via migration

### Adding a new channel adapter (current)

1. Create `worker/src/worker/channels/<name>.py` implementing `BaseChannel`
2. Implement `scan(config: dict, query: str) -> list[DiscoveryItem]`
3. Register in `handlers.py` `CHANNEL_MAP`: `"<type>": <Name>Channel()`
4. Add `channel_type` CHECK constraint value in migration if not `internal/rss/github_release`

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `snake_case.py` | `handlers.py`, `supabase.py` |
| Classes | `PascalCase` | `BriefWriter` (future) |
| Handler functions | `handle_<type>` | `handle_ingestion`, `handle_briefing` |
| Constants | `UPPER_SNAKE_CASE` | `POLL_INTERVAL`, `BATCH_SIZE` |
| Private | Leading underscore | `_parse_content()` |
| Test files | `test_<module>.py` | `test_handlers.py` |

---

## Examples

- Job handler: `worker/src/worker/jobs/handlers.py` — all handlers live here currently
- Channel adapter: `worker/src/worker/channels/rss.py` — RSS feed scanning
- LLM utility: `worker/src/worker/utils/llm.py`
- Supabase client: `worker/src/worker/utils/supabase.py`
- Polling loop: `worker/src/worker/main.py`
- Migration: `supabase/migrations/20260419010000_add_signal_discoveries.sql`