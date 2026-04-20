import { create } from 'zustand';

interface NoteSelectionState {
  selectedIds: Set<number>;
}

interface NoteSelectionActions {
  toggleSelection: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  isSelected: (id: number) => boolean;
  getSelectionCount: () => number;
}

export const useNoteSelectionStore = create<NoteSelectionState & NoteSelectionActions>()((set, get) => ({
  selectedIds: new Set<number>(),

  toggleSelection: (id) =>
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return { selectedIds: newSelectedIds };
    }),

  selectAll: (ids) =>
    set({
      selectedIds: new Set(ids),
    }),

  clearSelection: () =>
    set({
      selectedIds: new Set<number>(),
    }),

  isSelected: (id) => {
    const state = get();
    return state.selectedIds.has(id);
  },

  getSelectionCount: () => {
    const state = get();
    return state.selectedIds.size;
  },
}));
