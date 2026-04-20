# VoiceNote

React Native/Expo mobile app for voice recording and note-taking with offline-first architecture.

## Development Commands

```bash
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run web         # Run in web browser
npm run lint        # ESLint check
npm run typecheck   # TypeScript check
npm run db:generate # Generate Drizzle migrations
npm run db:push     # Push schema changes to database
```

## Architecture

### Provider Stack (innermost to outermost)

```
SafeAreaProvider → QueryClientProvider → TamaguiProvider → Theme → Stack
```

See `app/_layout.tsx` for the root layout.

### Navigation

File-based routing with Expo Router. Tab routes are in `app/(tabs)/`:
- `index.tsx` - Home
- `record.tsx` - Voice recording
- `notes.tsx` - Notes list
- `settings.tsx` - App settings

### State Management

| Type | Solution | Location |
|------|----------|----------|
| Global UI state | Zustand with persist() middleware | `store/*.ts` |
| Server state | TanStack Query | `services/api/queries.ts` |
| Local state | useState/useReducer | Component level |

### Database

Drizzle ORM + expo-sqlite for offline-first storage with sync queue. Types are inferred from schema:

```typescript
import type { Note, NewNote } from '@db';
// Note = typeof notes.$inferSelect
// NewNote = typeof notes.$inferInsert
```

### API Layer

Axios client with React Query hooks in `services/api/`:

```typescript
// Query keys pattern for cache management
export const queryKeys = {
  notes: ['notes'] as const,
  note: (id: number) => ['notes', id] as const,
};

// Hook pattern
export function useNote(id: number) {
  return useQuery({
    queryKey: queryKeys.note(id),
    queryFn: () => apiClient.get(API_ENDPOINTS.notes.detail(id)),
    enabled: !!id,
  });
}
```

## Path Aliases

Defined in `tsconfig.json`:

```typescript
@components/*  → components/*
@hooks/*       → hooks/*
@store/*       → store/*
@services/*    → services/*
@db/*          → db/*
@theme/*       → theme/*
@types/*       → types/*
@utils/*       → utils/*
@/*            → ./*  (root)
```

Each directory has an `index.ts` barrel file for clean imports:

```typescript
import { Button, Card } from '@components';
import { useSettingsStore } from '@store';
```

## Key Patterns

### Tamagui Component Props

Use `GetProps<typeof Component>` for derived prop types:

```typescript
import { GetProps, XStack } from 'tamagui';
type XStackProps = GetProps<typeof XStack>;
```

### Theme Tokens

Use theme tokens for dark/light mode support:

```typescript
// Correct - uses theme tokens
backgroundColor="$background"
color="$color"

// Avoid - hardcoded values
backgroundColor="#ffffff"
```

### Zustand with Persistence

```typescript
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      // state and actions
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

## Trellis Workflow

This project uses a structured AI-assisted development workflow. Key references:

- **Workflow guide**: `.trellis/workflow.md`
- **Frontend guidelines**: `.trellis/spec/frontend/index.md`
- **Thinking guides**: `.trellis/spec/guides/`

**Before coding**: Read relevant guidelines in `.trellis/spec/`.

## Project Structure

```
app/           # Expo Router routes (file-based navigation)
components/    # Reusable UI components
hooks/         # Custom React hooks
store/         # Zustand stores
services/      # API client and queries
db/            # Drizzle schema and queries
theme/         # Tamagui configuration, tokens
types/         # TypeScript type definitions
utils/         # Utility functions
```
