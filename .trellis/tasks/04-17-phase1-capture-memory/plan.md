# Phase 1: Capture & Memory Pipeline - Implementation Plan

## Goal

Implement the core value chain: capture a URL → Python worker extracts content → AI generates structured memories → display in UI. Users can create projects, paste URLs, and see AI-extracted memory cards.

## Acceptance Criteria (from PRD)

- [x] Create a project, see it in project list
- [x] Paste a URL → content extracted and stored within 30s
- [x] Extracted content shows as Memory cards with source attribution
- [x] Home dashboard shows recent captures and project stats
- [x] Offline: capture a URL while offline → syncs when back online

## Implementation Steps

### Step 1: Projects — CRUD Complete

**Goal**: Full project management (create, list, view, update, delete)

Pages/components:

- `ProjectsPage` — list with cards, create modal ✅ (basic create done)
- `ProjectDetailPage` — view project, show its captures/memories
- Project archive/delete actions

Data flow:

- Supabase direct writes (PowerSync optional for offline)
- React Query cache invalidation

### Step 2: Capture — URL Input & Content Extraction

**Goal**: User pastes URL → worker fetches & extracts → stored as Capture record

Frontend:

- `CapturesPage` — URL input bar, capture list, status indicators
- `CaptureInput` component — paste URL, submit, show processing state
- Capture detail view — raw content display

Worker (Python):

- `ingestion_job` — fetch URL content (Jina Reader API or readability-lxml)
- Store extracted content in `captures` table
- Trigger `extraction_job` after successful ingestion

Job flow:

1. Frontend creates `Capture` row + `Job` row (type=ingestion, status=pending)
2. Worker polls jobs, picks up ingestion job
3. Worker fetches URL, extracts title/content/metadata
4. Worker updates `Capture` row, creates `Job` row (type=extraction, status=pending)
5. Worker runs extraction → creates Memory rows

### Step 3: Memory — AI Extraction & Display

**Goal**: AI extracts claims/summaries from captures → displayed as Memory cards

Worker (Python):

- `extraction_job` — send content to LLM (Gemini Flash), parse structured output
- Extract: summary, key claims, topics, confidence
- Create `Memory` rows linked to `Capture` via `capture_id`
- Update `embedding` column with all-MiniLM-L6-v2 vectors

Frontend:

- `MemoriesPage` (or section within project) — list of memory cards
- Memory card: shows summary, key claims, source capture link, confidence
- Link to original capture

### Step 4: Home Dashboard

**Goal**: Dashboard shows recent activity, project stats, quick actions

Components:

- Stats cards: total captures, memories, projects, briefs (with live counts)
- Recent captures list (last 5)
- Active projects list
- Quick capture input (paste URL from dashboard)

Data:

- Supabase queries for stats (count queries)
- Recent captures ordered by `created_at DESC`

### Step 5: Offline Support ✅

**Goal**: Capture URL while offline → syncs when back online + sync status indicator

**Architecture**: Progressive migration from direct Supabase to PowerSync-first with fallback

#### 5a. Schema fix — add `captures.status` to PowerSync

Local SQLite schema must match Supabase. Currently missing `captures.status`.

- Add `status: column.text` to `captures` table in `src/lib/powersync.ts`
- PowerSync `uploadData` already handles PUT/PATCH/DELETE generically

#### 5b. Reads — Replace Supabase `.select()` with `useQuery()` hooks

Migrate each page from `useEffect` + `supabase.from().select()` to reactive `useQuery()` from `@powersync/react`:

| Page                | Current (Supabase direct)                       | Target (PowerSync `useQuery`)                                    |
| ------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| `ProjectsPage`      | `supabase.from('projects').select()`            | `useQuery('SELECT * FROM projects WHERE user_id = ?', [userId])` |
| `ProjectDetailPage` | `supabase.from('projects/captures/memories')`   | Multiple `useQuery()` calls                                      |
| `CapturesPage`      | `supabase.from('captures/projects/jobs')`       | `useQuery()` with joins                                          |
| `MemoriesPage`      | `supabase.from('memories/projects/captures')`   | `useQuery()` calls                                               |
| `DashboardPage`     | `supabase.from().select('id', {count:'exact'})` | `useQuery()` for counts + lists                                  |

**Fallback pattern**: Check `getPowerSyncDb()`. If null (no `VITE_POWERSYNC_URL`), use Supabase direct.

#### 5c. Writes — Replace Supabase `.insert/update/delete` with `db.execute()`

Migrate all mutation calls to `db.execute()` SQL statements:

