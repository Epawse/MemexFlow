# Phase 1: Capture & Memory Pipeline — Product Requirements Document

## Overview

MemexFlow Phase 1 implements the core value chain: **paste a URL → AI extracts structured memories → display in projects and dashboard**. This is the minimum viable product that demonstrates the full data flow from user input to AI-processed output.

## User Stories

1. As a researcher, I want to create a project so I can organize my research by topic
2. As a researcher, I want to paste a URL and have it automatically extracted so I don't have to manually copy content
3. As a researcher, I want to see AI-extracted memories (claims, insights) from my captures so I can quickly understand what I've read
4. As a researcher, I want a dashboard that shows my recent activity so I can pick up where I left off
5. As a researcher, I want to capture URLs while offline and have them sync when I'm back online

## Functional Requirements

### Projects (Basic)

| ID    | Requirement                                                       | Priority |
| ----- | ----------------------------------------------------------------- | -------- |
| P1-01 | Create project with title, description, and color                 | P0       |
| P1-02 | View list of projects with cards                                  | P0       |
| P1-03 | View project detail page with tabs (Captures, Memories, Settings) | P0       |
| P1-04 | Archive and delete projects                                       | P1       |
| P1-05 | Edit project title, description, color                            | P1       |

### Captures

| ID    | Requirement                                                             | Priority |
| ----- | ----------------------------------------------------------------------- | -------- |
| C1-01 | Paste URL and submit as capture                                         | P0       |
| C1-02 | Capture is saved to Supabase with type='url'                            | P0       |
| C1-03 | Ingestion job is created automatically after capture                    | P0       |
| C1-04 | View list of captures grouped by project                                | P0       |
| C1-05 | See capture processing status (pending → processing → completed/failed) | P0       |
| C1-06 | View capture detail with extracted content                              | P1       |

### Memories (Basic)

| ID    | Requirement                                                               | Priority |
| ----- | ------------------------------------------------------------------------- | -------- |
| M1-01 | Extraction job creates structured memories from capture content           | P0       |
| M1-02 | Each memory has summary, key claims, confidence score, source attribution | P0       |
| M1-03 | Memory cards displayed with confidence-coded badges (green/yellow/red)    | P0       |
| M1-04 | Filter memories by project                                                | P1       |
| M1-05 | Expand/collapse memory to see full content                                | P1       |

### Dashboard

| ID    | Requirement                                                | Priority |
| ----- | ---------------------------------------------------------- | -------- |
| D1-01 | Show total counts for captures, memories, projects, briefs | P0       |
| D1-02 | Show 5 most recent captures                                | P0       |
| D1-03 | Show active projects with quick navigation                 | P0       |
| D1-04 | Quick capture input (paste URL from dashboard)             | P1       |

### Offline Support

| ID    | Requirement                        | Priority |
| ----- | ---------------------------------- | -------- |
| O1-01 | Capture URL while offline          | P1       |
| O1-02 | Sync status indicator in sidebar   | P1       |
| O1-03 | Optimistic UI updates for captures | P2       |

## Data Flow

```
User pastes URL
    ↓
Frontend: INSERT captures (type='url') + INSERT jobs (type='ingestion')
    ↓
Worker: Ingestion handler fetches URL via Jina Reader API → LLM extracts title/content
    ↓
Worker: UPDATE captures (title, content, summary) + INSERT jobs (type='extraction')
    ↓
Worker: Extraction handler sends content to Gemini → parses claims/memories
    ↓
Worker: INSERT memories (with embeddings via all-MiniLM-L6-v2)
    ↓
Frontend: Memories appear in UI
```

## Technical Decisions

| Decision               | Choice                                                         | Rationale                                            |
| ---------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| URL content extraction | Jina Reader API (r.jina.ai)                                    | Free, handles JS-rendered pages, no API key needed   |
| LLM for extraction     | Gemini 3 Flash Preview                                         | Cost-effective, fast, good structured output         |
| LLM fallback           | Gemini 2.5 Flash                                               | Available when 3 Flash has 503 errors                |
| Embedding model        | all-MiniLM-L6-v2 (384-dim)                                     | Local, fast, good for semantic search                |
| Job queue              | Supabase poll (2s interval)                                    | Simple, no extra infra for Phase 1                   |
| Frontend reads         | PowerSync `useQuery` hooks (fallback to Supabase direct)       | Local-first reads, reactive updates, offline-capable |
| Frontend writes        | PowerSync `db.execute` (fallback to Supabase `.insert/update`) | Offline queue, auto-sync on reconnect                |
| Capture + Job creation | Shared `createCapture()` utility in `src/lib/captures.ts`      | Single source of truth, consistent job type + input  |
| Sync status indicator  | PowerSync `useStatus()` hook in `DashboardLayout` sidebar      | Shows connected/disconnected, uploading/downloading  |

### Step 5 Architecture: Progressive PowerSync Migration

Phase 1 initially used direct Supabase queries for simplicity. Step 5 migrates to a **PowerSync-first with Supabase fallback** pattern:

1. **Reads**: Replace `supabase.from().select()` calls with `useQuery()` hooks from `@powersync/react`. Data comes from local SQLite, updated reactively via PowerSync sync streams.
2. **Writes**: Replace `supabase.from().insert/update/delete` calls with `db.execute()` (SQL INSERT/UPDATE/DELETE). Locally applied immediately, queued for upload via `uploadData` connector.
3. **Fallback**: When `VITE_POWERSYNC_URL` is not configured, fall back to direct Supabase queries. This allows development without PowerSync cloud.
4. **Job creation offline**: Capture + Job rows written via `db.execute()`, appearing locally immediately. PowerSync uploads them to Supabase when online, then the Python worker picks them up.

Key constraint: PowerSync's `uploadData` connector uses a generic PUT/PATCH/DELETE → Supabase pattern. Job `input` field must be JSON-serialized before local write so the connector can upsert it correctly.

## Acceptance Criteria (from Parent PRD)

- [x] Create a project, see it in project list
- [x] Paste a URL → content extracted and stored within 30s
- [x] Extracted content shows as Memory cards with source attribution
- [x] Home dashboard shows recent captures and project stats
- [x] Offline: capture a URL while offline → syncs when back online

## Out of Scope (Phase 2+)

- Memory search (FTS5)
- Memory associations (supports/contradicts)
- Brief generation
- Signal monitoring
- File/note captures (only URL for Phase 1)
- Project export
