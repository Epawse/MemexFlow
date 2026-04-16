# Frontend Development Guidelines

> React/TypeScript + Tauri 2 frontend conventions — desktop-first (macOS/Windows).

---

## Overview

MemexFlow frontend is a React application wrapped in Tauri 2 using:
- **React 19** + **TypeScript** for UI
- **React Query** for server state management
- **PowerSync JS SDK** for local-first sync (Postgres ↔ SQLite)
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Tauri 2** for desktop wrapper (Rust backend)

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Feature-first layout, core/shared/features organization | Updated |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, styling, accessibility | Updated |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, React Query patterns, naming | Updated |
| [State Management](./state-management.md) | Local/server/persistent state categories | Updated |
| [Quality Guidelines](./quality-guidelines.md) | ESLint, testing, forbidden patterns | Updated |
| [Type Safety](./type-safety.md) | TypeScript types, Zod validation, type guards | Updated |

---

## Pre-Development Checklist

Before writing frontend code, read:

1. **Always**: [Directory Structure](./directory-structure.md) — know where files go
2. **Always**: [Quality Guidelines](./quality-guidelines.md) — forbidden patterns, required patterns
3. **If building components**: [Component Guidelines](./component-guidelines.md) — structure, styling, a11y
4. **If managing state**: [State Management](./state-management.md) + [Hook Guidelines](./hook-guidelines.md)
5. **If defining types**: [Type Safety](./type-safety.md) — TypeScript, Zod, type guards

---

## Quick Reference

| Tool | Command |
|------|---------|
| Dev server | `npm run tauri dev` |
| Lint | `npm run lint` |
| Type check | `npm run type-check` |
| Format | `npm run format` |
| Test | `npm run test` |
| Build | `npm run tauri build` |

---

**Language**: All documentation should be written in **English**.
