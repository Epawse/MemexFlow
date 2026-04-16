# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

MemexFlow uses a dual-database architecture:

- **Supabase (Postgres + pgvector)** — server-side source of truth for projects, memories, candidates, briefs
- **SQLite (local)** — client-side local-first storage for offline access and fast reads

All schema changes go through Supabase migrations. The Python worker accesses Postgres via the `supabase-py` client.

---

## Data Model (Core Entities)

```
projects
├── id, name, goal, status, created_at, updated_at
├── has many: candidates, memories, briefs, signals_rules

candidates
├── id, channel_type, source_type, source_uri, project_id
├── title, raw_content, summary, claims (jsonb), evidence_spans (jsonb)
├── relevance_reason, status (pending/confirmed/ignored), ingested_at, published_at

memories
├── id, project_id, candidate_id (nullable), memory_type (episodic/semantic/procedural)
├── title, content, summary, source_uri, evidence_spans (jsonb)
├── claims (jsonb), tags (text[]), confidence, embedding (vector)
├── created_at, updated_at

briefs
├── id, project_id, brief_type (weekly/compare/prep/landscape)
├── title, content, sources (jsonb), rubric_result (jsonb)
├── created_at

signals_rules
├── id, project_id, channel_type, keywords (text[])
├── frequency, last_run_at, is_active

recalls
├── id, project_id, memory_id, reason, priority
├── scheduled_at, completed_at
```

---

## Query Patterns

### Use parameterized queries only

```python
# GOOD
result = supabase.table("candidates") \
    .select("*") \
    .eq("project_id", project_id) \
    .eq("status", "pending") \
    .order("ingested_at", desc=True) \
    .limit(20) \
    .execute()

# BAD — never use f-strings or string interpolation in queries
query = f"SELECT * FROM candidates WHERE project_id = '{project_id}'"
```

### Batch operations for bulk inserts

```python
# GOOD — single insert call with list
supabase.table("candidates").insert(candidates_list).execute()

# BAD — loop of individual inserts
for c in candidates:
    supabase.table("candidates").insert(c).execute()
```

### Vector search with pgvector

```python
# Use Supabase RPC for vector similarity search
result = supabase.rpc("match_memories", {
    "query_embedding": embedding,
    "match_threshold": 0.7,
    "match_count": 10,
    "filter_project_id": project_id,
}).execute()
```

---

## Migrations

### Creating migrations

```bash
# Use Supabase CLI
supabase migration new <descriptive_name>
# Edit the generated SQL file in supabase/migrations/
```

### Migration rules

1. **One concern per migration** — don't mix unrelated schema changes
2. **Always include rollback** — add `-- Rollback:` comment block with reverse SQL
3. **Never modify existing migrations** — create a new one instead
4. **Test locally first** — run `supabase db reset` to verify

### Example migration

```sql
-- Create memories table
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('episodic', 'semantic', 'procedural')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    source_uri TEXT,
    evidence_spans JSONB DEFAULT '[]'::jsonb,
    claims JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    confidence REAL DEFAULT 0.5,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memories_project_id ON memories(project_id);
CREATE INDEX idx_memories_memory_type ON memories(memory_type);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Rollback:
-- DROP TABLE IF EXISTS memories;
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Tables | `snake_case`, plural | `signals_rules` |
| Columns | `snake_case` | `project_id`, `created_at` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign keys | `<table_singular>_id` | `project_id`, `candidate_id` |
| Indexes | `idx_<table>_<column>` | `idx_memories_project_id` |
| Timestamps | `*_at` suffix, TIMESTAMPTZ | `created_at`, `updated_at` |
| Booleans | `is_*` or `has_*` prefix | `is_active` |
| JSONB columns | Plural noun or descriptive | `claims`, `evidence_spans` |
| Enums | TEXT with CHECK constraint | `CHECK (status IN ('pending', 'confirmed'))` |

---

## Common Mistakes

### 1. Forgetting `ON DELETE` behavior
Always specify cascade/set null for foreign keys. Orphaned rows cause data inconsistency.

### 2. Missing indexes on frequently filtered columns
Always add indexes for `project_id`, `status`, `memory_type` — any column used in WHERE clauses.

### 3. Storing embeddings without an index
pgvector without an IVFFlat or HNSW index becomes unusable at scale. Always create the index.

### 4. Using TEXT for enums without constraints
Always add CHECK constraints. Typos in enum values are silent bugs.

### 5. Not using TIMESTAMPTZ
Always use `TIMESTAMPTZ`, never `TIMESTAMP`. Users may be in different timezones.
