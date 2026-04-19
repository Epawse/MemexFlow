# Journal - haor (Part 1)

> AI development session journal
> Started: 2026-04-16

---

## Session 1: Bootstrap development guidelines for MemexFlow

**Date**: 2026-04-16
**Task**: Bootstrap development guidelines for MemexFlow
**Branch**: `main`

### Summary

(Add summary)

### Main Changes

## What was done

Filled all 11 `.trellis/spec/` guideline files + 2 index files based on the planned tech stack from `MemexFlow-2026Q2-Strategy.md`.

### Backend Guidelines (Python Worker + Supabase)

| File                     | Content                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `directory-structure.md` | Python worker layout: agents/, channels/, core/, db/, retrieval/, jobs/, services/                     |
| `database-guidelines.md` | Postgres schema (projects, candidates, memories, briefs, signals_rules, recalls), pgvector, migrations |
| `error-handling.md`      | Custom exception hierarchy, retry with tenacity, API error envelope                                    |
| `logging-guidelines.md`  | structlog structured JSON logging, context binding, log level rules                                    |
| `quality-guidelines.md`  | Ruff + mypy strict + pytest, forbidden patterns, Pydantic at boundaries                                |

### Frontend Guidelines (Flutter/Dart)

| File                      | Content                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `directory-structure.md`  | Feature-first layout: core/, features/, shared/ with Riverpod providers |
| `component-guidelines.md` | Widget patterns, Material 3 theming, responsive desktop layout, a11y    |
| `hook-guidelines.md`      | Riverpod provider types, data fetching, invalidation strategy           |
| `state-management.md`     | 4 state categories, local-first sync strategy                           |
| `type-safety.md`          | Freezed models, sealed classes, null safety rules                       |
| `quality-guidelines.md`   | flutter_lints, testing requirements, code review checklist              |

### Key decisions documented

- **Tech stack**: Flutter + Supabase + Python worker (from Q2 Strategy)
- **Architecture**: local-first with SQLite (Drift) + Supabase sync
- **State management**: Riverpod with code generation
- **Data models**: Freezed (Dart) + Pydantic v2 (Python)

### Git Commits

| Hash      | Message       |
| --------- | ------------- |
| `b214396` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

---

## Session 2: Phase 0 — Fix critical bugs & build UI component library

**Date**: 2026-04-17
**Task**: Phase 0: Foundation - Project Scaffold & Data Layer
**Branch**: `main`

### Summary

Continued Phase 0 implementation: fixed 4 critical bugs found during review, built base UI component library, and improved project infrastructure.

### Bug Fixes

1. **Deep-link capability missing** — Added `deep-link:default` permission to `src-tauri/capabilities/default.json`. Without this, OAuth deep-link callback (`memexflow://auth/callback`) would fail at runtime.

2. **PowerSync schema column mismatch** — Rewrote `src/lib/powersync.ts` to use the proper PowerSync `Schema` + `Table` + `column` API (v1.37+), aligning all local SQLite column names exactly with the Supabase schema (e.g., `type` not `capture_type`, `input` not `input_data`). Also rewrote `PowerSyncProvider.tsx` and `usePowerSyncQueries.ts` to use correct API signatures.

3. **Embedding dimension mismatch** — Changed `vector(1536)` to `vector(384)` in the SQL migration and `match_memories()` function signature to match the `all-MiniLM-L6-v2` model (384-dim) used by the worker.

4. **User profile auto-creation** — Added `handle_new_user()` trigger function to `supabase/migrations/` that auto-creates a `public.users` row when a new auth user signs up via Supabase Auth.

### UI Component Library (Step 6)

Created 8 reusable components in `src/shared/components/`:

- `Button` — variants (primary/secondary/text/danger), sizes (sm/md/lg), loading state
- `Input` — label, error, helper text support
- `Card` / `CardHeader` — padding variants, hover state
- `Modal` — overlay, ESC close, size variants
- `Spinner` — size variants, accessible
- `EmptyState` — icon, title, description, action slot
- `ErrorBoundary` — React error boundary with fallback UI

