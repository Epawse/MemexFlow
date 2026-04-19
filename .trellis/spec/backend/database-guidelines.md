# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

MemexFlow uses a dual-database architecture:

- **Supabase (Postgres + pgvector)** — server-side source of truth
- **SQLite (local, via PowerSync)** — client-side local-first storage for offline access and fast reads

All schema changes go through Supabase migrations. The Python worker accesses Postgres via the `supabase-py` client.

> **Legend**: Sections marked **[Current]** reflect the deployed schema.
> Sections marked **[Phase 3]** will be added by the Phase 3 task (candidate confirmation, external signals, recall).
> Sections marked **[Planned]** describe the target architecture but are not yet scheduled.

---

## Data Model

### [Current] projects

```
projects
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── title TEXT NOT NULL
├── description TEXT
├── color TEXT DEFAULT '#6366f1'
├── icon TEXT DEFAULT 'folder'
├── archived BOOLEAN DEFAULT FALSE
├── created_at TIMESTAMPTZ DEFAULT NOW()
├── updated_at TIMESTAMPTZ DEFAULT NOW()
├── has many: captures, memories, briefs, signal_rules
```

### [Current] captures

```
captures
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── project_id UUID REFERENCES projects(id) ON DELETE SET NULL
├── type TEXT NOT NULL CHECK (type IN ('url', 'note', 'file'))
├── title TEXT NOT NULL
├── content TEXT
├── url TEXT
├── metadata JSONB DEFAULT '{}'::jsonb
├── created_at TIMESTAMPTZ DEFAULT NOW()
├── updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Note**: Captures currently auto-process into memories (no user confirmation step). The `metadata` JSONB stores `summary` and `url` from ingestion. No `status` column exists yet.

### [Phase 3] captures (planned additions)

```
+ status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ignored'))
+ confirmed_at TIMESTAMPTZ
```

With Phase 3A, captures become the "candidate pool" from the strategy doc. Users confirm before memory creation. A data migration will backfill existing captures with linked memories to `status='confirmed'`.

### [Current] memories

```
memories
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── project_id UUID REFERENCES projects(id) ON DELETE SET NULL
├── capture_id UUID REFERENCES captures(id) ON DELETE SET NULL
├── content TEXT NOT NULL
├── summary TEXT
├── embedding VECTOR(384)
├── metadata JSONB DEFAULT '{}'::jsonb
├── created_at TIMESTAMPTZ DEFAULT NOW()
├── updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Note**: The strategy doc envisions `title`, `source_uri`, `evidence_spans`, `claims`, `tags`, `confidence`, and `memory_type` as first-class columns. Currently, these are stored inside the `metadata` JSONB field (e.g., `{"memory_type": "claim", "confidence": 0.8}`). The local SQLite (PowerSync) also omits the `embedding` column since vectors don't sync.

### [Planned] memories (enhanced columns)

```
+ memory_type TEXT CHECK (memory_type IN ('episodic', 'semantic', 'procedural'))
+ title TEXT
+ source_uri TEXT
+ evidence_spans JSONB DEFAULT '[]'::jsonb
+ claims JSONB DEFAULT '[]'::jsonb
+ tags TEXT[] DEFAULT '{}'
+ confidence REAL DEFAULT 0.5
```

Promoting these from metadata JSONB to first-class columns improves queryability and index support. Timing: post-Phase 3, when the schema stabilizes.

### [Current] briefs

```
briefs
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── project_id UUID REFERENCES projects(id) ON DELETE SET NULL
├── title TEXT NOT NULL
├── content TEXT NOT NULL
├── type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'project', 'custom'))
├── status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
├── metadata JSONB DEFAULT '{}'::jsonb
├── created_at TIMESTAMPTZ DEFAULT NOW()
├── updated_at TIMESTAMPTZ DEFAULT NOW()
├── has many: brief_memories (junction)
```

### [Current] brief_memories

```
brief_memories
├── brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE
├── memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE
├── relevance TEXT
├── PRIMARY KEY (brief_id, memory_id)
```

### [Current] memory_associations

```
memory_associations
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── from_memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE
├── to_memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE
├── relation_type TEXT NOT NULL CHECK (relation_type IN ('supports', 'contradicts', 'elaborates', 'related'))
├── note TEXT
├── created_at TIMESTAMPTZ DEFAULT NOW()
```

### [Current] signal_rules

```
signal_rules
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── project_id UUID REFERENCES projects(id) ON DELETE CASCADE
├── name TEXT NOT NULL
├── query TEXT NOT NULL
├── match_type TEXT NOT NULL DEFAULT 'keyword' CHECK (match_type IN ('keyword', 'regex'))
├── is_active BOOLEAN DEFAULT TRUE
├── last_checked_at TIMESTAMPTZ
├── created_at TIMESTAMPTZ DEFAULT NOW()
├── updated_at TIMESTAMPTZ DEFAULT NOW()
```

### [Phase 3] signal_rules (planned additions)

```
+ channel_type TEXT NOT NULL DEFAULT 'internal' CHECK (channel_type IN ('internal', 'rss', 'github_release'))
+ channel_config JSONB DEFAULT '{}'::jsonb
```

### [Current] signal_matches

