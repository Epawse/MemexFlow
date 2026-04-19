# Phase 3 PRD: Candidate Confirmation, External Signals, Recall Loop

> **Priority**: P0 — These 3 features differentiate MemexFlow from Cubox AI and complete the "AI 知识沉淀工具" value proposition.

---

## Background

Current implementation covers ~40% of the strategy vision. The most critical gaps are:

1. **No candidate confirmation** — captures auto-chain into memories without user review. Users can't control what enters their knowledge base.
2. **Signals are internal-only** — signal rules only match keywords against existing memories. No RSS/GitHub external discovery.
3. **No recall loop** — memories are written once and never resurfaced. No mechanism to revisit knowledge when it becomes relevant.

These three features transform MemexFlow from "save + search" (same as Cubox AI) into "curate + discover + recall" — a true knowledge crystallization tool.

---

## 3A: Candidate Confirmation Flow

### Problem

Currently, `handle_ingestion` auto-chains into `handle_extraction`, creating memories without user review. This means:
- Low-quality or irrelevant captures pollute the memory store
- Users have no control over what becomes a "memory"
- No way to ignore spam, duplicates, or low-value content

### Solution

Add a `status` column to `captures` with a confirmation flow:

```
Capture created → status='pending' → User reviews → Confirm or Ignore
  Confirm → status='confirmed', extraction job created → Memory created
  Ignore → status='ignored', no further processing
```

### Database Changes

**Migration: `20260419010000_add_capture_status.sql`**

```sql
-- Add status and confirmed_at to captures
ALTER TABLE public.captures
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'ignored')),
  ADD COLUMN confirmed_at TIMESTAMPTZ;

CREATE INDEX idx_captures_status ON public.captures(status);
CREATE INDEX idx_captures_user_status ON public.captures(user_id, status);

-- Backfill: existing captures with linked memories get status='confirmed'
UPDATE public.captures
SET status = 'confirmed', confirmed_at = created_at
WHERE id IN (
  SELECT DISTINCT c.id FROM public.captures c
  INNER JOIN public.memories m ON m.capture_id = c.id
);
```

### Worker Changes

**`handlers.py` modifications:**

1. **`handle_ingestion`**: Remove auto-chaining to extraction. After saving capture content, do NOT create an extraction job. Return `{"status": "pending"}`.
2. **New `handle_confirm`**: Takes `capture_id`, updates capture `status='confirmed'`, creates extraction job. Called when user confirms a pending capture.

**`main.py` TYPE_MAP addition:**

```python
TYPE_MAP = {
    ...,
    "confirm": "confirm",
}
```

### Frontend Changes

1. **CapturesPage**: Add status tabs (All / Pending / Confirmed / Ignored)
2. **Capture cards**: Add Confirm/Ignore buttons for `status='pending'` captures
3. **DashboardPage**: Add pending captures count badge/section
4. **`usePowerSyncQueries.ts`**: Add `usePendingCaptures()`, `confirmCapture()`, `ignoreCapture()`
5. **`models.ts`**: Add `status` and `confirmed_at` to `Capture` type

### Acceptance Criteria

- [ ] New captures default to `status='pending'` (not auto-confirmed)
- [ ] User can view pending captures in a dedicated tab
- [ ] Confirm button changes status to 'confirmed' and triggers extraction job
- [ ] Ignore button changes status to 'ignored' and prevents extraction
- [ ] Existing captures with memories are backfilled to 'confirmed'
- [ ] Dashboard shows count of pending captures
- [ ] Migration includes rollback SQL

---

## 3B: External Signals (RSS + GitHub)

### Problem

Signal rules currently only match keywords against **existing** memories. This is purely reactive — it can only find connections within what the user has already saved. There's no mechanism to discover **new external content** matching the user's interests.

### Solution

Add channel adapters that scan external sources (RSS feeds, GitHub releases) and create `signal_discoveries` — items found outside the user's knowledge base that the user can then capture.

