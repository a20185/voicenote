# Hook Guidelines

> How hooks are used in this project.

---

## Overview

This project uses custom hooks to encapsulate reusable stateful logic. Data fetching is handled by **TanStack Query (React Query)** for server state, while custom hooks manage local stateful logic like audio recording.

---

## Custom Hook Patterns

### Structure

```typescript
// hooks/useAudioRecorder.ts
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  // Internal logic
  const startRecording = useCallback(async () => {
    // Implementation
  }, []);

  const stopRecording = useCallback(async () => {
    // Implementation
  }, []);

  // Return public API
  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
  };
}
```

### Return Value

- Return an object with named properties (not array)
- Include status flags (`isLoading`, `isRecording`, etc.)
- Include actions (`start`, `stop`, `reset`, etc.)

---

## Data Fetching

### React Query Setup

Query keys and hooks are defined together:

```typescript
// services/api/queries.ts
export const queryKeys = {
  notes: ['notes'] as const,
  note: (id: number) => ['notes', id] as const,
};

export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes,
    queryFn: async () => {
      const response = await apiClient.get<NotesResponse>(API_ENDPOINTS.notes.list);
      return response.data;
    },
  });
}

export function useNote(id: number) {
  return useQuery({
    queryKey: queryKeys.note(id),
    queryFn: async () => {
      const response = await apiClient.get<NoteResponse>(API_ENDPOINTS.notes.detail(id));
      return response.data;
    },
    enabled: id > 0, // Conditional fetching
  });
}
```

### Mutations

```typescript
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNoteInput) => {
      const response = await apiClient.post(API_ENDPOINTS.notes.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Custom hook | `use<Feature>` | `useAudioRecorder` |
| Query hook | `use<Resource>` | `useNotes`, `useNote` |
| Mutation hook | `use<Action><Resource>` | `useCreateNote`, `useUpdateNote` |
| Query keys | `<resource>` or `<resource>(params)` | `notes`, `note(id)` |

---

## Common Mistakes

1. **Not using React Query for server state**
   - Use `useQuery` and `useMutation` instead of `useEffect` + `fetch`

2. **Stale query keys**
   - Use the exported `queryKeys` object, not inline strings

3. **Missing `enabled` condition**
   - Add `enabled: condition` for queries that depend on parameters

4. **Not invalidating on mutation**
   - Call `queryClient.invalidateQueries()` in `onSuccess`

5. **Putting everything in one hook**
   - Split into separate hooks for different concerns
