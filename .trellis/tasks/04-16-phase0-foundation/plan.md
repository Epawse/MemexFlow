# Phase 0: Foundation - Implementation Plan

## Goal

Set up the complete project foundation: Tauri 2 + React/TS frontend, Supabase backend with schema, PowerSync sync layer, Python AI worker, and authentication flow. By the end of Phase 0, we have a running shell app with the entire data pipeline working end-to-end.

## Acceptance Criteria (from PRD)

- [ ] `cargo tauri dev` launches app with React UI
- [ ] Supabase schema created, RLS policies configured
- [ ] PowerSync syncs a test table between Postgres ↔ SQLite
- [ ] Python worker connects to Supabase, picks up a test job
- [ ] Auth flow works: login → session → deep-link callback

## Implementation Steps

### 1. Tauri 2 + React/TS Project Init

**Goal**: Create the desktop app shell with Tauri 2 and React 19 + TypeScript.

**Tasks**:
- [ ] Run `npm create tauri-app@latest` with React + TypeScript template
- [ ] Configure `tauri.conf.json`:
  - App identifier: `com.memexflow.app`
  - Deep-link protocol: `memexflow://` for auth callback
  - Window settings: min size 1024x768, default 1280x800
  - macOS-specific: bundle identifier, code signing (dev cert)
- [ ] Set up dev tooling:
  - ESLint + TypeScript ESLint (per `.trellis/spec/frontend/quality-guidelines.md`)
  - Prettier for formatting
  - Vitest + React Testing Library
- [ ] Install core dependencies:
  - React Router v6 for routing
  - Tailwind CSS for styling
  - React Query (TanStack Query) for server state
  - Zustand for global client state
  - Zod for validation
- [ ] Create base directory structure (per `.trellis/spec/frontend/directory-structure.md`):
  ```
  src/
    features/
      home/
      projects/
      capture/
      signals/
      memory/
      briefs/
      recall/
    shared/
      components/
      hooks/
      types/
      utils/
    tauri/
    App.tsx
    main.tsx
  src-tauri/
    src/
      main.rs
      lib.rs
  ```
- [ ] Set up base routing structure (7 modules + auth)
- [ ] Verify: `cargo tauri dev` launches with React UI

**Deliverable**: Running Tauri app with React UI, routing skeleton, and dev tooling configured.

---

### 2. Supabase Project Setup

**Goal**: Create Supabase project, define database schema, configure RLS policies.

**Tasks**:
- [ ] Create Supabase project (via dashboard or CLI)
- [ ] Set up environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for worker)
- [ ] Define database schema (SQL migrations):
  - `users` table (extends Supabase auth.users)
  - `projects` table (id, user_id, name, description, created_at, updated_at)
  - `captures` table (id, project_id, type, url, content, metadata, created_at)
  - `memories` table (id, project_id, capture_id, content, source, confidence, embedding, created_at)
  - `memory_associations` table (id, from_memory_id, to_memory_id, relation_type, created_at)
  - `briefs` table (id, project_id, title, content, created_at)
  - `brief_memories` table (brief_id, memory_id)
  - `signal_rules` table (id, project_id, name, query, created_at)
  - `signal_matches` table (id, signal_rule_id, content, matched_at)
  - `jobs` table (id, type, status, payload, result, created_at, updated_at)
- [ ] Enable pgvector extension for embeddings
- [ ] Create FTS indexes on relevant text columns
- [ ] Configure RLS policies:
  - Users can only access their own projects/captures/memories
  - Service role bypasses RLS (for worker)
- [ ] Create test data: 1 project, 1 capture, 1 memory
- [ ] Verify: Can query tables via Supabase dashboard

**Deliverable**: Supabase project with complete schema, RLS policies, and test data.

---

### 3. PowerSync Integration

**Goal**: Set up PowerSync to sync Supabase Postgres ↔ local SQLite in Tauri app.

**Tasks**:
- [ ] Create PowerSync instance (via PowerSync Cloud dashboard)
- [ ] Configure PowerSync sync rules (YAML):
  - Sync `projects`, `captures`, `memories` tables
  - Filter by `user_id` (user only sees their own data)
  - Define bucket structure (per-project buckets)
