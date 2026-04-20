import { create } from 'zustand';

interface SearchState {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
