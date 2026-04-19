# State Management

> How state is managed in this project.

---

## Overview

MemexFlow uses a **local-first architecture** with PowerSync as the primary data layer:

1. **PowerSync** — local SQLite for reads (`useQuery`) and writes (`db.execute`), with automatic sync to Supabase
2. **Supabase direct** — fallback when PowerSync is not configured (no `VITE_POWERSYNC_URL`)
3. **React Context + useState** — component-scoped UI state
4. **Zustand** — (reserved for future global client state)

State is categorized into four types, each with clear guidelines for where it lives.

---

## State Categories

### 1. Component-local state (ephemeral UI)

**Where**: `useState` or `useReducer` inside components

**Examples**: tab index, form input values, animation state, expanded/collapsed toggle

```tsx
function CaptureForm() {
  const [url, setUrl] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <form>
      <input value={url} onChange={(e) => setUrl(e.target.value)} />
    </form>
  );
}
```

### 2. Feature state (scoped to a feature)

**Where**: Zustand stores in `features/<name>/stores/` (reserved, not yet used)

**Examples**: filter settings, UI preferences, form state that needs to persist across component unmounts

### 3. Server state (remote data)

**Where**: PowerSync `useQuery` hooks with Supabase fallback, centralized in `hooks/usePowerSyncQueries.ts`

**Pattern A: PowerSync available** — Read from local SQLite, writes via `db.execute`

```tsx
import { useQuery, usePowerSync } from "@powersync/react";

// Reads — reactive, auto-updates when local SQLite changes
const { data: projects } = useQuery(
  "SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC",
  [userId],
);

// Writes — local-first, queued for upload
const db = usePowerSync();
await db.execute(
  "INSERT INTO projects (id, user_id, title, color) VALUES (?, ?, ?, ?)",
  [crypto.randomUUID(), userId, title, color],
);
```

**Pattern B: PowerSync unavailable** — Fall back to direct Supabase

```tsx
import { getPowerSyncDb } from '../lib/powersync';
import { supabase } from '../lib/supabase';

const db = getPowerSyncDb();

if (db) {
  // PowerSync path
  const { data } = useQuery('SELECT * FROM projects WHERE user_id = ?', [userId]);
  // Writes
  await db.execute('INSERT INTO projects ...', [params]);
} else {
  // Supabase direct path
  const { data } = await supabase.from('projects').select('*').eq('user_id', userId);
  // Writes
  await supabase.from('projects').insert({ ... });
}
```

**Convenience hooks**: `usePowerSyncQueries.ts` provides `useProjects()`, `useCaptures()`, `useMemories()`, etc. These handle the PowerSync-or-Supabase fallback internally.

### 4. Local-persistent state (survives app restart)

**Where**: Zustand with persist middleware (reserved for future use)

**Examples**: user preferences, UI settings

---

## Data Flow Architecture

### Local-first with PowerSync

```
User action
    ↓
Frontend: db.execute('INSERT INTO captures ...')
    ↓ (instant, local SQLite)
PowerSync: detects local change → queues for upload
    ↓ (when online)
PowerSync connector: uploadData() → Supabase INSERT/UPDATE/DELETE
    ↓ (when online)
PowerSync: sync stream → local SQLite updated from Postgres
    ↓ (reactive)
useQuery hook: UI re-renders automatically
```

### Offline behavior

1. **Offline write**: User pastes URL → `db.execute('INSERT INTO captures ...')` succeeds locally
2. **PowerSync queues**: The write is queued in local SQLite's oplog
3. **On reconnect**: `uploadData()` pushes queued writes to Supabase
4. **Worker picks up**: Python worker polls Supabase `jobs` table → processes ingestion/extraction
5. **Result syncs back**: PowerSync stream updates local SQLite with new memories

### Shared utility pattern

Capture + Job creation uses a shared utility (`src/lib/captures.ts`) that handles both PowerSync and Supabase paths:

