<!-- TRELLIS:START -->

# Trellis Instructions

These instructions are for AI assistants working in this project.

Use the `/trellis:start` command when starting a new session to:

- Initialize your developer identity
- Understand current project context
- Read relevant guidelines

Use `@/.trellis/` to learn:

- Development workflow (`workflow.md`)
- Project structure guidelines (`spec/`)
- Developer workspace (`workspace/`)

If you're using Codex, project-scoped helpers may also live in:

- `.agents/skills/` for reusable Trellis skills
- `.codex/agents/` for optional custom subagents

Keep this managed block so 'trellis update' can refresh the instructions.

<!-- TRELLIS:END -->

## Goal

Build **MemexFlow** — a Tauri 2 desktop app for research knowledge management. The app captures URLs, extracts structured memories via AI, organizes them in projects, and generates research briefs. The project follows a Trellis-managed workflow with phases (Phase 0: Foundation ✅, Phase 1: Capture & Memory Pipeline — in progress).

## Instructions

- Follow Trellis workflow: PRD → plan → implement → test → record session
- Always write PRD **before** implementing for new phases
- Use commit message format: `type(scope): description`
- Record sessions with `python3 ./.trellis/scripts/add_session.py`
- Tailwind v4 custom colors go in `@theme {}` in `src/index.css`, NOT in `tailwind.config.js`
- For Supabase queries, use `(supabase.from('table') as any)` to bypass strict generated types
- Worker job `input` field stores JSON strings — must `json.loads()` in Python
- Gemini API: primary model is `gemini-3-flash-preview`, fallback is `gemini-2.5-flash` on 503
- Read `.trellis/spec/` guidelines before coding
- Troubleshooting docs are in `docs/troubleshooting/`

## Discoveries

### Critical Pitfalls Documented in `docs/troubleshooting/`

1. **PowerSync WASQLiteDB.worker.js 404** — In Tauri, disable web worker: `flags: { enableMultiTabs: false, useWebWorker: false }`
2. **PowerSync Sync Streams edition 3 syntax** — Use `auth.user_id()` NOT `{user_id}` parameter syntax
3. **Tailwind v4 custom colors invisible** — Must use `@theme { --color-primary-600: #7C3AED; }` in CSS, not `tailwind.config.js`
4. **Supabase vector dimension** — `all-MiniLM-L6-v2` produces 384-dim vectors, not 1536
5. **Supabase user trigger** — Need `handle_new_user()` trigger for auto-creating `public.users` row on signup
6. **Tauri deep-link** — Must add `deep-link:default` to capabilities/default.json
7. **Vite 7 worker format** — Need `worker: { format: "es" }` and `optimizeDeps: { exclude: ["@powersync/web", "@powersync/common"] }`
8. **Supabase jobs type constraint** — Originally only `('embed', 'summarize', 'brief', 'signal')`, migration added `('ingestion', 'extraction', 'briefing')`
9. **Worker `input` field** — Stored as JSON string in Supabase, must `json.loads()` in `process_job()`
10. **Worker `user_id` injection** — Must inject `job["user_id"]` into `input_data` because old jobs don't have it in input
11. **Job type mismatch bug** — `ProjectDetailPage.tsx` and `DashboardPage.tsx` used `type: "embed"` instead of `"ingestion"` for job creation. Fixed in shared `createCapture()` utility.
12. **Worker `project_id` not passed** — `handle_ingestion` didn't pass `project_id` from capture to extraction job. Fixed to fetch `project_id` from capture row.
13. **PowerSync offline writes** — Use `db.execute()` for writes (auto-queued for upload). Use `useQuery()` for reactive reads from local SQLite. Always fallback to Supabase direct when `getPowerSyncDb()` returns null.
14. **PowerSync `captures` table** — Supabase `captures` table does NOT have a `status` column. Capture status is derived from the associated `jobs` row.
15. **PowerSync `database.types.ts`** — Job `type` is now `string` (not a narrow enum) since actual constraint includes `('ingestion', 'extraction', 'embed', 'summarize', 'brief', 'briefing', 'signal')`.
16. **PowerSync `useStatus()`** — Returns `{ connected, hasSynced, dataFlowStatus: { uploading, downloading } }`. Use for sync status indicator in sidebar.
17. **PowerSync `waitForFirstSync()` blocks UI** — Never use `waitForFirstSync()` in `initPowerSync()`; it blocks `setDb()` and causes infinite spinner. Let sync happen in the background.
18. **React Hooks conditional `useQuery()`** — Never conditionally call `useQuery()` (`db ? useQuery() : fallback`). Always call it unconditionally. Use `useDataQuery()` dual-path hook instead.
19. **PowerSync empty data ≠ no data** — `useQuery()` returns `[]` before first sync completes. Always have a Supabase fallback for initial load, switch to PowerSync when data arrives.
20. **`SyncStatusIndicator` three states** — `!connected && !hasSynced` = "Connecting...", `!connected && hasSynced` = "Offline", `connected && sync` = "Syncing/...", `connected && !sync` = "Synced"
21. **PowerSync `PSYNC_S2105` JWT aud claim error** — Supabase JWT `aud` = `"authenticated"`, must configure PowerSync Dashboard Auth settings to include `"authenticated"` in audience list (or enable "Use Supabase Auth"). Without this, `connected` stays `false` forever.
22. **PowerSync `initPowerSync()` must not be called twice** — React StrictMode double-invokes `useEffect`. Use a `_initialized` flag guard to prevent duplicate `connect()` calls causing "Trying to close for the second time" warnings.
23. **PowerSync `fetchCredentials()` retry loop** — If auth session not ready at init time, `fetchCredentials()` returns `null` and PowerSync retries automatically. No need to manually call `connect()` on auth state changes.

### Architecture Decisions

- **PowerSync**: Using `@powersync/web` SDK (not alpha Tauri plugin), running SQLite on main thread (`useWebWorker: false`) for Tauri compatibility
- **LLM pipeline**: Jina Reader API for URL content extraction → Gemini for AI extraction → all-MiniLM-L6-v2 for embeddings
- **Job flow**: Frontend creates `ingestion` job → Worker fetches URL → auto-creates `extraction` job → Worker creates Memory rows
- **Data reads**: PowerSync `useQuery()` with Supabase fallback via `useDataQuery()` dual-path hook
- **Data writes**: PowerSync `db.execute()` with Supabase fallback via `getPowerSyncDb()` check
- **Fallback**: `useDataQuery()` — PowerSync has data → use it; PowerSync empty → Supabase fallback; no PowerSync URL → Supabase only
- **Shared utility**: `src/lib/captures.ts` — `createCapture()` handles capture + job creation with dual-path support
