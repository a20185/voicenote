# Frontend Development Guidelines

> React Native / Expo project with Tamagui UI library

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native with Expo |
| Navigation | Expo Router (file-based) |
| UI Library | Tamagui |
| State Management | Zustand (local), TanStack Query (server) |
| Database | SQLite with Drizzle ORM |
| HTTP Client | Axios |
| Language | TypeScript (strict mode) |

---

## Guidelines Index

| Guide | Description |
|-------|-------------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns |
| [State Management](./state-management.md) | Local state, global state, server state |
| [Type Safety](./type-safety.md) | Type patterns, validation |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, linting, testing |

---

## Quick Reference

### Import Aliases

```typescript
// Use these path aliases for clean imports
import { Button } from '@components/ui';
import { useAudioRecorder } from '@hooks';
import { colors } from '@theme/colors';
import { noteQueries } from '@db/queries';
import { useSettingsStore } from '@store';
```

### Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS
npm run android    # Run on Android
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript check
npm run db:generate # Generate Drizzle migrations
```

---

## Key Principles

1. **Use Tamagui components** - Prefer Tamagui primitives (XStack, YStack, Text, etc.)
2. **File-based routing** - Routes are defined by file structure in `app/`
3. **Separate state layers** - Zustand for UI state, React Query for server state
4. **Export from index** - Always re-export from barrel files for clean imports
5. **Type everything** - TypeScript strict mode is enabled

---

**Language**: All documentation is written in **English**.