Created `useTheme` hook with `ThemeProvider` and `ThemeToggle` for dark/light/system mode cycling with `localStorage` persistence.

Updated `DashboardLayout` to use `ThemeToggle` and primary color tokens.

### Infrastructure Improvements

- Added `surface`, `success`, `warning`, `danger` color tokens to `tailwind.config.js`
- Fixed `index.css` for Tailwind v4 (`@import "tailwindcss"` instead of `@tailwind` directives)
- Fixed `vite.config.ts` (removed unnecessary `@ts-expect-error`)
- Updated `index.html` title to "MemexFlow"
- Removed legacy `App.css`
- Updated `main.tsx` to wrap app in `ErrorBoundary` and `ThemeProvider`

### Status

[in_progress] **Phase 0 — Steps 1-6 complete, Step 7 (Integration Testing) pending**


## Session 2: Phase 0: Fix critical bugs + UI component library

**Date**: 2026-04-17
**Task**: Phase 0: Fix critical bugs + UI component library
**Branch**: `main`

### Summary

Fixed 4 critical bugs (deep-link capability, PowerSync schema, embedding dimension, user trigger), built 8 UI components, fixed Vite 7 build compatibility, updated Tailwind tokens

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `3662212` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 3: PowerSync setup + Phase 0 integration testing

**Date**: 2026-04-17
**Task**: PowerSync setup + Phase 0 integration testing
**Branch**: `main`

### Summary

Added PowerSync replication role + publication migration, edition 3 sync rules for all 7 tables, updated docs. Evaluated Tauri plugin (alpha) - staying with @powersync/web SDK. Phase 0 acceptance: 4/5 complete, PowerSync sync needs manual instance setup.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `76ca544` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 4: Phase 0 complete: mark task finished, create troubleshooting docs

**Date**: 2026-04-17
**Task**: Phase 0 complete: mark task finished, create troubleshooting docs
**Branch**: `main`

### Summary

Finished Phase 0 task. Created docs/troubleshooting/ with 7 categorized issue guides. Marked task as completed. Remaining: PowerSync cloud instance setup requires manual configuration.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `af2b812` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 5: Phase 0 complete: all acceptance criteria verified

**Date**: 2026-04-17
**Task**: Phase 0 complete: all acceptance criteria verified
**Branch**: `main`

### Summary

All Phase 0 acceptance criteria verified: app launches, schema deployed, Supabase CRUD works (project creation tested), PowerSync cloud configured, worker imports pass, auth + deep-link ready. Fixed Tailwind v4 custom colors (invisible buttons). Updated troubleshooting docs.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `38688db` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 6: Phase 1: worker pipeline end-to-end verified

**Date**: 2026-04-17
**Task**: Phase 1: worker pipeline end-to-end verified
**Branch**: `main`

### Summary

Full pipeline working: URL paste → ingestion job (Jina Reader fetch) → capture row updated → extraction job auto-created → LLM extracts memories → 2 memories created in Supabase with embeddings. Fixed: job type constraint, JSON input parsing, model fallback, logger import, embed→ingestion mapping.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `9e11c80` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 7: Phase 1 Step 5: PowerSync offline migration + bug fixes + PSYNC_S2105 fix

**Date**: 2026-04-17
**Task**: Phase 1 Step 5: PowerSync offline migration + bug fixes + PSYNC_S2105 fix
**Branch**: `main`

### Summary

