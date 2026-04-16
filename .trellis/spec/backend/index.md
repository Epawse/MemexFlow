# Backend Development Guidelines

> Python AI worker + Supabase (Postgres/pgvector) backend conventions.

---

## Overview

MemexFlow backend has two parts:
- **Python AI Worker** — ingestion, extraction, summarization, retrieval, briefing jobs
- **Supabase** — managed Postgres DB, Auth, Storage, Edge Functions

**Key libraries**: structlog, Pydantic v2, tenacity, supabase-py, Ruff, mypy

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Python worker module layout, Supabase project structure | Filled |
| [Database Guidelines](./database-guidelines.md) | Postgres/pgvector schema, migrations, query patterns | Filled |
| [Error Handling](./error-handling.md) | Exception hierarchy, retry patterns, API errors | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Ruff, mypy, pytest, forbidden patterns | Filled |
| [Logging Guidelines](./logging-guidelines.md) | structlog, structured JSON logging, log levels | Filled |

---

## Pre-Development Checklist

Before writing backend code, read:

1. **Always**: [Directory Structure](./directory-structure.md) — know where files go
2. **Always**: [Quality Guidelines](./quality-guidelines.md) — forbidden patterns, required patterns
3. **If touching DB**: [Database Guidelines](./database-guidelines.md) — schema, migrations, queries
4. **If adding error handling**: [Error Handling](./error-handling.md) — exception types, retry rules
5. **If adding logging**: [Logging Guidelines](./logging-guidelines.md) — structured logging format

---

## Quick Reference

| Tool | Command |
|------|---------|
| Lint | `ruff check worker/` |
| Format | `ruff format worker/` |
| Type check | `mypy worker/src/` |
| Test | `pytest tests/ -v` |
| Migration | `supabase migration new <name>` |

---

**Language**: All documentation should be written in **English**.
