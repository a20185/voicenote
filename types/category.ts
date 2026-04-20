import type { Note, Category } from '@/db';

export interface CategorizedGroup {
  category: Category | null; // null = uncategorized
  notes: Note[];
}

export type CategoryFilter =
  | { type: 'all' }
  | { type: 'uncategorized' }
  | { type: 'category'; categoryId: number };

export const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];
