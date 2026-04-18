# Phase 2: Briefs, Signals & Enhanced Memory — Product Requirements Document

## Overview

Phase 2 adds the **intelligence layer** on top of the Phase 1 capture-to-memory pipeline:

- **Briefs**: Generate AI research reports from project memories, with source citations
- **Signals**: Create monitoring rules that match against existing memories via keywords
- **Enhanced Memory**: Local FTS5 search, memory associations (supports/contradicts/elaborates)

This completes the core value chain: **Capture → Memory → Briefs** and adds proactive intelligence via Signals.

## User Stories

1. As a researcher, I want to generate a brief from my project memories so I can synthesize what I've learned
2. As a researcher, I want my brief to cite specific memories so I can verify claims against sources
3. As a researcher, I want to search my memories by keyword so I can quickly find what I need
4. As a researcher, I want to link memories as "supports" or "contradicts" so I can track evidence relationships
5. As a researcher, I want to create signal rules that notify me when new memories match my topics of interest

## Subtask Breakdown

Phase 2 is split into 3 sequential subtasks, each independently testable:

```
2A: Enhanced Memory (search + associations)
 ↓
2B: Briefs (generate + display + citations)
 ↓
2C: Signals (rules + keyword matching + notifications)
```

**Rationale**: Enhanced Memory is first because briefs need memory search to find relevant memories, and associations enrich brief context. Briefs come before Signals because briefs complete the core value chain.

---

## Subtask 2A: Enhanced Memory

### Goal

Add keyword search and evidence linking to the existing Memories module.

### DB Changes

**New table: `memory_associations`**

```sql
CREATE TABLE public.memory_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  to_memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('supports', 'contradicts', 'elaborates', 'related')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate associations
CREATE UNIQUE INDEX idx_memory_associations_unique
  ON public.memory_associations(from_memory_id, to_memory_id, relation_type);

CREATE INDEX idx_memory_associations_from ON public.memory_associations(from_memory_id);
CREATE INDEX idx_memory_associations_to ON public.memory_associations(to_memory_id);
CREATE INDEX idx_memory_associations_user ON public.memory_associations(user_id);

-- RLS
ALTER TABLE public.memory_associations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own associations" ON public.memory_associations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own associations" ON public.memory_associations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own associations" ON public.memory_associations
  FOR DELETE USING (auth.uid() = user_id);
```

**FTS5 for local search** (PowerSync SQLite)

Add a PowerSync migration that creates an FTS5 virtual table on the local SQLite side. PowerSync's sync rules will need to include the columns we want to search.

PowerSync `sync_rules.yaml` update:
```yaml
global:
  - SELECT id, content, summary, project_id, user_id, created_at FROM memories WHERE user_id = token_parameters.user_id
```

Local FTS5 index (created after PowerSync db init):
```sql
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  content,
  summary,
  content='memories',
  content_rowid='rowid'
);

-- Triggers to keep FTS5 in sync
CREATE TRIGGER memories_fts_insert AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, content, summary) VALUES (new.rowid, new.content, new.summary);
END;

CREATE TRIGGER memories_fts_delete AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, summary) VALUES('delete', old.rowid, old.content, old.summary);
END;

CREATE TRIGGER memories_fts_update AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, summary) VALUES('delete', old.rowid, old.content, old.summary);
  INSERT INTO memories_fts(rowid, content, summary) VALUES (new.rowid, new.content, new.summary);
END;
```

> **Note**: PowerSync SQLite doesn't directly support FTS5 virtual tables via sync. The approach is to create the FTS5 table after PowerSync initialization, populated from the synced `memories` table, and kept in sync via triggers. This needs to be done in the PowerSync backend setup code.

### Frontend Features

| ID    | Feature | Priority | Description |
|-------|---------|----------|-------------|
| M2-01 | Memory keyword search | P0 | Search bar above memory list, queries FTS5, shows matching memories |
| M2-02 | Create association | P0 | "Link memory" button on expanded memory → select target + relation type |
| M2-03 | View associations | P0 | Show association badges on memory cards (e.g., "2 supports, 1 contradicts") |
| M2-04 | Association detail | P1 | Click association badge → see linked memories with relation labels |
| M2-05 | Delete association | P1 | Remove an association from the association detail view |
| M2-06 | Filter by memory type | P2 | Dropdown to filter by claim/insight/entity/summary |
| M2-07 | Sort memories | P2 | Sort by date, confidence, project |

### Worker Changes

None. Search is local (FTS5). Associations are user-created via PowerSync writes.

### Acceptance Criteria

