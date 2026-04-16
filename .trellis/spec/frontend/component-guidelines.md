# Component Guidelines

> How components are built in this project.

---

## Overview

MemexFlow uses React 19 with Tauri 2 and Tailwind CSS. Components are organized by feature, with shared reusable components in `shared/components/`. The project targets desktop-first (macOS/Windows) with responsive layouts for mobile.

---

## Component Structure

### Standard component file structure

```typescript
import { Candidate } from '@/types/candidate';

interface CandidateCardProps {
  candidate: Candidate;
  onConfirm?: () => void;
  onIgnore?: () => void;
}

/**
 * Displays a candidate item with summary, tags, and action buttons.
 */
export function CandidateCard({ candidate, onConfirm, onIgnore }: CandidateCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        {renderHeader()}
        {renderSummary()}
        {renderActions()}
      </div>
    </div>
  );

  function renderHeader() { ... }
  function renderSummary() { ... }
  function renderActions() { ... }
}
```

### Rules

1. **Use functional components** with TypeScript interfaces for props
2. **Define props interface** above the component — use required vs optional types
3. **Break JSX into `render*` helper functions** when the component exceeds ~40 lines
4. **Use hooks** (useState, useContext, custom hooks) for state and side effects
5. **One exported component per file** for screens and major components
6. **File naming**: `candidate-card.tsx` (kebab-case)

---

## Props Conventions

### Use TypeScript interfaces with required/optional distinction

```typescript
// GOOD — clear required vs optional
interface MemoryCardProps {
  memory: Memory;
  onTap: () => void;
  showProject?: boolean;  // Optional with default
  compact?: boolean;      // Optional with default
}

export function MemoryCard({ 
  memory, 
  onTap, 
  showProject = true, 
  compact = false 
}: MemoryCardProps) {
  ...
}
```

### Callback naming

| Pattern | Naming | Example |
|---------|--------|---------|
| Button press | `onX` | `onConfirm`, `onDelete` |
| Value change | `onXChange` | `onFilterChange` |
| Selection | `onXSelect` | `onProjectSelect` |

---

## Styling Patterns

### Use Tailwind CSS utility classes

```typescript
// GOOD — uses Tailwind utilities
<h2 className="text-lg font-semibold text-foreground">
  {title}
</h2>
<div className="bg-surface-low rounded-md p-4">
  {content}
</div>

// BAD — inline styles
<h2 style={{ fontSize: '16px', fontWeight: 600 }}>
  {title}
</h2>
<div style={{ backgroundColor: '#F5F5F5' }}>
  {content}
</div>
```

### Spacing

Use Tailwind spacing scale consistently:

```typescript
// Tailwind spacing: 1 unit = 0.25rem (4px)
// xs = gap-1 (4px)
// sm = gap-2 (8px)
// md = gap-4 (16px)
// lg = gap-6 (24px)
// xl = gap-8 (32px)

<div className="flex flex-col gap-4">  {/* 16px spacing */}
  <Header />
  <Content />
</div>
```

### Desktop-aware layout

```typescript
// Use Tailwind responsive breakpoints
export function ResponsiveLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Single column on mobile, 2 on tablet, 3 on desktop */}
      <Panel />
      <Panel />
      <Panel />
    </div>
  );
}

// Or use custom breakpoints with CSS
// Breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
```

---

## Accessibility

### Minimum requirements

- All interactive elements must have ARIA labels
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- Maintain minimum touch target of 48x48 on mobile
- Support keyboard navigation on desktop (tab order, focus states)
- Test with screen reader on at least one platform

```typescript
// GOOD — semantic HTML + ARIA
<button
  aria-label="Confirm candidate for knowledge base"
  onClick={onConfirm}
  className="rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2"
>
  <CheckIcon className="h-5 w-5" />
</button>

// GOOD — accessible form input
<label htmlFor="search" className="sr-only">
  Search memories
</label>
<input
  id="search"
  type="text"
  placeholder="Search..."
  className="..."
/>
```

---

## Common Mistakes

### 1. Putting business logic in components
Components should only handle presentation. All data fetching, transformation, and side effects go in custom hooks or context providers.

### 2. Deep JSX nesting without extraction
If JSX has more than 3 levels of nesting, extract into `render*` helper functions or separate components.

### 3. Using useState for shared state
`useState` is fine for component-local ephemeral state (tab index, animation). For anything shared across components, use Context API or state management library.

### 4. Hardcoding colors and spacing
Always use Tailwind utility classes. This ensures dark mode support (via CSS variables) and visual consistency.

### 5. Missing TypeScript types
Always define props interfaces. Use `React.FC` sparingly — prefer explicit function declarations with typed props.

### 6. Ignoring memoization
Use `React.memo()` for expensive components that receive stable props. Use `useMemo` and `useCallback` to prevent unnecessary re-renders.
