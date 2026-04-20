# Type Safety

> Type safety patterns in this project.

---

## Overview

This project uses **TypeScript in strict mode** with comprehensive type coverage. Types are organized by domain and shared across the application.

---

## Type Organization

```
types/
├── index.ts          # Domain types (Note, Recording, User)
├── api.ts            # API request/response types
└── database.ts       # Drizzle schema types (auto-generated)

components/
└── ui/
    └── Button.tsx    # Component types via GetProps
```

### Shared Types

```typescript
// types/index.ts
export interface Note {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Recording {
  id: number;
  uri: string;
  duration: number;
  createdAt: string;
}
```

### Component Types

Use `GetProps` for Tamagui components:

```typescript
import { GetProps } from 'tamagui';
import { Button } from './Button';

type ButtonProps = GetProps<typeof Button>;
```

---

## Validation

Runtime validation is not currently used. Types are enforced at compile time only.

For future API input validation, consider adding Zod:

```typescript
// Potential pattern (not yet implemented)
import { z } from 'zod';

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
```

---

## Common Patterns

### Union Types for Status

```typescript
type RecordingStatus = 'idle' | 'recording' | 'paused';
```

### Discriminated Unions

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Generic Response Types

```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
}
```

### Type Guards

```typescript
function isNote(value: unknown): value is Note {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value
  );
}
```

---

## Forbidden Patterns

### Never Use `any`

```typescript
// Bad
function process(data: any) { }

// Good
function process(data: unknown) {
  if (typeof data === 'string') { }
}
```

### Avoid Type Assertions

```typescript
// Bad
const note = data as Note;

// Good
const note = isNote(data) ? data : undefined;
```

### No Non-Null Assertions

```typescript
// Bad
const id = user.id!;

// Good
const id = user.id ?? 0;
```

### Use `as const` for Literals

```typescript
// Good
const ROUTES = {
  home: '/',
  settings: '/settings',
} as const;

type Route = typeof ROUTES[keyof typeof ROUTES];
```

---

## Path Aliases

Use path aliases instead of relative imports:

```typescript
// Bad
import { Button } from '../../../components/ui/Button';

// Good
import { Button } from '@components/ui/Button';
```

Available aliases:
- `@/*` → root
- `@components/*` → components/
- `@hooks/*` → hooks/
- `@store/*` → store/
- `@services/*` → services/
- `@types/*` → types/
- `@utils/*` → utils/
- `@theme/*` → theme/
