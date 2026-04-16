# State Management

> How state is managed in this project.

---

## Overview

MemexFlow uses a **three-layer state management architecture**:

1. **React Query (TanStack Query)** — server state and cache
2. **Zustand** — global client state
3. **React Context API + useState** — component-scoped state

State is categorized into four types, each with clear guidelines for where it lives.

---

## State Categories

### 1. Component-local state (ephemeral UI)

**Where**: `useState` or `useReducer` inside components

**Examples**: tab index, form input values, animation state, expanded/collapsed toggle

```tsx
// Fine for ephemeral state
function CaptureForm() {
  const [url, setUrl] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <form>
      <input value={url} onChange={(e) => setUrl(e.target.value)} />
      {/* ... */}
    </form>
  );
}
```

### 2. Feature state (scoped to a feature)

**Where**: Zustand stores in `features/<name>/stores/`

**Examples**: filter settings, UI preferences, form state that needs to persist across component unmounts

```tsx
// features/candidates/stores/candidateFilterStore.ts
import { create } from 'zustand';

interface CandidateFilterState {
  status: CandidateStatus | null;
  channel: string | null;
  setStatus: (status: CandidateStatus | null) => void;
  setChannel: (channel: string | null) => void;
}

export const useCandidateFilterStore = create<CandidateFilterState>((set) => ({
  status: null,
  channel: null,
  setStatus: (status) => set({ status }),
  setChannel: (channel) => set({ channel }),
}));

// Usage in component
function CandidateList() {
  const { status, setStatus } = useCandidateFilterStore();
  // ...
}
```

### 3. Server state (remote data)

**Where**: React Query hooks with PowerSync for local-first sync

**Examples**: project data from Supabase, candidate list, memories, briefs

**Pattern**: PowerSync syncs Supabase → local SQLite → React Query reads from local → UI updates

```tsx
// features/candidates/hooks/useCandidates.ts
import { useQuery } from '@tanstack/react-query';
import { usePowerSync } from '@powersync/react';

export function useCandidates(projectId: string) {
  const powerSync = usePowerSync();
  const { status, channel } = useCandidateFilterStore();

  return useQuery({
    queryKey: ['candidates', projectId, status, channel],
    queryFn: async () => {
      // Read from local SQLite via PowerSync
      let query = `
        SELECT * FROM candidates 
        WHERE project_id = ?
      `;
      const params = [projectId];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      query += ` ORDER BY ingested_at DESC`;

      const result = await powerSync.execute(query, params);
      return result.rows?._array || [];
    },
    // Data is always available from local SQLite
    staleTime: 0,
  });
}
```

### 4. Local-persistent state (survives app restart)

**Where**: Zustand with persist middleware + PowerSync for synced data

**Examples**: user preferences, UI settings, offline-cached data

```tsx
// core/stores/preferencesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
    }),
    {
      name: 'memexflow-preferences', // IndexedDB key
    }
  )
);
```

---

## When to Use Global State

Promote state to a "global" (app-wide) Zustand store only when:

1. **Multiple features need it** — e.g., current user, auth state, app config
2. **It's infrastructure** — Supabase client, PowerSync instance, theme mode
3. **It persists across navigation** — filter settings, UI preferences

If only one feature uses it, keep it scoped to that feature's `stores/` directory.

### App-wide stores (in `core/`)

```
core/
├── stores/
│   ├── authStore.ts              → useAuthStore
│   ├── preferencesStore.ts       → usePreferencesStore
│   └── appConfigStore.ts         → useAppConfigStore
└── providers/
    ├── PowerSyncProvider.tsx     → PowerSync context
    └── QueryProvider.tsx         → React Query context
```

---

## Server State Sync Strategy

### Local-first with PowerSync

MemexFlow uses **PowerSync** to sync Supabase (Postgres) ↔ local SQLite bidirectionally.

1. **PowerSync syncs in background** — Postgres changes → local SQLite
2. **React Query reads from local SQLite** — instant display, no network latency
3. **Writes go to Supabase** — PowerSync detects changes and syncs back to local
4. **UI reacts** via React Query's automatic refetch on window focus / reconnect

```
User action → Write to Supabase → PowerSync syncs to local SQLite → React Query refetches → UI updates
```

### Data flow pattern

