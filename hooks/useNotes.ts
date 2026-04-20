import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteQueries } from '@/db/queries';
import type { Note, NewNote, NoteStatus } from '@/db';
import i18n from 'i18next';

// Query keys for cache management
export const noteQueryKeys = {
  all: ['notes'] as const,
  lists: () => [...noteQueryKeys.all, 'list'] as const,
  list: (status?: NoteStatus) => [...noteQueryKeys.lists(), { status }] as const,
  details: () => [...noteQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...noteQueryKeys.details(), id] as const,
};

/**
 * Hook to fetch notes, optionally filtered by status
 * @param status - Filter notes by status: 'active', 'archived', or 'snoozed'
 */
export function useNotes(status?: NoteStatus) {
  return useQuery({
    queryKey: noteQueryKeys.list(status),
    queryFn: () => {
      if (status) {
        return noteQueries.getByStatus(status);
      }
      return noteQueries.getAll();
    },
  });
}

/**
 * Hook to fetch a single note by ID
 * @param id - Note ID
 */
export function useNote(id: number) {
  return useQuery({
    queryKey: noteQueryKeys.detail(id),
    queryFn: () => noteQueries.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewNote) => noteQueries.create(data),
    onSuccess: () => {
      // Invalidate all note lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing note with optimistic updates
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<NewNote, 'createdAt'>> }) =>
      noteQueries.update(id, data),

    // Optimistic update: immediately update the cache before server responds
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: noteQueryKeys.detail(id) });

      // Snapshot the previous value
      const previousNote = queryClient.getQueryData<Note>(noteQueryKeys.detail(id));

      // Optimistically update to the new value
      if (previousNote) {
        queryClient.setQueryData<Note>(noteQueryKeys.detail(id), {
          ...previousNote,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Return context with the previous value
      return { previousNote };
    },

    // On error, rollback to previous value
    onError: (err, { id }, context) => {
      if (context?.previousNote) {
        queryClient.setQueryData(noteQueryKeys.detail(id), context.previousNote);
      }
    },

    // Always refetch after error or success to sync with database
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
    },
  });
}

/**
 * Hook to delete a note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => noteQueries.delete(id),
    onSuccess: () => {
      // Invalidate all note lists
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
    },
  });
}

/**
 * Hook to archive multiple notes at once
 */
export function useArchiveNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteIds: number[]) => {
      // Update each note's status to 'archived'
      const promises = noteIds.map((id) =>
        noteQueries.update(id, { status: 'archived' })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate all note lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
    },
  });
}

/**
 * Hook to merge multiple notes into one
 * @description Takes an array of note IDs, merges their content, and deletes the source notes
 */
export function useMergeNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteIds,
      mergedTitle,
      mergedContent
    }: {
      noteIds: number[];
      mergedTitle?: string;
      mergedContent?: string;
    }) => {
      // Fetch all notes to merge
      const notesToMerge = await Promise.all(
        noteIds.map((id) => noteQueries.getById(id))
      );

      // Filter out any undefined results
      const validNotes = notesToMerge.filter((note): note is Note => note !== undefined);

      if (validNotes.length === 0) {
        throw new Error(i18n.t('errors:noValidNotesToMerge'));
      }

      // Determine merged title and content
      const title = mergedTitle || validNotes[0].title;
      const content = mergedContent || validNotes
        .map((note) => note.content || '')
        .filter((c) => c.trim() !== '')
        .join('\n\n---\n\n');

      // Collect all tags from all notes (deduplicate)
      const allTags = validNotes
        .map((note) => {
          try {
            return note.tags ? JSON.parse(note.tags) : [];
          } catch {
            return [];
          }
        })
        .flat();
      const uniqueTags = [...new Set(allTags)];

      // Calculate total audio duration if any voice notes
      const totalAudioDuration = validNotes.reduce((sum, note) => {
        return sum + (note.audioDuration || 0);
      }, 0);

      // Create the merged note
      const now = new Date();
      const mergedNote = await noteQueries.create({
        title,
        content,
        type: validNotes[0].type,
        status: 'active',
        tags: uniqueTags.length > 0 ? JSON.stringify(uniqueTags) : undefined,
        audioDuration: totalAudioDuration > 0 ? totalAudioDuration : undefined,
        createdAt: now,
        updatedAt: now,
      });

      // Archive the source notes (preserve originals)
      await Promise.all(noteIds.map((id) => noteQueries.update(id, { status: 'archived' })));

      return mergedNote;
    },
    onSuccess: () => {
      // Invalidate all note lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
    },
  });
}
