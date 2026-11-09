import { create } from 'zustand';

/**
 * Ephemeral presentation state — which floating surfaces are open, and a
 * counter the search form watches to focus/highlight the region field.
 * Never persisted; carries no domain data.
 */
interface UiState {
  sourcesOpen: boolean;
  settingsOpen: boolean;
  aboutOpen: boolean;
  shortcutsOpen: boolean;
  /** Increments each time the nav asks the form to reveal the region field. */
  regionFocusTick: number;
  openSources: () => void;
  closeSources: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openAbout: () => void;
  closeAbout: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  requestRegionFocus: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sourcesOpen: false,
  settingsOpen: false,
  aboutOpen: false,
  shortcutsOpen: false,
  regionFocusTick: 0,
  openSources: () => set({ sourcesOpen: true }),
  closeSources: () => set({ sourcesOpen: false }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openAbout: () => set({ aboutOpen: true }),
  closeAbout: () => set({ aboutOpen: false }),
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false }),
  requestRegionFocus: () => set((s) => ({ regionFocusTick: s.regionFocusTick + 1 })),
}));
