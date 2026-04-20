import { useNoteSelectionStore } from '@store/useNoteSelectionStore';

export function useNoteSelection() {
  const selectedIds = useNoteSelectionStore((state) => Array.from(state.selectedIds));
  const toggleSelection = useNoteSelectionStore((state) => state.toggleSelection);
  const selectAll = useNoteSelectionStore((state) => state.selectAll);
  const clearSelection = useNoteSelectionStore((state) => state.clearSelection);
  const isSelected = useNoteSelectionStore((state) => state.isSelected);
  const selectionCount = useNoteSelectionStore((state) => state.getSelectionCount());

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectionCount,
  };
}
