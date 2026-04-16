# Directory Structure

> How frontend (React/TypeScript + Tauri 2) code is organized in this project.

---

## Overview

MemexFlow frontend is a React/TypeScript application wrapped in Tauri 2, targeting **macOS** first, with **Windows** as Phase 2. The project uses feature-first organization with a shared core layer.

---

## Directory Layout

```
src/
├── main.tsx                         # React entry point
├── App.tsx                          # Root component, router setup
├── core/                            # Shared infrastructure
│   ├── config/                      # App config, env, constants
│   │   ├── app-config.ts
│   │   └── constants.ts
│   ├── database/                    # PowerSync + SQLite local database
│   │   ├── powersync.ts             # PowerSync client singleton
│   │   ├── schema.ts                # PowerSync schema definitions
│   │   └── queries.ts               # Reusable SQL queries
│   ├── network/                     # Supabase client, API helpers
│   │   ├── supabase-client.ts
│   │   └── api-error.ts
│   ├── auth/                        # Authentication logic
│   │   ├── auth-provider.tsx        # Auth context provider
│   │   └── use-auth.ts              # Auth hook
│   ├── theme/                       # Theme config, colors, typography
│   │   ├── theme.ts
│   │   └── colors.ts
│   ├── routing/                     # React Router configuration
│   │   └── router.tsx
│   └── utils/                       # Pure utility functions
│       ├── date-utils.ts
│       └── string-utils.ts
├── types/                           # Shared TypeScript types
│   ├── project.ts
│   ├── candidate.ts
│   ├── memory.ts
│   └── brief.ts
├── hooks/                           # Shared React hooks
│   ├── use-powersync.ts             # PowerSync data hooks
│   ├── use-supabase-query.ts        # React Query + Supabase
│   └── use-debounce.ts
├── tauri/                           # Tauri-specific integrations
│   ├── commands.ts                  # Rust command bindings
│   └── events.ts                    # Tauri event listeners
├── features/                        # Feature modules
│   ├── home/
│   │   ├── HomePage.tsx
│   │   ├── hooks/
│   │   └── components/
│   ├── projects/
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── hooks/
│   │   └── components/
│   ├── capture/
│   │   ├── CapturePage.tsx
│   │   ├── hooks/
│   │   └── components/
│   ├── signals/
│   │   ├── SignalsPage.tsx
│   │   ├── hooks/
│   │   └── components/
│   ├── memory/
│   │   ├── MemoryPage.tsx
│   │   ├── hooks/
│   │   └── components/
│   ├── briefs/
│   │   ├── BriefsPage.tsx
│   │   ├── hooks/
│   │   └── components/
│   └── recall/
│       ├── RecallPage.tsx
│       ├── hooks/
│       └── components/
├── shared/                          # Reusable components across features
│   ├── components/
│   │   ├── CandidateCard.tsx
│   │   ├── MemoryCard.tsx
│   │   ├── ProjectSelector.tsx
│   │   └── TagChips.tsx
│   └── layouts/
│       ├── AppLayout.tsx
│       └── ResponsiveLayout.tsx
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts

src-tauri/                           # Tauri Rust backend
├── src/
│   ├── main.rs                      # Tauri app entry
│   ├── commands.rs                  # Rust commands exposed to frontend
│   └── lib.rs
├── Cargo.toml
└── tauri.conf.json

tests/
├── unit/
├── component/
└── integration/
```

---

## Module Organization

### Feature-first structure

Each feature in `features/` contains:
- **Page components** — top-level route components (e.g., `HomePage.tsx`)
- **hooks/** — React hooks for state and data access (React Query, PowerSync)
- **components/** — feature-specific components (not reusable outside the feature)

### Rules

1. **Features don't import from other features** — share via `core/`, `shared/`, `hooks/`, or `types/`
2. **core/** has no React component imports — it's pure TypeScript (config, database, network, utils)
3. **shared/components/** contains reusable UI components used by 2+ features
4. **One component per file** for top-level components; small helper components can be in the same file
5. **Types are centralized** in `types/` for domain models shared across features

### Adding a new feature

1. Create directory under `features/<feature-name>/`
2. Add page component(s) (e.g., `FeaturePage.tsx`)
3. Add hooks in `hooks/` for data fetching and state management
4. Add feature-specific components in `components/`
5. Register routes in `core/routing/router.tsx`

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case.ts(x)` | `project-detail-page.tsx` |
| Components | `PascalCase` | `ProjectDetailPage` |
| UI Components | `PascalCase`, suffix describes type | `CandidateCard`, `MemoryListItem` |
| Pages | `*Page` suffix | `HomePage`, `BriefsPage` |
| Hooks | `camelCase` + `use*` prefix | `useProjectList`, `usePowerSync` |
| Types/Interfaces | `PascalCase` | `Project`, `Memory`, `ApiError` |
| Constants | `SCREAMING_SNAKE_CASE` for globals | `DEFAULT_PADDING`, `API_BASE_URL` |
| Private | No leading underscore (use module scope) | `function buildHeader()` |
| Test files | `<file>.test.ts(x)` | `candidate-card.test.tsx` |

---

## Examples

- Feature module: `src/features/projects/`
- Shared component: `src/shared/components/CandidateCard.tsx`
- Domain type: `src/types/project.ts`
- Hook: `src/features/projects/hooks/use-project-list.ts`
- Tauri command: `src/tauri/commands.ts`