| Action                   | Current                                   | Target                                                                                      |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Create project           | `supabase.from('projects').insert()`      | `db.execute('INSERT INTO projects ...')`                                                    |
| Capture URL + create job | `createCapture()` (Supabase direct)       | `db.execute('INSERT INTO captures ...'); db.execute('INSERT INTO jobs ...')` in transaction |
| Update project           | `supabase.from('projects').update()`      | `db.execute('UPDATE projects SET ... WHERE id = ?')`                                        |
| Archive/delete project   | `supabase.from('projects').update/delete` | `db.execute('UPDATE/DELETE FROM projects WHERE id = ?')`                                    |

**Fallback**: If PowerSync not available, fall back to Supabase direct in `createCapture()`.

#### 5d. Sync Status Indicator — `useStatus()` in sidebar

Add `SyncStatusIndicator` component to `DashboardLayout.tsx`:

```tsx
import { useStatus } from "@powersync/react";
// Shows: connected ✅ / disconnected ❌ / syncing ⏳
// Uses status.connected, status.hasSynced, status.dataFlowStatus.uploading/downloading
```

#### 5e. PowerSync queries for Dashboard stats

Dashboard needs aggregate queries (COUNT). PowerSync `useQuery` supports SQL aggregate:

```tsx
const { data: stats } = useQuery(
  "SELECT count(*) as count FROM captures WHERE user_id = ?",
  [userId],
);
```

#### Implementation order

1. Fix PowerSync schema (`captures.status`)
2. Update `usePowerSyncQueries.ts` — add missing hooks (COUNT queries, dashboard stats)
3. Migrate reads (one page at a time, test each)
4. Migrate writes (one action at a time, test each)
5. Add `SyncStatusIndicator` to sidebar
6. Test offline: disable network → capture URL → verify local write → re-enable → verify sync

### Step 6: Polish & Error Handling (pending)

**Goal**: Handle edge cases gracefully

- Loading states for all async operations
- Error states (worker down, API error, network offline)
- Empty states for projects, captures, memories
- Toast notifications for job completion/failure
- Retry logic for failed captures

## Architecture Decisions

| Decision               | Choice                                                     | Rationale                                          |
| ---------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| URL content extraction | Jina Reader API (r.jina.ai)                                | Free, fast, handles JS-rendered pages              |
| LLM for extraction     | Gemini 3 Flash                                             | Cost-effective, fast, good structured output       |
| Embedding model        | all-MiniLM-L6-v2 (384-dim)                                 | Local, fast, good quality for semantic search      |
| Job queue              | Supabase poll (2s interval)                                | Simple, no extra infra needed for Phase 1          |
| Data reads             | PowerSync `useQuery` (fallback Supabase direct)            | Local-first, reactive, offline-capable             |
| Data writes            | PowerSync `db.execute` (fallback Supabase direct)          | Offline queue, auto-sync on reconnect              |
| Capture+Job creation   | Shared `createCapture()` in `src/lib/captures.ts`          | Single source of truth for job type + input format |
| Sync status            | PowerSync `useStatus()` → `SyncStatusIndicator` in sidebar | Visual feedback for connected/disconnected/syncing |

## File Structure

```
src/
  lib/
    captures.ts              ✅ shared capture+job creation utility
    powersync.ts              ✅ PowerSync schema + connector (needs captures.status)
    PowerSyncProvider.tsx     ✅ PowerSync context provider
    supabase.ts               ✅ Supabase client
    AuthProvider.tsx           ✅ Auth context
  hooks/
    usePowerSyncQueries.ts    ✅ useQuery hooks (needs update for dashboard stats)
  features/
    projects/
      ProjectsPage.tsx           ✅ (projects CRUD)
      ProjectDetailPage.tsx       ✅ (captures, memories, settings tabs)
    captures/
      CapturesPage.tsx           ✅ (capture URL input, grouped list)
    memories/
      MemoriesPage.tsx            ✅ (memory cards with confidence badges)
    dashboard/
      DashboardPage.tsx           ✅ (stats, recent captures, quick capture)
  shared/components/
    SyncStatusIndicator.tsx       (new — uses useStatus())
    DashboardLayout.tsx           ✅ (add SyncStatusIndicator to sidebar)

worker/src/worker/
  jobs/handlers.py               ✅ (ingestion + extraction + briefing)
  utils/llm.py                    ✅ (Gemini with fallback)
  utils/supabase.py               ✅ (Supabase client singleton)
```

## Dependencies

- Phase 0 ✅ (foundation complete)
- `readability-lxml` or `r.jina.ai` for URL extraction
- `sentence-transformers` for embeddings (already using all-MiniLM-L6-v2)
