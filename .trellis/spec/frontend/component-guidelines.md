# Widget Guidelines

> How widgets (components) are built in this project.

---

## Overview

MemexFlow uses Flutter with Material 3 design. Widgets are organized by feature, with shared reusable widgets in `shared/widgets/`. The project targets desktop-first (macOS/Windows) with responsive layouts for mobile.

---

## Widget Structure

### Standard widget file structure

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Displays a candidate item with summary, tags, and action buttons.
class CandidateCard extends ConsumerWidget {
  const CandidateCard({
    super.key,
    required this.candidate,
    this.onConfirm,
    this.onIgnore,
  });

  final Candidate candidate;
  final VoidCallback? onConfirm;
  final VoidCallback? onIgnore;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(theme),
            const SizedBox(height: 8),
            _buildSummary(theme),
            const SizedBox(height: 12),
            _buildActions(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) { ... }
  Widget _buildSummary(ThemeData theme) { ... }
  Widget _buildActions(ThemeData theme) { ... }
}
```

### Rules

1. **Use `const` constructors** wherever possible
2. **All parameters via named constructor** — use `required` for mandatory fields
3. **Break `build()` into `_build*` helper methods** when it exceeds ~40 lines
4. **Use `ConsumerWidget`** (Riverpod) when the widget reads providers; plain `StatelessWidget` otherwise
5. **One public widget per file** for screens and major components

---

## Props Conventions

### Use named parameters with required/optional distinction

```dart
// GOOD — clear required vs optional
class MemoryCard extends StatelessWidget {
  const MemoryCard({
    super.key,
    required this.memory,
    required this.onTap,
    this.showProject = true,
    this.compact = false,
  });

  final Memory memory;
  final VoidCallback onTap;
  final bool showProject;
  final bool compact;

  ...
}
```

### Callback naming

| Pattern | Naming | Example |
|---------|--------|---------|
| Button press | `onX` | `onConfirm`, `onDelete` |
| Value change | `onXChanged` | `onFilterChanged` |
| Selection | `onXSelected` | `onProjectSelected` |

---

## Styling Patterns

### Use Material 3 theme tokens

```dart
// GOOD — uses theme
final theme = Theme.of(context);
Text(title, style: theme.textTheme.titleMedium);
Container(color: theme.colorScheme.surfaceContainerLow);

// BAD — hardcoded values
Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600));
Container(color: Color(0xFFF5F5F5));
```

### Spacing

Use consistent spacing constants:

```dart
// In core/theme/app_theme.dart
abstract class Spacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
}
```

### Desktop-aware layout

```dart
// Use LayoutBuilder for responsive design
class ResponsiveLayout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 1200) {
          return _buildWideLayout();   // 3-column
        } else if (constraints.maxWidth > 800) {
          return _buildMediumLayout();  // 2-column
        }
        return _buildCompactLayout();   // Single column
      },
    );
  }
}
```

---

## Accessibility

### Minimum requirements

- All interactive elements must have semantic labels
- Use `Semantics` widget for custom components
- Maintain minimum touch target of 48x48 on mobile
- Support keyboard navigation on desktop (focus traversal)
- Test with screen reader on at least one platform

```dart
// GOOD
Semantics(
  label: 'Confirm candidate for knowledge base',
  child: IconButton(
    icon: const Icon(Icons.check),
    onPressed: onConfirm,
  ),
)
```

---

## Common Mistakes

### 1. Putting business logic in widgets
Widgets should only handle presentation. All data fetching, transformation, and side effects go in providers.

### 2. Deep widget nesting without extraction
If `build()` has more than 3 levels of nesting, extract sub-widgets into `_build*` methods or separate widgets.

### 3. Using `setState` for shared state
`setState` is fine for widget-local ephemeral state (tab index, animation). For anything shared, use Riverpod providers.

### 4. Hardcoding colors and text styles
Always use `Theme.of(context)`. This ensures dark mode support and visual consistency.

### 5. Ignoring `const`
Mark constructors and widget trees `const` wherever possible. It prevents unnecessary rebuilds.