```
signal_matches
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── signal_rule_id UUID NOT NULL REFERENCES signal_rules(id) ON DELETE CASCADE
├── memory_id UUID REFERENCES memories(id) ON DELETE SET NULL
├── matched_text TEXT
├── is_dismissed BOOLEAN DEFAULT FALSE
├── matched_at TIMESTAMPTZ DEFAULT NOW()
```

### [Phase 3] signal_discoveries (NEW table)

```
signal_discoveries
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── signal_rule_id UUID NOT NULL REFERENCES signal_rules(id) ON DELETE CASCADE
├── project_id UUID REFERENCES projects(id) ON DELETE SET NULL
├── source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'github_release'))
├── source_uri TEXT NOT NULL
├── title TEXT NOT NULL
├── summary TEXT
├── published_at TIMESTAMPTZ
├── is_captured BOOLEAN DEFAULT FALSE
├── capture_id UUID REFERENCES captures(id) ON DELETE SET NULL
├── discovered_at TIMESTAMPTZ DEFAULT NOW()
```

External content found by signal channel adapters (RSS, GitHub). User can "Capture" a discovery, creating a capture row that enters the candidate confirmation flow (3A).

### [Current] recalls

```
recalls
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── project_id UUID REFERENCES projects(id) ON DELETE SET NULL
├── memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE
├── reason TEXT NOT NULL CHECK (reason IN ('time_based', 'project_active', 'association_dense', 'signal_triggered'))
├── priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'))
├── reason_detail TEXT
├── scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
├── revisited_at TIMESTAMPTZ
├── dismissed_at TIMESTAMPTZ
├── created_at TIMESTAMPTZ DEFAULT NOW()
```

Proactive knowledge recall. The system identifies memories worth revisiting and presents them with a human-readable reason.

### [Current] jobs

```
jobs
├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
├── type TEXT NOT NULL CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'signal_scan', 'confirm', 'recall', 'echo'))
├── status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
├── input JSONB NOT NULL
├── output JSONB
├── error TEXT
├── created_at TIMESTAMPTZ DEFAULT NOW()
├── updated_at TIMESTAMPTZ DEFAULT NOW()
├── started_at TIMESTAMPTZ
├── completed_at TIMESTAMPTZ
```

### [Current] jobs type additions

```
type CHECK constraint includes: 'signal_scan', 'confirm', 'recall'
```

### [Current] signals (DEPRECATED)

```
signals
├── id, user_id, project_id, type, title, description, confidence, related_memory_ids, metadata, created_at, updated_at
```

This table is **unused**. `signal_rules` + `signal_matches` replaced it. Kept for zero-risk; drop in a future cleanup migration.

---

## Query Patterns

### Use parameterized queries only

```python
# GOOD — using captures (current table name)
result = supabase.table("captures") \
    .select("*") \
    .eq("project_id", project_id) \
    .order("created_at", desc=True) \
    .limit(20) \
    .execute()

# [Phase 3] With candidate confirmation, filter by status
result = supabase.table("captures") \
    .select("*") \
    .eq("project_id", project_id) \
    .eq("status", "pending") \
    .order("created_at", desc=True) \
    .limit(20) \
    .execute()

# BAD — never use f-strings or string interpolation in queries
query = f"SELECT * FROM captures WHERE project_id = '{project_id}'"
```

### Batch operations for bulk inserts

```python
# GOOD — single insert call with list
supabase.table("memories").insert(memories_list).execute()

# BAD — loop of individual inserts
for m in memories:
    supabase.table("memories").insert(m).execute()
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

### Example migration (current schema style)

```sql
-- Add signal_rules and signal_matches tables
-- Phase 2C: Signals

CREATE TABLE public.signal_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'keyword' CHECK (match_type IN ('keyword', 'regex')),
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rollback:
-- DROP TABLE IF EXISTS public.signal_rules;
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Tables | `snake_case`, plural | `signal_rules`, `memory_associations` |
| Columns | `snake_case` | `project_id`, `created_at` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign keys | `<table_singular>_id` | `project_id`, `capture_id` |
| Indexes | `idx_<table>_<column>` | `idx_memories_project_id` |
| Timestamps | `*_at` suffix, TIMESTAMPTZ | `created_at`, `updated_at` |
| Booleans | `is_*` or `has_*` prefix | `is_active`, `is_captured` |
| JSONB columns | Plural noun or descriptive | `metadata`, `channel_config` |
| Enums | TEXT with CHECK constraint | `CHECK (status IN ('pending', 'confirmed', 'ignored'))` |

---

## Common Mistakes

### 1. Forgetting `ON DELETE` behavior
Always specify cascade/set null for foreign keys. Orphaned rows cause data inconsistency.

### 2. Missing indexes on frequently filtered columns
Always add indexes for `project_id`, `status`, `user_id` — any column used in WHERE clauses.

### 3. Storing embeddings without an index
pgvector without an IVFFlat or HNSW index becomes unusable at scale. Always create the index.

### 4. Using TEXT for enums without constraints
Always add CHECK constraints. Typos in enum values are silent bugs.

### 5. Not using TIMESTAMPTZ
Always use `TIMESTAMPTZ`, never `TIMESTAMP`. Users may be in different timezones.

### 6. Adding triggers for non-existent columns
Never create `BEFORE UPDATE ... EXECUTE FUNCTION update_updated_at_column()` triggers on tables that don't have an `updated_at` column. This will fail at migration time.