```tsx
// Write mutation
const createMemory = useMutation({
  mutationFn: async (data: CreateMemoryInput) => {
    // Write to Supabase (PowerSync will sync to local automatically)
    const { data: memory, error } = await supabase
      .from('memories')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return memory;
  },
  onSuccess: () => {
    // Invalidate React Query cache to trigger refetch from local SQLite
    queryClient.invalidateQueries({ queryKey: ['memories'] });
  },
});

// Read query (from local SQLite via PowerSync)
const { data: memories } = useQuery({
  queryKey: ['memories', projectId],
  queryFn: async () => {
    const result = await powerSync.execute(
      'SELECT * FROM memories WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    return result.rows?._array || [];
  },
});
```

### Conflict resolution

For MVP, use **last-write-wins**. The Supabase server is the source of truth. PowerSync handles conflict resolution automatically:

- Local changes that fail to sync are retried with exponential backoff
- Conflicts are resolved server-side (last write wins)
- PowerSync syncs the resolved state back to local SQLite

---

## State Location Decision Tree

Use this to decide where state should live:

```
Is it server data (from Supabase)?
├─ YES → React Query + PowerSync
│         (useCandidates, useMemories, useProjects)
│
└─ NO → Is it used by multiple features?
        ├─ YES → Zustand store in core/stores/
        │         (useAuthStore, usePreferencesStore)
        │
        └─ NO → Is it used by multiple components in one feature?
                ├─ YES → Zustand store in features/<name>/stores/
                │         (useCandidateFilterStore)
                │
                └─ NO → Does it need to persist across unmounts?
                        ├─ YES → Zustand with persist middleware
                        │
                        └─ NO → Component useState/useReducer
```

---

## Common Mistakes

### 1. Storing server data in component state
Never fetch data in `useEffect` and store in `useState`. Use React Query so data is shared, cached, and reactive across components.

```tsx
// ❌ BAD: Fetching in useEffect
function ProjectList() {
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    supabase.from('projects').select().then(({ data }) => setProjects(data));
  }, []);
  
  return <div>{/* ... */}</div>;
}

// ✅ GOOD: Using React Query
function ProjectList() {
  const { data: projects } = useProjects();
  return <div>{/* ... */}</div>;
}
```

### 2. Creating too many Zustand stores
Don't create a separate store for every single piece of state. Group related state into a single store when they change together.

```tsx
// ❌ BAD: Too granular
const useStatusStore = create((set) => ({ status: null, setStatus: (s) => set({ status: s }) }));
const useChannelStore = create((set) => ({ channel: null, setChannel: (c) => set({ channel: c }) }));

// ✅ GOOD: Grouped related state
const useFilterStore = create((set) => ({
  status: null,
  channel: null,
  setStatus: (status) => set({ status }),
  setChannel: (channel) => set({ channel }),
}));
```

### 3. Mixing presentation and data logic in stores
Stores manage state. They don't navigate, show toasts, or format strings for display. Keep that in components.

```tsx
// ❌ BAD: Navigation logic in store
const useAuthStore = create((set) => ({
  logout: () => {
    set({ user: null });
    router.push('/login'); // Don't do this
  },
}));

// ✅ GOOD: Navigation in component
function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

### 4. Not separating local vs remote data sources
Always have a clear boundary: React Query for server data (via PowerSync), Zustand for client state. Don't mix both in a single hook.

```tsx
// ❌ BAD: Mixing server and client state
const useProjectState = create((set) => ({
  projects: [], // Server data
  selectedId: null, // Client state
  fetchProjects: async () => {
    const data = await supabase.from('projects').select();
    set({ projects: data });
  },
}));

// ✅ GOOD: Separated concerns
const { data: projects } = useProjects(); // React Query for server data
const selectedId = useProjectStore((state) => state.selectedId); // Zustand for client state
```

### 5. Using Zustand for simple component state
Zustand is for shared or persistent state. For ephemeral UI state (form inputs, toggles), use `useState`.

```tsx
// ❌ BAD: Zustand for ephemeral state
const useExpandedStore = create((set) => ({
  isExpanded: false,
  toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));

// ✅ GOOD: useState for component-local state
function CollapsiblePanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  return <div>{/* ... */}</div>;
}
```

### 6. Not using Zustand selectors
Always use selectors to avoid unnecessary re-renders. Only subscribe to the state you need.

```tsx
// ❌ BAD: Subscribing to entire store
function StatusBadge() {
  const store = useCandidateFilterStore(); // Re-renders on ANY state change
  return <span>{store.status}</span>;
}

// ✅ GOOD: Using selector
function StatusBadge() {
  const status = useCandidateFilterStore((state) => state.status); // Only re-renders when status changes
  return <span>{status}</span>;
}
```
