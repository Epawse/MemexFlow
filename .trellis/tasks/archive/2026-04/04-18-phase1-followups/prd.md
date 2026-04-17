# Phase 1 Follow-ups: Cleanup, ESLint, Tests, Types

## Goal

Close out the non-blocking follow-ups identified at the end of `04-17-phase1-capture-memory`. These are small quality/hygiene items — not feature work — but each removes a known tech-debt signal from the recent journal entry.

## Scope

Four discrete items. Independent. Safe to land together as one chore PR.

### 1. Cleanup SQL for historical double-encoded `jobs.input` rows

**Problem**: 28 historical `jobs` rows have `input` stored as a JSON-encoded string (`jsonb_typeof = 'string'`) instead of as a `jsonb` object. The app now has a defensive double-parse in the Retry path (`CapturesPage.tsx`), but the underlying data should be normalized.

**Action**: Add a Supabase migration that performs the cleanup:
```sql
UPDATE jobs
SET input = (input #>> '{}')::jsonb
WHERE jsonb_typeof(input) = 'string';
```

**Non-goals**: Do not remove the app-side defensive parse in this task (still useful as a safety net; revisit later).

### 2. ESLint flat config

**Problem**: Project has no ESLint flat config. `npm run lint` is either absent or broken (ESLint 10 requires flat config). TS strict + `noUnusedLocals`/`noUnusedParameters` is the current de-facto gate, which misses style/quality rules.

**Action**: Add `eslint.config.js` (flat config) at the repo frontend root covering:
- `@typescript-eslint/recommended`
- `react-hooks/recommended`
- Project-appropriate ignores (build output, node_modules, Tauri artifacts)

Ensure `npm run lint` is wired in `package.json` and passes on the current tree. Fix any surfaced issues.

### 3. Vitest unit tests for `normalizeUrl`

**Problem**: `normalizeUrl` is a pure function with branching logic; no unit coverage exists.

**Action**: Add a Vitest spec next to the source (co-located per directory-structure convention, or per whatever the existing test convention is). Cover:
- Valid URL passthrough
- URL without scheme (add `https://`)
- Trailing-slash / whitespace normalization
- Invalid input rejection

### 4. Shared Row types (`Capture`, `Job`, ...)

**Problem**: Multiple hooks/components cast PowerSync query results as `(rows as any[])`. This loses type safety at the DB boundary.

**Action**: Define shared Row types (one type per table) reflecting the PowerSync SQLite schema, and replace `as any[]` casts with `as Row[]`. Start with tables actually used in the frontend today — `captures`, `jobs`, `projects`, `memories`, `briefs` (only what's referenced).

**Non-goals**: Do not introduce a code-gen layer (e.g. supabase-gen-types) in this task. Hand-maintained types are acceptable for v1 — revisit when schema churn slows.

## Acceptance Criteria

- [ ] Migration file under `supabase/migrations/` that normalizes double-encoded `jobs.input` rows; idempotent (safe to re-run)
- [ ] `eslint.config.js` exists, `npm run lint` passes on the current tree
- [ ] Vitest spec for `normalizeUrl` with ≥4 cases; `npm run test` passes
- [ ] `(rows as any[])` casts in frontend hooks/components replaced with concrete `Row` types where `captures`/`jobs`/`projects`/`memories`/`briefs` are queried
- [ ] `npx tsc --noEmit --strict` remains clean

## Technical Notes

- Scope: full-stack (frontend lint/types/tests + DB migration)
- Parent task: `04-16-memexflow-v1-planning`
- Reference: journal `.trellis/workspace/haor/journal-1.md` — "Known follow-ups (not blocking)" section of the Phase 1 entry
- Priority: P2 (hygiene; no user-visible behavior change)
- Migration must be reviewed before apply — we are not auto-applying in this task
