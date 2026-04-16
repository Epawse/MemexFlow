# Type Safety

> Type safety patterns in this project (React/TypeScript).

---

## Overview

TypeScript with **strict mode** enabled provides sound null safety and type checking. MemexFlow leverages TypeScript's type system, **Zod** for runtime validation and schema inference, and **PowerSync** for type-safe local database access.

---

## Type Organization

### Where types live

| Type category | Location | Example |
|--------------|----------|---------|
| Domain models (shared) | `src/lib/models/` | `Project`, `Candidate`, `Memory` |
| Feature-specific types | `src/features/<name>/types.ts` | `CandidateFilterState` |
| API response types | `src/lib/api/types.ts` | `ApiError` |
| Database schemas | `src/lib/db/schema.ts` | PowerSync table schemas |
| Zod schemas | Alongside their domain model | `projectSchema`, `memorySchema` |

### Domain model pattern with Zod

```typescript
import { z } from 'zod';

// Define schema with Zod
export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  goal: z.string(),
  status: z.enum(['active', 'paused', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).default([]),
});

// Infer TypeScript type from schema
export type Project = z.infer<typeof projectSchema>;

// Type alias for status enum
export type ProjectStatus = Project['status'];
```

---

## Null Safety

### Rules

1. **Never use `!` (non-null assertion) without a preceding null check** — prefer type guards or optional chaining
2. **Make fields non-nullable by default** — only use `?` when the value is genuinely optional
3. **Enable `strictNullChecks` in tsconfig.json** (part of strict mode)

```typescript
// GOOD — nullable only when truly optional
interface Memory {
  id: string;
  title: string;
  sourceUri?: string;  // Some memories have no external source
  content: string;
}

// BAD — everything nullable for convenience
interface Memory {
  id?: string;
  title?: string;
  sourceUri?: string;
  content?: string;
}
```

### Handling nullable values

```typescript
// GOOD — optional chaining
const uri = memory.sourceUri?.toLowerCase();

// GOOD — nullish coalescing
const uri = memory.sourceUri ?? 'No source';

// GOOD — type guard
if (memory.sourceUri) {
  // TypeScript knows sourceUri is string here
  console.log(memory.sourceUri.toLowerCase());
}

// BAD — non-null assertion without check
const uri = memory.sourceUri!.toLowerCase();  // Runtime error if null
```

---

## Validation

### Use Zod schemas for domain boundaries

```typescript
import { z } from 'zod';

// Define schema with custom validation
export const candidateCreateSchema = z.object({
  sourceUri: z.string().url('Invalid URL'),
  channelType: z.string().min(1),
  projectId: z.string().uuid(),
  title: z.string().optional(),
}).refine(
  (data) => {
    try {
      const url = new URL(data.sourceUri);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'Source URI must be a valid absolute URL' }
);

export type CandidateCreate = z.infer<typeof candidateCreateSchema>;

// Usage — parse and validate
function createCandidate(input: unknown) {
  const result = candidateCreateSchema.safeParse(input);
  
  if (!result.success) {
    // result.error.errors contains validation errors
    return { error: result.error.format() };
  }
  
  // result.data is typed as CandidateCreate
  return { data: result.data };
}
```

### Form validation with Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const urlFormSchema = z.object({
  url: z.string().url('Enter a valid URL'),
});

function CaptureForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(urlFormSchema),
  });

  const onSubmit = (data: z.infer<typeof urlFormSchema>) => {
    // data.url is validated and typed
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('url')} />
      {errors.url && <span>{errors.url.message}</span>}
    </form>
  );
}
```

---

## Common Patterns

### Pattern 1: Discriminated unions for tagged types

```typescript
// Define discriminated union
type CaptureSource =
  | { type: 'url'; url: string }
  | { type: 'pdf'; filePath: string }
  | { type: 'note'; title: string; body: string };

// Usage with exhaustive type narrowing
function describe(source: CaptureSource): string {
  switch (source.type) {
    case 'url':
      return `URL: ${source.url}`;
    case 'pdf':
      return `PDF: ${source.filePath}`;
    case 'note':
      return `Note: ${source.title}`;
    default:
      // TypeScript ensures exhaustiveness
      const _exhaustive: never = source;
      return _exhaustive;
  }
}

// Zod schema for discriminated union
const captureSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('url'), url: z.string().url() }),
  z.object({ type: z.literal('pdf'), filePath: z.string() }),
  z.object({ type: z.literal('note'), title: z.string(), body: z.string() }),
]);
```

### Pattern 2: Utility types for domain logic

```typescript
// Type-safe array utilities
function byType<T extends { memoryType: string }>(
  memories: T[],
  type: string
): T[] {
  return memories.filter((m) => m.memoryType === type);
}

