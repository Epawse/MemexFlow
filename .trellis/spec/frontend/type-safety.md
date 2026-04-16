# Type Safety

> Type safety patterns in this project (Dart/Flutter).

---

## Overview

Dart is a strongly-typed language with sound null safety. MemexFlow leverages Dart's type system, **Freezed** for immutable data classes, and **Drift** for type-safe local database access.

---

## Type Organization

### Where types live

| Type category | Location | Example |
|--------------|----------|---------|
| Domain models (shared) | `core/models/` | `Project`, `Candidate`, `Memory` |
| Feature-specific models | `features/<name>/models/` | `CandidateFilterState` |
| API response types | `core/network/` | `ApiError` |
| Database table definitions | `core/database/tables.dart` | Drift table classes |
| Enums | Alongside their domain model | `CandidateStatus`, `MemoryType` |

### Domain model pattern with Freezed

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'project.freezed.dart';
part 'project.g.dart';

@freezed
class Project with _$Project {
  const factory Project({
    required String id,
    required String name,
    required String goal,
    required ProjectStatus status,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default([]) List<String> tags,
  }) = _Project;

  factory Project.fromJson(Map<String, dynamic> json) =>
      _$ProjectFromJson(json);
}

enum ProjectStatus { active, paused, archived }
```

---

## Null Safety

### Rules

1. **Never use `!` (null assertion) without a preceding null check** — prefer pattern matching or `if (x != null)`
2. **Make fields non-nullable by default** — only use `?` when the value is genuinely optional
3. **Use `required` for mandatory constructor parameters**

```dart
// GOOD — nullable only when truly optional
class Memory {
  final String id;
  final String title;
  final String? sourceUri;      // Some memories have no external source
  final String content;
}

// BAD — everything nullable for convenience
class Memory {
  final String? id;
  final String? title;
  final String? sourceUri;
  final String? content;
}
```

---

## Validation

### Use Freezed + custom validation for domain boundaries

```dart
@freezed
class CandidateCreate with _$CandidateCreate {
  const CandidateCreate._();

  const factory CandidateCreate({
    required String sourceUri,
    required String channelType,
    required String projectId,
    String? title,
  }) = _CandidateCreate;

  /// Validates the input before sending to the API.
  String? validate() {
    if (sourceUri.isEmpty) return 'Source URI is required';
    if (!Uri.tryParse(sourceUri)!.isAbsolute ?? true) return 'Invalid URI';
    if (projectId.isEmpty) return 'Project ID is required';
    return null;
  }
}
```

### Form validation in widgets

```dart
TextFormField(
  controller: _urlController,
  validator: (value) {
    if (value == null || value.isEmpty) return 'URL is required';
    final uri = Uri.tryParse(value);
    if (uri == null || !uri.isAbsolute) return 'Enter a valid URL';
    return null;
  },
)
```

---

## Common Patterns

### Pattern 1: Sealed classes for tagged unions

```dart
sealed class CaptureSource {
  const CaptureSource();
}

class UrlSource extends CaptureSource {
  const UrlSource(this.url);
  final String url;
}

class PdfSource extends CaptureSource {
  const PdfSource(this.filePath);
  final String filePath;
}

class NoteSource extends CaptureSource {
  const NoteSource(this.title, this.body);
  final String title;
  final String body;
}

// Usage with exhaustive pattern matching
String describe(CaptureSource source) => switch (source) {
  UrlSource(:final url) => 'URL: $url',
  PdfSource(:final filePath) => 'PDF: $filePath',
  NoteSource(:final title) => 'Note: $title',
};
```

### Pattern 2: Extension methods for domain logic

```dart
extension MemoryListExtension on List<Memory> {
  List<Memory> byType(MemoryType type) =>
      where((m) => m.memoryType == type).toList();

  List<Memory> recentFirst() =>
      sorted((a, b) => b.createdAt.compareTo(a.createdAt));
}
```

### Pattern 3: Type-safe JSON parsing with `fromJson`

Always use code-generated `fromJson` (via `json_serializable` or Freezed). Never manually parse JSON with `map['key'] as String`.

---

## Forbidden Patterns

### 1. `dynamic` type
Never use `dynamic`. If the type isn't known, use `Object` and cast with pattern matching.

### 2. Untyped `Map<String, dynamic>` in business logic
Only accept `Map<String, dynamic>` at JSON boundaries. Convert to typed models immediately.

```dart
// FORBIDDEN in business logic
void processCandidate(Map<String, dynamic> data) { ... }

// CORRECT
void processCandidate(Candidate candidate) { ... }
```

### 3. `as` casts without safety
Use pattern matching instead of bare `as` casts.

```dart
// BAD
final name = data['name'] as String;

// GOOD
if (data case {'name': final String name}) {
  // use name
}
```

### 4. Implicit `toString()` in interpolation
Don't rely on default `toString()` for domain objects. Use explicit fields.

```dart
// BAD
logger.info('Processing $candidate');  // prints Instance of 'Candidate'

// GOOD
logger.info('Processing candidate=${candidate.id} title=${candidate.title}');
```
