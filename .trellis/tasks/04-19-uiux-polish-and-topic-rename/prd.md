# UI/UX Polish & Project→Topic Rename

## Context

MemexFlow needs a comprehensive UI/UX polish pass before recording a demo video for the Feishu OpenClaw competition. The concept of "Project" feels too heavy for a personal research OS — renaming to "Topic" better conveys "interested content" (AI news, posts, docs) while still accommodating research use cases.

A full audit identified major inconsistencies: 3 different tab implementations, duplicated constants across 2-3 files each, inconsistent input styling, inaccessible clickable Cards, an 810-line monolith page, and missing navigation from empty states.

## Phases

### Phase 1: Project → Topic UI Label Rename

**Scope**: User-facing strings only. No variable names, hook names, DB columns, or route paths.

| File | Changes |
|------|---------|
| `DashboardLayout.tsx` | Nav label "Projects" → "Topics" |
| `ProjectsPage.tsx` | All labels: heading, subtitle, button, empty states, toasts, modal |
| `ProjectDetailPage.tsx` | All labels: heading, back button, empty states, toasts, settings, modal |
| `DashboardPage.tsx` | Stat card "Projects" → "Topics", "Active Projects" → "Active Topics", empty states |
| `BriefsPage.tsx` | Empty state "project's memories" → "topic's memories" |
| `SignalsPage.tsx` | Empty state "in a project" → "in a topic" |
| `App.tsx` | Import rename if component names change |

**NOT changing**: `project_id`, `useProjects()`, route paths `/projects`, directory `src/features/projects/`, DB columns.

### Phase 2: Shared Component Extraction & Visual Consistency

#### 2a. Shared constants module — `src/shared/constants/index.ts`

Extract from multiple files:
- **`TOPIC_COLORS`** — from ProjectsPage + ProjectDetailPage
- **`TYPE_ICONS`** — from DashboardPage + CapturesPage + ProjectDetailPage
- **`STATUS_BADGE`** — merge from CapturesPage + BriefsPage + ProjectDetailPage
- **`REASON_LABELS`** — from RecallPage + DashboardPage
- **`PRIORITY_BADGES`** — from RecallPage + DashboardPage

#### 2b. Shared `<Tabs>` component — `src/shared/components/Tabs.tsx`

```tsx
interface TabItem { key: string; label: string; badge?: number }
interface TabsProps { items: TabItem[]; activeKey: string; onChange: (key: string) => void; className?: string }
```

Unify implementations from CapturesPage, ProjectDetailPage, SignalsPage.

#### 2c. Unified `<Input>` usage

Replace raw `<input>` in DashboardPage, CapturesPage, ProjectDetailPage, MemoriesPage, LoginPage with shared `<Input>` component.

#### 2d. `<StatusBadge>` + `<PriorityBadge>` components

`src/shared/components/StatusBadge.tsx` and `src/shared/components/PriorityBadge.tsx`. Update CapturesPage, BriefsPage, ProjectDetailPage, RecallPage, DashboardPage.

#### 2e. Shared `renderContent` utility — `src/shared/utils/renderContent.tsx`

Extract duplicated markdown+citation parser from BriefDetailPage + ProjectDetailPage.

#### 2f. Use shared `<Spinner>` consistently

Replace custom inline spinners in ProjectDetailPage and BriefDetailPage with `<Spinner size="lg" />`.

### Phase 3: UX Improvements

#### 3a. Card accessibility

Update `Card.tsx`: when `onClick` is provided, add `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space.

#### 3b. `useBrief(id)` hook

Add single-brief query to `usePowerSyncQueries.ts`. Update BriefDetailPage.

#### 3c. Split ProjectDetailPage into sub-components

- `TopicDetailPage.tsx` (~200 lines — main page, tab routing)
- `CapturesTab.tsx` (captures tab)
- `MemoriesTab.tsx` (memories tab)
- `BriefsTab.tsx` (briefs list + detail)
- `SignalsTab.tsx` (signal rules form + list)
- `SettingsTab.tsx` (settings form + danger zone)

#### 3d. BriefsPage create action

Add navigation button in empty state → `/projects`. Add "Create from Topic" link at page top.

#### 3e. Dashboard stat cards — make navigable

Add `onClick` → navigate to corresponding list page. Add `cursor-pointer` and hover effect.

#### 3f. CaptureDetailPage content rendering

Use shared `renderContent` utility instead of raw `whitespace-pre-wrap`.

#### 3g. Modal focus trap + transitions

Add focus trap, autoFocus, enter/exit CSS transitions to `Modal.tsx`.

### Phase 4: Demo-Ready Polish

#### 4a. Search/filter on list pages

- CapturesPage — text search by title + status filter
- BriefsPage — status filter tabs
- RecallPage — priority filter

#### 4b. LoginPage polish

- Google + GitHub SVG icons on OAuth buttons
- Password visibility toggle
- Fix success message hack (separate state)
- Use shared `<Input>` / `<Button>` components

### Phase 5: Post-demo (future)

- Skeleton loading states
- Directory rename `projects/` → `topics/`, route `/projects` → `/topics`
- Pagination infrastructure
- Extract inline SQL from components into hooks

## Verification

After each phase:
1. `pnpm type-check` passes
2. `pnpm lint` — no new errors
3. `pnpm build` succeeds
4. Manual: navigate every page, verify labels say "Topic" not "Project"
5. Manual: verify Tabs component renders on Captures, Project Detail, Signals pages
6. Manual: verify Card keyboard navigation (Tab + Enter)
7. Manual: verify BriefDetailPage uses `useBrief(id)` and renders correctly