- [ ] Search bar returns matching memories for keyword queries (< 100ms for < 10K memories)
- [ ] Can link two memories with relation type (supports/contradicts/elaborates/related)
- [ ] Association badges visible on memory cards
- [ ] Can view and delete associations
- [ ] `npx tsc --noEmit` and `npm run lint` pass

---

## Subtask 2B: Briefs

### Goal

Enable AI-generated research briefs from project memories, with source citations linking back to specific memories.

### DB Changes

**New table: `brief_memories`**

```sql
CREATE TABLE public.brief_memories (
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  relevance TEXT,  -- how this memory relates to the brief section
  PRIMARY KEY (brief_id, memory_id)
);

CREATE INDEX idx_brief_memories_brief ON public.brief_memories(brief_id);
CREATE INDEX idx_brief_memories_memory ON public.brief_memories(memory_id);

-- RLS
ALTER TABLE public.brief_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own brief memories" ON public.brief_memories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.briefs WHERE briefs.id = brief_memories.brief_id AND briefs.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own brief memories" ON public.brief_memories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.briefs WHERE briefs.id = brief_memories.brief_id AND briefs.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own brief memories" ON public.brief_memories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.briefs WHERE briefs.id = brief_memories.brief_id AND briefs.user_id = auth.uid())
  );
```

**Update `jobs` type constraint** to include `briefing` type (already done in migration `20260417020000`).

**Update `briefs` table**: The existing schema already has `status` (pending/processing/completed/failed) and `type` (daily/weekly/project/custom). This is sufficient. We'll primarily use `type = 'project'`.

### Frontend Features

| ID    | Feature | Priority | Description |
|-------|---------|----------|-------------|
| B2-01 | Generate brief button | P0 | On project detail page, "Generate Brief" button creates a briefing job |
| B2-02 | Brief list | P0 | Replace BriefsPage empty state with list of briefs (card view) |
| B2-03 | Brief detail view | P0 | Rendered markdown with clickable memory citations |
| B2-04 | Brief progress | P0 | Show generation status (pending → processing → completed/failed) |
| B2-05 | Cited memories sidebar | P1 | In brief detail, sidebar showing all referenced memories |
| B2-06 | Delete brief | P1 | Delete a brief from brief list or detail view |
| B2-07 | Brief type selector | P2 | Choose brief type (project/daily/weekly/custom) when generating |

### Worker Changes

**Enhance `handle_briefing`** to:

1. Fetch project memories from Supabase (all memories for the project)
2. Generate structured brief with inline citation markers (e.g., `[M1]`, `[M2]`)
3. Write result to `briefs` table (title, content, status='completed')
4. Write citation links to `brief_memories` junction table
5. Handle errors gracefully (set status='failed', write error message)

**Updated `handle_briefing` input schema:**

```json
{
  "project_id": "uuid",
  "user_id": "uuid"
}
```

The handler itself queries Supabase for the project's memories, rather than receiving them in the input. This keeps the job input small and avoids stale data.

**Brief generation prompt structure:**

```
Generate a research brief based on the following memories from a research project.

Structure:
1. Executive Summary (2-3 sentences)
2. Key Findings (with citations [M1], [M2], etc.)
3. Evidence & Sources (details for each cited memory)
4. Evidence Gaps (what's missing)
5. Recommendations (next steps)

Memories:
[M1] [claim] Confidence: 0.8 | Source: {capture_title}
[M2] [claim] Confidence: 0.9 | Source: {capture_title}
...

Return JSON: { "title": "...", "content_markdown": "...", "cited_memory_ids": ["id1", "id2", ...] }
```

### Frontend Brief Flow

```
User clicks "Generate Brief" on project detail
  ↓
Frontend: INSERT briefs (title="Generating...", status='pending', type='project')
          + INSERT jobs (type='briefing', input={project_id, user_id})
  ↓
PowerSync syncs brief row → UI shows "Generating..." with spinner
  ↓
Worker: handle_briefing → fetches memories → generates brief → updates briefs row
  ↓
PowerSync syncs updated brief → UI shows completed brief with content
```

### Acceptance Criteria

- [ ] "Generate Brief" button creates a briefing job, brief appears in list
- [ ] Brief generation completes within 2 min for a project with 20+ memories
- [ ] Brief content is rendered markdown with clickable memory citations
- [ ] Cited memories are linked via `brief_memories` junction table
- [ ] Brief status updates visible in UI (pending → processing → completed/failed)
- [ ] `npx tsc --noEmit` and `npm run lint` pass

---

## Subtask 2C: Signals

### Goal

Create keyword-based monitoring rules that detect matches in existing memories and notify the user.

### DB Changes

**New tables: `signal_rules` and `signal_matches`**

