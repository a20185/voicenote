import { create } from 'zustand';
import type { CategoryFilter } from '@/types/category';

interface CategoryStoreState {
  filter: CategoryFilter;
  expandedIds: Set<number | string>;
  managementVisible: boolean;
  assignmentVisible: boolean;
}

interface CategoryStoreActions {
  setFilter: (filter: CategoryFilter) => void;
  toggleExpanded: (id: number | string) => void;
  expandAll: (ids: (number | string)[]) => void;
  collapseAll: () => void;
  openManagement: () => void;
  closeManagement: () => void;
  openAssignment: () => void;
  closeAssignment: () => void;
  reset: () => void;
}

export const useCategoryStore = create<CategoryStoreState & CategoryStoreActions>()((set) => ({
  filter: { type: 'all' },
  expandedIds: new Set<number | string>(),
  managementVisible: false,
  assignmentVisible: false,

  setFilter: (filter) => set({ filter }),

  toggleExpanded: (id) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedIds: next };
    }),

  expandAll: (ids) => set({ expandedIds: new Set(ids) }),

  collapseAll: () => set({ expandedIds: new Set() }),

  openManagement: () => set({ managementVisible: true }),
  closeManagement: () => set({ managementVisible: false }),
  openAssignment: () => set({ assignmentVisible: true }),
  closeAssignment: () => set({ assignmentVisible: false }),

  reset: () =>
    set({
      filter: { type: 'all' },
      expandedIds: new Set(),
      managementVisible: false,
      assignmentVisible: false,
    }),
}));