```
Signal rule (with channel) → Scan external source → Create discoveries
  Discovery → User captures → Creates pending capture → Enters 3A flow
```

### Database Changes

**Migration: `20260419020000_add_signal_channels.sql`**

```sql
-- Add channel type and config to signal_rules
ALTER TABLE public.signal_rules
  ADD COLUMN channel_type TEXT NOT NULL DEFAULT 'internal'
    CHECK (channel_type IN ('internal', 'rss', 'github_release')),
  ADD COLUMN channel_config JSONB DEFAULT '{}'::jsonb;

-- Create signal_discoveries table
CREATE TABLE public.signal_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_rule_id UUID NOT NULL REFERENCES public.signal_rules(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'github_release')),
  source_uri TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMPTZ,
  is_captured BOOLEAN DEFAULT FALSE,
  capture_id UUID REFERENCES public.captures(id) ON DELETE SET NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signal_discoveries_rule ON public.signal_discoveries(signal_rule_id);
CREATE INDEX idx_signal_discoveries_user ON public.signal_discoveries(user_id);
CREATE INDEX idx_signal_discoveries_captured ON public.signal_discoveries(is_captured) WHERE is_captured = FALSE;

-- RLS
ALTER TABLE public.signal_discoveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own discoveries" ON public.signal_discoveries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own discoveries" ON public.signal_discoveries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discoveries" ON public.signal_discoveries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discoveries" ON public.signal_discoveries
  FOR DELETE USING (auth.uid() = user_id);

-- Update jobs type constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'signal_scan', 'confirm', 'recall', 'echo'));
```

### Worker Changes

**New: `worker/src/worker/channels/` package:**

```
channels/
├── __init__.py
├── base.py          # BaseChannel abstract class
├── rss.py           # RSS feed adapter
└── github_releases.py  # GitHub release adapter
```

**`base.py`:**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class Discovery:
    title: str
    source_uri: str
    summary: str | None
    published_at: str | None

class BaseChannel(ABC):
    @abstractmethod
    async def scan(self, config: dict) -> list[Discovery]: ...
```

**`rss.py`:** Fetch RSS feed via httpx, parse with `feedparser` or `xml.etree`, return matching items.

**`github_releases.py`:** Fetch releases from GitHub API (`/repos/{owner}/{repo}/releases`), return matching items.

**New `handle_signal_scan` in `handlers.py`:**

```python
async def handle_signal_scan(input_data: dict) -> dict:
    """Scan external channel (RSS/GitHub) for new discoveries."""
    signal_rule_id = input_data.get("signal_rule_id", "")
    user_id = input_data.get("user_id", "")

    # 1. Fetch rule (channel_type, channel_config)
    # 2. Select channel adapter
    # 3. Scan external source
    # 4. Filter by query keyword
    # 5. Dedupe against existing discoveries
    # 6. Insert signal_discoveries rows
    # 7. Update last_checked_at
