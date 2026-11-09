import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../storage/storage';

export type Theme = 'dark' | 'light';
export type Lang = 'en' | 'fr' | 'ar';

interface PrefsState {
  theme: Theme;
  lang: Lang;
  onboarded: boolean;
  /** The one-time "check source domains" banner has been dismissed. */
  hintDismissed: boolean;
  /** Home page: the "More filters" panel is expanded (remembered across visits). */
  moreFiltersOpen: boolean;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  setOnboarded: (done: boolean) => void;
  setHintDismissed: (done: boolean) => void;
  setMoreFiltersOpen: (open: boolean) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'light',
      lang: 'en',
      onboarded: false,
      hintDismissed: false,
      moreFiltersOpen: false,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setHintDismissed: (hintDismissed) => set({ hintDismissed }),
      setMoreFiltersOpen: (moreFiltersOpen) => set({ moreFiltersOpen }),
    }),
    {
      name: 'siftly.prefs',
      version: 1,
      storage: createJSONStorage(() => appStorage),
    },
  ),
);