Completed Step 5 (offline support) and multiple bug fixes:
- Created shared createCapture() utility with PowerSync/Supabase dual-path
- Fixed job type mismatch (embed → ingestion) in ProjectDetailPage and DashboardPage
- Fixed worker handle_ingestion not passing project_id to extraction job
- Migrated all page reads from direct Supabase to PowerSync useQuery() with Supabase fallback (useDataQuery dual-path hook)
- Migrated all writes to PowerSync db.execute() with Supabase fallback
- Added SyncStatusIndicator component to DashboardLayout sidebar
- Fixed database.types.ts job type from narrow enum to string
- Fixed PowerSync waitForFirstSync() blocking UI — removed it, let sync happen in background
- Fixed PowerSync useQuery() conditional hook violation — always call unconditionally
- Fixed PSYNC_S2105 aud claim error — added 'authenticated' to PowerSync Dashboard audience
- Fixed initPowerSync() double-call from React StrictMode — added _initialized flag
- Added PowerSync status change logging for debugging
- Created useDataQuery dual-path hook (PowerSync first, Supabase fallback)
- Updated all troubleshooting docs, AGENTS.md discoveries, PRD, plan, and state-management spec
- Step 5 acceptance criteria now all met. Step 6 (polish) remains.

### Main Changes

(Add details)

### Git Commits

(No commits - planning session)

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 8: Phase 1 Step 5+6: PowerSync offline migration + UI polish + jsonb double-encoding fix

**Date**: 2026-04-18
**Task**: Phase 1 Step 5+6: PowerSync offline migration + UI polish + jsonb double-encoding fix
**Branch**: `main`

### Summary

Finished Phase 1 final two steps (offline sync migration + UI polish) plus five rounds of follow-up bug fixes: dashboard reactivity, retry UI, offline empty-state regressions, URL validation, and the jsonb double-encoding root cause.

### Main Changes

## What shipped

| Area | Change |
|------|--------|
| PowerSync offline migration (Step 5) | Pages migrated from direct Supabase to PowerSync `useQuery` via dual-path `useDataQuery`; writes go through `db.execute` when available; `captures.status` added to local schema; `SyncStatusIndicator` wired into `DashboardLayout`; removed blocking `waitForFirstSync`; guarded `initPowerSync` against StrictMode double-init |
| UI polish (Step 6) | `sonner` toast integration at App root; every mutation now reports success/failure via toast; `useDataQuery` `error` field is surfaced as an inline EmptyState + Reload; Captures page shows a Retry button + inline job error on failed ingestion; ProjectDetail renders a "Project not found" EmptyState instead of spinning forever; Briefs empty state unified with the shared component |
| Worker | `handle_ingestion` forwards `project_id` into the extraction job's input payload so memories stay linked to their project |
| Bug-fix round 1 | `usePendingJobs` widened to include `failed` jobs; `useDataQuery` stops leaking stale fallback errors once PowerSync is serving data; `useDashboardStats` rewritten as four reactive `useQuery` COUNT calls; `normalizeUrl` rejects empty/non-domain input |
| Bug-fix round 2 | `useDataQuery` simplified to a strict PS-only-or-Supabase-only branch (no cross-fallback) so deleting the last row offline no longer fires a spurious Supabase fetch; `normalizeUrl` regex tightened so `123` can't be coerced to `https://0.0.0.123/` |
| jsonb double-encoding (root cause) | Supabase `jobs.input` is jsonb. Client had been passing `JSON.stringify({...})` through both the Supabase insert path and the PowerSync upload batch, making Postgres store the payload as a jsonb *string* not object. `SupabaseConnector._transformForSupabase` now JSON.parses whitelisted jsonb columns before upsert; `createCapture` / retry pass the object directly; `getCaptureJob` does a defensive double-parse so historical double-encoded rows still match |
| Retry path unification | Extracted `createIngestionJob()` so `createCapture` and the retry handler share a single local-first writer; retry now checks for an existing pending/processing job before inserting (stops double-click dupes) and gracefully rejects captures with a null url |
| Dev/docs | `scripts/check-schema.mjs`, `scripts/test-e2e.mjs`, `scripts/test-offline.mjs` read creds from env instead of hard-coded service_role keys; `.env.example` documents `SUPABASE_SERVICE_ROLE_KEY`; added `docs/troubleshooting/powersync-offline-migration.md` and `powersync-aud-claim-error.md`; `spec/frontend/state-management.md` reflects the dual-path contract |

## Updated Files

