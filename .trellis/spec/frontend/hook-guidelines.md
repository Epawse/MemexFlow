# Hook Guidelines

> How React hooks are used in this project.

---

## Overview

MemexFlow uses **React hooks** with **React Query** for server state and **PowerSync** for real-time sync. Custom hooks encapsulate data fetching, mutations, and local state logic.

---

## Hook Patterns

### Hook types and when to use each

| Hook Type | Use Case | Example |
|-----------|----------|---------|
| `useMemo` | Computed/derived values | `useSupabaseClient` |
| `useQuery` | Server data fetch (read-only) | `useProjectDetail(id)` |
| `useSubscription` | Real-time data streams (PowerSync) | `useCandidateList()` |
| `useState` | Simple local state | `useCaptureForm()` |
| `useReducer` | Complex local state with actions | `useFilterState()` |
| `useQuery + useMutation` | Server data with mutations | `useProjectList()` |

### Standard custom hook structure

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/core/hooks/useSupabase';

export function useProjectList() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createProject = useMutation({
    mutationFn: async (input: ProjectCreate) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(input);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createProject: createProject.mutateAsync,
    deleteProject: deleteProject.mutateAsync,
  };
}
```

---

## Data Fetching

### Use `useQuery` for read-only data

```typescript
export function useProjectDetail(projectId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, memories(count), candidates(count)')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data as ProjectDetail;
    },
    enabled: !!projectId,
  });
}
```

### Use `useQuery + useMutation` for data with mutations

When a component needs both read and write operations, combine `useQuery` with `useMutation` (see example above).

### Use PowerSync `useQuery` for real-time local-first data

```typescript
import { useQuery } from '@powersync/react';

export function useCandidateList(projectId: string) {
  const { data } = useQuery(
    'SELECT * FROM candidates WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );

  return data;
}
```

### Invalidation over manual cache management

```typescript
// GOOD — invalidate to trigger refetch
queryClient.invalidateQueries({ queryKey: ['projects'] });

// BAD — manually updating cache to mirror server state
queryClient.setQueryData(['projects'], (old) => [...old, newProject]);
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Hook file | `use<Feature>.ts` | `useProjectList.ts` |
| Hook function | `use<Feature>` | `useProjectList` |
| Hook with params | `use<Feature>(params)` | `useProjectDetail(id)` |
| Query keys | `['feature', ...params]` | `['projects', projectId]` |

---

## Organization Rules

1. **Hooks live in `features/<feature>/hooks/`** — not in a global `hooks/` folder
2. **Core infrastructure hooks** (Supabase client, PowerSync, auth) live in `core/hooks/`
3. **One hook concept per file** — don't mix unrelated hooks
4. **Export hooks as named exports** — no default exports for hooks

---

## Common Mistakes

### 1. Calling hooks conditionally

```typescript
// BAD — hooks must be called unconditionally
if (shouldFetch) {
  const { data } = useProjectList();
}

// GOOD — use the enabled option
const { data } = useProjectList({ enabled: shouldFetch });
```

### 2. Not handling loading and error states

```typescript
// GOOD
function ProjectList() {
  const { projects, isLoading, error } = useProjectList();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <ProjectListView projects={projects} />;
}
```

### 3. Over-using custom hooks

Don't extract every piece of state into a custom hook. Component-local `useState` is fine for ephemeral UI state like form inputs or toggle states.

### 4. Forgetting to invalidate after mutations

After any create/update/delete, call `queryClient.invalidateQueries()` to refresh data. Use the `onSuccess` callback in `useMutation`.

### 5. Putting UI logic in hooks

Hooks handle data and business logic. Navigation, toasts, and dialog presentation stay in the component layer.

### 6. Not using query keys consistently

Always use the same query key structure for the same data. Inconsistent keys prevent proper cache invalidation.

```typescript
// BAD — inconsistent keys
useQuery({ queryKey: ['project', id] });
useQuery({ queryKey: ['projects', id] });

// GOOD — consistent keys
useQuery({ queryKey: ['projects', id] });
useQuery({ queryKey: ['projects', id] });
```
