# State Management

> How state is managed in this project.

---

## Overview

MemexFlow uses **Riverpod** as the single state management solution. State is categorized into four types, each with clear guidelines for where it lives.

---

## State Categories

### 1. Widget-local state (ephemeral UI)

**Where**: `StatefulWidget` or `useState` (flutter_hooks)

**Examples**: tab index, text field controllers, animation state, expanded/collapsed toggle

```dart
// Fine for ephemeral state
class _CaptureFormState extends State<CaptureForm> {
  final _urlController = TextEditingController();
  bool _isExpanded = false;
  ...
}
```

### 2. Feature state (scoped to a feature)

**Where**: Riverpod providers in `features/<name>/providers/`

**Examples**: project list, candidate filter settings, memory search results

```dart
@riverpod
class CandidateFilter extends _$CandidateFilter {
  @override
  CandidateFilterState build() => const CandidateFilterState();

  void setStatus(CandidateStatus? status) {
    state = state.copyWith(status: status);
  }

  void setChannel(String? channel) {
    state = state.copyWith(channel: channel);
  }
}
```

### 3. Server state (remote data)

**Where**: Riverpod `FutureProvider` / `AsyncNotifierProvider`

**Examples**: project data from Supabase, candidate list, memories, briefs

**Pattern**: Fetch → cache in provider → invalidate on mutation

```dart
@riverpod
Future<List<Candidate>> candidateList(
  Ref ref,
  String projectId, {
  CandidateStatus? status,
}) async {
  final filter = ref.watch(candidateFilterProvider);
  final client = ref.watch(supabaseClientProvider);

  var query = client.from('candidates').select().eq('project_id', projectId);
  if (filter.status != null) {
    query = query.eq('status', filter.status!.name);
  }
  return query.order('ingested_at', ascending: false);
}
```

### 4. Local-persistent state (survives app restart)

**Where**: SQLite (via Drift) + Riverpod providers that read from local DB

**Examples**: offline-cached projects, downloaded PDFs metadata, user preferences

```dart
@riverpod
Stream<List<Project>> localProjects(Ref ref) {
  final db = ref.watch(localDatabaseProvider);
  return db.watchAllProjects();
}
```

---

## When to Use Global State

Promote state to a "global" (app-wide) provider only when:

1. **Multiple features need it** — e.g., current user, auth state, app config
2. **It's infrastructure** — Supabase client, local database instance, theme mode

If only one feature uses it, keep it scoped to that feature's `providers/` directory.

### App-wide providers (in `core/`)

```
core/
├── network/supabase_client.dart     → supabaseClientProvider
├── database/database.dart           → localDatabaseProvider
├── config/app_config.dart           → appConfigProvider
└── auth/auth_provider.dart          → authStateProvider
```

---

## Server State Sync Strategy

### Local-first with background sync

1. **Read from local SQLite** first for instant display
2. **Fetch from Supabase** in the background
3. **Merge updates** into local database
4. **UI reacts** via Drift's `watch*` streams

```
User action → Write to Supabase → On success → Write to local SQLite → Stream updates UI
```

### Conflict resolution

For MVP, use **last-write-wins**. The Supabase server is the source of truth. Local changes that fail to sync are retried, not silently dropped.

---

## Common Mistakes

### 1. Storing server data in widget state
Never fetch data in `initState` and store in a local variable. Use Riverpod providers so data is shared, cached, and reactive.

### 2. Creating too many providers
Don't create a separate provider for every single piece of state. Group related state into a single `Notifier` when they change together.

### 3. Mixing presentation and data logic in providers
Providers return data. They don't navigate, show dialogs, or format strings for display. Keep that in widgets.

### 4. Not separating local vs remote data sources
Always have a clear boundary: providers that talk to Supabase vs providers that talk to local SQLite. Don't mix both in a single provider.

### 5. Using `StateProvider` for complex state
`StateProvider` is fine for a single `bool` or `String`. For anything with multiple fields or methods, use `NotifierProvider`.
