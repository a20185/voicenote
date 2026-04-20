# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

This project enforces code quality through TypeScript strict mode and ESLint. All code must pass type checking and linting before commit.

---

## Forbidden Patterns

### 1. No `any` Type

```typescript
// Forbidden
function process(data: any) { }

// Use
function process(data: unknown) { }
```

### 2. No Non-Null Assertions

```typescript
// Forbidden
const id = user.id!;

// Use
const id = user.id ?? 0;
```

### 3. No Type Assertions Without Validation

```typescript
// Forbidden
const note = data as Note;

// Use
const note = isNote(data) ? data : undefined;
```

### 4. No Unused Variables

```typescript
// Forbidden
const [value, setValue] = useState(); // setValue unused

// Use
const [value] = useState();
```

### 5. No `useEffect` for Data Fetching

```typescript
// Forbidden
useEffect(() => {
  fetch('/api/notes').then(setNotes);
}, []);

// Use React Query
const { data: notes } = useNotes();
```

---

## Required Patterns

### 1. TypeScript Strict Mode

All code must compile under strict mode:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 2. Named Exports

Prefer named exports over default exports:

```typescript
// Preferred
export function useNotes() { }
export const Button = styled(TamaguiButton, { });

// Avoid
export default function Notes() { }
```

### 3. Path Aliases

Use path aliases for imports:

```typescript
// Required
import { Button } from '@components/ui/Button';

// Forbidden
import { Button } from '../../../components/ui/Button';
```

### 4. Barrel Files

Use index.ts for clean exports:

```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
```

---

## Testing Requirements

Testing infrastructure is not yet implemented. When adding tests:

1. Place test files next to source: `Button.test.tsx`
2. Use Jest and React Native Testing Library
3. Test user interactions, not implementation details

---

## Code Review Checklist

Before submitting code for review, verify:

- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] No `any` types used
- [ ] No unused variables or imports
- [ ] Path aliases used (not relative imports)
- [ ] Components use `GetProps` for types
- [ ] Server state uses React Query (not local state)
- [ ] Global state uses Zustand with proper typing
- [ ] Theme tokens used for colors (`$background`, `$color`)
- [ ] Dark mode supported via `useColorScheme()`

---

## Linting Rules

Project uses ESLint with React and React Native rules:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-native/all"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react/react-in-jsx-scope": "off"
  }
}
```

---

## Pre-Commit

Run these before committing:

```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Fix auto-fixable issues
npx eslint . --fix
```
