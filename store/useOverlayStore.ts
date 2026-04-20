import { create } from 'zustand';

export type OverlayType = 'record' | 'camera' | 'text' | 'attachment' | 'settings' | null;

interface OverlayState {
  activeOverlay: OverlayType;
  openOverlay: (type: OverlayType) => void;
  closeOverlay: () => void;
}

export const useOverlayStore = create<OverlayState>()((set) => ({
  activeOverlay: null,
  openOverlay: (type) => set({ activeOverlay: type }),
  closeOverlay: () => set({ activeOverlay: null }),
}));
