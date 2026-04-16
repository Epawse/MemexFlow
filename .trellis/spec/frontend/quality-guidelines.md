# Quality Guidelines

> Code quality standards for frontend (React/TypeScript) development.

---

## Overview

MemexFlow React app uses:
- **ESLint** + **TypeScript ESLint** for linting
- **TypeScript compiler** (tsc) strict mode for static analysis
- **Vitest** + **React Testing Library** for unit and component testing
- **Playwright** (optional) for integration testing

---

## Forbidden Patterns

### 1. `any` type
Never use `any`. Use `unknown` with type guards if the type isn't known at compile time.

### 2. `console.log()` in production code
Use a proper logger. `console.log()` should never appear in committed code (except for development debugging, then remove before commit).

### 3. Hardcoded strings in UI
All user-facing strings should use i18n. No literal strings in JSX (except for development/placeholder).

### 4. Business logic in components
Components call hooks/services and render results. They don't make API calls, transform data, or contain branching business rules.

### 5. Direct state mutation
Never mutate state directly. Use immutable updates with spread operators or libraries like Immer.

### 6. Deep JSX nesting
If JSX has more than 4 levels of nesting, extract into helper functions or separate components.

### 7. Unused imports
ESLint catches these, but review anyway. Don't leave dead imports.

### 8. Missing dependency arrays
All `useEffect`, `useMemo`, `useCallback` must have correct dependency arrays. Don't disable the exhaustive-deps rule.

---

## Required Patterns

### 1. Memoization for expensive computations
Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders.

```tsx
const CandidateCard = React.memo<CandidateCardProps>(({ candidate, onTap }) => {
  // component implementation
});
```

### 2. TypeScript interfaces for all props

```tsx
interface CandidateCardProps {
  candidate: Candidate;
  onTap?: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onTap }) => {
  // component implementation
};
```

### 3. Error and loading state handling
Every async data display must handle loading and error states. Use React Query's status or custom hooks.

```tsx
const { data, isLoading, error } = useQuery({ queryKey: ['candidates'], queryFn: fetchCandidates });

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <CandidateList candidates={data} />;
```

### 4. Theme-based styling
Use CSS variables or theme tokens for all colors and sizes. Never hardcode color values in components.

### 5. ARIA attributes on interactive elements
All buttons, links, and custom interactive elements need proper ARIA labels and roles.

```tsx
<button aria-label="Delete candidate" onClick={handleDelete}>
  <TrashIcon />
</button>
```

---

## Testing Requirements

### Test structure

```
src/
├── __tests__/              # Unit tests (utilities, hooks, transformations)
│   ├── utils/
│   └── hooks/
├── components/
│   ├── CandidateCard/
│   │   ├── CandidateCard.tsx
│   │   └── CandidateCard.test.tsx    # Component tests
│   └── shared/
└── features/
    └── capture/
        └── Capture.test.tsx           # Feature-level component tests
```

### Requirements

- **Unit tests** for all utility functions, hooks, and data transformations
- **Component tests** for all shared components and feature-level components
- **Integration tests** (Playwright, optional) for critical user flows (capture → confirm → memory)
- Target: **80%+ coverage on `src/lib/` and `src/components/shared/`**

### Component test pattern

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CandidateCard } from './CandidateCard';

describe('CandidateCard', () => {
  it('displays title and source', () => {
    const mockCandidate = {
      title: 'Test Article',
      sourceUri: 'https://example.com',
    };
    
    render(<CandidateCard candidate={mockCandidate} onTap={vi.fn()} />);
    
    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });
});
```

---

## Code Review Checklist

- [ ] No `any` types (use `unknown` with type guards)
- [ ] No `console.log()` statements in committed code
- [ ] All components use TypeScript interfaces for props
- [ ] Memoization applied where appropriate (`React.memo`, `useMemo`, `useCallback`)
- [ ] Loading and error states handled for async data
- [ ] Theme tokens used (no hardcoded colors/sizes)
- [ ] ARIA attributes on interactive elements
- [ ] Tests added for new components and logic
- [ ] All hooks have correct dependency arrays
- [ ] `tsc --noEmit` passes with no errors
- [ ] `eslint` passes with no warnings
- [ ] No feature-to-feature imports (only via `lib/` or `components/shared/`)

---

## Commands

```bash
# Type check
npm run type-check
# or
tsc --noEmit

# Lint
npm run lint
# or
eslint src/

# Lint with auto-fix
npm run lint:fix
# or
eslint src/ --fix

# Format
npm run format
# or
prettier --write src/

# Test
npm run test
# or
vitest

# Test with coverage
npm run test:coverage
# or
vitest --coverage

# Test in watch mode (development)
npm run test:watch
# or
vitest --watch

# Integration tests (Playwright, optional)
npm run test:e2e
# or
playwright test
```
