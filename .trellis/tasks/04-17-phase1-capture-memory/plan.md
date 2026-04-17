# Phase 1: Capture & Memory Pipeline - Implementation Plan

## Goal

Implement the core value chain: capture a URL → Python worker extracts content → AI generates structured memories → display in UI. Users can create projects, paste URLs, and see AI-extracted memory cards.

## Acceptance Criteria (from PRD)

- [ ] Create a project, see it in project list
- [ ] Paste a URL → content extracted and stored within 30s
- [ ] Extracted content shows as Memory cards with source attribution
- [ ] Home dashboard shows recent captures and project stats
- [ ] Offline: capture a URL while offline → syncs when back online

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

### Step 5: Offline Support

**Goal**: Capture URL while offline → syncs when back online

- PowerSync handles write queue automatically (when configured)
- Fallback: Queue captures locally in Supabase offline mode
- Show sync status indicator in sidebar
- Handle optimistic UI updates

### Step 6: Polish & Error Handling

**Goal**: Handle edge cases gracefully

- Loading states for all async operations
- Error states (worker down, API error, network offline)
- Empty states for projects, captures, memories
- Toast notifications for job completion/failure
- Retry logic for failed captures

## Architecture Decisions

| Decision               | Choice                        | Rationale                                     |
| ---------------------- | ----------------------------- | --------------------------------------------- |
| URL content extraction | Jina Reader API (r.jina.ai)   | Free, fast, handles JS-rendered pages         |
| LLM for extraction     | Gemini 3 Flash                | Cost-effective, fast, good structured output  |
| Embedding model        | all-MiniLM-L6-v2 (384-dim)    | Local, fast, good quality for semantic search |
| Job queue              | Supabase poll (2s interval)   | Simple, no extra infra needed for Phase 1     |
| Frontend state         | React Query + Supabase direct | Simple, no PowerSync dependency for Phase 1   |

## File Structure

```
src/features/
  projects/
    ProjectsPage.tsx          ✅ (basic)
    ProjectDetailPage.tsx     (new)
  captures/
    CapturesPage.tsx          (rewrite from shell)
    CaptureInput.tsx          (new)
  memories/
    MemoriesPage.tsx          (new)
  dashboard/
    DashboardPage.tsx         (rewrite from shell)

worker/src/worker/
  jobs/
    ingestion.py              (new - URL content fetching)
    extraction.py             (new - AI memory extraction)
  utils/
    llm.py                   ✅ (Gemini Flash)
    embeddings.py             (new - all-MiniLM-L6-v2)
    supabase.py              ✅
```

## Dependencies

- Phase 0 ✅ (foundation complete)
- `readability-lxml` or `r.jina.ai` for URL extraction
- `sentence-transformers` for embeddings (already using all-MiniLM-L6-v2)