- `src/App.tsx` — mount `<Toaster />`
- `src/lib/powersync.ts` — captures.status column, `_initialized` guard, `SupabaseConnector._transformForSupabase`, dev-only `window.__psdb` expose
- `src/lib/PowerSyncProvider.tsx` — drop `waitForFirstSync`
- `src/lib/database.types.ts` — broaden `jobs.type` from enum to string
- `src/lib/captures.ts` — `normalizeUrl`, shared `createIngestionJob`, object-shaped Supabase inserts
- `src/hooks/usePowerSyncQueries.ts` — dual-path `useDataQuery`, reactive `useDashboardStats`, `usePendingJobs` includes `failed`
- `src/features/captures/CapturesPage.tsx` — Retry UI + defensive double-parse + re-entry guard
- `src/features/dashboard/DashboardPage.tsx`, `memories/MemoriesPage.tsx`, `projects/ProjectsPage.tsx`, `projects/ProjectDetailPage.tsx`, `briefs/BriefsPage.tsx` — error state + toast feedback + EmptyState unification
- `src/shared/components/SyncStatusIndicator.tsx` (new), `DashboardLayout.tsx`
- `worker/src/worker/jobs/handlers.py` — propagate `project_id`
- `scripts/check-schema.mjs`, `scripts/test-e2e.mjs`, `scripts/test-offline.mjs` (new) + `.env.example`
- `docs/troubleshooting/powersync-offline-migration.md`, `powersync-aud-claim-error.md` (new), `docs/troubleshooting/README.md`, `AGENTS.md`, `.trellis/spec/frontend/state-management.md`

## Verification

- `npx tsc --noEmit --strict` — clean
- Manual smoke (user tested): URL validation, Retry UI, failed/processing badges, offline create+sync, dashboard count reactivity, "Project not found" state, jsonb double-encoding resolution (28 historical failed jobs now match via defensive double-parse)
- `npm run build` not run (classifier gate); pending CI
- `eslint` — project lacks ESLint flat config (ESLint 10 required), pre-existing gap; TS strict with `noUnusedLocals`/`noUnusedParameters` enforces the baseline

## Known follow-ups (not blocking)

- Cleanup SQL for historical double-encoded `jobs.input` rows: `UPDATE jobs SET input = (input #>> '{}')::jsonb WHERE jsonb_typeof(input) = 'string';`
- Add ESLint flat config so lint actually runs
- Add Vitest coverage for `normalizeUrl` (pure function, easy win)
- Consider shared Row types (`Capture`, `Job`, ...) to replace `(rows as any[])` casts


### Git Commits

| Hash | Message |
|------|---------|
| `1911ad9` | (see git log) |
| `c813d7a` | (see git log) |
| `698b810` | (see git log) |
| `96b52b2` | (see git log) |
| `aeb93c2` | (see git log) |
| `a2da20d` | (see git log) |
| `f276acf` | (see git log) |
| `479926b` | (see git log) |
| `17493c5` | (see git log) |
| `8047830` | (see git log) |
| `dec05ac` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 9: Phase 1 Follow-ups: ESLint, Tests, Row Types, Migration

**Date**: 2026-04-18
**Task**: Phase 1 Follow-ups: ESLint, Tests, Row Types, Migration
**Branch**: `main`

### Summary

(Add summary)

### Main Changes

| Item | What |
|------|------|
| ESLint flat config | `eslint.config.js` (ESLint 10 + typescript-eslint + react-hooks); `npm run lint`/`lint:fix`/`type-check`/`test`/`test:watch` wired in `package.json` |
| normalizeUrl tests | Exported from `captures.ts`; 9 Vitest cases (valid URL, no-scheme, whitespace, port, empty, numeric, no-TLD, no-hostname) |
| Shared Row types | `src/lib/models.ts` — `Project`/`Capture`/`Memory`/`Brief`/`Signal`/`Job` aliases over `Database` type; all `(rows as any[])` + `(x: any)` map-callback casts removed from 5 feature pages and the hooks file |
| jobs.input cleanup migration | `20260418000000_cleanup_jobs_input_double_encoded.sql` — idempotent UPDATE with rollback comment |