- [ ] Install PowerSync JS SDK: `@powersync/web`
- [ ] Create PowerSync client in Tauri:
  - Initialize SQLite database (via Tauri's `tauri-plugin-sql`)
  - Connect to PowerSync backend
  - Set up auth token provider (Supabase session token)
- [ ] Create React hooks for PowerSync queries:
  - `usePowerSyncQuery(sql, params)` - reactive SQLite query
  - `usePowerSyncMutation()` - write to local SQLite → syncs to Postgres
- [ ] Test sync:
  - Insert a project via Supabase dashboard → appears in local SQLite
  - Insert a project via Tauri app → syncs to Postgres
- [ ] Verify: PowerSync syncs test table bidirectionally

**Deliverable**: PowerSync syncing Postgres ↔ SQLite, with React hooks for querying local data.

---

### 4. Python Worker Setup

**Goal**: Create Python AI worker that polls Supabase for jobs, processes them, and writes results back.

**Tasks**:
- [ ] Create `worker/` directory at project root
- [ ] Set up Python project:
  - `pyproject.toml` with dependencies: `supabase`, `openai`, `anthropic`, `pydantic`, `python-dotenv`
  - `ruff` for linting, `mypy` for type checking, `pytest` for testing
- [ ] Create worker structure:
  ```
  worker/
    src/
      worker/
        __init__.py
        main.py          # Entry point: poll jobs table
        jobs/
          __init__.py
          ingestion.py   # URL → content extraction
          extraction.py  # Content → memories
          briefing.py    # Memories → brief
        utils/
          supabase.py    # Supabase client
          llm.py         # LLM API wrappers
    tests/
    pyproject.toml
  ```
- [ ] Implement job polling loop:
  - Query `jobs` table for `status = 'pending'`
  - Claim job (set `status = 'running'`)
  - Dispatch to handler based on `type`
  - Write result, set `status = 'completed'` or `'failed'`
- [ ] Implement test job handler (echo job):
  - Input: `{"message": "hello"}`
  - Output: `{"echo": "hello"}`
- [ ] Set up Supabase Realtime subscription (optional, for push notifications)
- [ ] Test locally:
  - Insert a test job via Supabase dashboard
  - Worker picks it up, processes, writes result
- [ ] Verify: Python worker connects to Supabase, picks up a test job

**Deliverable**: Python worker running locally, processing test jobs from Supabase.

---

### 5. Authentication Flow

**Goal**: Implement Supabase Auth with PKCE flow and Tauri deep-link callback.

**Tasks**:
- [ ] Configure Supabase Auth:
  - Enable email/password provider
  - Add redirect URL: `memexflow://auth/callback`
  - (Optional) Enable OAuth providers: GitHub, Google
- [ ] Register deep-link protocol in Tauri:
  - macOS: `tauri.conf.json` → `tauri.bundle.macOS.customProtocols`
  - Windows: `tauri.conf.json` → `tauri.bundle.windows.customProtocols`
- [ ] Implement auth flow in React:
  - Login page: email/password form
  - Call `supabase.auth.signInWithPassword()` or `signInWithOAuth()`
  - OAuth redirects to `memexflow://auth/callback?code=...`
  - Tauri catches deep-link, extracts code, exchanges for session
- [ ] Store session token securely:
  - Use Tauri's Rust-side keychain integration (not localStorage)
  - Expose via Tauri command: `get_session()`, `set_session()`
- [ ] Create auth context in React:
  - `useAuth()` hook: `{ user, session, signIn, signOut, loading }`
  - Wrap app in `<AuthProvider>`
- [ ] Implement protected routes:
  - Redirect to login if not authenticated
  - Redirect to home if authenticated and on login page
- [ ] Test auth flow:
  - Sign up → email verification → login → session stored
  - Deep-link callback works (OAuth or magic link)
  - Sign out → session cleared
- [ ] Verify: Auth flow works end-to-end with deep-link callback

**Deliverable**: Working authentication with Supabase Auth, secure session storage, and deep-link callback.

---

### 6. Base UI Component Library

**Goal**: Create reusable UI components following design system (Tailwind + Material 3 tokens).

**Tasks**:
- [ ] Set up Tailwind CSS:
  - Configure `tailwind.config.js` with Material 3 color tokens
  - Set up dark mode support (class-based)
- [ ] Create base components (in `src/shared/components/`):
  - `Button` (primary, secondary, text variants)
  - `Input` (text, email, password)
  - `Card` (container with elevation)
  - `Modal` (dialog overlay)
  - `Spinner` (loading indicator)
  - `EmptyState` (placeholder for empty lists)
  - `ErrorBoundary` (catch React errors)
- [ ] Create layout components:
  - `AppShell` (sidebar + main content area)
  - `Sidebar` (navigation for 7 modules)
  - `Header` (app title, user menu)
- [ ] Implement dark mode toggle
- [ ] Test components in Storybook (optional) or simple test page
- [ ] Verify: Base UI components render correctly

**Deliverable**: Reusable UI component library with Tailwind styling.

---

### 7. Integration Testing

**Goal**: Verify the entire stack works end-to-end.

**Tasks**:
- [ ] Test 1: Auth flow
  - Sign up → login → session stored → protected route accessible
- [ ] Test 2: Data sync
  - Create project in UI → syncs to Postgres → appears in Supabase dashboard
  - Create project in Supabase dashboard → syncs to SQLite → appears in UI
- [ ] Test 3: Worker job
  - Trigger test job from UI → worker picks up → result syncs back → UI shows result
- [ ] Test 4: Offline mode
  - Disconnect network → create project → reconnect → project syncs to Postgres
- [ ] Document any issues or blockers

**Deliverable**: All acceptance criteria verified, issues documented.

---

## Tech Stack (Phase 0)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop | Tauri 2 | Rust backend, web frontend wrapper |
| Frontend | React 19 + TypeScript | UI framework |
| Routing | React Router v6 | Client-side routing |
| Styling | Tailwind CSS | Utility-first CSS |
| State | Zustand + React Query | Global state + server cache |
| Validation | Zod | Runtime type validation |
| Local DB | SQLite (via PowerSync) | Offline-first storage |
| Sync | PowerSync JS SDK | Postgres ↔ SQLite sync |
| Remote DB | Supabase (Postgres) | Managed backend |
| Auth | Supabase Auth | Email/password + OAuth |
| Worker | Python 3.11+ | AI job processing |
| Worker Deps | supabase-py, openai, anthropic | API clients |
| Testing (FE) | Vitest + React Testing Library | Unit + component tests |
| Testing (BE) | pytest + ruff + mypy | Unit + integration tests |

---

## Dependencies

- **Before starting**: PRD finalized, frontend guidelines rewritten (✅ completed)
- **Blocks**: Phase 1 (Capture & Memory) cannot start until Phase 0 is complete

---

## Risks & Mitigations

1. **PowerSync setup complexity**
   - Risk: PowerSync sync rules are complex, may take time to configure correctly
   - Mitigation: Start with simple sync rules (1-2 tables), expand incrementally

2. **Tauri deep-link on macOS**
   - Risk: Deep-link registration may require code signing, notarization
   - Mitigation: Use dev certificate for local testing, defer production signing to later

3. **Python worker deployment**
   - Risk: Local worker may not run on user's machine (Python version, dependencies)
   - Mitigation: Provide Docker Compose setup for local dev, document Python 3.11+ requirement

4. **Supabase RLS policies**
   - Risk: Incorrect RLS policies may leak data or block legitimate access
   - Mitigation: Test RLS policies with multiple users, use Supabase policy simulator

---

## Out of Scope (Phase 0)

- Any AI functionality (ingestion, extraction, briefing) — Phase 1+
- UI polish, animations, empty states — Phase 3
- Mobile support — deferred
- Web version — deferred
- MCP server — Phase 2+
- Skills system — Phase 2+

---

## Success Metrics

- [ ] All 5 acceptance criteria met
- [ ] `cargo tauri dev` launches app in <5s
- [ ] Auth flow completes in <10s
- [ ] Data sync latency <2s (local write → Postgres)
- [ ] Worker picks up job within 5s of creation
- [ ] Zero console errors in dev mode

---

## Next Steps After Phase 0

1. Archive this task to `.trellis/tasks/archive/2026-04/04-16-phase0-foundation/`
2. Create Phase 1 task: "Capture & Memory"
3. Begin implementation of core value chain