```tsx
export async function createCapture({ userId, url, projectId }: CreateCaptureParams) {
  const db = getPowerSyncDb();
  const captureId = crypto.randomUUID();

  if (db) {
    // PowerSync path — local-first
    await db.execute('INSERT INTO captures (id, user_id, project_id, type, title, url) VALUES (?, ?, ?, ?, ?, ?)',
      [captureId, userId, projectId || null, 'url', url, url]);
    await db.execute('INSERT INTO jobs (id, user_id, type, status, input) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), userId, 'ingestion', 'pending', JSON.stringify({ capture_id: captureId, url, user_id: userId })]);
  } else {
    // Supabase fallback
    await supabase.from('captures').insert({ ... });
    await supabase.from('jobs').insert({ ... });
  }
  return captureId;
}
```

### [Phase 3A] Candidate confirmation pattern

When candidate confirmation is added, captures will have a `status` field (`pending` | `confirmed` | `ignored`). The flow becomes:

1. User creates capture → `status = 'pending'`
2. User reviews and confirms → update `status = 'confirmed'`, create extraction job
3. Worker processes extraction → creates memories

This requires:
- New `usePendingCaptures()` hook filtering by `status = 'pending'`
- Confirm/ignore mutation functions
- Dashboard pending count indicator

---

## State Location Decision Tree

```
Is it server data (from Supabase)?
├─ YES → PowerSync useQuery + db.execute (with Supabase fallback)
│         (useProjects, useCaptures, useMemories, createCapture)
│
└─ NO → Is it used by multiple features?
        ├─ YES → Zustand store in lib/stores/
        │         (reserved for auth, preferences)
        │
        └─ NO → Is it used by multiple components in one feature?
                ├─ YES → Zustand store in features/<name>/stores/
                │
                └─ NO → Does it need to persist across unmounts?
                        ├─ YES → Zustand with persist middleware
                        │
                        └─ NO → Component useState/useReducer
```

---

## Common Mistakes

### 1. Storing server data in component state

Never fetch data in `useEffect` and store in `useState`. Use PowerSync `useQuery` hooks so data is shared, cached, and reactive.

```tsx
// BAD: Fetching in useEffect + useState
function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    supabase
      .from("projects")
      .select()
      .then(({ data }) => setProjects(data));
  }, []);

  return <div>{/* ... */}</div>;
}

// GOOD: Using PowerSync useQuery (reactive, local-first)
function ProjectList() {
  const { data: projects } = useProjects(userId);
  return <div>{/* ... */}</div>;
}
```

### 2. Writing directly to Supabase when PowerSync is available

Always use PowerSync `db.execute()` for writes so offline writes are queued and synced. Only fall back to Supabase direct when PowerSync is not configured.

```tsx
// BAD: Direct Supabase write (bypasses offline queue)
await supabase.from("projects").insert({ title: "New Project" });

// GOOD: PowerSync write (queued for offline, auto-synced)
const db = usePowerSync();
await db.execute("INSERT INTO projects (id, title, user_id) VALUES (?, ?, ?)", [
  crypto.randomUUID(),
  "New Project",
  userId,
]);
```

### 3. Not handling PowerSync fallback

Some users may not have `VITE_POWERSYNC_URL` configured. Always check `getPowerSyncDb()` and fall back to Supabase direct.

```tsx
// GOOD: Dual path in shared utilities
import { getPowerSyncDb } from "../lib/powersync";
import { supabase } from "../lib/supabase";

export async function createProject(title: string, userId: string) {
  const id = crypto.randomUUID();
  const db = getPowerSyncDb();

  if (db) {
    await db.execute("INSERT INTO projects ...", [id, userId, title]);
  } else {
    await supabase.from("projects").insert({ id, user_id: userId, title });
  }
  return id;
}
```

### 4. Mixing presentation and data logic in stores

Stores manage state. They don't navigate, show toasts, or format strings for display. Keep that in components.

### 5. Not separating local vs remote data sources

Always have a clear boundary: PowerSync `useQuery`/`db.execute` for server data (with Supabase fallback), `useState` for client state. Don't mix both in a single hook.

### 6. Using global state for simple component state

For ephemeral UI state (form inputs, toggles), use `useState`. Don't create Zustand stores for component-local state.