The existing `signals` table is unused and doesn't match the needed schema. We'll create new tables and deprecate it.

```sql
-- Signal rules: user-defined monitoring queries
CREATE TABLE public.signal_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,           -- keyword or phrase to match
  match_type TEXT NOT NULL DEFAULT 'keyword' CHECK (match_type IN ('keyword', 'regex')),
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signal_rules_user ON public.signal_rules(user_id);
CREATE INDEX idx_signal_rules_project ON public.signal_rules(project_id);
CREATE INDEX idx_signal_rules_active ON public.signal_rules(is_active) WHERE is_active = TRUE;

-- Signal matches: when a rule fires
CREATE TABLE public.signal_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_rule_id UUID NOT NULL REFERENCES public.signal_rules(id) ON DELETE CASCADE,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  matched_text TEXT,             -- the text snippet that matched
  is_dismissed BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signal_matches_rule ON public.signal_matches(signal_rule_id);
CREATE INDEX idx_signal_matches_user ON public.signal_matches(user_id);
CREATE INDEX idx_signal_matches_dismissed ON public.signal_matches(is_dismissed) WHERE is_dismissed = FALSE;

-- RLS
ALTER TABLE public.signal_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signal rules" ON public.signal_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signal rules" ON public.signal_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signal rules" ON public.signal_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own signal rules" ON public.signal_rules
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.signal_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signal matches" ON public.signal_matches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signal matches" ON public.signal_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signal matches" ON public.signal_matches
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own signal matches" ON public.signal_matches
  FOR DELETE USING (auth.uid() = user_id);
```

### Frontend Features

| ID    | Feature | Priority | Description |
|-------|---------|----------|-------------|
| S2-01 | Create signal rule | P0 | In project detail, add a rule with name + keyword query |
| S2-02 | Signal rules list | P0 | Display active rules per project with edit/delete |
| S2-03 | Signal matches view | P0 | List of recent matches across all projects |
| S2-04 | Match notification badge | P0 | Badge on Home dashboard + project card when new matches exist |
| S2-05 | Dismiss match | P1 | Mark a match as dismissed so it doesn't show in unread |
| S2-06 | Toggle rule active/inactive | P1 | Pause a rule without deleting it |
| S2-07 | Dashboard signal section | P1 | Show recent signal matches on home dashboard |

### Worker Changes

**New handler: `handle_signal`**

Input:
```json
{
  "signal_rule_id": "uuid",
  "user_id": "uuid"
}
```

Logic:
1. Fetch the signal rule (query, match_type)
2. If `match_type = 'keyword'`: search memories for keyword matches (using Supabase `ilike` or Postgres full-text search)
3. For each match found, check if a `signal_match` already exists for this rule + memory combo (avoid duplicates)
4. Insert new `signal_matches` rows
5. Update `signal_rules.last_checked_at`

**Signal checking trigger**: Two options:
- **Option A (simple)**: User manually triggers "Check signals" button
- **Option B (periodic)**: Worker periodically checks all active signal rules (needs a scheduler)

For Phase 2, **Option A** is sufficient. Manual trigger keeps things simple. We can add periodic checking in Phase 3.

### Frontend Signal Flow

```
User creates signal rule: "RAG" in project "LLM Research"
  ↓
Frontend: INSERT signal_rules (name, query, match_type='keyword')
  ↓
User clicks "Check signals" or signal rule has "Run now" button
  ↓
Frontend: INSERT jobs (type='signal', input={signal_rule_id, user_id})
  ↓
Worker: handle_signal → searches memories → creates signal_matches
  ↓
PowerSync syncs → UI shows new matches with badge
```

### Dashboard Enhancement

Add a "Recent Signals" section to the dashboard showing:
- Number of unread signal matches
- Last 5 matches with rule name + matched text preview

### Acceptance Criteria

- [ ] Can create a signal rule with name + keyword query
- [ ] "Run now" on a rule triggers matching, matches appear within 30s
- [ ] Match notification badge shows on Home + project card
- [ ] Can dismiss matches
- [ ] Can toggle rules active/inactive
- [ ] `npx tsc --noEmit` and `npm run lint` pass

---

## Shared Infrastructure Changes

### PowerSync Sync Rules Update

Add new tables to PowerSync sync rules:

