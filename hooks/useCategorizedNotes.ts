import { useMemo } from 'react';
import type { Note, Category } from '@/db';
import type { CategorizedGroup } from '@/types/category';

function parseCategoryIds(note: Note): number[] {
  if (!note.categoryIds) return [];
  try {
    const parsed = JSON.parse(note.categoryIds);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCategorizedNotes(notes: Note[], categories: Category[]): CategorizedGroup[] {
  return useMemo(() => {
    const groups: CategorizedGroup[] = categories.map((cat) => ({
      category: cat,
      notes: [],
    }));

    const uncategorizedNotes: Note[] = [];

    for (const note of notes) {
      const catIds = parseCategoryIds(note);
      if (catIds.length === 0) {
        uncategorizedNotes.push(note);
      } else {
        for (const catId of catIds) {
          const group = groups.find((g) => g.category?.id === catId);
          if (group) group.notes.push(note);
        }
      }
    }

    // Add uncategorized group at the end if there are uncategorized notes
    if (uncategorizedNotes.length > 0) {
      groups.push({ category: null, notes: uncategorizedNotes });
    }

    return groups;
  }, [notes, categories]);
}

export function useNoteCategoryIds(note: Note | undefined): number[] {
  return useMemo(() => {
    if (!note) return [];
    return parseCategoryIds(note);
  }, [note?.categoryIds]);
}

export type { CategorizedGroup };