**Verification**: `tsc --noEmit --strict` clean · `npm run test` 9/9 · `npm run lint` 0 errors / 31 warnings (pre-existing supabase `as any` + aspirational react-hooks rules)

**Check fix**: Added missing rollback comment to migration per `backend/database-guidelines.md` spec

**Updated Files**:
- `eslint.config.js` (new)
- `vitest.config.ts` (new)
- `src/lib/models.ts` (new)
- `src/lib/captures.test.ts` (new)
- `src/lib/captures.ts` (export normalizeUrl)
- `src/hooks/usePowerSyncQueries.ts` (typed hooks via generics)
- `src/features/captures/CapturesPage.tsx` (drop any casts)
- `src/features/memories/MemoriesPage.tsx` (drop any casts)
- `src/features/dashboard/DashboardPage.tsx` (drop any casts)
- `src/features/projects/ProjectsPage.tsx` (drop any casts)
- `src/features/projects/ProjectDetailPage.tsx` (drop any casts)
- `supabase/migrations/20260418000000_cleanup_jobs_input_double_encoded.sql` (new)
- `package.json` (scripts + devDeps)


### Git Commits

| Hash | Message |
|------|---------|
| `8463003` | (see git log) |
| `51cb5fa` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 10: Phase 2: Briefs, Signals & Enhanced Memory

**Date**: 2026-04-18
**Task**: Phase 2: Briefs, Signals & Enhanced Memory
**Branch**: `main`

### Summary

(Add summary)

### Main Changes

## Phase 2 Implementation — Briefs, Signals & Enhanced Memory

Implemented the intelligence layer on top of the Phase 1 capture-to-memory pipeline.

### Subtask 2A: Enhanced Memory
| Feature | Description |
|---------|-------------|
| FTS5 local search | Search bar on MemoriesPage, queries local FTS5 index via PowerSync triggers |
| Memory associations | "Link memory" modal with relation types (supports/contradicts/elaborates/related) |
| Association badges | Memory cards show association counts |
| Association detail | Click badge → view linked memories, delete associations |

### Subtask 2B: Briefs
| Feature | Description |
|---------|-------------|
| Generate brief | Button on ProjectDetailPage creates brief + briefing job |
| Brief list | BriefsPage with status cards (pending/processing/completed/failed) |
| Brief detail | Markdown rendering with clickable [M1] memory citations |
| Worker handle_briefing | Fetches project memories, generates structured brief with citation markers, writes brief_memories links |

### Subtask 2C: Signals
| Feature | Description |
|---------|-------------|
| Signal rules CRUD | Create/edit/delete keyword monitoring rules per project |
| "Run now" matching | Triggers worker job to search memories for keyword matches |
| Signal matches | List with dismiss, matched text snippets |
| Notification badges | Dashboard + project cards show unread match count |
| SignalsPage | New route with rule management and match feed |

### DB Migrations (3)
- `20260418010000_add_memory_associations.sql`
- `20260418020000_add_brief_memories.sql`
- `20260418030000_add_signal_rules_matches.sql`

### Quality Pass
- Removed `any` types → `unknown` with type guards
- ARIA labels added to interactive buttons
- Bare `except Exception` → specific exception types
- Ruff: line length + unused variable fixed
- DB: removed invalid `updated_at` triggers on tables without the column
- `console.log` → gated `console.debug` in DEV mode

