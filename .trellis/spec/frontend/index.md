# Frontend Development Guidelines

> Flutter/Dart frontend conventions — desktop-first (macOS/Windows), then mobile.

---

## Overview

MemexFlow frontend is a Flutter application using:
- **Riverpod** (code-gen) for state management
- **Freezed** for immutable data classes
- **Drift** for local SQLite database
- **GoRouter** for navigation
- **Material 3** design system

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Feature-first layout, core/shared/features organization | Filled |
| [Widget Guidelines](./component-guidelines.md) | Widget patterns, props, styling, accessibility | Filled |
| [Provider Guidelines](./hook-guidelines.md) | Riverpod providers, data fetching, naming | Filled |
| [State Management](./state-management.md) | Local/feature/server/persistent state categories | Filled |
| [Quality Guidelines](./quality-guidelines.md) | flutter_lints, testing, forbidden patterns | Filled |
| [Type Safety](./type-safety.md) | Dart types, Freezed models, null safety, sealed classes | Filled |

---

## Pre-Development Checklist

Before writing frontend code, read:

1. **Always**: [Directory Structure](./directory-structure.md) — know where files go
2. **Always**: [Quality Guidelines](./quality-guidelines.md) — forbidden patterns, required patterns
3. **If building widgets**: [Widget Guidelines](./component-guidelines.md) — structure, styling, a11y
4. **If managing state**: [State Management](./state-management.md) + [Provider Guidelines](./hook-guidelines.md)
5. **If defining models**: [Type Safety](./type-safety.md) — Freezed, null safety, sealed classes

---

## Quick Reference

| Tool | Command |
|------|---------|
| Analyze | `flutter analyze` |
| Format | `dart format lib/ test/` |
| Test | `flutter test` |
| Code gen | `dart run build_runner build --delete-conflicting-outputs` |
| Code gen (watch) | `dart run build_runner watch --delete-conflicting-outputs` |

---

**Language**: All documentation should be written in **English**.
