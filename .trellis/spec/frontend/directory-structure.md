# Directory Structure

> How frontend (React/TypeScript + Tauri 2) code is organized in this project.

---

## Overview

MemexFlow frontend is a React/TypeScript application wrapped in Tauri 2, targeting **macOS** first, with **Windows** as Phase 2. The project uses feature-first organization with a shared infrastructure layer.

> **Legend**: Sections marked **[Current]** reflect the deployed structure.
> Sections marked **[Phase 3]** will be added by the Phase 3 task.
> Sections marked **[Planned]** describe the target architecture but are not yet scheduled.

---

## [Current] Directory Layout

```
src/
├── main.tsx                         # React entry point
├── App.tsx                          # Root component, router setup
├── vite-env.d.ts                    # Vite type declarations
├── lib/                            # Shared infrastructure
│   ├── AuthProvider.tsx             # Auth context provider
│   ├── PowerSyncProvider.tsx        # PowerSync context provider
│   ├── captures.ts                 # Shared capture+job creation utility
│   ├── captures.test.ts             # Tests for captures utility
│   ├── database.types.ts           # Auto-generated Supabase types
│   ├── deep-link.ts                # Deep link handling
│   ├── models.ts                   # Shared TypeScript type definitions
│   ├── powersync.ts                # PowerSync client, schema, connector
│   └── supabase.ts                 # Supabase client singleton
├── hooks/
│   └── usePowerSyncQueries.ts      # All data hooks (useProjects, useCaptures, etc.)
├── features/                       # Feature modules
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── captures/
│   │   └── CapturesPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── memories/
│   │   └── MemoriesPage.tsx
│   ├── projects/
│   │   ├── ProjectsPage.tsx
│   │   └── ProjectDetailPage.tsx
│   ├── briefs/
│   │   └── BriefsPage.tsx
│   └── signals/
│       └── SignalsPage.tsx
├── shared/                          # Reusable UI components
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   ├── SyncStatusIndicator.tsx
│   │   └── index.ts                # Barrel exports
│   └── hooks/
│       └── useTheme.tsx
└── (no assets/, tests/, or tauri/ directories yet)

src-tauri/                           # Tauri Rust backend (scaffolded)
├── src/
│   ├── main.rs
│   ├── commands.rs
│   └── lib.rs
├── Cargo.toml
└── tauri.conf.json
```

### Key characteristics

- **All hooks in one file**: `usePowerSyncQueries.ts` contains all 16+ query hooks and 10+ mutation functions. Each feature imports what it needs from this single file.
- **No per-feature hooks/**: Feature directories contain only page components — no nested `hooks/` or `components/` subdirectories.
- **`lib/` not `core/`**: Shared infrastructure lives in `lib/`, not `core/`. Types are centralized in `lib/models.ts`, not in a separate `types/` directory.
- **Dual-path data access**: `usePowerSyncQueries.ts` provides hooks that use PowerSync when available, falling back to direct Supabase queries.
- **Shared utility**: `lib/captures.ts` handles both PowerSync and Supabase paths for capture+job creation.

---

## [Phase 3] Planned Additions

```
src/features/
├── captures/
│   ├── CapturesPage.tsx           # Enhanced with status tabs (pending/confirmed/ignored)
│   └── CaptureConfirmModal.tsx     # Confirm/ignore candidate captures
├── signals/
│   ├── SignalsPage.tsx            # Enhanced with channel type selector
│   └── SignalDiscoveries.tsx      # External discoveries tab
└── recall/
    └── RecallPage.tsx             # NEW — proactive knowledge revisit
```

Phase 3 adds:
- **Candidate confirmation** — status tabs on CapturesPage, confirm/ignore actions
- **External signals** — channel type selector on SignalsPage, discoveries tab
- **Recall** — new `/recall` route with revisit/dismiss actions

---

## [Planned] Target Architecture

```
src/
├── core/                           # Renamed from lib/
│   ├── config/
│   │   ├── app-config.ts
│   │   └── constants.ts
│   ├── database/
│   │   ├── powersync.ts
│   │   ├── schema.ts
│   │   └── queries.ts              # Extracted from usePowerSyncQueries.ts
│   ├── network/
│   │   ├── supabase-client.ts
│   │   └── api-error.ts
│   ├── auth/
│   │   ├── auth-provider.tsx
│   │   └── use-auth.ts
│   ├── theme/
│   │   ├── theme.ts
│   │   └── colors.ts
│   ├── routing/
│   │   └── router.tsx
│   └── utils/
│       ├── date-utils.ts
│       └── string-utils.ts
├── types/                          # Extracted from lib/models.ts
│   ├── project.ts
│   ├── capture.ts
│   ├── memory.ts
│   └── brief.ts
├── hooks/                          # Split from usePowerSyncQueries.ts
│   ├── use-powersync.ts
│   ├── use-supabase-query.ts
│   └── use-debounce.ts
├── tauri/                          # Tauri-specific integrations
│   ├── commands.ts
│   └── events.ts
├── features/
│   ├── home/
│   ├── projects/
│   ├── captures/
│   ├── signals/
│   ├── memories/
│   ├── briefs/
│   └── recall/
├── shared/
│   ├── components/
│   └── layouts/
└── assets/
    ├── icons/
    ├── images/
    └── fonts/
```

This is the long-term target but is **not** currently implemented. The `lib/` → `core/` rename and hook extraction will happen when the current monolithic files become unwieldy.

---

## Module Organization

### [Current] Rules

1. **Features don't import from other features** — share via `lib/`, `hooks/`, `shared/`, or `lib/models.ts`
2. **`lib/` has React components** — `AuthProvider.tsx` and `PowerSyncProvider.tsx` are React context providers
3. **`hooks/usePowerSyncQueries.ts`** is the single source for all data hooks — features import individual hooks from it
4. **`shared/components/`** contains reusable UI components used by 2+ features
5. **Types are centralized** in `lib/models.ts` — no per-feature type files
6. **File naming**: PascalCase for components (`DashboardPage.tsx`), camelCase for utilities (`captures.ts`)

### Adding a new feature (current)

1. Create directory under `features/<feature-name>/`
2. Add page component (e.g., `FeaturePage.tsx`)
3. Import data hooks from `hooks/usePowerSyncQueries.ts`
4. Import shared components from `shared/components/`
5. Import types from `lib/models.ts`
6. Register route in `App.tsx`

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component files | `PascalCase.tsx` | `DashboardPage.tsx`, `AuthProvider.tsx` |
| Utility files | `camelCase.ts` | `captures.ts`, `deep-link.ts` |
| Components | `PascalCase` | `DashboardPage`, `EmptyState` |
| Pages | `*Page` suffix | `DashboardPage`, `BriefsPage` |
| Hooks | `use*` prefix | `useProjects`, `usePowerSync` |
| Types/Interfaces | `PascalCase` | `Project`, `Memory`, `Capture` |
| Constants | `SCREAMING_SNAKE_CASE` for globals | `DEFAULT_PADDING`, `API_BASE_URL` |
| Test files | `<file>.test.ts(x)` | `captures.test.ts` |

---

## Examples

- Feature module: `src/features/projects/`
- Shared component: `src/shared/components/Card.tsx`
- Domain types: `src/lib/models.ts`
- Data hooks: `src/hooks/usePowerSyncQueries.ts`
- Shared utility: `src/lib/captures.ts`