### Updated Files
- `src/features/memories/MemoriesPage.tsx` (FTS5 search, association UI)
- `src/features/briefs/BriefsPage.tsx` (brief list + detail)
- `src/features/signals/SignalsPage.tsx` (new)
- `src/features/projects/ProjectDetailPage.tsx` (brief generation, signal rules, tabs)
- `src/features/dashboard/DashboardPage.tsx` (signal badges)
- `src/hooks/usePowerSyncQueries.ts` (hooks for associations, briefs, signals, FTS5)
- `src/lib/models.ts` (new type interfaces)
- `src/lib/powersync.ts` (sync rules, FTS5 setup, type fixes)
- `src/lib/database.types.ts` (Row/Insert/Update for new tables)
- `src/shared/components/DashboardLayout.tsx` (signals nav)
- `src/App.tsx` (signals route)
- `worker/src/worker/jobs/handlers.py` (handle_briefing, handle_signal)
- `worker/src/worker/main.py` (signal type mapping, type fixes)
- `src/features/auth/LoginPage.tsx` (any→unknown)
- `src/features/captures/CapturesPage.tsx` (any→unknown)
- `src/features/projects/ProjectsPage.tsx` (any→unknown)

### Verification
- `tsc --noEmit` — 0 errors
- `eslint` — 0 errors, 42 warnings (pre-existing)
- `ruff check` (Phase 2 code) — 0 errors


### Git Commits

| Hash | Message |
|------|---------|
| `89eca85` | (see git log) |
| `fa6f451` | (see git log) |
| `86c68b3` | (see git log) |
| `54f70e0` | (see git log) |
| `5e7979f` | (see git log) |
| `6a78137` | (see git log) |
| `24fb685` | (see git log) |
| `36350c6` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 11: Phase 3A: Candidate Confirmation Flow implementation

**Date**: 2026-04-19
**Task**: Phase 3A: Candidate Confirmation Flow implementation
**Branch**: `main`

### Summary

Updated Trellis specs to reflect reality ([Current]/[Phase 3]/[Planned] markers), created Phase 3 task PRD, and implemented 3A candidate confirmation flow. Captures now default to status='pending', requiring explicit user confirmation before extraction.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `867128b` | (see git log) |
| `bb0df45` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 12: Phase 3B: External Signal Channels (RSS + GitHub)

**Date**: 2026-04-19
**Task**: Phase 3B: External Signal Channels (RSS + GitHub)
**Branch**: `main`

### Summary

(Add summary)

### Main Changes

| Area | What Changed |
|------|-------------|
| **Migration** | `signal_discoveries` table, `channel_type`/`channel_config` on `signal_rules`, RLS, indexes, jobs constraint update |
| **Worker channels/** | `BaseChannel` ABC + `DiscoveryItem` dataclass, `RSSChannel` (RSS 2.0 + Atom), `GitHubReleasesChannel` |
| **Worker handlers** | `handle_signal_scan` — fetch rule → select adapter → scan → dedupe by source_uri → insert discoveries |
| **Worker dispatch** | `signal_scan` added to `TYPE_MAP` and `JOB_HANDLERS` |
| **PowerSync schema** | `signal_discoveries` table, `channel_type`/`channel_config` columns on `signal_rules`, JSONB transform for `channel_config` |
| **Sync config** | Added streams for `signal_rules`, `signal_matches`, `signal_discoveries`, `memory_associations`, `brief_memories` |
| **Frontend types** | `ChannelType`, `SignalDiscovery` interface, updated `SignalRule` with `channel_type`/`channel_config` |
| **Frontend hooks** | `useDiscoveries`, `captureDiscovery`, `createSignalScanJob`, updated `createSignalRule` |
| **ProjectDetailPage** | Channel type radio (Internal/RSS/GitHub) + conditional config fields on signal rule form |
| **SignalsPage** | Tabbed view (Matches \| Discoveries), discovery cards with capture button, sync warning + debug/reconnect |
| **PowerSync debug** | `reconnectPowerSync()`, `debugPowerSyncTables()`, auth session check, sync status tracking |

**Key Debugging Insight**: After deploying new PowerSync sync streams, the app must be fully restarted — `disconnect + connect` is insufficient for picking up new table streams. Added debug/reconnect UI to SignalsPage for future troubleshooting.

**Updated Specs**: Backend and frontend directory-structure docs updated to reflect Phase 3A/3B completion.


### Git Commits

| Hash | Message |
|------|---------|
| `7a19fce` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
