# State Management

> How state is managed in this project.

---

## Overview

This project uses a layered state management approach:

| State Type | Solution | Location |
|------------|----------|----------|
| **Server State** | TanStack Query | `services/api/queries.ts` |
| **Global UI State** | Zustand | `store/*.ts` |
| **Local State** | React useState | Component level |
| **URL State** | Expo Router params | Screen components |

---

## State Categories

### Server State (TanStack Query)

All API data is managed by React Query:

```typescript
// Reading
const { data, isLoading, error } = useNotes();

// Mutating
const createNote = useCreateNote();
createNote.mutate({ title: 'New Note' });
```

**Do not** store server data in Zustand or local state.

### Global UI State (Zustand)

For UI state that spans multiple screens:

```typescript
// store/useSettingsStore.ts
interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
}

interface SettingsActions {
  setTheme: (theme: SettingsState['theme']) => void;
  toggleAutoSave: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      theme: 'system',
      autoSave: true,
      setTheme: (theme) => set({ theme }),
      toggleAutoSave: () => set((s) => ({ autoSave: !s.autoSave })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Local State

For component-local state:

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

---

## When to Use Global State

Use Zustand for:

1. **User preferences** (theme, settings)
2. **Recording state** (is recording, current duration)
3. **UI state** (modals, sheets open/closed)
4. **Cross-screen state** (selected item, filter state)

Do NOT use global state for:

1. **API data** - Use React Query
2. **Form state** - Keep local unless shared
3. **One-off flags** - Keep local

---

## Server State

### Query Client Configuration

```typescript
// app/_layout.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});
```

### Cache Invalidation

After mutations, invalidate relevant queries:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.notes });
};
```

---

## Common Mistakes

1. **Storing API data in Zustand**
   - Use React Query instead

2. **Not persisting user preferences**
   - Use `persist()` middleware for settings

3. **Over-globalizing state**
   - Start local, promote to global when needed

4. **Mutating state directly**
   - Always use `set()` in Zustand

5. **Not invalidating cache**
   - Call `invalidateQueries()` after mutations
