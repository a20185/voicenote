import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryQueries } from '@/db/queries';
import { noteQueryKeys } from './useNotes';
import type { NewCategory } from '@/db';

export const categoryQueryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryQueryKeys.all, 'list'] as const,
  list: () => [...categoryQueryKeys.lists()] as const,
  details: () => [...categoryQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryQueryKeys.details(), id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryQueryKeys.list(),
    queryFn: () => categoryQueries.getAll(),
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryQueryKeys.detail(id),
    queryFn: () => categoryQueries.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewCategory) => categoryQueries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<NewCategory, 'createdAt'>> }) =>
      categoryQueries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => categoryQueries.reorder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() });
    },
  });
}

export function useAssignNotesToCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, noteIds }: { categoryId: number; noteIds: number[] }) =>
      categoryQueries.assignNotesToCategory(noteIds, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() });
    },
  });
}

export function useRemoveNotesFromCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, noteIds }: { categoryId: number; noteIds: number[] }) =>
      categoryQueries.removeNotesFromCategory(noteIds, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() });
    },
  });
}
