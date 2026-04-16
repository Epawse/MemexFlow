# Provider Guidelines

> How Riverpod providers are used in this project (replaces "Hook Guidelines" for Flutter).

---

## Overview

MemexFlow uses **Riverpod** (with code generation) as the primary state management and dependency injection solution. Providers replace the concept of "hooks" from React.

---

## Provider Patterns

### Provider types and when to use each

| Provider Type | Use Case | Example |
|--------------|----------|---------|
| `Provider` | Computed/derived values, services | `supabaseClientProvider` |
| `FutureProvider` | One-shot async data fetch | `projectDetailProvider(id)` |
| `StreamProvider` | Real-time data streams | `candidateListStreamProvider` |
| `NotifierProvider` | Mutable state with methods | `captureFormNotifierProvider` |
| `AsyncNotifierProvider` | Async mutable state with methods | `projectListNotifierProvider` |

### Standard provider file structure

```dart
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'project_list_provider.g.dart';

@riverpod
class ProjectListNotifier extends _$ProjectListNotifier {
  @override
  Future<List<Project>> build() async {
    final client = ref.watch(supabaseClientProvider);
    return client.from('projects').select().order('updated_at');
  }

  Future<void> createProject(ProjectCreate input) async {
    final client = ref.read(supabaseClientProvider);
    await client.from('projects').insert(input.toJson());
    ref.invalidateSelf();
  }

  Future<void> deleteProject(String id) async {
    final client = ref.read(supabaseClientProvider);
    await client.from('projects').delete().eq('id', id);
    ref.invalidateSelf();
  }
}
```

---

## Data Fetching

### Use `FutureProvider` for read-only data

```dart
@riverpod
Future<ProjectDetail> projectDetail(Ref ref, String projectId) async {
  final client = ref.watch(supabaseClientProvider);
  final data = await client
      .from('projects')
      .select('*, memories(count), candidates(count)')
      .eq('id', projectId)
      .single();
  return ProjectDetail.fromJson(data);
}
```

### Use `AsyncNotifierProvider` for data with mutations

When a screen needs both read and write operations, use `AsyncNotifierProvider` (see example above).

### Invalidation over manual cache management

```dart
// GOOD — invalidate to trigger refetch
ref.invalidate(projectListNotifierProvider);

// BAD — manually updating state to mirror server state
state = AsyncData(currentList..add(newProject));
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Provider file | `<feature>_provider.dart` | `project_list_provider.dart` |
| Simple provider | `camelCaseProvider` | `supabaseClientProvider` |
| Notifier class | `PascalCaseNotifier` | `ProjectListNotifier` |
| Notifier provider | `camelCaseNotifierProvider` | `projectListNotifierProvider` |
| Family providers | function with params | `projectDetail(ref, id)` |

---

## Organization Rules

1. **Providers live in `features/<feature>/providers/`** — not in a global `providers/` folder
2. **Core infrastructure providers** (Supabase client, database, config) live in `core/`
3. **One provider concept per file** — don't mix unrelated providers
4. **Run `build_runner`** after changing provider definitions:
   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

---

## Common Mistakes

### 1. Using `ref.read` in `build()` instead of `ref.watch`
In `build()`, always use `ref.watch` to react to changes. Use `ref.read` only in callbacks and event handlers.

### 2. Not handling loading and error states

```dart
// GOOD
final projectsAsync = ref.watch(projectListNotifierProvider);
return projectsAsync.when(
  data: (projects) => ProjectListView(projects: projects),
  loading: () => const CircularProgressIndicator(),
  error: (e, st) => ErrorDisplay(error: e),
);
```

### 3. Over-using global providers
Don't make everything a global provider. Widget-local state (`useState` via hooks or `StatefulWidget`) is fine for ephemeral UI state.

### 4. Forgetting to invalidate after mutations
After any create/update/delete, call `ref.invalidateSelf()` or `ref.invalidate(targetProvider)` to refresh data.

### 5. Putting UI logic in providers
Providers handle data and business logic. Navigation, snackbars, and dialog presentation stay in the widget layer.