```yaml
global:
  # Existing
  - SELECT * FROM projects WHERE user_id = token_parameters.user_id
  - SELECT * FROM captures WHERE user_id = token_parameters.user_id
  - SELECT * FROM memories WHERE user_id = token_parameters.user_id
  - SELECT * FROM jobs WHERE user_id = token_parameters.user_id
  # New
  - SELECT * FROM briefs WHERE user_id = token_parameters.user_id
  - SELECT * FROM brief_memories WHERE brief_id IN (SELECT id FROM briefs WHERE user_id = token_parameters.user_id)
  - SELECT * FROM memory_associations WHERE user_id = token_parameters.user_id
  - SELECT * FROM signal_rules WHERE user_id = token_parameters.user_id
  - SELECT * FROM signal_matches WHERE user_id = token_parameters.user_id
```

### Frontend Row Types Update

Add new types to `src/lib/models.ts`:

```typescript
export type MemoryAssociation = TableRow<"memory_associations">;
export type BriefMemory = TableRow<"brief_memories">;
export type SignalRule = TableRow<"signal_rules">;
export type SignalMatch = TableRow<"signal_matches">;
```

### Worker `JOB_HANDLERS` Update

```python
JOB_HANDLERS = {
    "echo": handle_echo,
    "ingestion": handle_ingestion,
    "extraction": handle_extraction,
    "briefing": handle_briefing,
    "signal": handle_signal,      # NEW
}
```

Also update the `jobs.type` constraint to include `signal` type.

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Signal matching scope | Internal keyword matching only | Simplest meaningful version; demonstrates concept without external API dependency |
| Brief trigger | Manual only | User controls API costs; no surprise generation runs |
| Memory search | FTS5 keyword search only (local) | Instant, offline, simple. pgvector semantic search deferred to Phase 3 (Recall) |
| Brief citations | Inline markers `[M1]` + junction table | Clean markdown rendering with clickable links; `brief_memories` tracks the relationship |
| Signal trigger | Manual "Run now" | No scheduler needed; keeps Phase 2 simple. Periodic checks deferred to Phase 3 |
| Old `signals` table | Kept, not dropped | Zero-risk approach; unused table doesn't hurt. Can drop in cleanup migration later |
| Association creation UX | "Link memory" button + select from list | Simple, works on mobile too. Drag-drop is over-engineering for v1 |

---

## Dependency Graph

```
Phase 1 (complete)
  ↓
2A: Enhanced Memory (search + associations)
  ├── DB: memory_associations table
  ├── DB: FTS5 local index
  ├── Frontend: search bar, association UI
  └── No worker changes
  ↓
2B: Briefs (generate + display + citations)
  ├── DB: brief_memories junction table
  ├── Worker: enhanced handle_briefing
  ├── Frontend: brief generation, detail view, citations
  └── Uses memory search from 2A for finding relevant memories
  ↓
2C: Signals (rules + matching + notifications)
  ├── DB: signal_rules + signal_matches tables
  ├── Worker: new handle_signal handler
  ├── Frontend: rule CRUD, match display, notifications
  └── Dashboard: signal badges
```

---

## Acceptance Criteria (Phase 2 Overall)

From the parent v1 PRD:

- [ ] Request a brief from project memories → generated within 2 min
- [ ] Brief references specific memories with source links
- [ ] Create a signal rule → matches show in notification area
- [ ] Memory search returns relevant results (FTS5)
- [ ] Link two memories as "supports" or "contradicts"

---

## Out of Scope (Phase 3+)

- pgvector semantic search (Recall module)
- RSS/external signal sources
- Auto-signal checking (periodic scheduler)
- Brief type selection (daily/weekly/custom templates)
- Memory type filter and sort (P2 items from 2A)
- Command palette / global shortcuts
- Browser extension for capture

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| FTS5 + PowerSync integration complexity | Medium | Medium | FTS5 triggers on local SQLite may need careful setup; test early with PowerSync dev instance |
| Brief generation quality (LLM citation format) | Medium | Low | Use strict prompt with JSON output; parse citations defensively |
| Signal keyword matching too noisy | Medium | Low | Start with exact word matching; can add threshold/filtering later |
| Brief content rendering (XSS from markdown) | Low | High | Use `react-markdown` with sanitization; never render raw HTML from LLM output |
| Schema migration conflicts with existing data | Low | Medium | All new tables; no ALTER on existing tables except jobs type constraint (already done) |

---

## Estimated Effort

| Subtask | Frontend | Backend/Worker | DB | Total |
|---------|----------|---------------|-----|-------|
| 2A: Enhanced Memory | ~1.5 day | — | ~0.5 day | ~2 days |
| 2B: Briefs | ~1.5 day | ~1 day | ~0.5 day | ~3 days |
| 2C: Signals | ~1.5 day | ~0.5 day | ~0.5 day | ~2.5 days |
| **Total** | **~4.5 days** | **~1.5 days** | **~1.5 days** | **~7.5 days** |
