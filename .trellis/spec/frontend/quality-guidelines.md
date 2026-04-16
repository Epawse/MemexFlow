# Quality Guidelines

> Code quality standards for frontend (Flutter/Dart) development.

---

## Overview

MemexFlow Flutter app uses:
- **flutter_lints** (+ custom rules) for linting
- **Dart analyzer** strict mode for static analysis
- **flutter_test** for widget and unit testing
- **Riverpod** with code generation (requires `build_runner`)

---

## Forbidden Patterns

### 1. `dynamic` type
Never use `dynamic`. Use `Object` with pattern matching if the type isn't known at compile time.

### 2. Bare `print()` statements
Use a proper logger. `print()` should never appear in committed code.

### 3. Hardcoded strings in UI
All user-facing strings should use localization (l10n). No literal strings in widget trees (except for development/placeholder).

### 4. Business logic in widgets
Widgets call providers and render results. They don't make API calls, transform data, or contain branching business rules.

### 5. Mutable state in `StatelessWidget`
`StatelessWidget` must have only `final` fields. If you need mutation, use `StatefulWidget` or Riverpod.

### 6. Deep widget nesting
If `build()` has more than 4 levels of nesting, extract into `_build*` helper methods or separate widgets.

### 7. Unused imports
Dart analyzer catches these, but review anyway. Don't leave dead imports.

---

## Required Patterns

### 1. `const` constructors everywhere possible
Mark widget constructors and child widgets `const` to enable Flutter's rebuild optimization.

### 2. Named parameters for all widget constructors

```dart
const CandidateCard({
  super.key,
  required this.candidate,
  this.onTap,
});
```

### 3. Error and loading state handling
Every async data display must handle loading and error states. Use `.when()` with Riverpod.

### 4. Theme-based styling
Use `Theme.of(context)` for all colors and text styles. Never hardcode color values.

### 5. Semantic labels on interactive elements
All buttons, icons, and custom interactive widgets need accessibility labels.

---

## Testing Requirements

### Test structure

```
test/
├── unit/                    # Pure Dart logic tests
│   ├── models/
│   └── utils/
├── widget/                  # Widget rendering tests
│   ├── features/
│   └── shared/
└── integration/             # Full flow tests
```

### Requirements

- **Unit tests** for all domain models (serialization, validation, computed properties)
- **Widget tests** for all shared widgets and screen-level widgets
- **Integration tests** for critical user flows (capture → confirm → memory)
- Target: **80%+ coverage on `core/` and `shared/`**

### Widget test pattern

```dart
testWidgets('CandidateCard displays title and source', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: CandidateCard(
        candidate: testCandidate,
        onTap: () {},
      ),
    ),
  );

  expect(find.text(testCandidate.title), findsOneWidget);
  expect(find.text(testCandidate.sourceUri), findsOneWidget);
});
```

---

## Code Review Checklist

- [ ] No `dynamic` types
- [ ] No `print()` statements
- [ ] All widget constructors are `const` where possible
- [ ] Named parameters with `required` for mandatory fields
- [ ] Loading and error states handled for async data
- [ ] Theme tokens used (no hardcoded colors/sizes)
- [ ] Accessibility labels on interactive elements
- [ ] Tests added for new widgets and logic
- [ ] `build_runner` ran after provider changes
- [ ] `flutter analyze` passes with no issues
- [ ] No feature-to-feature imports (only via `core/` or `shared/`)

---

## Commands

```bash
# Analyze
flutter analyze

# Format
dart format lib/ test/

# Test
flutter test

# Test with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Code generation (Riverpod, Freezed, Drift)
dart run build_runner build --delete-conflicting-outputs

# Watch mode for code generation during development
dart run build_runner watch --delete-conflicting-outputs
```