```

**`main.py` TYPE_MAP addition:** `"signal_scan": "signal_scan"`

### Frontend Changes

1. **SignalRuleForm**: Add channel type selector (Internal / RSS / GitHub Release)
2. **SignalRuleForm**: Show channel_config fields (RSS: feed URL; GitHub: owner/repo)
3. **SignalsPage**: Add "Discoveries" tab showing uncaptured discoveries
4. **Discovery cards**: "Capture" button creates a pending capture (enters 3A flow)
5. **`models.ts`**: Add `SignalDiscovery` type, `channel_type` and `channel_config` to `SignalRule`
6. **`usePowerSyncQueries.ts`**: Add `useDiscoveries()`, `captureDiscovery()`
7. **PowerSync schema**: Add `signal_discoveries` table, update `signal_rules` columns

### Acceptance Criteria

- [ ] User can create signal rules with channel_type='rss' and provide a feed URL
- [ ] User can create signal rules with channel_type='github_release' and provide owner/repo
- [ ] "Scan now" action triggers signal_scan job for the rule
- [ ] Discoveries appear in the SignalsPage discoveries tab
- [ ] "Capture" on a discovery creates a pending capture (enters 3A confirmation flow)
- [ ] Internal signal rules continue to work as before
- [ ] Channel adapters handle HTTP errors gracefully
- [ ] Migration includes rollback SQL

---

## 3C: Recall Loop

### Problem

Memories are written once and never revisited. As the knowledge base grows, older memories become invisible. There's no mechanism to surface relevant past knowledge when it becomes timely again.

### Solution

Add a `recalls` table and a recall job that uses heuristics to identify memories worth revisiting:

- **Time-based**: Memories not reviewed in 30+ days
- **Project-active**: Memories in recently-active projects
- **Association-dense**: Memories with many links (supports/contradicts/elaborates)
- **Signal-triggered**: Memories that recently matched a signal rule

```
"Find memories to revisit" → recall job → recall suggestions → User revisits or dismisses
```

### Database Changes

**Migration: `20260419030000_add_recalls.sql`**

```sql
CREATE TABLE public.recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('time_based', 'project_active', 'association_dense', 'signal_triggered')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reason_detail TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revisited_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recalls_user ON public.recalls(user_id);
CREATE INDEX idx_recalls_memory ON public.recalls(memory_id);
CREATE INDEX idx_recalls_pending ON public.recalls(user_id, dismissed_at) WHERE dismissed_at IS NULL;

-- RLS
ALTER TABLE public.recalls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recalls" ON public.recalls
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recalls" ON public.recalls
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recalls" ON public.recalls
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recalls" ON public.recalls
  FOR DELETE USING (auth.uid() = user_id);
```

### Worker Changes

**New `handle_recall` in `handlers.py`:**

```python
async def handle_recall(input_data: dict) -> dict:
    """Find memories worth revisiting and create recall suggestions."""
    user_id = input_data.get("user_id", "")
    project_id = input_data.get("project_id")  # optional

    # Heuristic scoring:
    # 1. time_based: memories older than 30 days with no recall
    # 2. project_active: memories in projects with recent activity
    # 3. association_dense: memories with 3+ associations
    # 4. signal_triggered: memories that recently matched a signal rule

    # Insert recall rows for top-scored memories
    # Return count of recalls created
```

**`main.py` TYPE_MAP addition:** `"recall": "recall"`

### Frontend Changes

1. **New route: `/recall`** — RecallPage showing pending recall suggestions
2. **Recall cards**: Memory summary + reason (why this memory is relevant now) + Revisit/Dismiss buttons
3. **Revisit action**: Marks `revisited_at`, optionally opens memory detail
4. **Dismiss action**: Marks `dismissed_at`
5. **DashboardPage**: Add "Memories to revisit" section with top 3 recall suggestions
6. **`models.ts`**: Add `Recall` type with `reason`, `priority`, `reason_detail`
7. **`usePowerSyncQueries.ts`**: Add `usePendingRecalls()`, `revisitRecall()`, `dismissRecall()`
8. **PowerSync schema**: Add `recalls` table

### Acceptance Criteria

- [ ] User can trigger "Find memories to revisit" which creates a recall job
- [ ] Recall page shows pending suggestions with human-readable reason
- [ ] Revisit marks the recall as revisited and shows the memory
- [ ] Dismiss marks the recall as dismissed
- [ ] Dashboard shows top 3 recall suggestions
- [ ] Recall heuristics produce meaningful suggestions (not random)
- [ ] Migration includes rollback SQL

---

## Implementation Order

1. **3A first** — Candidate confirmation is foundational; 3B's discoveries flow into it
2. **3B second** — External signals depend on 3A (discoveries → pending capture → confirm)
3. **3C third** — Recall loop is independent but benefits from having the full data model in place

---

## Out of Scope

- Vector similarity recall (future: pgvector-based "similar to what you're reading now")
- Automated extraction quality scoring
- Agent-based extraction (multi-step reasoning)
- Mobile apps
- Email/newsletter channel adapter
- Recall frequency scheduling (cron-like periodic recall)