function recentFirst<T extends { createdAt: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Or use utility type for constraints
type HasMemoryType = { memoryType: string };
type HasCreatedAt = { createdAt: Date };

const memoryUtils = {
  byType: (memories: HasMemoryType[], type: string) =>
    memories.filter((m) => m.memoryType === type),
  
  recentFirst: <T extends HasCreatedAt>(items: T[]) =>
    [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
};
```

### Pattern 3: Type-safe JSON parsing with Zod

Always use Zod schemas to parse untrusted JSON. Never manually cast with `as` or access properties without validation.

```typescript
// GOOD — validate with Zod
const result = projectSchema.safeParse(jsonData);
if (result.success) {
  const project: Project = result.data;
}

// GOOD — parse or throw
const project = projectSchema.parse(jsonData);  // throws ZodError if invalid

// BAD — unsafe cast
const project = jsonData as Project;  // No runtime validation
```

---

## Forbidden Patterns

### 1. `any` type
Never use `any`. If the type isn't known, use `unknown` and narrow with type guards.

```typescript
// BAD
function process(data: any) { ... }

// GOOD
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // Type narrowed
  }
}
```

### 2. Untyped objects in business logic
Only accept `unknown` or `Record<string, unknown>` at API boundaries. Parse to typed models immediately with Zod.

```typescript
// FORBIDDEN in business logic
function processCandidate(data: Record<string, unknown>) { ... }

// CORRECT
function processCandidate(candidate: Candidate) { ... }

// At API boundary
async function fetchCandidate(id: string): Promise<Candidate> {
  const response = await fetch(`/api/candidates/${id}`);
  const data: unknown = await response.json();
  return candidateSchema.parse(data);  // Validate and type
}
```

### 3. `as` casts without validation
Use type guards or Zod validation instead of bare `as` casts.

```typescript
// BAD
const name = data['name'] as string;

// GOOD — type guard
if (typeof data === 'object' && data !== null && 'name' in data && typeof data.name === 'string') {
  const name = data.name;
}

// BETTER — Zod schema
const schema = z.object({ name: z.string() });
const result = schema.safeParse(data);
if (result.success) {
  const name = result.data.name;
}
```

### 4. Implicit string coercion of objects
Don't rely on default `toString()` for domain objects. Use explicit fields or template literals.

```typescript
// BAD
logger.info(`Processing ${candidate}`);  // prints [object Object]

// GOOD
logger.info(`Processing candidate=${candidate.id} title=${candidate.title}`);

// BETTER — structured logging
logger.info('Processing candidate', { 
  candidateId: candidate.id, 
  title: candidate.title 
});
```

### 5. Non-null assertion operator (`!`)
Avoid `!` unless you have an immediately preceding check. Prefer optional chaining or type guards.

```typescript
// BAD
const length = user.name!.length;  // Runtime error if name is undefined

// GOOD — optional chaining
const length = user.name?.length;

// GOOD — type guard
if (user.name) {
  const length = user.name.length;
}
```

---

## Type Narrowing

### Built-in type guards

```typescript
// typeof for primitives
if (typeof value === 'string') { /* value is string */ }
if (typeof value === 'number') { /* value is number */ }

// instanceof for classes
if (error instanceof Error) { /* error is Error */ }

// in operator for properties
if ('sourceUri' in memory) { /* memory has sourceUri property */ }

// Array.isArray
if (Array.isArray(value)) { /* value is unknown[] */ }
```

### Custom type guards

```typescript
// User-defined type guard
function isMemory(value: unknown): value is Memory {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'content' in value
  );
}

// Usage
if (isMemory(data)) {
  // data is Memory here
  console.log(data.title);
}
```

### Discriminated union narrowing

```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

function handleResult<T, E>(result: Result<T, E>) {
  if (result.success) {
    // TypeScript knows result.data exists
    return result.data;
  } else {
    // TypeScript knows result.error exists
    throw result.error;
  }
}
```

---

## Generic Constraints

### Using `extends` for type constraints

```typescript
// Constrain to objects with id
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Multiple constraints
function sortByDate<T extends { createdAt: Date }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const diff = a.createdAt.getTime() - b.createdAt.getTime();
    return order === 'asc' ? diff : -diff;
  });
}

// Constrain to specific union
function processStatus<T extends ProjectStatus>(status: T): string {
  // T is guaranteed to be one of the ProjectStatus values
  return `Status: ${status}`;
}
```

---

## Serialization

### JSON serialization with Zod

```typescript
// Define schema with transformations
const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime().transform(s => new Date(s)),
  updatedAt: z.string().datetime().transform(s => new Date(s)),
});

// Parse from JSON
const project = projectSchema.parse(jsonData);  // createdAt/updatedAt are Date objects

// Serialize to JSON
const jsonData = {
  ...project,
  createdAt: project.createdAt.toISOString(),
  updatedAt: project.updatedAt.toISOString(),
};
```

### Type-safe API responses

```typescript
// Define API response schema
const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.string().optional(),
  });

// Usage
const projectResponseSchema = apiResponseSchema(projectSchema);
type ProjectResponse = z.infer<typeof projectResponseSchema>;

async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`);
  const json: unknown = await response.json();
  const parsed = projectResponseSchema.parse(json);
  
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  
  return parsed.data;
}
```
