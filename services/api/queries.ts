import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

// Query keys
export const queryKeys = {
  notes: ['notes'] as const,
  note: (id: number) => ['notes', id] as const,
  recordings: ['recordings'] as const,
  recording: (id: number) => ['recordings', id] as const,
  noteRecordings: (noteId: number) => ['notes', noteId, 'recordings'] as const,
  media: ['media'] as const,
  medium: (id: number) => ['media', id] as const,
  noteMedia: (noteId: number) => ['notes', noteId, 'media'] as const,
  user: ['user'] as const,
  syncStatus: ['sync', 'status'] as const,
};

// Note queries
export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes,
    queryFn: () => apiClient.get(API_ENDPOINTS.notes.list),
  });
}

export function useNote(id: number) {
  return useQuery({
    queryKey: queryKeys.note(id),
    queryFn: () => apiClient.get(API_ENDPOINTS.notes.detail(id)),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content?: string }) =>
      apiClient.post(API_ENDPOINTS.notes.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; content?: string } }) =>
      apiClient.patch(API_ENDPOINTS.notes.update(id), data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
      queryClient.invalidateQueries({ queryKey: queryKeys.note(id) });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(API_ENDPOINTS.notes.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });
}

// Recording queries
export function useRecordings() {
  return useQuery({
    queryKey: queryKeys.recordings,
    queryFn: () => apiClient.get(API_ENDPOINTS.recordings.list),
  });
}

export function useNoteRecordings(noteId: number) {
  return useQuery({
    queryKey: queryKeys.noteRecordings(noteId),
    queryFn: () => apiClient.get(API_ENDPOINTS.recordings.byNote(noteId)),
    enabled: !!noteId,
  });
}

// Media queries
export function useNoteMedia(noteId: number) {
  return useQuery({
    queryKey: queryKeys.noteMedia(noteId),
    queryFn: () => apiClient.get(API_ENDPOINTS.media.byNote(noteId)),
    enabled: !!noteId,
  });
}

// Sync queries
export function useSyncStatus() {
  return useQuery({
    queryKey: queryKeys.syncStatus,
    queryFn: () => apiClient.get(API_ENDPOINTS.sync.status),
  });
}
