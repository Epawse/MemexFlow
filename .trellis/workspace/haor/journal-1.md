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
