import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inspirationQueries } from '@/db/queries';
import type { NewInspiration } from '@/db';

export const inspirationQueryKeys = {
  all: ['inspirations'] as const,
  lists: () => [...inspirationQueryKeys.all, 'list'] as const,
  list: () => [...inspirationQueryKeys.lists()] as const,
  details: () => [...inspirationQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...inspirationQueryKeys.details(), id] as const,
};

export function useInspirations() {
  return useQuery({
    queryKey: inspirationQueryKeys.list(),
    queryFn: () => inspirationQueries.getAll(),
  });
}

export function useInspiration(id: number) {
  return useQuery({
    queryKey: inspirationQueryKeys.detail(id),
    queryFn: () => inspirationQueries.getById(id),
    enabled: !!id,
  });
}

export function useCreateInspiration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewInspiration) => inspirationQueries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspirationQueryKeys.lists() });
    },
  });
}

export function useDeleteInspiration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inspirationQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspirationQueryKeys.lists() });
    },
  });
}
